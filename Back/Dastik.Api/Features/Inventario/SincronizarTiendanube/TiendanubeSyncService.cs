using Dastik.Api.Common;
using Dastik.Api.Domain.Entities;
using Dastik.Api.Domain.Integrations.Tiendanube;
using Dastik.Api.Domain.Services;
using Dastik.Api.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace Dastik.Api.Features.Inventario.SincronizarTiendanube;

public class TiendanubeSyncService : ITiendanubeSyncService
{
    private readonly AppDbContext _context;
    private readonly ITiendanubeApiClient _apiClient;
    private readonly GeneradorEan13 _generadorEan13;
    private readonly ILogger<TiendanubeSyncService> _logger;

    public TiendanubeSyncService(
        AppDbContext context,
        ITiendanubeApiClient apiClient,
        GeneradorEan13 generadorEan13,
        ILogger<TiendanubeSyncService> logger)
    {
        _context = context;
        _apiClient = apiClient;
        _generadorEan13 = generadorEan13;
        _logger = logger;
    }

    public async Task<Result<SincronizarCatalogoResult>> SincronizarCatalogoAsync(
        string? storeId = null,
        string? accessToken = null,
        CancellationToken ct = default)
    {
        _logger.LogInformation("Iniciando proceso de sincronización de catálogo desde Tiendanube...");

        // 1. REGLA DE TENANT: Ubicar Unidad de Negocio 'Dastik' con integración a Tiendanube
        var unidadDastik = await _context.UnidadesNegocio
            .FirstOrDefaultAsync(u => u.TieneTiendaNube && u.Nombre == UnidadNegocio.Dastik, ct)
            ?? await _context.UnidadesNegocio.FirstOrDefaultAsync(u => u.TieneTiendaNube, ct)
            ?? await _context.UnidadesNegocio.FirstOrDefaultAsync(u => u.Nombre == UnidadNegocio.Dastik, ct);

        if (unidadDastik is null)
        {
            _logger.LogError("Fallo de sincronización: No se encontró la Unidad de Negocio 'Dastik' configurada.");
            return Result<SincronizarCatalogoResult>.Failure("No se encontró la Unidad de Negocio 'Dastik' en el sistema.");
        }

        var finalStoreId = !string.IsNullOrWhiteSpace(storeId)
            ? storeId.Trim()
            : (!string.IsNullOrWhiteSpace(unidadDastik.TiendanubeStoreId)
                ? unidadDastik.TiendanubeStoreId.Trim()
                : Environment.GetEnvironmentVariable("TIENDANUBE_STORE_ID")?.Trim() ?? "sandbox-dastik");

        var rawAccessToken = !string.IsNullOrWhiteSpace(accessToken)
            ? accessToken.Trim()
            : (!string.IsNullOrWhiteSpace(unidadDastik.TiendanubeAccessToken)
                ? unidadDastik.TiendanubeAccessToken.Trim()
                : Environment.GetEnvironmentVariable("TIENDANUBE_ACCESS_TOKEN")?.Trim() ?? "mock-token-dastik");

        var finalAccessToken = TiendanubeTokenHelper.NormalizarToken(rawAccessToken) ?? "mock-token-dastik";

        // 2. Obtener productos desde la API de Tiendanube
        var responseApi = await _apiClient.ObtenerProductosAsync(finalStoreId, finalAccessToken, ct);
        if (!responseApi.IsSuccess)
        {
            _logger.LogError("Error al consultar API de Tiendanube: {Error}", responseApi.Error);
            return Result<SincronizarCatalogoResult>.Failure(responseApi.Error ?? "Error desconocido al consultar API de Tiendanube");
        }

        var productosNube = responseApi.Value ?? new List<TiendanubeProductResponse>();
        _logger.LogInformation("Se recibieron {Cantidad} productos desde Tiendanube API.", productosNube.Count);

        // 3. Obtener o crear referencias por defecto para Catálogo (Categoría, Marca, Proveedor)
        var categoriaDefault = await _context.Categorias.FirstOrDefaultAsync(c => c.Nombre == "Indumentaria", ct)
            ?? await _context.Categorias.FirstOrDefaultAsync(ct);
        if (categoriaDefault is null)
        {
            categoriaDefault = new Categoria { Nombre = "Indumentaria", Temporada = "Todo el año", EsquemaTalles = "XS-XL" };
            _context.Categorias.Add(categoriaDefault);
            await _context.SaveChangesAsync(ct);
        }

        var marcaDefault = await _context.Marcas.FirstOrDefaultAsync(m => m.Nombre == "Dastik", ct)
            ?? await _context.Marcas.FirstOrDefaultAsync(ct);
        if (marcaDefault is null)
        {
            marcaDefault = new Marca { Nombre = "Dastik" };
            _context.Marcas.Add(marcaDefault);
            await _context.SaveChangesAsync(ct);
        }

        var proveedorDefault = await _context.Proveedores.FirstOrDefaultAsync(p => p.Nombre.Contains("Dastik"), ct)
            ?? await _context.Proveedores.FirstOrDefaultAsync(ct);
        if (proveedorDefault is null)
        {
            proveedorDefault = new Proveedor { Nombre = "Proveedor Textil Dastik", MarkupPorDefecto = 1.50m };
            _context.Proveedores.Add(proveedorDefault);
            await _context.SaveChangesAsync(ct);
        }

        // 4. Cargar productos existentes con TiendanubeProductId para realizar Upsert
        var productosExistentes = await _context.Productos
            .Include(p => p.Variantes)
            .Where(p => p.TiendanubeProductId != null)
            .ToListAsync(ct);

        var existentesDict = productosExistentes.ToDictionary(p => p.TiendanubeProductId!);

        int productosNuevos = 0;
        int productosActualizados = 0;
        int totalVariantesImportadas = 0;

        foreach (var pDto in productosNube)
        {
            string tnProdId = pDto.Id.ToString();

            if (existentesDict.TryGetValue(tnProdId, out var prodExistente))
            {
                // ACTUALIZACIÓN (UPDATE)
                prodExistente.Nombre = pDto.Nombre;
                if (!string.IsNullOrWhiteSpace(pDto.Descripcion))
                {
                    var descLimpia = LimpiarHtml(pDto.Descripcion);
                    if (!string.IsNullOrWhiteSpace(descLimpia))
                    {
                        prodExistente.Descripcion = descLimpia;
                    }
                }
                if (!string.IsNullOrWhiteSpace(pDto.ImagenUrl))
                {
                    prodExistente.ImagenUrl = pDto.ImagenUrl;
                }
                if (pDto.Precio.HasValue && pDto.Precio.Value > 0)
                {
                    prodExistente.PrecioVenta = pDto.Precio.Value;
                }
                if (pDto.Costo.HasValue && pDto.Costo.Value > 0)
                {
                    prodExistente.CostoBase = pDto.Costo.Value;
                }
                prodExistente.MarkupAplicado = prodExistente.CostoBase > 0
                    ? Math.Round(prodExistente.PrecioVenta / prodExistente.CostoBase, 2)
                    : 1.5m;

                // Forzar Regla de Tenant
                prodExistente.UnidadNegocioId = unidadDastik.Id;

                // Actualizar o añadir variantes
                foreach (var vDto in pDto.Variantes)
                {
                    string tnVarId = vDto.Id.ToString();
                    var varianteExistente = prodExistente.Variantes
                        .FirstOrDefault(v => v.TiendanubeVariantId == tnVarId);

                    if (varianteExistente is null && !string.IsNullOrWhiteSpace(vDto.Barcode))
                    {
                        varianteExistente = prodExistente.Variantes
                            .FirstOrDefault(v => v.CodigoBarras == vDto.Barcode);
                    }

                    if (varianteExistente is not null)
                    {
                        if (vDto.Stock.HasValue) varianteExistente.StockFisico = vDto.Stock.Value;
                        if (!string.IsNullOrWhiteSpace(vDto.Talle)) varianteExistente.Talle = vDto.Talle;
                        if (!string.IsNullOrWhiteSpace(vDto.Color)) varianteExistente.Color = vDto.Color;
                        if (!string.IsNullOrWhiteSpace(vDto.Barcode)) varianteExistente.CodigoBarras = vDto.Barcode;
                        varianteExistente.TiendanubeVariantId = tnVarId;
                    }
                    else
                    {
                        bool esGenerado = string.IsNullOrWhiteSpace(vDto.Barcode);
                        string codigoBarras = esGenerado ? _generadorEan13.Generar() : vDto.Barcode!;

                        prodExistente.Variantes.Add(new Variante
                        {
                            ProductoId = prodExistente.Id,
                            Talle = vDto.Talle ?? "TU",
                            Color = vDto.Color ?? "Único",
                            CodigoBarras = codigoBarras,
                            EsCodigoGenerado = esGenerado,
                            StockFisico = vDto.Stock ?? 0,
                            TiendanubeVariantId = tnVarId
                        });
                    }

                    totalVariantesImportadas++;
                }

                productosActualizados++;
            }
            else
            {
                // INSERCIÓN (INSERT)
                decimal precioVenta = pDto.Precio ?? 20000m;
                decimal costoBase = pDto.Costo ?? (pDto.Precio.HasValue ? Math.Round(pDto.Precio.Value / 1.5m, 2) : 13333m);
                decimal markup = costoBase > 0 ? Math.Round(precioVenta / costoBase, 2) : 1.5m;

                var nuevoProducto = new Producto
                {
                    UnidadNegocioId = unidadDastik.Id, // REGLA DE TENANT: Dastik exclusivo
                    CategoriaId = categoriaDefault.Id,
                    MarcaId = marcaDefault.Id,
                    ProveedorId = proveedorDefault.Id,
                    Nombre = pDto.Nombre,
                    Descripcion = !string.IsNullOrWhiteSpace(LimpiarHtml(pDto.Descripcion))
                        ? LimpiarHtml(pDto.Descripcion)
                        : $"{pDto.Nombre} - Importado Tiendanube",
                    ImagenUrl = pDto.ImagenUrl ?? "",
                    PrecioVenta = precioVenta,
                    CostoBase = costoBase,
                    MarkupAplicado = markup,
                    TiendanubeProductId = tnProdId,
                    Activo = true
                };

                foreach (var vDto in pDto.Variantes)
                {
                    bool esGenerado = string.IsNullOrWhiteSpace(vDto.Barcode);
                    string codigoBarras = esGenerado ? _generadorEan13.Generar() : vDto.Barcode!;

                    nuevoProducto.Variantes.Add(new Variante
                    {
                        Talle = vDto.Talle ?? "TU",
                        Color = vDto.Color ?? "Único",
                        CodigoBarras = codigoBarras,
                        EsCodigoGenerado = esGenerado,
                        StockFisico = vDto.Stock ?? 0,
                        TiendanubeVariantId = vDto.Id.ToString()
                    });

                    totalVariantesImportadas++;
                }

                _context.Productos.Add(nuevoProducto);
                existentesDict[tnProdId] = nuevoProducto;
                productosNuevos++;
            }
        }

        await _context.SaveChangesAsync(ct);

        _logger.LogInformation(
            "Sincronización completada con éxito. Nuevos: {Nuevos}, Actualizados: {Actualizados}, Variantes: {TotalVariantes}",
            productosNuevos, productosActualizados, totalVariantesImportadas);

        return Result<SincronizarCatalogoResult>.Success(new SincronizarCatalogoResult(
            TotalProductosImportados: productosNube.Count,
            TotalVariantesImportadas: totalVariantesImportadas,
            ProductosNuevos: productosNuevos,
            ProductosActualizados: productosActualizados,
            Mensaje: $"Catálogo de Tiendanube sincronizado correctamente: {productosNuevos} productos nuevos creados, {productosActualizados} actualizados."
        ));
    }

    /// <summary>
    /// Limpia tags y entidades HTML devolviendo texto plano legible.
    /// </summary>
    public static string LimpiarHtml(string? html)
    {
        if (string.IsNullOrWhiteSpace(html)) return string.Empty;

        // 1. Reemplazar saltos de bloque HTML por espacios
        var conEspacios = System.Text.RegularExpressions.Regex.Replace(
            html,
            @"<br\s*/?>|</p>|</li>|</div>|</tr>|</h1>|</h2>|</h3>|</h4>|</h5>|</h6>",
            " ",
            System.Text.RegularExpressions.RegexOptions.IgnoreCase);

        // 2. Eliminar todas las etiquetas HTML <.*?>
        var sinTags = System.Text.RegularExpressions.Regex.Replace(
            conEspacios,
            @"<[^>]+>",
            string.Empty);

        // 3. Decodificar entidades HTML (&nbsp;, &aacute;, etc.)
        var decodificado = System.Net.WebUtility.HtmlDecode(sinTags);

        // 4. Normalizar múltiples espacios en blanco
        var normalizado = System.Text.RegularExpressions.Regex.Replace(
            decodificado,
            @"\s+",
            " ").Trim();

        return normalizado;
    }
}
