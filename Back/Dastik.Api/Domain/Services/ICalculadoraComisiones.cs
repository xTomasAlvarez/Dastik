namespace Dastik.Api.Domain.Services;

public interface ICalculadoraComisiones
{
    decimal Calcular(DateTime fecha, decimal montoVenta);
}
