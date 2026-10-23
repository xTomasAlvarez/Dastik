using Dastik.Api.Domain.Entities;
using Dastik.Api.Domain.Services;
using Dastik.Api.Infrastructure.Security;
using Dastik.Api.Infrastructure.Tenancy;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;

namespace Dastik.Api.Infrastructure.Persistence;

/// <summary>
/// Seeder de catálogo de prueba exclusivo para la base de datos del Modo Sandbox.
/// Diseñado para que los cajeros y empleados cuenten con productos ficticios y muestras reales para practicar.
/// Cuenta con una guardia estricta para NUNCA insertar datos en la base de datos de producción.
/// </summary>
public static class SandboxDataSeeder
{
    public const string SandboxUserEmailDefault = "cajero.sandbox@dastik.com";
    public const string SandboxUserPasswordDefault = "Dastik2026!";

    public static async Task SeedSandboxDataAsync(IServiceProvider serviceProvider)
    {
        using var scope = serviceProvider.CreateScope();
        var configuration = scope.ServiceProvider.GetRequiredService<IConfiguration>();
        var logger = scope.ServiceProvider.GetService<ILoggerFactory>()?.CreateLogger("SandboxDataSeeder");
        var eanGenerator = scope.ServiceProvider.GetService<GeneradorEan13>() ?? new GeneradorEan13();
        var hasher = scope.ServiceProvider.GetService<IPasswordHasher>() ?? new PasswordHasher();

        var sandboxConn = configuration.GetConnectionString("SandboxConnection")
            ?? configuration["SANDBOX_CONNECTION"]
            ?? TenantService.SandboxConnectionFallback;

        var optionsBuilder = new DbContextOptionsBuilder<AppDbContext>();
        if (sandboxConn.StartsWith("Data Source=", StringComparison.OrdinalIgnoreCase) || sandboxConn.EndsWith(".db", StringComparison.OrdinalIgnoreCase))
        {
            optionsBuilder.UseSqlite(sandboxConn);
        }
        else
        {
            optionsBuilder.UseNpgsql(sandboxConn);
        }
        using var sandboxContext = new AppDbContext(optionsBuilder.Options);
        if (sandboxContext.Database.IsSqlite())
        {
            await sandboxContext.Database.EnsureCreatedAsync();
            await SqliteSchemaPatcher.EnsureSchemaUpdatedAsync(sandboxContext);
        }

        await SeedAsync(sandboxContext, eanGenerator, hasher, logger);
    }

