using System.Net.Http;
using Dastik.Api.Domain.Entities;
using Dastik.Api.Domain.Services;
using Dastik.Api.Features.Inventario.ListarProductos;
using Dastik.Api.Features.Inventario.SincronizarTiendanube;
using Dastik.Api.Infrastructure.Integrations.Tiendanube;
using Dastik.Api.Infrastructure.Persistence;
using FluentAssertions;
using Microsoft.Data.Sqlite;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging.Abstractions;
using Xunit;
using Xunit.Abstractions;

namespace Dastik.Tests;

public class CatalogIntelligenceTests
{
    private readonly ITestOutputHelper _output;

    public CatalogIntelligenceTests(ITestOutputHelper output)
    {
        _output = output;
    }

    [Theory]
    [InlineData("REMERA BOXY HEAVYWEIGHT DROP 31", "Remeras")]
    [InlineData("MUSCULOSA TANK BASICA", "Remeras")]
    [InlineData("CHOMBA RUGBY OVERSIZE", "Polos & Chombas")]
    [InlineData("POLO CLASICA PIMA", "Polos & Chombas")]
    [InlineData("CAMISA LENADORA CUADROS", "Camisas")]
    [InlineData("SOBRECAMISA GABARDINA", "Camisas")]
    [InlineData("ZIP HOODIE SIGNATURE BLACK", "Buzos & Hoodies")]
    [InlineData("BUZO CREWNECK RUSTICO", "Buzos & Hoodies")]
    [InlineData("SWEATER TEJIDO OVERSIZE", "Buzos & Hoodies")]
    [InlineData("CAMPERA PUFFER THE NORTH FACE 700", "Camperas & Abrigos")]
    [InlineData("CHALECO PUFFER IMPERMEABLE", "Camperas & Abrigos")]
    [InlineData("PANTALON CARGO RIPSTOP", "Pantalones & Jeans")]
    [InlineData("JEAN BAGGY CARPENTER DENIM", "Pantalones & Jeans")]
    [InlineData("JOGGING FRISA WIDE LEG", "Pantalones & Jeans")]
    [InlineData("BERMUDA JORT DENIM", "Bermudas & Shorts")]
    [InlineData("SHORT BAÑO ESTAMPADO", "Bermudas & Shorts")]
    [InlineData("GORRA NEW ERA 59FIFTY NY", "Gorras & Accesorios")]
    [InlineData("PILUSO AUSTRALIANO", "Gorras & Accesorios")]
    [InlineData("MEDIAS NIKE CREW X3", "Gorras & Accesorios")]
    [InlineData("PERFUME ARABE 100ML", "Gorras & Accesorios")]
    [InlineData("NIKE DUNK LOW PANDA", "Zapatillas & Sneakers")]
    [InlineData("ADIDAS CAMPUS 00S GREY", "Zapatillas & Sneakers")]
    [InlineData("VANS KNU SKOOL BLACK", "Zapatillas & Sneakers")]
    public void InferirCategoria_DebeClasificarCorrectamentePorPalabrasClave(string nombreProducto, string categoriaEsperada)
    {
        var (cat, _) = CatalogClassifierService.InferirCategoria(nombreProducto);
        cat.Should().Be(categoriaEsperada);
    }

    [Theory]
    [InlineData("GORRA NEW ERA NY YANKEES", "New Era")]
    [InlineData("CAMPERA PUFFER TNF NUPTSE", "The North Face")]
    [InlineData("CAMPERA THE NORTH FACE", "The North Face")]
    [InlineData("ZAPATILLAS NIKE DUNK LOW", "Nike")]
    [InlineData("REMERA JORDAN FLIGHT", "Jordan")]
    [InlineData("ADIDAS SAMBA OG", "Adidas")]
    [InlineData("YEEZY SLIDE ONYX", "Yeezy")]
    [InlineData("VANS KNU SKOOL", "Vans")]
    [InlineData("NEW BALANCE 550", "New Balance")]
    [InlineData("REMERA STUSSY 8 BALL", "Stüssy")]
    [InlineData("BUZO HOODIE ESSENTIALS", "Essentials")]
    [InlineData("REMERA BOXY BASICA", "Dastik")]
    public void InferirMarca_DebeDetectarMarcaRealOAsignarDastikPorDefecto(string nombreProducto, string marcaEsperada)
    {
        var marca = CatalogClassifierService.InferirMarca(nombreProducto);
        marca.Should().Be(marcaEsperada);
    }

