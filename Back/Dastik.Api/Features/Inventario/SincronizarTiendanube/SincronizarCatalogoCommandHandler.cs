using Dastik.Api.Common;
using MediatR;

namespace Dastik.Api.Features.Inventario.SincronizarTiendanube;

public class SincronizarCatalogoCommandHandler
    : IRequestHandler<SincronizarCatalogoCommand, Result<SincronizarCatalogoResult>>
{
    private readonly ITiendanubeSyncService _syncService;

    public SincronizarCatalogoCommandHandler(ITiendanubeSyncService syncService)
    {
        _syncService = syncService;
    }

    public async Task<Result<SincronizarCatalogoResult>> Handle(
        SincronizarCatalogoCommand request,
        CancellationToken cancellationToken)
    {
        return await _syncService.SincronizarCatalogoAsync(
            request.StoreId,
            request.AccessToken,
            cancellationToken);
    }
}
