using Dastik.Api.Common;
using Dastik.Api.Domain.Services;
using Dastik.Api.Infrastructure.Persistence;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Dastik.Api.Features.Auth.Login;

public class LoginCommandHandler : IRequestHandler<LoginCommand, Result<LoginResult>>
{
    private readonly AppDbContext _context;
    private readonly IPasswordHasher _passwordHasher;
    private readonly IJwtProvider _jwtProvider;

    public LoginCommandHandler(
        AppDbContext context,
        IPasswordHasher passwordHasher,
        IJwtProvider jwtProvider)
    {
        _context = context;
        _passwordHasher = passwordHasher;
        _jwtProvider = jwtProvider;
    }

    public async Task<Result<LoginResult>> Handle(LoginCommand request, CancellationToken cancellationToken)
    {
        var normalizedInput = request.Email.Trim().ToLowerInvariant();

        var usuario = await _context.Usuarios
            .FirstOrDefaultAsync(u =>
                (u.Email.ToLower() == normalizedInput ||
                 u.Nombre.ToLower() == normalizedInput ||
                 u.Email.ToLower() == normalizedInput + "@dastik.com" ||
                 u.Nombre.ToLower().StartsWith(normalizedInput + " ")) &&
                u.Activo, cancellationToken);

        if (usuario is null)
        {
            return Result<LoginResult>.Failure("Credenciales inválidas.");
        }

        var isPasswordValid = _passwordHasher.Verify(request.Password, usuario.PasswordHash);
        if (!isPasswordValid)
        {
            return Result<LoginResult>.Failure("Credenciales inválidas.");
        }

        var token = _jwtProvider.GenerarToken(usuario, request.IsSandboxMode);

        var result = new LoginResult(
            Token: token,
            UsuarioId: usuario.Id,
            Email: usuario.Email,
            Nombre: usuario.Nombre,
            Rol: usuario.Rol.ToString(),
            DebeCambiarPassword: usuario.DebeCambiarPassword,
            IsSandboxMode: request.IsSandboxMode
        );

        return Result<LoginResult>.Success(result);
    }
}
