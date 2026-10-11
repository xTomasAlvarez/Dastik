using Dastik.Api.Common;
using MediatR;

namespace Dastik.Api.Features.Auth.Login;

public record LoginCommand(
    string Email,
    string Password,
    bool IsSandboxMode = false
) : IRequest<Result<LoginResult>>;

public record LoginResult(
    string Token,
    int UsuarioId,
    string Email,
    string Nombre,
    string Rol,
    bool DebeCambiarPassword,
    bool IsSandboxMode
);
