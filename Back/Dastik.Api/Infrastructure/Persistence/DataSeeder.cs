using Dastik.Api.Domain.Entities;
using Dastik.Api.Domain.Services;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;

namespace Dastik.Api.Infrastructure.Persistence;

public static class DataSeeder
{
    public const string AdminEmailDefault = "admin@dastik.com";
    public const string AdminDefaultPassword = "Dastik2026!";

    public static async Task SeedInitialDataAsync(IServiceProvider serviceProvider)
    {
        using var scope = serviceProvider.CreateScope();
        var context = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        var hasher = scope.ServiceProvider.GetRequiredService<IPasswordHasher>();

        // Si la tabla Usuarios está vacía, sembramos el usuario fundador (Admin)
        if (!await context.Usuarios.AnyAsync())
        {
            var adminUser = new Usuario
            {
                Nombre = "Admin Fundador",
                Email = AdminEmailDefault,
                PasswordHash = hasher.Hash(AdminDefaultPassword),
                Rol = RolUsuario.Admin,
                DebeCambiarPassword = true,
                Activo = true,
                FechaCreacion = DateTime.UtcNow
            };

            context.Usuarios.Add(adminUser);
            await context.SaveChangesAsync();
        }

        // Si el usuario cajero de entrenamiento no existe, lo sembramos
        if (!await context.Usuarios.AnyAsync(u => u.Email == "cajero.sandbox@dastik.com"))
        {
            var cajeroUser = new Usuario
            {
                Nombre = "Cajero Sandbox Entrenado",
                Email = "cajero.sandbox@dastik.com",
                PasswordHash = hasher.Hash("Dastik2026!"),
                Rol = RolUsuario.Empleado,
                DebeCambiarPassword = false,
                Activo = true,
                FechaCreacion = DateTime.UtcNow
            };

            context.Usuarios.Add(cajeroUser);
            await context.SaveChangesAsync();
        }

        // Sembrar usuario adicional de testing y desarrollo: tomiDev (Rol Admin)
        var tomiDevUser = await context.Usuarios.FirstOrDefaultAsync(u => u.Email == "tomidev@dastik.com" || u.Nombre == "tomiDev");
        if (tomiDevUser is null)
        {
            tomiDevUser = new Usuario
            {
                Nombre = "tomiDev",
                Email = "tomidev@dastik.com",
                PasswordHash = hasher.Hash(AdminDefaultPassword),
                Rol = RolUsuario.Admin,
                DebeCambiarPassword = false, // Permite acceder directamente al panel admin sin forzar reseteo
                Activo = true,
                FechaCreacion = DateTime.UtcNow
            };

            context.Usuarios.Add(tomiDevUser);
            await context.SaveChangesAsync();
        }
        else
        {
            tomiDevUser.Nombre = "tomiDev";
            tomiDevUser.Email = "tomidev@dastik.com";
            tomiDevUser.PasswordHash = hasher.Hash(AdminDefaultPassword);
            tomiDevUser.Rol = RolUsuario.Admin;
            tomiDevUser.DebeCambiarPassword = false;
            tomiDevUser.Activo = true;
            await context.SaveChangesAsync();
        }

        // Sembrar o actualizar Unidades de Negocio con credenciales de Tiendanube desde variables de entorno
        var configuration = scope.ServiceProvider.GetService<Microsoft.Extensions.Configuration.IConfiguration>();
        var envStoreId = configuration?["TIENDANUBE_STORE_ID"]
            ?? Environment.GetEnvironmentVariable("TIENDANUBE_STORE_ID");
        var envAccessToken = configuration?["TIENDANUBE_ACCESS_TOKEN"]
            ?? Environment.GetEnvironmentVariable("TIENDANUBE_ACCESS_TOKEN");

        var cleanStoreId = !string.IsNullOrWhiteSpace(envStoreId) ? envStoreId.Trim() : null;
        var cleanToken = Dastik.Api.Domain.Integrations.Tiendanube.TiendanubeTokenHelper.NormalizarToken(envAccessToken);

        var dastikUnidad = await context.UnidadesNegocio
            .FirstOrDefaultAsync(u => u.Nombre == UnidadNegocio.Dastik);

        if (dastikUnidad is null)
        {
            dastikUnidad = new UnidadNegocio
            {
                Nombre = UnidadNegocio.Dastik,
                TieneTiendaNube = true,
                TiendanubeStoreId = cleanStoreId,
                TiendanubeAccessToken = cleanToken
            };
            context.UnidadesNegocio.Add(dastikUnidad);
        }
        else
        {
            dastikUnidad.TieneTiendaNube = true;
            if (!string.IsNullOrWhiteSpace(cleanStoreId))
            {
                dastikUnidad.TiendanubeStoreId = cleanStoreId;
            }
            if (!string.IsNullOrWhiteSpace(cleanToken))
            {
                dastikUnidad.TiendanubeAccessToken = cleanToken;
            }
        }

        var hiddenSneakersUnidad = await context.UnidadesNegocio
            .FirstOrDefaultAsync(u => u.Nombre == UnidadNegocio.HiddenSneakers);

        if (hiddenSneakersUnidad is null)
        {
            context.UnidadesNegocio.Add(new UnidadNegocio
            {
                Nombre = UnidadNegocio.HiddenSneakers,
                TieneTiendaNube = false,
                TiendanubeStoreId = null,
                TiendanubeAccessToken = null
            });
        }

        await context.SaveChangesAsync();

        // Sembrar Categorías si no existen
        if (!await context.Categorias.AnyAsync())
        {
            context.Categorias.AddRange(
                new Categoria { Nombre = "Indumentaria", Temporada = "Todo el año", EsquemaTalles = "XS-XL" },
                new Categoria { Nombre = "Calzado", Temporada = "Todo el año", EsquemaTalles = "US 8-11" }
            );
            await context.SaveChangesAsync();
        }

        // Sembrar Marcas si no existen
        if (!await context.Marcas.AnyAsync())
        {
            context.Marcas.AddRange(
                new Marca { Nombre = "Dastik" },
                new Marca { Nombre = "Nike" },
                new Marca { Nombre = "Adidas" }
            );
            await context.SaveChangesAsync();
        }

        // Sembrar Proveedores si no existen
        if (!await context.Proveedores.AnyAsync())
        {
            context.Proveedores.AddRange(
                new Proveedor { Nombre = "Proveedor Textil Dastik", MarkupPorDefecto = 1.50m },
                new Proveedor { Nombre = "Proveedor Sneakerheads", MarkupPorDefecto = 1.60m }
            );
            await context.SaveChangesAsync();
        }
    }
}
