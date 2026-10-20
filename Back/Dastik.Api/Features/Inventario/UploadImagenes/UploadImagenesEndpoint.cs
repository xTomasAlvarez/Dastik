using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Routing;

namespace Dastik.Api.Features.Inventario.UploadImagenes;

public static class UploadImagenesEndpoint
{
    private static readonly HashSet<string> ExtensionesPermitidas = new(StringComparer.OrdinalIgnoreCase)
    {
        ".webp", ".png", ".jpg", ".jpeg"
    };

    public static void MapUploadImagenesEndpoint(this IEndpointRouteBuilder app)
    {
        app.MapPost("/api/inventario/upload-imagenes", async (
            IFormFileCollection files,
            IWebHostEnvironment env,
            CancellationToken ct) =>
        {
            if (files == null || files.Count == 0)
            {
                return Results.BadRequest(new { error = "No se adjuntaron archivos de imagen." });
            }

            var uploadsPath = Path.Combine(env.ContentRootPath, "wwwroot", "uploads", "productos");
            if (!Directory.Exists(uploadsPath))
            {
                Directory.CreateDirectory(uploadsPath);
            }

            var urls = new List<string>();

            foreach (var file in files)
            {
                if (file.Length == 0) continue;

                var ext = Path.GetExtension(file.FileName).ToLowerInvariant();
                if (!ExtensionesPermitidas.Contains(ext))
                {
                    return Results.BadRequest(new { error = $"El formato '{ext}' no está permitido. Solo se aceptan WEBP, PNG o JPG/JPEG." });
                }

                // Generar nombre de archivo único y seguro
                var uniqueName = $"{Guid.NewGuid():N}_{Path.GetFileNameWithoutExtension(file.FileName).Replace(" ", "_")}{ext}";
                var filePath = Path.Combine(uploadsPath, uniqueName);

                await using var stream = new FileStream(filePath, FileMode.Create);
                await file.CopyToAsync(stream, ct);

                urls.Add($"/uploads/productos/{uniqueName}");
            }

            return Results.Ok(new { urls });
        })
        .WithName("UploadImagenesProducto")
        .WithSummary("Sube imágenes locales (WEBP, PNG, JPG) para productos del inventario y Tiendanube.")
        .DisableAntiforgery()
        .RequireAuthorization("AdminOnly")
        .WithOpenApi();
    }
}
