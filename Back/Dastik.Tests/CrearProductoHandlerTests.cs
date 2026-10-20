using Dastik.Api.Domain.Entities;
using Dastik.Api.Domain.Services;
using Dastik.Api.Features.Inventario.CrearProducto;
using Dastik.Api.Infrastructure.Persistence;
using FluentAssertions;
using Microsoft.Data.Sqlite;
using Microsoft.EntityFrameworkCore;
using Xunit;

namespace Dastik.Tests;

public class CrearProductoHandlerTests : IDisposable
{
    private readonly SqliteConnection _connection;
    private readonly AppDbContext _context;
    private readonly GeneradorEan13 _generadorEan13;

    public CrearProductoHandlerTests()
    {
        _connection = new SqliteConnection("DataSource=:memory:");
        _connection.Open();

        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseSqlite(_connection)
            .Options;

        _context = new AppDbContext(options);
        _context.Database.EnsureCreated();

        _generadorEan13 = new GeneradorEan13();
    }

    public void Dispose()
    {
        _context.Dispose();
        _connection.Dispose();
    }

    [Fact]
    public async Task Handle_ConVarianteSinCodigoDeBarras_DebeAutogenerarEan13YMarcarComoGenerado()
    {
        // Arrange
        var (unidad, categoria, marca, proveedor) = CrearCatalogos();
        var handler = new CrearProductoCommandHandler(_context, _generadorEan13);

        var command = new CrearProductoCommand(
            UnidadNegocioId: unidad.Id,
            CategoriaId: categoria.Id,
            MarcaId: marca.Id,
            ProveedorId: proveedor.Id,
            Nombre: "Remera Dastik Boxy",
            Descripcion: "Algodón pesado 24/1",
            ImagenUrl: "https://cdn.tiendanube.com/dastik/remera.jpg",
            CostoBase: 12_000.00m,
            MarkupAplicado: 1.8m,
            PrecioVenta: 21_600.00m,
            Variantes: new List<CrearVarianteItemDto>
            {
                new(Talle: "M", Color: "Negro", CodigoBarras: null, StockFisico: 15),
                new(Talle: "L", Color: "Negro", CodigoBarras: "", StockFisico: 20)
            }
        );

        // Act
        var result = await handler.Handle(command, CancellationToken.None);

        // Assert
        result.Should().NotBeNull();
        result.CantidadVariantesCreadas.Should().Be(2);

        var productoEnBd = await _context.Productos
            .Include(p => p.Variantes)
            .FirstOrDefaultAsync(p => p.Id == result.ProductoId);

        productoEnBd.Should().NotBeNull();
        productoEnBd!.Variantes.Should().HaveCount(2);

        foreach (var variante in productoEnBd.Variantes)
        {
            variante.EsCodigoGenerado.Should().BeTrue("el código fue autogenerado ante la ausencia de uno de fábrica");
            variante.CodigoBarras.Should().NotBeNullOrWhiteSpace();
            variante.CodigoBarras.Length.Should().Be(13);
            variante.CodigoBarras.Should().StartWith("20", "debe usar prefijo in-store GS1 20...");
        }
    }

    [Fact]
    public async Task Handle_ConVarianteConCodigoDeBarrasProvisto_DebeRespetarCodigoYMarcarEsCodigoGeneradoFalso()
    {
        // Arrange
        var (unidad, categoria, marca, proveedor) = CrearCatalogos();
        var handler = new CrearProductoCommandHandler(_context, _generadorEan13);
        const string codigoFabrica = "7791234567898";

        var command = new CrearProductoCommand(
            UnidadNegocioId: unidad.Id,
            CategoriaId: categoria.Id,
            MarcaId: marca.Id,
            ProveedorId: proveedor.Id,
            Nombre: "Zapatillas Superstar",
            Descripcion: "Clásicas Adidas",
            ImagenUrl: "https://cdn.tiendanube.com/hidden/superstar.jpg",
            CostoBase: 50_000.00m,
            MarkupAplicado: 1.5m,
            PrecioVenta: 75_000.00m,
            Variantes: new List<CrearVarianteItemDto>
            {
                new(Talle: "41", Color: "Blanco", CodigoBarras: codigoFabrica, StockFisico: 8)
            }
        );

        // Act
        var result = await handler.Handle(command, CancellationToken.None);

        // Assert
        var productoEnBd = await _context.Productos
            .Include(p => p.Variantes)
            .FirstOrDefaultAsync(p => p.Id == result.ProductoId);

        productoEnBd.Should().NotBeNull();
        var variante = productoEnBd!.Variantes.First();
        variante.CodigoBarras.Should().Be(codigoFabrica);
        variante.EsCodigoGenerado.Should().BeFalse();
    }

