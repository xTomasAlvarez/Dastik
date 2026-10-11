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
    List<VarianteCatalogoDto> Variantes
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
        return await _context.Productos
            .AsNoTracking()
            .Where(p => p.Activo)
            .Include(p => p.UnidadNegocio)
            .Include(p => p.Marca)
            .Include(p => p.Categoria)
            .Include(p => p.Variantes)
            .Select(p => new ProductoCatalogoDto(
                p.Id,
                p.Nombre,
                p.Descripcion,
                p.Marca.Nombre,
                p.Categoria.Nombre,
                p.UnidadNegocio.Nombre,
                p.ImagenUrl,
                p.PrecioVenta,
                p.Variantes.Select(v => new VarianteCatalogoDto(
                    v.Id,
                    v.Talle,
                    v.Color,
                    v.CodigoBarras,
                    v.StockFisico
                )).ToList()
            ))
            .ToListAsync(cancellationToken);
    }
}
