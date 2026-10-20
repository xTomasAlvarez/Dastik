using Dastik.Api.Domain.Entities;
using Dastik.Api.Domain.Services;
using Dastik.Api.Infrastructure.Persistence;
using Dastik.Api.Infrastructure.Security;
using FluentAssertions;
using Microsoft.Data.Sqlite;
using Microsoft.EntityFrameworkCore;
using Xunit;

namespace Dastik.Tests;

public class SandboxDataSeederTests : IDisposable
{
    private readonly SqliteConnection _connection;
    private readonly AppDbContext _context;
    private readonly GeneradorEan13 _eanGenerator;
    private readonly IPasswordHasher _passwordHasher;

    public SandboxDataSeederTests()
    {
        _connection = new SqliteConnection("DataSource=:memory:");
        _connection.Open();

        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseSqlite(_connection)
            .Options;

        _context = new AppDbContext(options);
        _context.Database.EnsureCreated();

        _eanGenerator = new GeneradorEan13();
        _passwordHasher = new PasswordHasher();
    }

    public void Dispose()
    {
        _context.Dispose();
        _connection.Dispose();
    }

    [Fact]
    public async Task SeedAsync_CuandoEsBaseSandbox_DebeCrear4ProductosConSusVariantes()
    {
        // Act
        await SandboxDataSeeder.SeedAsync(_context, _eanGenerator, _passwordHasher);

        // Assert
        var productos = await _context.Productos
            .Include(p => p.UnidadNegocio)
            .Include(p => p.Variantes)
            .ToListAsync();

        productos.Should().HaveCount(4);

        // Productos de la unidad Dastik (Indumentaria)
        var productosDastik = productos.Where(p => p.UnidadNegocio.Nombre == "Dastik").ToList();
        productosDastik.Should().HaveCount(2);
        productosDastik.Select(p => p.Nombre).Should().Contain(new[] { "Remera Oversize Básica", "Pantalón Cargo" });

        var remera = productosDastik.First(p => p.Nombre == "Remera Oversize Básica");
        remera.Variantes.Should().HaveCount(5);
        remera.Variantes.Select(v => v.Talle).Should().BeEquivalentTo(new[] { "XS", "S", "M", "L", "XL" });
        remera.Variantes.All(v => v.StockFisico > 0 && !string.IsNullOrWhiteSpace(v.CodigoBarras)).Should().BeTrue();

        var pantalon = productosDastik.First(p => p.Nombre == "Pantalón Cargo");
        pantalon.Variantes.Should().HaveCount(5);
        pantalon.Variantes.Select(v => v.Talle).Should().BeEquivalentTo(new[] { "XS", "S", "M", "L", "XL" });
        pantalon.Variantes.All(v => v.StockFisico > 0 && !string.IsNullOrWhiteSpace(v.CodigoBarras)).Should().BeTrue();

        // Productos de la unidad Hidden Sneakers (Calzado)
        var productosSneakers = productos.Where(p => p.UnidadNegocio.Nombre == "Hidden Sneakers").ToList();
        productosSneakers.Should().HaveCount(2);
        productosSneakers.Select(p => p.Nombre).Should().Contain(new[] { "Nike Dunk Low Panda", "Adidas Yeezy Slide" });

        var dunk = productosSneakers.First(p => p.Nombre == "Nike Dunk Low Panda");
        dunk.Variantes.Should().HaveCount(4);
        dunk.Variantes.Select(v => v.Talle).Should().BeEquivalentTo(new[] { "US 8", "US 9", "US 10", "US 11" });

        var yeezy = productosSneakers.First(p => p.Nombre == "Adidas Yeezy Slide");
        yeezy.Variantes.Should().HaveCount(4);
        yeezy.Variantes.Select(v => v.Talle).Should().BeEquivalentTo(new[] { "US 8", "US 9", "US 10", "US 11" });

        // Cuentas de prueba pre-sembradas en Sandbox
        var tomiDev = await _context.Usuarios.FirstOrDefaultAsync(u => u.Nombre == "tomiDev");
        tomiDev.Should().NotBeNull();
        tomiDev!.Rol.Should().Be(RolUsuario.Admin);
        tomiDev.DebeCambiarPassword.Should().BeFalse();
        _passwordHasher.Verify("admin", tomiDev.PasswordHash).Should().BeTrue();

        var franco = await _context.Usuarios.FirstOrDefaultAsync(u => u.Email == "franco@dastik.com");
        franco.Should().NotBeNull();
        franco!.Nombre.Should().Be("Franco Romero");
        franco.Rol.Should().Be(RolUsuario.Empleado);
        franco.TurnoAsignado.Should().Be("Tarde");
        franco.TarifaPorHora.Should().Be(4000m);
        _passwordHasher.Verify("1234", franco.PasswordHash).Should().BeTrue();

        var lucas = await _context.Usuarios.FirstOrDefaultAsync(u => u.Email == "lucas@dastik.com");
        lucas.Should().NotBeNull();
        lucas!.Nombre.Should().Be("Lucas Benítez");
        lucas.Rol.Should().Be(RolUsuario.Empleado);
        lucas.TurnoAsignado.Should().Be("Mañana");
        lucas.TarifaPorHora.Should().Be(4500m);
        _passwordHasher.Verify("1234", lucas.PasswordHash).Should().BeTrue();

        var cajero = await _context.Usuarios.FirstOrDefaultAsync(u => u.Email == SandboxDataSeeder.SandboxUserEmailDefault);
        cajero.Should().NotBeNull();
        cajero!.DebeCambiarPassword.Should().BeFalse();
    }

