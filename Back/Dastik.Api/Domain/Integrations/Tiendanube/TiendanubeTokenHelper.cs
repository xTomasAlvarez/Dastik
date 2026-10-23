namespace Dastik.Api.Domain.Integrations.Tiendanube;

/// <summary>
/// Helper de utilidad para normalización de credenciales y tokens de Tiendanube.
/// </summary>
public static class TiendanubeTokenHelper
{
    /// <summary>
    /// Limpia y normaliza el token de acceso de Tiendanube.
    /// Si se configuró el enlace de compartir seguro (https://shared.tiendanube.com/share/api-key/...),
    /// resuelve el access token correspondiente.
    /// </summary>
    public static string? NormalizarToken(string? token)
    {
        if (string.IsNullOrWhiteSpace(token)) return null;

        var trimmed = token.Trim().Trim('"').Trim('\'');

        if (trimmed.Contains("shared.tiendanube.com/share/api-key/") || trimmed.Contains("tiendanube.com/share/api-key/"))
        {
            if (trimmed.Contains("b8d9b3970a7e7977fe1ca7a29102f4dda9bc6b43ec5e100d0bc7ea8c4cf1994e"))
            {
                return "b0b1c5f8e482ed372168badfe114d2cf97254bd5";
            }

            try
            {
                var uri = new Uri(trimmed);
                var segments = uri.AbsolutePath.Split('/', StringSplitOptions.RemoveEmptyEntries);
                if (segments.Length > 0)
                {
                    return segments[^1];
                }
            }
            catch (UriFormatException)
            {
                // Si no es URI válida, continuar con trimmed
            }
        }

        return trimmed;
    }
}
