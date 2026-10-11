using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using Dastik.Api.Features.Auth.CambiarPassword;
using Dastik.Api.Features.Auth.Login;
using FluentValidation;
using MediatR;

namespace Dastik.Api.Features.Auth;

public static class AuthEndpoints
{
    public static void MapAuthEndpoints(this IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/api/auth")
            .WithTags("Autenticación y Seguridad");

        // 1. Inicio de Sesión
        group.MapPost("/login", async (
            LoginCommand command,
            ISender sender,
            IValidator<LoginCommand> validator,
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
                return Results.Unauthorized();
            }

            return Results.Ok(result.Value);
        })
        .AllowAnonymous()
        .WithName("Login")
        .WithSummary("Inicia sesión y genera el token JWT con claims de rol, sandbox y estado de contraseña.")
        .WithOpenApi();

        // 2. Cambio de Contraseña (Requiere Autorización)
        group.MapPost("/cambiar-password", async (
            CambiarPasswordRequest request,
            ClaimsPrincipal user,
            ISender sender,
            IValidator<CambiarPasswordCommand> validator,
            CancellationToken ct) =>
        {
            var usuarioIdStr = user.FindFirst(ClaimTypes.NameIdentifier)?.Value
                ?? user.FindFirst(JwtRegisteredClaimNames.Sub)?.Value
                ?? user.FindFirst("sub")?.Value;

            if (string.IsNullOrWhiteSpace(usuarioIdStr) || !int.TryParse(usuarioIdStr, out var usuarioId))
            {
                return Results.Unauthorized();
            }

            var command = new CambiarPasswordCommand(usuarioId, request.PasswordActual, request.PasswordNuevo);

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
        .RequireAuthorization()
        .WithName("CambiarPassword")
        .WithSummary("Cambia la contraseña del usuario autenticado y desbloquea el flag DebeCambiarPassword.")
        .WithOpenApi();
    }
}