    [Theory]
    [InlineData(
        "https://acdn-us.mitiendanube.com/stores/005/686/318/products/foto-240-0.webp",
        "https://acdn-us.mitiendanube.com/stores/005/686/318/products/foto-1024-1024.webp")]
    [InlineData(
        "https://d2r9epyceweg5n.cloudfront.net/stores/005/686/318/products/remera-480-0.jpg",
        "https://d2r9epyceweg5n.cloudfront.net/stores/005/686/318/products/remera-1024-1024.jpg")]
    public void NormalizarUrlImagenAltaRes_DebeReemplazarSufijosComprimidosPor1024(string entrada, string esperado)
    {
        var res = CatalogClassifierService.NormalizarUrlImagenAltaRes(entrada);
        res.Should().Be(esperado);
    }

    [Fact]
    public async Task ListarProductosQuery_DebeOrdenarPrimeroConStockYLuegoPorDropYTiendanubeIdDescendente()
    {
        using var conn = new SqliteConnection("DataSource=:memory:");
        conn.Open();
        var options = new DbContextOptionsBuilder<AppDbContext>().UseSqlite(conn).Options;
        using var db = new AppDbContext(options);
        db.Database.EnsureCreated();

        var unidad = new UnidadNegocio { Nombre = "Dastik", TieneTiendaNube = true };
        var cat = new Categoria { Nombre = "Remeras", Temporada = "Todo el año", EsquemaTalles = "S-XL" };
        var marca = new Marca { Nombre = "Dastik" };
        var prov = new Proveedor { Nombre = "Sample", MarkupPorDefecto = 55m };
        db.UnidadesNegocio.Add(unidad);
        db.Categorias.Add(cat);
        db.Marcas.Add(marca);
        db.Proveedores.Add(prov);
        await db.SaveChangesAsync();

        var prodAgotadoDrop35 = new Producto
        {
            UnidadNegocioId = unidad.Id,
            CategoriaId = cat.Id,
            MarcaId = marca.Id,
            ProveedorId = prov.Id,
            Nombre = "Remera Agotada Drop 35",
            PrecioVenta = 20000m,
            CostoBase = 10000m,
            MarkupAplicado = 2m,
            TiendanubeProductId = "999999",
            Activo = true,
            Variantes = { new Variante { Talle = "M", Color = "Negro", CodigoBarras = "111", StockFisico = 0 } }
        };

        var prodViejoDrop25 = new Producto
        {
            UnidadNegocioId = unidad.Id,
            CategoriaId = cat.Id,
            MarcaId = marca.Id,
            ProveedorId = prov.Id,
            Nombre = "Remera Vieja Drop 25",
            PrecioVenta = 20000m,
            CostoBase = 10000m,
            MarkupAplicado = 2m,
            TiendanubeProductId = "100000",
            Activo = true,
            Variantes = { new Variante { Talle = "M", Color = "Negro", CodigoBarras = "222", StockFisico = 5 } }
        };

        var prodNuevoDrop31 = new Producto
        {
            UnidadNegocioId = unidad.Id,
            CategoriaId = cat.Id,
            MarcaId = marca.Id,
            MarkupAplicado = 2m,
            ProveedorId = prov.Id,
            Nombre = "Remera Nueva Drop 31",
            PrecioVenta = 25000m,
            CostoBase = 12000m,
            TiendanubeProductId = "200000",
            Activo = true,
            Variantes = { new Variante { Talle = "L", Color = "Blanco", CodigoBarras = "333", StockFisico = 3 } }
        };

        db.Productos.AddRange(prodAgotadoDrop35, prodViejoDrop25, prodNuevoDrop31);
        await db.SaveChangesAsync();

        var handler = new ListarProductosQueryHandler(db);
        var resultado = await handler.Handle(new ListarProductosQuery(), CancellationToken.None);

        resultado.Should().HaveCount(3);
        resultado[0].Nombre.Should().Be("Remera Nueva Drop 31");
        resultado[1].Nombre.Should().Be("Remera Vieja Drop 25");
        resultado[2].Nombre.Should().Be("Remera Agotada Drop 35");
    }

