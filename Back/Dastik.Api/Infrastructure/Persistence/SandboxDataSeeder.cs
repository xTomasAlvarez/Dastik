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
/// Diseñado para que los cajeros y empleados cuenten con productos ficticios para practicar.
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

        // Si ya existen productos en la base de datos Sandbox, no duplicar
        if (await context.Productos.AnyAsync())
        {
            return;
        }

        eanGenerator ??= new GeneradorEan13();
        passwordHasher ??= new PasswordHasher();

        // 1. Usuario Cajero de prueba para Sandbox (si no existe)
        if (!await context.Usuarios.AnyAsync(u => u.Email == SandboxUserEmailDefault))
        {
            context.Usuarios.Add(new Usuario
            {
                Nombre = "Cajero Sandbox Entrenado",
                Email = SandboxUserEmailDefault,
                PasswordHash = passwordHasher.Hash(SandboxUserPasswordDefault),
                Rol = RolUsuario.Empleado,
                DebeCambiarPassword = false, // En sandbox el cajero puede operar inmediatamente
                Activo = true,
                FechaCreacion = DateTime.UtcNow
            });
        }

        // 1.b Usuario Admin fundador en Sandbox (si no existe)
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

        // 2. Unidades de Negocio
        var unidadDastik = await context.UnidadesNegocio.FirstOrDefaultAsync(u => u.Nombre == "Dastik");
        if (unidadDastik is null)
        {
            unidadDastik = new UnidadNegocio { Nombre = "Dastik", TieneTiendaNube = false };
            context.UnidadesNegocio.Add(unidadDastik);
        }

        var unidadHidden = await context.UnidadesNegocio.FirstOrDefaultAsync(u => u.Nombre == "Hidden Sneakers");
        if (unidadHidden is null)
        {
            unidadHidden = new UnidadNegocio { Nombre = "Hidden Sneakers", TieneTiendaNube = false };
            context.UnidadesNegocio.Add(unidadHidden);
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

        // 4. Categorías
        var catIndumentaria = await context.Categorias.FirstOrDefaultAsync(c => c.Nombre == "Indumentaria");
        if (catIndumentaria is null)
        {
            catIndumentaria = new Categoria { Nombre = "Indumentaria", Temporada = "Todo el año", EsquemaTalles = "XS-XL" };
            context.Categorias.Add(catIndumentaria);
        }

        var catCalzado = await context.Categorias.FirstOrDefaultAsync(c => c.Nombre == "Calzado");
        if (catCalzado is null)
        {
            catCalzado = new Categoria { Nombre = "Calzado", Temporada = "Todo el año", EsquemaTalles = "US 8-11" };
            context.Categorias.Add(catCalzado);
        }

        // 5. Proveedores
        var provDastik = await context.Proveedores.FirstOrDefaultAsync(p => p.Nombre == "Proveedor Textil Dastik");
        if (provDastik is null)
        {
            provDastik = new Proveedor { Nombre = "Proveedor Textil Dastik", MarkupPorDefecto = 1.50m };
            context.Proveedores.Add(provDastik);
        }

        var provSneakers = await context.Proveedores.FirstOrDefaultAsync(p => p.Nombre == "Proveedor Sneakerheads");
        if (provSneakers is null)
        {
            provSneakers = new Proveedor { Nombre = "Proveedor Sneakerheads", MarkupPorDefecto = 1.60m };
            context.Proveedores.Add(provSneakers);
        }

        await context.SaveChangesAsync();

        // 6. Productos y Variantes - Unidad "Dastik"
        // Producto 1: Remera Oversize Básica (Talles XS a XL)
        var remera = new Producto
        {
            Nombre = "Remera Oversize Básica",
            Descripcion = "Remera de algodón premium corte oversize para entrenamiento y pruebas de POS.",
            UnidadNegocioId = unidadDastik.Id,
            CategoriaId = catIndumentaria.Id,
            MarcaId = marcaDastik.Id,
            ProveedorId = provDastik.Id,
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

        // Producto 2: Pantalón Cargo (Talles XS a XL)
        var pantalon = new Producto
        {
            Nombre = "Pantalón Cargo",
            Descripcion = "Pantalón cargo ripstop con bolsillos funcionales para pruebas de caja.",
            UnidadNegocioId = unidadDastik.Id,
            CategoriaId = catIndumentaria.Id,
            MarcaId = marcaDastik.Id,
            ProveedorId = provDastik.Id,
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

        // 7. Productos y Variantes - Unidad "Hidden Sneakers"
        // Producto 3: Nike Dunk Low Panda (Talles US 8 a US 11)
        var dunk = new Producto
        {
            Nombre = "Nike Dunk Low Panda",
            Descripcion = "Sneaker clásica colorway White/Black para pruebas de venta y caja en Hidden Sneakers.",
            UnidadNegocioId = unidadHidden.Id,
            CategoriaId = catCalzado.Id,
            MarcaId = marcaNike.Id,
            ProveedorId = provSneakers.Id,
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

        // Producto 4: Adidas Yeezy Slide (Talles US 8 a US 11)
        var yeezy = new Producto
        {
            Nombre = "Adidas Yeezy Slide",
            Descripcion = "Sandalia slide monocromática de espuma EVA de alta resistencia.",
            UnidadNegocioId = unidadHidden.Id,
            CategoriaId = catCalzado.Id,
            MarcaId = marcaAdidas.Id,
            ProveedorId = provSneakers.Id,
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

        logger?.LogInformation("SandboxDataSeeder completado: 4 productos y sus variantes fueron sembrados en la base de datos Sandbox.");
    }

    /// <summary>
    /// Comprueba que la conexión de la base de datos corresponda estrictamente al Sandbox (o contexto en memoria en pruebas).
    /// </summary>
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
