using Dastik.Api.Domain.Entities;
using Dastik.Api.Features.Auth.Login;
using Dastik.Api.Infrastructure.Persistence;
using Dastik.Api.Infrastructure.Security;
using FluentAssertions;
using Microsoft.Data.Sqlite;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Xunit;

namespace Dastik.Tests;

public class LoginCommandHandlerTests : IDisposable
{
    private readonly SqliteConnection _connection;
    private readonly AppDbContext _context;
    private readonly PasswordHasher _passwordHasher;
    private readonly JwtProvider _jwtProvider;

    public LoginCommandHandlerTests()
    {
        _connection = new SqliteConnection("DataSource=:memory:");
        _connection.Open();

        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseSqlite(_connection)
            .Options;

        _context = new AppDbContext(options);
        _context.Database.EnsureCreated();

        _passwordHasher = new PasswordHasher();

        var configuration = new ConfigurationBuilder()
            .AddInMemoryCollection(new Dictionary<string, string?>
            {
                { "JWT_SECRET", "DastikSuperSecretKey2026_PosAndHiddenSneakers_SecurityKeyMustBeLongEnough!" },
                { "JWT_ISSUER", "DastikApi" },
                { "JWT_AUDIENCE", "DastikClient" },
                { "JWT_EXPIRATION_MINUTES", "120" }
            })
            .Build();

        _jwtProvider = new JwtProvider(configuration);
    }

    public void Dispose()
    {
        _context.Dispose();
        _connection.Dispose();
    }

    [Fact]
    public async Task Login_ConCredencialesValidas_DebeRetornarTokenYDatosUsuario()
    {
        // Arrange
        var passwordHash = _passwordHasher.Hash("Dastik2026!");
        var usuario = new Usuario
        {
            Nombre = "Admin Dueño",
            Email = "admin@dastik.com",
            PasswordHash = passwordHash,
            Rol = RolUsuario.Admin,
            DebeCambiarPassword = true,
            Activo = true
        };
        _context.Usuarios.Add(usuario);
        await _context.SaveChangesAsync();

        var handler = new LoginCommandHandler(_context, _passwordHasher, _jwtProvider);
        var command = new LoginCommand("admin@dastik.com", "Dastik2026!", IsSandboxMode: false);

        // Act
        var result = await handler.Handle(command, CancellationToken.None);

        // Assert
        result.IsSuccess.Should().BeTrue();
        result.Value.Should().NotBeNull();
        result.Value!.Token.Should().NotBeNullOrWhiteSpace();
        result.Value.UsuarioId.Should().Be(usuario.Id);
        result.Value.Email.Should().Be("admin@dastik.com");
        result.Value.Nombre.Should().Be("Admin Dueño");
        result.Value.Rol.Should().Be("Admin");
        result.Value.DebeCambiarPassword.Should().BeTrue();
        result.Value.IsSandboxMode.Should().BeFalse();
    }

    [Fact]
    public async Task Login_ConNombreDeUsuarioTomiDev_DebeRetornarTokenExitosamenteYRolAdmin()
    {
        // Arrange
        var passwordHash = _passwordHasher.Hash("Dastik2026!");
        var usuario = new Usuario
        {
            Nombre = "tomiDev",
            Email = "tomidev@dastik.com",
            PasswordHash = passwordHash,
            Rol = RolUsuario.Admin,
            DebeCambiarPassword = false,
            Activo = true
        };
        _context.Usuarios.Add(usuario);
        await _context.SaveChangesAsync();

        var handler = new LoginCommandHandler(_context, _passwordHasher, _jwtProvider);
        // Login ingresando el nombre de usuario "tomiDev" en vez del email
        var command = new LoginCommand("tomiDev", "Dastik2026!", IsSandboxMode: true);

        // Act
        var result = await handler.Handle(command, CancellationToken.None);

        // Assert
        result.IsSuccess.Should().BeTrue();
        result.Value.Should().NotBeNull();
        result.Value!.Nombre.Should().Be("tomiDev");
        result.Value.Rol.Should().Be("Admin");
        result.Value.DebeCambiarPassword.Should().BeFalse();
        result.Value.IsSandboxMode.Should().BeTrue();
    }

    [Fact]
    public async Task Login_ConEmailTomiDevConArroba_DebeRetornarTokenExitosamenteYRolAdmin()
    {
        // Arrange
        var passwordHash = _passwordHasher.Hash("Dastik2026!");
        var usuario = new Usuario
        {
            Nombre = "tomiDev",
            Email = "tomidev@dastik.com",
            PasswordHash = passwordHash,
            Rol = RolUsuario.Admin,
            DebeCambiarPassword = false,
            Activo = true
        };
        _context.Usuarios.Add(usuario);
        await _context.SaveChangesAsync();

        var handler = new LoginCommandHandler(_context, _passwordHasher, _jwtProvider);
        var command = new LoginCommand("tomidev@dastik.com", "Dastik2026!", IsSandboxMode: true);

        // Act
        var result = await handler.Handle(command, CancellationToken.None);

        // Assert
        result.IsSuccess.Should().BeTrue();
        result.Value.Should().NotBeNull();
        result.Value!.Nombre.Should().Be("tomiDev");
        result.Value.Rol.Should().Be("Admin");
    }