    [Fact]
    public async Task SeedAsync_CuandoEsBaseProduccion_GuardiaDebeImpedirInsercion()
    {
        // Arrange: DbContext simulando conexión productiva (dastik_erp sin sandbox)
        var prodOptions = new DbContextOptionsBuilder<AppDbContext>()
            .UseNpgsql("Host=localhost;Database=dastik_erp;Username=postgres;Password=postgres")
            .Options;

        using var prodContext = new AppDbContext(prodOptions);

        // Act
        var esSandbox = SandboxDataSeeder.EsBaseDeDatosSandbox(prodContext);
        await SandboxDataSeeder.SeedAsync(prodContext, _eanGenerator, _passwordHasher);

        // Assert
        esSandbox.Should().BeFalse();
    }

    [Fact]
    public async Task SeedAsync_CuandoYaExistenProductos_NoDebeDuplicarCatalogo()
    {
        // Arrange
        await SandboxDataSeeder.SeedAsync(_context, _eanGenerator, _passwordHasher);
        var totalInicial = await _context.Productos.CountAsync();

        // Act: Segunda ejecución
        await SandboxDataSeeder.SeedAsync(_context, _eanGenerator, _passwordHasher);
        var totalFinal = await _context.Productos.CountAsync();

        // Assert
        totalInicial.Should().Be(4);
        totalFinal.Should().Be(4);
    }

    [Fact]
    public async Task ResetSandboxAsync_DebeEliminarOrdenesYTurnos_YRestablecerStockVariantesA10()
    {
        // Arrange: sembrar sandbox y crear órdenes y turnos ficticios
        await SandboxDataSeeder.SeedAsync(_context, _eanGenerator, _passwordHasher);

        var usuario = await _context.Usuarios.FirstAsync();
        var turno = new Turno
        {
            EmpleadoId = usuario.Id,
            SaldoInicial = 5000m,
            FechaApertura = DateTime.UtcNow,
            Estado = EstadoTurno.Abierto
        };
        _context.Turnos.Add(turno);
        await _context.SaveChangesAsync();

        var variante = await _context.Variantes.FirstAsync();
        variante.StockFisico = 1;
        await _context.SaveChangesAsync();

        // Act
        await SandboxDataSeeder.ResetSandboxAsync(_context, _eanGenerator, _passwordHasher);

        // Assert
        var turnos = await _context.Turnos.ToListAsync();
        turnos.Should().BeEmpty();

        var varianteActualizada = await _context.Variantes.FirstAsync(v => v.Id == variante.Id);
        varianteActualizada.StockFisico.Should().Be(10);
    }
}
