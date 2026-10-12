using System.Net.Http.Headers;
using System.Text;
using System.Text.Json;
using Dastik.Api.Common;
using Dastik.Api.Domain.Integrations.Tiendanube;
using Microsoft.Extensions.Logging;

namespace Dastik.Api.Infrastructure.Integrations.Tiendanube;

public class TiendanubeApiClient : ITiendanubeApiClient
{
    private readonly HttpClient _httpClient;
    private readonly ILogger<TiendanubeApiClient> _logger;

    public TiendanubeApiClient(
        HttpClient httpClient,
        ILogger<TiendanubeApiClient> logger)
    {
        _httpClient = httpClient;
        _logger = logger;
    }

    public async Task<Result<TiendanubeVariantResponse>> ActualizarStockVarianteAsync(
        string storeId,
        string accessToken,
        string productId,
        string variantId,
        int nuevoStock,
        CancellationToken ct = default)
    {
        // 1. Guardia de Seguridad para Sandbox / Modo Mock: Jamás tocar la API real de Tiendanube
        if (EsModoMock(storeId, accessToken))
        {
            _logger.LogInformation(
                "[Tiendanube MOCK] Sincronización simulada para Store: {StoreId}, Producto: {ProductId}, Variante: {VariantId}, Stock: {NuevoStock}",
                storeId, productId, variantId, nuevoStock);

            long vid = long.TryParse(variantId, out var parsedVid) ? parsedVid : 1;
            long pid = long.TryParse(productId, out var parsedPid) ? parsedPid : 1;

            return Result<TiendanubeVariantResponse>.Success(
                new TiendanubeVariantResponse(vid, pid, nuevoStock));
        }

        // 2. Construcción del Request REST para Tiendanube v1
        // Endpoint: PUT https://api.tiendanube.com/v1/{store_id}/products/{product_id}/variants/{variant_id}
        var endpointUrl = $"{storeId}/products/{productId}/variants/{variantId}";
        using var request = new HttpRequestMessage(HttpMethod.Put, endpointUrl);

        // Header obligatorio de Tiendanube: "Authentication: bearer {token}"
        request.Headers.TryAddWithoutValidation("Authentication", $"bearer {accessToken.Trim()}");

        var payload = JsonSerializer.Serialize(new { stock = nuevoStock });
        request.Content = new StringContent(payload, Encoding.UTF8, "application/json");

        try
        {
            var response = await _httpClient.SendAsync(request, ct);

            if (!response.IsSuccessStatusCode)
            {
                var errorBody = await response.Content.ReadAsStringAsync(ct);
                _logger.LogWarning(
                    "Tiendanube API respondió con error {(int)StatusCode} {StatusCode} para Store {StoreId}, Variante {VariantId}: {ErrorBody}",
                    (int)response.StatusCode, response.StatusCode, storeId, variantId, errorBody);

                return Result<TiendanubeVariantResponse>.Failure(
                    $"Tiendanube respondió con {(int)response.StatusCode}: {errorBody}");
            }

            var responseBody = await response.Content.ReadAsStringAsync(ct);
            using var doc = JsonDocument.Parse(responseBody);
            var root = doc.RootElement;

            long resId = root.TryGetProperty("id", out var idProp) ? idProp.GetInt64() : 0;
            long resPid = root.TryGetProperty("product_id", out var pidProp) ? pidProp.GetInt64() : 0;
            int resStock = root.TryGetProperty("stock", out var stockProp) ? stockProp.GetInt32() : nuevoStock;

            return Result<TiendanubeVariantResponse>.Success(
                new TiendanubeVariantResponse(resId, resPid, resStock));
        }
        catch (Exception ex) when (ex is not OperationCanceledException)
        {
            _logger.LogError(ex, "Excepción de red al comunicar con Tiendanube API para Variante {VariantId}", variantId);
            return Result<TiendanubeVariantResponse>.Failure($"Fallo de conexión con Tiendanube: {ex.Message}");
        }
    }

    private static bool EsModoMock(string storeId, string accessToken)
    {
        return string.IsNullOrWhiteSpace(storeId)
            || string.IsNullOrWhiteSpace(accessToken)
            || storeId.StartsWith("sandbox", StringComparison.OrdinalIgnoreCase)
            || storeId.StartsWith("mock", StringComparison.OrdinalIgnoreCase)
            || accessToken.StartsWith("mock", StringComparison.OrdinalIgnoreCase);
    }
}
