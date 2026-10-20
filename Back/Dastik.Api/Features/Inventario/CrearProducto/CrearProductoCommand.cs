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
    List<CrearVarianteItemDto> Variantes,
    List<string>? Imagenes = null,
    string? VideoUrl = null,
    bool EsFisico = true,
    List<string>? Subcategorias = null,
    List<string>? Destacados = null,
    string? TagsSeo = null,
    string? SeoTitulo = null,
    string? SeoDescripcion = null,
    bool SincronizarTiendanube = false
) : IRequest<CrearProductoResult>;

public record CrearVarianteItemDto(
    string Talle,
    string Color,
    string? CodigoBarras,
    int StockFisico,
    decimal? PrecioPromocional = null,
    decimal PesoKg = 0.3m,
    decimal? PrecioOverride = null
);

public record CrearProductoResult(
    int ProductoId,
    string Nombre,
    int CantidadVariantesCreadas,
    string? TiendanubeProductId = null,
    bool SincronizadoTiendanube = false
);
