using Dastik.Api.Domain.Services;
using FluentAssertions;
using Xunit;

namespace Dastik.Tests;

public class GeneradorEan13Tests
{
    private readonly GeneradorEan13 _generador = new();

    [Fact]
    public void Generar_DebeRetornarCadenaDeExactamente13DigitosNumericos()
    {
        // Act
        string ean13 = _generador.Generar();

        // Assert
        ean13.Should().NotBeNullOrWhiteSpace();
        ean13.Length.Should().Be(13);
        ean13.Should().MatchRegex(@"^\d{13}$", "un código EAN-13 solo debe contener dígitos numéricos");
    }

    [Fact]
    public void Generar_DebeTenerDigitoVerificadorValidoSegunAlgoritmoModulo10()
    {
        // Act
        string ean13 = _generador.Generar();

        // Assert
        int digitoEsperado = CalcularDigitoVerificadorEan13(ean13[..12]);
        int digitoReal = int.Parse(ean13[^1].ToString());

        digitoReal.Should().Be(digitoEsperado, "el último dígito debe ser el checksum módulo 10 de los 12 primeros");
    }

    [Theory]
    // Pruebas determinísticas con prefijos conocidos de 12 dígitos y su dígito verificador estándar EAN-13
    [InlineData("779123456789", 8)] // Suma = 132 -> (10 - (132 % 10)) = 8
    [InlineData("200000000001", 5)] // Suma = 5 -> (10 - (5 % 10)) = 5
    [InlineData("400638133393", 1)] // Suma = 89 -> (10 - (89 % 10)) = 1
    public void CalcularDigitoVerificador_ConPrefijoConocido_DebeRetornarDigitoCorrecto(string prefijo12, int digitoEsperado)
    {
        // Act
        int digitoCalculado = _generador.CalcularDigitoVerificador(prefijo12);

        // Assert
        digitoCalculado.Should().Be(digitoEsperado);
    }

    private static int CalcularDigitoVerificadorEan13(string primeros12)
    {
        int suma = 0;
        for (int i = 0; i < 12; i++)
        {
            int digito = int.Parse(primeros12[i].ToString());
            suma += (i % 2 == 0) ? digito * 1 : digito * 3;
        }
        int resto = suma % 10;
        return (resto == 0) ? 0 : 10 - resto;
    }
}
