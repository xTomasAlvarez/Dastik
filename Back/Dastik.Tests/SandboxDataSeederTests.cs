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

        // Usuario cajero de sandbox creado
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
}
