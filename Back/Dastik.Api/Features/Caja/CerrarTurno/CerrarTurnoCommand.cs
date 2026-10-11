using Dastik.Api.Common;
using MediatR;

namespace Dastik.Api.Features.Caja.CerrarTurno;

public record CerrarTurnoCommand(
    int TurnoId,
    decimal SaldoFinal,
    decimal? MontoRealEfectivo = null
) : IRequest<Result<CerrarTurnoResult>>
{
    public decimal SaldoFinalEfectivo => MontoRealEfectivo.HasValue && MontoRealEfectivo.Value > 0 ? MontoRealEfectivo.Value : SaldoFinal;
}

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
