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

    [Fact]
    public async Task ProcessPendingMessagesAsync_ConVarianteHiddenSneakers_DebeLlamarATiendanubeYMarcarProcesado()
    {
        // Arrange
        var unidadHidden = new UnidadNegocio
        {
            Nombre = "Hidden Sneakers",
            TieneTiendaNube = true,
            TiendanubeStoreId = "998877",
            TiendanubeAccessToken = "token-secret-123"
        };
        var categoria = new Categoria { Nombre = "Calzado", Temporada = "2026", EsquemaTalles = "US" };
        var marca = new Marca { Nombre = "Nike" };
        var proveedor = new Proveedor { Nombre = "Proveedor A", MarkupPorDefecto = 1.5m };

        _context.UnidadesNegocio.Add(unidadHidden);
        _context.Categorias.Add(categoria);
        _context.Marcas.Add(marca);
        _context.Proveedores.Add(proveedor);

        var producto = new Producto
        {
            Nombre = "Dunk Low",
            Descripcion = "Sneaker",
            UnidadNegocio = unidadHidden,
            Categoria = categoria,
            Marca = marca,
            Proveedor = proveedor,
            TiendanubeProductId = "prod-111",
            PrecioVenta = 50000m,
            CostoBase = 30000m,
            MarkupAplicado = 1.6m
        };
        var variante = new Variante
        {
            Producto = producto,
            Talle = "US 10",
            Color = "Panda",
            CodigoBarras = "7791234567890",
            StockFisico = 8,
            TiendanubeVariantId = "var-222"
        };

        _context.Productos.Add(producto);
        _context.Variantes.Add(variante);
        await _context.SaveChangesAsync();

        var outboxMessage = new OutboxMessage
        {
            Id = Guid.NewGuid(),
            TipoEvento = "StockReducidoEnPOS",
            ContenidoJson = JsonSerializer.Serialize(new { VarianteId = variante.Id, CantidadDescontada = 1 }),
            FechaOcurrenciaUtc = DateTime.UtcNow,
            FechaProcesadoUtc = null,
            Intentos = 0
        };
        _context.OutboxMessages.Add(outboxMessage);
        await _context.SaveChangesAsync();

        var fakeClient = new FakeTiendanubeApiClient();

        var services = new ServiceCollection();
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseSqlite(_connection)
            .Options;
        services.AddScoped(_ => new AppDbContext(options));
        services.AddScoped<Dastik.Api.Domain.Integrations.Tiendanube.ITiendanubeApiClient>(_ => fakeClient);
        var serviceProvider = services.BuildServiceProvider();

        var processor = new OutboxMessageProcessor(
            serviceProvider,
            NullLogger<OutboxMessageProcessor>.Instance,
            TimeSpan.FromSeconds(1));

        // Act
        await processor.ProcessPendingMessagesAsync();

        // Assert
        fakeClient.FueLlamado.Should().BeTrue();
        fakeClient.UltimoStoreId.Should().Be("998877");
        fakeClient.UltimoProductId.Should().Be("prod-111");
        fakeClient.UltimoVariantId.Should().Be("var-222");
        fakeClient.UltimoStock.Should().Be(8);

        var mensajeEnBd = await _context.OutboxMessages.AsNoTracking().FirstOrDefaultAsync(m => m.Id == outboxMessage.Id);
        mensajeEnBd.Should().NotBeNull();
        mensajeEnBd!.FechaProcesadoUtc.Should().NotBeNull();
        mensajeEnBd.Intentos.Should().Be(0);
        mensajeEnBd.Error.Should().BeNull();
    }

    [Fact]
    public async Task ProcessPendingMessagesAsync_CuandoTiendanubeFalla_DebeIncrementarIntentosYRegistrarError()
    {
        // Arrange
        var unidadHidden = new UnidadNegocio
        {
            Nombre = "Hidden Sneakers",
            TieneTiendaNube = true,
            TiendanubeStoreId = "998877",
            TiendanubeAccessToken = "token-secret-123"
        };
        var categoria = new Categoria { Nombre = "Calzado", Temporada = "2026", EsquemaTalles = "US" };
        var marca = new Marca { Nombre = "Nike" };
        var proveedor = new Proveedor { Nombre = "Proveedor A", MarkupPorDefecto = 1.5m };

        _context.UnidadesNegocio.Add(unidadHidden);
        _context.Categorias.Add(categoria);
        _context.Marcas.Add(marca);
        _context.Proveedores.Add(proveedor);

        var producto = new Producto
        {
            Nombre = "Dunk Low",
            Descripcion = "Sneaker",
            UnidadNegocio = unidadHidden,
            Categoria = categoria,
            Marca = marca,
            Proveedor = proveedor,
            TiendanubeProductId = "prod-111",
            PrecioVenta = 50000m,
            CostoBase = 30000m,
            MarkupAplicado = 1.6m
        };
        var variante = new Variante
        {
            Producto = producto,
            Talle = "US 10",
            Color = "Panda",
            CodigoBarras = "7791234567891",
            StockFisico = 4,
            TiendanubeVariantId = "var-222"
        };

        _context.Productos.Add(producto);
        _context.Variantes.Add(variante);
        await _context.SaveChangesAsync();

        var outboxMessage = new OutboxMessage
        {
            Id = Guid.NewGuid(),
            TipoEvento = "StockReducidoEnPOS",
            ContenidoJson = JsonSerializer.Serialize(new { VarianteId = variante.Id, CantidadDescontada = 2 }),
            FechaOcurrenciaUtc = DateTime.UtcNow,
            FechaProcesadoUtc = null,
            Intentos = 0
        };
        _context.OutboxMessages.Add(outboxMessage);
        await _context.SaveChangesAsync();

        var fakeClient = new FakeTiendanubeApiClient { SimularFallo = true };

        var services = new ServiceCollection();
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseSqlite(_connection)
            .Options;
        services.AddScoped(_ => new AppDbContext(options));
        services.AddScoped<Dastik.Api.Domain.Integrations.Tiendanube.ITiendanubeApiClient>(_ => fakeClient);
        var serviceProvider = services.BuildServiceProvider();

        var processor = new OutboxMessageProcessor(
            serviceProvider,
            NullLogger<OutboxMessageProcessor>.Instance,
            TimeSpan.FromSeconds(1));

        // Act
        await processor.ProcessPendingMessagesAsync();

        // Assert
        fakeClient.FueLlamado.Should().BeTrue();

        var mensajeEnBd = await _context.OutboxMessages.AsNoTracking().FirstOrDefaultAsync(m => m.Id == outboxMessage.Id);
        mensajeEnBd.Should().NotBeNull();
        mensajeEnBd!.FechaProcesadoUtc.Should().BeNull(); // Debe permanecer pendiente para reintento
        mensajeEnBd.Intentos.Should().Be(1);
        mensajeEnBd.Error.Should().Contain("500 simulado");
    }

    [Fact]
    public async Task ProcessPendingMessagesAsync_ConVarianteSinTiendanube_NoDebeLlamarATiendanubeYDebeMarcarProcesado()
    {
        // Arrange
        var unidadFisica = new UnidadNegocio
        {
            Nombre = "Local Exclusivo Mostrador",
            TieneTiendaNube = false
        };
        var categoria = new Categoria { Nombre = "Accesorios", Temporada = "2026", EsquemaTalles = "UNICO" };
        var marca = new Marca { Nombre = "Crep Protect" };
        var proveedor = new Proveedor { Nombre = "Proveedor Local", MarkupPorDefecto = 1.4m };

        _context.UnidadesNegocio.Add(unidadFisica);
        _context.Categorias.Add(categoria);
        _context.Marcas.Add(marca);
        _context.Proveedores.Add(proveedor);

        var producto = new Producto
        {
            Nombre = "Kit Limpieza",
            Descripcion = "Kit",
            UnidadNegocio = unidadFisica,
            Categoria = categoria,
            Marca = marca,
            Proveedor = proveedor,
            PrecioVenta = 15000m,
            CostoBase = 8000m,
            MarkupAplicado = 1.875m
        };
        var variante = new Variante
        {
            Producto = producto,
            Talle = "UNICO",
            Color = "Negro",
            CodigoBarras = "7791234567899",
            StockFisico = 15
        };

        _context.Productos.Add(producto);
        _context.Variantes.Add(variante);
        await _context.SaveChangesAsync();

        var outboxMessage = new OutboxMessage
        {
            Id = Guid.NewGuid(),
            TipoEvento = "StockReducidoEnPOS",
            ContenidoJson = JsonSerializer.Serialize(new { VarianteId = variante.Id, CantidadDescontada = 1 }),
            FechaOcurrenciaUtc = DateTime.UtcNow,
            FechaProcesadoUtc = null,
            Intentos = 0
        };
        _context.OutboxMessages.Add(outboxMessage);
        await _context.SaveChangesAsync();

        var fakeClient = new FakeTiendanubeApiClient();

        var services = new ServiceCollection();
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseSqlite(_connection)
            .Options;
        services.AddScoped(_ => new AppDbContext(options));
        services.AddScoped<Dastik.Api.Domain.Integrations.Tiendanube.ITiendanubeApiClient>(_ => fakeClient);
        var serviceProvider = services.BuildServiceProvider();

        var processor = new OutboxMessageProcessor(
            serviceProvider,
            NullLogger<OutboxMessageProcessor>.Instance,
            TimeSpan.FromSeconds(1));

        // Act
        await processor.ProcessPendingMessagesAsync();

        // Assert
        fakeClient.FueLlamado.Should().BeFalse(); // No debe invocar cliente externo
        var mensajeEnBd = await _context.OutboxMessages.AsNoTracking().FirstOrDefaultAsync(m => m.Id == outboxMessage.Id);
        mensajeEnBd.Should().NotBeNull();
        mensajeEnBd!.FechaProcesadoUtc.Should().NotBeNull();
        mensajeEnBd.Intentos.Should().Be(0);
        mensajeEnBd.Error.Should().BeNull();
    }

    private class FakeTiendanubeApiClient : Dastik.Api.Domain.Integrations.Tiendanube.ITiendanubeApiClient
    {
        public bool FueLlamado { get; private set; }
        public string? UltimoStoreId { get; private set; }
        public string? UltimoProductId { get; private set; }
        public string? UltimoVariantId { get; private set; }
        public int UltimoStock { get; private set; }
        public bool SimularFallo { get; set; }

        public Task<Dastik.Api.Common.Result<Dastik.Api.Domain.Integrations.Tiendanube.TiendanubeVariantResponse>> ActualizarStockVarianteAsync(
            string storeId,
            string accessToken,
            string productId,
            string variantId,
            int nuevoStock,
            CancellationToken ct = default)
        {
            FueLlamado = true;
            UltimoStoreId = storeId;
            UltimoProductId = productId;
            UltimoVariantId = variantId;
            UltimoStock = nuevoStock;

            if (SimularFallo)
            {
                return Task.FromResult(Dastik.Api.Common.Result<Dastik.Api.Domain.Integrations.Tiendanube.TiendanubeVariantResponse>.Failure("Error 500 simulado"));
            }

            long v = long.TryParse(variantId, out var parsedV) ? parsedV : 1;
            long p = long.TryParse(productId, out var parsedP) ? parsedP : 1;

            return Task.FromResult(Dastik.Api.Common.Result<Dastik.Api.Domain.Integrations.Tiendanube.TiendanubeVariantResponse>.Success(
                new Dastik.Api.Domain.Integrations.Tiendanube.TiendanubeVariantResponse(v, p, nuevoStock)));
        }
    }
}
