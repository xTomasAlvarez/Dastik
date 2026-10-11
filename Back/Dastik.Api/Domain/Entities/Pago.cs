namespace Dastik.Api.Domain.Entities;

public class Pago
{
    public int Id { get; set; }
    public int OrdenId { get; set; }
    public MetodoPago MetodoPago { get; set; }
    public decimal Monto { get; set; }

    // Propiedades de navegación
    public Orden Orden { get; set; } = null!;
}
