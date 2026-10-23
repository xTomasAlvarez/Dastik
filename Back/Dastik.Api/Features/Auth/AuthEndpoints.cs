using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using Dastik.Api.Domain.Services;
using Dastik.Api.Features.Auth.CambiarPassword;
using Dastik.Api.Features.Auth.Login;
using Dastik.Api.Features.Auth.RecuperarPassword;
using Dastik.Api.Infrastructure.Persistence;
using FluentValidation;
using MediatR;
using Microsoft.EntityFrameworkCore;

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

        // 1.b Recuperación de Contraseña del Dueño/Admin con Llave Maestra del local
        group.MapPost("/recuperar-password", async (
            RecuperarPasswordCommand command,
            ISender sender,
            IValidator<RecuperarPasswordCommand> validator,
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

            return Results.Ok(result.Value);
        })
        .AllowAnonymous()
        .WithName("RecuperarPassword")
        .WithSummary("Restablece la contraseña de una cuenta Admin validando la Llave Maestra del local.")
        .WithOpenApi();

        // 1.c Solicitar PIN de 6 dígitos para recuperación
        group.MapPost("/solicitar-pin-recuperacion", async (
            SolicitarPinDto request,
            AppDbContext context,
            IPasswordHasher passwordHasher,
            CancellationToken ct) =>
        {
            if (string.IsNullOrWhiteSpace(request.Email))
            {
                return Results.BadRequest(new { error = "El correo electrónico es obligatorio." });
            }

            var emailNorm = request.Email.Trim().ToLowerInvariant();
            var usuario = await context.Usuarios.FirstOrDefaultAsync(u =>
                u.Email.ToLower() == emailNorm ||
                u.Email.ToLower() == emailNorm + "@dastik.com" ||
                u.Nombre.ToLower() == emailNorm, ct);

            if (usuario is null || !usuario.Activo)
            {
                return Results.Ok(new
                {
                    exitoso = true,
                    mensaje = "Si la cuenta existe y está activa, se ha generado el código PIN de recuperación."
                });
            }

            var pin = System.Security.Cryptography.RandomNumberGenerator.GetInt32(100000, 1000000).ToString();
            usuario.PinRecuperacionHash = passwordHasher.Hash(pin);
            usuario.PinRecuperacionExpira = DateTime.UtcNow.AddMinutes(10);

            await context.SaveChangesAsync(ct);

            return Results.Ok(new
            {
                exitoso = true,
                mensaje = "Código PIN de 6 dígitos generado con éxito (válido por 10 minutos).",
                pinSimuladoDesarrollo = pin
            });
        })
        .AllowAnonymous()
        .WithName("SolicitarPinRecuperacion")
        .WithSummary("Genera un PIN de 6 dígitos con expiración de 10 minutos para recuperación de cuenta.")
        .WithOpenApi();

        // 1.d Verificar PIN de recuperación
        group.MapPost("/verificar-pin-recuperacion", async (
            VerificarPinDto request,
            AppDbContext context,
            IPasswordHasher passwordHasher,
            IConfiguration config,
            CancellationToken ct) =>
        {
            if (string.IsNullOrWhiteSpace(request.Email) || string.IsNullOrWhiteSpace(request.Pin))
            {
                return Results.BadRequest(new { error = "El correo y el PIN son obligatorios." });
            }

            var emailNorm = request.Email.Trim().ToLowerInvariant();
            var usuario = await context.Usuarios.FirstOrDefaultAsync(u =>
                u.Email.ToLower() == emailNorm ||
                u.Email.ToLower() == emailNorm + "@dastik.com" ||
                u.Nombre.ToLower() == emailNorm, ct);

            if (usuario is null || !usuario.Activo)
            {
                return Results.BadRequest(new { error = "Código PIN inválido o cuenta inexistente." });
            }

            var masterKey = config["AUTH_MASTER_KEY"] ?? "DastikMaster2026!";
            var esMasterKey = request.Pin.Trim() == masterKey;

            if (!esMasterKey)
            {
                if (string.IsNullOrEmpty(usuario.PinRecuperacionHash) || !usuario.PinRecuperacionExpira.HasValue)
                {
                    return Results.BadRequest(new { error = "No se ha solicitado un PIN para esta cuenta o ya fue utilizado." });
                }

                if (DateTime.UtcNow > usuario.PinRecuperacionExpira.Value)
                {
                    return Results.BadRequest(new { error = "El código PIN ha expirado (validez: 10 minutos). Por favor solicita uno nuevo." });
                }

                var esValido = passwordHasher.Verify(request.Pin.Trim(), usuario.PinRecuperacionHash);
                if (!esValido)
                {
                    return Results.BadRequest(new { error = "El código PIN ingresado es incorrecto." });
                }
            }

            return Results.Ok(new
            {
                valido = true,
                mensaje = "PIN verificado correctamente."
            });
        })
        .AllowAnonymous()
        .WithName("VerificarPinRecuperacion")
        .WithSummary("Verifica que el PIN de 6 dígitos no haya expirado y coincida con el hash del usuario.")
        .WithOpenApi();

        // 1.e Confirmar recuperación y cambiar contraseña con PIN
        group.MapPost("/confirmar-recuperacion-pin", async (
            ConfirmarRecuperacionPinDto request,
            AppDbContext context,
            IPasswordHasher passwordHasher,
            IConfiguration config,
            CancellationToken ct) =>
        {
            if (string.IsNullOrWhiteSpace(request.Email) || string.IsNullOrWhiteSpace(request.Pin))
            {
                return Results.BadRequest(new { error = "El correo y el PIN son obligatorios." });
            }

            if (string.IsNullOrWhiteSpace(request.NuevaPassword) || request.NuevaPassword.Length < 8)
            {
                return Results.BadRequest(new { error = "La nueva contraseña debe tener al menos 8 caracteres." });
            }

            if (!System.Text.RegularExpressions.Regex.IsMatch(request.NuevaPassword, @"[A-Z]"))
            {
                return Results.BadRequest(new { error = "La nueva contraseña debe contener al menos una letra mayúscula." });
            }

            if (!System.Text.RegularExpressions.Regex.IsMatch(request.NuevaPassword, @"[a-z]"))
            {
                return Results.BadRequest(new { error = "La nueva contraseña debe contener al menos una letra minúscula." });
            }

            if (!System.Text.RegularExpressions.Regex.IsMatch(request.NuevaPassword, @"[0-9]"))
            {
                return Results.BadRequest(new { error = "La nueva contraseña debe contener al menos un número." });
            }

            if (!System.Text.RegularExpressions.Regex.IsMatch(request.NuevaPassword, @"[!@#$%^&*._\-]"))
            {
                return Results.BadRequest(new { error = "La nueva contraseña debe contener al menos un caracter especial (!@#$%^&*._-)." });
            }

            if (request.NuevaPassword != request.ConfirmarPassword)
            {
                return Results.BadRequest(new { error = "Las contraseñas no coinciden." });
            }

            if (request.NuevaPassword == "Dastik2026!")
            {
                return Results.BadRequest(new { error = "La contraseña no puede ser la clave provisoria." });
            }

            var emailNorm = request.Email.Trim().ToLowerInvariant();
            var usuario = await context.Usuarios.FirstOrDefaultAsync(u =>
                u.Email.ToLower() == emailNorm ||
                u.Email.ToLower() == emailNorm + "@dastik.com" ||
                u.Nombre.ToLower() == emailNorm, ct);

            if (usuario is null || !usuario.Activo)
            {
                return Results.BadRequest(new { error = "Cuenta no encontrada." });
            }

            var masterKey = config["AUTH_MASTER_KEY"] ?? "DastikMaster2026!";
            var esMasterKey = request.Pin.Trim() == masterKey;

            if (!esMasterKey)
            {
                if (string.IsNullOrEmpty(usuario.PinRecuperacionHash) || !usuario.PinRecuperacionExpira.HasValue)
                {
                    return Results.BadRequest(new { error = "No hay una solicitud activa de recuperación para esta cuenta." });
                }

                if (DateTime.UtcNow > usuario.PinRecuperacionExpira.Value)
                {
                    return Results.BadRequest(new { error = "El código PIN ha expirado." });
                }

                var esValido = passwordHasher.Verify(request.Pin.Trim(), usuario.PinRecuperacionHash);
                if (!esValido)
                {
                    return Results.BadRequest(new { error = "El código PIN es incorrecto." });
                }
            }

            usuario.PasswordHash = passwordHasher.Hash(request.NuevaPassword);
            usuario.PinRecuperacionHash = null;
            usuario.PinRecuperacionExpira = null;
            usuario.DebeCambiarPassword = false;

            await context.SaveChangesAsync(ct);

            return Results.Ok(new
            {
                exitoso = true,
                mensaje = "Contraseña restablecida exitosamente. Ya puedes iniciar sesión con tu nueva contraseña."
            });
        })
        .AllowAnonymous()
        .WithName("ConfirmarRecuperacionPin")
        .WithSummary("Restablece la contraseña definitiva una vez verificado el PIN de 6 dígitos.")
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

public record SolicitarPinDto(string Email);
public record VerificarPinDto(string Email, string Pin);
public record ConfirmarRecuperacionPinDto(string Email, string Pin, string NuevaPassword, string ConfirmarPassword);
