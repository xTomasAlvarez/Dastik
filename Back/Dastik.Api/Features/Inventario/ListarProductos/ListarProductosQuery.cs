using System.Text.Json;
using System.Text.RegularExpressions;
using Dastik.Api.Domain.Services;
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
    List<string>? Imagenes = null,
    string? TiendanubeProductId = null
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
                p.MarkupAplicado,
                p.TiendanubeProductId
            })
            .ToListAsync(cancellationToken);

        var dtos = rows.Select(p =>
        {
            var galeria = ResolverGaleriaImagenes(p.ImagenesJson, p.ImagenUrl);
            var imgPrincipal = galeria.FirstOrDefault() ?? CatalogClassifierService.NormalizarUrlImagenAltaRes(p.ImagenUrl);

            return new ProductoCatalogoDto(
                p.Id,
                p.Nombre,
                p.Descripcion,
                p.Marca,
                p.Categoria,
                p.UnidadNegocio,
                imgPrincipal,
                p.PrecioVenta,
                p.Variantes,
                p.CostoBase,
                p.MarkupAplicado,
                galeria,
                p.TiendanubeProductId
            );
        }).ToList();

        // Ordenamiento inteligente por defecto:
        // 1° Productos con Stock Disponible (StockTotal > 0) primero; agotados (StockTotal == 0) al final.
        // 2° Dentro de los disponibles, los más nuevos primero: Drop XX descendente -> TiendanubeProductId numérico descendente -> Id descendente.
        return dtos
            .OrderByDescending(p => p.Variantes.Sum(v => v.StockFisico) > 0)
            .ThenByDescending(p => ExtraerNumeroDrop(p.Nombre, p.Descripcion))
            .ThenByDescending(p => ParsearTiendanubeId(p.TiendanubeProductId))
            .ThenByDescending(p => p.Id)
            .ToList();
    }

    public static int ExtraerNumeroDrop(string? nombre, string? descripcion)
    {
        if (!string.IsNullOrWhiteSpace(nombre))
        {
            var matchNombre = Regex.Match(nombre, @"\bdrop\s*#?(\d+)\b", RegexOptions.IgnoreCase);
            if (matchNombre.Success && int.TryParse(matchNombre.Groups[1].Value, out var dropNum))
            {
                return dropNum;
            }
        }

        if (!string.IsNullOrWhiteSpace(descripcion))
        {
            var matchDesc = Regex.Match(descripcion, @"\bdrop\s*#?(\d+)\b", RegexOptions.IgnoreCase);
            if (matchDesc.Success && int.TryParse(matchDesc.Groups[1].Value, out var dropNumDesc))
            {
                return dropNumDesc;
            }
        }

        return 0;
    }

    private static long ParsearTiendanubeId(string? tnId)
    {
        return !string.IsNullOrWhiteSpace(tnId) && long.TryParse(tnId, out var id) ? id : 0L;
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
                    var normList = CatalogClassifierService.NormalizarListaImagenesAltaRes(parsed, imagenUrl);
                    if (normList.Count > 0)
                    {
                        return normList;
                    }
                }
            }
            catch
            {
                // Fallback a ImagenUrl individual si el JSON es inválido
            }
        }

        if (!string.IsNullOrWhiteSpace(imagenUrl))
        {
            var norm = CatalogClassifierService.NormalizarUrlImagenAltaRes(imagenUrl);
            if (!string.IsNullOrWhiteSpace(norm))
            {
                return [norm];
            }
        }

        return [];
    }
}
