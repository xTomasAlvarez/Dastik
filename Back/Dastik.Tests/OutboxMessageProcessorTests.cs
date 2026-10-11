using System.Text.Json;
using Dastik.Api.Domain.Entities;
using Dastik.Api.Infrastructure.BackgroundServices;
using Dastik.Api.Infrastructure.Persistence;
using FluentAssertions;
using Microsoft.Data.Sqlite;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging.Abstractions;
using Xunit;

namespace Dastik.Tests;

public class OutboxMessageProcessorTests : IDisposable
{
    private readonly SqliteConnection _connection;
    private readonly AppDbContext _context;
    private readonly IServiceProvider _serviceProvider;

    public OutboxMessageProcessorTests()
    {
        _connection = new SqliteConnection("DataSource=:memory:");
        _connection.Open();

        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseSqlite(_connection)
            .Options;

        _context = new AppDbContext(options);
        _context.Database.EnsureCreated();

        var services = new ServiceCollection();
        services.AddScoped(_ => new AppDbContext(options));
        _serviceProvider = services.BuildServiceProvider();
    }

    public void Dispose()
    {
        _context.Dispose();
        _connection.Dispose();
    }

    [Fact]
    public async Task ProcessPendingMessagesAsync_CuandoHayMensajesPendientes_DebeActualizarFechaProcesadoUtc()
    {
        // Arrange
        var mensaje1 = new OutboxMessage
        {
            Id = Guid.NewGuid(),
            TipoEvento = "StockReducidoEnPOS",
            ContenidoJson = JsonSerializer.Serialize(new { VarianteId = 10, CantidadDescontada = 2 }),
            FechaOcurrenciaUtc = DateTime.UtcNow.AddMinutes(-5),
            FechaProcesadoUtc = null
        };

        var mensaje2 = new OutboxMessage
        {
            Id = Guid.NewGuid(),
            TipoEvento = "StockReducidoEnPOS",
            ContenidoJson = JsonSerializer.Serialize(new { VarianteId = 20, CantidadDescontada = 1 }),
            FechaOcurrenciaUtc = DateTime.UtcNow.AddMinutes(-2),
            FechaProcesadoUtc = null
        };

        _context.OutboxMessages.AddRange(mensaje1, mensaje2);
        await _context.SaveChangesAsync();

        var processor = new OutboxMessageProcessor(
            _serviceProvider,
            NullLogger<OutboxMessageProcessor>.Instance,
            TimeSpan.FromSeconds(1));

        // Act
        await processor.ProcessPendingMessagesAsync();

        // Assert
        var procesados = await _context.OutboxMessages.AsNoTracking().ToListAsync();
        procesados.Should().HaveCount(2);
        procesados.All(m => m.FechaProcesadoUtc.HasValue).Should().BeTrue();
        procesados.All(m => m.Intentos == 0).Should().BeTrue();
        procesados.All(m => m.Error == null).Should().BeTrue();
    }

    [Fact]
    public async Task ProcessPendingMessagesAsync_CuandoHayErrorDeDeserializacion_DebeRegistrarErrorEIncrementarIntentos()
    {
        // Arrange
        var mensajeCorrupto = new OutboxMessage
        {
            Id = Guid.NewGuid(),
            TipoEvento = "StockReducidoEnPOS",
            ContenidoJson = "{json_invalido_sin_cerrar",
            FechaOcurrenciaUtc = DateTime.UtcNow,
            FechaProcesadoUtc = null,
            Intentos = 0
        };

        _context.OutboxMessages.Add(mensajeCorrupto);
        await _context.SaveChangesAsync();

        var processor = new OutboxMessageProcessor(
            _serviceProvider,
            NullLogger<OutboxMessageProcessor>.Instance,
            TimeSpan.FromSeconds(1));

        // Act
        await processor.ProcessPendingMessagesAsync();

        // Assert
        var mensajeEnBd = await _context.OutboxMessages.AsNoTracking().FirstOrDefaultAsync(m => m.Id == mensajeCorrupto.Id);
        mensajeEnBd.Should().NotBeNull();
        mensajeEnBd!.FechaProcesadoUtc.Should().BeNull(); // No marcado como procesado
        mensajeEnBd.Intentos.Should().Be(1);
        mensajeEnBd.Error.Should().NotBeNullOrEmpty();
    }

    [Fact]
    public async Task ProcessPendingMessagesAsync_CuandoNoHayMensajes_NoDebeLanzarExcepcion()
    {
        // Arrange
        var processor = new OutboxMessageProcessor(
            _serviceProvider,
            NullLogger<OutboxMessageProcessor>.Instance,
            TimeSpan.FromSeconds(1));

        // Act & Assert
        var act = async () => await processor.ProcessPendingMessagesAsync();
        await act.Should().NotThrowAsync();
    }
}
