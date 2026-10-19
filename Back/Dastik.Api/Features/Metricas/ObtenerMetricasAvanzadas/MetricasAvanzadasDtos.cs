namespace Dastik.Api.Features.Metricas.ObtenerMetricasAvanzadas;

public record MetricasAvanzadasResponse(
    // Resumen Financiero del Período
    decimal IngresosBrutos,
    decimal CostoMercaderiaVendida,
    decimal GananciaBruta,
    decimal GastosCajaRegistrados,
    int CantidadOperaciones,
    decimal TicketPromedio,

    // Desglose por Medio de Pago
    decimal TotalEfectivo,
    decimal TotalTransferencia,
    decimal TotalDebito,
    decimal TotalCredito,

    // Comparativa por Unidad de Negocio
    decimal IngresosDastik,
    decimal IngresosHiddenSneakers,

    // Velocidad de Rotación y Rendimiento de Catálogo
    List<TopVendidoDto> TopMasVendidos,
    List<ProductoEstancadoDto> ProductosEstancados
);

public record TopVendidoDto(
    int VarianteId,
    string ProductoNombre,
    string Talle,
    string Color,
    string UnidadNegocio,
    int UnidadesVendidas,
    decimal IngresosGenerados,
    int StockActual,
    decimal VelocidadDiaria,
    bool SugerenciaReposicion,
    int CantidadSugerida
);

public record ProductoEstancadoDto(
    int ProductoId,
    int VarianteId,
    string ProductoNombre,
    string Talle,
    string Color,
    string UnidadNegocio,
    int StockFisico,
    decimal CostoBase,
    decimal PrecioVenta,
    decimal CapitalInmovilizado
);