    [Fact]
    public async Task Login_ConUsuarioFranco_DebeRetornarTokenYRolEmpleado()
    {
        // Arrange
        var passwordHash = _passwordHasher.Hash("1234");
        var usuario = new Usuario
        {
            Nombre = "Franco Romero",
            Email = "franco@dastik.com",
            PasswordHash = passwordHash,
            Rol = RolUsuario.Empleado,
            TurnoAsignado = "Tarde",
            TarifaPorHora = 4000m,
            DebeCambiarPassword = false,
            Activo = true
        };
        _context.Usuarios.Add(usuario);
        await _context.SaveChangesAsync();

        var handler = new LoginCommandHandler(_context, _passwordHasher, _jwtProvider);
        // Login con nombre de usuario "franco"
        var command = new LoginCommand("franco", "1234", IsSandboxMode: true);

        // Act
        var result = await handler.Handle(command, CancellationToken.None);

        // Assert
        result.IsSuccess.Should().BeTrue();
        result.Value.Should().NotBeNull();
        result.Value!.Nombre.Should().Be("Franco Romero");
        result.Value.Rol.Should().Be("Empleado");
        result.Value.Email.Should().Be("franco@dastik.com");
    }

    [Fact]
    public async Task Login_ConUsuarioLucas_DebeRetornarTokenYRolEmpleado()
    {
        // Arrange
        var passwordHash = _passwordHasher.Hash("1234");
        var usuario = new Usuario
        {
            Nombre = "Lucas Benítez",
            Email = "lucas@dastik.com",
            PasswordHash = passwordHash,
            Rol = RolUsuario.Empleado,
            TurnoAsignado = "Mañana",
            TarifaPorHora = 4500m,
            DebeCambiarPassword = false,
            Activo = true
        };
        _context.Usuarios.Add(usuario);
        await _context.SaveChangesAsync();

        var handler = new LoginCommandHandler(_context, _passwordHasher, _jwtProvider);
        // Login con nombre de usuario "lucas"
        var command = new LoginCommand("lucas", "1234", IsSandboxMode: true);

        // Act
        var result = await handler.Handle(command, CancellationToken.None);

        // Assert
        result.IsSuccess.Should().BeTrue();
        result.Value.Should().NotBeNull();
        result.Value!.Nombre.Should().Be("Lucas Benítez");
        result.Value.Rol.Should().Be("Empleado");
        result.Value.Email.Should().Be("lucas@dastik.com");
    }

    [Fact]
    public async Task Login_ConPasswordIncorrecta_DebeRetornarFalloSinExcepcion()
    {
        // Arrange
        var passwordHash = _passwordHasher.Hash("PasswordCorrecta123!");
        var usuario = new Usuario
        {
            Nombre = "Vendedor Test",
            Email = "vendedor@dastik.com",
            PasswordHash = passwordHash,
            Rol = RolUsuario.Empleado,
            Activo = true
        };
        _context.Usuarios.Add(usuario);
        await _context.SaveChangesAsync();

        var handler = new LoginCommandHandler(_context, _passwordHasher, _jwtProvider);
        var command = new LoginCommand("vendedor@dastik.com", "PasswordErronea!", IsSandboxMode: false);

        // Act
        var result = await handler.Handle(command, CancellationToken.None);

        // Assert
        result.IsSuccess.Should().BeFalse();
        result.Error.Should().Be("Credenciales inválidas.");
    }

    [Fact]
    public async Task Login_ConUsuarioInexistente_DebeRetornarFallo()
    {
        // Arrange
        var handler = new LoginCommandHandler(_context, _passwordHasher, _jwtProvider);
        var command = new LoginCommand("noexiste@dastik.com", "Cualquiera123!", IsSandboxMode: false);

        // Act
        var result = await handler.Handle(command, CancellationToken.None);

        // Assert
        result.IsSuccess.Should().BeFalse();
        result.Error.Should().Be("Credenciales inválidas.");
    }

    [Fact]
    public async Task Login_ConUsuarioInactivo_DebeRetornarFallo()
    {
        // Arrange
        var passwordHash = _passwordHasher.Hash("PasswordValida123!");
        var usuario = new Usuario
        {
            Nombre = "Usuario Despedido",
            Email = "despedido@dastik.com",
            PasswordHash = passwordHash,
            Rol = RolUsuario.Empleado,
            Activo = false // Inactivo
        };
        _context.Usuarios.Add(usuario);
        await _context.SaveChangesAsync();

        var handler = new LoginCommandHandler(_context, _passwordHasher, _jwtProvider);
        var command = new LoginCommand("despedido@dastik.com", "PasswordValida123!", IsSandboxMode: false);

        // Act
        var result = await handler.Handle(command, CancellationToken.None);

        // Assert
        result.IsSuccess.Should().BeFalse();
        result.Error.Should().Be("Credenciales inválidas.");
    }

    [Fact]
    public async Task Login_ConModoSandbox_DebeGenerarTokenYResultadoEnModoSandbox()
    {
        // Arrange
        var passwordHash = _passwordHasher.Hash("Dastik2026!");
        var usuario = new Usuario
        {
            Nombre = "Cajero Sandbox",
            Email = "cajero.sandbox@dastik.com",
            PasswordHash = passwordHash,
            Rol = RolUsuario.Empleado,
            Activo = true
        };
        _context.Usuarios.Add(usuario);
        await _context.SaveChangesAsync();

        var handler = new LoginCommandHandler(_context, _passwordHasher, _jwtProvider);
        var command = new LoginCommand("cajero.sandbox@dastik.com", "Dastik2026!", IsSandboxMode: true);

        // Act
        var result = await handler.Handle(command, CancellationToken.None);

        // Assert
        result.IsSuccess.Should().BeTrue();
        result.Value!.IsSandboxMode.Should().BeTrue();
    }
}
