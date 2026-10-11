using Dastik.Api.Common;
using Dastik.Api.Domain.Entities;
using Dastik.Api.Domain.Services;
using Dastik.Api.Features.Caja.AbrirTurno;
using Dastik.Api.Features.Caja.CerrarTurno;
using Dastik.Api.Features.Caja.CobrarOrden;
using Dastik.Api.Infrastructure.Persistence;
using FluentAssertions;
using Microsoft.Data.Sqlite;
using Microsoft.EntityFrameworkCore;
using Xunit;

namespace Dastik.Tests;

public class CajaHandlersTests : IDisposable
{
    private readonly SqliteConnection _connection;
    private readonly AppDbContext _context;
    private readonly ICalculadoraComisiones _calculadoraComisiones;

    public CajaHandlersTests()
    {
        _connection = new SqliteConnection("DataSource=:memory:");
        _connection.Open();

        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseSqlite(_connection)
            .Options;

        _context = new AppDbContext(options);
        _context.Database.EnsureCreated();

        _calculadoraComisiones = new CalculadoraComisiones();
    }

    public void Dispose()
    {
        _context.Dispose();
        _connection.Dispose();
    }

    [Fact]
    public async Task AbrirTurno_ConDatosValidos_DeberiaCrearTurnoAbierto()
    {
        // Arrange
        var handler = new AbrirTurnoCommandHandler(_context);
        var command = new AbrirTurnoCommand(EmpleadoId: 1, SaldoInicial: 10_000.00m);

        // Act
        var result = await handler.Handle(command, CancellationToken.None);

        // Assert
        result.IsSuccess.Should().BeTrue();
        result.Value.Should().NotBeNull();
        result.Value!.EmpleadoId.Should().Be(1);
        result.Value.SaldoInicial.Should().Be(10_000.00m);

        var turnoEnBd = await _context.Turnos.FindAsync(result.Value.TurnoId);
        turnoEnBd.Should().NotBeNull();
        turnoEnBd!.Estado.Should().Be(EstadoTurno.Abierto);
        turnoEnBd.SaldoFinal.Should().BeNull();
        turnoEnBd.FechaCierre.Should().BeNull();
    }

    [Fact]
    public async Task AbrirTurno_CuandoEmpleadoYaTieneTurnoAbierto_DeberiaRetornarFallo()
    {
        // Arrange
        var handler = new AbrirTurnoCommandHandler(_context);
        _context.Turnos.Add(new Turno
        {
            EmpleadoId = 1,
            FechaApertura = DateTime.UtcNow,
            SaldoInicial = 5_000.00m,
            Estado = EstadoTurno.Abierto
        });
        await _context.SaveChangesAsync();

        var command = new AbrirTurnoCommand(EmpleadoId: 1, SaldoInicial: 10_000.00m);

        // Act
        var result = await handler.Handle(command, CancellationToken.None);

        // Assert
        result.IsSuccess.Should().BeFalse();
        result.Error.Should().Contain("ya tiene un turno de caja abierto");
    }

    [Fact]
    public async Task CobrarOrden_ConTurnoCerrado_DeberiaRetornarFallo()
    {
        // Arrange
        var turno = new Turno
        {
            EmpleadoId = 1,
            FechaApertura = DateTime.UtcNow.AddHours(-4),
            FechaCierre = DateTime.UtcNow,
            SaldoInicial = 5_000.00m,
            SaldoFinal = 5_000.00m,
            Estado = EstadoTurno.Cerrado
        };
        _context.Turnos.Add(turno);
        await _context.SaveChangesAsync();

        var handler = new CobrarOrdenCommandHandler(_context, _calculadoraComisiones);
        var command = new CobrarOrdenCommand(
            TurnoId: turno.Id,
            Items: new List<ItemCobroDto> { new(VarianteId: 1, Cantidad: 1, PrecioUnitario: 20_000.00m) },
            Pagos: new List<PagoCobroDto> { new(MetodoPago.Efectivo, 20_000.00m) }
        );

        // Act
        var result = await handler.Handle(command, CancellationToken.None);

        // Assert
        result.IsSuccess.Should().BeFalse();
        result.Error.Should().Contain("cerrado");
    }

    [Fact]
    public async Task CobrarOrden_CuandoPagosNoCoincidenConTotal_DeberiaRetornarFallo()
    {
        // Arrange
        var turno = new Turno
        {
            EmpleadoId = 1,
            FechaApertura = DateTime.UtcNow,
            SaldoInicial = 5_000.00m,
            Estado = EstadoTurno.Abierto
        };
        _context.Turnos.Add(turno);
        await _context.SaveChangesAsync();

        var handler = new CobrarOrdenCommandHandler(_context, _calculadoraComisiones);
        var command = new CobrarOrdenCommand(
            TurnoId: turno.Id,
            Items: new List<ItemCobroDto> { new(VarianteId: 1, Cantidad: 1, PrecioUnitario: 30_000.00m) },
            Pagos: new List<PagoCobroDto> { new(MetodoPago.Efectivo, 25_000.00m) } // Pagos no cubren el total
        );

        // Act
        var result = await handler.Handle(command, CancellationToken.None);

        // Assert
        result.IsSuccess.Should().BeFalse();
        result.Error.Should().Contain("no coincide");
    }

