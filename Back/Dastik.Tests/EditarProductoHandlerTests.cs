using Dastik.Api.Domain.Entities;
using Dastik.Api.Domain.Services;
using Dastik.Api.Features.Inventario.EditarProducto;
using Dastik.Api.Infrastructure.Persistence;
using FluentAssertions;
using Microsoft.Data.Sqlite;
using Microsoft.EntityFrameworkCore;
using Xunit;

namespace Dastik.Tests;

public class EditarProductoHandlerTests : IDisposable
{
    private readonly SqliteConnection _connection;
    private readonly AppDbContext _context;
    private readonly GeneradorEan13 _generadorEan13;

    public EditarProductoHandlerTests()
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
    public async Task Handle_EditarProductoExistente_DebeActualizarCamposYVariantesCorrectamente()
    {
        // Arrange
        var (unidad, categoria, marca, proveedor) = CrearCatalogos();

        var prodInicial = new Producto
        {
            UnidadNegocioId = unidad.Id,
            CategoriaId = categoria.Id,
            MarcaId = marca.Id,
            ProveedorId = proveedor.Id,
            Nombre = "Prenda Original",
            Descripcion = "Descripcion Original",
            ImagenUrl = "https://cdn.dastik.com/img1.jpg",
            ImagenesJson = "[\"https://cdn.dastik.com/img1.jpg\"]",
            CostoBase = 10000m,
            MarkupAplicado = 1.5m,
            PrecioVenta = 15000m,
            Activo = true,
            Variantes = new List<Variante>
            {
                new() { Talle = "M", Color = "Negro", CodigoBarras = "2010100100018", StockFisico = 10 },
                new() { Talle = "L", Color = "Negro", CodigoBarras = "2010100100025", StockFisico = 8 }
            }
        };

        _context.Productos.Add(prodInicial);
        await _context.SaveChangesAsync();

        var varM = prodInicial.Variantes.First(v => v.Talle == "M");
        var handler = new EditarProductoCommandHandler(_context, _generadorEan13);

        // Edit command: conserva M con nuevo stock y precio promo, elimina L, y agrega XL nueva
        var command = new EditarProductoCommand(
            Id: prodInicial.Id,
            UnidadNegocioId: unidad.Id,
            CategoriaId: categoria.Id,
            MarcaId: marca.Id,
            ProveedorId: proveedor.Id,
            Nombre: "Prenda Editada 2026",
            Descripcion: "Nueva descripcion con fit drop",
            ImagenUrl: "https://cdn.dastik.com/img-editada.jpg",
            CostoBase: 12000m,
            MarkupAplicado: 1.8m,
            PrecioVenta: 21600m,
            Variantes: new List<EditarVarianteItemDto>
            {
                new(Id: varM.Id, Talle: "M", Color: "Negro", CodigoBarras: varM.CodigoBarras, StockFisico: 14, PrecioPromocional: 19999m, PesoKg: 0.35m, PrecioOverride: null),
                new(Id: null, Talle: "XL", Color: "Negro", CodigoBarras: null, StockFisico: 6, PrecioPromocional: null, PesoKg: 0.4m, PrecioOverride: null)
            },
            Imagenes: new List<string> { "https://cdn.dastik.com/img-editada.jpg", "https://cdn.dastik.com/img-back.jpg" },
            VideoUrl: "https://youtube.com/watch?v=123",
            EsFisico: true,
            Subcategorias: new List<string> { "Oversize", "Drop 02" },
            Destacados: new List<string> { "Nuevos" },
            TagsSeo: "streetwear, drop02",
            SeoTitulo: "Prenda Editada 2026 | Dastik",
            SeoDescripcion: "Prenda de alta calidad streetwear",
            SincronizarTiendanube: true
        );

        // Act
        var result = await handler.Handle(command, CancellationToken.None);

        // Assert
        result.Should().NotBeNull();
        result.Nombre.Should().Be("Prenda Editada 2026");
        result.CantidadVariantes.Should().Be(2);

        var productoBd = await _context.Productos
            .Include(p => p.Variantes)
            .FirstOrDefaultAsync(p => p.Id == prodInicial.Id);

        productoBd.Should().NotBeNull();
        productoBd!.Nombre.Should().Be("Prenda Editada 2026");
        productoBd.PrecioVenta.Should().Be(21600m);
        productoBd.VideoUrl.Should().Be("https://youtube.com/watch?v=123");
        productoBd.TagsSeo.Should().Be("streetwear, drop02");

        // Variantes assert
        productoBd.Variantes.Should().HaveCount(2);
        productoBd.Variantes.Should().Contain(v => v.Talle == "M" && v.StockFisico == 14 && v.PrecioPromocional == 19999m);
        productoBd.Variantes.Should().Contain(v => v.Talle == "XL" && v.StockFisico == 6);
        productoBd.Variantes.Should().NotContain(v => v.Talle == "L"); // Eliminada

        // Tiendanube sync
        result.SincronizadoTiendanube.Should().BeTrue();
    }

    private (UnidadNegocio, Categoria, Marca, Proveedor) CrearCatalogos()
    {
        var unidad = new UnidadNegocio { Nombre = "Dastik", TieneTiendaNube = true, TiendanubeStoreId = "sandbox-dastik", TiendanubeAccessToken = "mock-token" };
        var categoria = new Categoria { Nombre = "Remeras" };
        var marca = new Marca { Nombre = "Dastik" };
        var proveedor = new Proveedor { Nombre = "Sample", MarkupPorDefecto = 55m };
        _context.UnidadesNegocio.Add(unidad);
        _context.Categorias.Add(categoria);
        _context.Marcas.Add(marca);
        _context.Proveedores.Add(proveedor);
        _context.SaveChanges();
        return (unidad, categoria, marca, proveedor);
    }
}
