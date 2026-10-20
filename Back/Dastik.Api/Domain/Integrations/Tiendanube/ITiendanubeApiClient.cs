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
    int? Stock
);

public record TiendanubeProductResponse(
    long Id,
    string Nombre,
    string? Descripcion,
    string? ImagenUrl,
    decimal? Precio,
    decimal? Costo,
    List<TiendanubeProductVariantResponse> Variantes,
    List<string>? Imagenes = null
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
}
