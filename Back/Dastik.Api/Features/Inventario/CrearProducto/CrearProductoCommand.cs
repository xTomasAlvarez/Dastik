using MediatR;

namespace Dastik.Api.Features.Inventario.CrearProducto;

public record CrearProductoCommand(
    int UnidadNegocioId,
    int CategoriaId,
    int MarcaId,
    int ProveedorId,
    string Nombre,
    string Descripcion,
    string ImagenUrl,
    decimal CostoBase,
    decimal MarkupAplicado,
    decimal PrecioVenta,
    List<CrearVarianteItemDto> Variantes
) : IRequest<CrearProductoResult>;

public record CrearVarianteItemDto(
    string Talle,
    string Color,
    string? CodigoBarras,
    int StockFisico
);

public record CrearProductoResult(
    int ProductoId,
    string Nombre,
    int CantidadVariantesCreadas
);
