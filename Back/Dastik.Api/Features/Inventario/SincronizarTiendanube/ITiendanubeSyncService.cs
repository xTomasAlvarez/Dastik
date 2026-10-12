using Dastik.Api.Common;

namespace Dastik.Api.Features.Inventario.SincronizarTiendanube;

public interface ITiendanubeSyncService
{
    Task<Result<SincronizarCatalogoResult>> SincronizarCatalogoAsync(
        string? storeId = null,
        string? accessToken = null,
        CancellationToken ct = default);
}
