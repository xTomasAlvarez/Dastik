using Dastik.Api.Domain.Entities;
using Dastik.Api.Features.Metricas.ObtenerMetricasAvanzadas;
using Dastik.Api.Infrastructure.Persistence;
using Microsoft.Data.Sqlite;
using Microsoft.EntityFrameworkCore;
using Xunit;

namespace Dastik.Tests;

public class MetricasAvanzadasTests : IDisposable
{
    private readonly SqliteConnection _connection;
    private readonly AppDbContext _context;

    public MetricasAvanzadasTests()
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
    public async Task ObtenerMetricasAvanzadas_CalculaFinanzasYMediosDePagoCorrectamente()
    {
        // Arrange
        var unidadDastik = new UnidadNegocio { Nombre = UnidadNegocio.Dastik, TieneTiendaNube = true };
        var unidadHidden = new UnidadNegocio { Nombre = UnidadNegocio.HiddenSneakers, TieneTiendaNube = false };
        var categoria = new Categoria { Nombre = "Hoodies" };
        var marca = new Marca { Nombre = "Dastik" };
        var proveedor = new Proveedor { Nombre = "Taller Central", MarkupPorDefecto = 1.5m };
        var usuario = new Usuario { Nombre = "Vendedor", Rol = RolUsuario.Empleado, Email = "vendedor@dastik.com", PasswordHash = "hash" };

        _context.UnidadesNegocio.AddRange(unidadDastik, unidadHidden);
        _context.Categorias.Add(categoria);
        _context.Marcas.Add(marca);
        _context.Proveedores.Add(proveedor);
        _context.Usuarios.Add(usuario);
        await _context.SaveChangesAsync();

        var turno = new Turno
        {
            EmpleadoId = usuario.Id,
            SaldoInicial = 10000m,
            GastosTurno = 3500m, // Uber y almuerzo
            FechaApertura = DateTime.UtcNow,
            Estado = EstadoTurno.Cerrado
        };
        _context.Turnos.Add(turno);
        await _context.SaveChangesAsync();

        var prodDastik = new Producto
        {
            Nombre = "Zip Hoodie Signature",
            UnidadNegocioId = unidadDastik.Id,
            CategoriaId = categoria.Id,
            MarcaId = marca.Id,
            ProveedorId = proveedor.Id,
            PrecioVenta = 50000m,
            CostoBase = 20000m,
            Activo = true
        };
        var varDastik = new Variante { Talle = "M", Color = "Negro", StockFisico = 10, CodigoBarras = "2000000000012", Producto = prodDastik };

        var prodHidden = new Producto
        {
            Nombre = "Sneakers Retro",
            UnidadNegocioId = unidadHidden.Id,
            CategoriaId = categoria.Id,
            MarcaId = marca.Id,
            ProveedorId = proveedor.Id,
            PrecioVenta = 80000m,
            CostoBase = 45000m,
            Activo = true
        };
        var varHidden = new Variante { Talle = "42", Color = "Blanco", StockFisico = 4, CodigoBarras = "2000000000029", Producto = prodHidden };

        _context.Productos.AddRange(prodDastik, prodHidden);
        _context.Variantes.AddRange(varDastik, varHidden);
        await _context.SaveChangesAsync();

        // Orden 1: 2 Hoodies Dastik ($100.000) pagados en Efectivo
        var orden1 = new Orden
        {
            TurnoId = turno.Id,
            Fecha = DateTime.UtcNow,
            Total = 100000m,
            Estado = EstadoOrden.Pagada
        };
        orden1.Detalles.Add(new DetalleOrden { VarianteId = varDastik.Id, Cantidad = 2, PrecioUnitario = 50000m, Subtotal = 100000m });
        orden1.Pagos.Add(new Pago { MetodoPago = MetodoPago.Efectivo, Monto = 100000m });

        // Orden 2: 1 Sneaker Hidden ($80.000) pagado por Transferencia
        var orden2 = new Orden
        {
            TurnoId = turno.Id,
            Fecha = DateTime.UtcNow,
            Total = 80000m,
            Estado = EstadoOrden.Pagada
        };
        orden2.Detalles.Add(new DetalleOrden { VarianteId = varHidden.Id, Cantidad = 1, PrecioUnitario = 80000m, Subtotal = 80000m });
        orden2.Pagos.Add(new Pago { MetodoPago = MetodoPago.Transferencia, Monto = 80000m });

        _context.Ordenes.AddRange(orden1, orden2);
        await _context.SaveChangesAsync();

        var handler = new ObtenerMetricasAvanzadasHandler(_context);

        // Act
        var result = await handler.Handle(new ObtenerMetricasAvanzadasQuery("mes"), CancellationToken.None);

        // Assert
        Assert.True(result.IsSuccess);
        var metricas = result.Value!;

        // Ingresos y Costos:
        // Ingresos = 100000 + 80000 = 180000
        // Costo = (2 * 20000) + (1 * 45000) = 40000 + 45000 = 85000
        // Ganancia Bruta = 180000 - 85000 = 95000
        Assert.Equal(180000m, metricas.IngresosBrutos);
        Assert.Equal(85000m, metricas.CostoMercaderiaVendida);
        Assert.Equal(95000m, metricas.GananciaBruta);
        Assert.Equal(3500m, metricas.GastosCajaRegistrados);
        Assert.Equal(2, metricas.CantidadOperaciones);
        Assert.Equal(90000m, metricas.TicketPromedio);

        // Medios de pago
        Assert.Equal(100000m, metricas.TotalEfectivo);
        Assert.Equal(80000m, metricas.TotalTransferencia);
        Assert.Equal(0m, metricas.TotalDebito);
        Assert.Equal(0m, metricas.TotalCredito);

        // Comparativa por Unidad de Negocio
        Assert.Equal(100000m, metricas.IngresosDastik);
        Assert.Equal(80000m, metricas.IngresosHiddenSneakers);
    }

