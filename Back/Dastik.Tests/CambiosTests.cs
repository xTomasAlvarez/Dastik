using Dastik.Api.Common;
using Dastik.Api.Domain.Entities;
using Dastik.Api.Features.Caja.RegistrarCambio;
using Dastik.Api.Infrastructure.Persistence;
using FluentAssertions;
using Microsoft.Data.Sqlite;
using Microsoft.EntityFrameworkCore;
using Xunit;

namespace Dastik.Tests;

public class CambiosTests : IDisposable
{
    private readonly SqliteConnection _connection;
    private readonly AppDbContext _context;

    public CambiosTests()
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

    private async Task<(Turno Turno, Variante Devuelta, Variante Nueva)> CrearEscenarioBaseAsync(
        decimal precioDevuelta = 10_000m,
        decimal precioNueva = 10_000m,
        int stockDevuelta = 5,
        int stockNueva = 3,
        bool dastikDevuelta = true,
        bool dastikNueva = true)
    {
        var tenantDastik = new UnidadNegocio
        {
            Nombre = "Dastik",
            TieneTiendaNube = true,
            TiendanubeStoreId = "STORE_1",
            TiendanubeAccessToken = "TOKEN_1"
        };
        var tenantHidden = new UnidadNegocio
        {
            Nombre = "Hidden Sneakers",
            TieneTiendaNube = false
        };
        _context.UnidadesNegocio.AddRange(tenantDastik, tenantHidden);

        var marca = new Marca { Nombre = "Marca Test" };
        var categoria = new Categoria { Nombre = "Remeras" };
        var proveedor = new Proveedor { Nombre = "Proveedor Test" };
        _context.Marcas.Add(marca);
        _context.Categorias.Add(categoria);
        _context.Proveedores.Add(proveedor);

        var productoDevuelta = new Producto
        {
            Nombre = "Remera Oversize Devuelta",
            PrecioVenta = precioDevuelta,
            CostoBase = precioDevuelta * 0.4m,
            UnidadNegocio = dastikDevuelta ? tenantDastik : tenantHidden,
            Marca = marca,
            Categoria = categoria,
            Proveedor = proveedor,
            TiendanubeProductId = dastikDevuelta ? "TN-P1" : null
        };

        var productoNuevo = new Producto
        {
            Nombre = "Remera Oversize Nueva",
            PrecioVenta = precioNueva,
            CostoBase = precioNueva * 0.4m,
            UnidadNegocio = dastikNueva ? tenantDastik : tenantHidden,
            Marca = marca,
            Categoria = categoria,
            Proveedor = proveedor,
            TiendanubeProductId = dastikNueva ? "TN-P2" : null
        };

        _context.Productos.AddRange(productoDevuelta, productoNuevo);

        var varianteDevuelta = new Variante
        {
            Producto = productoDevuelta,
            Talle = "M",
            Color = "Negro",
            StockFisico = stockDevuelta,
            TiendanubeVariantId = dastikDevuelta ? "TN-V1" : null
        };

        var varianteNueva = new Variante
        {
            Producto = productoNuevo,
            Talle = "L",
            Color = "Blanco",
            StockFisico = stockNueva,
            TiendanubeVariantId = dastikNueva ? "TN-V2" : null
        };

        _context.Variantes.AddRange(varianteDevuelta, varianteNueva);

        var turno = new Turno
        {
            EmpleadoId = 1,
            FechaApertura = DateTime.UtcNow,
            SaldoInicial = 5_000m,
            Estado = EstadoTurno.Abierto
        };
        _context.Turnos.Add(turno);

        await _context.SaveChangesAsync();

        return (turno, varianteDevuelta, varianteNueva);
    }

