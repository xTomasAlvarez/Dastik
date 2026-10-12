namespace Dastik.Api.Features.Metricas;

public record VentaDiaDto(
    string Fecha,
    string DiaSemana,
    decimal Total,
    int CantidadVentas
);

public record DashboardResumenResponse(
    decimal IngresosHoy,
    decimal GananciaNetaHoy,
    int CantidadVentasHoy,
    decimal MargenPorcentajeHoy,
    List<VentaDiaDto> VentasUltimos7Dias
);

public record AlertaStockDto(
    int ProductoId,
    int VarianteId,
    string NombreProducto,
    string Marca,
    string Categoria,
    string UnidadNegocio,
    string Talle,
    string Color,
    string CodigoBarras,
    int StockFisico,
    string ImagenUrl,
    decimal PrecioVenta
);
