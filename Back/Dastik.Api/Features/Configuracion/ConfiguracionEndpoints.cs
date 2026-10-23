using Dastik.Api.Domain.Entities;
using Dastik.Api.Features.Configuracion.Services;
using Dastik.Api.Infrastructure.Persistence;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Routing;
using Microsoft.EntityFrameworkCore;

namespace Dastik.Api.Features.Configuracion;

public record ProveedorDto(int Id, string Nombre, decimal MarkupPorDefecto);
public record ProveedorResponse(int Id, string Nombre, decimal MarkupPorDefecto, int CantidadProductos = 0);
public record CrearProveedorRequest(string Nombre, decimal MarkupPorDefecto);
public record ActualizarProveedorRequest(string Nombre, decimal MarkupPorDefecto);

public record MarcaDto(int Id, string Nombre);
public record MarcaResponse(int Id, string Nombre, int CantidadProductos = 0);
public record CrearMarcaRequest(string Nombre);
public record ActualizarMarcaRequest(string Nombre);

public record CategoriaDto(int Id, string Nombre, string Temporada, string EsquemaTalles);
public record CategoriaResponse(
    int Id,
    string Nombre,
    string Temporada,
    string EsquemaTalles,
    int? CategoriaPadreId = null,
    int CantidadProductos = 0);
public record CrearCategoriaRequest(string Nombre, string? Temporada = "Todo el año", string? EsquemaTalles = "S,M,L,XL", int? CategoriaPadreId = null);
public record ActualizarCategoriaRequest(string Nombre, string? Temporada = "Todo el año", string? EsquemaTalles = "S,M,L,XL", int? CategoriaPadreId = null);

public static class ConfiguracionEndpoints
{
    public static void MapConfiguracionEndpoints(this IEndpointRouteBuilder app)
    {
        var invGroup = app.MapGroup("/api/inventario").WithTags("Configuracion");
        var cfgGroup = app.MapGroup("/api/configuracion").WithTags("Configuracion");

        RegistrarRutasCatalogosBase(invGroup);
        RegistrarRutasCatalogosBase(cfgGroup);
        RegistrarRutasBackups(cfgGroup);
    }

    private static void RegistrarRutasBackups(RouteGroupBuilder group)
    {
        // ==========================================
        // 4. BACKUPS & ROLLBACK DE BASE DE DATOS
        // ==========================================
        group.MapGet("/backups", (IDatabaseBackupService backupService) =>
        {
            var result = backupService.ListarBackups();
            if (!result.IsSuccess)
            {
                return Results.BadRequest(new { error = result.Error });
            }
            return Results.Ok(result.Value);
        })
        .WithName("ListarBackups")
        .WithSummary("Lista todos los puntos de restauración disponibles con metadatos de tamaño, fecha y motivo.")
        .RequireAuthorization("AdminOnly");

        group.MapPost("/backups", async (CrearBackupRequest? req, IDatabaseBackupService backupService, CancellationToken ct) =>
        {
            var motivo = req?.Motivo ?? "manual";
            var result = await backupService.CrearBackupAsync(motivo, ct);
            if (!result.IsSuccess)
            {
                return Results.BadRequest(new { error = result.Error });
            }
            return Results.Ok(result.Value);
        })
        .WithName("CrearBackupManual")
        .WithSummary("Genera un snapshot inmediato de la base de datos con motivo personalizado.")
        .RequireAuthorization("AdminOnly");

        group.MapPost("/backups/{fileName}/restore", async (string fileName, IDatabaseBackupService backupService, CancellationToken ct) =>
        {
            var result = await backupService.RestaurarBackupAsync(fileName, ct);
            if (!result.IsSuccess)
            {
                return Results.BadRequest(new { error = result.Error });
            }
            return Results.Ok(result.Value);
        })
        .WithName("RestaurarBackup")
        .WithSummary("Ejecuta el rollback seguro de la base de datos hacia el snapshot indicado.")
        .RequireAuthorization("AdminOnly");
    }

