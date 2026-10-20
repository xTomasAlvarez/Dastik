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

namespace Dastik.Api.Features.Inventario.EditarProducto;

public class EditarProductoCommandHandler : IRequestHandler<EditarProductoCommand, EditarProductoResult>
{
    private readonly AppDbContext _context;
    private readonly GeneradorEan13 _generadorEan13;
    private readonly ITiendanubeApiClient _tiendanubeApiClient;
    private readonly ILogger<EditarProductoCommandHandler> _logger;

    public EditarProductoCommandHandler(
        AppDbContext context,
        GeneradorEan13 generadorEan13,
        ITiendanubeApiClient? tiendanubeApiClient = null,
        ILogger<EditarProductoCommandHandler>? logger = null)
    {
        _context = context;
        _generadorEan13 = generadorEan13;
        _tiendanubeApiClient = tiendanubeApiClient ?? new TiendanubeApiClient(new HttpClient(), NullLogger<TiendanubeApiClient>.Instance);
        _logger = logger ?? NullLogger<EditarProductoCommandHandler>.Instance;
    }

    public async Task<EditarProductoResult> Handle(EditarProductoCommand request, CancellationToken cancellationToken)
    {
        var producto = await _context.Productos
            .Include(p => p.Variantes)
            .FirstOrDefaultAsync(p => p.Id == request.Id, cancellationToken);

        if (producto == null)
        {
            throw new KeyNotFoundException($"El producto con ID {request.Id} no existe.");
        }

        producto.UnidadNegocioId = request.UnidadNegocioId;
        producto.CategoriaId = request.CategoriaId;
        producto.MarcaId = request.MarcaId;
        producto.ProveedorId = request.ProveedorId;
        producto.Nombre = request.Nombre;
        producto.Descripcion = request.Descripcion;
        producto.CostoBase = request.CostoBase;
        producto.MarkupAplicado = request.MarkupAplicado;
        producto.PrecioVenta = request.PrecioVenta;
        producto.VideoUrl = request.VideoUrl;
        producto.EsFisico = request.EsFisico;
        producto.SubcategoriasJson = request.Subcategorias != null ? JsonSerializer.Serialize(request.Subcategorias) : "[]";
        producto.DestacadosJson = request.Destacados != null ? JsonSerializer.Serialize(request.Destacados) : "[]";
        producto.TagsSeo = request.TagsSeo;
        producto.SeoTitulo = request.SeoTitulo;
        producto.SeoDescripcion = request.SeoDescripcion;

        var imagenesLista = request.Imagenes ?? (!string.IsNullOrWhiteSpace(request.ImagenUrl)
            ? new List<string> { request.ImagenUrl.Trim() }
            : new List<string>());

        producto.ImagenUrl = imagenesLista.FirstOrDefault() ?? request.ImagenUrl ?? string.Empty;
        producto.ImagenesJson = JsonSerializer.Serialize(imagenesLista);

        // Gestión de Variantes
        var idsEnRequest = request.Variantes
            .Where(v => v.Id.HasValue && v.Id.Value > 0)
            .Select(v => v.Id!.Value)
            .ToHashSet();

        var variantesAEliminar = producto.Variantes
            .Where(v => !idsEnRequest.Contains(v.Id))
            .ToList();

        foreach (var vElim in variantesAEliminar)
        {
            producto.Variantes.Remove(vElim);
        }

        foreach (var vDto in request.Variantes)
        {
            if (vDto.Id.HasValue && vDto.Id.Value > 0)
            {
                var vExistente = producto.Variantes.FirstOrDefault(v => v.Id == vDto.Id.Value);
                if (vExistente != null)
                {
                    vExistente.Talle = vDto.Talle;
                    vExistente.Color = vDto.Color;
                    vExistente.StockFisico = vDto.StockFisico;
                    vExistente.PrecioPromocional = vDto.PrecioPromocional;
                    vExistente.PesoKg = vDto.PesoKg;
                    vExistente.PrecioOverride = vDto.PrecioOverride;
                    if (!string.IsNullOrWhiteSpace(vDto.TiendanubeVariantId))
                    {
                        vExistente.TiendanubeVariantId = vDto.TiendanubeVariantId;
                    }
                    if (!string.IsNullOrWhiteSpace(vDto.CodigoBarras) && string.IsNullOrWhiteSpace(vExistente.CodigoBarras))
                    {
                        vExistente.CodigoBarras = vDto.CodigoBarras;
                    }
                }
            }
            else
            {
                bool esGenerado = string.IsNullOrWhiteSpace(vDto.CodigoBarras);
                string codigoBarras = esGenerado ? _generadorEan13.Generar() : vDto.CodigoBarras!;

                var nuevaVariante = new Variante
                {
                    ProductoId = producto.Id,
                    Talle = vDto.Talle,
                    Color = vDto.Color,
                    CodigoBarras = codigoBarras,
                    EsCodigoGenerado = esGenerado,
                    StockFisico = vDto.StockFisico,
                    PrecioPromocional = vDto.PrecioPromocional,
                    PesoKg = vDto.PesoKg,
                    PrecioOverride = vDto.PrecioOverride,
                    TiendanubeVariantId = vDto.TiendanubeVariantId
                };
                producto.Variantes.Add(nuevaVariante);
            }
        }

        // Sincronización Bidireccional hacia Tiendanube (si corresponde)
        bool sincronizadoTn = false;
        string? tnProdId = producto.TiendanubeProductId;

        if (request.SincronizarTiendanube)
        {
            var unidad = await _context.UnidadesNegocio
                .FirstOrDefaultAsync(u => u.Id == request.UnidadNegocioId, cancellationToken);

            if (unidad != null && (unidad.TieneTiendaNube || unidad.Nombre == UnidadNegocio.Dastik))
            {
                var marca = await _context.Marcas
                    .FirstOrDefaultAsync(m => m.Id == request.MarcaId, cancellationToken);

                var storeId = !string.IsNullOrWhiteSpace(unidad.TiendanubeStoreId)
                    ? unidad.TiendanubeStoreId.Trim()
                    : "sandbox-dastik";

                var token = !string.IsNullOrWhiteSpace(unidad.TiendanubeAccessToken)
                    ? unidad.TiendanubeAccessToken.Trim()
                    : "mock-token-dastik";

                var variantesPayload = producto.Variantes.Select(v => new TiendanubeVariantePayload(
                    TiendanubeVariantId: v.TiendanubeVariantId,
                    Talle: v.Talle,
                    Color: v.Color,
                    Barcode: v.CodigoBarras,
                    Precio: v.PrecioOverride ?? request.PrecioVenta,
                    PrecioPromocional: v.PrecioPromocional,
                    PesoKg: v.PesoKg,
                    Stock: v.StockFisico
                )).ToList();

                if (!string.IsNullOrWhiteSpace(producto.TiendanubeProductId))
                {
                    var putPayload = new TiendanubeActualizarProductoPayload(
                        Nombre: request.Nombre,
                        Descripcion: request.Descripcion,
                        Brand: marca?.Nombre,
                        Tags: request.TagsSeo,
                        VideoUrl: request.VideoUrl,
                        SeoTitulo: request.SeoTitulo,
                        SeoDescripcion: request.SeoDescripcion,
                        ImagenesUrls: imagenesLista,
                        Variantes: variantesPayload
                    );

                    var tnResult = await _tiendanubeApiClient.ActualizarProductoAsync(storeId, token, producto.TiendanubeProductId, putPayload, cancellationToken);
                    if (tnResult.IsSuccess && tnResult.Value != null)
                    {
                        sincronizadoTn = true;
                        tnProdId = tnResult.Value.TiendanubeProductId.ToString();
                        foreach (var tnVar in tnResult.Value.Variantes)
                        {
                            var match = producto.Variantes.FirstOrDefault(v => v.Talle == tnVar.Talle && v.Color == tnVar.Color)
                                ?? producto.Variantes.FirstOrDefault(v => v.CodigoBarras == tnVar.Barcode);
                            if (match != null && string.IsNullOrWhiteSpace(match.TiendanubeVariantId))
                            {
                                match.TiendanubeVariantId = tnVar.TiendanubeVariantId.ToString();
                            }
                        }
                    }
                    else
                    {
                        _logger.LogWarning("Fallo al actualizar producto '{Nombre}' en Tiendanube: {Error}", request.Nombre, tnResult.Error);
                    }
                }
                else
                {
                    var postPayload = new TiendanubeCrearProductoPayload(
                        Nombre: request.Nombre,
                        Descripcion: request.Descripcion,
                        Brand: marca?.Nombre,
                        Tags: request.TagsSeo,
                        VideoUrl: request.VideoUrl,
                        SeoTitulo: request.SeoTitulo,
                        SeoDescripcion: request.SeoDescripcion,
                        ImagenesUrls: imagenesLista,
                        Variantes: variantesPayload
                    );

                    var tnResult = await _tiendanubeApiClient.CrearProductoAsync(storeId, token, postPayload, cancellationToken);
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
                }
            }
        }

        await _context.SaveChangesAsync(cancellationToken);

        return new EditarProductoResult(producto.Id, producto.Nombre, producto.Variantes.Count, tnProdId, sincronizadoTn);
    }
}
