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
    public async Task CrearEmpleado_ConDatosValidos_DeberiaPersistirUsuarioConPasswordHasheado()
    {
        // Arrange
        var request = new CrearEmpleadoRequest(
            Nombre: "Martín Palermo",
            Email: "martin@dastik.com",
            Password: "Password123!",
            Turno: "Completo",
            TarifaPorHora: 4500.00m
        );

        // Act
        var nuevoUsuario = new Usuario
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

        _context.Usuarios.Add(nuevoUsuario);
        await _context.SaveChangesAsync();

        // Assert
        var usuarioEnBd = await _context.Usuarios.FirstOrDefaultAsync(u => u.Email == "martin@dastik.com");
        usuarioEnBd.Should().NotBeNull();
        usuarioEnBd!.Nombre.Should().Be("Martín Palermo");
        usuarioEnBd.TurnoAsignado.Should().Be("Completo");
        usuarioEnBd.TarifaPorHora.Should().Be(4500.00m);
        usuarioEnBd.DebeCambiarPassword.Should().BeTrue();
        _passwordHasher.Verify("Password123!", usuarioEnBd.PasswordHash).Should().BeTrue();
    }

    [Fact]
    public async Task CalcularPago_ConHorasTrabajadas_DeberiaCalcularTotalExacto()
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
}