    [Fact]
    public async Task EjecutarReclasificacionYBackfillEnBasesLocales_DebeActualizarDastikDevDbYSandboxDb()
    {
        var baseDir = Path.GetFullPath(Path.Combine(AppContext.BaseDirectory, "..", "..", "..", "..", "Dastik.Api"));
        var prodDbPath = Path.Combine(baseDir, "dastik_dev.db");
        var sandboxDbPath = Path.Combine(baseDir, "dastik_sandbox_dev.db");

        if (File.Exists(prodDbPath))
        {
            var prodOptions = new DbContextOptionsBuilder<AppDbContext>()
                .UseSqlite($"Data Source={prodDbPath}")
                .Options;

            using var prodDb = new AppDbContext(prodOptions);
            await SqliteSchemaPatcher.EnsureSchemaUpdatedAsync(prodDb);

            // Verificar si hay productos de Tiendanube con galería de fotos vacía ("[]") y credenciales reales configuradas para lectura GET
            var unidadDastik = await prodDb.UnidadesNegocio
                .AsNoTracking()
                .FirstOrDefaultAsync(u => u.Nombre == "Dastik" && u.TieneTiendaNube);

            var necesitaBackfillGaleria = !await prodDb.Productos
                .AnyAsync(p => p.ImagenesJson.Contains("\",\""));

            if (necesitaBackfillGaleria &&
                unidadDastik is not null &&
                !string.IsNullOrWhiteSpace(unidadDastik.TiendanubeStoreId) &&
                !unidadDastik.TiendanubeStoreId.StartsWith("sandbox", StringComparison.OrdinalIgnoreCase) &&
                !string.IsNullOrWhiteSpace(unidadDastik.TiendanubeAccessToken) &&
                !unidadDastik.TiendanubeAccessToken.StartsWith("mock", StringComparison.OrdinalIgnoreCase))
            {
                using var httpClient = new HttpClient
                {
                    BaseAddress = new Uri("https://api.tiendanube.com/v1/"),
                    Timeout = TimeSpan.FromSeconds(90)
                };
                httpClient.DefaultRequestHeaders.UserAgent.ParseAdd("Dastik-POS-ERP (contacto@dastik.com)");

                var apiClient = new TiendanubeApiClient(httpClient, NullLogger<TiendanubeApiClient>.Instance);
                var syncService = new TiendanubeSyncService(prodDb, apiClient, new GeneradorEan13(), NullLogger<TiendanubeSyncService>.Instance);

                // Petición exclusivamente GET a Tiendanube para poblar ImagenesJson de alta resolución y categorías
                var syncResult = await syncService.SincronizarCatalogoAsync();
                _output.WriteLine($"[BACKFILL GALERIA TIENDANUBE GET] Éxito={syncResult.IsSuccess} | Mensaje={syncResult.Value?.Mensaje ?? syncResult.Error}");
            }

            var summary = await CatalogClassifierService.ClasificarCatalogoExistenteAsync(prodDb);

            _output.WriteLine($"=== RESUMEN RECLASIFICACIÓN dastik_dev.db ===");
            _output.WriteLine($"Total Productos Analizados: {summary.TotalProductosAnalizados}");
            _output.WriteLine($"Reclasificados en Categoría: {summary.ProductosReclasificadosCategoria}");
            _output.WriteLine($"Reclasificados en Marca: {summary.ProductosReclasificadosMarca}");
            _output.WriteLine($"Imágenes optimizadas a 1024px: {summary.ProductosImagenesOptimizadas}");

            foreach (var kv in summary.ConteoPorCategoria)
            {
                _output.WriteLine($"  Categoría [{kv.Key}]: {kv.Value} productos");
            }

            foreach (var kv in summary.ConteoPorMarca)
            {
                _output.WriteLine($"  Marca [{kv.Key}]: {kv.Value} productos");
            }

            var proveedoresFinales = await prodDb.Proveedores.Select(p => $"{p.Nombre} ({p.MarkupPorDefecto}%)").ToListAsync();
            _output.WriteLine($"  Proveedores activos: {string.Join(", ", proveedoresFinales)}");

            var conMultiplesFotos = await prodDb.Productos.CountAsync(p => p.ImagenesJson.Contains("\",\""));
            _output.WriteLine($"  Productos con galería multi-foto (ImagenesJson > 1 foto): {conMultiplesFotos}");

            summary.TotalProductosAnalizados.Should().BeGreaterThan(0);
        }

        if (File.Exists(sandboxDbPath))
        {
            var sbOptions = new DbContextOptionsBuilder<AppDbContext>()
                .UseSqlite($"Data Source={sandboxDbPath}")
                .Options;

            using var sbDb = new AppDbContext(sbOptions);
            await SqliteSchemaPatcher.EnsureSchemaUpdatedAsync(sbDb);
            await CatalogClassifierService.ClasificarCatalogoExistenteAsync(sbDb);
        }
    }
}
