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

        if (context.Database.IsSqlite())
        {
            await context.Database.EnsureCreatedAsync();
            await SqliteSchemaPatcher.EnsureSchemaUpdatedAsync(context);
        }

        // Limpieza obligatoria de cuentas ficticias / testing en la base de Producción
        var dummyEmails = new[]
        {
            "cajero.sandbox@dastik.com",
            "sofia.empleada@dastik.com",
            "lucas@dastik.com",
            "franco@dastik.com",
            "admin@dastik.com"
        };
        var usuariosBasura = await context.Usuarios
            .Where(u => dummyEmails.Contains(u.Email))
            .ToListAsync();
        if (usuariosBasura.Count > 0)
        {
            context.Usuarios.RemoveRange(usuariosBasura);
            await context.SaveChangesAsync();
        }

        // Sembrar cuentas de Desarrollador Invisibles (Stealth Mode: EsOcultoDev = true)
        await UpsertUsuarioAsync(context, hasher, "tomidev@dastik.com", "Tomi (Admin Dev)", "TomiDev2026!", RolUsuario.Admin, debeCambiarPassword: false, turno: "Completo", tarifa: 0m, esOcultoDev: true);
        await UpsertUsuarioAsync(context, hasher, "tomi.empleado@dastik.com", "Tomi (Cajero Test)", "TomiDev2026!", RolUsuario.Empleado, debeCambiarPassword: false, turno: "Mañana", tarifa: 4000m, esOcultoDev: true);

        // Sembrar cuentas Oficiales del Equipo Dastik (Producción: EsOcultoDev = false)
        await UpsertUsuarioAsync(context, hasher, "diego@dastik.com", "Diego", "Dastik2026!", RolUsuario.Admin, debeCambiarPassword: true, turno: "Completo", tarifa: 0m, esOcultoDev: false);
        await UpsertUsuarioAsync(context, hasher, "ale@dastik.com", "Ale", "Dastik2026!", RolUsuario.Empleado, debeCambiarPassword: true, turno: "Mañana", tarifa: 4500m, esOcultoDev: false);
        await UpsertUsuarioAsync(context, hasher, "facundo@dastik.com", "Facundo", "Dastik2026!", RolUsuario.Empleado, debeCambiarPassword: true, turno: "Tarde", tarifa: 4500m, esOcultoDev: false);

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

        // Sembrar Categorías Oficiales si no existen
        if (!await context.Categorias.AnyAsync())
        {
            foreach (var (nombreCat, esquema) in CatalogClassifierService.CategoriasOficiales)
            {
                context.Categorias.Add(new Categoria
                {
                    Nombre = nombreCat,
                    Temporada = "Todo el año",
                    EsquemaTalles = esquema
                });
            }
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

        // Sembrar Proveedores reales por defecto (Sample 55% y Proveedor General 50%) si no existen
        if (!await context.Proveedores.AnyAsync())
        {
            context.Proveedores.AddRange(
                new Proveedor { Nombre = "Sample", MarkupPorDefecto = 55m },
                new Proveedor { Nombre = "Proveedor General", MarkupPorDefecto = 50m }
            );
            await context.SaveChangesAsync();
        }

        // Ejecutar Limpieza de Proveedores y Clasificación Inteligente sobre todo el catálogo existente
        await CatalogClassifierService.ClasificarCatalogoExistenteAsync(context);

        // Sembrar Turnos Históricos Cerrados de Demostración si no existen
        if (!await context.Turnos.AnyAsync(t => t.Estado == EstadoTurno.Cerrado))
        {
            var admin = await context.Usuarios.FirstOrDefaultAsync(u => u.Rol == RolUsuario.Admin);
            var cajero = await context.Usuarios.FirstOrDefaultAsync(u => u.Rol == RolUsuario.Empleado) ?? admin;

            if (admin != null)
            {
                var hoy = DateTime.UtcNow;

                // 1. Turno de Ayer Mañana (Caja Cuadrada, Diferencia $0)
                var turno1 = new Turno
                {
                    EmpleadoId = admin.Id,
                    FechaApertura = hoy.AddDays(-1).Date.AddHours(9),
                    FechaCierre = hoy.AddDays(-1).Date.AddHours(14),
                    SaldoInicial = 15000m,
                    SaldoFinal = 46500m,
                    GastosTurno = 3500m,
                    Estado = EstadoTurno.Cerrado
                };
                var ord1 = new Orden { Turno = turno1, Fecha = turno1.FechaApertura.AddHours(1), Total = 35000m, Estado = EstadoOrden.Pagada };
                ord1.Pagos.Add(new Pago { Orden = ord1, MetodoPago = MetodoPago.Efectivo, Monto = 35000m });
                var ord2 = new Orden { Turno = turno1, Fecha = turno1.FechaApertura.AddHours(3), Total = 42000m, Estado = EstadoOrden.Pagada };
                ord2.Pagos.Add(new Pago { Orden = ord2, MetodoPago = MetodoPago.Transferencia, Monto = 42000m });

                // 2. Turno de Ayer Tarde (Faltante de $1.000)
                var turno2 = new Turno
                {
                    EmpleadoId = cajero?.Id ?? admin.Id,
                    FechaApertura = hoy.AddDays(-1).Date.AddHours(15),
                    FechaCierre = hoy.AddDays(-1).Date.AddHours(21),
                    SaldoInicial = 20000m,
                    SaldoFinal = 64000m,
                    GastosTurno = 5000m,
                    Estado = EstadoTurno.Cerrado
                };
                var ord3 = new Orden { Turno = turno2, Fecha = turno2.FechaApertura.AddHours(2), Total = 80000m, Estado = EstadoOrden.Pagada };
                ord3.Pagos.Add(new Pago { Orden = ord3, MetodoPago = MetodoPago.Efectivo, Monto = 50000m });
                ord3.Pagos.Add(new Pago { Orden = ord3, MetodoPago = MetodoPago.Debito, Monto = 30000m });
                var ord4 = new Orden { Turno = turno2, Fecha = turno2.FechaApertura.AddHours(4), Total = 65000m, Estado = EstadoOrden.Pagada };
                ord4.Pagos.Add(new Pago { Orden = ord4, MetodoPago = MetodoPago.Credito, Monto = 65000m });

                // 3. Turno de Hace 2 Días Mañana (Sobrante de $500)
                var turno3 = new Turno
                {
                    EmpleadoId = admin.Id,
                    FechaApertura = hoy.AddDays(-2).Date.AddHours(9),
                    FechaCierre = hoy.AddDays(-2).Date.AddHours(14),
                    SaldoInicial = 10000m,
                    SaldoFinal = 35500m,
                    GastosTurno = 0m,
                    Estado = EstadoTurno.Cerrado
                };
                var ord5 = new Orden { Turno = turno3, Fecha = turno3.FechaApertura.AddHours(2), Total = 25000m, Estado = EstadoOrden.Pagada };
                ord5.Pagos.Add(new Pago { Orden = ord5, MetodoPago = MetodoPago.Efectivo, Monto = 25000m });

                context.Turnos.AddRange(turno1, turno2, turno3);
                context.Ordenes.AddRange(ord1, ord2, ord3, ord4, ord5);
                await context.SaveChangesAsync();
            }
        }
    }

    public static async Task UpsertUsuarioAsync(
        AppDbContext context,
        IPasswordHasher hasher,
        string email,
        string nombre,
        string password,
        RolUsuario rol,
        bool debeCambiarPassword,
        string turno,
        decimal tarifa,
        bool esOcultoDev = false)
    {
        var emailLower = email.Trim().ToLowerInvariant();
        var user = context.Usuarios.Local.FirstOrDefault(u => u.Email.Trim().ToLowerInvariant() == emailLower)
            ?? await context.Usuarios.FirstOrDefaultAsync(u => u.Email.ToLower() == emailLower);
        if (user is null)
        {
            user = new Usuario
            {
                Nombre = nombre,
                Email = email.ToLower(),
                PasswordHash = hasher.Hash(password),
                Rol = rol,
                DebeCambiarPassword = debeCambiarPassword,
                Activo = true,
                TurnoAsignado = turno,
                TarifaPorHora = tarifa,
                FechaCreacion = DateTime.UtcNow,
                EsOcultoDev = esOcultoDev
            };
            context.Usuarios.Add(user);
        }
        else
        {
            user.Nombre = nombre;
            user.Rol = rol;
            user.Activo = true;
            user.TurnoAsignado = turno;
            user.EsOcultoDev = esOcultoDev;
            if (tarifa > 0m) user.TarifaPorHora = tarifa;
            if (user.DebeCambiarPassword || !hasher.Verify(password, user.PasswordHash))
            {
                user.PasswordHash = hasher.Hash(password);
                user.DebeCambiarPassword = debeCambiarPassword;
            }
        }
        await context.SaveChangesAsync();
    }
}
