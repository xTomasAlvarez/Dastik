using Dastik.Api.Domain.Entities;
using Dastik.Api.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace Dastik.Api.Features.Configuracion;

public static class ConfiguracionEndpoints
{
    public static void MapConfiguracionEndpoints(this IEndpointRouteBuilder app)
    {
        var invGroup = app.MapGroup("/api/inventario")
            .WithTags("Configuración y Catálogos Base")
            .RequireAuthorization("AdminOnly");

        var cfgGroup = app.MapGroup("/api/configuracion")
            .WithTags("Configuración y Catálogos Base")
            .RequireAuthorization("AdminOnly");

        // ==========================================
        // 1. PROVEEDORES
        // ==========================================
        var listarProveedoresHandler = async (AppDbContext context, CancellationToken ct) =>
        {
            var proveedores = await context.Proveedores
                .AsNoTracking()
                .OrderBy(p => p.Nombre)
                .Select(p => new ProveedorResponse(
                    p.Id,
                    p.Nombre,
                    p.MarkupPorDefecto,
                    p.Productos.Count(prod => prod.Activo)
                ))
                .ToListAsync(ct);

            return Results.Ok(proveedores);
        };

        var crearProveedorHandler = async (
            CrearProveedorRequest request,
            AppDbContext context,
            CancellationToken ct) =>
        {
            if (string.IsNullOrWhiteSpace(request.Nombre))
            {
                return Results.BadRequest(new { error = "El nombre del proveedor es obligatorio." });
            }

            if (request.MarkupPorDefecto < 0)
            {
                return Results.BadRequest(new { error = "El markup por defecto no puede ser negativo." });
            }

            var nombreLimpio = request.Nombre.Trim();
            var existe = await context.Proveedores
                .AnyAsync(p => p.Nombre.ToLower() == nombreLimpio.ToLower(), ct);

            if (existe)
            {
                return Results.Conflict(new { error = $"Ya existe un proveedor con el nombre '{nombreLimpio}'." });
            }

            var nuevo = new Proveedor
            {
                Nombre = nombreLimpio,
                MarkupPorDefecto = Math.Round(request.MarkupPorDefecto, 2)
            };

            context.Proveedores.Add(nuevo);
            await context.SaveChangesAsync(ct);

            var response = new ProveedorResponse(nuevo.Id, nuevo.Nombre, nuevo.MarkupPorDefecto, 0);
            return Results.Created($"/api/inventario/proveedores/{nuevo.Id}", response);
        };

        invGroup.MapGet("/proveedores", listarProveedoresHandler)
            .WithName("ListarProveedores")
            .WithSummary("Lista todos los proveedores registrados con su markup por defecto.")
            .WithOpenApi();

        invGroup.MapPost("/proveedores", crearProveedorHandler)
            .WithName("CrearProveedor")
            .WithSummary("Crea un nuevo proveedor con su markup por defecto.")
            .WithOpenApi();

        cfgGroup.MapGet("/proveedores", listarProveedoresHandler).ExcludeFromDescription();
        cfgGroup.MapPost("/proveedores", crearProveedorHandler).ExcludeFromDescription();

        // ==========================================
        // 2. MARCAS
        // ==========================================
        var listarMarcasHandler = async (AppDbContext context, CancellationToken ct) =>
        {
            var marcas = await context.Marcas
                .AsNoTracking()
                .OrderBy(m => m.Nombre)
                .Select(m => new MarcaResponse(
                    m.Id,
                    m.Nombre,
                    m.Productos.Count(prod => prod.Activo)
                ))
                .ToListAsync(ct);

            return Results.Ok(marcas);
        };

        var crearMarcaHandler = async (
            CrearMarcaRequest request,
            AppDbContext context,
            CancellationToken ct) =>
        {
            if (string.IsNullOrWhiteSpace(request.Nombre))
            {
                return Results.BadRequest(new { error = "El nombre de la marca es obligatorio." });
            }

            var nombreLimpio = request.Nombre.Trim();
            var existe = await context.Marcas
                .AnyAsync(m => m.Nombre.ToLower() == nombreLimpio.ToLower(), ct);

            if (existe)
            {
                return Results.Conflict(new { error = $"Ya existe una marca con el nombre '{nombreLimpio}'." });
            }

            var nueva = new Marca
            {
                Nombre = nombreLimpio
            };

            context.Marcas.Add(nueva);
            await context.SaveChangesAsync(ct);

            var response = new MarcaResponse(nueva.Id, nueva.Nombre, 0);
            return Results.Created($"/api/inventario/marcas/{nueva.Id}", response);
        };

        invGroup.MapGet("/marcas", listarMarcasHandler)
            .WithName("ListarMarcas")
            .WithSummary("Lista todas las marcas registradas en el catálogo.")
            .WithOpenApi();

        invGroup.MapPost("/marcas", crearMarcaHandler)
            .WithName("CrearMarca")
            .WithSummary("Registra una nueva marca comercial.")
            .WithOpenApi();

        cfgGroup.MapGet("/marcas", listarMarcasHandler).ExcludeFromDescription();
        cfgGroup.MapPost("/marcas", crearMarcaHandler).ExcludeFromDescription();

        // ==========================================
        // 3. CATEGORÍAS
        // ==========================================
        var listarCategoriasHandler = async (AppDbContext context, CancellationToken ct) =>
        {
            var categorias = await context.Categorias
                .AsNoTracking()
                .OrderBy(c => c.Nombre)
                .Select(c => new CategoriaResponse(
                    c.Id,
                    c.Nombre,
                    string.IsNullOrWhiteSpace(c.Temporada) ? "Todo el año" : c.Temporada,
                    string.IsNullOrWhiteSpace(c.EsquemaTalles) ? "XS-XL" : c.EsquemaTalles,
                    c.CategoriaPadreId,
                    c.Productos.Count(prod => prod.Activo)
                ))
                .ToListAsync(ct);

            return Results.Ok(categorias);
        };

        var crearCategoriaHandler = async (
            CrearCategoriaRequest request,
            AppDbContext context,
            CancellationToken ct) =>
        {
            if (string.IsNullOrWhiteSpace(request.Nombre))
            {
                return Results.BadRequest(new { error = "El nombre de la categoría es obligatorio." });
            }

            var nombreLimpio = request.Nombre.Trim();
            var existe = await context.Categorias
                .AnyAsync(c => c.Nombre.ToLower() == nombreLimpio.ToLower(), ct);

            if (existe)
            {
                return Results.Conflict(new { error = $"Ya existe una categoría con el nombre '{nombreLimpio}'." });
            }

            var temporada = string.IsNullOrWhiteSpace(request.Temporada) ? "Todo el año" : request.Temporada.Trim();
            var esquemaTalles = string.IsNullOrWhiteSpace(request.EsquemaTalles) ? "XS-XL" : request.EsquemaTalles.Trim();

            var nueva = new Categoria
            {
                Nombre = nombreLimpio,
                Temporada = temporada,
                EsquemaTalles = esquemaTalles,
                CategoriaPadreId = request.CategoriaPadreId
            };

            context.Categorias.Add(nueva);
            await context.SaveChangesAsync(ct);

            var response = new CategoriaResponse(
                nueva.Id,
                nueva.Nombre,
                nueva.Temporada,
                nueva.EsquemaTalles,
                nueva.CategoriaPadreId,
                0
            );
            return Results.Created($"/api/inventario/categorias/{nueva.Id}", response);
        };

        invGroup.MapGet("/categorias", listarCategoriasHandler)
            .WithName("ListarCategorias")
            .WithSummary("Lista todas las categorías con su temporada y esquema de talles.")
            .WithOpenApi();

        invGroup.MapPost("/categorias", crearCategoriaHandler)
            .WithName("CrearCategoria")
            .WithSummary("Crea una nueva categoría con su temporada y esquema de talles.")
            .WithOpenApi();

        cfgGroup.MapGet("/categorias", listarCategoriasHandler).ExcludeFromDescription();
        cfgGroup.MapPost("/categorias", crearCategoriaHandler).ExcludeFromDescription();
    }
}

public record ProveedorResponse(
    int Id,
    string Nombre,
    decimal MarkupPorDefecto,
    int CantidadProductos = 0
);

public record CrearProveedorRequest(
    string Nombre,
    decimal MarkupPorDefecto
);

public record MarcaResponse(
    int Id,
    string Nombre,
    int CantidadProductos = 0
);

public record CrearMarcaRequest(
    string Nombre
);

public record CategoriaResponse(
    int Id,
    string Nombre,
    string Temporada,
    string EsquemaTalles,
    int? CategoriaPadreId = null,
    int CantidadProductos = 0
);

public record CrearCategoriaRequest(
    string Nombre,
    string? Temporada = "Todo el año",
    string? EsquemaTalles = "XS-XL",
    int? CategoriaPadreId = null
);
