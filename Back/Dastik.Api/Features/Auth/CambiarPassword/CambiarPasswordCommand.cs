using Dastik.Api.Common;
using MediatR;

namespace Dastik.Api.Features.Auth.CambiarPassword;

public record CambiarPasswordRequest(
    string PasswordActual,
    string PasswordNuevo
);

public record CambiarPasswordCommand(
    int UsuarioId,
    string PasswordActual,
    string PasswordNuevo
) : IRequest<Result<CambiarPasswordResult>>;

public record CambiarPasswordResult(
    string Mensaje,
    bool DebeCambiarPassword
);
