using FluentValidation;
using MediatR;

namespace Dastik.Api.Features.Ventas.CobrarOrden;

public static class CobrarOrdenEndpoint
{
    public static void MapCobrarOrdenEndpoint(this IEndpointRouteBuilder app)
    {
        app.MapPost("/api/ordenes/cobrar", async (
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

            return Results.Created($"/api/ordenes/{result.Value!.OrdenId}", result.Value);
        })
        .WithName("CobrarOrden")
        .WithSummary("Registra el cobro de una orden de venta en caja con pagos múltiples y descuento de stock atómico.")
        .WithOpenApi();
    }
}
