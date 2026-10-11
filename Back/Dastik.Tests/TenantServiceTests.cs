using System.Security.Claims;
using Dastik.Api.Infrastructure.Tenancy;
using FluentAssertions;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Configuration;
using Xunit;

namespace Dastik.Tests;

public class TenantServiceTests
{
    private readonly IConfiguration _configuration;
    private const string DefaultConn = "Host=localhost;Database=dastik_erp;Username=postgres;Password=postgres";
    private const string SandboxConn = "Host=localhost;Database=dastik_erp_sandbox;Username=postgres;Password=postgres";

    public TenantServiceTests()
    {
        var settings = new Dictionary<string, string?>
        {
            { "ConnectionStrings:DefaultConnection", DefaultConn },
            { "ConnectionStrings:SandboxConnection", SandboxConn }
        };

        _configuration = new ConfigurationBuilder()
            .AddInMemoryCollection(settings)
            .Build();
    }

    [Fact]
    public void IsSandboxMode_CuandoNoHayUsuarioAutenticado_DebeRetornarFalse()
    {
        // Arrange
        var httpContextAccessor = new HttpContextAccessor
        {
            HttpContext = new DefaultHttpContext()
        };

        var tenantService = new TenantService(httpContextAccessor, _configuration);

        // Act & Assert
        tenantService.IsSandboxMode.Should().BeFalse();
        tenantService.GetConnectionString().Should().Be(DefaultConn);
    }

    [Fact]
    public void IsSandboxMode_CuandoUsuarioTieneClaimIsSandboxModeTrue_DebeRetornarTrueYSandboxConnection()
    {
        // Arrange
        var context = new DefaultHttpContext();
        var claims = new[]
        {
            new Claim("IsSandboxMode", "true")
        };
        var identity = new ClaimsIdentity(claims, "TestAuth");
        context.User = new ClaimsPrincipal(identity);

        var httpContextAccessor = new HttpContextAccessor
        {
            HttpContext = context
        };

        var tenantService = new TenantService(httpContextAccessor, _configuration);

        // Act & Assert
        tenantService.IsSandboxMode.Should().BeTrue();
        tenantService.GetConnectionString().Should().Be(SandboxConn);
    }

    [Fact]
    public void IsSandboxMode_CuandoUsuarioTieneClaimIsSandboxModeFalse_DebeRetornarFalseYDefaultConnection()
    {
        // Arrange
        var context = new DefaultHttpContext();
        var claims = new[]
        {
            new Claim("IsSandboxMode", "false")
        };
        var identity = new ClaimsIdentity(claims, "TestAuth");
        context.User = new ClaimsPrincipal(identity);

        var httpContextAccessor = new HttpContextAccessor
        {
            HttpContext = context
        };

        var tenantService = new TenantService(httpContextAccessor, _configuration);

        // Act & Assert
        tenantService.IsSandboxMode.Should().BeFalse();
        tenantService.GetConnectionString().Should().Be(DefaultConn);
    }
}