    [Fact]
    public async Task ObtenerMetricasAvanzadas_CalculaTopMasVendidosYVelocidadDiaria()
    {
        // Arrange
        var unidad = new UnidadNegocio { Nombre = "Dastik", TieneTiendaNube = true };
        var categoria = new Categoria { Nombre = "Remeras" };
        var marca = new Marca { Nombre = "Dastik" };
        var proveedor = new Proveedor { Nombre = "Taller", MarkupPorDefecto = 1.5m };
        var usuario = new Usuario { Nombre = "Admin", Rol = RolUsuario.Admin, Email = "admin@dastik.com", PasswordHash = "hash" };

        _context.UnidadesNegocio.Add(unidad);
        _context.Categorias.Add(categoria);
        _context.Marcas.Add(marca);
        _context.Proveedores.Add(proveedor);
        _context.Usuarios.Add(usuario);
        await _context.SaveChangesAsync();

        var turno = new Turno { EmpleadoId = usuario.Id, SaldoInicial = 1000m, FechaApertura = DateTime.UtcNow };
        _context.Turnos.Add(turno);
        await _context.SaveChangesAsync();

        var prod = new Producto { Nombre = "Remera Boxy", UnidadNegocioId = unidad.Id, CategoriaId = categoria.Id, MarcaId = marca.Id, ProveedorId = proveedor.Id, PrecioVenta = 30000m, CostoBase = 12000m, Activo = true };
        // Variante con stock bajo (2 unidades): si vende 14 unidades en la semana (2 por día), la demanda en 7 días es 14, por lo que necesita reposición urgente
        var varianteAltaRotacion = new Variante { Talle = "L", Color = "Crudo", StockFisico = 2, CodigoBarras = "2000000000036", Producto = prod };

        _context.Productos.Add(prod);
        _context.Variantes.Add(varianteAltaRotacion);
        await _context.SaveChangesAsync();

        var orden = new Orden { TurnoId = turno.Id, Fecha = DateTime.UtcNow, Total = 420000m, Estado = EstadoOrden.Pagada };
        orden.Detalles.Add(new DetalleOrden { VarianteId = varianteAltaRotacion.Id, Cantidad = 14, PrecioUnitario = 30000m, Subtotal = 420000m });
        orden.Pagos.Add(new Pago { MetodoPago = MetodoPago.Debito, Monto = 420000m });

        _context.Ordenes.Add(orden);
        await _context.SaveChangesAsync();

        var handler = new ObtenerMetricasAvanzadasHandler(_context);

        // Act - Período Semana (7 días)
        var result = await handler.Handle(new ObtenerMetricasAvanzadasQuery("semana"), CancellationToken.None);

        // Assert
        Assert.True(result.IsSuccess);
        var top = Assert.Single(result.Value!.TopMasVendidos);
        Assert.Equal("Remera Boxy", top.ProductoNombre);
        Assert.Equal("L", top.Talle);
        Assert.Equal(14, top.UnidadesVendidas);
        Assert.Equal(2.00m, top.VelocidadDiaria); // 14 unidades / 7 días = 2.00 por día
        Assert.True(top.SugerenciaReposicion); // Stock 2 < demanda de 7 días (14)
        Assert.Equal(12, top.CantidadSugerida); // 14 demanda - 2 stock = 12 a reponer
    }

