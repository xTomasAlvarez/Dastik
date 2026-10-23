using Dastik.Api.Domain.Services;
using Dastik.Api.Features.Configuracion.Services;
using Dastik.Api.Infrastructure.Persistence;
using FluentAssertions;
using Microsoft.AspNetCore.Hosting;
using Microsoft.Data.Sqlite;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.FileProviders;
using Microsoft.Extensions.Logging.Abstractions;
using Xunit;

namespace Dastik.Tests;

public class TestWebHostEnvironment : IWebHostEnvironment
{
    public string EnvironmentName { get; set; } = "Development";
    public string ApplicationName { get; set; } = "Dastik.Api";
    public string WebRootPath { get; set; } = string.Empty;
    public IFileProvider WebRootFileProvider { get; set; } = null!;
    public string ContentRootPath { get; set; } = string.Empty;
    public IFileProvider ContentRootFileProvider { get; set; } = null!;
}

public class TestTenantService : ITenantService
{
    public bool IsSandboxMode { get; set; } = false;
    public string ConnectionString { get; set; } = string.Empty;
    public string GetConnectionString() => ConnectionString;
}

public class DatabaseBackupServiceTests : IDisposable
{
    private readonly string _tempDirectory;
    private readonly string _testDbPath;
    private readonly SqliteConnection _connection;
    private readonly AppDbContext _context;
    private readonly TestWebHostEnvironment _env;
    private readonly TestTenantService _tenantService;
    private readonly DatabaseBackupService _service;

    public DatabaseBackupServiceTests()
    {
        _tempDirectory = Path.Combine(Path.GetTempPath(), "DastikBackupTests_" + Guid.NewGuid().ToString("N"));
        Directory.CreateDirectory(_tempDirectory);

        _testDbPath = Path.Combine(_tempDirectory, "dastik_test.db");
        var connStr = $"Data Source={_testDbPath}";

        _connection = new SqliteConnection(connStr);
        _connection.Open();

        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseSqlite(_connection)
            .Options;

        _context = new AppDbContext(options);
        _context.Database.EnsureCreated();

        _env = new TestWebHostEnvironment
        {
            ContentRootPath = _tempDirectory
        };

        _tenantService = new TestTenantService
        {
            ConnectionString = connStr,
            IsSandboxMode = false
        };

        _service = new DatabaseBackupService(
            _context,
            _tenantService,
            _env,
            NullLogger<DatabaseBackupService>.Instance
        );
    }

    public void Dispose()
    {
        _context.Dispose();
        _connection.Dispose();
        SqliteConnection.ClearAllPools();
        try
        {
            if (Directory.Exists(_tempDirectory))
            {
                Directory.Delete(_tempDirectory, true);
            }
        }
        catch { }
    }

    [Fact]
    public async Task CrearBackupAsync_DeberiaCrearArchivoSqliteYRetornarDtoConMetadatos()
    {
        // Act
        var result = await _service.CrearBackupAsync("manual-test");

        // Assert
        result.IsSuccess.Should().BeTrue();
        result.Value.Should().NotBeNull();
        result.Value.Motivo.Should().Be("manual-test");
        result.Value.Archivo.Should().EndWith(".db");
        result.Value.TamanoBytes.Should().BeGreaterThan(0);
        result.Value.TamanoLegible.Should().NotBeNullOrWhiteSpace();

        var backupDir = _service.GetBackupDirectory();
        var backupPath = Path.Combine(backupDir, result.Value.Archivo);
        File.Exists(backupPath).Should().BeTrue();
    }

    [Fact]
    public async Task ListarBackups_DeberiaListarSnapshotsConOrdenamientoDescendente()
    {
        // Arrange
        await _service.CrearBackupAsync("primero");
        await Task.Delay(100);
        await _service.CrearBackupAsync("segundo");

        // Act
        var result = _service.ListarBackups();

        // Assert
        result.IsSuccess.Should().BeTrue();
        result.Value!.Count.Should().BeGreaterThanOrEqualTo(2);
        result.Value[0].Motivo.Should().Be("segundo");
        result.Value[1].Motivo.Should().Be("primero");
    }

    [Fact]
    public async Task RotarBackups_CuandoSupera20Snapshots_DeberiaConservarSoloLos20MasRecientes()
    {
        // Arrange: Crear 22 backups
        var backupDir = _service.GetBackupDirectory();
        for (int i = 1; i <= 22; i++)
        {
            var fileName = $"dastik_test_20261023_{i:000000}_test.db";
            var filePath = Path.Combine(backupDir, fileName);
            File.WriteAllText(filePath, "dummy-sqlite-content");
            File.SetCreationTimeUtc(filePath, DateTime.UtcNow.AddMinutes(-30 + i));
        }

        // Act: Al crear uno nuevo, debe rotar y dejar máximo 20
        var nuevo = await _service.CrearBackupAsync("rotacion-test");
        nuevo.IsSuccess.Should().BeTrue();

        // Assert
        var files = Directory.GetFiles(backupDir, "*.db");
        files.Length.Should().BeLessThanOrEqualTo(20);
    }

    [Fact]
    public async Task RestaurarBackupAsync_CuandoArchivoNoExiste_DeberiaRetornarFallo()
    {
        // Act
        var result = await _service.RestaurarBackupAsync("archivo_fantasma.db");

        // Assert
        result.IsSuccess.Should().BeFalse();
        result.Error.Should().Contain("no existe");
    }

    [Fact]
    public async Task RestaurarBackupAsync_ConArchivoValido_DeberiaCrearSnapshotPreventivoYRestaurar()
    {
        // Arrange
        var backupResult = await _service.CrearBackupAsync("backup-para-restaurar");
        backupResult.IsSuccess.Should().BeTrue();

        // Act
        var restoreResult = await _service.RestaurarBackupAsync(backupResult.Value!.Archivo);

        // Assert
        restoreResult.IsSuccess.Should().BeTrue();
        restoreResult.Value!.ArchivoRestaurado.Should().Be(backupResult.Value.Archivo);
        restoreResult.Value.SnapshotPrevio.Should().Contain("pre-rollback");

        // Verificar que el snapshot preventivo existe
        var backupDir = _service.GetBackupDirectory();
        File.Exists(Path.Combine(backupDir, restoreResult.Value.SnapshotPrevio)).Should().BeTrue();
    }
}