    public static async Task SeedAsync(
        AppDbContext context,
        GeneradorEan13? eanGenerator = null,
        IPasswordHasher? passwordHasher = null,
        ILogger? logger = null)
    {
        // Guardia estricta de seguridad: Jamás sembrar en producción
        if (!EsBaseDeDatosSandbox(context))
        {
            logger?.LogWarning("SandboxDataSeeder abortado: la base de datos de destino no es reconocida como Sandbox.");
            return;
        }

        if (context.Database.IsSqlite())
        {
            await SqliteSchemaPatcher.EnsureSchemaUpdatedAsync(context);
        }

        eanGenerator ??= new GeneradorEan13();
        passwordHasher ??= new PasswordHasher();

// 1. Cuenta Dueño tomiDev se siembra en sección 1.f

        // 1.b Empleado 1: Franco Romero (franco@dastik.com) - pass: "1234", Rol: Empleado, Tarifa: $4.000/h, Turno: Tarde
        var franco = await context.Usuarios.FirstOrDefaultAsync(u => u.Email == "franco@dastik.com" || u.Nombre == "Franco Romero" || u.Nombre == "franco");
        if (franco is null)
        {
            context.Usuarios.Add(new Usuario
            {
                Nombre = "Franco Romero",
                Email = "franco@dastik.com",
                PasswordHash = passwordHasher.Hash("1234"),
                Rol = RolUsuario.Empleado,
                DebeCambiarPassword = false,
                Activo = true,
                TurnoAsignado = "Tarde",
                TarifaPorHora = 4000m,
                FechaCreacion = DateTime.UtcNow
            });
        }
        else
        {
            franco.Nombre = "Franco Romero";
            franco.Email = "franco@dastik.com";
            franco.PasswordHash = passwordHasher.Hash("1234");
            franco.Rol = RolUsuario.Empleado;
            franco.DebeCambiarPassword = false;
            franco.Activo = true;
            franco.TurnoAsignado = "Tarde";
            franco.TarifaPorHora = 4000m;
        }

        // 1.c Empleado 2: Lucas Benítez (lucas@dastik.com) - pass: "1234", Rol: Empleado, Tarifa: $4.500/h, Turno: Mañana
        var lucas = await context.Usuarios.FirstOrDefaultAsync(u => u.Email == "lucas@dastik.com" || u.Nombre == "Lucas Benítez" || u.Nombre == "lucas");
        if (lucas is null)
        {
            context.Usuarios.Add(new Usuario
            {
                Nombre = "Lucas Benítez",
                Email = "lucas@dastik.com",
                PasswordHash = passwordHasher.Hash("1234"),
                Rol = RolUsuario.Empleado,
                DebeCambiarPassword = false,
                Activo = true,
                TurnoAsignado = "Mañana",
                TarifaPorHora = 4500m,
                FechaCreacion = DateTime.UtcNow
            });
        }
        else
        {
            lucas.Nombre = "Lucas Benítez";
            lucas.Email = "lucas@dastik.com";
            lucas.PasswordHash = passwordHasher.Hash("1234");
            lucas.Rol = RolUsuario.Empleado;
            lucas.DebeCambiarPassword = false;
            lucas.Activo = true;
            lucas.TurnoAsignado = "Mañana";
            lucas.TarifaPorHora = 4500m;
        }

        // 1.d Usuario Cajero de prueba por defecto para retrocompatibilidad con tests
        if (!await context.Usuarios.AnyAsync(u => u.Email == SandboxUserEmailDefault))
        {
            context.Usuarios.Add(new Usuario
            {
                Nombre = "Cajero Sandbox Entrenado",
                Email = SandboxUserEmailDefault,
                PasswordHash = passwordHasher.Hash(SandboxUserPasswordDefault),
                Rol = RolUsuario.Empleado,
                DebeCambiarPassword = false,
                Activo = true,
                FechaCreacion = DateTime.UtcNow
            });
        }

        // 1.e Usuario Admin fundador en Sandbox (si no existe)
        if (!await context.Usuarios.AnyAsync(u => u.Email == DataSeeder.AdminEmailDefault))
        {
            context.Usuarios.Add(new Usuario
            {
                Nombre = "Admin Fundador (Sandbox)",
                Email = DataSeeder.AdminEmailDefault,
                PasswordHash = passwordHasher.Hash(DataSeeder.AdminDefaultPassword),
                Rol = RolUsuario.Admin,
                DebeCambiarPassword = false,
                Activo = true,
                FechaCreacion = DateTime.UtcNow
            });
        }

        // 1.f Cuentas Oficiales y de Testing en Sandbox
        await DataSeeder.UpsertUsuarioAsync(context, passwordHasher, "tomidev@dastik.com", "tomiDev", "admin", RolUsuario.Admin, debeCambiarPassword: false, turno: "Completo", tarifa: 0m, esOcultoDev: true);
        await DataSeeder.UpsertUsuarioAsync(context, passwordHasher, "tomi.empleado@dastik.com", "Tomi (Cajero Test)", "TomiDev2026!", RolUsuario.Empleado, debeCambiarPassword: false, turno: "Mañana", tarifa: 4000m, esOcultoDev: true);
        await DataSeeder.UpsertUsuarioAsync(context, passwordHasher, "diego@dastik.com", "Diego", "Dastik2026!", RolUsuario.Admin, debeCambiarPassword: true, turno: "Completo", tarifa: 0m);
        await DataSeeder.UpsertUsuarioAsync(context, passwordHasher, "ale@dastik.com", "Ale", "Dastik2026!", RolUsuario.Empleado, debeCambiarPassword: true, turno: "Mañana", tarifa: 4500m);
        await DataSeeder.UpsertUsuarioAsync(context, passwordHasher, "facundo@dastik.com", "Facundo", "Dastik2026!", RolUsuario.Empleado, debeCambiarPassword: true, turno: "Tarde", tarifa: 4500m);

        // 2. Unidades de Negocio
        var unidadDastik = await context.UnidadesNegocio.FirstOrDefaultAsync(u => u.Nombre == "Dastik");
        if (unidadDastik is null)
        {
            unidadDastik = new UnidadNegocio
            {
                Nombre = "Dastik",
                TieneTiendaNube = true,
                TiendanubeStoreId = "sandbox-dastik",
                TiendanubeAccessToken = "mock-token-dastik"
            };
            context.UnidadesNegocio.Add(unidadDastik);
        }
        else
        {
            unidadDastik.TieneTiendaNube = true;
            if (string.IsNullOrEmpty(unidadDastik.TiendanubeStoreId))
            {
                unidadDastik.TiendanubeStoreId = "sandbox-dastik";
                unidadDastik.TiendanubeAccessToken = "mock-token-dastik";
            }
        }

        var unidadHidden = await context.UnidadesNegocio.FirstOrDefaultAsync(u => u.Nombre == "Hidden Sneakers");
        if (unidadHidden is null)
        {
            unidadHidden = new UnidadNegocio { Nombre = "Hidden Sneakers", TieneTiendaNube = false };
            context.UnidadesNegocio.Add(unidadHidden);
        }
        else
        {
            unidadHidden.TieneTiendaNube = false;
        }

        // 3. Marcas
        var marcaDastik = await context.Marcas.FirstOrDefaultAsync(m => m.Nombre == "Dastik");
        if (marcaDastik is null)
        {
            marcaDastik = new Marca { Nombre = "Dastik" };
            context.Marcas.Add(marcaDastik);
        }

        var marcaNike = await context.Marcas.FirstOrDefaultAsync(m => m.Nombre == "Nike");
        if (marcaNike is null)
        {
            marcaNike = new Marca { Nombre = "Nike" };
            context.Marcas.Add(marcaNike);
        }

        var marcaAdidas = await context.Marcas.FirstOrDefaultAsync(m => m.Nombre == "Adidas");
        if (marcaAdidas is null)
        {
            marcaAdidas = new Marca { Nombre = "Adidas" };
            context.Marcas.Add(marcaAdidas);
        }

        // 4. Categorías reales
        var catRemeras = await context.Categorias.FirstOrDefaultAsync(c => c.Nombre == "Remeras");
        if (catRemeras is null)
        {
            catRemeras = new Categoria { Nombre = "Remeras", Temporada = "Todo el año", EsquemaTalles = "S-XXL" };
            context.Categorias.Add(catRemeras);
        }

        var catPantalones = await context.Categorias.FirstOrDefaultAsync(c => c.Nombre == "Pantalones & Jeans");
        if (catPantalones is null)
        {
            catPantalones = new Categoria { Nombre = "Pantalones & Jeans", Temporada = "Todo el año", EsquemaTalles = "38-48 / S-XXL" };
            context.Categorias.Add(catPantalones);
        }

        var catCalzado = await context.Categorias.FirstOrDefaultAsync(c => c.Nombre == "Zapatillas & Sneakers");
        if (catCalzado is null)
        {
            catCalzado = new Categoria { Nombre = "Zapatillas & Sneakers", Temporada = "Todo el año", EsquemaTalles = "US 8-11" };
            context.Categorias.Add(catCalzado);
        }

        // 5. Proveedores reales ("Sample" 55% y "Proveedor General" 50%)
        var provSample = await context.Proveedores.FirstOrDefaultAsync(p => p.Nombre == "Sample");
        if (provSample is null)
        {
            provSample = new Proveedor { Nombre = "Sample", MarkupPorDefecto = 55m };
            context.Proveedores.Add(provSample);
        }

        var provGeneral = await context.Proveedores.FirstOrDefaultAsync(p => p.Nombre == "Proveedor General");
        if (provGeneral is null)
        {
            provGeneral = new Proveedor { Nombre = "Proveedor General", MarkupPorDefecto = 50m };
            context.Proveedores.Add(provGeneral);
        }

        await context.SaveChangesAsync();

        // 6. Si ya existen más de 10 productos en la base de datos Sandbox, solo reclasificamos
        var cantProductosExistentes = await context.Productos.CountAsync();
        if (cantProductosExistentes >= 10)
        {
            await CatalogClassifierService.ClasificarCatalogoExistenteAsync(context);
            return;
        }

        // Intentar clonar muestra de hasta 32 productos reales con fotos desde dastik_dev.db si existe
        await ClonarMuestraDeProduccionSiExisteAsync(context, unidadDastik, catRemeras, marcaDastik, provSample, eanGenerator, logger);

        // Si después de intentar clonar aún no hay productos, sembrar los 4 modelos de demostración básicos
        if (!await context.Productos.AnyAsync())
        {
            var remera = new Producto
            {
                Nombre = "Remera Oversize Básica",
                Descripcion = "Remera de algodón premium corte oversize para entrenamiento y pruebas de POS.",
                UnidadNegocioId = unidadDastik.Id,
                CategoriaId = catRemeras.Id,
                MarcaId = marcaDastik.Id,
                ProveedorId = provSample.Id,
                CostoBase = 15000.00m,
                MarkupAplicado = 1.50m,
                PrecioVenta = 22500.00m,
                Activo = true,
                Variantes = new List<Variante>
                {
                    new() { Talle = "XS", Color = "Negro", CodigoBarras = eanGenerator.Generar(), EsCodigoGenerado = true, StockFisico = 10 },
                    new() { Talle = "S", Color = "Negro", CodigoBarras = eanGenerator.Generar(), EsCodigoGenerado = true, StockFisico = 10 },
                    new() { Talle = "M", Color = "Negro", CodigoBarras = eanGenerator.Generar(), EsCodigoGenerado = true, StockFisico = 15 },
                    new() { Talle = "L", Color = "Negro", CodigoBarras = eanGenerator.Generar(), EsCodigoGenerado = true, StockFisico = 15 },
                    new() { Talle = "XL", Color = "Negro", CodigoBarras = eanGenerator.Generar(), EsCodigoGenerado = true, StockFisico = 10 }
                }
            };

            var pantalon = new Producto
            {
                Nombre = "Pantalón Cargo",
                Descripcion = "Pantalón cargo ripstop con bolsillos funcionales para pruebas de caja.",
                UnidadNegocioId = unidadDastik.Id,
                CategoriaId = catPantalones.Id,
                MarcaId = marcaDastik.Id,
                ProveedorId = provSample.Id,
                CostoBase = 28000.00m,
                MarkupAplicado = 1.50m,
                PrecioVenta = 42000.00m,
                Activo = true,
                Variantes = new List<Variante>
                {
                    new() { Talle = "XS", Color = "Beige", CodigoBarras = eanGenerator.Generar(), EsCodigoGenerado = true, StockFisico = 8 },
                    new() { Talle = "S", Color = "Beige", CodigoBarras = eanGenerator.Generar(), EsCodigoGenerado = true, StockFisico = 8 },
                    new() { Talle = "M", Color = "Beige", CodigoBarras = eanGenerator.Generar(), EsCodigoGenerado = true, StockFisico = 12 },
                    new() { Talle = "L", Color = "Beige", CodigoBarras = eanGenerator.Generar(), EsCodigoGenerado = true, StockFisico = 12 },
                    new() { Talle = "XL", Color = "Beige", CodigoBarras = eanGenerator.Generar(), EsCodigoGenerado = true, StockFisico = 8 }
                }
            };

            var dunk = new Producto
            {
                Nombre = "Nike Dunk Low Panda",
                Descripcion = "Sneaker clásica colorway White/Black para pruebas de venta y caja en Hidden Sneakers.",
                UnidadNegocioId = unidadHidden.Id,
                CategoriaId = catCalzado.Id,
                MarcaId = marcaNike.Id,
                ProveedorId = provGeneral.Id,
                CostoBase = 90000.00m,
                MarkupAplicado = 1.60m,
                PrecioVenta = 144000.00m,
                Activo = true,
                Variantes = new List<Variante>
                {
                    new() { Talle = "US 8", Color = "White/Black", CodigoBarras = eanGenerator.Generar(), EsCodigoGenerado = true, StockFisico = 5 },
                    new() { Talle = "US 9", Color = "White/Black", CodigoBarras = eanGenerator.Generar(), EsCodigoGenerado = true, StockFisico = 6 },
                    new() { Talle = "US 10", Color = "White/Black", CodigoBarras = eanGenerator.Generar(), EsCodigoGenerado = true, StockFisico = 6 },
                    new() { Talle = "US 11", Color = "White/Black", CodigoBarras = eanGenerator.Generar(), EsCodigoGenerado = true, StockFisico = 4 }
                }
            };

            var yeezy = new Producto
            {
                Nombre = "Adidas Yeezy Slide",
                Descripcion = "Sandalia slide monocromática de espuma EVA de alta resistencia.",
                UnidadNegocioId = unidadHidden.Id,
                CategoriaId = catCalzado.Id,
                MarcaId = marcaAdidas.Id,
                ProveedorId = provGeneral.Id,
                CostoBase = 60000.00m,
                MarkupAplicado = 1.50m,
                PrecioVenta = 90000.00m,
                Activo = true,
                Variantes = new List<Variante>
                {
                    new() { Talle = "US 8", Color = "Onyx", CodigoBarras = eanGenerator.Generar(), EsCodigoGenerado = true, StockFisico = 6 },
                    new() { Talle = "US 9", Color = "Onyx", CodigoBarras = eanGenerator.Generar(), EsCodigoGenerado = true, StockFisico = 8 },
                    new() { Talle = "US 10", Color = "Onyx", CodigoBarras = eanGenerator.Generar(), EsCodigoGenerado = true, StockFisico = 8 },
                    new() { Talle = "US 11", Color = "Onyx", CodigoBarras = eanGenerator.Generar(), EsCodigoGenerado = true, StockFisico = 5 }
                }
            };

            context.Productos.AddRange(remera, pantalon, dunk, yeezy);
            await context.SaveChangesAsync();
        }

        await CatalogClassifierService.ClasificarCatalogoExistenteAsync(context);

        logger?.LogInformation("SandboxDataSeeder completado: catálogo preparado en la base de datos Sandbox.");
    }

