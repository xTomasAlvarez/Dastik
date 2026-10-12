using System.Text.Json;
using Dastik.Api.Domain.Integrations.Tiendanube;
using Dastik.Api.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;

namespace Dastik.Api.Infrastructure.BackgroundServices;

/// <summary>
/// Background Worker alojado como servicio de fondo de .NET.
/// Lee y procesa periódicamente lotes de OutboxMessages pendientes para sincronizar con Tiendanube sin penalizar el POS.
/// </summary>
public class OutboxMessageProcessor : BackgroundService
{
    private readonly IServiceProvider _serviceProvider;
    private readonly ILogger<OutboxMessageProcessor> _logger;
    private readonly TimeSpan _period;

    public OutboxMessageProcessor(
        IServiceProvider serviceProvider,
        ILogger<OutboxMessageProcessor> logger,
        TimeSpan? period = null)
    {
        _serviceProvider = serviceProvider;
        _logger = logger;
        _period = period ?? TimeSpan.FromSeconds(10);
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        _logger.LogInformation("Iniciando OutboxMessageProcessor worker...");

        // Espera inicial breve para permitir que la aplicación arranque completamente
        try
        {
            await Task.Delay(TimeSpan.FromSeconds(5), stoppingToken);
        }
        catch (OperationCanceledException)
        {
            return;
        }

        while (!stoppingToken.IsCancellationRequested)
        {
            try
            {
                await ProcessPendingMessagesAsync(stoppingToken);
            }
            catch (Exception ex) when (!stoppingToken.IsCancellationRequested)
            {
                _logger.LogWarning("OutboxMessageProcessor: no se pudo consultar la base de datos (¿PostgreSQL desconectado?): {Message}", ex.Message);
            }

            try
            {
                await Task.Delay(_period, stoppingToken);
            }
            catch (OperationCanceledException) when (stoppingToken.IsCancellationRequested)
            {
                break;
            }
        }

        _logger.LogInformation("Deteniendo OutboxMessageProcessor worker.");
    }

    /// <summary>
    /// Procesa un lote de mensajes pendientes de Outbox.
    /// Es público para permitir pruebas unitarias deterministas sin depender de temporizadores en segundo plano.
    /// </summary>
    public async Task ProcessPendingMessagesAsync(CancellationToken cancellationToken = default)
    {
        using var scope = _serviceProvider.CreateScope();
        var context = scope.ServiceProvider.GetRequiredService<AppDbContext>();

        var pendingMessages = await context.OutboxMessages
            .Where(m => m.FechaProcesadoUtc == null)
            .OrderBy(m => m.FechaOcurrenciaUtc)
            .Take(20)
            .ToListAsync(cancellationToken);

        if (pendingMessages.Count == 0)
        {
            return;
        }

        foreach (var message in pendingMessages)
        {
            try
            {
                int varianteId = 0;
                if (!string.IsNullOrWhiteSpace(message.ContenidoJson))
                {
                    using var jsonDoc = JsonDocument.Parse(message.ContenidoJson);
                    if (jsonDoc.RootElement.TryGetProperty("VarianteId", out var varProp) && varProp.TryGetInt32(out var vid))
                    {
                        varianteId = vid;
                    }
                }

                if (varianteId > 0)
                {
                    var variante = await context.Variantes
                        .Include(v => v.Producto)
                            .ThenInclude(p => p.UnidadNegocio)
                        .FirstOrDefaultAsync(v => v.Id == varianteId, cancellationToken);

                    if (variante != null && variante.Producto?.UnidadNegocio?.TieneTiendaNube == true)
                    {
                        var apiClient = scope.ServiceProvider.GetService<ITiendanubeApiClient>();
                        if (apiClient != null &&
                            !string.IsNullOrWhiteSpace(variante.Producto.TiendanubeProductId) &&
                            !string.IsNullOrWhiteSpace(variante.TiendanubeVariantId))
                        {
                            var storeId = variante.Producto.UnidadNegocio.TiendanubeStoreId ?? string.Empty;
                            var token = variante.Producto.UnidadNegocio.TiendanubeAccessToken ?? string.Empty;

                            var resultado = await apiClient.ActualizarStockVarianteAsync(
                                storeId,
                                token,
                                variante.Producto.TiendanubeProductId,
                                variante.TiendanubeVariantId,
                                variante.StockFisico,
                                cancellationToken);

                            if (!resultado.IsSuccess)
                            {
                                message.Intentos++;
                                message.Error = resultado.Error;
                                _logger.LogWarning(
                                    "Fallo de sincronización Tiendanube para OutboxMessage {MessageId}, Variante {VarianteId}: {Error}",
                                    message.Id, varianteId, resultado.Error);
                                continue;
                            }
                        }
                    }
                    else if (variante != null && variante.Producto?.UnidadNegocio?.TieneTiendaNube == false)
                    {
                        _logger.LogInformation(
                            "Tenant Guard Outbox: La variante {VarianteId} pertenece a '{UnidadNegocio}' (comercio físico exclusivo). Se omite sincronización con Tiendanube y se marca como procesado.",
                            varianteId, variante.Producto?.UnidadNegocio?.Nombre ?? "Física");
                    }
                }

                _logger.LogInformation(
                    "Sincronización de OutboxMessage {MessageId} procesada exitosamente (VarianteId {VarianteId}).",
                    message.Id, varianteId);

                message.FechaProcesadoUtc = DateTime.UtcNow;
                message.Error = null;
            }
            catch (Exception ex)
            {
                message.Intentos++;
                message.Error = ex.Message;
                _logger.LogWarning(ex, "Error al procesar OutboxMessage {MessageId}. Intento: {Intentos}", message.Id, message.Intentos);
            }
        }

        await context.SaveChangesAsync(cancellationToken);
    }
}
