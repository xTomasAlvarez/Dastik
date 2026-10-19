using Dastik.Api.Common;
using MediatR;

namespace Dastik.Api.Features.Metricas.ObtenerMetricasAvanzadas;

public record ObtenerMetricasAvanzadasQuery(
    string? Periodo = "mes",
    int? UnidadNegocioId = null
) : IRequest<Result<MetricasAvanzadasResponse>>;
