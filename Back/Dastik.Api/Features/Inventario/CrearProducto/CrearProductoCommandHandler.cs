using System.Text.Json;
using Dastik.Api.Domain.Entities;
using Dastik.Api.Domain.Services;
using Dastik.Api.Infrastructure.Persistence;
using MediatR;

namespace Dastik.Api.Features.Inventario.CrearProducto;

public class CrearProductoCommandHandler : IRequestHandler<CrearProductoCommand, CrearProductoResult>
{
    private readonly AppDbContext _context;
    private readonly GeneradorEan13 _generadorEan13;

    public CrearProductoCommandHandler(AppDbContext context, GeneradorEan13 generadorEan13)
    {
        _context = context;
        _generadorEan13 = generadorEan13;
    }

    public async Task<CrearProductoResult> Handle(CrearProductoCommand request, CancellationToken cancellationToken)
    {
        var imagenesIniciales = !string.IsNullOrWhiteSpace(request.ImagenUrl)
            ? new List<string> { request.ImagenUrl.Trim() }
            : new List<string>();

        var producto = new Producto
        {
            UnidadNegocioId = request.UnidadNegocioId,
            CategoriaId = request.CategoriaId,
            MarcaId = request.MarcaId,
            ProveedorId = request.ProveedorId,
            Nombre = request.Nombre,
            Descripcion = request.Descripcion,
            ImagenUrl = request.ImagenUrl,
            ImagenesJson = JsonSerializer.Serialize(imagenesIniciales),
            CostoBase = request.CostoBase,
            MarkupAplicado = request.MarkupAplicado,
            PrecioVenta = request.PrecioVenta,
            Activo = true
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
                StockFisico = vDto.StockFisico
            };

            producto.Variantes.Add(variante);
        }

        _context.Productos.Add(producto);
        await _context.SaveChangesAsync(cancellationToken);

        return new CrearProductoResult(producto.Id, producto.Nombre, producto.Variantes.Count);
    }
}
