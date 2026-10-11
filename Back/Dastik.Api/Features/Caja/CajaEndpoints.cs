using Dastik.Api.Features.Caja.AbrirTurno;
using Dastik.Api.Features.Caja.CerrarTurno;
using Dastik.Api.Features.Caja.CobrarOrden;
using FluentValidation;
using MediatR;

namespace Dastik.Api.Features.Caja;

public static class CajaEndpoints
{
    public static void MapCajaEndpoints(this IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/api/caja")
            .WithTags("Caja y POS");

        // 1. Apertura de Turno
        group.MapPost("/turnos/abrir", async (
            AbrirTurnoCommand command,
            ISender sender,
            IValidator<AbrirTurnoCommand> validator,
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

            return Results.Created($"/api/caja/turnos/{result.Value!.TurnoId}", result.Value);
        })
        .WithName("AbrirTurno")
        .WithSummary("Abre un nuevo turno de caja para un empleado con saldo inicial.")
        .WithOpenApi();

        // 2. Cobro de Orden
        group.MapPost("/ordenes/cobrar", async (
            CobrarOrdenCommand command,
            ISender sender,
            IValidator<CobrarOrdenCommand> validator,
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

            return Results.Created($"/api/caja/ordenes/{result.Value!.OrdenId}", result.Value);
        })
        .WithName("CobrarOrden")
        .WithSummary("Registra el cobro de una orden en caja con pagos múltiples y descuento de stock atómico.")
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