    [Fact]
    public async Task CobrarOrden_ConStockInsuficiente_DeberiaRetornarFalloSinDescontarStock()
    {
        // Arrange
        var turno = new Turno
        {
            EmpleadoId = 1,
            FechaApertura = DateTime.UtcNow,
            SaldoInicial = 5_000.00m,
            Estado = EstadoTurno.Abierto
        };
        _context.Turnos.Add(turno);

        var (unidad, categoria, marca, proveedor) = CrearDependenciasCatalogo();
        var producto = new Producto
        {
            UnidadNegocio = unidad,
            Categoria = categoria,
            Marca = marca,
            Proveedor = proveedor,
            Nombre = "Remera Oversize",
            CostoBase = 10_000.00m,
            MarkupAplicado = 1.5m,
            PrecioVenta = 15_000.00m,
            Activo = true
        };
        var variante = new Variante
        {
            Producto = producto,
            Talle = "L",
            Color = "Negro",
            CodigoBarras = "2000000000017",
            StockFisico = 2 // Solo 2 unidades disponibles
        };
        _context.Variantes.Add(variante);
        await _context.SaveChangesAsync();

        var handler = new CobrarOrdenCommandHandler(_context, _calculadoraComisiones);
        var command = new CobrarOrdenCommand(
            TurnoId: turno.Id,
            Items: new List<ItemCobroDto> { new(VarianteId: variante.Id, Cantidad: 5, PrecioUnitario: 15_000.00m) }, // Solicita 5
            Pagos: new List<PagoCobroDto> { new(MetodoPago.Efectivo, 75_000.00m) }
        );

        // Act
        var result = await handler.Handle(command, CancellationToken.None);

        // Assert
        result.IsSuccess.Should().BeFalse();
        result.Error.Should().Contain("Stock insuficiente");

        // Verificar que el stock físico permanezca inalterado
        var varianteEnBd = await _context.Variantes.FindAsync(variante.Id);
        varianteEnBd!.StockFisico.Should().Be(2);
    }

    [Fact]
    public async Task CobrarOrden_TransaccionExitosa_DeberiaDescontarStockYRegistrarOrden()
    {
        // Arrange
        var turno = new Turno
        {
            EmpleadoId = 1,
            FechaApertura = DateTime.UtcNow,
            SaldoInicial = 10_000.00m,
            Estado = EstadoTurno.Abierto
        };
        _context.Turnos.Add(turno);

        var (unidad, categoria, marca, proveedor) = CrearDependenciasCatalogo();
        var producto = new Producto
        {
            UnidadNegocio = unidad,
            Categoria = categoria,
            Marca = marca,
            Proveedor = proveedor,
            Nombre = "Zapatilla Jordan Retro",
            CostoBase = 80_000.00m,
            MarkupAplicado = 1.5m,
            PrecioVenta = 130_000.00m,
            Activo = true
        };
        var variante = new Variante
        {
            Producto = producto,
            Talle = "42",
            Color = "Blanco/Rojo",
            CodigoBarras = "2000000000024",
            StockFisico = 10
        };
        _context.Variantes.Add(variante);
        await _context.SaveChangesAsync();

        var handler = new CobrarOrdenCommandHandler(_context, _calculadoraComisiones);
        var command = new CobrarOrdenCommand(
            TurnoId: turno.Id,
            Items: new List<ItemCobroDto> { new(VarianteId: variante.Id, Cantidad: 1, PrecioUnitario: 130_000.00m) },
            Pagos: new List<PagoCobroDto>
            {
                new(MetodoPago.Efectivo, 30_000.00m),
                new(MetodoPago.Transferencia, 100_000.00m)
            }
        );

        // Act
        var result = await handler.Handle(command, CancellationToken.None);

        // Assert
        result.IsSuccess.Should().BeTrue();
        result.Value.Should().NotBeNull();
        result.Value!.Total.Should().Be(130_000.00m);
        result.Value.CantidadItems.Should().Be(1);

        // Verificar descuento atómico de stock
        var varianteEnBd = await _context.Variantes.FindAsync(variante.Id);
        varianteEnBd!.StockFisico.Should().Be(9);

        // Verificar orden persistida con detalles y pagos
        var ordenEnBd = await _context.Ordenes
            .Include(o => o.Detalles)
            .Include(o => o.Pagos)
            .FirstOrDefaultAsync(o => o.Id == result.Value.OrdenId);

        ordenEnBd.Should().NotBeNull();
        ordenEnBd!.Estado.Should().Be(EstadoOrden.Pagada);
        ordenEnBd.Detalles.Should().HaveCount(1);
        ordenEnBd.Pagos.Should().HaveCount(2);
    }

