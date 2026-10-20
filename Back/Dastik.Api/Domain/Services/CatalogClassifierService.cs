using System.Globalization;
using System.Text;
using System.Text.Json;
using System.Text.RegularExpressions;
using Dastik.Api.Domain.Entities;
using Dastik.Api.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace Dastik.Api.Domain.Services;

public record CatalogClassificationSummary(
    int TotalProductosAnalizados,
    int ProductosReclasificadosCategoria,
    int ProductosReclasificadosMarca,
    int ProductosImagenesOptimizadas,
    Dictionary<string, int> ConteoPorCategoria,
    Dictionary<string, int> ConteoPorMarca,
    int VariantesEanDeterministaNormalizadas = 0
);

public static class CatalogClassifierService
{
    public static readonly IReadOnlyList<(string Nombre, string EsquemaTalles)> CategoriasOficiales = new List<(string, string)>
    {
        ("Remeras", "S-XXL"),
        ("Pantalones & Jeans", "38-48 / S-XXL"),
        ("Polos & Chombas", "S-XXL"),
        ("Camisas", "S-XXL"),
        ("Buzos & Hoodies", "S-XXL"),
        ("Camperas & Abrigos", "S-XXL"),
        ("Bermudas & Shorts", "38-48 / S-XXL"),
        ("Gorras & Accesorios", "Único"),
        ("Zapatillas & Sneakers", "US 7-13")
    };

    public static readonly IReadOnlyList<string> MarcasOficiales = new List<string>
    {
        "Dastik",
        "New Era",
        "The North Face",
        "Nike",
        "Jordan",
        "Adidas",
        "Yeezy",
        "Vans",
        "New Balance",
        "Puma",
        "Corteiz",
        "Stüssy",
        "Drew",
        "Essentials",
        "Supreme"
    };

    /// <summary>
    /// Normaliza URLs del CDN de Tiendanube para solicitar la versión de alta resolución (-1024-1024)
    /// en lugar de miniaturas comprimidas (-240-0, -320-0, -480-0, -640-0).
    /// </summary>
    public static string NormalizarUrlImagenAltaRes(string? url)
    {
        if (string.IsNullOrWhiteSpace(url)) return string.Empty;

        var limpia = url.Trim();
        if (limpia.Contains("mitiendanube.com", StringComparison.OrdinalIgnoreCase) ||
            limpia.Contains("cloudfront.net", StringComparison.OrdinalIgnoreCase) ||
            limpia.Contains("acdn-us.mitiendanube.com", StringComparison.OrdinalIgnoreCase))
        {
            limpia = Regex.Replace(
                limpia,
                @"-(?:240|320|480|640)-0\.(webp|jpg|jpeg|png)",
                "-1024-1024.$1",
                RegexOptions.IgnoreCase);
        }

        return limpia;
    }

    public static List<string> NormalizarListaImagenesAltaRes(IEnumerable<string>? urls, string? fallbackImagenUrl = null)
    {
        var resultado = new List<string>();
        if (urls is not null)
        {
            foreach (var u in urls)
            {
                var norm = NormalizarUrlImagenAltaRes(u);
                if (!string.IsNullOrWhiteSpace(norm) && !resultado.Contains(norm, StringComparer.OrdinalIgnoreCase))
                {
                    resultado.Add(norm);
                }
            }
        }

        if (resultado.Count == 0 && !string.IsNullOrWhiteSpace(fallbackImagenUrl))
        {
            var normFallback = NormalizarUrlImagenAltaRes(fallbackImagenUrl);
            if (!string.IsNullOrWhiteSpace(normFallback))
            {
                resultado.Add(normFallback);
            }
        }

        return resultado;
    }

    /// <summary>
    /// Infiere la categoría real del producto analizando su nombre y categorías opcionales de Tiendanube.
    /// </summary>
    public static (string NombreCategoria, string EsquemaTalles) InferirCategoria(
        string? nombreProducto,
        IEnumerable<string>? categoriasTiendanube = null)
    {
        var textoNombre = NormalizarTexto(nombreProducto);
        var textoCategoriasTn = categoriasTiendanube is not null
            ? NormalizarTexto(string.Join(" ", categoriasTiendanube))
            : string.Empty;

        var resultadoPorNombre = EvaluarReglasCategoria(textoNombre);
        if (resultadoPorNombre is not null)
        {
            return resultadoPorNombre.Value;
        }

        if (!string.IsNullOrWhiteSpace(textoCategoriasTn))
        {
            var resultadoPorTn = EvaluarReglasCategoria(textoCategoriasTn);
            if (resultadoPorTn is not null)
            {
                return resultadoPorTn.Value;
            }
        }

        return ("Remeras", "S-XXL");
    }

