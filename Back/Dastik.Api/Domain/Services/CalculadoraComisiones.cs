namespace Dastik.Api.Domain.Services;

public class CalculadoraComisiones : ICalculadoraComisiones
{
    private const decimal UmbralMontoSabado = 120_000.00m;
    private const decimal PorcentajeComisionSabado = 0.05m;

    public decimal Calcular(DateTime fecha, decimal montoVenta)
    {
        // En Argentina (UTC-3), si la fecha es UTC la convertimos al huso local para evaluar el día de la semana del mostrador
        var fechaLocal = fecha.Kind == DateTimeKind.Utc ? fecha.AddHours(-3) : fecha;

        if (fechaLocal.DayOfWeek == DayOfWeek.Saturday && montoVenta >= UmbralMontoSabado)
        {
            return decimal.Round(montoVenta * PorcentajeComisionSabado, 2, MidpointRounding.AwayFromZero);
        }

        return 0.00m;
    }
}
