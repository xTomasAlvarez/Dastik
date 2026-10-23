namespace Dastik.Api.Domain.Entities;

public class Gasto
{
    public int Id { get; set; }
    public string Descripcion { get; set; } = string.Empty;
    public decimal Monto { get; set; } = 0m; // Monto final en ARS
    public string Moneda { get; set; } = "ARS"; // "ARS" | "USD"
    public decimal MontoMonedaOriginal { get; set; } = 0m;
    public decimal? TipoCambioAplicado { get; set; }
    public string? TipoDolar { get; set; } // "Blue" | "Oficial"
    public string Categoria { get; set; } = "General";
    public DateTime Fecha { get; set; } = DateTime.UtcNow;
    public int? TurnoId { get; set; }
    public int UsuarioId { get; set; }
    public bool Activo { get; set; } = true;
}
