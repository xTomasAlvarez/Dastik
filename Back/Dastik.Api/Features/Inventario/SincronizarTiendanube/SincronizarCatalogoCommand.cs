using Dastik.Api.Common;
using MediatR;

namespace Dastik.Api.Features.Inventario.SincronizarTiendanube;

public record SincronizarCatalogoCommand(
    string? StoreId = null,
    string? AccessToken = null
) : IRequest<Result<SincronizarCatalogoResult>>;
