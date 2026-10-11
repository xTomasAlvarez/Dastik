using Dastik.Api.Domain.Entities;

namespace Dastik.Api.Domain.Services;

public interface IJwtProvider
{
    string GenerarToken(Usuario usuario, bool isSandboxMode = false);
}
