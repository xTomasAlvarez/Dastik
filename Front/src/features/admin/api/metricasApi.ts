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

export const metricasApi = {
  obtenerDashboard: async (): Promise<DashboardResumenResponse> => {
    const response = await apiClient.get<DashboardResumenResponse>('/api/metricas/dashboard');
    return response.data;
  },

  obtenerAlertasStock: async (): Promise<AlertaStockDto[]> => {
    const response = await apiClient.get<AlertaStockDto[]>('/api/metricas/alertas-stock');
    return response.data;
  },
};
