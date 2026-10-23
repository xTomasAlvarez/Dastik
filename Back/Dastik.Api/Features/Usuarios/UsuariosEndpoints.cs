using Dastik.Api.Domain.Entities;
using Dastik.Api.Domain.Services;
using Dastik.Api.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace Dastik.Api.Features.Usuarios;

public static class UsuariosEndpoints
{
    public static void MapUsuariosEndpoints(this IEndpointRouteBuilder app)
    {
        // Mapeamos bajo /api/usuarios y bajo /api/empleados para compatibilidad total
        var groupUsuarios = app.MapGroup("/api/usuarios")
            .WithTags("Gestión de Empleados y Sueldos")
            .RequireAuthorization("AdminOnly");

        var groupEmpleados = app.MapGroup("/api/empleados")
            .WithTags("Gestión de Empleados y Sueldos")
            .RequireAuthorization("AdminOnly");

        // 1. GET: Listar empleados
        RouteHandlerBuilder MapListar(RouteGroupBuilder g) =>
            g.MapGet("/empleados", async (
                AppDbContext context,
                CancellationToken ct) =>
            {
                var empleados = await context.Usuarios
                    .AsNoTracking()
                    .Where(u => u.Rol == RolUsuario.Empleado)
                    .OrderBy(u => u.Nombre)
                    .Select(u => new EmpleadoResponse(
                        u.Id,
                        u.Nombre,
                        u.Email,
                        u.Rol.ToString(),
                        string.IsNullOrWhiteSpace(u.TurnoAsignado) ? "Completo" : u.TurnoAsignado,
                        u.TarifaPorHora,
                        u.Activo,
                        u.FechaCreacion,
                        u.DebeCambiarPassword
                    ))
                    .ToListAsync(ct);

                return Results.Ok(empleados);
            })
            .WithSummary("Lista todos los usuarios con rol de Empleado con sus turnos y tarifas por hora.")
            .WithOpenApi();

        MapListar(groupUsuarios).WithName("ListarEmpleados");
        groupEmpleados.MapGet("", async (AppDbContext context, CancellationToken ct) =>
        {
            var empleados = await context.Usuarios
                .AsNoTracking()
                .Where(u => u.Rol == RolUsuario.Empleado)
                .OrderBy(u => u.Nombre)
                .Select(u => new EmpleadoResponse(
                    u.Id,
                    u.Nombre,
                    u.Email,
                    u.Rol.ToString(),
                    string.IsNullOrWhiteSpace(u.TurnoAsignado) ? "Completo" : u.TurnoAsignado,
                    u.TarifaPorHora,
                    u.Activo,
                    u.FechaCreacion,
                    u.DebeCambiarPassword
                ))
                .ToListAsync(ct);

            return Results.Ok(empleados);
        })
        .WithName("ListarEmpleadosDirecto")
        .WithSummary("Lista todos los empleados desde /api/empleados")
        .WithOpenApi();

        // 2. POST: Crear nueva cuenta de empleado
        async Task<IResult> CrearEmpleadoAsync(
            CrearEmpleadoRequest request,
            AppDbContext context,
            IPasswordHasher passwordHasher,
            CancellationToken ct)
        {
            if (string.IsNullOrWhiteSpace(request.Nombre))
            {
                return Results.BadRequest(new { error = "El nombre del empleado es obligatorio." });
            }

            if (string.IsNullOrWhiteSpace(request.Email) || !request.Email.Contains('@'))
            {
                return Results.BadRequest(new { error = "El correo electrónico es inválido." });
            }

            var passwordInicial = string.IsNullOrWhiteSpace(request.Password) ? "Dastik2026!" : request.Password;
            if (passwordInicial.Length < 6)
            {
                return Results.BadRequest(new { error = "La contraseña temporal debe tener al menos 6 caracteres." });
            }

            if (request.TarifaPorHora < 0)
            {
                return Results.BadRequest(new { error = "La tarifa por hora no puede ser negativa." });
            }

            var emailNormalizado = request.Email.Trim().ToLowerInvariant();

            var yaExiste = await context.Usuarios
                .AnyAsync(u => u.Email == emailNormalizado, ct);

            if (yaExiste)
            {
                return Results.Conflict(new { error = $"Ya existe un usuario registrado con el email '{emailNormalizado}'." });
            }

            var turno = request.Turno?.Trim();
            if (string.IsNullOrWhiteSpace(turno))
            {
                turno = "Completo";
            }

            var rol = RolUsuario.Empleado;
            if (!string.IsNullOrWhiteSpace(request.Rol) && Enum.TryParse<RolUsuario>(request.Rol, true, out var rolParseado))
            {
                rol = rolParseado;
            }

            var nuevoEmpleado = new Usuario
            {
                Nombre = request.Nombre.Trim(),
                Email = emailNormalizado,
                PasswordHash = passwordHasher.Hash(passwordInicial),
                Rol = rol,
                DebeCambiarPassword = true,
                Activo = true,
                TurnoAsignado = turno,
                TarifaPorHora = request.TarifaPorHora,
                FechaCreacion = DateTime.UtcNow
            };

            context.Usuarios.Add(nuevoEmpleado);
            await context.SaveChangesAsync(ct);

            var response = new EmpleadoResponse(
                nuevoEmpleado.Id,
                nuevoEmpleado.Nombre,
                nuevoEmpleado.Email,
                nuevoEmpleado.Rol.ToString(),
                nuevoEmpleado.TurnoAsignado,
                nuevoEmpleado.TarifaPorHora,
                nuevoEmpleado.Activo,
                nuevoEmpleado.FechaCreacion,
                nuevoEmpleado.DebeCambiarPassword
            );

            return Results.Created($"/api/usuarios/empleados/{nuevoEmpleado.Id}", response);
        }

        groupUsuarios.MapPost("/empleados", CrearEmpleadoAsync)
            .WithName("CrearEmpleado")
            .WithSummary("Crea una nueva cuenta de empleado con turno y tarifa por hora asignada.")
            .WithOpenApi();

        groupEmpleados.MapPost("", CrearEmpleadoAsync)
            .WithName("CrearEmpleadoDirecto")
            .WithSummary("Crea una nueva cuenta de empleado vía /api/empleados.")
            .WithOpenApi();

        // 3. PUT: Actualizar datos de un empleado
        async Task<IResult> ActualizarEmpleadoAsync(
            int id,
            ActualizarEmpleadoRequest request,
            AppDbContext context,
            CancellationToken ct)
        {
            if (string.IsNullOrWhiteSpace(request.Nombre))
            {
                return Results.BadRequest(new { error = "El nombre del empleado es obligatorio." });
            }

            if (string.IsNullOrWhiteSpace(request.Email) || !request.Email.Contains('@'))
            {
                return Results.BadRequest(new { error = "El correo electrónico es inválido." });
            }

            if (request.TarifaPorHora < 0)
            {
                return Results.BadRequest(new { error = "La tarifa por hora no puede ser negativa." });
            }

            var empleado = await context.Usuarios.FirstOrDefaultAsync(u => u.Id == id, ct);
            if (empleado is null)
            {
                return Results.NotFound(new { error = $"Empleado con ID {id} no encontrado." });
            }

            var emailNormalizado = request.Email.Trim().ToLowerInvariant();
            var emailEnUso = await context.Usuarios.AnyAsync(u => u.Email == emailNormalizado && u.Id != id, ct);
            if (emailEnUso)
            {
                return Results.Conflict(new { error = $"El correo '{emailNormalizado}' ya está en uso por otro usuario." });
            }

            empleado.Nombre = request.Nombre.Trim();
            empleado.Email = emailNormalizado;
            if (!string.IsNullOrWhiteSpace(request.Turno))
            {
                empleado.TurnoAsignado = request.Turno.Trim();
            }
            empleado.TarifaPorHora = request.TarifaPorHora;

            if (!string.IsNullOrWhiteSpace(request.Rol) && Enum.TryParse<RolUsuario>(request.Rol, true, out var rolParseado))
            {
                empleado.Rol = rolParseado;
            }

            await context.SaveChangesAsync(ct);

            var response = new EmpleadoResponse(
                empleado.Id,
                empleado.Nombre,
                empleado.Email,
                empleado.Rol.ToString(),
                empleado.TurnoAsignado,
                empleado.TarifaPorHora,
                empleado.Activo,
                empleado.FechaCreacion,
                empleado.DebeCambiarPassword
            );

            return Results.Ok(response);
        }

        groupUsuarios.MapPut("/empleados/{id:int}", ActualizarEmpleadoAsync)
            .WithName("ActualizarEmpleado")
            .WithSummary("Actualiza la información laboral y de contacto de un empleado.")
            .WithOpenApi();

        groupEmpleados.MapPut("/{id:int}", ActualizarEmpleadoAsync)
            .WithName("ActualizarEmpleadoDirecto")
            .WithSummary("Actualiza los datos de un empleado vía /api/empleados/{id}.")
            .WithOpenApi();

        // 4. POST / PUT: Resetear o blanquear contraseña de un empleado
        async Task<IResult> ResetPasswordAsync(
            int id,
            ResetPasswordEmpleadoRequest request,
            AppDbContext context,
            IPasswordHasher passwordHasher,
            CancellationToken ct)
        {
            var claveTemporal = string.IsNullOrWhiteSpace(request.NuevaPassword) ? "Dastik2026!" : request.NuevaPassword;
            if (claveTemporal.Length < 6)
            {
                return Results.BadRequest(new { error = "La nueva contraseña debe tener al menos 6 caracteres." });
            }

            var empleado = await context.Usuarios.FirstOrDefaultAsync(u => u.Id == id, ct);
            if (empleado is null)
            {
                return Results.NotFound(new { error = $"Empleado con ID {id} no encontrado." });
            }

            empleado.PasswordHash = passwordHasher.Hash(claveTemporal);
            empleado.DebeCambiarPassword = request.DebeCambiarPassword;
            empleado.PinRecuperacionHash = null;
            empleado.PinRecuperacionExpira = null;

            await context.SaveChangesAsync(ct);

            return Results.Ok(new
            {
                message = $"Contraseña restablecida exitosamente para {empleado.Nombre}.",
                passwordTemporal = claveTemporal,
                debeCambiarPassword = empleado.DebeCambiarPassword
            });
        }

        groupUsuarios.MapPut("/empleados/{id:int}/reset-password", ResetPasswordAsync)
            .WithName("ResetPasswordEmpleadoPut")
            .WithSummary("Permite al Administrador restablecer la contraseña a un empleado (PUT).")
            .WithOpenApi();

        groupUsuarios.MapPost("/empleados/{id:int}/reset-password", ResetPasswordAsync)
            .WithName("ResetPasswordEmpleadoPost")
            .WithSummary("Permite al Administrador restablecer la contraseña a un empleado (POST).")
            .WithOpenApi();

        groupEmpleados.MapPost("/{id:int}/reset-password", ResetPasswordAsync)
            .WithName("ResetPasswordEmpleadoDirecto")
            .WithSummary("Blanquea contraseña temporal vía /api/empleados/{id}/reset-password.")
            .WithOpenApi();

        // 5. PATCH: Alternar estado Activo / Inactivo (Pausar empleado)
        async Task<IResult> ToggleActivoAsync(
            int id,
            AppDbContext context,
            CancellationToken ct)
        {
            var empleado = await context.Usuarios.FirstOrDefaultAsync(u => u.Id == id, ct);
            if (empleado is null)
            {
                return Results.NotFound(new { error = $"Empleado con ID {id} no encontrado." });
            }

            empleado.Activo = !empleado.Activo;
            await context.SaveChangesAsync(ct);

            return Results.Ok(new
            {
                id = empleado.Id,
                nombre = empleado.Nombre,
                activo = empleado.Activo,
                message = $"Empleado {empleado.Nombre} {(empleado.Activo ? "activado" : "pausado")} con éxito."
            });
        }

        groupUsuarios.MapPatch("/empleados/{id:int}/toggle-activo", ToggleActivoAsync)
            .WithName("ToggleActivoEmpleado")
            .WithSummary("Alterna el estado Activo/Inactivo de un empleado sin perder datos históricos.")
            .WithOpenApi();

        groupEmpleados.MapPatch("/{id:int}/toggle-activo", ToggleActivoAsync)
            .WithName("ToggleActivoEmpleadoDirecto")
            .WithSummary("Alterna el estado Activo/Inactivo vía /api/empleados/{id}/toggle-activo.")
            .WithOpenApi();

        // 6. POST: Calcular pago de jornada
        groupUsuarios.MapPost("/empleados/{id:int}/calcular-pago", async (
            int id,
            CalcularPagoRequest request,
            AppDbContext context,
            CancellationToken ct) =>
        {
            if (request.HorasTrabajadas <= 0)
            {
                return Results.BadRequest(new { error = "Las horas trabajadas deben ser mayores a 0." });
            }

            var empleado = await context.Usuarios
                .AsNoTracking()
                .FirstOrDefaultAsync(u => u.Id == id, ct);

            if (empleado is null)
            {
                return Results.NotFound(new { error = $"Empleado con ID {id} no encontrado." });
            }

            var totalAPagar = Math.Round(request.HorasTrabajadas * empleado.TarifaPorHora, 2);

            var response = new CalcularPagoResponse(
                EmpleadoId: empleado.Id,
                Nombre: empleado.Nombre,
                TurnoAsignado: string.IsNullOrWhiteSpace(empleado.TurnoAsignado) ? "Completo" : empleado.TurnoAsignado,
                TarifaPorHora: empleado.TarifaPorHora,
                HorasTrabajadas: request.HorasTrabajadas,
                TotalAPagar: totalAPagar
            );

            return Results.Ok(response);
        })
        .WithName("CalcularPagoEmpleado")
        .WithSummary("Calcula la liquidación de jornada basada en las horas trabajadas y la tarifa personalizada del empleado.")
        .WithOpenApi();
    }
}

