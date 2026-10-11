using Dastik.Api.Domain.Services;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Configuration;

namespace Dastik.Api.Infrastructure.Tenancy;

public class TenantService : ITenantService
{
    private readonly IHttpContextAccessor _httpContextAccessor;
    private readonly IConfiguration _configuration;

    public const string DefaultConnectionFallback = "Host=localhost;Database=dastik_erp;Username=postgres;Password=postgres";
    public const string SandboxConnectionFallback = "Host=localhost;Database=dastik_erp_sandbox;Username=postgres;Password=postgres";

    public TenantService(IHttpContextAccessor httpContextAccessor, IConfiguration configuration)
    {
        _httpContextAccessor = httpContextAccessor;
        _configuration = configuration;
    }

    public bool IsSandboxMode
    {
        get
        {
            var user = _httpContextAccessor.HttpContext?.User;
            if (user is null || user.Identity?.IsAuthenticated != true)
            {
                return false;
            }

            var claim = user.FindFirst("IsSandboxMode");
            return claim is not null && bool.TryParse(claim.Value, out var isSandbox) && isSandbox;
        }
    }

    public string GetConnectionString()
    {
        if (IsSandboxMode)
        {
            return _configuration.GetConnectionString("SandboxConnection")
                ?? _configuration["SANDBOX_CONNECTION"]
                ?? SandboxConnectionFallback;
        }

        return _configuration.GetConnectionString("DefaultConnection")
            ?? _configuration["DEFAULT_CONNECTION"]
            ?? DefaultConnectionFallback;
    }
}
