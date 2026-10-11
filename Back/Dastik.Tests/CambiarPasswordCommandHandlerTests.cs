using Dastik.Api.Domain.Entities;
using Dastik.Api.Features.Auth.CambiarPassword;
using Dastik.Api.Infrastructure.Persistence;
using Dastik.Api.Infrastructure.Security;
using FluentAssertions;
using Microsoft.Data.Sqlite;
using Microsoft.EntityFrameworkCore;
using Xunit;

namespace Dastik.Tests;

public class CambiarPasswordCommandHandlerTests : IDisposable
{
    private readonly SqliteConnection _connection;
    private readonly AppDbContext _context;
    private readonly PasswordHasher _passwordHasher;

    public CambiarPasswordCommandHandlerTests()
    {
        _connection = new SqliteConnection("DataSource=:memory:");
        _connection.Open();

        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseSqlite(_connection)
            .Options;

        _context = new AppDbContext(options);
        _context.Database.EnsureCreated();

        _passwordHasher = new PasswordHasher();
    }

    public void Dispose()
    {
        _context.Dispose();
        _connection.Dispose();
    }

    [Fact]
    public async Task CambiarPassword_ConDatosValidos_DebeActualizarPasswordHashYDesactivarDebeCambiarPassword()
    {
        // Arrange
        const string claveInicial = "Dastik2026!";
        const string claveNueva = "NuevaClaveSegura2027!";

        var usuario = new Usuario
        {
            Nombre = "Usuario Fundador",
            Email = "admin@dastik.com",
            PasswordHash = _passwordHasher.Hash(claveInicial),
            Rol = RolUsuario.Admin,
            DebeCambiarPassword = true,
            Activo = true
        };
        _context.Usuarios.Add(usuario);
        await _context.SaveChangesAsync();

        var handler = new CambiarPasswordCommandHandler(_context, _passwordHasher);
        var command = new CambiarPasswordCommand(usuario.Id, claveInicial, claveNueva);

        // Act
        var result = await handler.Handle(command, CancellationToken.None);

        // Assert
        result.IsSuccess.Should().BeTrue();
        result.Value.Should().NotBeNull();
        result.Value!.DebeCambiarPassword.Should().BeFalse();

        // Verificar persistencia en base de datos
        var usuarioActualizado = await _context.Usuarios.FindAsync(usuario.Id);
        usuarioActualizado.Should().NotBeNull();
        usuarioActualizado!.DebeCambiarPassword.Should().BeFalse("el reseteo obligatorio debe desactivarse formalmente");
        _passwordHasher.Verify(claveNueva, usuarioActualizado.PasswordHash).Should().BeTrue("el nuevo hash debe validar la clave nueva");
        _passwordHasher.Verify(claveInicial, usuarioActualizado.PasswordHash).Should().BeFalse("la clave anterior no debe funcionar");
    }

    [Fact]
    public async Task CambiarPassword_ConPasswordActualIncorrecto_DebeRetornarFalloSinModificarBD()
    {
        // Arrange
        const string claveReal = "ClaveReal2026!";
        var usuario = new Usuario
        {
            Nombre = "Cajero 2",
            Email = "cajero2@dastik.com",
            PasswordHash = _passwordHasher.Hash(claveReal),
            Rol = RolUsuario.Empleado,
            DebeCambiarPassword = true,
            Activo = true
        };
        _context.Usuarios.Add(usuario);
        await _context.SaveChangesAsync();

        var handler = new CambiarPasswordCommandHandler(_context, _passwordHasher);
        var command = new CambiarPasswordCommand(usuario.Id, "ClaveIncorrecta!", "NuevaValida2027!");

        // Act
        var result = await handler.Handle(command, CancellationToken.None);

        // Assert
        result.IsSuccess.Should().BeFalse();
        result.Error.Should().Be("La contraseña actual es incorrecta.");

        var usuarioEnBd = await _context.Usuarios.FindAsync(usuario.Id);
        usuarioEnBd!.DebeCambiarPassword.Should().BeTrue("no debe desbloquear la cuenta si falló la verificación");
    }

    [Fact]
    public async Task CambiarPassword_ConUsuarioInexistente_DebeRetornarFallo()
    {
        // Arrange
        var handler = new CambiarPasswordCommandHandler(_context, _passwordHasher);
        var command = new CambiarPasswordCommand(9999, "Cualquiera123!", "NuevaValida2027!");

        // Act
        var result = await handler.Handle(command, CancellationToken.None);

        // Assert
        result.IsSuccess.Should().BeFalse();
        result.Error.Should().Be("Usuario no encontrado.");
    }
}