public record EmpleadoResponse(
    int Id,
    string Nombre,
    string Email,
    string Rol,
    string TurnoAsignado,
    decimal TarifaPorHora,
    bool Activo,
    DateTime FechaCreacion,
    bool DebeCambiarPassword
)
{
    public EmpleadoResponse(
        int id,
        string nombre,
        string email,
        string rol,
        string turnoAsignado,
        decimal tarifaPorHora,
        bool activo,
        DateTime fechaCreacion
    ) : this(id, nombre, email, rol, turnoAsignado, tarifaPorHora, activo, fechaCreacion, false)
    {
    }
}

public record CrearEmpleadoRequest(
    string Nombre,
    string Email,
    string? Password,
    string? Turno,
    decimal TarifaPorHora,
    string? Rol = "Empleado"
);

public record ActualizarEmpleadoRequest(
    string Nombre,
    string Email,
    string? Turno,
    decimal TarifaPorHora,
    string? Rol
);

public record CalcularPagoRequest(
    decimal HorasTrabajadas
);

public record CalcularPagoResponse(
    int EmpleadoId,
    string Nombre,
    string TurnoAsignado,
    decimal TarifaPorHora,
    decimal HorasTrabajadas,
    decimal TotalAPagar
);

public record ResetPasswordEmpleadoRequest(
    string? NuevaPassword = "Dastik2026!",
    bool DebeCambiarPassword = true
);