    /// <summary>
    /// Restablece el entorno de práctica en Sandbox: limpia transacciones de prueba (ventas, arqueos, turnos)
    /// y restablece el stock a 10 unidades para que el cajero vuelva a iniciar sus misiones desde cero.
    /// </summary>
    public static async Task ResetSandboxAsync(
        AppDbContext context,
        GeneradorEan13? eanGenerator = null,
        IPasswordHasher? passwordHasher = null,
        ILogger? logger = null)
    {
        if (!EsBaseDeDatosSandbox(context))
        {
            throw new InvalidOperationException("Guardia de seguridad: No se permite reiniciar una base de datos que no sea de Sandbox.");
        }

        // 1. Eliminar datos operativos de prueba
        context.Pagos.RemoveRange(context.Pagos);
        context.DetallesOrden.RemoveRange(context.DetallesOrden);
        context.Ordenes.RemoveRange(context.Ordenes);
        context.Turnos.RemoveRange(context.Turnos);
        context.OutboxMessages.RemoveRange(context.OutboxMessages);
        await context.SaveChangesAsync();

        // 2. Restablecer stock de todas las variantes a 10 unidades
        var variantes = await context.Variantes.ToListAsync();
        foreach (var v in variantes)
        {
            v.StockFisico = 10;
        }
        await context.SaveChangesAsync();

        // 3. Re-sembrar usuarios y catálogo base si hiciera falta
        await SeedAsync(context, eanGenerator, passwordHasher, logger);
        logger?.LogInformation("ResetSandboxAsync completado: entorno Sandbox restaurado para práctica.");
    }

