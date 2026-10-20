using System.Text.Json;
using Dastik.Api.Infrastructure.Persistence;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Dastik.Api.Features.Inventario.ListarProductos;

public record ListarProductosQuery : IRequest<List<ProductoCatalogoDto>>;

public record VarianteCatalogoDto(
    int Id,
    string Talle,
    string Color,
    string CodigoBarras,
    int StockFisico
);

public record ProductoCatalogoDto(
    int Id,
    string Nombre,
    string Descripcion,
    string Marca,
    string Categoria,
    string UnidadNegocio,
    string ImagenUrl,
    decimal PrecioVenta,
    List<VarianteCatalogoDto> Variantes,
    decimal CostoBase = 0,
    decimal MarkupAplicado = 0,
    List<string>? Imagenes = null
);

public class ListarProductosQueryHandler : IRequestHandler<ListarProductosQuery, List<ProductoCatalogoDto>>
{
    private readonly AppDbContext _context;

    public ListarProductosQueryHandler(AppDbContext context)
    {
        _context = context;
    }

    public async Task<List<ProductoCatalogoDto>> Handle(ListarProductosQuery request, CancellationToken cancellationToken)
    {
        var rows = await _context.Productos
            .AsNoTracking()
            .Where(p => p.Activo)
            .Include(p => p.UnidadNegocio)
            .Include(p => p.Marca)
            .Include(p => p.Categoria)
            .Include(p => p.Variantes)
            .Select(p => new
            {
                p.Id,
                p.Nombre,
                p.Descripcion,
                Marca = p.Marca.Nombre,
                Categoria = p.Categoria.Nombre,
                UnidadNegocio = p.UnidadNegocio.Nombre,
                p.ImagenUrl,
                p.ImagenesJson,
                p.PrecioVenta,
                Variantes = p.Variantes.Select(v => new VarianteCatalogoDto(
                    v.Id,
                    v.Talle,
                    v.Color,
                    v.CodigoBarras,
                    v.StockFisico
                )).ToList(),
                p.CostoBase,
                p.MarkupAplicado
            })
            .ToListAsync(cancellationToken);

        return rows.Select(p => new ProductoCatalogoDto(
            p.Id,
            p.Nombre,
            p.Descripcion,
            p.Marca,
            p.Categoria,
            p.UnidadNegocio,
            p.ImagenUrl,
            p.PrecioVenta,
            p.Variantes,
            p.CostoBase,
            p.MarkupAplicado,
            ResolverGaleriaImagenes(p.ImagenesJson, p.ImagenUrl)
        )).ToList();
    }

    private static List<string> ResolverGaleriaImagenes(string? imagenesJson, string? imagenUrl)
    {
        if (!string.IsNullOrWhiteSpace(imagenesJson) && imagenesJson != "[]")
        {
            try
            {
                var parsed = JsonSerializer.Deserialize<List<string>>(imagenesJson);
                if (parsed is { Count: > 0 })
                {
                    return parsed.Where(u => !string.IsNullOrWhiteSpace(u)).ToList();
                }
            }
            catch
            {
                // Fallback a ImagenUrl individual si el JSON es inválido
            }
        }

        if (!string.IsNullOrWhiteSpace(imagenUrl))
        {
            return [imagenUrl];
        }

        return [];
    }
}
