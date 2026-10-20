using System.Text.Json;
using Dastik.Api.Domain.Entities;
using Dastik.Api.Domain.Integrations.Tiendanube;
using Dastik.Api.Domain.Services;
using Dastik.Api.Infrastructure.Integrations.Tiendanube;
using Dastik.Api.Infrastructure.Persistence;
using MediatR;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Logging.Abstractions;

namespace Dastik.Api.Features.Inventario.CrearProducto;

public class CrearProductoCommandHandler : IRequestHandler<CrearProductoCommand, CrearProductoResult>
{
    private readonly AppDbContext _context;
    private readonly GeneradorEan13 _generadorEan13;
    private readonly ITiendanubeApiClient _tiendanubeApiClient;
    private readonly ILogger<CrearProductoCommandHandler> _logger;

    public CrearProductoCommandHandler(
        AppDbContext context,
        GeneradorEan13 generadorEan13,
        ITiendanubeApiClient? tiendanubeApiClient = null,
        ILogger<CrearProductoCommandHandler>? logger = null)
    {
        _context = context;
        _generadorEan13 = generadorEan13;
        _tiendanubeApiClient = tiendanubeApiClient ?? new TiendanubeApiClient(new HttpClient(), NullLogger<TiendanubeApiClient>.Instance);
        _logger = logger ?? NullLogger<CrearProductoCommandHandler>.Instance;
    }

    public async Task<CrearProductoResult> Handle(CrearProductoCommand request, CancellationToken cancellationToken)
    {
        var imagenesLista = request.Imagenes ?? (!string.IsNullOrWhiteSpace(request.ImagenUrl)
            ? new List<string> { request.ImagenUrl.Trim() }
            : new List<string>());

        var imagenPrincipal = imagenesLista.FirstOrDefault() ?? request.ImagenUrl ?? string.Empty;

        var producto = new Producto
        {
            UnidadNegocioId = request.UnidadNegocioId,
            CategoriaId = request.CategoriaId,
            MarcaId = request.MarcaId,
            ProveedorId = request.ProveedorId,
            Nombre = request.Nombre,
            Descripcion = request.Descripcion,
            ImagenUrl = imagenPrincipal,
            ImagenesJson = JsonSerializer.Serialize(imagenesLista),
            CostoBase = request.CostoBase,
            MarkupAplicado = request.MarkupAplicado,
            PrecioVenta = request.PrecioVenta,
            Activo = true,
            VideoUrl = request.VideoUrl,
            EsFisico = request.EsFisico,
            SubcategoriasJson = request.Subcategorias != null ? JsonSerializer.Serialize(request.Subcategorias) : "[]",
            DestacadosJson = request.Destacados != null ? JsonSerializer.Serialize(request.Destacados) : "[]",
            TagsSeo = request.TagsSeo,
            SeoTitulo = request.SeoTitulo,
            SeoDescripcion = request.SeoDescripcion
        };

        foreach (var vDto in request.Variantes)
        {
            bool esGenerado = string.IsNullOrWhiteSpace(vDto.CodigoBarras);
            string codigoBarras = esGenerado ? _generadorEan13.Generar() : vDto.CodigoBarras!;

            var variante = new Variante
            {
                Talle = vDto.Talle,
                Color = vDto.Color,
                CodigoBarras = codigoBarras,
                EsCodigoGenerado = esGenerado,
                StockFisico = vDto.StockFisico,
                PrecioPromocional = vDto.PrecioPromocional,
                PesoKg = vDto.PesoKg,
                PrecioOverride = vDto.PrecioOverride
            };

            producto.Variantes.Add(variante);
        }

        // Sincronización Bidireccional hacia Tiendanube (si corresponde)
        bool sincronizadoTn = false;
        string? tnProdId = null;

        if (request.SincronizarTiendanube)
        {
            var unidad = await _context.UnidadesNegocio
                .FirstOrDefaultAsync(u => u.Id == request.UnidadNegocioId, cancellationToken);

            if (unidad != null && (unidad.TieneTiendaNube || unidad.Nombre == UnidadNegocio.Dastik))
            {
                var marca = await _context.Marcas
                    .FirstOrDefaultAsync(m => m.Id == request.MarcaId, cancellationToken);

                var payload = new TiendanubeCrearProductoPayload(
                    Nombre: request.Nombre,
                    Descripcion: request.Descripcion,
                    Brand: marca?.Nombre,
                    Tags: request.TagsSeo,
                    VideoUrl: request.VideoUrl,
                    SeoTitulo: request.SeoTitulo,
                    SeoDescripcion: request.SeoDescripcion,
                    ImagenesUrls: imagenesLista,
                    Variantes: producto.Variantes.Select(v => new TiendanubeVariantePayload(
                        TiendanubeVariantId: null,
                        Talle: v.Talle,
                        Color: v.Color,
                        Barcode: v.CodigoBarras,
                        Precio: v.PrecioOverride ?? request.PrecioVenta,
                        PrecioPromocional: v.PrecioPromocional,
                        PesoKg: v.PesoKg,
                        Stock: v.StockFisico
                    )).ToList()
                );

                var storeId = !string.IsNullOrWhiteSpace(unidad.TiendanubeStoreId)
                    ? unidad.TiendanubeStoreId.Trim()
                    : "sandbox-dastik";

                var token = !string.IsNullOrWhiteSpace(unidad.TiendanubeAccessToken)
                    ? unidad.TiendanubeAccessToken.Trim()
                    : "mock-token-dastik";

                var tnResult = await _tiendanubeApiClient.CrearProductoAsync(storeId, token, payload, cancellationToken);
                if (tnResult.IsSuccess && tnResult.Value != null)
                {
                    sincronizadoTn = true;
                    tnProdId = tnResult.Value.TiendanubeProductId.ToString();
                    producto.TiendanubeProductId = tnProdId;

                    foreach (var tnVar in tnResult.Value.Variantes)
                    {
                        var match = producto.Variantes.FirstOrDefault(v => v.Talle == tnVar.Talle && v.Color == tnVar.Color)
                            ?? producto.Variantes.FirstOrDefault(v => v.CodigoBarras == tnVar.Barcode);
                        if (match != null)
                        {
                            match.TiendanubeVariantId = tnVar.TiendanubeVariantId.ToString();
                        }
                    }
                }
                else
                {
                    _logger.LogWarning("Fallo al sincronizar producto '{Nombre}' con Tiendanube: {Error}", request.Nombre, tnResult.Error);
                }
            }
        }

        _context.Productos.Add(producto);
        await _context.SaveChangesAsync(cancellationToken);

        return new CrearProductoResult(producto.Id, producto.Nombre, producto.Variantes.Count, tnProdId, sincronizadoTn);
    }
}
