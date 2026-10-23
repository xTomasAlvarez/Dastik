using System.Net.Http.Json;
using Microsoft.Extensions.Caching.Memory;
using Microsoft.Extensions.Logging;

namespace Dastik.Api.Features.Finanzas.Services;

public record CotizacionCasa(
    string Casa,
    string Nombre,
    decimal Compra,
    decimal Venta,
    DateTime FechaActualizacion
);

public record DolarCotizacionResponse(
    CotizacionCasa Blue,
    CotizacionCasa Oficial,
    bool EsFallback,
    DateTime UltimaActualizacionUtc
);

public interface IDolarCotizacionService
{
    Task<DolarCotizacionResponse> ObtenerCotizacionAsync(CancellationToken ct = default);
}

public class DolarCotizacionService : IDolarCotizacionService
{
    private const string CacheKey = "Dastik_DolarCotizacion_Cache";
    private readonly HttpClient _httpClient;
    private readonly IMemoryCache _cache;
    private readonly ILogger<DolarCotizacionService> _logger;

    private sealed record DolarApiItem(
        string? moneda,
        string? casa,
        string? nombre,
        decimal? compra,
        decimal? venta,
        DateTime? fechaActualizacion
    );

    public DolarCotizacionService(
        HttpClient httpClient,
        IMemoryCache cache,
        ILogger<DolarCotizacionService> logger)
    {
        _httpClient = httpClient;
        _httpClient.Timeout = TimeSpan.FromSeconds(5);
        _cache = cache;
        _logger = logger;
    }

    public async Task<DolarCotizacionResponse> ObtenerCotizacionAsync(CancellationToken ct = default)
    {
        if (_cache.TryGetValue(CacheKey, out DolarCotizacionResponse? cotizacionCached) && cotizacionCached is not null)
        {
            return cotizacionCached;
        }

        try
        {
            var items = await _httpClient.GetFromJsonAsync<List<DolarApiItem>>("https://dolarapi.com/v1/dolares", ct);

            if (items is not null && items.Count > 0)
            {
                var blueItem = items.FirstOrDefault(i => string.Equals(i.casa, "blue", StringComparison.OrdinalIgnoreCase));
                var oficialItem = items.FirstOrDefault(i => string.Equals(i.casa, "oficial", StringComparison.OrdinalIgnoreCase));

                var blue = new CotizacionCasa(
                    Casa: "blue",
                    Nombre: "Dólar Blue",
                    Compra: blueItem?.compra ?? 1220m,
                    Venta: blueItem?.venta ?? 1240m,
                    FechaActualizacion: blueItem?.fechaActualizacion ?? DateTime.UtcNow
                );

                var oficial = new CotizacionCasa(
                    Casa: "oficial",
                    Nombre: "Dólar Oficial",
                    Compra: oficialItem?.compra ?? 1050m,
                    Venta: oficialItem?.venta ?? 1090m,
                    FechaActualizacion: oficialItem?.fechaActualizacion ?? DateTime.UtcNow
                );

                var respuesta = new DolarCotizacionResponse(
                    Blue: blue,
                    Oficial: oficial,
                    EsFallback: false,
                    UltimaActualizacionUtc: DateTime.UtcNow
                );

                _cache.Set(CacheKey, respuesta, TimeSpan.FromMinutes(15));
                return respuesta;
            }
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "No se pudo obtener la cotización del dólar en vivo desde DolarApi.com. Usando valores de contingencia.");
        }

        // Contingencia resiliente
        var fallbackRespuesta = new DolarCotizacionResponse(
            Blue: new CotizacionCasa("blue", "Dólar Blue", 1220m, 1240m, DateTime.UtcNow),
            Oficial: new CotizacionCasa("oficial", "Dólar Oficial", 1050m, 1090m, DateTime.UtcNow),
            EsFallback: true,
            UltimaActualizacionUtc: DateTime.UtcNow
        );

        _cache.Set(CacheKey, fallbackRespuesta, TimeSpan.FromMinutes(2));
        return fallbackRespuesta;
    }
}
