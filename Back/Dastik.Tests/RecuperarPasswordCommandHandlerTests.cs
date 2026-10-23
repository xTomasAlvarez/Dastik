using Dastik.Api.Domain.Entities;
using Dastik.Api.Domain.Services;
using Dastik.Api.Features.Auth.RecuperarPassword;
using Dastik.Api.Infrastructure.Persistence;
using Dastik.Api.Infrastructure.Security;
using FluentAssertions;
using Microsoft.Data.Sqlite;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Xunit;

namespace Dastik.Tests;

public class RecuperarPasswordCommandHandlerTests : IDisposable
{
    private readonly SqliteConnection _connection;
    private readonly AppDbContext _context;
    private readonly IPasswordHasher _passwordHasher;
    private readonly IConfiguration _configuration;

    public RecuperarPasswordCommandHandlerTests()
    {
        _connection = new SqliteConnection("DataSource=:memory:");
        _connection.Open();

        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseSqlite(_connection)
            .Options;

        _context = new AppDbContext(options);
        _context.Database.EnsureCreated();

        _passwordHasher = new PasswordHasher();

        var myConfiguration = new Dictionary<string, string?>
        {
            {"Seguridad:ClaveMaestraLocal", "DASTIK-2026"}
        };

        _configuration = new ConfigurationBuilder()
            .AddInMemoryCollection(myConfiguration)
            .Build();
    }

    public void Dispose()
    {
        _context.Dispose();
        _connection.Dispose();
    }

    [Fact]
    public async Task Handle_CuandoClaveMaestraEsCorrectaYUsuarioEsAdmin_DebeRestablecerPassword()
    {
        // Arrange
        var admin = new Usuario
        {
            Nombre = "tomiDev",
            Email = "tomidev@dastik.com",
            PasswordHash = _passwordHasher.Hash("claveVieja"),
            Rol = RolUsuario.Admin,
            DebeCambiarPassword = true,
            Activo = true
        };
        _context.Usuarios.Add(admin);
        await _context.SaveChangesAsync();

        var handler = new RecuperarPasswordCommandHandler(_context, _passwordHasher, _configuration);
        var command = new RecuperarPasswordCommand(
            Identificador: "tomidev@dastik.com",
            ClaveMaestra: "DASTIK-2026",
            NuevaPassword: "NuevaPasswordSegura2026!"
        );

        // Act
        var result = await handler.Handle(command, CancellationToken.None);

        // Assert
        result.IsSuccess.Should().BeTrue();
        result.Value!.Nombre.Should().Be("tomiDev");

        var adminActualizado = await _context.Usuarios.FirstAsync(u => u.Id == admin.Id);
        _passwordHasher.Verify("NuevaPasswordSegura2026!", adminActualizado.PasswordHash).Should().BeTrue();
        adminActualizado.DebeCambiarPassword.Should().BeFalse();
    }

    [Fact]
    public async Task Handle_CuandoClaveMaestraEsIncorrecta_DebeFallarConMensajeGenerico()
    {
        // Arrange
        var admin = new Usuario
        {
            Nombre = "tomiDev",
            Email = "tomidev@dastik.com",
            PasswordHash = _passwordHasher.Hash("claveVieja"),
            Rol = RolUsuario.Admin,
            Activo = true
        };
        _context.Usuarios.Add(admin);
        await _context.SaveChangesAsync();

        var handler = new RecuperarPasswordCommandHandler(_context, _passwordHasher, _configuration);
        var command = new RecuperarPasswordCommand(
            Identificador: "tomidev@dastik.com",
            ClaveMaestra: "CLAVE-EQUIVOCADA",
            NuevaPassword: "NuevaPasswordSegura2026!"
        );

        // Act
        var result = await handler.Handle(command, CancellationToken.None);

        // Assert
        result.IsSuccess.Should().BeFalse();
        result.Error.Should().Be(RecuperarPasswordCommandHandler.ErrorGenerico);

        var adminSinCambios = await _context.Usuarios.FirstAsync(u => u.Id == admin.Id);
        _passwordHasher.Verify("claveVieja", adminSinCambios.PasswordHash).Should().BeTrue();
    }

    [Fact]
    public async Task Handle_CuandoUsuarioEsEmpleado_DebeFallarPorSeguridadDeCaja()
    {
        // Arrange: un empleado intenta usar la llave maestra del local
        var empleado = new Usuario
        {
            Nombre = "Franco Romero",
            Email = "franco@dastik.com",
            PasswordHash = _passwordHasher.Hash("1234"),
            Rol = RolUsuario.Empleado,
            Activo = true
        };
        _context.Usuarios.Add(empleado);
        await _context.SaveChangesAsync();

        var handler = new RecuperarPasswordCommandHandler(_context, _passwordHasher, _configuration);
        var command = new RecuperarPasswordCommand(
            Identificador: "franco@dastik.com",
            ClaveMaestra: "DASTIK-2026",
            NuevaPassword: "NuevaPassword2026!"
        );

        // Act
        var result = await handler.Handle(command, CancellationToken.None);

        // Assert: Por seguridad de caja, solo admin puede restablecerse vía clave maestra
        result.IsSuccess.Should().BeFalse();
        result.Error.Should().Be(RecuperarPasswordCommandHandler.ErrorGenerico);
    }
}