    [Fact]
    public async Task ObtenerMetricasAvanzadas_IdentificaProductosEstancadosConCapitalInmovilizado()
    {
        // Arrange
        var unidad = new UnidadNegocio { Nombre = "Dastik", TieneTiendaNube = true };
        var categoria = new Categoria { Nombre = "Camperas" };
        var marca = new Marca { Nombre = "Dastik" };
        var proveedor = new Proveedor { Nombre = "Taller", MarkupPorDefecto = 1.5m };

        _context.UnidadesNegocio.Add(unidad);
        _context.Categorias.Add(categoria);
        _context.Marcas.Add(marca);
        _context.Proveedores.Add(proveedor);
        await _context.SaveChangesAsync();

        var prodEstancado = new Producto
        {
            Nombre = "Puffer Jacket 90s",
            UnidadNegocioId = unidad.Id,
            CategoriaId = categoria.Id,
            MarcaId = marca.Id,
            ProveedorId = proveedor.Id,
            PrecioVenta = 120000m,
            CostoBase = 60000m,
            Activo = true
        };
        // 5 unidades estancadas sin ninguna orden en el período -> Capital = 5 * 60000 = $300.000 inmovilizados
        var varEstancada = new Variante { Talle = "XL", Color = "Verde Militar", StockFisico = 5, CodigoBarras = "2000000000043", Producto = prodEstancado };

        _context.Productos.Add(prodEstancado);
        _context.Variantes.Add(varEstancada);
        await _context.SaveChangesAsync();

        var handler = new ObtenerMetricasAvanzadasHandler(_context);

        // Act
        var result = await handler.Handle(new ObtenerMetricasAvanzadasQuery("mes"), CancellationToken.None);

        // Assert
        Assert.True(result.IsSuccess);
        var estancado = Assert.Single(result.Value!.ProductosEstancados);
        Assert.Equal("Puffer Jacket 90s", estancado.ProductoNombre);
        Assert.Equal("XL", estancado.Talle);
        Assert.Equal(5, estancado.StockFisico);
        Assert.Equal(60000m, estancado.CostoBase);
        Assert.Equal(300000m, estancado.CapitalInmovilizado);
    }

    [Fact]
    public async Task ObtenerMetricasAvanzadas_FiltraPorUnidadNegocioCorrectamente()
    {
        // Arrange
        var unidadDastik = new UnidadNegocio { Nombre = UnidadNegocio.Dastik, TieneTiendaNube = true };
        var unidadHidden = new UnidadNegocio { Nombre = UnidadNegocio.HiddenSneakers, TieneTiendaNube = false };
        var categoria = new Categoria { Nombre = "Calzado" };
        var marca = new Marca { Nombre = "Sneakers Co" };
        var proveedor = new Proveedor { Nombre = "Proveedor", MarkupPorDefecto = 1.5m };
        var usuario = new Usuario { Nombre = "Admin", Rol = RolUsuario.Admin, Email = "admin2@dastik.com", PasswordHash = "hash" };

        _context.UnidadesNegocio.AddRange(unidadDastik, unidadHidden);
        _context.Categorias.Add(categoria);
        _context.Marcas.Add(marca);
        _context.Proveedores.Add(proveedor);
        _context.Usuarios.Add(usuario);
        await _context.SaveChangesAsync();

        var turno = new Turno { EmpleadoId = usuario.Id, SaldoInicial = 1000m, FechaApertura = DateTime.UtcNow };
        _context.Turnos.Add(turno);
        await _context.SaveChangesAsync();

        var prodDastik = new Producto { Nombre = "Gorra Dastik", UnidadNegocioId = unidadDastik.Id, CategoriaId = categoria.Id, MarcaId = marca.Id, ProveedorId = proveedor.Id, PrecioVenta = 15000m, CostoBase = 5000m, Activo = true };
        var varDastik = new Variante { Talle = "U", Color = "Negro", StockFisico = 10, CodigoBarras = "2000000000081", Producto = prodDastik };

        var prodHidden = new Producto { Nombre = "Jordan Retro", UnidadNegocioId = unidadHidden.Id, CategoriaId = categoria.Id, MarcaId = marca.Id, ProveedorId = proveedor.Id, PrecioVenta = 90000m, CostoBase = 50000m, Activo = true };
        var varHidden = new Variante { Talle = "41", Color = "Rojo", StockFisico = 3, CodigoBarras = "2000000000098", Producto = prodHidden };

        _context.Productos.AddRange(prodDastik, prodHidden);
        _context.Variantes.AddRange(varDastik, varHidden);
        await _context.SaveChangesAsync();

        var orden = new Orden { TurnoId = turno.Id, Fecha = DateTime.UtcNow, Total = 105000m, Estado = EstadoOrden.Pagada };
        orden.Detalles.Add(new DetalleOrden { VarianteId = varDastik.Id, Cantidad = 1, PrecioUnitario = 15000m, Subtotal = 15000m });
        orden.Detalles.Add(new DetalleOrden { VarianteId = varHidden.Id, Cantidad = 1, PrecioUnitario = 90000m, Subtotal = 90000m });
        orden.Pagos.Add(new Pago { MetodoPago = MetodoPago.Transferencia, Monto = 105000m });
        _context.Ordenes.Add(orden);
        await _context.SaveChangesAsync();

        var handler = new ObtenerMetricasAvanzadasHandler(_context);

        // Act - Filtrar únicamente por Dastik
        var result = await handler.Handle(new ObtenerMetricasAvanzadasQuery("mes", unidadDastik.Id), CancellationToken.None);

        // Assert
        Assert.True(result.IsSuccess);
        Assert.Equal(15000m, result.Value!.IngresosBrutos);
        Assert.Equal(5000m, result.Value!.CostoMercaderiaVendida);
        Assert.Equal(10000m, result.Value!.GananciaBruta);
        Assert.Single(result.Value!.TopMasVendidos);
        Assert.Equal("Gorra Dastik", result.Value!.TopMasVendidos[0].ProductoNombre);
    }
}
