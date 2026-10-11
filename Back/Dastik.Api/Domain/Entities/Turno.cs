namespace Dastik.Api.Domain.Entities;

public class Turno
{
    public int Id { get; set; }
    public int EmpleadoId { get; set; }
    public DateTime FechaApertura { get; set; }
    public DateTime? FechaCierre { get; set; }
    public decimal SaldoInicial { get; set; }
    public decimal? SaldoFinal { get; set; }
    public EstadoTurno Estado { get; set; } = EstadoTurno.Abierto;

    // Propiedades de navegación
    public ICollection<Orden> Ordenes { get; set; } = new List<Orden>();
}
