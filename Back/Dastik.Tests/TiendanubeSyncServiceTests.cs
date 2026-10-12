using Dastik.Api.Common;
using Dastik.Api.Domain.Entities;
using Dastik.Api.Domain.Integrations.Tiendanube;
using Dastik.Api.Domain.Services;
using Dastik.Api.Features.Inventario.SincronizarTiendanube;
using Dastik.Api.Infrastructure.Persistence;
using FluentAssertions;
using Microsoft.Data.Sqlite;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging.Abstractions;
using Xunit;

namespace Dastik.Tests;

public class TiendanubeSyncServiceTests : IDisposable
{
    private readonly SqliteConnection _connection;
    private readonly AppDbContext _context;
    private readonly GeneradorEan13 _generadorEan13;
    private readonly UnidadNegocio _unidadDastik;
    private readonly UnidadNegocio _unidadHidden;
    private readonly Categoria _categoria;
    private readonly Marca _marca;
    private readonly Proveedor _proveedor;

    public TiendanubeSyncServiceTests()
    {
        _connection = new SqliteConnection("DataSource=:memory:");
        _connection.Open();

        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseSqlite(_connection)
            .Options;

        _context = new AppDbContext(options);
        _context.Database.EnsureCreated();

        _generadorEan13 = new GeneradorEan13();

        // Seed inicial de unidades de negocio
        _unidadDastik = new UnidadNegocio
        {
            Nombre = "Dastik",
            TieneTiendaNube = true,
            TiendanubeStoreId = "test-store",
            TiendanubeAccessToken = "test-token"
        };
        _unidadHidden = new UnidadNegocio
        {
            Nombre = "Hidden Sneakers",
            TieneTiendaNube = false
        };

        _categoria = new Categoria { Nombre = "Indumentaria", Temporada = "2026", EsquemaTalles = "XS-XL" };
        _marca = new Marca { Nombre = "Dastik" };
        _proveedor = new Proveedor { Nombre = "Proveedor Textil Dastik", MarkupPorDefecto = 1.5m };

        _context.UnidadesNegocio.AddRange(_unidadDastik, _unidadHidden);
        _context.Categorias.Add(_categoria);
        _context.Marcas.Add(_marca);
        _context.Proveedores.Add(_proveedor);
        _context.SaveChanges();
    }

    public void Dispose()
    {
        _context.Dispose();
        _connection.Dispose();
    }

    private class MockTiendanubeClient : ITiendanubeApiClient
    {
        public bool DebeFallar { get; set; }
        public List<TiendanubeProductResponse> ProductosARetornar { get; set; } = new();

        public Task<Result<TiendanubeVariantResponse>> ActualizarStockVarianteAsync(
            string storeId, string accessToken, string productId, string variantId, int nuevoStock, CancellationToken ct = default)
        {
            return Task.FromResult(Result<TiendanubeVariantResponse>.Success(new TiendanubeVariantResponse(1, 1, nuevoStock)));
        }

        public Task<Result<List<TiendanubeProductResponse>>> ObtenerProductosAsync(
            string storeId, string accessToken, CancellationToken ct = default)
        {
            if (DebeFallar)
            {
                return Task.FromResult(Result<List<TiendanubeProductResponse>>.Failure("Error de conexión 500"));
            }

            return Task.FromResult(Result<List<TiendanubeProductResponse>>.Success(ProductosARetornar));
        }
    }

    [Fact]
    public async Task SincronizarCatalogoAsync_CuandoHayProductosNuevos_DebeCrearProductosYVariantesAsignadosADastik()
    {
        // Arrange
        var mockClient = new MockTiendanubeClient
        {
            ProductosARetornar = new List<TiendanubeProductResponse>
            {
                new(
                    Id: 501,
                    Nombre: "Remera Boxy Street",
                    Descripcion: "Corte amplio",
                    ImagenUrl: "https://dastik.com/img/remera.jpg",
                    Precio: 22000m,
                    Costo: 14000m,
                    Variantes: new List<TiendanubeProductVariantResponse>
                    {
                        new(Id: 1001, ProductId: 501, Talle: "M", Color: "Negro", Barcode: "2012345678901", Precio: 22000m, Costo: 14000m, Stock: 12),
                        new(Id: 1002, ProductId: 501, Talle: "L", Color: "Negro", Barcode: "2012345678902", Precio: 22000m, Costo: 14000m, Stock: 8)
                    }
                )
            }
        };

        var service = new TiendanubeSyncService(_context, mockClient, _generadorEan13, NullLogger<TiendanubeSyncService>.Instance);

        // Act
        var result = await service.SincronizarCatalogoAsync();

        // Assert
        result.IsSuccess.Should().BeTrue();
        result.Value.Should().NotBeNull();
        result.Value!.ProductosNuevos.Should().Be(1);
        result.Value.ProductosActualizados.Should().Be(0);
        result.Value.TotalVariantesImportadas.Should().Be(2);

        var productoDb = await _context.Productos
            .Include(p => p.Variantes)
            .FirstOrDefaultAsync(p => p.TiendanubeProductId == "501");

        productoDb.Should().NotBeNull();
        productoDb!.Nombre.Should().Be("Remera Boxy Street");
        productoDb.UnidadNegocioId.Should().Be(_unidadDastik.Id, "Regla de Tenant: Todo producto importado debe pertenecer a Dastik");
        productoDb.Variantes.Should().HaveCount(2);
        productoDb.Variantes.Should().Contain(v => v.TiendanubeVariantId == "1001" && v.StockFisico == 12);
        productoDb.Variantes.Should().Contain(v => v.TiendanubeVariantId == "1002" && v.StockFisico == 8);
    }

