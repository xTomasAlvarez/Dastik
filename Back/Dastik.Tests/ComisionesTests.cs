using Dastik.Api.Domain.Services;
using FluentAssertions;
using Xunit;

namespace Dastik.Tests;

public class ComisionesTests
{
    [Theory]
    // Sábado con monto >= 120.000 -> 5% de comisión
    [InlineData("2026-10-10", 120000.00, 6000.00)]  // Sábado, exactamente 120.000
    [InlineData("2026-10-10", 200000.00, 10000.00)] // Sábado, supera 120.000
    // Sábado pero monto < 120.000 -> 0%
    [InlineData("2026-10-10", 119999.99, 0.00)]     // Sábado, menor al umbral
    // Otro día (ej. viernes 2026-10-09 o domingo 2026-10-11) con monto >= 120.000 -> 0%
    [InlineData("2026-10-09", 150000.00, 0.00)]     // Viernes
    [InlineData("2026-10-11", 150000.00, 0.00)]     // Domingo
    public void CalcularComision_DeberiaAplicarCincoPorCiento_SoloSabadosYMontosMayoresOIgualesA120Mil(
        string fechaStr, decimal montoVenta, decimal comisionEsperada)
    {
        // Arrange
        var fecha = DateTime.Parse(fechaStr);
        var calculadora = new CalculadoraComisiones();

        // Act
        decimal comisionObtenida = calculadora.Calcular(fecha, montoVenta);

        // Assert
        comisionObtenida.Should().Be(comisionEsperada);
    }
}
