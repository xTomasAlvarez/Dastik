using Dastik.Api.Domain.Entities;
using Dastik.Api.Domain.Services;
using Dastik.Api.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace Dastik.Api.Features.Usuarios;

public static class UsuariosEndpoints
{
    public static void MapUsuariosEndpoints(this IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/api/usuarios")
            .WithTags("Gestión de Empleados y Sueldos")
            .RequireAuthorization("AdminOnly");

        // 1. GET /api/usuarios/empleados: Listar todos los empleados
        group.MapGet("/empleados", async (
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
                    u.FechaCreacion
                ))
                .ToListAsync(ct);

            return Results.Ok(empleados);
        })
        .WithName("ListarEmpleados")
        .WithSummary("Lista todos los usuarios con rol de Empleado con sus turnos y tarifas por hora.")
        .WithOpenApi();

        // 2. POST /api/usuarios/empleados: Crear nueva cuenta de empleado
        group.MapPost("/empleados", async (
            CrearEmpleadoRequest request,
            AppDbContext context,
            IPasswordHasher passwordHasher,
            CancellationToken ct) =>
        {
            if (string.IsNullOrWhiteSpace(request.Nombre))
            {
                return Results.BadRequest(new { error = "El nombre del empleado es obligatorio." });
            }

            if (string.IsNullOrWhiteSpace(request.Email) || !request.Email.Contains('@'))
            {
                return Results.BadRequest(new { error = "El correo electrónico es inválido." });
            }

            if (string.IsNullOrWhiteSpace(request.Password) || request.Password.Length < 6)
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

            var nuevoEmpleado = new Usuario
            {
                Nombre = request.Nombre.Trim(),
                Email = emailNormalizado,
                PasswordHash = passwordHasher.Hash(request.Password),
                Rol = RolUsuario.Empleado,
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
                nuevoEmpleado.FechaCreacion
            );

            return Results.Created($"/api/usuarios/empleados/{nuevoEmpleado.Id}", response);
        })
        .WithName("CrearEmpleado")
        .WithSummary("Crea una nueva cuenta de empleado con turno y tarifa por hora asignada.")
        .WithOpenApi();

        // 3. POST /api/usuarios/empleados/{id}/calcular-pago: Liquidar / calcular pago de jornada
        group.MapPost("/empleados/{id:int}/calcular-pago", async (
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

        // 4. PUT /api/usuarios/empleados/{id}/reset-password: Resetear o cambiar contraseña de un empleado por el Administrador
        group.MapPut("/empleados/{id:int}/reset-password", async (
            int id,
            ResetPasswordEmpleadoRequest request,
            AppDbContext context,
            IPasswordHasher passwordHasher,
            CancellationToken ct) =>
        {
            if (string.IsNullOrWhiteSpace(request.NuevaPassword) || request.NuevaPassword.Length < 6)
            {
                return Results.BadRequest(new { error = "La nueva contraseña debe tener al menos 6 caracteres." });
            }

            var empleado = await context.Usuarios.FirstOrDefaultAsync(u => u.Id == id, ct);
            if (empleado is null)
            {
                return Results.NotFound(new { error = $"Empleado con ID {id} no encontrado." });
            }

            empleado.PasswordHash = passwordHasher.Hash(request.NuevaPassword);
            empleado.DebeCambiarPassword = request.DebeCambiarPassword;

            await context.SaveChangesAsync(ct);

            return Results.Ok(new { message = $"Contraseña actualizada exitosamente para {empleado.Nombre}." });
        })
        .WithName("ResetPasswordEmpleado")
        .WithSummary("Permite al Administrador restablecer o asignar una nueva contraseña a un empleado.")
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
    DateTime FechaCreacion
);

public record CrearEmpleadoRequest(
    string Nombre,
    string Email,
    string Password,
    string Turno,
    decimal TarifaPorHora
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
    string NuevaPassword,
    bool DebeCambiarPassword = false
);
