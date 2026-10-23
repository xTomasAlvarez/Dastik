namespace Dastik.Api.Domain.Entities;

public class Usuario
{
    public int Id { get; set; }
    public string Nombre { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string PasswordHash { get; set; } = string.Empty;
    public RolUsuario Rol { get; set; } = RolUsuario.Empleado;
    public bool DebeCambiarPassword { get; set; } = true;
    public bool Activo { get; set; } = true;
    public string TurnoAsignado { get; set; } = "Completo";
    public decimal TarifaPorHora { get; set; } = 0m;
    public DateTime FechaCreacion { get; set; } = DateTime.UtcNow;
    public string? PinRecuperacionHash { get; set; }
    public DateTime? PinRecuperacionExpira { get; set; }
    public bool EsOcultoDev { get; set; } = false;
}
