using Dastik.Api.Features.Inventario.EditarProducto;
using Dastik.Api.Features.Inventario.ListarProductos;
using Dastik.Api.Features.Inventario.SincronizarTiendanube;
using Dastik.Api.Infrastructure.Persistence;
using FluentValidation;
using MediatR;
using Microsoft.EntityFrameworkCore;

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
        .RequireAuthorization("AdminOnly")
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
        .RequireAuthorization("AdminOnly")
        .WithOpenApi();

        // 2. Editar Producto (PUT)
        app.MapPut("/api/productos/{id:int}", async (
            int id,
            EditarProductoCommand command,
            ISender sender,
            CancellationToken ct) =>
        {
            if (id != command.Id)
            {
                return Results.BadRequest(new { error = "El ID de la ruta no coincide con el payload." });
            }

            var result = await sender.Send(command, ct);
            return Results.Ok(result);
        })
        .WithName("EditarProducto")
        .WithSummary("Edita un producto existente y sus variantes con sincronización opcional a Tiendanube.")
        .RequireAuthorization("AdminOnly")
        .WithOpenApi();

        app.MapPut("/api/inventario/productos/{id:int}", async (
            int id,
            EditarProductoCommand command,
            ISender sender,
            CancellationToken ct) =>
        {
            if (id != command.Id)
            {
                return Results.BadRequest(new { error = "El ID de la ruta no coincide con el payload." });
            }

            var result = await sender.Send(command, ct);
            return Results.Ok(result);
        })
        .WithName("EditarProductoInventario")
        .WithSummary("Edita un producto en inventario con sincronización opcional a Tiendanube.")
        .RequireAuthorization("AdminOnly")
        .WithOpenApi();

        // 3. Listar Unidades de Negocio para Selección en Formularios
        app.MapGet("/api/inventario/unidades-negocio", async (AppDbContext db, CancellationToken ct) =>
        {
            var unidades = await db.UnidadesNegocio
                .AsNoTracking()
                .OrderBy(u => u.Id)
                .Select(u => new
                {
                    u.Id,
                    u.Nombre,
                    u.TieneTiendaNube
                })
                .ToListAsync(ct);

            return Results.Ok(unidades);
        })
        .WithName("ListarUnidadesNegocio")
        .WithSummary("Lista las unidades de negocio disponibles (Dastik, Hidden Sneakers).")
        .RequireAuthorization("OperadorCaja")
        .WithOpenApi();

        // 4. Listar Catálogo para el POS e Inventario
        app.MapGet("/api/productos", async (
            ISender sender,
            CancellationToken ct) =>
        {
            var result = await sender.Send(new ListarProductosQuery(), ct);
            return Results.Ok(result);
        })
        .WithName("ListarProductos")
        .WithSummary("Lista todos los productos activos con sus variantes, talles, códigos de barra y stock físico.")
        .RequireAuthorization("OperadorCaja")
        .WithOpenApi();

        // 5. Sincronizar Catálogo desde Tiendanube (SOLO LECTURA GET)
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
        .RequireAuthorization("AdminOnly")
        .WithOpenApi();
    }
}
