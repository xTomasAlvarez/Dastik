namespace Dastik.Api.Domain.Entities;

public class DetalleOrden
{
    public int Id { get; set; }
    public int OrdenId { get; set; }
    public int VarianteId { get; set; }
    public int Cantidad { get; set; }
    public decimal PrecioUnitario { get; set; }
    public decimal Subtotal { get; set; }
    public bool FueCambiado { get; set; } = false;

    // Propiedades de navegación
    public Orden Orden { get; set; } = null!;
    public Variante Variante { get; set; } = null!;
}
