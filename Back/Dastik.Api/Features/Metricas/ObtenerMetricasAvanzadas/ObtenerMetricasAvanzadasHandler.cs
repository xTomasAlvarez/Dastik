using Dastik.Api.Common;
using Dastik.Api.Domain.Entities;
using Dastik.Api.Infrastructure.Persistence;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Dastik.Api.Features.Metricas.ObtenerMetricasAvanzadas;

public class ObtenerMetricasAvanzadasHandler 
    : IRequestHandler<ObtenerMetricasAvanzadasQuery, Result<MetricasAvanzadasResponse>>
{
    private readonly AppDbContext _context;

    public ObtenerMetricasAvanzadasHandler(AppDbContext context)
    {
        _context = context;
    }

    public async Task<Result<MetricasAvanzadasResponse>> Handle(
        ObtenerMetricasAvanzadasQuery request,
        CancellationToken ct)
    {
        // 1. Calcular ventana de fechas (Hora local de Argentina UTC-3)
        var ahoraLocal = DateTime.UtcNow.AddHours(-3);
        var inicioHoy = new DateTime(ahoraLocal.Year, ahoraLocal.Month, ahoraLocal.Day, 0, 0, 0, DateTimeKind.Utc).AddHours(3);
        var finHoy = inicioHoy.AddDays(1);

        DateTime fechaInicio;
        int diasPeriodo;

        var periodoNorm = (request.Periodo ?? "mes").Trim().ToLowerInvariant();
        switch (periodoNorm)
        {
            case "hoy":
                fechaInicio = inicioHoy;
                diasPeriodo = 1;
                break;
            case "semana":
                fechaInicio = inicioHoy.AddDays(-6);
                diasPeriodo = 7;
                break;
            case "temporada":
                fechaInicio = inicioHoy.AddDays(-89);
                diasPeriodo = 90;
                break;
            case "mes":
            default:
                fechaInicio = inicioHoy.AddDays(-29);
                diasPeriodo = 30;
                break;
        }

        // 2. Consultar órdenes pagadas dentro de la ventana temporal
        var ordenes = await _context.Ordenes
            .AsNoTracking()
            .Where(o => o.Estado == EstadoOrden.Pagada && o.Fecha >= fechaInicio && o.Fecha < finHoy)
            .Include(o => o.Detalles)
                .ThenInclude(d => d.Variante)
                    .ThenInclude(v => v.Producto)
                        .ThenInclude(p => p.UnidadNegocio)
            .Include(o => o.Pagos)
            .ToListAsync(ct);

        // Si se filtra por unidad de negocio específica
        bool filtrarTenant = request.UnidadNegocioId.HasValue && request.UnidadNegocioId.Value > 0;
        int tenantId = request.UnidadNegocioId ?? 0;

        if (filtrarTenant)
        {
            ordenes = ordenes
                .Where(o => o.Detalles.Any(d => d.Variante?.Producto?.UnidadNegocioId == tenantId))
                .ToList();
        }

        // 3. Cálculos Financieros
        decimal ingresosBrutos = 0m;
        decimal costoMercaderiaVendida = 0m;

        foreach (var orden in ordenes)
        {
            if (filtrarTenant)
            {
                var detallesFiltrados = orden.Detalles
                    .Where(d => d.Variante?.Producto?.UnidadNegocioId == tenantId)
                    .ToList();
                ingresosBrutos += detallesFiltrados.Sum(d => d.Subtotal);
                costoMercaderiaVendida += detallesFiltrados.Sum(d => d.Cantidad * (d.Variante?.Producto?.CostoBase ?? 0m));
            }
            else
            {
                ingresosBrutos += orden.Total;
                costoMercaderiaVendida += orden.Detalles.Sum(d => d.Cantidad * (d.Variante?.Producto?.CostoBase ?? 0m));
            }
        }

        decimal gananciaBruta = ingresosBrutos - costoMercaderiaVendida;
        int cantidadOperaciones = ordenes.Count;
        decimal ticketPromedio = cantidadOperaciones > 0 ? Math.Round(ingresosBrutos / cantidadOperaciones, 2) : 0m;

        // Gastos de caja registrados en turnos del período
        var turnosPeriodo = await _context.Turnos
            .AsNoTracking()
            .Where(t => t.FechaApertura >= fechaInicio && t.FechaApertura < finHoy)
            .ToListAsync(ct);

        decimal gastosCajaRegistrados = turnosPeriodo.Sum(t => t.GastosTurno);

        // Desglose por medio de pago
        var pagos = ordenes.SelectMany(o => o.Pagos).ToList();
        decimal totalEfectivo = pagos.Where(p => p.MetodoPago == MetodoPago.Efectivo).Sum(p => p.Monto);
        decimal totalTransferencia = pagos.Where(p => p.MetodoPago == MetodoPago.Transferencia).Sum(p => p.Monto);
        decimal totalDebito = pagos.Where(p => p.MetodoPago == MetodoPago.Debito).Sum(p => p.Monto);
        decimal totalCredito = pagos.Where(p => p.MetodoPago == MetodoPago.Credito || p.MetodoPago == MetodoPago.Tarjeta).Sum(p => p.Monto);

        // Comparativa de facturación por unidad de negocio
        decimal ingresosDastik = ordenes.SelectMany(o => o.Detalles)
            .Where(d => d.Variante?.Producto?.UnidadNegocio != null && d.Variante.Producto.UnidadNegocio.Nombre == UnidadNegocio.Dastik)
            .Sum(d => d.Subtotal);

        decimal ingresosHiddenSneakers = ordenes.SelectMany(o => o.Detalles)
            .Where(d => d.Variante?.Producto?.UnidadNegocio != null && d.Variante.Producto.UnidadNegocio.Nombre == UnidadNegocio.HiddenSneakers)
            .Sum(d => d.Subtotal);

        // 4. Velocidad de Rotación y Top Más Vendidos
        var detallesValidos = ordenes.SelectMany(o => o.Detalles)
            .Where(d => d.Variante != null && d.Variante.Producto != null);

        if (filtrarTenant)
        {
            detallesValidos = detallesValidos.Where(d => d.Variante.Producto.UnidadNegocioId == tenantId);
        }

        var topMasVendidos = detallesValidos
            .GroupBy(d => d.VarianteId)
            .Select(g =>
            {
                var primerDetalle = g.First();
                var variante = primerDetalle.Variante;
                var producto = variante.Producto;
                int unidadesVendidas = g.Sum(d => d.Cantidad);
                decimal ingresosGenerados = g.Sum(d => d.Subtotal);
                decimal velocidadDiaria = Math.Round((decimal)unidadesVendidas / diasPeriodo, 2);
                decimal demanda7Dias = velocidadDiaria * 7m;
                bool sugerenciaReposicion = variante.StockFisico < demanda7Dias || variante.StockFisico <= 3;
                int cantidadSugerida = Math.Max(0, (int)Math.Ceiling(demanda7Dias) - variante.StockFisico);

                return new TopVendidoDto(
                    VarianteId: variante.Id,
                    ProductoNombre: producto.Nombre,
                    Talle: variante.Talle,
                    Color: variante.Color,
                    UnidadNegocio: producto.UnidadNegocio?.Nombre ?? "Dastik",
                    UnidadesVendidas: unidadesVendidas,
                    IngresosGenerados: ingresosGenerados,
                    StockActual: variante.StockFisico,
                    VelocidadDiaria: velocidadDiaria,
                    SugerenciaReposicion: sugerenciaReposicion,
                    CantidadSugerida: cantidadSugerida
                );
            })
            .OrderByDescending(t => t.UnidadesVendidas)
            .ThenByDescending(t => t.IngresosGenerados)
            .Take(10)
            .ToList();

        // 5. Productos Estancados (Stock Clavo con StockFisico > 0 y 0 ventas en el período)
        var variantesVendidasIds = detallesValidos.Select(d => d.VarianteId).ToHashSet();

        var variantesEstancadasQuery = _context.Variantes
            .AsNoTracking()
            .Include(v => v.Producto)
                .ThenInclude(p => p.UnidadNegocio)
            .Where(v => v.StockFisico > 0 && v.Producto.Activo);

        if (filtrarTenant)
        {
            variantesEstancadasQuery = variantesEstancadasQuery
                .Where(v => v.Producto.UnidadNegocioId == tenantId);
        }

        var todasConStock = await variantesEstancadasQuery.ToListAsync(ct);

        var productosEstancados = todasConStock
            .Where(v => !variantesVendidasIds.Contains(v.Id))
            .Select(v => new ProductoEstancadoDto(
                ProductoId: v.ProductoId,
                VarianteId: v.Id,
                ProductoNombre: v.Producto.Nombre,
                Talle: v.Talle,
                Color: v.Color,
                UnidadNegocio: v.Producto.UnidadNegocio?.Nombre ?? "Dastik",
                StockFisico: v.StockFisico,
                CostoBase: v.Producto.CostoBase,
                PrecioVenta: v.Producto.PrecioVenta,
                CapitalInmovilizado: Math.Round(v.StockFisico * v.Producto.CostoBase, 2)
            ))
            .OrderByDescending(p => p.CapitalInmovilizado)
            .Take(20)
            .ToList();

        var response = new MetricasAvanzadasResponse(
            IngresosBrutos: ingresosBrutos,
            CostoMercaderiaVendida: costoMercaderiaVendida,
            GananciaBruta: gananciaBruta,
            GastosCajaRegistrados: gastosCajaRegistrados,
            CantidadOperaciones: cantidadOperaciones,
            TicketPromedio: ticketPromedio,
            TotalEfectivo: totalEfectivo,
            TotalTransferencia: totalTransferencia,
            TotalDebito: totalDebito,
            TotalCredito: totalCredito,
            IngresosDastik: ingresosDastik,
            IngresosHiddenSneakers: ingresosHiddenSneakers,
            TopMasVendidos: topMasVendidos,
            ProductosEstancados: productosEstancados
        );

        return Result<MetricasAvanzadasResponse>.Success(response);
    }
}
