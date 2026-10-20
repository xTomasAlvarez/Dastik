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
        var tokenLimpio = TiendanubeTokenHelper.NormalizarToken(accessToken)?.Trim() ?? accessToken.Trim();
        request.Headers.TryAddWithoutValidation("Authentication", $"bearer {tokenLimpio}");

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

    public async Task<Result<List<TiendanubeProductResponse>>> ObtenerProductosAsync(
        string storeId,
        string accessToken,
        CancellationToken ct = default)
    {
        // 1. Guardia de Seguridad para Sandbox / Modo Mock: Simular catálogo de Tiendanube
        if (EsModoMock(storeId, accessToken))
        {
            _logger.LogInformation(
                "[Tiendanube MOCK] Catálogo obtenido de forma simulada para Store: {StoreId}",
                storeId);

            return Result<List<TiendanubeProductResponse>>.Success(GenerarCatalogoMock());
        }

        // 2. Request REST con bucle de paginación seguro: GET {storeId}/products?per_page=200&page={page}
        var todosLosProductos = new List<TiendanubeProductResponse>();
        var tokenLimpio = TiendanubeTokenHelper.NormalizarToken(accessToken)?.Trim() ?? accessToken.Trim();
        int page = 1;

        do
        {
            var endpointUrl = $"{storeId}/products?per_page=200&page={page}";
            using var request = new HttpRequestMessage(HttpMethod.Get, endpointUrl);
            request.Headers.TryAddWithoutValidation("Authentication", $"bearer {tokenLimpio}");

            try
            {
                var response = await _httpClient.SendAsync(request, ct);

                if (!response.IsSuccessStatusCode)
                {
                    var errorBody = await response.Content.ReadAsStringAsync(ct);
                    _logger.LogWarning(
                        "Tiendanube API respondió con error {(int)StatusCode} {StatusCode} al obtener productos (página {Page}) para Store {StoreId}: {ErrorBody}",
                        (int)response.StatusCode, response.StatusCode, page, storeId, errorBody);

                    return Result<List<TiendanubeProductResponse>>.Failure(
                        $"Tiendanube respondió con {(int)response.StatusCode}: {errorBody}");
                }

                var responseBody = await response.Content.ReadAsStringAsync(ct);
                var productos = ParsearProductosJson(responseBody);

                if (productos.Count == 0)
                {
                    break;
                }

                todosLosProductos.AddRange(productos);
                _logger.LogInformation(
                    "Página {Page} de Tiendanube importada ({Cantidad} productos). Total acumulado: {Total}",
                    page, productos.Count, todosLosProductos.Count);

                // CRÍTICO: Pausa obligatoria después de procesar cada página para prevenir bloqueo de Tiendanube (429 Rate Limit)
                await Task.Delay(500, ct);

                // Evalúa la cantidad de productos devueltos en la página actual. Si es menor a 200 (o 0), rompe el bucle
                if (productos.Count < 200)
                {
                    break;
                }

                page++;
            }
            catch (Exception ex) when (ex is not OperationCanceledException)
            {
                _logger.LogError(ex, "Excepción de red al obtener productos de Tiendanube API (página {Page}) para Store {StoreId}", page, storeId);
                return Result<List<TiendanubeProductResponse>>.Failure($"Fallo de conexión con Tiendanube: {ex.Message}");
            }
        } while (!ct.IsCancellationRequested);

        return Result<List<TiendanubeProductResponse>>.Success(todosLosProductos);
    }

    private static List<TiendanubeProductResponse> ParsearProductosJson(string json)
    {
        var lista = new List<TiendanubeProductResponse>();
        if (string.IsNullOrWhiteSpace(json)) return lista;

        using var doc = JsonDocument.Parse(json);
        var root = doc.RootElement;

        var elementos = root.ValueKind == JsonValueKind.Array
            ? root.EnumerateArray()
            : Enumerable.Empty<JsonElement>();

        foreach (var prodElem in elementos)
        {
            long id = prodElem.TryGetProperty("id", out var idProp) ? idProp.GetInt64() : 0;
            if (id == 0) continue;

            string nombre = ExtraerTexto(prodElem, "name") ?? $"Producto {id}";
            string? descripcion = ExtraerTexto(prodElem, "description");

            // Galería completa de imágenes (y primera imagen destacada)
            var imagenes = new List<string>();
            if (prodElem.TryGetProperty("images", out var imgProp) && imgProp.ValueKind == JsonValueKind.Array)
            {
                foreach (var imgElem in imgProp.EnumerateArray())
                {
                    if (imgElem.ValueKind == JsonValueKind.Object &&
                        imgElem.TryGetProperty("src", out var srcProp) &&
                        srcProp.ValueKind == JsonValueKind.String)
                    {
                        var src = srcProp.GetString();
                        if (!string.IsNullOrWhiteSpace(src))
                        {
                            imagenes.Add(src.Trim());
                        }
                    }
                }
            }
            string? imagenUrl = imagenes.FirstOrDefault();

            // Variantes
            var variantes = new List<TiendanubeProductVariantResponse>();
            if (prodElem.TryGetProperty("variants", out var varProp) && varProp.ValueKind == JsonValueKind.Array)
            {
                foreach (var vElem in varProp.EnumerateArray())
                {
                    long vId = vElem.TryGetProperty("id", out var vidProp) ? vidProp.GetInt64() : 0;
                    long vPid = vElem.TryGetProperty("product_id", out var vpidProp) ? vpidProp.GetInt64() : id;
                    decimal? precio = ExtraerDecimal(vElem, "price");
                    decimal? costo = ExtraerDecimal(vElem, "cost");
                    int? stock = ExtraerEntero(vElem, "stock");
                    string? barcode = vElem.TryGetProperty("barcode", out var bcProp) && bcProp.ValueKind == JsonValueKind.String
                        ? bcProp.GetString()
                        : null;

                    string? talle = null;
                    string? color = null;

                    if (vElem.TryGetProperty("values", out var valProp) && valProp.ValueKind == JsonValueKind.Array)
                    {
                        var valList = valProp.EnumerateArray().ToList();
                        if (valList.Count > 0)
                        {
                            talle = ExtraerTextoDeElemento(valList[0]);
                        }
                        if (valList.Count > 1)
                        {
                            color = ExtraerTextoDeElemento(valList[1]);
                        }
                    }

                    variantes.Add(new TiendanubeProductVariantResponse(
                        vId,
                        vPid,
                        talle ?? "TU",
                        color ?? "Único",
                        barcode,
                        precio,
                        costo,
                        stock
                    ));
                }
            }

            decimal? precioProducto = variantes.FirstOrDefault(v => v.Precio.HasValue)?.Precio;
            decimal? costoProducto = variantes.FirstOrDefault(v => v.Costo.HasValue)?.Costo;

            lista.Add(new TiendanubeProductResponse(
                id,
                nombre,
                descripcion,
                imagenUrl,
                precioProducto,
                costoProducto,
                variantes,
                imagenes
            ));
        }

        return lista;
    }

    private static string? ExtraerTexto(JsonElement elem, string propName)
    {
        if (!elem.TryGetProperty(propName, out var p)) return null;
        return ExtraerTextoDeElemento(p);
    }

    private static string? ExtraerTextoDeElemento(JsonElement p)
    {
        if (p.ValueKind == JsonValueKind.String)
        {
            return p.GetString();
        }
        if (p.ValueKind == JsonValueKind.Object)
        {
            if (p.TryGetProperty("es", out var esProp) && esProp.ValueKind == JsonValueKind.String)
            {
                return esProp.GetString();
            }
            foreach (var prop in p.EnumerateObject())
            {
                if (prop.Value.ValueKind == JsonValueKind.String)
                {
                    return prop.Value.GetString();
                }
            }
        }
        return null;
    }

    private static decimal? ExtraerDecimal(JsonElement elem, string propName)
    {
        if (!elem.TryGetProperty(propName, out var p)) return null;
        if (p.ValueKind == JsonValueKind.Number && p.TryGetDecimal(out var d)) return d;
        if (p.ValueKind == JsonValueKind.String &&
            decimal.TryParse(p.GetString(), System.Globalization.NumberStyles.Any, System.Globalization.CultureInfo.InvariantCulture, out var d2))
        {
            return d2;
        }
        return null;
    }

    private static int? ExtraerEntero(JsonElement elem, string propName)
    {
        if (!elem.TryGetProperty(propName, out var p)) return null;
        if (p.ValueKind == JsonValueKind.Number && p.TryGetInt32(out var i)) return i;
        if (p.ValueKind == JsonValueKind.String && int.TryParse(p.GetString(), out var i2)) return i2;
        return null;
    }

    private static List<TiendanubeProductResponse> GenerarCatalogoMock()
    {
        return new List<TiendanubeProductResponse>
        {
            new(
                Id: 101,
                Nombre: "Remera Boxy Heavyweight Dastik",
                Descripcion: "Remera corte boxy fit en algodón pesado 24/1 teñido artesanal",
                ImagenUrl: "https://dastik.com/img/boxy-tee.jpg",
                Precio: 24000m,
                Costo: 15000m,
                Variantes: new List<TiendanubeProductVariantResponse>
                {
                    new(1001, 101, "S", "Negro", "2010100100018", 24000m, 15000m, 8),
                    new(1002, 101, "M", "Negro", "2010100100025", 24000m, 15000m, 14),
                    new(1003, 101, "L", "Negro", "2010100100032", 24000m, 15000m, 10),
                    new(1004, 101, "XL", "Negro", "2010100100049", 24000m, 15000m, 5)
                },
                Imagenes: new List<string>
                {
                    "https://dastik.com/img/boxy-tee.jpg",
                    "https://dastik.com/img/boxy-tee-back.jpg"
                }
            ),
            new(
                Id: 102,
                Nombre: "Hoodie Oversize Essential Dastik",
                Descripcion: "Buzo canguro con frisa premium y capucha forrada",
                ImagenUrl: "https://dastik.com/img/hoodie-black.jpg",
                Precio: 45000m,
                Costo: 28000m,
                Variantes: new List<TiendanubeProductVariantResponse>
                {
                    new(1005, 102, "M", "Negro", "2010100200015", 45000m, 28000m, 6),
                    new(1006, 102, "L", "Negro", "2010100200022", 45000m, 28000m, 9)
                },
                Imagenes: new List<string>
                {
                    "https://dastik.com/img/hoodie-black.jpg"
                }
            ),
            new(
                Id: 103,
                Nombre: "Pantalón Parachute Ripstop Dastik",
                Descripcion: "Pantalón técnico con ajuste regulable en botamanga",
                ImagenUrl: "https://dastik.com/img/pant-ripstop.jpg",
                Precio: 38000m,
                Costo: 24000m,
                Variantes: new List<TiendanubeProductVariantResponse>
                {
                    new(1007, 103, "40", "Gris", "2010100300012", 38000m, 24000m, 4),
                    new(1008, 103, "42", "Gris", "2010100300029", 38000m, 24000m, 7)
                },
                Imagenes: new List<string>
                {
                    "https://dastik.com/img/pant-ripstop.jpg"
                }
            )
        };
    }

    private static bool EsModoMock(string storeId, string accessToken)
    {
        var tokenLimpio = TiendanubeTokenHelper.NormalizarToken(accessToken);
        return string.IsNullOrWhiteSpace(storeId)
            || string.IsNullOrWhiteSpace(tokenLimpio)
            || storeId.StartsWith("sandbox", StringComparison.OrdinalIgnoreCase)
            || storeId.StartsWith("mock", StringComparison.OrdinalIgnoreCase)
            || tokenLimpio.StartsWith("mock", StringComparison.OrdinalIgnoreCase);
    }
}
