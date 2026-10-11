namespace Dastik.Api.Domain.Entities;

public class OutboxMessage
{
    public Guid Id { get; set; }
    public string TipoEvento { get; set; } = string.Empty;
    public string ContenidoJson { get; set; } = string.Empty;
    public DateTime FechaOcurrenciaUtc { get; set; }
    public DateTime? FechaProcesadoUtc { get; set; }
    public string? Error { get; set; }
    public int Intentos { get; set; }
}
