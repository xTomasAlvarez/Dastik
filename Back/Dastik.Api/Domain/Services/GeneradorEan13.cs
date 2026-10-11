namespace Dastik.Api.Domain.Services;

public class GeneradorEan13
{
    private static readonly Random _random = new();

    /// <summary>
    /// Genera un código de barras EAN-13 válido para uso interno (prefijo 20...).
    /// Consta de 12 dígitos de datos y un 13º dígito verificador calculado por algoritmo Módulo 10.
    /// </summary>
    public string Generar()
    {
        Span<char> buffer = stackalloc char[12];
        // Prefijo estándar de uso interno restringido (In-Store barcode: 20-29)
        buffer[0] = '2';
        buffer[1] = '0';

        for (int i = 2; i < 12; i++)
        {
            buffer[i] = (char)('0' + _random.Next(0, 10));
        }

        string prefijo12 = new(buffer);
        int digitoVerificador = CalcularDigitoVerificador(prefijo12);

        return $"{prefijo12}{digitoVerificador}";
    }

    /// <summary>
    /// Calcula el dígito verificador estándar EAN-13 (GS1 Módulo 10) a partir de los 12 primeros dígitos.
    /// </summary>
    public int CalcularDigitoVerificador(string primeros12)
    {
        if (string.IsNullOrWhiteSpace(primeros12) || primeros12.Length != 12)
        {
            throw new ArgumentException("El prefijo debe tener exactamente 12 dígitos numéricos.", nameof(primeros12));
        }

        int suma = 0;
        for (int i = 0; i < 12; i++)
        {
            char c = primeros12[i];
            if (!char.IsDigit(c))
            {
                throw new ArgumentException("Todos los caracteres deben ser dígitos numéricos.", nameof(primeros12));
            }

            int digito = c - '0';
            // Índices pares (0, 2, 4...) ponderan 1; índices impares (1, 3, 5...) ponderan 3
            suma += (i % 2 == 0) ? digito : digito * 3;
        }

        int resto = suma % 10;
        return (resto == 0) ? 0 : 10 - resto;
    }
}
