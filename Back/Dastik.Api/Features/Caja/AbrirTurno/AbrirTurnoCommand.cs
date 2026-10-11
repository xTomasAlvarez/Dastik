using Dastik.Api.Common;
using MediatR;

namespace Dastik.Api.Features.Caja.AbrirTurno;

public record AbrirTurnoCommand(
    int EmpleadoId,
    decimal SaldoInicial
) : IRequest<Result<AbrirTurnoResult>>;

public record AbrirTurnoResult(
    int TurnoId,
    int EmpleadoId,
    DateTime FechaApertura,
    decimal SaldoInicial
);
