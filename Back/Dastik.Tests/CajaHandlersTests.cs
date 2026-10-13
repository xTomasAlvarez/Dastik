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
    public async Task CobrarOrden_CuandoArticuloEsDeDastikConTiendanube_DeberiaGenerarOutboxMessage()
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

        var unidadDastik = new UnidadNegocio
        {
            Nombre = UnidadNegocio.Dastik,
            TieneTiendaNube = true,
            TiendanubeStoreId = "998877",
            TiendanubeAccessToken = "token-secret-dastik"
        };
        var categoria = new Categoria { Nombre = "Indumentaria" };
        var marca = new Marca { Nombre = "Dastik" };
        var proveedor = new Proveedor { Nombre = "Textil Central" };
        _context.UnidadesNegocio.Add(unidadDastik);
        _context.Categorias.Add(categoria);
        _context.Marcas.Add(marca);
        _context.Proveedores.Add(proveedor);

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
            Items: new List<ItemCobroDto> { new(VarianteId: variante.Id, Cantidad: 2, PrecioUnitario: 22_500.00m) },
            Pagos: new List<PagoCobroDto> { new(MetodoPago.Tarjeta, 45_000.00m) }
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
    public async Task CobrarOrden_CuandoArticuloEsDeHiddenSneakersFisico_NoDebeGenerarOutboxMessage()
    {
        // Arrange: Hidden Sneakers opera exclusivamente en local físico (TieneTiendaNube == false)
        var turno = new Turno
        {
            EmpleadoId = 1,
            FechaApertura = DateTime.UtcNow,
            SaldoInicial = 10_000.00m,
            Estado = EstadoTurno.Abierto
        };
        _context.Turnos.Add(turno);

        var unidadHidden = new UnidadNegocio
        {
            Nombre = UnidadNegocio.HiddenSneakers,
            TieneTiendaNube = false
        };
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
            Items: new List<ItemCobroDto> { new(VarianteId: variante.Id, Cantidad: 1, PrecioUnitario: 128_000.00m) },
            Pagos: new List<PagoCobroDto> { new(MetodoPago.Efectivo, 128_000.00m) }
        );

        // Act
        var result = await handler.Handle(command, CancellationToken.None);

        // Assert
        result.IsSuccess.Should().BeTrue();

        // 1. Descuenta stock físico local
        var varianteEnBd = await _context.Variantes.FindAsync(variante.Id);
        varianteEnBd!.StockFisico.Should().Be(4);

        // 2. Tenant Guard: NO genera OutboxMessage para Tiendanube
        var outboxMessages = await _context.OutboxMessages.ToListAsync();
        outboxMessages.Should().BeEmpty();
    }

    [Fact]
    public async Task CobrarOrden_VentaMixtaDastikYHiddenSneakers_DebeGenerarOutboxSoloParaArticuloDeDastik()
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

        var unidadDastik = new UnidadNegocio { Nombre = UnidadNegocio.Dastik, TieneTiendaNube = true };
        var unidadHidden = new UnidadNegocio { Nombre = UnidadNegocio.HiddenSneakers, TieneTiendaNube = false };
        var categoria = new Categoria { Nombre = "General" };
        var marca = new Marca { Nombre = "General" };
        var proveedor = new Proveedor { Nombre = "General" };

        _context.UnidadesNegocio.AddRange(unidadDastik, unidadHidden);
        _context.Categorias.Add(categoria);
        _context.Marcas.Add(marca);
        _context.Proveedores.Add(proveedor);

        var prodDastik = new Producto
        {
            UnidadNegocio = unidadDastik,
            Categoria = categoria,
            Marca = marca,
            Proveedor = proveedor,
            Nombre = "Remera Dastik",
            PrecioVenta = 20_000m
        };
        var varDastik = new Variante
        {
            Producto = prodDastik,
            Talle = "M",
            Color = "Negro",
            CodigoBarras = "1111111111111",
            StockFisico = 10
        };

        var prodHidden = new Producto
        {
            UnidadNegocio = unidadHidden,
            Categoria = categoria,
            Marca = marca,
            Proveedor = proveedor,
            Nombre = "Sneakers Dunk",
            PrecioVenta = 100_000m
        };
        var varHidden = new Variante
        {
            Producto = prodHidden,
            Talle = "US 9",
            Color = "Panda",
            CodigoBarras = "2222222222222",
            StockFisico = 5
        };

        _context.Variantes.AddRange(varDastik, varHidden);
        await _context.SaveChangesAsync();

        var handler = new CobrarOrdenCommandHandler(_context, _calculadoraComisiones);
        var command = new CobrarOrdenCommand(
            TurnoId: turno.Id,
            Items: new List<ItemCobroDto>
            {
                new(VarianteId: varDastik.Id, Cantidad: 1, PrecioUnitario: 20_000m),
                new(VarianteId: varHidden.Id, Cantidad: 1, PrecioUnitario: 100_000m)
            },
            Pagos: new List<PagoCobroDto> { new(MetodoPago.Efectivo, 120_000m) }
        );

        // Act
        var result = await handler.Handle(command, CancellationToken.None);

        // Assert
        result.IsSuccess.Should().BeTrue();

        // Ambos descuentan stock físico
        var varDastikBd = await _context.Variantes.FindAsync(varDastik.Id);
        var varHiddenBd = await _context.Variantes.FindAsync(varHidden.Id);
        varDastikBd!.StockFisico.Should().Be(9);
        varHiddenBd!.StockFisico.Should().Be(4);

        // Pero solo el producto de Dastik genera OutboxMessage para Tiendanube
        var outboxMessages = await _context.OutboxMessages.ToListAsync();
        outboxMessages.Should().ContainSingle();
        outboxMessages.Single().ContenidoJson.Should().Contain($"\"VarianteId\":{varDastik.Id}");
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

    [Fact]
    public async Task CerrarTurno_ConGastosTurno_DeberiaPersistirGastosYCalcularDiferenciaCorrectamente()
    {
        // Arrange
        var turno = new Turno
        {
            EmpleadoId = 1,
            FechaApertura = DateTime.UtcNow.AddHours(-4),
            SaldoInicial = 10_000.00m,
            Estado = EstadoTurno.Abierto
        };
        _context.Turnos.Add(turno);

        // Ventas: 30.000 en Efectivo, 15.000 en Transferencia, 20.000 en Débito
        var ordenEfectivo = new Orden
        {
            Turno = turno,
            Fecha = DateTime.UtcNow.AddHours(-2),
            Total = 30_000.00m,
            Estado = EstadoOrden.Pagada,
            Pagos = new List<Pago> { new() { MetodoPago = MetodoPago.Efectivo, Monto = 30_000.00m } }
        };
        var ordenTransferencia = new Orden
        {
            Turno = turno,
            Fecha = DateTime.UtcNow.AddHours(-1),
            Total = 15_000.00m,
            Estado = EstadoOrden.Pagada,
            Pagos = new List<Pago> { new() { MetodoPago = MetodoPago.Transferencia, Monto = 15_000.00m } }
        };
        _context.Ordenes.AddRange(ordenEfectivo, ordenTransferencia);
        await _context.SaveChangesAsync();

        var handler = new CerrarTurnoCommandHandler(_context);

        // Gastos: 5.000 (Uber / Almuerzo)
        // Saldo Inicial = 10.000, Efectivo = 30.000, Gastos = 5.000 -> Efectivo Esperado en gaveta = 35.000
        // Cajero declara en gaveta: 35.000 (Caja Cuadrada)
        var command = new CerrarTurnoCommand(
            TurnoId: turno.Id,
            SaldoFinal: 35_000.00m,
            GastosTurno: 5_000.00m
        );

        // Act
        var result = await handler.Handle(command, CancellationToken.None);

        // Assert
        result.IsSuccess.Should().BeTrue();
        result.Value.Should().NotBeNull();
        result.Value!.SaldoFinal.Should().Be(35_000.00m);
        result.Value.Diferencia.Should().Be(0m);

        var turnoEnBd = await _context.Turnos.FindAsync(turno.Id);
        turnoEnBd.Should().NotBeNull();
        turnoEnBd!.GastosTurno.Should().Be(5_000.00m);
        turnoEnBd.SaldoFinal.Should().Be(35_000.00m);
        turnoEnBd.Estado.Should().Be(EstadoTurno.Cerrado);
    }

    [Fact]
    public async Task CerrarTurno_CuandoOtroEmpleadoIntentaCerrarTurno_DeberiaFallar()
    {
        // Arrange: Turno perteneciente al Empleado 10
        var turno = new Turno
        {
            EmpleadoId = 10,
            FechaApertura = DateTime.UtcNow,
            SaldoInicial = 10_000.00m,
            Estado = EstadoTurno.Abierto
        };
        _context.Turnos.Add(turno);
        await _context.SaveChangesAsync();

        var handler = new CerrarTurnoCommandHandler(_context);
        // Empleado 99 intenta cerrar el turno del Empleado 10 (sin ser Admin)
        var command = new CerrarTurnoCommand(
            TurnoId: turno.Id,
            SaldoFinal: 10_000.00m,
            GastosTurno: 0m,
            SolicitanteId: 99,
            EsAdmin: false
        );

        // Act
        var result = await handler.Handle(command, CancellationToken.None);

        // Assert
        result.IsSuccess.Should().BeFalse();
        result.Error.Should().Contain("No tienes permisos para cerrar el turno de otro operador");
    }

    [Fact]
    public async Task CerrarTurno_CuandoAdminCierraTurnoDeOtroEmpleado_DeberiaPermitirse()
    {
        // Arrange: Turno perteneciente al Empleado 10
        var turno = new Turno
        {
            EmpleadoId = 10,
            FechaApertura = DateTime.UtcNow,
            SaldoInicial = 10_000.00m,
            Estado = EstadoTurno.Abierto
        };
        _context.Turnos.Add(turno);
        await _context.SaveChangesAsync();

        var handler = new CerrarTurnoCommandHandler(_context);
        // Admin (Dueño) cierra el turno del Empleado 10
        var command = new CerrarTurnoCommand(
            TurnoId: turno.Id,
            SaldoFinal: 10_000.00m,
            GastosTurno: 0m,
            SolicitanteId: 1, // ID del Admin
            EsAdmin: true
        );

        // Act
        var result = await handler.Handle(command, CancellationToken.None);

        // Assert
        result.IsSuccess.Should().BeTrue();
        result.Value.Should().NotBeNull();
        result.Value!.SaldoFinal.Should().Be(10_000.00m);
    }

    [Fact]
    public async Task CobrarOrden_ConPrecioInferiorAlMinimoDeCatalogo_DeberiaRetornarFallo()
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
            Nombre = "Buzo Hoodie Oversize",
            CostoBase = 20_000.00m,
            MarkupAplicado = 1.5m,
            PrecioVenta = 30_000.00m,
            Activo = true
        };
        var variante = new Variante
        {
            Producto = producto,
            Talle = "M",
            Color = "Gris",
            CodigoBarras = "2000000000093",
            StockFisico = 10
        };
        _context.Variantes.Add(variante);
        await _context.SaveChangesAsync();

        var handler = new CobrarOrdenCommandHandler(_context, _calculadoraComisiones);
        // Intento de cobrar a $5.000 cuando el precio de catálogo es $30.000 (mínimo permitido $15.000)
        var command = new CobrarOrdenCommand(
            TurnoId: turno.Id,
            Items: new List<ItemCobroDto> { new(VarianteId: variante.Id, Cantidad: 1, PrecioUnitario: 5_000.00m) },
            Pagos: new List<PagoCobroDto> { new(MetodoPago.Efectivo, 5_000.00m) }
        );

        // Act
        var result = await handler.Handle(command, CancellationToken.None);

        // Assert
        result.IsSuccess.Should().BeFalse();
        result.Error.Should().Contain("inferior al mínimo permitido");
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