    private static (string NombreCategoria, string EsquemaTalles)? EvaluarReglasCategoria(string texto)
    {
        if (string.IsNullOrWhiteSpace(texto)) return null;

        bool tienePrendaExplicita = ContieneAlguno(texto,
            "remera", "remeron", "tee", "t-shirt", "musculosa", "tank",
            "polo", "chomba", "rugby",
            "camisa", "sobrecamisa",
            "buzo", "hoodie", "crewneck", "sweater", "canguro", "pullover", "polar", "medio cierre",
            "campera", "puffer", "rompeviento", "chaleco", "parka", "jacket", "anorak", "tapado",
            "pantalon", "jean", "cargo", "jogging", "baggy", "parachute", "jogger", "sastrero", "carpenter", "wide leg",
            "bermuda", "short", "malla", "traje de bano", "jort",
            "gorra", "piluso", "australiano", "gorro", "beanie", "medias", "soquetes", "bolso", "mochila", "rinonera", "cinto", "cinturon", "lentes", "gafas", "cadena", "boxer", "perfume", "llavero", "billetera", "cuellito");

        if (!tienePrendaExplicita && ContieneAlguno(texto,
            "zapatilla", "sneaker", "dunk", "jordan", "yeezy", "air force", "campus", "samba", "adi2000", "forum", "new balance", "vans", "calzado", "slide", "foam runner"))
        {
            return ("Zapatillas & Sneakers", "US 7-13");
        }

        if (ContieneAlguno(texto, "zapatilla", "sneaker", "calzado"))
        {
            return ("Zapatillas & Sneakers", "US 7-13");
        }

        // 2. Gorras & Accesorios
        if (ContieneAlguno(texto,
            "gorra", "piluso", "australiano", "gorro", "beanie", "medias", "soquetes", "bolso",
            "mochila", "rinonera", "cinto", "cinturon", "lentes", "gafas", "cadena", "boxer",
            "perfume", "llavero", "billetera", "cuellito", "morral", "tarjetero", "anteojos", "pack medias", "pack x"))
        {
            return ("Gorras & Accesorios", "Único");
        }

        // 3. Bermudas & Shorts
        if (ContieneAlguno(texto,
            "bermuda", "short", "malla", "traje de bano", "jort"))
        {
            return ("Bermudas & Shorts", "38-48 / S-XXL");
        }

        // 4. Pantalones & Jeans
        if (ContieneAlguno(texto,
            "pantalon", "jean", "cargo", "jogging", "baggy", "parachute", "jogger",
            "sastrero", "carpenter", "wide leg", "babucha", "chupin", "denim pant", "pant "))
        {
            return ("Pantalones & Jeans", "38-48 / S-XXL");
        }

        // 5. Camperas & Abrigos
        if (ContieneAlguno(texto,
            "campera", "puffer", "rompeviento", "rompevientos", "chaleco", "parka",
            "jacket", "anorak", "tapado", "varsity", "bomber", "cortaviento", "windbreaker"))
        {
            return ("Camperas & Abrigos", "S-XXL");
        }

        // 6. Buzos & Hoodies
        if (ContieneAlguno(texto,
            "buzo", "hoodie", "crewneck", "sweater", "canguro", "pullover",
            "polar", "medio cierre", "sweatshirt", "cardigan", "polera"))
        {
            return ("Buzos & Hoodies", "S-XXL");
        }

        // 7. Camisas
        if (ContieneAlguno(texto,
            "sobrecamisa", "camisa", "lenadora", "guayabera"))
        {
            return ("Camisas", "S-XXL");
        }

        // 8. Polos & Chombas
        if (ContieneAlguno(texto,
            "polo", "chomba", "rugby"))
        {
            return ("Polos & Chombas", "S-XXL");
        }

        // 9. Remeras
        if (ContieneAlguno(texto,
            "remera", "remeron", "tee", "t-shirt", "tshirt", "musculosa", "tank",
            "boxy", "oversize", "camiseta", "jersey", "manga corta", "manga larga", "crop"))
        {
            return ("Remeras", "S-XXL");
        }

        return null;
    }

