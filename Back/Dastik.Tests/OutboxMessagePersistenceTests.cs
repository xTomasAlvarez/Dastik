using Dastik.Api.Domain.Entities;
using Dastik.Api.Infrastructure.Persistence;
using FluentAssertions;
using Microsoft.Data.Sqlite;
using Microsoft.EntityFrameworkCore;
using Xunit;

namespace Dastik.Tests;

public class OutboxMessagePersistenceTests : IDisposable
{
    private readonly SqliteConnection _connection;
    private readonly AppDbContext _context;

    public OutboxMessagePersistenceTests()
    {
        _connection = new SqliteConnection("DataSource=:memory:");
        _connection.Open();

        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseSqlite(_connection)
            .Options;

        _context = new AppDbContext(options);
        _context.Database.EnsureCreated();
    }

    public void Dispose()
    {
        _context.Dispose();
        _connection.Dispose();
    }

    [Fact]
    public async Task OutboxMessage_DebePersistirseCorrectamenteConValoresPorDefecto()
    {
        // Arrange
        var message = new OutboxMessage
        {
            Id = Guid.NewGuid(),
            TipoEvento = "StockActualizado",
            ContenidoJson = "{\"VarianteId\":1,\"CantidadDescontada\":2}",
            FechaOcurrenciaUtc = DateTime.UtcNow
        };

        // Act
        _context.OutboxMessages.Add(message);
        await _context.SaveChangesAsync();

        var recuperado = await _context.OutboxMessages.FirstOrDefaultAsync(m => m.Id == message.Id);

        // Assert
        recuperado.Should().NotBeNull();
        recuperado!.TipoEvento.Should().Be("StockActualizado");
        recuperado.ContenidoJson.Should().Be("{\"VarianteId\":1,\"CantidadDescontada\":2}");
        recuperado.FechaProcesadoUtc.Should().BeNull();
        recuperado.Error.Should().BeNull();
        recuperado.Intentos.Should().Be(0);
    }

    [Fact]
    public async Task OutboxMessage_FiltradoDePendientes_DebeRetornarSoloMensajesSinProcesar()
    {
        // Arrange
        var procesado = new OutboxMessage
        {
            Id = Guid.NewGuid(),
            TipoEvento = "ProductoCreado",
            ContenidoJson = "{}",
            FechaOcurrenciaUtc = DateTime.UtcNow.AddMinutes(-10),
            FechaProcesadoUtc = DateTime.UtcNow.AddMinutes(-5),
            Intentos = 1
        };

        var pendiente = new OutboxMessage
        {
            Id = Guid.NewGuid(),
            TipoEvento = "StockActualizado",
            ContenidoJson = "{}",
            FechaOcurrenciaUtc = DateTime.UtcNow,
            FechaProcesadoUtc = null,
            Intentos = 0
        };

        _context.OutboxMessages.AddRange(procesado, pendiente);
        await _context.SaveChangesAsync();

        // Act
        var pendientes = await _context.OutboxMessages
            .Where(m => m.FechaProcesadoUtc == null)
            .ToListAsync();

        // Assert
        pendientes.Should().ContainSingle();
        pendientes[0].Id.Should().Be(pendiente.Id);
    }
}