    [Fact]
    public async Task RegistrarCambio_ManoAMano_MismoPrecio_ActualizaStockYNoGeneraPagos()
    {
        // Arrange: mismo precio ($10,000)
        var (turno, devuelta, nueva) = await CrearEscenarioBaseAsync(
            precioDevuelta: 10_000m,
            precioNueva: 10_000m,
            stockDevuelta: 5,
            stockNueva: 3);

        var handler = new RegistrarCambioCommandHandler(_context);
        var command = new RegistrarCambioCommand(
            TurnoId: turno.Id,
            VarianteDevueltaId: devuelta.Id,
            CantidadDevuelta: 1,
            VarianteNuevaId: nueva.Id,
            CantidadNueva: 1,
            MotivoCambio: "Cambio de talle"
        );

        // Act
        var result = await handler.Handle(command, CancellationToken.None);

        // Assert
        result.IsSuccess.Should().BeTrue();
        result.Value.Should().NotBeNull();
        result.Value!.Diferencia.Should().Be(0m);
        result.Value.MontoCobrado.Should().Be(0m);
        result.Value.StockDevueltoFinal.Should().Be(6); // 5 + 1
        result.Value.StockNuevoFinal.Should().Be(2);    // 3 - 1

        var ordenEnBd = await _context.Ordenes
            .Include(o => o.Detalles)
            .Include(o => o.Pagos)
            .FirstOrDefaultAsync(o => o.Id == result.Value.OrdenId);

        ordenEnBd.Should().NotBeNull();
        ordenEnBd!.EsCambio.Should().BeTrue();
        ordenEnBd.MotivoCambio.Should().Be("Cambio de talle");
        ordenEnBd.Total.Should().Be(0m);
        ordenEnBd.Pagos.Should().BeEmpty(); // No infla la caja del día
        ordenEnBd.Detalles.Should().HaveCount(2);

        // Stock en BD persistido correctamente
        var devueltaBd = await _context.Variantes.FindAsync(devuelta.Id);
        var nuevaBd = await _context.Variantes.FindAsync(nueva.Id);
        devueltaBd!.StockFisico.Should().Be(6);
        nuevaBd!.StockFisico.Should().Be(2);
    }

    [Fact]
    public async Task RegistrarCambio_ConDiferenciaAFavorDelLocal_CobraDiferenciaYAsientaPagoEnCaja()
    {
        // Arrange: devuelta ($10,000) vs nueva ($14,500) -> Diferencia: $4,500
        var (turno, devuelta, nueva) = await CrearEscenarioBaseAsync(
            precioDevuelta: 10_000m,
            precioNueva: 14_500m,
            stockDevuelta: 4,
            stockNueva: 2);

        var handler = new RegistrarCambioCommandHandler(_context);
        var command = new RegistrarCambioCommand(
            TurnoId: turno.Id,
            VarianteDevueltaId: devuelta.Id,
            CantidadDevuelta: 1,
            VarianteNuevaId: nueva.Id,
            CantidadNueva: 1,
            MotivoCambio: "Cambio de modelo",
            MetodoPagoDiferencia: MetodoPago.Efectivo,
            MontoDiferenciaPagada: 4_500m
        );

        // Act
        var result = await handler.Handle(command, CancellationToken.None);

        // Assert
        result.IsSuccess.Should().BeTrue();
        result.Value!.Diferencia.Should().Be(4_500m);
        result.Value.MontoCobrado.Should().Be(4_500m);

        var ordenEnBd = await _context.Ordenes
            .Include(o => o.Pagos)
            .FirstOrDefaultAsync(o => o.Id == result.Value.OrdenId);

        ordenEnBd.Should().NotBeNull();
        ordenEnBd!.Total.Should().Be(4_500m); // Solo la diferencia neta
        ordenEnBd.Pagos.Should().HaveCount(1);
        ordenEnBd.Pagos.First().Monto.Should().Be(4_500m);
        ordenEnBd.Pagos.First().MetodoPago.Should().Be(MetodoPago.Efectivo);
    }

    [Fact]
    public async Task RegistrarCambio_StockInsuficienteNuevaVariante_RetornaFalloYSinCambios()
    {
        // Arrange: nueva tiene stock 0
        var (turno, devuelta, nueva) = await CrearEscenarioBaseAsync(stockNueva: 0);

        var handler = new RegistrarCambioCommandHandler(_context);
        var command = new RegistrarCambioCommand(
            TurnoId: turno.Id,
            VarianteDevueltaId: devuelta.Id,
            CantidadDevuelta: 1,
            VarianteNuevaId: nueva.Id,
            CantidadNueva: 1,
            MotivoCambio: "Talle",
            MetodoPagoDiferencia: null
        );

        // Act
        var result = await handler.Handle(command, CancellationToken.None);

        // Assert
        result.IsSuccess.Should().BeFalse();
        result.Error.Should().Contain("Stock insuficiente");

        var devueltaBd = await _context.Variantes.FindAsync(devuelta.Id);
        var nuevaBd = await _context.Variantes.FindAsync(nueva.Id);
        devueltaBd!.StockFisico.Should().Be(5); // No se alteró
        nuevaBd!.StockFisico.Should().Be(0);    // No se alteró
    }

