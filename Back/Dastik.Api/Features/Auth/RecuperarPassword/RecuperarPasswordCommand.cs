using Dastik.Api.Common;
using MediatR;

namespace Dastik.Api.Features.Auth.RecuperarPassword;

/// <summary>
/// Solicitud de recuperación de contraseña del Dueño/Admin mediante la Llave Maestra del local.
/// </summary>
public record RecuperarPasswordCommand(
    string Identificador,
    string ClaveMaestra,
    string NuevaPassword
) : IRequest<Result<RecuperarPasswordResult>>;

public record RecuperarPasswordResult(
    string Mensaje,
    string Nombre
);
