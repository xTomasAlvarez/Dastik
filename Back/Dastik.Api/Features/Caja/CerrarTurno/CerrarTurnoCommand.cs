using Dastik.Api.Common;
using MediatR;

namespace Dastik.Api.Features.Caja.CerrarTurno;

public record CerrarTurnoCommand(
    int TurnoId,
    decimal SaldoFinal
) : IRequest<Result<CerrarTurnoResult>>;

public record CerrarTurnoResult(
    int TurnoId,
    int EmpleadoId,
    DateTime FechaApertura,
    DateTime FechaCierre,
    decimal SaldoInicial,
    decimal TotalVentasEfectivo,
    decimal SaldoEsperado,
    decimal SaldoFinal,
    decimal Diferencia,
    int CantidadOrdenes
);
