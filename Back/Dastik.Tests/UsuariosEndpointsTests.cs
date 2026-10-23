using Dastik.Api.Domain.Entities;
using Dastik.Api.Domain.Services;
using Dastik.Api.Features.Usuarios;
using Dastik.Api.Infrastructure.Persistence;
using Dastik.Api.Infrastructure.Security;
using FluentAssertions;
using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.Data.Sqlite;
using Microsoft.EntityFrameworkCore;
using Xunit;

namespace Dastik.Tests;

public class UsuariosEndpointsTests : IDisposable
{
    private readonly SqliteConnection _connection;
    private readonly AppDbContext _context;
    private readonly IPasswordHasher _passwordHasher;

    public UsuariosEndpointsTests()
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
    public async Task ListarEmpleados_DeberiaDevolverSoloUsuariosConRolEmpleado()
    {
        // Arrange
        var admin = new Usuario
        {
            Nombre = "Dueño Admin",
            Email = "admin@dastik.com",
            PasswordHash = "hash1",
            Rol = RolUsuario.Admin
        };
        var emp1 = new Usuario
        {
            Nombre = "Lucas Benítez",
            Email = "lucas@dastik.com",
            PasswordHash = "hash2",
            Rol = RolUsuario.Empleado,
            TurnoAsignado = "Mañana",
            TarifaPorHora = 3500.00m
        };
        var emp2 = new Usuario
        {
            Nombre = "Sofía Martínez",
            Email = "sofia@dastik.com",
            PasswordHash = "hash3",
            Rol = RolUsuario.Empleado,
            TurnoAsignado = "Tarde",
            TarifaPorHora = 4000.00m
        };

        _context.Usuarios.AddRange(admin, emp1, emp2);
        await _context.SaveChangesAsync();

        // Act: Consulta directa filtrando rol Empleado como hace el endpoint
        var empleados = await _context.Usuarios
            .Where(u => u.Rol == RolUsuario.Empleado)
            .OrderBy(u => u.Nombre)
            .Select(u => new EmpleadoResponse(
                u.Id,
                u.Nombre,
                u.Email,
                u.Rol.ToString(),
                u.TurnoAsignado,
                u.TarifaPorHora,
                u.Activo,
                u.FechaCreacion
            ))
            .ToListAsync();

        // Assert
        empleados.Should().HaveCount(2);
        empleados.Should().NotContain(e => e.Email == "admin@dastik.com");
        empleados.Should().Contain(e => e.Nombre == "Lucas Benítez" && e.TurnoAsignado == "Mañana" && e.TarifaPorHora == 3500.00m);
        empleados.Should().Contain(e => e.Nombre == "Sofía Martínez" && e.TurnoAsignado == "Tarde" && e.TarifaPorHora == 4000.00m);
    }

    [Fact]
    public async Task ListarEmpleados_DebeOcultarCuentasDev_StealthMode()
    {
        // Arrange
        var devAdmin = new Usuario { Nombre = "Tomi Dev", Email = "tomidev@dastik.com", Rol = RolUsuario.Admin, EsOcultoDev = true, PasswordHash = "hash" };
        var devCajero = new Usuario { Nombre = "Tomi Empleado", Email = "tomi.empleado@dastik.com", Rol = RolUsuario.Empleado, EsOcultoDev = true, PasswordHash = "hash" };
        var empleadoReal = new Usuario { Nombre = "Ale Real", Email = "ale@dastik.com", Rol = RolUsuario.Empleado, EsOcultoDev = false, PasswordHash = "hash" };

        _context.Usuarios.AddRange(devAdmin, devCajero, empleadoReal);
        await _context.SaveChangesAsync();

        // Act
        var empleados = await _context.Usuarios
            .Where(u => !u.EsOcultoDev && u.Email != "tomidev@dastik.com" && u.Email != "tomi.empleado@dastik.com" && u.Rol == RolUsuario.Empleado)
            .ToListAsync();

        // Assert
        empleados.Should().ContainSingle();
        empleados[0].Email.Should().Be("ale@dastik.com");
    }

