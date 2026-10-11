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
    }
}