    /// <summary>
    /// Infiere la marca real a partir del nombre del producto. Si no contiene una marca externa, asigna "Dastik".
    /// </summary>
    public static string InferirMarca(string? nombreProducto)
    {
        var texto = NormalizarTexto(nombreProducto);
        if (string.IsNullOrWhiteSpace(texto)) return "Dastik";

        if (ContieneAlguno(texto, "new era", "newera", "59fifty", "9forty"))
            return "New Era";

        if (ContieneAlguno(texto, "the north face", "north face") || ContienePalabraExacta(texto, "tnf"))
            return "The North Face";

        if (ContieneAlguno(texto, "new balance"))
            return "New Balance";

        if (ContieneAlguno(texto, "stussy"))
            return "Stüssy";

        if (ContieneAlguno(texto, "corteiz", "crtz"))
            return "Corteiz";

        if (ContieneAlguno(texto, "essentials", "fear of god"))
            return "Essentials";

        if (ContienePalabraExacta(texto, "supreme"))
            return "Supreme";

        if (ContienePalabraExacta(texto, "drew") || ContieneAlguno(texto, "drew house"))
            return "Drew";

        if (ContienePalabraExacta(texto, "yeezy"))
            return "Yeezy";

        if (ContienePalabraExacta(texto, "jordan"))
            return "Jordan";

        if (ContienePalabraExacta(texto, "nike") || ContieneAlguno(texto, "air force", "dunk"))
            return "Nike";

        if (ContienePalabraExacta(texto, "adidas") || ContieneAlguno(texto, "adi2000", "samba"))
            return "Adidas";

        if (ContienePalabraExacta(texto, "vans") || ContieneAlguno(texto, "knu skool", "old skool"))
            return "Vans";

        if (ContienePalabraExacta(texto, "puma"))
            return "Puma";

        return "Dastik";
    }