    [Fact]
    public async Task CobrarOrden_CuandoArticuloEsDeHiddenSneakers_DeberiaGenerarOutboxMessage()
    {
        // Arrange
        var turno = new Turno
        {
            EmpleadoId = 1,
            FechaApertura = DateTime.UtcNow,
            SaldoInicial = 10_000.00m,
            Estado = EstadoTurno.Abierto
        };
        _context.Turnos.Add(turno);

        var unidadHidden = new UnidadNegocio { Nombre = UnidadNegocio.HiddenSneakers, TieneTiendaNube = true };
        var categoria = new Categoria { Nombre = "Calzado" };
        var marca = new Marca { Nombre = "Nike" };
        var proveedor = new Proveedor { Nombre = "Importadora" };
        _context.UnidadesNegocio.Add(unidadHidden);
        _context.Categorias.Add(categoria);
        _context.Marcas.Add(marca);
        _context.Proveedores.Add(proveedor);

        var producto = new Producto
        {
            UnidadNegocio = unidadHidden,
            Categoria = categoria,
            Marca = marca,
            Proveedor = proveedor,
            Nombre = "Nike Dunk Low Panda",
            CostoBase = 80_000.00m,
            MarkupAplicado = 1.6m,
            PrecioVenta = 128_000.00m,
            Activo = true
        };
        var variante = new Variante
        {
            Producto = producto,
            Talle = "US 10",
            Color = "Black/White",
            CodigoBarras = "2000000000099",
            StockFisico = 5
        };
        _context.Variantes.Add(variante);
        await _context.SaveChangesAsync();

        var handler = new CobrarOrdenCommandHandler(_context, _calculadoraComisiones);
        var command = new CobrarOrdenCommand(
            TurnoId: turno.Id,
            Items: new List<ItemCobroDto> { new(VarianteId: variante.Id, Cantidad: 2, PrecioUnitario: 128_000.00m) },
            Pagos: new List<PagoCobroDto> { new(MetodoPago.Tarjeta, 256_000.00m) }
        );

        // Act
        var result = await handler.Handle(command, CancellationToken.None);

        // Assert
        result.IsSuccess.Should().BeTrue();

        var outboxMessages = await _context.OutboxMessages.ToListAsync();
        outboxMessages.Should().ContainSingle();

        var outbox = outboxMessages.Single();
        outbox.TipoEvento.Should().Be("StockReducidoEnPOS");
        outbox.FechaProcesadoUtc.Should().BeNull();
        outbox.Intentos.Should().Be(0);
        outbox.ContenidoJson.Should().Contain($"\"VarianteId\":{variante.Id}");
        outbox.ContenidoJson.Should().Contain("\"CantidadDescontada\":2");
    }

    [Fact]
    public async Task CobrarOrden_CuandoArticuloEsDeDastik_NoDebeGenerarOutboxMessage()
    {
        // Arrange
        var turno = new Turno
        {
            EmpleadoId = 1,
            FechaApertura = DateTime.UtcNow,
            SaldoInicial = 10_000.00m,
            Estado = EstadoTurno.Abierto
        };
        _context.Turnos.Add(turno);

        var (unidadDastik, categoria, marca, proveedor) = CrearDependenciasCatalogo();
        var producto = new Producto
        {
            UnidadNegocio = unidadDastik,
            Categoria = categoria,
            Marca = marca,
            Proveedor = proveedor,
            Nombre = "Remera Oversize Básica",
            CostoBase = 15_000.00m,
            MarkupAplicado = 1.5m,
            PrecioVenta = 22_500.00m,
            Activo = true
        };
        var variante = new Variante
        {
            Producto = producto,
            Talle = "L",
            Color = "Negro",
            CodigoBarras = "2000000000088",
            StockFisico = 10
        };
        _context.Variantes.Add(variante);
        await _context.SaveChangesAsync();

        var handler = new CobrarOrdenCommandHandler(_context, _calculadoraComisiones);
        var command = new CobrarOrdenCommand(
            TurnoId: turno.Id,
            Items: new List<ItemCobroDto> { new(VarianteId: variante.Id, Cantidad: 1, PrecioUnitario: 22_500.00m) },
            Pagos: new List<PagoCobroDto> { new(MetodoPago.Efectivo, 22_500.00m) }
        );

        // Act
        var result = await handler.Handle(command, CancellationToken.None);

        // Assert
        result.IsSuccess.Should().BeTrue();

        var outboxMessages = await _context.OutboxMessages.ToListAsync();
        outboxMessages.Should().BeEmpty();
    }

