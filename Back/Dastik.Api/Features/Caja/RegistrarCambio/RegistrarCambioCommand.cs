using Dastik.Api.Common;
using Dastik.Api.Domain.Entities;
using MediatR;

namespace Dastik.Api.Features.Caja.RegistrarCambio;

public record RegistrarCambioCommand(
    int TurnoId,
    int VarianteDevueltaId,
    int CantidadDevuelta,
    int VarianteNuevaId,
    int CantidadNueva,
    string MotivoCambio,
    MetodoPago? MetodoPagoDiferencia = null,
    decimal? MontoDiferenciaPagada = null,
    decimal? RecargoDescuento = null,
    int? OrdenIdOriginal = null
) : IRequest<Result<RegistrarCambioResult>>;

public record RegistrarCambioResult(
    int OrdenId,
    int TurnoId,
    DateTime Fecha,
    decimal SubtotalDevuelto,
    decimal SubtotalNuevo,
    decimal Diferencia,
    decimal MontoCobrado,
    MetodoPago? MetodoPago,
    string MotivoCambio,
    int StockDevueltoFinal,
    int StockNuevoFinal,
    int? OrdenOrigenId = null
);
