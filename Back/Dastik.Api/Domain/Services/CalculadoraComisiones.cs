namespace Dastik.Api.Domain.Services;

public class CalculadoraComisiones
{
    private const decimal UmbralMontoSabado = 120_000.00m;
    private const decimal PorcentajeComisionSabado = 0.05m;

    public decimal Calcular(DateTime fecha, decimal montoVenta)
    {
        if (fecha.DayOfWeek == DayOfWeek.Saturday && montoVenta >= UmbralMontoSabado)
        {
            return decimal.Round(montoVenta * PorcentajeComisionSabado, 2, MidpointRounding.AwayFromZero);
        }

        return 0.00m;
    }
}
