using System.Security.Cryptography;
using System.Text;
using Dastik.Api.Common;
using Dastik.Api.Domain.Entities;
using Dastik.Api.Domain.Services;
using Dastik.Api.Infrastructure.Persistence;
using MediatR;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;

namespace Dastik.Api.Features.Auth.RecuperarPassword;

/// <summary>
/// Restablece la contraseña de una cuenta Admin validando la Llave Maestra del local.
/// Por seguridad de caja, las cuentas de Empleado NO pueden recuperarse por esta vía:
/// el Dueño debe blanquearlas desde Admin → Empleados.
/// </summary>
public class RecuperarPasswordCommandHandler : IRequestHandler<RecuperarPasswordCommand, Result<RecuperarPasswordResult>>
{
    public const string ClaveMaestraPorDefecto = "DASTIK-2026";
    public const string ErrorGenerico = "No se pudo restablecer la contraseña. Verificá el usuario y la Llave Maestra del local.";

    private readonly AppDbContext _context;
    private readonly IPasswordHasher _passwordHasher;
    private readonly IConfiguration _configuration;

    public RecuperarPasswordCommandHandler(
        AppDbContext context,
        IPasswordHasher passwordHasher,
        IConfiguration configuration)
    {
        _context = context;
        _passwordHasher = passwordHasher;
        _configuration = configuration;
    }

    public async Task<Result<RecuperarPasswordResult>> Handle(RecuperarPasswordCommand request, CancellationToken cancellationToken)
    {
        var claveConfigurada = _configuration["Seguridad:ClaveMaestraLocal"]
            ?? _configuration["CLAVE_MAESTRA_LOCAL"]
            ?? ClaveMaestraPorDefecto;

        if (!ClavesCoinciden(request.ClaveMaestra?.Trim() ?? string.Empty, claveConfigurada))
        {
            return Result<RecuperarPasswordResult>.Failure(ErrorGenerico);
        }

        var normalizado = request.Identificador.Trim().ToLowerInvariant();

        var usuario = await _context.Usuarios
            .FirstOrDefaultAsync(u =>
                (u.Email.ToLower() == normalizado ||
                 u.Nombre.ToLower() == normalizado ||
                 u.Email.ToLower() == normalizado + "@dastik.com") &&
                u.Activo, cancellationToken);

        // Mensaje genérico para no revelar qué cuentas existen ni su rol
        if (usuario is null || usuario.Rol != RolUsuario.Admin)
        {
            return Result<RecuperarPasswordResult>.Failure(ErrorGenerico);
        }

        usuario.PasswordHash = _passwordHasher.Hash(request.NuevaPassword);
        usuario.DebeCambiarPassword = false;

        await _context.SaveChangesAsync(cancellationToken);

        return Result<RecuperarPasswordResult>.Success(
            new RecuperarPasswordResult("Contraseña restablecida correctamente. Ya podés iniciar sesión.", usuario.Nombre));
    }

    /// <summary>Comparación en tiempo constante para evitar ataques de timing sobre la Llave Maestra.</summary>
    private static bool ClavesCoinciden(string ingresada, string configurada)
    {
        var a = Encoding.UTF8.GetBytes(ingresada);
        var b = Encoding.UTF8.GetBytes(configurada);
        return a.Length == b.Length && CryptographicOperations.FixedTimeEquals(a, b);
    }
}