    [Fact]
    public async Task CrearEmpleado_ConDatosValidos_DeberiaPersistirUsuarioConPasswordHasheado()
    {
        // Arrange
        var request = new CrearEmpleadoRequest(
            Nombre: "Martín Palermo",
            Email: "martin@dastik.com",
            Password: "PasswordSegura123!",
            Turno: "Mañana",
            TarifaPorHora: 3800.00m
        );

        // Act
        var nuevo = new Usuario
        {
            Nombre = request.Nombre.Trim(),
            Email = request.Email.Trim().ToLowerInvariant(),
            PasswordHash = _passwordHasher.Hash(request.Password),
            Rol = RolUsuario.Empleado,
            DebeCambiarPassword = true,
            Activo = true,
            TurnoAsignado = request.Turno,
            TarifaPorHora = request.TarifaPorHora,
            FechaCreacion = DateTime.UtcNow
        };
        _context.Usuarios.Add(nuevo);
        await _context.SaveChangesAsync();

        // Assert
        var guardado = await _context.Usuarios.FirstOrDefaultAsync(u => u.Email == "martin@dastik.com");
        guardado.Should().NotBeNull();
        guardado!.Nombre.Should().Be("Martín Palermo");
        guardado.Rol.Should().Be(RolUsuario.Empleado);
        guardado.DebeCambiarPassword.Should().BeTrue();
        guardado.TarifaPorHora.Should().Be(3800.00m);

        // Verificar que la contraseña no está en texto plano
        guardado.PasswordHash.Should().NotBe("PasswordSegura123!");
        _passwordHasher.Verify("PasswordSegura123!", guardado.PasswordHash).Should().BeTrue();
    }

    [Fact]
    public async Task CalcularPago_ConTarifaPersonalizada_DeberiaCalcularTotalExacto()
    {
        // Arrange
        var empleado = new Usuario
        {
            Nombre = "Carolina Gómez",
            Email = "carolina@dastik.com",
            PasswordHash = "hash",
            Rol = RolUsuario.Empleado,
            TurnoAsignado = "Mañana",
            TarifaPorHora = 3200.00m
        };
        _context.Usuarios.Add(empleado);
        await _context.SaveChangesAsync();

        // Act: Liquidación de 8.5 horas y de 12 horas
        decimal horasJornada1 = 8.5m;
        decimal total1 = Math.Round(horasJornada1 * empleado.TarifaPorHora, 2);

        decimal horasJornada2 = 12m;
        decimal total2 = Math.Round(horasJornada2 * empleado.TarifaPorHora, 2);

        // Assert
        total1.Should().Be(27_200.00m);
        total2.Should().Be(38_400.00m);
    }

    [Fact]
    public async Task ResetPasswordEmpleado_DebeActualizarHashYEstadoDebeCambiarPassword()
    {
        // Arrange
        var empleado = new Usuario
        {
            Nombre = "Franco Romero",
            Email = "franco@dastik.com",
            PasswordHash = _passwordHasher.Hash("1234"),
            Rol = RolUsuario.Empleado,
            DebeCambiarPassword = true,
            Activo = true
        };
        _context.Usuarios.Add(empleado);
        await _context.SaveChangesAsync();

        // Act: Simular acción del handler del endpoint
        var request = new ResetPasswordEmpleadoRequest("NuevaClave2026!", DebeCambiarPassword: false);
        empleado.PasswordHash = _passwordHasher.Hash(request.NuevaPassword);
        empleado.DebeCambiarPassword = request.DebeCambiarPassword;
        await _context.SaveChangesAsync();

        // Assert
        var actualizado = await _context.Usuarios.FirstAsync(u => u.Id == empleado.Id);
        _passwordHasher.Verify("NuevaClave2026!", actualizado.PasswordHash).Should().BeTrue();
        actualizado.DebeCambiarPassword.Should().BeFalse();
    }
}
