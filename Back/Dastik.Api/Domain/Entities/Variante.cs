namespace Dastik.Api.Domain.Entities;

public class Variante
{
    public int Id { get; set; }
    public int ProductoId { get; set; }

    public string Talle { get; set; } = string.Empty;
    public string Color { get; set; } = string.Empty;
    public string CodigoBarras { get; set; } = string.Empty;
    public bool EsCodigoGenerado { get; set; }
    public int StockFisico { get; set; }
    public string? TiendanubeVariantId { get; set; }

    // Propiedad de navegación
    public Producto Producto { get; set; } = null!;
}
