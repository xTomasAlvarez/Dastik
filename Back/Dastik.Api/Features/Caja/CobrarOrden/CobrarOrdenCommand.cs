using Dastik.Api.Common;
using Dastik.Api.Domain.Entities;
using MediatR;

namespace Dastik.Api.Features.Caja.CobrarOrden;

public record CobrarOrdenCommand(
    int TurnoId,
    List<ItemCobroDto> Items,
    List<PagoCobroDto> Pagos
) : IRequest<Result<CobrarOrdenResult>>;

public record ItemCobroDto(
    int VarianteId,
    int Cantidad,
    decimal PrecioUnitario
);

public record PagoCobroDto(
    MetodoPago MetodoPago,
    decimal Monto
);

public record CobrarOrdenResult(
    int OrdenId,
    int TurnoId,
    DateTime Fecha,
    decimal Total,
    decimal ComisionCalculada,
    int CantidadItems
);