    [Fact]
    public async Task CerrarTurno_ArqueoExacto_DeberiaCalcularDiferenciaCero()
    {
        // Arrange
        var turno = new Turno
        {
            EmpleadoId = 1,
            FechaApertura = DateTime.UtcNow.AddHours(-6),
            SaldoInicial = 10_000.00m,
            Estado = EstadoTurno.Abierto
        };
        _context.Turnos.Add(turno);

        // Venta 1: $15.000 en efectivo
        var orden1 = new Orden
        {
            Turno = turno,
            Fecha = DateTime.UtcNow.AddHours(-4),
            Total = 15_000.00m,
            Estado = EstadoOrden.Pagada,
            Pagos = new List<Pago> { new() { MetodoPago = MetodoPago.Efectivo, Monto = 15_000.00m } }
        };
        // Venta 2: $20.000 pagados por transferencia (no suma al efectivo de caja)
        var orden2 = new Orden
        {
            Turno = turno,
            Fecha = DateTime.UtcNow.AddHours(-2),
            Total = 20_000.00m,
            Estado = EstadoOrden.Pagada,
            Pagos = new List<Pago> { new() { MetodoPago = MetodoPago.Transferencia, Monto = 20_000.00m } }
        };
        _context.Ordenes.AddRange(orden1, orden2);
        await _context.SaveChangesAsync();

        // Saldo esperado = 10.000 (inicial) + 15.000 (efectivo) = 25.000
        var handler = new CerrarTurnoCommandHandler(_context);
        var command = new CerrarTurnoCommand(TurnoId: turno.Id, SaldoFinal: 25_000.00m);

        // Act
        var result = await handler.Handle(command, CancellationToken.None);

        // Assert
        result.IsSuccess.Should().BeTrue();
        result.Value.Should().NotBeNull();
        result.Value!.SaldoInicial.Should().Be(10_000.00m);
        result.Value.TotalVentasEfectivo.Should().Be(15_000.00m);
        result.Value.SaldoEsperado.Should().Be(25_000.00m);
        result.Value.SaldoFinal.Should().Be(25_000.00m);
        result.Value.Diferencia.Should().Be(0.00m);

        var turnoEnBd = await _context.Turnos.FindAsync(turno.Id);
        turnoEnBd!.Estado.Should().Be(EstadoTurno.Cerrado);
        turnoEnBd.FechaCierre.Should().NotBeNull();
    }

    [Fact]
    public async Task CerrarTurno_ConFaltanteYConSobrante_DeberiaCalcularDiferenciasCorrectamente()
    {
        // Arrange: Turno con saldo esperado = 10.000 + 20.000 = 30.000
        var turno = new Turno
        {
            EmpleadoId = 2,
            FechaApertura = DateTime.UtcNow.AddHours(-5),
            SaldoInicial = 10_000.00m,
            Estado = EstadoTurno.Abierto
        };
        _context.Turnos.Add(turno);
        var orden = new Orden
        {
            Turno = turno,
            Fecha = DateTime.UtcNow.AddHours(-1),
            Total = 20_000.00m,
            Estado = EstadoOrden.Pagada,
            Pagos = new List<Pago> { new() { MetodoPago = MetodoPago.Efectivo, Monto = 20_000.00m } }
        };
        _context.Ordenes.Add(orden);
        await _context.SaveChangesAsync();

        var handler = new CerrarTurnoCommandHandler(_context);

        // Caso Faltante: El cajero declara 28.000 (Faltante de -2.000)
        var commandFaltante = new CerrarTurnoCommand(TurnoId: turno.Id, SaldoFinal: 28_000.00m);
        var resultFaltante = await handler.Handle(commandFaltante, CancellationToken.None);

        resultFaltante.IsSuccess.Should().BeTrue();
        resultFaltante.Value!.Diferencia.Should().Be(-2_000.00m);
    }

    private (UnidadNegocio, Categoria, Marca, Proveedor) CrearDependenciasCatalogo()
    {
        var unidad = new UnidadNegocio { Nombre = "Dastik" };
        var categoria = new Categoria { Nombre = "Indumentaria" };
        var marca = new Marca { Nombre = "Dastik Oficial" };
        var proveedor = new Proveedor { Nombre = "Textil Central S.A." };
        _context.UnidadesNegocio.Add(unidad);
        _context.Categorias.Add(categoria);
        _context.Marcas.Add(marca);
        _context.Proveedores.Add(proveedor);
        return (unidad, categoria, marca, proveedor);
    }
}
