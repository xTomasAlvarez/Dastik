import { apiClient } from '../../../lib/axios/apiClient';

export interface VentaDiaDto {
  fecha: string;
  diaSemana: string;
  total: number;
  cantidadVentas: number;
}

export interface DashboardResumenResponse {
  ingresosHoy: number;
  gananciaNetaHoy: number;
  cantidadVentasHoy: number;
  margenPorcentajeHoy: number;
  ventasUltimos7Dias: VentaDiaDto[];
}

export interface AlertaStockDto {
  productoId: number;
  varianteId: number;
  nombreProducto: string;
  marca: string;
  categoria: string;
  unidadNegocio: string;
  talle: string;
  color: string;
  codigoBarras: string;
  stockFisico: number;
  imagenUrl?: string;
  precioVenta: number;
}

export interface TopVendidoDto {
  varianteId: number;
  productoNombre: string;
  talle: string;
  color: string;
  unidadNegocio: string;
  unidadesVendidas: number;
  ingresosGenerados: number;
  stockActual: number;
  velocidadDiaria: number;
  sugerenciaReposicion: boolean;
  cantidadSugerida: number;
}

export interface ProductoEstancadoDto {
  productoId: number;
  varianteId: number;
  productoNombre: string;
  talle: string;
  color: string;
  unidadNegocio: string;
  stockFisico: number;
  costoBase: number;
  precioVenta: number;
  capitalInmovilizado: number;
}

export interface MetricasAvanzadasResponse {
  ingresosBrutos: number;
  costoMercaderiaVendida: number;
  gananciaBruta: number;
  gastosCajaRegistrados: number;
  cantidadOperaciones: number;
  ticketPromedio: number;

  totalEfectivo: number;
  totalTransferencia: number;
  totalDebito: number;
  totalCredito: number;

  ingresosDastik: number;
  ingresosHiddenSneakers: number;

  topMasVendidos: TopVendidoDto[];
  productosEstancados: ProductoEstancadoDto[];
}

export const metricasApi = {
  obtenerDashboard: async (): Promise<DashboardResumenResponse> => {
    const response = await apiClient.get<DashboardResumenResponse>('/api/metricas/dashboard');
    return response.data;
  },

  obtenerAlertasStock: async (): Promise<AlertaStockDto[]> => {
    const response = await apiClient.get<AlertaStockDto[]>('/api/metricas/alertas-stock');
    return response.data;
  },

  obtenerMetricasAvanzadas: async (
    periodo?: string,
    unidadNegocioId?: number
  ): Promise<MetricasAvanzadasResponse> => {
    const params = new URLSearchParams();
    if (periodo) params.append('periodo', periodo);
    if (unidadNegocioId && unidadNegocioId > 0) {
      params.append('unidadNegocioId', unidadNegocioId.toString());
    }

    const qs = params.toString();
    const url = `/api/metricas/avanzadas${qs ? `?${qs}` : ''}`;
    const response = await apiClient.get<MetricasAvanzadasResponse>(url);
    return response.data;
  },
};
