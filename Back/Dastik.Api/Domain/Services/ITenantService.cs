namespace Dastik.Api.Domain.Services;

public interface ITenantService
{
    bool IsSandboxMode { get; }
    string GetConnectionString();
}
