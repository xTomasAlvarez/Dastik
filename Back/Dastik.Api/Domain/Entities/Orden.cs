namespace Dastik.Api.Domain.Entities;

public class Orden
{
    public int Id { get; set; }
    public int TurnoId { get; set; }
    public DateTime Fecha { get; set; }
    public decimal Total { get; set; }
    public EstadoOrden Estado { get; set; } = EstadoOrden.Pagada;
    public bool EsCambio { get; set; } = false;
    public string? MotivoCambio { get; set; }
    public int? OrdenOrigenId { get; set; }

    // Propiedades de navegación
    public Turno Turno { get; set; } = null!;
    public ICollection<DetalleOrden> Detalles { get; set; } = new List<DetalleOrden>();
    public ICollection<Pago> Pagos { get; set; } = new List<Pago>();
}
