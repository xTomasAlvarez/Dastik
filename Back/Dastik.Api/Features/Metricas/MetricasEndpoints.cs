using Dastik.Api.Domain.Entities;
using Dastik.Api.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace Dastik.Api.Features.Metricas;

public static class MetricasEndpoints
{
    public static void MapMetricasEndpoints(this IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/api/metricas")
            .WithTags("Métricas y Dashboard")
            .RequireAuthorization();

        // 1. GET /api/metricas/dashboard
        group.MapGet("/dashboard", async (
            AppDbContext context,
            CancellationToken ct) =>
        {
            // Ventana horaria local de Argentina (UTC-3)
            var ahoraLocal = DateTime.UtcNow.AddHours(-3);
            var inicioHoy = new DateTime(ahoraLocal.Year, ahoraLocal.Month, ahoraLocal.Day, 0, 0, 0, DateTimeKind.Utc).AddHours(3);
            var finHoy = inicioHoy.AddDays(1);

            // Órdenes cobradas durante el día de hoy
            var ordenesHoy = await context.Ordenes
                .AsNoTracking()
                .Where(o => o.Estado == EstadoOrden.Pagada && o.Fecha >= inicioHoy && o.Fecha < finHoy)
                .Include(o => o.Detalles)
                    .ThenInclude(d => d.Variante)
                        .ThenInclude(v => v.Producto)
                .ToListAsync(ct);

            decimal ingresosHoy = ordenesHoy.Sum(o => o.Total);
            int cantidadVentasHoy = ordenesHoy.Count;

            // Ganancia Neta Hoy = Ingresos - CostoBase de los productos vendidos
            decimal costoTotalHoy = ordenesHoy
                .SelectMany(o => o.Detalles)
                .Sum(d => d.Cantidad * (d.Variante != null && d.Variante.Producto != null ? d.Variante.Producto.CostoBase : 0m));

            decimal gananciaNetaHoy = ingresosHoy - costoTotalHoy;
            decimal margenPorcentajeHoy = ingresosHoy > 0
                ? Math.Round((gananciaNetaHoy / ingresosHoy) * 100, 1)
                : 0m;

            // Ventas de los últimos 7 días para gráfico de volumen
            var inicio7Dias = inicioHoy.AddDays(-6);
            var ordenes7Dias = await context.Ordenes
                .AsNoTracking()
                .Where(o => o.Estado == EstadoOrden.Pagada && o.Fecha >= inicio7Dias && o.Fecha < finHoy)
                .ToListAsync(ct);

            var culturaEs = new System.Globalization.CultureInfo("es-AR");
            var ventasUltimos7Dias = new List<VentaDiaDto>();

            for (int i = 6; i >= 0; i--)
            {
                var diaInicio = inicioHoy.AddDays(-i);
                var diaFin = diaInicio.AddDays(1);
                var diaLocal = diaInicio.AddHours(-3);

                var ordenesDelDia = ordenes7Dias.Where(o => o.Fecha >= diaInicio && o.Fecha < diaFin).ToList();
                var diaNombre = diaLocal.ToString("ddd", culturaEs).ToUpper().Replace(".", "");

                ventasUltimos7Dias.Add(new VentaDiaDto(
                    Fecha: diaLocal.ToString("yyyy-MM-dd"),
                    DiaSemana: diaNombre,
                    Total: ordenesDelDia.Sum(o => o.Total),
                    CantidadVentas: ordenesDelDia.Count
                ));
            }

            var response = new DashboardResumenResponse(
                IngresosHoy: ingresosHoy,
                GananciaNetaHoy: gananciaNetaHoy,
                CantidadVentasHoy: cantidadVentasHoy,
                MargenPorcentajeHoy: margenPorcentajeHoy,
                VentasUltimos7Dias: ventasUltimos7Dias
            );

            return Results.Ok(response);
        })
        .WithName("ObtenerDashboardResumen")
        .WithSummary("Devuelve las métricas consolidadas del día (Ingresos, Ganancia Neta, Cantidad de Ventas) y el histórico de 7 días.")
        .WithOpenApi();

        // 2. GET /api/metricas/alertas-stock
        group.MapGet("/alertas-stock", async (
            AppDbContext context,
            CancellationToken ct) =>
        {
            // Regla estricta de negocio: variantes cuyo StockFisico <= 3
            var alertas = await context.Variantes
                .AsNoTracking()
                .Include(v => v.Producto)
                    .ThenInclude(p => p.Marca)
                .Include(v => v.Producto)
                    .ThenInclude(p => p.Categoria)
                .Include(v => v.Producto)
                    .ThenInclude(p => p.UnidadNegocio)
                .Where(v => v.StockFisico <= 3 && v.Producto.Activo)
                .OrderBy(v => v.StockFisico)
                .ThenBy(v => v.Producto.Nombre)
                .Select(v => new AlertaStockDto(
                    v.ProductoId,
                    v.Id,
                    v.Producto.Nombre,
                    v.Producto.Marca.Nombre,
                    v.Producto.Categoria.Nombre,
                    v.Producto.UnidadNegocio.Nombre,
                    v.Talle,
                    v.Color,
                    v.CodigoBarras,
                    v.StockFisico,
                    v.Producto.ImagenUrl,
                    v.Producto.PrecioVenta
                ))
                .ToListAsync(ct);

            return Results.Ok(alertas);
        })
        .WithName("ObtenerAlertasStock")
        .WithSummary("Devuelve la lista de variantes con stock físico menor o igual a 3 unidades (crítico o quiebre).")
        .WithOpenApi();
    }
}