    private static async Task ClonarMuestraDeProduccionSiExisteAsync(
        AppDbContext sandboxContext,
        UnidadNegocio unidadDastik,
        Categoria catRemeras,
        Marca marcaDastik,
        Proveedor provSample,
        GeneradorEan13 eanGenerator,
        ILogger? logger)
    {
        var prodDbPath = EncontrarRutaDastikDevDb();
        if (string.IsNullOrEmpty(prodDbPath))
        {
            return;
        }

        try
        {
            var options = new DbContextOptionsBuilder<AppDbContext>()
                .UseSqlite($"Data Source={prodDbPath}")
                .Options;

            using var prodContext = new AppDbContext(options);
            if (!await prodContext.Productos.AnyAsync())
            {
                return;
            }

            // Seleccionar hasta 32 productos con imagen válida y variantes
            var muestra = await prodContext.Productos
                .AsNoTracking()
                .Include(p => p.Variantes)
                .Where(p => p.Activo && !string.IsNullOrEmpty(p.ImagenUrl))
                .OrderBy(p => p.Id)
                .Take(32)
                .ToListAsync();

            if (muestra.Count == 0)
            {
                return;
            }

            foreach (var p in muestra)
            {
                if (await sandboxContext.Productos.AnyAsync(x => x.Nombre == p.Nombre))
                {
                    continue;
                }

                var prodClonado = new Producto
                {
                    Nombre = p.Nombre,
                    Descripcion = p.Descripcion,
                    UnidadNegocioId = unidadDastik.Id,
                    CategoriaId = catRemeras.Id,
                    MarcaId = marcaDastik.Id,
                    ProveedorId = provSample.Id,
                    CostoBase = p.CostoBase > 0 ? p.CostoBase : 15000m,
                    MarkupAplicado = p.MarkupAplicado > 0 ? p.MarkupAplicado : 1.5m,
                    PrecioVenta = p.PrecioVenta > 0 ? p.PrecioVenta : 22500m,
                    ImagenUrl = p.ImagenUrl,
                    ImagenesJson = p.ImagenesJson ?? "[]",
                    Activo = true,
                    Variantes = p.Variantes.Select(v => new Variante
                    {
                        Talle = v.Talle,
                        Color = v.Color,
                        CodigoBarras = !string.IsNullOrWhiteSpace(v.CodigoBarras) ? v.CodigoBarras : eanGenerator.Generar(),
                        EsCodigoGenerado = v.EsCodigoGenerado,
                        StockFisico = Math.Max(v.StockFisico, 10)
                    }).ToList()
                };

                sandboxContext.Productos.Add(prodClonado);
            }

            await sandboxContext.SaveChangesAsync();
            logger?.LogInformation("SandboxDataSeeder: {Cantidad} productos reales con fotos clonados a Sandbox.", muestra.Count);
        }
        catch (Exception ex)
        {
            logger?.LogWarning(ex, "SandboxDataSeeder: No se pudo clonar la muestra desde dastik_dev.db. Se usarán productos base.");
        }
    }

    private static string? EncontrarRutaDastikDevDb()
    {
        var candidatas = new[]
        {
            "dastik_dev.db",
            Path.Combine(Directory.GetCurrentDirectory(), "dastik_dev.db"),
            Path.Combine(Directory.GetCurrentDirectory(), "Back", "Dastik.Api", "dastik_dev.db"),
            Path.Combine(AppContext.BaseDirectory, "dastik_dev.db"),
            Path.Combine(AppContext.BaseDirectory, "..", "..", "..", "dastik_dev.db"),
            Path.Combine(AppContext.BaseDirectory, "..", "..", "..", "..", "Back", "Dastik.Api", "dastik_dev.db")
        };

        return candidatas.FirstOrDefault(File.Exists);
    }

    public static bool EsBaseDeDatosSandbox(AppDbContext context)
    {
        var connString = context.Database.GetConnectionString();
        if (string.IsNullOrEmpty(connString))
        {
            return false;
        }

        return connString.Contains("sandbox", StringComparison.OrdinalIgnoreCase)
            || connString.Contains(":memory:", StringComparison.OrdinalIgnoreCase);
    }
}
