using System.Globalization;
using System.Text.RegularExpressions;
using Dastik.Api.Common;
using Dastik.Api.Domain.Services;
using Dastik.Api.Infrastructure.Persistence;
using Microsoft.AspNetCore.Hosting;
using Microsoft.Data.Sqlite;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace Dastik.Api.Features.Configuracion.Services;

public class DatabaseBackupService : IDatabaseBackupService
{
    private readonly AppDbContext _context;
    private readonly ITenantService _tenantService;
    private readonly IWebHostEnvironment _env;
    private readonly ILogger<DatabaseBackupService> _logger;
    private static readonly SemaphoreSlim _semaphore = new(1, 1);

    public DatabaseBackupService(
        AppDbContext context,
        ITenantService tenantService,
        IWebHostEnvironment env,
        ILogger<DatabaseBackupService> logger)
    {
        _context = context;
        _tenantService = tenantService;
        _env = env;
        _logger = logger;
    }

    public string GetBackupDirectory()
    {
        var path = Path.Combine(_env.ContentRootPath, "Backups");
        if (!Directory.Exists(path))
        {
            Directory.CreateDirectory(path);
        }
        return path;
    }

    public string ResolveActiveDbPath()
    {
        try
        {
            var conn = _tenantService.GetConnectionString();
            if (conn.StartsWith("Data Source=", StringComparison.OrdinalIgnoreCase))
            {
                var builder = new SqliteConnectionStringBuilder(conn);
                var ds = builder.DataSource;
                if (!string.IsNullOrWhiteSpace(ds))
                {
                    if (Path.IsPathRooted(ds))
                    {
                        return ds;
                    }

                    var fullEnvPath = Path.Combine(_env.ContentRootPath, ds);
                    if (File.Exists(fullEnvPath)) return fullEnvPath;

                    var curPath = Path.Combine(Directory.GetCurrentDirectory(), ds);
                    if (File.Exists(curPath)) return curPath;

                    var basePath = Path.Combine(AppContext.BaseDirectory, ds);
                    if (File.Exists(basePath)) return basePath;

                    return fullEnvPath;
                }
            }
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "No se pudo resolver la ruta de la base de datos desde la cadena de conexión.");
        }

        var defaultName = _tenantService.IsSandboxMode ? "dastik_sandbox_dev.db" : "dastik_dev.db";
        var fallbackPath = Path.Combine(_env.ContentRootPath, defaultName);
        if (File.Exists(fallbackPath)) return fallbackPath;

        var altPath = Path.Combine(Directory.GetCurrentDirectory(), defaultName);
        if (File.Exists(altPath)) return altPath;

