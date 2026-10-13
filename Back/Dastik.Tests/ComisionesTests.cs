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

    [Fact]
    public void CalcularComision_CuandoEsSabadoNocheEnArgentinaPeroDomingoEnUtc_DeberiaAplicarComision()
    {
        // Arrange: Sábado 10 de octubre a las 21:30 hs de Argentina -> Domingo 11 a las 00:30 hs UTC
        var fechaUtc = new DateTime(2026, 10, 11, 0, 30, 0, DateTimeKind.Utc);
        var calculadora = new CalculadoraComisiones();

        // Act
        decimal comision = calculadora.Calcular(fechaUtc, 150_000.00m);

        // Assert: 5% de 150.000 = 7.500
        comision.Should().Be(7500.00m);
    }

    [Fact]
    public void CalcularComision_CuandoEsViernesNocheEnArgentinaPeroSabadoEnUtc_NoDebeAplicarComision()
    {
        // Arrange: Viernes 9 de octubre a las 22:00 hs de Argentina -> Sábado 10 a la 01:00 hs UTC
        var fechaUtc = new DateTime(2026, 10, 10, 1, 0, 0, DateTimeKind.Utc);
        var calculadora = new CalculadoraComisiones();

        // Act
        decimal comision = calculadora.Calcular(fechaUtc, 150_000.00m);

        // Assert: 0 porque localmente sigue siendo viernes
        comision.Should().Be(0.00m);
    }
}
