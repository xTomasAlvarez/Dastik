using Dastik.Api.Common;
using Dastik.Api.Domain.Services;
using Dastik.Api.Infrastructure.Persistence;
using Dastik.Api.Infrastructure.Security;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Dastik.Api.Features.Auth.CambiarPassword;

public class CambiarPasswordCommandHandler : IRequestHandler<CambiarPasswordCommand, Result<CambiarPasswordResult>>
{
    private readonly AppDbContext _context;
    private readonly IPasswordHasher _passwordHasher;
    private readonly IJwtProvider _jwtProvider;

    public CambiarPasswordCommandHandler(
        AppDbContext context,
        IPasswordHasher passwordHasher,
        IJwtProvider? jwtProvider = null)
    {
        _context = context;
        _passwordHasher = passwordHasher;
        _jwtProvider = jwtProvider ?? new JwtProvider();
    }

    public async Task<Result<CambiarPasswordResult>> Handle(CambiarPasswordCommand request, CancellationToken cancellationToken)
    {
        var usuario = await _context.Usuarios
            .FirstOrDefaultAsync(u => u.Id == request.UsuarioId && u.Activo, cancellationToken);

        if (usuario is null)
        {
            return Result<CambiarPasswordResult>.Failure("Usuario no encontrado.");
        }

        var isPasswordActualValida = _passwordHasher.Verify(request.PasswordActual, usuario.PasswordHash);
        if (!isPasswordActualValida)
        {
            return Result<CambiarPasswordResult>.Failure("La contraseña actual es incorrecta.");
        }

        // Generar nuevo hash y desbloquear reseteo obligatorio
        usuario.PasswordHash = _passwordHasher.Hash(request.PasswordNuevo);
        usuario.DebeCambiarPassword = false;

        await _context.SaveChangesAsync(cancellationToken);

        // Generar token JWT definitivo con DebeCambiarPassword = false
        var tokenDefinitivo = _jwtProvider.GenerarToken(usuario, false);

        return Result<CambiarPasswordResult>.Success(
            new CambiarPasswordResult("Contraseña actualizada con éxito.", usuario.DebeCambiarPassword, tokenDefinitivo)
        );
    }
}
