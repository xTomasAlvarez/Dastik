namespace Dastik.Api.Domain.Entities;

public enum TipoMovimientoStock
{
    Venta = 1,
    DevolucionCambio = 2,
    SalidaCambio = 3,
    AjusteManual = 4,
    IngresoMercaderia = 5
}

public class MovimientoStock
{
    public int Id { get; set; }
    public int VarianteId { get; set; }
    public int Cantidad { get; set; } // Positivo para ingresos/devoluciones, negativo para ventas/salidas
    public int StockResultante { get; set; }
    public TipoMovimientoStock Tipo { get; set; }
    public string Motivo { get; set; } = string.Empty;
    public int? OrdenId { get; set; }
    public int? TurnoId { get; set; }
    public DateTime FechaUtc { get; set; } = DateTime.UtcNow;

    // Propiedades de navegación
    public Variante Variante { get; set; } = null!;
    public Orden? Orden { get; set; }
    public Turno? Turno { get; set; }
}
