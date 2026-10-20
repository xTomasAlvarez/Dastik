using Dastik.Api.Common;

namespace Dastik.Api.Domain.Integrations.Tiendanube;

public record ActualizarStockVarianteRequest(
    int Stock
);

public record TiendanubeVariantResponse(
    long Id,
    long ProductId,
    int Stock
);

public record TiendanubeProductVariantResponse(
    long Id,
    long ProductId,
    string? Talle,
    string? Color,
    string? Barcode,
    decimal? Precio,
    decimal? Costo,
    int? Stock,
    decimal? PrecioPromocional = null,
    decimal? Peso = null
);

public record TiendanubeProductResponse(
    long Id,
    string Nombre,
    string? Descripcion,
    string? ImagenUrl,
    decimal? Precio,
    decimal? Costo,
    List<TiendanubeProductVariantResponse> Variantes,
    List<string>? Imagenes = null,
    List<string>? Categorias = null,
    string? VideoUrl = null,
    string? Tags = null,
    string? Brand = null,
    string? SeoTitulo = null,
    string? SeoDescripcion = null
);

public record TiendanubeVariantePayload(
    string? TiendanubeVariantId,
    string Talle,
    string Color,
    string Barcode,
    decimal Precio,
    decimal? PrecioPromocional,
    decimal PesoKg,
    int Stock
);

public record TiendanubeCrearProductoPayload(
    string Nombre,
    string? Descripcion,
    string? Brand,
    string? Tags,
    string? VideoUrl,
    string? SeoTitulo,
    string? SeoDescripcion,
    List<string> ImagenesUrls,
    List<TiendanubeVariantePayload> Variantes
);

public record TiendanubeActualizarProductoPayload(
    string Nombre,
    string? Descripcion,
    string? Brand,
    string? Tags,
    string? VideoUrl,
    string? SeoTitulo,
    string? SeoDescripcion,
    List<string> ImagenesUrls,
    List<TiendanubeVariantePayload> Variantes
);

public record TiendanubeMutationResponse(
    long TiendanubeProductId,
    List<TiendanubeVariantMutationItem> Variantes
);

public record TiendanubeVariantMutationItem(
    long TiendanubeVariantId,
    string? Talle,
    string? Color,
    string? Barcode
);

public interface ITiendanubeApiClient
{
    Task<Result<TiendanubeVariantResponse>> ActualizarStockVarianteAsync(
        string storeId,
        string accessToken,
        string productId,
        string variantId,
        int nuevoStock,
        CancellationToken ct = default);

    Task<Result<List<TiendanubeProductResponse>>> ObtenerProductosAsync(
        string storeId,
        string accessToken,
        CancellationToken ct = default);

    Task<Result<TiendanubeMutationResponse>> CrearProductoAsync(
        string storeId,
        string accessToken,
        TiendanubeCrearProductoPayload payload,
        CancellationToken ct = default);

    Task<Result<TiendanubeMutationResponse>> ActualizarProductoAsync(
        string storeId,
        string accessToken,
        string tiendanubeProductId,
        TiendanubeActualizarProductoPayload payload,
        CancellationToken ct = default);
}
