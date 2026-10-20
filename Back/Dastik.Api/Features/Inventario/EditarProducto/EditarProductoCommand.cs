using MediatR;

namespace Dastik.Api.Features.Inventario.EditarProducto;

public record EditarProductoCommand(
    int Id,
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
    List<EditarVarianteItemDto> Variantes,
    List<string>? Imagenes = null,
    string? VideoUrl = null,
    bool EsFisico = true,
    List<string>? Subcategorias = null,
    List<string>? Destacados = null,
    string? TagsSeo = null,
    string? SeoTitulo = null,
    string? SeoDescripcion = null,
    bool SincronizarTiendanube = false
) : IRequest<EditarProductoResult>;

public record EditarVarianteItemDto(
    int? Id,
    string Talle,
    string Color,
    string? CodigoBarras,
    int StockFisico,
    decimal? PrecioPromocional = null,
    decimal PesoKg = 0.3m,
    decimal? PrecioOverride = null,
    string? TiendanubeVariantId = null
);

public record EditarProductoResult(
    int ProductoId,
    string Nombre,
    int CantidadVariantes,
    string? TiendanubeProductId = null,
    bool SincronizadoTiendanube = false
);