    private static void RegistrarRutasCatalogosBase(RouteGroupBuilder group)
    {
        // ==========================================
        // 1. PROVEEDORES (GET, POST, PUT, DELETE)
        // ==========================================
        group.MapGet("/proveedores", async (AppDbContext db, CancellationToken ct) =>
        {
            var proveedores = await db.Proveedores
                .AsNoTracking()
                .OrderBy(p => p.Nombre)
                .Select(p => new ProveedorResponse(
                    p.Id,
                    p.Nombre,
                    p.MarkupPorDefecto,
                    p.Productos.Count(prod => prod.Activo)))
                .ToListAsync(ct);

            return Results.Ok(proveedores);
        }).RequireAuthorization("AdminOnly");

        group.MapPost("/proveedores", async (CrearProveedorRequest req, AppDbContext db, CancellationToken ct) =>
        {
            if (string.IsNullOrWhiteSpace(req.Nombre))
            {
                return Results.BadRequest(new { error = "El nombre del proveedor es obligatorio." });
            }

            if (req.MarkupPorDefecto < 0)
            {
                return Results.BadRequest(new { error = "El markup por defecto no puede ser negativo." });
            }

            var nombreLimpio = req.Nombre.Trim();
            var existe = await db.Proveedores
                .AnyAsync(p => p.Nombre.ToLower() == nombreLimpio.ToLower(), ct);

            if (existe)
            {
                return Results.BadRequest(new { error = $"Ya existe un proveedor con el nombre '{nombreLimpio}'." });
            }

            var proveedor = new Proveedor
            {
                Nombre = nombreLimpio,
                MarkupPorDefecto = req.MarkupPorDefecto
            };

            db.Proveedores.Add(proveedor);
            await db.SaveChangesAsync(ct);

            return Results.Created(
                $"/api/inventario/proveedores/{proveedor.Id}",
                new ProveedorResponse(proveedor.Id, proveedor.Nombre, proveedor.MarkupPorDefecto, 0));
        }).RequireAuthorization("AdminOnly");

        group.MapPut("/proveedores/{id:int}", async (int id, ActualizarProveedorRequest req, AppDbContext db, CancellationToken ct) =>
        {
            if (string.IsNullOrWhiteSpace(req.Nombre))
            {
                return Results.BadRequest(new { error = "El nombre del proveedor es obligatorio." });
            }

            if (req.MarkupPorDefecto < 0)
            {
                return Results.BadRequest(new { error = "El markup por defecto no puede ser negativo." });
            }

            var proveedor = await db.Proveedores.FirstOrDefaultAsync(p => p.Id == id, ct);
            if (proveedor is null)
            {
                return Results.NotFound(new { error = "Proveedor no encontrado." });
            }

            var nombreLimpio = req.Nombre.Trim();
            var duplicado = await db.Proveedores
                .AnyAsync(p => p.Id != id && p.Nombre.ToLower() == nombreLimpio.ToLower(), ct);

            if (duplicado)
            {
                return Results.BadRequest(new { error = $"Ya existe otro proveedor con el nombre '{nombreLimpio}'." });
            }

            proveedor.Nombre = nombreLimpio;
            proveedor.MarkupPorDefecto = req.MarkupPorDefecto;
            await db.SaveChangesAsync(ct);

            var cantProds = await db.Productos.CountAsync(prod => prod.ProveedorId == id && prod.Activo, ct);
            return Results.Ok(new ProveedorResponse(proveedor.Id, proveedor.Nombre, proveedor.MarkupPorDefecto, cantProds));
        }).RequireAuthorization("AdminOnly");

        group.MapDelete("/proveedores/{id:int}", async (int id, AppDbContext db, CancellationToken ct) =>
        {
            var proveedor = await db.Proveedores.FirstOrDefaultAsync(p => p.Id == id, ct);
            if (proveedor is null)
            {
                return Results.NotFound(new { error = "Proveedor no encontrado." });
            }

            var productosAsociados = await db.Productos
                .Where(p => p.ProveedorId == id)
                .ToListAsync(ct);

            if (productosAsociados.Count > 0)
            {
                var fallback = await db.Proveedores
                    .FirstOrDefaultAsync(p => p.Id != id && p.Nombre.ToLower() == "sample", ct)
                    ?? await db.Proveedores.FirstOrDefaultAsync(p => p.Id != id, ct);

                if (fallback is null)
                {
                    var nombreFallback = proveedor.Nombre.Equals("Sample", StringComparison.OrdinalIgnoreCase)
                        ? "Proveedor General"
                        : "Sample";
                    fallback = new Proveedor { Nombre = nombreFallback, MarkupPorDefecto = 50m };
                    db.Proveedores.Add(fallback);
                    await db.SaveChangesAsync(ct);
                }

                foreach (var prod in productosAsociados)
                {
                    prod.ProveedorId = fallback.Id;
                }
            }

            db.Proveedores.Remove(proveedor);
            await db.SaveChangesAsync(ct);

            return Results.Ok(new
            {
                mensaje = $"Proveedor '{proveedor.Nombre}' eliminado correctamente.",
                productosReasignados = productosAsociados.Count
            });
        }).RequireAuthorization("AdminOnly");

        // ==========================================
        // 2. MARCAS (GET, POST, PUT, DELETE)
        // ==========================================
        group.MapGet("/marcas", async (AppDbContext db, CancellationToken ct) =>
        {
            var marcas = await db.Marcas
                .AsNoTracking()
                .OrderBy(m => m.Nombre)
                .Select(m => new MarcaResponse(
                    m.Id,
                    m.Nombre,
                    m.Productos.Count(prod => prod.Activo)))
                .ToListAsync(ct);

            return Results.Ok(marcas);
        }).RequireAuthorization("AdminOnly");

        group.MapPost("/marcas", async (CrearMarcaRequest req, AppDbContext db, CancellationToken ct) =>
        {
            if (string.IsNullOrWhiteSpace(req.Nombre))
            {
                return Results.BadRequest(new { error = "El nombre de la marca es obligatorio." });
            }

            var nombreLimpio = req.Nombre.Trim();
            var existe = await db.Marcas
                .AnyAsync(m => m.Nombre.ToLower() == nombreLimpio.ToLower(), ct);

            if (existe)
            {
                return Results.BadRequest(new { error = $"Ya existe la marca '{nombreLimpio}'." });
            }

            var marca = new Marca { Nombre = nombreLimpio };
            db.Marcas.Add(marca);
            await db.SaveChangesAsync(ct);

            return Results.Created(
                $"/api/inventario/marcas/{marca.Id}",
                new MarcaResponse(marca.Id, marca.Nombre, 0));
        }).RequireAuthorization("AdminOnly");

        group.MapPut("/marcas/{id:int}", async (int id, ActualizarMarcaRequest req, AppDbContext db, CancellationToken ct) =>
        {
            if (string.IsNullOrWhiteSpace(req.Nombre))
            {
                return Results.BadRequest(new { error = "El nombre de la marca es obligatorio." });
            }

            var marca = await db.Marcas.FirstOrDefaultAsync(m => m.Id == id, ct);
            if (marca is null)
            {
                return Results.NotFound(new { error = "Marca no encontrada." });
            }

            var nombreLimpio = req.Nombre.Trim();
            var duplicado = await db.Marcas
                .AnyAsync(m => m.Id != id && m.Nombre.ToLower() == nombreLimpio.ToLower(), ct);

            if (duplicado)
            {
                return Results.BadRequest(new { error = $"Ya existe otra marca con el nombre '{nombreLimpio}'." });
            }

            marca.Nombre = nombreLimpio;
            await db.SaveChangesAsync(ct);

            var cantProds = await db.Productos.CountAsync(prod => prod.MarcaId == id && prod.Activo, ct);
            return Results.Ok(new MarcaResponse(marca.Id, marca.Nombre, cantProds));
        }).RequireAuthorization("AdminOnly");

        group.MapDelete("/marcas/{id:int}", async (int id, AppDbContext db, CancellationToken ct) =>
        {
            var marca = await db.Marcas.FirstOrDefaultAsync(m => m.Id == id, ct);
            if (marca is null)
            {
                return Results.NotFound(new { error = "Marca no encontrada." });
            }

            var productosAsociados = await db.Productos
                .Where(p => p.MarcaId == id)
                .ToListAsync(ct);

            if (productosAsociados.Count > 0)
            {
                var fallback = await db.Marcas
                    .FirstOrDefaultAsync(m => m.Id != id && m.Nombre.ToLower() == "dastik", ct)
                    ?? await db.Marcas.FirstOrDefaultAsync(m => m.Id != id, ct);

                if (fallback is null)
                {
                    var nombreFallback = marca.Nombre.Equals("Dastik", StringComparison.OrdinalIgnoreCase)
                        ? "General"
                        : "Dastik";
                    fallback = new Marca { Nombre = nombreFallback };
                    db.Marcas.Add(fallback);
                    await db.SaveChangesAsync(ct);
                }

                foreach (var prod in productosAsociados)
                {
                    prod.MarcaId = fallback.Id;
                }
            }

            db.Marcas.Remove(marca);
            await db.SaveChangesAsync(ct);

            return Results.Ok(new
            {
                mensaje = $"Marca '{marca.Nombre}' eliminada correctamente.",
                productosReasignados = productosAsociados.Count
            });
        }).RequireAuthorization("AdminOnly");

        // ==========================================
        // 3. CATEGORÍAS (GET, POST, PUT, DELETE)
        // ==========================================
        group.MapGet("/categorias", async (AppDbContext db, CancellationToken ct) =>
        {
            var categorias = await db.Categorias
                .AsNoTracking()
                .OrderBy(c => c.Nombre)
                .Select(c => new CategoriaResponse(
                    c.Id,
                    c.Nombre,
                    c.Temporada,
                    c.EsquemaTalles,
                    c.CategoriaPadreId,
                    c.Productos.Count(prod => prod.Activo)))
                .ToListAsync(ct);

            return Results.Ok(categorias);
        }).RequireAuthorization("AdminOnly");

        group.MapPost("/categorias", async (CrearCategoriaRequest req, AppDbContext db, CancellationToken ct) =>
        {
            if (string.IsNullOrWhiteSpace(req.Nombre))
            {
                return Results.BadRequest(new { error = "El nombre de la categoría es obligatorio." });
            }

            var nombreLimpio = req.Nombre.Trim();
            var existe = await db.Categorias
                .AnyAsync(c => c.Nombre.ToLower() == nombreLimpio.ToLower(), ct);

            if (existe)
            {
                return Results.BadRequest(new { error = $"Ya existe la categoría '{nombreLimpio}'." });
            }

            var categoria = new Categoria
            {
                Nombre = nombreLimpio,
                Temporada = string.IsNullOrWhiteSpace(req.Temporada) ? "Todo el año" : req.Temporada.Trim(),
                EsquemaTalles = string.IsNullOrWhiteSpace(req.EsquemaTalles) ? "S,M,L,XL" : req.EsquemaTalles.Trim(),
                CategoriaPadreId = req.CategoriaPadreId
            };

            db.Categorias.Add(categoria);
            await db.SaveChangesAsync(ct);

            return Results.Created(
                $"/api/inventario/categorias/{categoria.Id}",
                new CategoriaResponse(categoria.Id, categoria.Nombre, categoria.Temporada, categoria.EsquemaTalles, categoria.CategoriaPadreId, 0));
        }).RequireAuthorization("AdminOnly");

        group.MapPut("/categorias/{id:int}", async (int id, ActualizarCategoriaRequest req, AppDbContext db, CancellationToken ct) =>
        {
            if (string.IsNullOrWhiteSpace(req.Nombre))
            {
                return Results.BadRequest(new { error = "El nombre de la categoría es obligatorio." });
            }

            var categoria = await db.Categorias.FirstOrDefaultAsync(c => c.Id == id, ct);
            if (categoria is null)
            {
                return Results.NotFound(new { error = "Categoría no encontrada." });
            }

            var nombreLimpio = req.Nombre.Trim();
            var duplicado = await db.Categorias
                .AnyAsync(c => c.Id != id && c.Nombre.ToLower() == nombreLimpio.ToLower(), ct);

            if (duplicado)
            {
                return Results.BadRequest(new { error = $"Ya existe otra categoría con el nombre '{nombreLimpio}'." });
            }

            categoria.Nombre = nombreLimpio;
            if (!string.IsNullOrWhiteSpace(req.Temporada))
            {
                categoria.Temporada = req.Temporada.Trim();
            }
            if (!string.IsNullOrWhiteSpace(req.EsquemaTalles))
            {
                categoria.EsquemaTalles = req.EsquemaTalles.Trim();
            }
            categoria.CategoriaPadreId = req.CategoriaPadreId;

            await db.SaveChangesAsync(ct);

            var cantProds = await db.Productos.CountAsync(prod => prod.CategoriaId == id && prod.Activo, ct);
            return Results.Ok(new CategoriaResponse(
                categoria.Id,
                categoria.Nombre,
                categoria.Temporada,
                categoria.EsquemaTalles,
                categoria.CategoriaPadreId,
                cantProds));
        }).RequireAuthorization("AdminOnly");

        group.MapDelete("/categorias/{id:int}", async (int id, AppDbContext db, CancellationToken ct) =>
        {
            var categoria = await db.Categorias.FirstOrDefaultAsync(c => c.Id == id, ct);
            if (categoria is null)
            {
                return Results.NotFound(new { error = "Categoría no encontrada." });
            }

            var productosAsociados = await db.Productos
                .Where(p => p.CategoriaId == id)
                .ToListAsync(ct);

            if (productosAsociados.Count > 0)
            {
                var fallback = await db.Categorias
                    .FirstOrDefaultAsync(c => c.Id != id && c.Nombre.ToLower() == "remeras", ct)
                    ?? await db.Categorias.FirstOrDefaultAsync(c => c.Id != id, ct);

                if (fallback is null)
                {
                    var nombreFallback = categoria.Nombre.Equals("Remeras", StringComparison.OrdinalIgnoreCase)
                        ? "General"
                        : "Remeras";
                    fallback = new Categoria
                    {
                        Nombre = nombreFallback,
                        Temporada = "Todo el año",
                        EsquemaTalles = "S-XXL"
                    };
                    db.Categorias.Add(fallback);
                    await db.SaveChangesAsync(ct);
                }

                foreach (var prod in productosAsociados)
                {
                    prod.CategoriaId = fallback.Id;
                }
            }

            db.Categorias.Remove(categoria);
            await db.SaveChangesAsync(ct);

            return Results.Ok(new
            {
                mensaje = $"Categoría '{categoria.Nombre}' eliminada correctamente.",
                productosReasignados = productosAsociados.Count
            });
        }).RequireAuthorization("AdminOnly");
    }
}
