using Dastik.Api.Common;

namespace Dastik.Api.Features.Configuracion.Services;

public record BackupInfoDto(
    string Archivo,
    string Motivo,
    DateTime Fecha,
    long TamanoBytes,
    string TamanoLegible,
    bool EsAutomatico
);

public record CrearBackupRequest(string? Motivo = "manual");

public record RestaurarBackupResponse(
    string Mensaje,
    string ArchivoRestaurado,
    string SnapshotPrevio
);

public interface IDatabaseBackupService
{
    Task<Result<BackupInfoDto>> CrearBackupAsync(string motivo = "manual", CancellationToken ct = default);
    Result<List<BackupInfoDto>> ListarBackups();
    Task<Result<RestaurarBackupResponse>> RestaurarBackupAsync(string fileName, CancellationToken ct = default);
    string GetBackupDirectory();
    string ResolveActiveDbPath();
}