        return fallbackPath;
    }

    public async Task<Result<BackupInfoDto>> CrearBackupAsync(string motivo = "manual", CancellationToken ct = default)
    {
        await _semaphore.WaitAsync(ct);
        try
        {
            if (!_context.Database.IsSqlite())
            {
                return Result<BackupInfoDto>.Failure("El sistema de hot backups y snapshots automáticos está optimizado para SQLite.");
            }

            var activeDbPath = ResolveActiveDbPath();
            var dbName = Path.GetFileNameWithoutExtension(activeDbPath);
            if (string.IsNullOrWhiteSpace(dbName)) dbName = "dastik_dev";

            var cleanMotivo = string.IsNullOrWhiteSpace(motivo)
                ? "manual"
                : Regex.Replace(motivo.Trim().ToLowerInvariant(), @"[^a-z0-9\-]", "-");

            var timestamp = DateTime.Now.ToString("yyyyMMdd_HHmmss");
            var fileName = $"{dbName}_{timestamp}_{cleanMotivo}.db";
            var backupDir = GetBackupDirectory();
            var destPath = Path.Combine(backupDir, fileName);

            if (File.Exists(destPath))
            {
                fileName = $"{dbName}_{timestamp}_{Guid.NewGuid():N[..4]}_{cleanMotivo}.db";
                destPath = Path.Combine(backupDir, fileName);
            }

            var sqlitePath = destPath.Replace('\\', '/').Replace("'", "''");

            try
            {
                // VACUUM INTO genera un snapshot atómico, compacto y consistente sin interrumpir lecturas ni escrituras
                await _context.Database.ExecuteSqlRawAsync("VACUUM INTO '" + sqlitePath + "'", ct);
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "VACUUM INTO falló. Intentando snapshot vía copia física segura.");
                if (File.Exists(activeDbPath))
                {
                    File.Copy(activeDbPath, destPath, overwrite: true);
                }
                else
                {
                    return Result<BackupInfoDto>.Failure($"No se pudo generar el snapshot: {ex.Message}");
                }
            }

            // Rotación automática inteligente: mantener máximo 20 snapshots
            RotarBackups(20);

            var fileInfo = new FileInfo(destPath);
            bool esAuto = cleanMotivo.StartsWith("inicio", StringComparison.OrdinalIgnoreCase) ||
                          cleanMotivo.StartsWith("pre-sync", StringComparison.OrdinalIgnoreCase) ||
                          cleanMotivo.StartsWith("pre-rollback", StringComparison.OrdinalIgnoreCase);

            string tamanoLegible = FormatearTamano(fileInfo.Length);

            var dto = new BackupInfoDto(
                Archivo: fileName,
                Motivo: cleanMotivo,
                Fecha: DateTime.Now,
                TamanoBytes: fileInfo.Length,
                TamanoLegible: tamanoLegible,
                EsAutomatico: esAuto
            );

            _logger.LogInformation("Snapshot generado con éxito: {FileName} ({TamanoLegible}, motivo: {Motivo})",
                fileName, tamanoLegible, cleanMotivo);

            return Result<BackupInfoDto>.Success(dto);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error al generar backup de base de datos.");
            return Result<BackupInfoDto>.Failure($"Error al crear backup: {ex.Message}");
        }
        finally
        {
            _semaphore.Release();
        }
    }

    public Result<List<BackupInfoDto>> ListarBackups()
    {
        try
        {
            var backupDir = GetBackupDirectory();
            if (!Directory.Exists(backupDir))
            {
                return Result<List<BackupInfoDto>>.Success([]);
            }

            var files = new DirectoryInfo(backupDir)
                .GetFiles("*.db")
                .OrderByDescending(f => f.CreationTimeUtc)
                .ToList();

            var list = new List<BackupInfoDto>();
            foreach (var f in files)
            {
                var nameWithoutExt = Path.GetFileNameWithoutExtension(f.Name);
                var parts = nameWithoutExt.Split('_');

                string motivo = "manual";
                DateTime fecha = f.CreationTime;

                // Formato: dastik_dev_yyyyMMdd_HHmmss_motivo
                if (parts.Length >= 4 && parts[^2].Length == 6 && parts[^3].Length == 8)
                {
                    motivo = parts[^1];
                    if (DateTime.TryParseExact($"{parts[^3]}_{parts[^2]}", "yyyyMMdd_HHmmss",
                        CultureInfo.InvariantCulture, DateTimeStyles.None, out var parsedDate))
                    {
                        fecha = parsedDate;
                    }
                }
                else if (parts.Length >= 2)
                {
                    motivo = parts[^1];
                }

                bool esAuto = motivo.StartsWith("inicio", StringComparison.OrdinalIgnoreCase) ||
                              motivo.StartsWith("pre-sync", StringComparison.OrdinalIgnoreCase) ||
                              motivo.StartsWith("pre-rollback", StringComparison.OrdinalIgnoreCase);

                list.Add(new BackupInfoDto(
                    Archivo: f.Name,
                    Motivo: motivo,
                    Fecha: fecha,
                    TamanoBytes: f.Length,
                    TamanoLegible: FormatearTamano(f.Length),
                    EsAutomatico: esAuto
                ));
            }

            return Result<List<BackupInfoDto>>.Success(list.OrderByDescending(b => b.Fecha).ToList());
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error al listar los backups.");
            return Result<List<BackupInfoDto>>.Failure($"Error al listar los backups: {ex.Message}");
        }
    }

    public async Task<Result<RestaurarBackupResponse>> RestaurarBackupAsync(string fileName, CancellationToken ct = default)
    {
        await _semaphore.WaitAsync(ct);
        try
        {
            if (string.IsNullOrWhiteSpace(fileName))
            {
                return Result<RestaurarBackupResponse>.Failure("Debe especificar el archivo de backup a restaurar.");
            }

            var sanitized = Path.GetFileName(fileName);
            if (!sanitized.EndsWith(".db", StringComparison.OrdinalIgnoreCase))
            {
                return Result<RestaurarBackupResponse>.Failure("Formato no permitido. Solo se pueden restaurar archivos con extensión .db");
            }

            var backupDir = GetBackupDirectory();
            var backupFilePath = Path.Combine(backupDir, sanitized);
            if (!File.Exists(backupFilePath))
            {
                return Result<RestaurarBackupResponse>.Failure($"El punto de restauración '{sanitized}' no existe en el almacenamiento de backups.");
            }

            var activeDbPath = ResolveActiveDbPath();

            // 1. Snapshot de seguridad previo (pre-rollback) para garantizar retorno seguro
            string snapshotPrevio = "ninguno";
            try
            {
                // Liberar el semáforo momentáneamente para CrearBackupAsync o invocar snapshot interno
                var preRollbackPath = Path.Combine(backupDir, $"{Path.GetFileNameWithoutExtension(activeDbPath)}_{DateTime.Now:yyyyMMdd_HHmmss}_pre-rollback.db");
                var sqliteSafePath = preRollbackPath.Replace('\\', '/').Replace("'", "''");
                await _context.Database.ExecuteSqlRawAsync("VACUUM INTO '" + sqliteSafePath + "'", ct);
                snapshotPrevio = Path.GetFileName(preRollbackPath);
                _logger.LogInformation("Snapshot preventivo pre-rollback guardado: {SnapshotPrevio}", snapshotPrevio);
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "No se pudo generar el snapshot preventivo pre-rollback vía VACUUM INTO. Se intentará copia directa.");
                if (File.Exists(activeDbPath))
                {
                    try
                    {
                        var preRollbackPath = Path.Combine(backupDir, $"{Path.GetFileNameWithoutExtension(activeDbPath)}_{DateTime.Now:yyyyMMdd_HHmmss}_pre-rollback.db");
                        File.Copy(activeDbPath, preRollbackPath, overwrite: true);
                        snapshotPrevio = Path.GetFileName(preRollbackPath);
                    }
                    catch { }
                }
            }

            // 2. Liberar pools de conexiones activas de SQLite
            SqliteConnection.ClearAllPools();
            GC.Collect();
            GC.WaitForPendingFinalizers();

            // 3. Limpiar archivos WAL y SHM para evitar inconsistencias de journal
            var walPath = activeDbPath + "-wal";
            var shmPath = activeDbPath + "-shm";
            if (File.Exists(walPath)) { try { File.Delete(walPath); } catch { } }
            if (File.Exists(shmPath)) { try { File.Delete(shmPath); } catch { } }

            // 4. Sobrescribir base de datos activa con reintentos
            bool copiado = false;
            for (int i = 0; i < 3; i++)
            {
                try
                {
                    File.Copy(backupFilePath, activeDbPath, overwrite: true);
                    copiado = true;
                    break;
                }
                catch (IOException) when (i < 2)
                {
                    SqliteConnection.ClearAllPools();
                    await Task.Delay(150, ct);
                }
            }

            if (!copiado)
            {
                return Result<RestaurarBackupResponse>.Failure("No se pudo sobrescribir la base de datos activa debido a un bloqueo del sistema operativo.");
            }

            // Limpieza final de pools para que las nuevas conexiones tomen el nuevo archivo
            SqliteConnection.ClearAllPools();

            // 5. Asegurar consistencia de esquema no destructiva sobre la base restaurada
            try
            {
                await SqliteSchemaPatcher.EnsureSchemaUpdatedAsync(_context);
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "Aviso post-rollback: Error menor al verificar esquemas.");
            }

            _logger.LogWarning("ROLLBACK EXITOSO: Base de datos restaurada desde {BackupFile}. Snapshot de seguridad: {SnapshotPrevio}",
                sanitized, snapshotPrevio);

            return Result<RestaurarBackupResponse>.Success(new RestaurarBackupResponse(
                Mensaje: $"Base de datos restaurada exitosamente desde '{sanitized}'.",
                ArchivoRestaurado: sanitized,
                SnapshotPrevio: snapshotPrevio
            ));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error crítico durante la restauración de backup {FileName}", fileName);
            return Result<RestaurarBackupResponse>.Failure($"Error al restaurar la base de datos: {ex.Message}");
        }
        finally
        {
            _semaphore.Release();
        }
    }

    private void RotarBackups(int maxRetencion = 20)
    {
        try
        {
            var backupDir = GetBackupDirectory();
            if (!Directory.Exists(backupDir)) return;

            var files = new DirectoryInfo(backupDir)
                .GetFiles("*.db")
                .OrderByDescending(f => f.CreationTimeUtc)
                .ToList();

            if (files.Count > maxRetencion)
            {
                var filesToDelete = files.Skip(maxRetencion);
                foreach (var file in filesToDelete)
                {
                    try
                    {
                        file.Delete();
                        _logger.LogInformation("Backup antiguo rotado y eliminado: {FileName}", file.Name);
                    }
                    catch (Exception ex)
                    {
                        _logger.LogWarning(ex, "No se pudo eliminar el backup rotado: {FileName}", file.Name);
                    }
                }
            }
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Error durante la rotación de backups.");
        }
    }

    private static string FormatearTamano(long bytes)
    {
        if (bytes < 1024) return $"{bytes} B";
        if (bytes < 1024 * 1024) return $"{bytes / 1024.0:0.0} KB";
        return $"{bytes / (1024.0 * 1024.0):0.00} MB";
    }
}