    /// <summary>
    /// Limpia los proveedores erróneos ("Proveedor Textil Dastik" y "Proveedor Sneakerheads"),
    /// asegura que existan "Sample" (55%) y "Proveedor General" (50%), reclasifica todos los productos
    /// existentes en la base de datos en sus categorías y marcas reales, y normaliza de forma determinista
    /// los códigos EAN-13 internos generados para variantes de Tiendanube.
    /// </summary>
    public static async Task<CatalogClassificationSummary> ClasificarCatalogoExistenteAsync(
        AppDbContext context,
        CancellationToken ct = default)
    {
        var generadorEan = new GeneradorEan13();

        // 1. Limpieza y normalización de Proveedores
        var proveedores = await context.Proveedores.ToListAsync(ct);

        var provSample = proveedores.FirstOrDefault(p =>
            p.Nombre.Equals("Sample", StringComparison.OrdinalIgnoreCase));
        var provAntiguoDastik = proveedores.FirstOrDefault(p =>
            p.Nombre.Equals("Proveedor Textil Dastik", StringComparison.OrdinalIgnoreCase));

        if (provAntiguoDastik is not null)
        {
            if (provSample is null)
            {
                provAntiguoDastik.Nombre = "Sample";
                provAntiguoDastik.MarkupPorDefecto = 55m;
                provSample = provAntiguoDastik;
            }
            else
            {
                var prodsConAntiguo = await context.Productos
                    .Where(p => p.ProveedorId == provAntiguoDastik.Id)
                    .ToListAsync(ct);
                foreach (var p in prodsConAntiguo)
                {
                    p.ProveedorId = provSample.Id;
                }
                context.Proveedores.Remove(provAntiguoDastik);
            }
        }
        else if (provSample is null)
        {
            provSample = new Proveedor { Nombre = "Sample", MarkupPorDefecto = 55m };
            context.Proveedores.Add(provSample);
        }

        var provGeneral = proveedores.FirstOrDefault(p =>
            p.Nombre.Equals("Proveedor General", StringComparison.OrdinalIgnoreCase));
        var provAntiguoSneakers = proveedores.FirstOrDefault(p =>
            p.Nombre.Equals("Proveedor Sneakerheads", StringComparison.OrdinalIgnoreCase));

        if (provAntiguoSneakers is not null)
        {
            if (provGeneral is null)
            {
                provAntiguoSneakers.Nombre = "Proveedor General";
                provAntiguoSneakers.MarkupPorDefecto = 50m;
                provGeneral = provAntiguoSneakers;
            }
            else
            {
                var prodsConAntiguo = await context.Productos
                    .Where(p => p.ProveedorId == provAntiguoSneakers.Id)
                    .ToListAsync(ct);
                foreach (var p in prodsConAntiguo)
                {
                    p.ProveedorId = provGeneral.Id;
                }
                context.Proveedores.Remove(provAntiguoSneakers);
            }
        }
        else if (provGeneral is null)
        {
            provGeneral = new Proveedor { Nombre = "Proveedor General", MarkupPorDefecto = 50m };
            context.Proveedores.Add(provGeneral);
        }

        await context.SaveChangesAsync(ct);

        // 2. Asegurar Categorías Oficiales
        var categoriasDb = await context.Categorias.ToListAsync(ct);
        var mapaCategorias = new Dictionary<string, Categoria>(StringComparer.OrdinalIgnoreCase);
        foreach (var cat in categoriasDb)
        {
            mapaCategorias[cat.Nombre] = cat;
        }

        foreach (var (nombreCat, esquema) in CategoriasOficiales)
        {
            if (!mapaCategorias.ContainsKey(nombreCat))
            {
                var nuevaCat = new Categoria
                {
                    Nombre = nombreCat,
                    Temporada = "Todo el año",
                    EsquemaTalles = esquema
                };
                context.Categorias.Add(nuevaCat);
                mapaCategorias[nombreCat] = nuevaCat;
            }
        }

        // 3. Asegurar Marcas base ("Dastik")
        var marcasDb = await context.Marcas.ToListAsync(ct);
        var mapaMarcas = new Dictionary<string, Marca>(StringComparer.OrdinalIgnoreCase);
        foreach (var m in marcasDb)
        {
            mapaMarcas[m.Nombre] = m;
        }

        if (!mapaMarcas.ContainsKey("Dastik"))
        {
            var marcaDastik = new Marca { Nombre = "Dastik" };
            context.Marcas.Add(marcaDastik);
            mapaMarcas["Dastik"] = marcaDastik;
        }

        await context.SaveChangesAsync(ct);

        // 4. Reclasificar Productos, optimizar URLs de imágenes y asegurar EAN-13 determinista en variantes generadas de Tiendanube
        var productos = await context.Productos
            .Include(p => p.Categoria)
            .Include(p => p.Marca)
            .Include(p => p.Variantes)
            .ToListAsync(ct);

        int reclasificadosCategoria = 0;
        int reclasificadosMarca = 0;
        int imagenesOptimizadas = 0;
        int variantesEanNormalizadas = 0;

        foreach (var prod in productos)
        {
            // Inferir categoría real
            var (nombreCatInferida, esquemaInferido) = InferirCategoria(prod.Nombre);
            if (!mapaCategorias.TryGetValue(nombreCatInferida, out var catDestino))
            {
                catDestino = new Categoria
                {
                    Nombre = nombreCatInferida,
                    Temporada = "Todo el año",
                    EsquemaTalles = esquemaInferido
                };
                context.Categorias.Add(catDestino);
                await context.SaveChangesAsync(ct);
                mapaCategorias[nombreCatInferida] = catDestino;
            }

            if (prod.CategoriaId != catDestino.Id)
            {
                prod.CategoriaId = catDestino.Id;
                reclasificadosCategoria++;
            }

            // Inferir marca real
            var nombreMarcaInferida = InferirMarca(prod.Nombre);
            if (!mapaMarcas.TryGetValue(nombreMarcaInferida, out var marcaDestino))
            {
                marcaDestino = new Marca { Nombre = nombreMarcaInferida };
                context.Marcas.Add(marcaDestino);
                await context.SaveChangesAsync(ct);
                mapaMarcas[nombreMarcaInferida] = marcaDestino;
            }

            if (prod.MarcaId != marcaDestino.Id)
            {
                prod.MarcaId = marcaDestino.Id;
                reclasificadosMarca++;
            }

            // Optimizar resolución de ImagenUrl e ImagenesJson (-1024-1024)
            bool imgModificada = false;
            if (!string.IsNullOrWhiteSpace(prod.ImagenUrl))
            {
                var altaRes = NormalizarUrlImagenAltaRes(prod.ImagenUrl);
                if (altaRes != prod.ImagenUrl)
                {
                    prod.ImagenUrl = altaRes;
                    imgModificada = true;
                }
            }

            List<string> listaActual = new();
            if (!string.IsNullOrWhiteSpace(prod.ImagenesJson) && prod.ImagenesJson != "[]")
            {
                try
                {
                    listaActual = JsonSerializer.Deserialize<List<string>>(prod.ImagenesJson) ?? new List<string>();
                }
                catch
                {
                    listaActual = new List<string>();
                }
            }

            var listaAltaRes = NormalizarListaImagenesAltaRes(listaActual, prod.ImagenUrl);
            var nuevoJson = JsonSerializer.Serialize(listaAltaRes);
            if (nuevoJson != prod.ImagenesJson)
            {
                prod.ImagenesJson = nuevoJson;
                imgModificada = true;
            }

            if (imgModificada)
            {
                imagenesOptimizadas++;
            }

            // Migración suave a EAN-13 Determinista para variantes con código interno generado desde Tiendanube
            foreach (var v in prod.Variantes)
            {
                if (!string.IsNullOrWhiteSpace(v.TiendanubeVariantId) &&
                    (v.EsCodigoGenerado || string.IsNullOrWhiteSpace(v.CodigoBarras)))
                {
                    var eanDeterminista = generadorEan.GenerarDeterminista(v.TiendanubeVariantId, prod.Nombre, v.Talle);
                    if (v.CodigoBarras != eanDeterminista)
                    {
                        v.CodigoBarras = eanDeterminista;
                        v.EsCodigoGenerado = true;
                        variantesEanNormalizadas++;
                    }
                }
            }
        }

        await context.SaveChangesAsync(ct);

        // 5. Eliminar la categoría genérica "Indumentaria" o "Calzado" si quedaron con 0 productos asociados
        var categoriasHuerfanas = await context.Categorias
            .Where(c => (c.Nombre == "Indumentaria" || c.Nombre == "Calzado") &&
                        !context.Productos.Any(p => p.CategoriaId == c.Id))
            .ToListAsync(ct);

        if (categoriasHuerfanas.Count > 0)
        {
            context.Categorias.RemoveRange(categoriasHuerfanas);
            await context.SaveChangesAsync(ct);
        }

        // 6. Construir resumen estadístico
        var conteoPorCategoria = productos
            .GroupBy(p => mapaCategorias.Values.FirstOrDefault(c => c.Id == p.CategoriaId)?.Nombre ?? "Sin Categoría")
            .OrderByDescending(g => g.Count())
            .ToDictionary(g => g.Key, g => g.Count());

        var conteoPorMarca = productos
            .GroupBy(p => mapaMarcas.Values.FirstOrDefault(m => m.Id == p.MarcaId)?.Nombre ?? "Dastik")
            .OrderByDescending(g => g.Count())
            .ToDictionary(g => g.Key, g => g.Count());

        return new CatalogClassificationSummary(
            TotalProductosAnalizados: productos.Count,
            ProductosReclasificadosCategoria: reclasificadosCategoria,
            ProductosReclasificadosMarca: reclasificadosMarca,
            ProductosImagenesOptimizadas: imagenesOptimizadas,
            ConteoPorCategoria: conteoPorCategoria,
            ConteoPorMarca: conteoPorMarca,
            VariantesEanDeterministaNormalizadas: variantesEanNormalizadas
        );
    }

    private static string NormalizarTexto(string? input)
    {
        if (string.IsNullOrWhiteSpace(input)) return string.Empty;

        var normalized = input.ToLowerInvariant().Normalize(NormalizationForm.FormD);
        var sb = new StringBuilder(normalized.Length);

        foreach (var c in normalized)
        {
            var category = CharUnicodeInfo.GetUnicodeCategory(c);
            if (category != UnicodeCategory.NonSpacingMark)
            {
                sb.Append(c);
            }
        }

        return sb.ToString().Normalize(NormalizationForm.FormC);
    }

    private static bool ContieneAlguno(string textoNormalizado, params string[] terminos)
    {
        foreach (var t in terminos)
        {
            if (textoNormalizado.Contains(t, StringComparison.Ordinal))
            {
                return true;
            }
        }
        return false;
    }

    private static bool ContienePalabraExacta(string textoNormalizado, string palabra)
    {
        return Regex.IsMatch(
            textoNormalizado,
            $@"\b{Regex.Escape(palabra)}\b",
            RegexOptions.CultureInvariant);
    }
}
