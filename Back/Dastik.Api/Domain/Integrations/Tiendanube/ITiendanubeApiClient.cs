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

public interface ITiendanubeApiClient
{
    Task<Result<TiendanubeVariantResponse>> ActualizarStockVarianteAsync(
        string storeId,
        string accessToken,
        string productId,
        string variantId,
        int nuevoStock,
        CancellationToken ct = default);
}
