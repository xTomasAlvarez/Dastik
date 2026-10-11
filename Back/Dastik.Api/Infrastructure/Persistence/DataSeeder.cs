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
    }
}
