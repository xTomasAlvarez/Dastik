using FluentValidation;
using MediatR;

namespace Dastik.Api.Features.Inventario.CrearProducto;

public static class CrearProductoEndpoint
{
    public static void MapCrearProductoEndpoint(this IEndpointRouteBuilder app)
    {
        app.MapPost("/api/productos", async (
            CrearProductoCommand command,
            ISender sender,
            IValidator<CrearProductoCommand> validator,
            CancellationToken ct) =>
        {
            var validationResult = await validator.ValidateAsync(command, ct);
            if (!validationResult.IsValid)
            {
                return Results.ValidationProblem(validationResult.ToDictionary());
            }

            var result = await sender.Send(command, ct);
            return Results.Created($"/api/productos/{result.ProductoId}", result);
        })
        .WithName("CrearProducto")
        .WithSummary("Crea un nuevo producto en el catálogo con sus variantes de inventario.")
        .WithOpenApi();
    }
}
