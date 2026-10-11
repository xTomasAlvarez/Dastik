using System.Security.Claims;
using Dastik.Api.Domain.Entities;
using Dastik.Api.Features.Caja.AbrirTurno;
using Dastik.Api.Features.Caja.CerrarTurno;
using Dastik.Api.Features.Caja.CobrarOrden;
using Dastik.Api.Infrastructure.Persistence;
using FluentValidation;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Dastik.Api.Features.Caja;

public static class CajaEndpoints
{
    public static void MapCajaEndpoints(this IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/api/caja")
            .WithTags("Caja y POS")
            .RequireAuthorization("OperadorCaja");

        // 0. Consultar Turno Activo (GET /api/caja/turno-activo)
        group.MapGet("/turno-activo", async (
            ClaimsPrincipal user,
            AppDbContext context,
            CancellationToken ct) =>
        {
            var userIdClaim = user.FindFirst(ClaimTypes.NameIdentifier)?.Value
                ?? user.FindFirst("sub")?.Value;

            int.TryParse(userIdClaim, out var empleadoId);

            var turno = await context.Turnos
                .AsNoTracking()
                .Where(t => t.Estado == EstadoTurno.Abierto && (empleadoId == 0 || t.EmpleadoId == empleadoId))
                .OrderByDescending(t => t.FechaApertura)
                .Select(t => new
                {
                    turnoId = t.Id,
                    empleadoId = t.EmpleadoId,
                    fechaApertura = t.FechaApertura,
                    saldoInicial = t.SaldoInicial,
                    estado = t.Estado.ToString()
                })
                .FirstOrDefaultAsync(ct);

            return Results.Ok(turno);
        })
        .WithName("ConsultarTurnoActivo")
        .WithSummary("Consulta si el operador actual tiene un turno de caja activo.")
        .WithOpenApi();

        // 1. Apertura de Turno (Soporta /turnos/abrir y /abrir-turno)
        async Task<IResult> AbrirTurnoHandler(
            AbrirTurnoCommand command,
            ClaimsPrincipal user,
            ISender sender,
            IValidator<AbrirTurnoCommand> validator,
            CancellationToken ct)
        {
            // Si no viene EmpleadoId explícito, inferir del token JWT
            if (command.EmpleadoId <= 0)
            {
                var userIdClaim = user.FindFirst(ClaimTypes.NameIdentifier)?.Value
                    ?? user.FindFirst("sub")?.Value;
                if (int.TryParse(userIdClaim, out var claimId))
                {
                    command = command with { EmpleadoId = claimId };
                }
            }

            var validationResult = await validator.ValidateAsync(command, ct);
            if (!validationResult.IsValid)
            {
                return Results.ValidationProblem(validationResult.ToDictionary());
            }

            var result = await sender.Send(command, ct);
            if (!result.IsSuccess)
            {
                return Results.BadRequest(new { error = result.Error });
            }

            return Results.Created($"/api/caja/turnos/{result.Value!.TurnoId}", result.Value);
        }

        group.MapPost("/turnos/abrir", AbrirTurnoHandler)
            .WithName("AbrirTurno")
            .WithSummary("Abre un nuevo turno de caja para un empleado con saldo inicial.")
            .WithOpenApi();

        group.MapPost("/abrir-turno", AbrirTurnoHandler)
            .WithName("AbrirTurnoAlias")
            .WithSummary("Alias directo para abrir turno de caja.")
            .WithOpenApi();

        // 2. Cobro de Orden (Soporta /ordenes/cobrar y /cobrar)
        async Task<IResult> CobrarOrdenHandler(
            CobrarOrdenCommand command,
            ISender sender,
            IValidator<CobrarOrdenCommand> validator,
            CancellationToken ct)
        {
            var validationResult = await validator.ValidateAsync(command, ct);
            if (!validationResult.IsValid)
            {
                return Results.ValidationProblem(validationResult.ToDictionary());
            }

            var result = await sender.Send(command, ct);
            if (!result.IsSuccess)
            {
                return Results.BadRequest(new { error = result.Error });
            }

            return Results.Created($"/api/caja/ordenes/{result.Value!.OrdenId}", result.Value);
        }

        group.MapPost("/ordenes/cobrar", CobrarOrdenHandler)
            .WithName("CobrarOrden")
            .WithSummary("Registra el cobro de una orden en caja con pagos múltiples y descuento de stock atómico.")
            .WithOpenApi();

        group.MapPost("/cobrar", CobrarOrdenHandler)
            .WithName("CobrarOrdenAlias")
            .WithSummary("Alias directo para cobrar orden en caja.")
            .WithOpenApi();

        // 3. Cierre de Turno (Arqueo)
        group.MapPost("/turnos/cerrar", async (
            CerrarTurnoCommand command,
            ISender sender,
            IValidator<CerrarTurnoCommand> validator,
            CancellationToken ct) =>
        {
            var validationResult = await validator.ValidateAsync(command, ct);
            if (!validationResult.IsValid)
            {
                return Results.ValidationProblem(validationResult.ToDictionary());
            }

            var result = await sender.Send(command, ct);
            if (!result.IsSuccess)
            {
                return Results.BadRequest(new { error = result.Error });
            }

            return Results.Ok(result.Value);
        })
        .WithName("CerrarTurno")
        .WithSummary("Cierra un turno de caja calculando el balance de arqueo y asentando diferencias.")
        .WithOpenApi();
    }
}
