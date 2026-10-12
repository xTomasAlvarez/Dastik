using Dastik.Api.Domain.Entities;
using Dastik.Api.Features.Metricas;
using Dastik.Api.Infrastructure.Persistence;
using Microsoft.Data.Sqlite;
using Microsoft.EntityFrameworkCore;
using Xunit;

namespace Dastik.Tests;

public class MetricasTests : IDisposable
{
    private readonly SqliteConnection _connection;
    private readonly AppDbContext _context;

    public MetricasTests()
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
    public async Task AlertasStock_FiltraVariantesConStockMenorOIgualA3()
    {
        // Arrange
        var unidad = new UnidadNegocio { Nombre = "Dastik", TieneTiendaNube = true };
        var categoria = new Categoria { Nombre = "Remeras" };
        var marca = new Marca { Nombre = "Dastik" };
        var proveedor = new Proveedor { Nombre = "Proveedor Test", MarkupPorDefecto = 1.5m };

        _context.UnidadesNegocio.Add(unidad);
        _context.Categorias.Add(categoria);
        _context.Marcas.Add(marca);
        _context.Proveedores.Add(proveedor);
        await _context.SaveChangesAsync();

        var prod1 = new Producto
        {
            Nombre = "Remera Oversize",
            UnidadNegocioId = unidad.Id,
            CategoriaId = categoria.Id,
            MarcaId = marca.Id,
            ProveedorId = proveedor.Id,
            PrecioVenta = 20000m,
            CostoBase = 10000m,
            Activo = true
        };

        var varCritica1 = new Variante { Talle = "M", Color = "Negro", StockFisico = 1, CodigoBarras = "1111111111111", Producto = prod1 };
        var varCritica2 = new Variante { Talle = "L", Color = "Blanco", StockFisico = 3, CodigoBarras = "2222222222222", Producto = prod1 };
        var varConStock = new Variante { Talle = "XL", Color = "Negro", StockFisico = 10, CodigoBarras = "3333333333333", Producto = prod1 };

        _context.Productos.Add(prod1);
        _context.Variantes.AddRange(varCritica1, varCritica2, varConStock);
        await _context.SaveChangesAsync();

        // Act - Simular lógica de AlertasStock
        var alertas = await _context.Variantes
            .AsNoTracking()
            .Include(v => v.Producto)
                .ThenInclude(p => p.Marca)
            .Include(v => v.Producto)
                .ThenInclude(p => p.Categoria)
            .Include(v => v.Producto)
                .ThenInclude(p => p.UnidadNegocio)
            .Where(v => v.StockFisico <= 3 && v.Producto.Activo)
            .OrderBy(v => v.StockFisico)
            .Select(v => new AlertaStockDto(
                v.ProductoId,
                v.Id,
                v.Producto.Nombre,
                v.Producto.Marca.Nombre,
                v.Producto.Categoria.Nombre,
                v.Producto.UnidadNegocio.Nombre,
                v.Talle,
                v.Color,
                v.CodigoBarras,
                v.StockFisico,
                v.Producto.ImagenUrl,
                v.Producto.PrecioVenta
            ))
            .ToListAsync();

        // Assert
        Assert.Equal(2, alertas.Count);
        Assert.Contains(alertas, a => a.Talle == "M" && a.StockFisico == 1);
        Assert.Contains(alertas, a => a.Talle == "L" && a.StockFisico == 3);
        Assert.DoesNotContain(alertas, a => a.StockFisico == 10);
    }

    [Fact]
    public async Task Dashboard_CalculaIngresosYGananciaNetaCorrectamente()
    {
        // Arrange
        var unidad = new UnidadNegocio { Nombre = "Dastik", TieneTiendaNube = true };
        var categoria = new Categoria { Nombre = "Pantalones" };
        var marca = new Marca { Nombre = "Dastik" };
        var proveedor = new Proveedor { Nombre = "Proveedor Test", MarkupPorDefecto = 1.5m };
        var usuario = new Usuario { Nombre = "Dueño", Rol = RolUsuario.Admin, Email = "dueno@dastik.com", PasswordHash = "hash" };

        _context.UnidadesNegocio.Add(unidad);
        _context.Categorias.Add(categoria);
        _context.Marcas.Add(marca);
        _context.Proveedores.Add(proveedor);
        _context.Usuarios.Add(usuario);
        await _context.SaveChangesAsync();

        var turno = new Turno { EmpleadoId = usuario.Id, SaldoInicial = 10000m, FechaApertura = DateTime.UtcNow, Estado = EstadoTurno.Abierto };
        _context.Turnos.Add(turno);
        await _context.SaveChangesAsync();

        var prod = new Producto
        {
            Nombre = "Jean Baggy",
            UnidadNegocioId = unidad.Id,
            CategoriaId = categoria.Id,
            MarcaId = marca.Id,
            ProveedorId = proveedor.Id,
            PrecioVenta = 50000m,
            CostoBase = 30000m,
            Activo = true
        };
        var variante = new Variante { Talle = "42", Color = "Azul", StockFisico = 5, CodigoBarras = "9999999999999", Producto = prod };
        _context.Productos.Add(prod);
        _context.Variantes.Add(variante);
        await _context.SaveChangesAsync();

        // Crear una orden cobrada hoy: 2 unidades a $50000 c/u = $100000 total. Costo = 2 * $30000 = $60000. Ganancia = $40000.
        var orden = new Orden
        {
            TurnoId = turno.Id,
            Fecha = DateTime.UtcNow,
            Total = 100000m,
            Estado = EstadoOrden.Pagada
        };
        orden.Detalles.Add(new DetalleOrden
        {
            VarianteId = variante.Id,
            Cantidad = 2,
            PrecioUnitario = 50000m,
            Subtotal = 100000m
        });
        _context.Ordenes.Add(orden);
        await _context.SaveChangesAsync();

        // Act - Simular cálculo de métricas
        var ordenesHoy = await _context.Ordenes
            .AsNoTracking()
            .Where(o => o.Estado == EstadoOrden.Pagada)
            .Include(o => o.Detalles)
                .ThenInclude(d => d.Variante)
                    .ThenInclude(v => v.Producto)
            .ToListAsync();

        decimal ingresosHoy = ordenesHoy.Sum(o => o.Total);
        decimal costoTotalHoy = ordenesHoy
            .SelectMany(o => o.Detalles)
            .Sum(d => d.Cantidad * d.Variante.Producto.CostoBase);
        decimal gananciaNetaHoy = ingresosHoy - costoTotalHoy;

        // Assert
        Assert.Equal(100000m, ingresosHoy);
        Assert.Equal(60000m, costoTotalHoy);
        Assert.Equal(40000m, gananciaNetaHoy);
        Assert.Single(ordenesHoy);
    }
}
