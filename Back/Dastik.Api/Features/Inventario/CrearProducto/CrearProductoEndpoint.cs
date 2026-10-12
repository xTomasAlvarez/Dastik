using Dastik.Api.Features.Inventario.ListarProductos;
using Dastik.Api.Features.Inventario.SincronizarTiendanube;
using FluentValidation;
using MediatR;

namespace Dastik.Api.Features.Inventario.CrearProducto;

public static class CrearProductoEndpoint
{
    public static void MapCrearProductoEndpoint(this IEndpointRouteBuilder app)
    {
        // 1. Crear Producto
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

        // 1.b Alias Crear Producto en /api/inventario
        app.MapPost("/api/inventario", async (
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
        .WithName("CrearProductoInventario")
        .WithSummary("Crea un nuevo producto en el inventario.")
        .WithOpenApi();

        // 2. Listar Catálogo para el POS
        app.MapGet("/api/productos", async (
            ISender sender,
            CancellationToken ct) =>
        {
            var result = await sender.Send(new ListarProductosQuery(), ct);
            return Results.Ok(result);
        })
        .WithName("ListarProductos")
        .WithSummary("Lista todos los productos activos con sus variantes, talles, códigos de barra y stock físico para el POS.")
        .WithOpenApi();

        // 3. Sincronizar Catálogo desde Tiendanube
        app.MapPost("/api/inventario/sincronizar-tiendanube", async (
            ISender sender,
            CancellationToken ct,
            SincronizarCatalogoCommand? command = null) =>
        {
            var cmd = command ?? new SincronizarCatalogoCommand();
            var result = await sender.Send(cmd, ct);
            if (!result.IsSuccess)
            {
                return Results.BadRequest(new { error = result.Error });
            }

            return Results.Ok(result.Value);
        })
        .WithName("SincronizarCatalogoTiendanube")
        .WithSummary("Sincroniza e importa el catálogo de productos y variantes desde Tiendanube API asignándolo a Dastik.")
        .WithOpenApi();
    }
}
