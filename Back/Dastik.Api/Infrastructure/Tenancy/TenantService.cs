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
            var context = _httpContextAccessor.HttpContext;
            if (context is not null)
            {
                // 1. Cabecera HTTP X-Sandbox-Mode (enviada por el frontend en todas las peticiones, incluido el login)
                if (context.Request.Headers.TryGetValue("X-Sandbox-Mode", out var sandboxHeader))
                {
                    if (bool.TryParse(sandboxHeader.ToString(), out var isSandboxFromHeader))
                    {
                        return isSandboxFromHeader;
                    }
                }

                // 2. Claim en token JWT para usuarios ya autenticados
                var user = context.User;
                if (user?.Identity?.IsAuthenticated == true)
                {
                    var claim = user.FindFirst("IsSandboxMode");
                    if (claim is not null && bool.TryParse(claim.Value, out var isSandbox) && isSandbox)
                    {
                        return true;
                    }
                }
            }

            return false;
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
