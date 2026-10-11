using System.Security.Claims;
using System.Text;
using Dastik.Api.Domain.Entities;
using Dastik.Api.Infrastructure.Security;
using FluentAssertions;
using Microsoft.Extensions.Configuration;
using Microsoft.IdentityModel.JsonWebTokens;
using Microsoft.IdentityModel.Tokens;
using Xunit;

namespace Dastik.Tests;

public class JwtProviderTests
{
    private readonly IConfiguration _configuration;
    private const string SecretKey = "DastikSuperSecretKey2026_PosAndHiddenSneakers_SecurityKeyMustBeLongEnough!";
    private const string Issuer = "DastikApi";
    private const string Audience = "DastikClient";

    public JwtProviderTests()
    {
        var inMemorySettings = new Dictionary<string, string?>
        {
            { "JWT_SECRET", SecretKey },
            { "JWT_ISSUER", Issuer },
            { "JWT_AUDIENCE", Audience },
            { "JWT_EXPIRATION_MINUTES", "120" }
        };

        _configuration = new ConfigurationBuilder()
            .AddInMemoryCollection(inMemorySettings)
            .Build();
    }

    [Fact]
    public async Task GenerarToken_ConUsuarioEmpleado_DebeGenerarTokenValidoConClaims()
    {
        // Arrange
        var provider = new JwtProvider(_configuration);
        var usuario = new Usuario
        {
            Id = 42,
            Nombre = "Juan Cajero",
            Email = "juan@dastik.com",
            Rol = RolUsuario.Empleado,
            Activo = true
        };

        // Act
        var token = provider.GenerarToken(usuario, isSandboxMode: false);

        // Assert
        token.Should().NotBeNullOrWhiteSpace();

        var handler = new JsonWebTokenHandler();
        var validationParameters = new TokenValidationParameters
        {
            ValidateIssuerSigningKey = true,
            IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(SecretKey)),
            ValidateIssuer = true,
            ValidIssuer = Issuer,
            ValidateAudience = true,
            ValidAudience = Audience,
            ValidateLifetime = true,
            ClockSkew = TimeSpan.Zero
        };

        var result = await handler.ValidateTokenAsync(token, validationParameters);
        result.IsValid.Should().BeTrue();

        var principal = new ClaimsPrincipal(result.ClaimsIdentity);
        principal.IsInRole("Empleado").Should().BeTrue();
        principal.FindFirst(ClaimTypes.NameIdentifier)?.Value.Should().Be("42");
        principal.FindFirst(ClaimTypes.Name)?.Value.Should().Be("Juan Cajero");
        principal.FindFirst(ClaimTypes.Email)?.Value.Should().Be("juan@dastik.com");
        principal.FindFirst("IsSandboxMode")?.Value.Should().Be("false");
        principal.FindFirst("DebeCambiarPassword")?.Value.Should().Be("true");
    }

    [Fact]
    public async Task GenerarToken_ConModoSandboxHabilitado_DebeContenerClaimIsSandboxModeTrue()
    {
        // Arrange
        var provider = new JwtProvider(_configuration);
        var usuario = new Usuario
        {
            Id = 1,
            Nombre = "Admin Dastik",
            Email = "admin@dastik.com",
            Rol = RolUsuario.Admin,
            Activo = true
        };

        // Act
        var token = provider.GenerarToken(usuario, isSandboxMode: true);

        // Assert
        token.Should().NotBeNullOrWhiteSpace();

        var handler = new JsonWebTokenHandler();
        var validationParameters = new TokenValidationParameters
        {
            ValidateIssuerSigningKey = true,
            IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(SecretKey)),
            ValidateIssuer = true,
            ValidIssuer = Issuer,
            ValidateAudience = true,
            ValidAudience = Audience,
            ValidateLifetime = true,
            ClockSkew = TimeSpan.Zero
        };

        var result = await handler.ValidateTokenAsync(token, validationParameters);
        result.IsValid.Should().BeTrue();

        var principal = new ClaimsPrincipal(result.ClaimsIdentity);
        principal.IsInRole("Admin").Should().BeTrue();
        principal.FindFirst("IsSandboxMode")?.Value.Should().Be("true");
    }

    [Fact]
    public async Task GenerarToken_ConFirmaInvalida_DebeFallarValidacion()
    {
        // Arrange
        var provider = new JwtProvider(_configuration);
        var usuario = new Usuario
        {
            Id = 10,
            Nombre = "Cajero Test",
            Email = "test@dastik.com",
            Rol = RolUsuario.Empleado
        };

        var token = provider.GenerarToken(usuario, isSandboxMode: false);

        // Act: Validar con una clave distinta
        var handler = new JsonWebTokenHandler();
        const string claveErronea = "OtraClaveDiferenteParaProbarFalloDeFirmaDebeSerLarga2026!";
        var validationParameters = new TokenValidationParameters
        {
            ValidateIssuerSigningKey = true,
            IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(claveErronea)),
            ValidateIssuer = true,
            ValidIssuer = Issuer,
            ValidateAudience = true,
            ValidAudience = Audience,
            ValidateLifetime = true,
            ClockSkew = TimeSpan.Zero
        };

        var result = await handler.ValidateTokenAsync(token, validationParameters);

        // Assert
        result.IsValid.Should().BeFalse();
    }
}
