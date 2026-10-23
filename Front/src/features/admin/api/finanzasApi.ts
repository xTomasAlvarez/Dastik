import { apiClient } from '../../../lib/axios/apiClient';

export interface CotizacionCasaDto {
  casa: string;
  nombre: string;
  compra: number;
  venta: number;
  fechaActualizacion: string;
}

export interface DolarCotizacionDto {
  blue: CotizacionCasaDto;
  oficial: CotizacionCasaDto;
  esFallback: boolean;
  ultimaActualizacionUtc: string;
}

export interface GastoDto {
  id: number;
  descripcion: string;
  monto: number; // Final en ARS
  moneda: 'ARS' | 'USD';
  montoMonedaOriginal: number;
  tipoCambioAplicado: number | null;
  tipoDolar: string | null;
  categoria: string;
  fecha: string;
  turnoId: number | null;
  usuarioId: number;
}

export interface ListarGastosResponse {
  gastos: GastoDto[];
  totalArs: number;
  totalUsdOriginal: number;
  cantidadGastos: number;
}

export interface RegistrarGastoRequest {
  descripcion: string;
  monto: number;
  moneda?: 'ARS' | 'USD';
  tipoCambioAplicado?: number | null;
  tipoDolar?: string | null;
  categoria?: string;
  turnoId?: number | null;
}

export const finanzasApi = {
  obtenerCotizacionDolar: async (): Promise<DolarCotizacionDto> => {
    const response = await apiClient.get<DolarCotizacionDto>('/api/finanzas/cotizacion-dolar');
    return response.data;
  },

  obtenerGastos: async (turnoId?: number, desde?: string, hasta?: string): Promise<ListarGastosResponse> => {
    const params = new URLSearchParams();
    if (turnoId) params.append('turnoId', turnoId.toString());
    if (desde) params.append('desde', desde);
    if (hasta) params.append('hasta', hasta);

    const response = await apiClient.get<ListarGastosResponse>(`/api/finanzas/gastos?${params.toString()}`);
    return response.data;
  },

  registrarGasto: async (data: RegistrarGastoRequest): Promise<GastoDto> => {
    const response = await apiClient.post<GastoDto>('/api/finanzas/gastos', data);
    return response.data;
  },

  eliminarGasto: async (id: number): Promise<{ message: string }> => {
    const response = await apiClient.delete<{ message: string }>(`/api/finanzas/gastos/${id}`);
    return response.data;
  },
};
