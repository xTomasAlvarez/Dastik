using System.Text.Json;
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

        while (!stoppingToken.IsCancellationRequested)
        {
            try
            {
                await ProcessPendingMessagesAsync(stoppingToken);
            }
            catch (Exception ex) when (!stoppingToken.IsCancellationRequested)
            {
                _logger.LogError(ex, "Ocurrió una excepción al procesar mensajes en OutboxMessageProcessor.");
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

                // En Fase 6 se conectará al cliente HTTP real de Tiendanube
                _logger.LogInformation(
                    "Simulando sincronización de stock en Tiendanube para VarianteId {VarianteId}...",
                    varianteId);

                message.FechaProcesadoUtc = DateTime.UtcNow;
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