    [Fact]
    public async Task Handle_DebePersistirProductoYVariantesEnBaseDeDatos()
    {
        // Arrange
        var (unidad, categoria, marca, proveedor) = CrearCatalogos();
        var handler = new CrearProductoCommandHandler(_context, _generadorEan13);

        var command = new CrearProductoCommand(
            UnidadNegocioId: unidad.Id,
            CategoriaId: categoria.Id,
            MarcaId: marca.Id,
            ProveedorId: proveedor.Id,
            Nombre: "Buzo Hoodie Hidden",
            Descripcion: "Frisa invisible",
            ImagenUrl: "https://cdn.tiendanube.com/hidden/hoodie.jpg",
            CostoBase: 25_000.00m,
            MarkupAplicado: 1.6m,
            PrecioVenta: 40_000.00m,
            Variantes: new List<CrearVarianteItemDto>
            {
                new(Talle: "XL", Color: "Gris", CodigoBarras: null, StockFisico: 5)
            }
        );

        // Act
        var result = await handler.Handle(command, CancellationToken.None);

        // Assert
        result.ProductoId.Should().BeGreaterThan(0);
        result.Nombre.Should().Be("Buzo Hoodie Hidden");

        var productoEnBd = await _context.Productos.FindAsync(result.ProductoId);
        productoEnBd.Should().NotBeNull();
        productoEnBd!.CostoBase.Should().Be(25_000.00m);
        productoEnBd.PrecioVenta.Should().Be(40_000.00m);
        productoEnBd.Activo.Should().BeTrue();
    }

    [Fact]
    public async Task Handle_ConCamposExtendidosYSincronizacionTiendanube_DebePersistirYVincular()
    {
        var (unidad, categoria, marca, proveedor) = CrearCatalogos();
        unidad.TieneTiendaNube = true;
        unidad.Nombre = "Dastik";
        unidad.TiendanubeStoreId = "sandbox-dastik";
        unidad.TiendanubeAccessToken = "mock-token";
        _context.SaveChanges();

        var handler = new CrearProductoCommandHandler(_context, _generadorEan13);
        var command = new CrearProductoCommand(
            UnidadNegocioId: unidad.Id,
            CategoriaId: categoria.Id,
            MarcaId: marca.Id,
            ProveedorId: proveedor.Id,
            Nombre: "Remera Boxy Streetwear",
            Descripcion: "Edicion limitada",
            ImagenUrl: "https://cdn.dastik.com/remera.webp",
            CostoBase: 15000m,
            MarkupAplicado: 1.6m,
            PrecioVenta: 24000m,
            Variantes: new List<CrearVarianteItemDto>
            {
                new("M", "Negro", null, 10, 22000m, 0.35m, null),
                new("L", "Negro", null, 15, 22000m, 0.35m, null)
            },
            Imagenes: new List<string> { "https://cdn.dastik.com/remera.webp", "https://cdn.dastik.com/remera-back.webp" },
            VideoUrl: "https://youtube.com/test",
            EsFisico: true,
            Subcategorias: new List<string> { "Remeras", "Boxy" },
            Destacados: new List<string> { "Nuevos", "Destacados" },
            TagsSeo: "remera, boxy, dastik",
            SeoTitulo: "Remera Boxy Streetwear | Dastik",
            SeoDescripcion: "Remera boxy fit pesada",
            SincronizarTiendanube: true
        );

        var result = await handler.Handle(command, CancellationToken.None);

        result.SincronizadoTiendanube.Should().BeTrue();
        result.TiendanubeProductId.Should().NotBeNullOrEmpty();

        var prodBd = await _context.Productos.Include(p => p.Variantes).FirstOrDefaultAsync(p => p.Id == result.ProductoId);
        prodBd.Should().NotBeNull();
        prodBd!.VideoUrl.Should().Be("https://youtube.com/test");
        prodBd.TagsSeo.Should().Be("remera, boxy, dastik");
        prodBd.Variantes.Should().HaveCount(2);
        prodBd.Variantes.First().TiendanubeVariantId.Should().NotBeNullOrEmpty();
    }

    private (UnidadNegocio, Categoria, Marca, Proveedor) CrearCatalogos()
    {
        var unidad = new UnidadNegocio { Nombre = "Hidden Sneakers" };
        var categoria = new Categoria { Nombre = "Calzado" };
        var marca = new Marca { Nombre = "Adidas" };
        var proveedor = new Proveedor { Nombre = "Distribuidor Oficial" };
        _context.UnidadesNegocio.Add(unidad);
        _context.Categorias.Add(categoria);
        _context.Marcas.Add(marca);
        _context.Proveedores.Add(proveedor);
        _context.SaveChanges();
        return (unidad, categoria, marca, proveedor);
    }
}
