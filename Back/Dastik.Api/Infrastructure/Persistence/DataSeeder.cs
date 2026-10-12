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
    }
}
