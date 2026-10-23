using System.Security.Claims;
using System.Text;
using Dastik.Api.Domain.Entities;
using Dastik.Api.Domain.Services;
using Microsoft.Extensions.Configuration;
using Microsoft.IdentityModel.JsonWebTokens;
using Microsoft.IdentityModel.Tokens;

namespace Dastik.Api.Infrastructure.Security;

public class JwtProvider : IJwtProvider
{
    private readonly IConfiguration _configuration;

    public const string DefaultSecretKey = "DastikSuperSecretKey2026_PosAndHiddenSneakers_SecurityKeyMustBeLongEnough!";
    public const string DefaultIssuer = "DastikApi";
    public const string DefaultAudience = "DastikClient";
    public const int DefaultExpirationMinutes = 480;

    public JwtProvider() : this(new ConfigurationBuilder().Build())
    {
    }

    public JwtProvider(IConfiguration configuration)
    {
        _configuration = configuration;
    }

    public string GenerarToken(Usuario usuario, bool isSandboxMode = false)
    {
        var secretKey = _configuration["JWT_SECRET"]
            ?? _configuration["Jwt:SecretKey"]
            ?? DefaultSecretKey;

        var issuer = _configuration["JWT_ISSUER"]
            ?? _configuration["Jwt:Issuer"]
            ?? DefaultIssuer;

        var audience = _configuration["JWT_AUDIENCE"]
            ?? _configuration["Jwt:Audience"]
            ?? DefaultAudience;

        var expirationMinutesStr = _configuration["JWT_EXPIRATION_MINUTES"]
            ?? _configuration["Jwt:ExpirationInMinutes"];

        var expirationMinutes = int.TryParse(expirationMinutesStr, out var parsedMinutes)
            ? parsedMinutes
            : DefaultExpirationMinutes;

        var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(secretKey));
        var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

        var claims = new List<Claim>
        {
            new(JwtRegisteredClaimNames.Sub, usuario.Id.ToString()),
            new(JwtRegisteredClaimNames.Email, usuario.Email),
            new(ClaimTypes.Name, usuario.Nombre),
            new(ClaimTypes.Role, usuario.Rol.ToString()),
            new("debeCambiarPassword", usuario.DebeCambiarPassword.ToString().ToLower()),
            new("isSandboxMode", isSandboxMode.ToString().ToLower())
        };

        var tokenDescriptor = new SecurityTokenDescriptor
        {
            Subject = new ClaimsIdentity(claims),
            Expires = DateTime.UtcNow.AddMinutes(expirationMinutes),
            Issuer = issuer,
            Audience = audience,
            SigningCredentials = creds
        };

        var handler = new JsonWebTokenHandler();
        return handler.CreateToken(tokenDescriptor);
    }
}