    [Fact]
    public async Task SincronizarCatalogoAsync_CuandoProductoYaExiste_DebeActualizarYConservarUnidadDastik()
    {
        // Arrange: Crear producto previo en la DB
        var prodExistente = new Producto
        {
            UnidadNegocioId = _unidadDastik.Id,
            CategoriaId = _categoria.Id,
            MarcaId = _marca.Id,
            ProveedorId = _proveedor.Id,
            Nombre = "Nombre Antiguo",
            Descripcion = "Desc Antigua",
            ImagenUrl = "https://vieja.jpg",
            PrecioVenta = 18000m,
            CostoBase = 10000m,
            MarkupAplicado = 1.8m,
            TiendanubeProductId = "777",
            Activo = true
        };
        var varExistente = new Variante
        {
            Talle = "S",
            Color = "Blanco",
            CodigoBarras = "2000000000018",
            StockFisico = 3,
            TiendanubeVariantId = "9001"
        };
        prodExistente.Variantes.Add(varExistente);
        _context.Productos.Add(prodExistente);
        await _context.SaveChangesAsync();

        var mockClient = new MockTiendanubeClient
        {
            ProductosARetornar = new List<TiendanubeProductResponse>
            {
                new(
                    Id: 777,
                    Nombre: "Nombre Actualizado desde Nube",
                    Descripcion: "Desc Nueva",
                    ImagenUrl: "https://nueva.jpg",
                    Precio: 25000m,
                    Costo: 15000m,
                    Variantes: new List<TiendanubeProductVariantResponse>
                    {
                        new(Id: 9001, ProductId: 777, Talle: "S", Color: "Blanco", Barcode: "2000000000018", Precio: 25000m, Costo: 15000m, Stock: 25)
                    }
                )
            }
        };

        var service = new TiendanubeSyncService(_context, mockClient, _generadorEan13, NullLogger<TiendanubeSyncService>.Instance);

        // Act
        var result = await service.SincronizarCatalogoAsync();

        // Assert
        result.IsSuccess.Should().BeTrue();
        result.Value!.ProductosNuevos.Should().Be(0);
        result.Value.ProductosActualizados.Should().Be(1);

        var prodActualizado = await _context.Productos
            .Include(p => p.Variantes)
            .FirstOrDefaultAsync(p => p.TiendanubeProductId == "777");

        prodActualizado!.Nombre.Should().Be("Nombre Actualizado desde Nube");
        prodActualizado.PrecioVenta.Should().Be(25000m);
        prodActualizado.Variantes.First().StockFisico.Should().Be(25);
        prodActualizado.UnidadNegocioId.Should().Be(_unidadDastik.Id);
    }

    [Fact]
    public async Task SincronizarCatalogoAsync_ReglaDeTenant_NuncaDebeAsignarAHiddenSneakers()
    {
        // Arrange
        var mockClient = new MockTiendanubeClient
        {
            ProductosARetornar = new List<TiendanubeProductResponse>
            {
                new(
                    Id: 888,
                    Nombre: "Buzo Dastik Crewneck",
                    Descripcion: "Frisa pesada",
                    ImagenUrl: "",
                    Precio: 35000m,
                    Costo: 20000m,
                    Variantes: new List<TiendanubeProductVariantResponse>
                    {
                        new(Id: 8001, ProductId: 888, Talle: "XL", Color: "Negro", Barcode: null, Precio: 35000m, Costo: 20000m, Stock: 5)
                    }
                )
            }
        };

        var service = new TiendanubeSyncService(_context, mockClient, _generadorEan13, NullLogger<TiendanubeSyncService>.Instance);

        // Act
        var result = await service.SincronizarCatalogoAsync();

        // Assert
        result.IsSuccess.Should().BeTrue();

        var prodDb = await _context.Productos.FirstOrDefaultAsync(p => p.TiendanubeProductId == "888");
        prodDb.Should().NotBeNull();
        prodDb!.UnidadNegocioId.Should().NotBe(_unidadHidden.Id, "Bajo ninguna circunstancia debe asignarse a Hidden Sneakers");
        prodDb.UnidadNegocioId.Should().Be(_unidadDastik.Id);
    }

    [Fact]
    public async Task SincronizarCatalogoAsync_CuandoTiendanubeFalla_DebeRetornarFalloSinAlterarBd()
    {
        // Arrange
        var mockClient = new MockTiendanubeClient { DebeFallar = true };
        var service = new TiendanubeSyncService(_context, mockClient, _generadorEan13, NullLogger<TiendanubeSyncService>.Instance);

        // Act
        var result = await service.SincronizarCatalogoAsync();

        // Assert
        result.IsSuccess.Should().BeFalse();
        result.Error.Should().Contain("500");
    }
}
