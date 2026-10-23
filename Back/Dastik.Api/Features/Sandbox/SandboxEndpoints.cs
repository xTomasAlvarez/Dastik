using Dastik.Api.Domain.Services;
using Dastik.Api.Infrastructure.Persistence;
using Dastik.Api.Infrastructure.Security;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Routing;
using Microsoft.Extensions.Logging;

namespace Dastik.Api.Features.Sandbox;

public static class SandboxEndpoints
{
    public static void MapSandboxEndpoints(this IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/api/sandbox")
            .WithTags("Entorno Sandbox / Modo Capacitación");

        // POST /api/sandbox/reset: Reiniciar práctica de caja en Sandbox
        group.MapPost("/reset", async (
            AppDbContext context,
            ITenantService tenantService,
            GeneradorEan13 eanGenerator,
            IPasswordHasher passwordHasher,
            ILoggerFactory loggerFactory,
            CancellationToken ct) =>
        {
            var isSandbox = tenantService.IsSandboxMode || SandboxDataSeeder.EsBaseDeDatosSandbox(context);
            if (!isSandbox)
            {
                return Results.BadRequest(new { error = "El reinicio de práctica solo está permitido en entorno Sandbox." });
            }

            var logger = loggerFactory.CreateLogger("SandboxEndpoints");
            await SandboxDataSeeder.ResetSandboxAsync(context, eanGenerator, passwordHasher, logger);

            return Results.Ok(new
            {
                message = "Entorno Sandbox reiniciado con éxito. Caja restaurada y lista para comenzar la práctica."
            });
        })
        .RequireAuthorization("OperadorCaja")
        .WithName("ReiniciarSandbox")
        .WithSummary("Limpia ventas y turnos de prueba, restablece stock y restaura el estado para practicar.")
        .WithOpenApi();
    }
}
