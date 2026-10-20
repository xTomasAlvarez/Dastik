using System.Security.Cryptography;
using System.Text;

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
    /// Genera un código EAN-13 100% determinista e inmutable para variantes sincronizadas.
    /// Toma los últimos 10 dígitos numéricos de TiendanubeVariantId con PadLeft(10, '0')
    /// (o un hash numérico estable de ProductoNombre + Talle si no posee TiendanubeVariantId),
    /// antepone el prefijo "20" y calcula el 13º dígito verificador oficial EAN-13.
    /// </summary>
    public string GenerarDeterminista(
        string? tiendanubeVariantId,
        string? productoNombre = null,
        string? talle = null)
    {
        string diezDigitos;

        var soloDigitos = ExtraerSoloDigitos(tiendanubeVariantId);
        if (soloDigitos.Length > 0)
        {
            diezDigitos = soloDigitos.Length > 10
                ? soloDigitos[^10..]
                : soloDigitos.PadLeft(10, '0');
        }
        else
        {
            var semilla = $"{(productoNombre ?? string.Empty).Trim().ToUpperInvariant()}|{(talle ?? string.Empty).Trim().ToUpperInvariant()}";
            var hashBytes = SHA256.HashData(Encoding.UTF8.GetBytes(semilla));
            ulong valorNumerico = BitConverter.ToUInt64(hashBytes, 0) % 10_000_000_000UL;
            diezDigitos = valorNumerico.ToString("D10");
        }

        string prefijo12 = $"20{diezDigitos}";
        int digitoVerificador = CalcularDigitoVerificador(prefijo12);

        return $"{prefijo12}{digitoVerificador}";
    }

    /// <summary>
    /// Verifica si una cadena es un código de barras numérico de 13 dígitos válido.
    /// </summary>
    public static bool TieneBarcode13DigitosValido(string? barcode)
    {
        if (string.IsNullOrWhiteSpace(barcode)) return false;
        var limpio = barcode.Trim();
        if (limpio.Length != 13) return false;
        foreach (var c in limpio)
        {
            if (!char.IsDigit(c)) return false;
        }
        return true;
    }

    private static string ExtraerSoloDigitos(string? input)
    {
        if (string.IsNullOrWhiteSpace(input)) return string.Empty;
        var sb = new StringBuilder(input.Length);
        foreach (var c in input)
        {
            if (char.IsDigit(c))
            {
                sb.Append(c);
            }
        }
        return sb.ToString();
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