    [Fact]
    public async Task RegistrarCambio_TenantGuardTiendanube_DastikEncolaOutbox_HiddenSneakersNo()
    {
        // Arrange: Devuelta es Dastik (online), Nueva es Hidden Sneakers (física exclusiva)
        var (turno, devuelta, nueva) = await CrearEscenarioBaseAsync(
            dastikDevuelta: true,
            dastikNueva: false);

        var handler = new RegistrarCambioCommandHandler(_context);
        var command = new RegistrarCambioCommand(
            TurnoId: turno.Id,
            VarianteDevueltaId: devuelta.Id,
            CantidadDevuelta: 1,
            VarianteNuevaId: nueva.Id,
            CantidadNueva: 1,
            MotivoCambio: "Marca diferente"
        );

        // Act
        var result = await handler.Handle(command, CancellationToken.None);

        // Assert
        result.IsSuccess.Should().BeTrue();

        var outboxMessages = await _context.OutboxMessages.ToListAsync();
        outboxMessages.Should().HaveCount(1);
        outboxMessages.First().TipoEvento.Should().Be("StockIncrementadoPorCambio");
        outboxMessages.First().ContenidoJson.Should().Contain($"\"VarianteId\":{devuelta.Id}");
    }

    [Fact]
    public async Task RegistrarCambio_TurnoCerrado_RetornaFallo()
    {
        // Arrange
        var (turno, devuelta, nueva) = await CrearEscenarioBaseAsync();
        turno.Estado = EstadoTurno.Cerrado;
        await _context.SaveChangesAsync();

        var handler = new RegistrarCambioCommandHandler(_context);
        var command = new RegistrarCambioCommand(
            TurnoId: turno.Id,
            VarianteDevueltaId: devuelta.Id,
            CantidadDevuelta: 1,
            VarianteNuevaId: nueva.Id,
            CantidadNueva: 1,
            MotivoCambio: "Talle"
        );

        // Act
        var result = await handler.Handle(command, CancellationToken.None);

        // Assert
        result.IsSuccess.Should().BeFalse();
        result.Error.Should().Contain("cerrado");
    }

    [Fact]
    public async Task RegistrarCambio_SinMetodoPagoCuandoHayDiferencia_RetornaFallo()
    {
        // Arrange: nueva cuesta $15,000, devuelta $10,000 -> diferencia $5,000 pero sin método de pago
        var (turno, devuelta, nueva) = await CrearEscenarioBaseAsync(precioDevuelta: 10_000m, precioNueva: 15_000m);

        var handler = new RegistrarCambioCommandHandler(_context);
        var command = new RegistrarCambioCommand(
            TurnoId: turno.Id,
            VarianteDevueltaId: devuelta.Id,
            CantidadDevuelta: 1,
            VarianteNuevaId: nueva.Id,
            CantidadNueva: 1,
            MotivoCambio: "Talle",
            MetodoPagoDiferencia: null // Falta método de pago
        );

        // Act
        var result = await handler.Handle(command, CancellationToken.None);

        // Assert
        result.IsSuccess.Should().BeFalse();
        result.Error.Should().Contain("método de pago");
    }

    [Fact]
    public async Task RegistrarCambio_SaldoAFavorDelCliente_NoGeneraPagosNiInflaCaja()
    {
        // Arrange: devuelta ($15,000) vs nueva ($10,000) -> diferencia -$5,000
        var (turno, devuelta, nueva) = await CrearEscenarioBaseAsync(precioDevuelta: 15_000m, precioNueva: 10_000m);

        var handler = new RegistrarCambioCommandHandler(_context);
        var command = new RegistrarCambioCommand(
            TurnoId: turno.Id,
            VarianteDevueltaId: devuelta.Id,
            CantidadDevuelta: 1,
            VarianteNuevaId: nueva.Id,
            CantidadNueva: 1,
            MotivoCambio: "Modelo más económico"
        );

        // Act
        var result = await handler.Handle(command, CancellationToken.None);

        // Assert
        result.IsSuccess.Should().BeTrue();
        result.Value!.Diferencia.Should().Be(-5_000m);
        result.Value.MontoCobrado.Should().Be(0m);

        var ordenEnBd = await _context.Ordenes
            .Include(o => o.Pagos)
            .FirstOrDefaultAsync(o => o.Id == result.Value.OrdenId);

        ordenEnBd.Should().NotBeNull();
        ordenEnBd!.Total.Should().Be(0m);
        ordenEnBd.Pagos.Should().BeEmpty(); // Caja intacta
    }
}
