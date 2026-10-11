import { apiClient } from '../../../lib/axios/apiClient';

export interface TurnoActivoDto {
  turnoId: number;
  empleadoId: number;
  fechaApertura: string;
  saldoInicial: number;
  estado: string;
}

export interface AbrirTurnoRequest {
  saldoInicial: number;
  empleadoId?: number;
}

export interface AbrirTurnoResponse {
  turnoId: number;
  empleadoId: number;
  fechaApertura: string;
  saldoInicial: number;
}

export interface ResumenTurnoDto {
  turnoId: number;
  empleadoId: number;
  fechaApertura: string;
  saldoInicial: number;
  totalVentasEfectivo: number;
  totalVentasTarjeta: number;
  totalVentasTransferencia: number;
  totalVentas: number;
  saldoEsperado: number;
  cantidadOrdenes: number;
}

export interface CerrarTurnoRequest {
  turnoId: number;
  saldoFinal?: number;
  montoRealEfectivo?: number;
}

export interface CerrarTurnoResponse {
  turnoId: number;
  empleadoId: number;
  fechaApertura: string;
  fechaCierre: string;
  saldoInicial: number;
  totalVentasEfectivo: number;
  saldoEsperado: number;
  saldoFinal: number;
  diferencia: number;
  cantidadOrdenes: number;
}

export const cajaApi = {
  obtenerTurnoActivo: async (): Promise<TurnoActivoDto | null> => {
    const response = await apiClient.get<TurnoActivoDto | null>('/api/caja/turno-activo');
    return response.data;
  },

  abrirTurno: async (data: AbrirTurnoRequest): Promise<AbrirTurnoResponse> => {
    const response = await apiClient.post<AbrirTurnoResponse>('/api/caja/abrir-turno', data);
    return response.data;
  },

  obtenerResumenTurno: async (turnoId: number): Promise<ResumenTurnoDto> => {
    const response = await apiClient.get<ResumenTurnoDto>(`/api/caja/turnos/${turnoId}/resumen`);
    return response.data;
  },

  cerrarTurno: async (data: CerrarTurnoRequest): Promise<CerrarTurnoResponse> => {
    const payload = {
      turnoId: data.turnoId,
      saldoFinal: data.saldoFinal ?? data.montoRealEfectivo ?? 0,
      montoRealEfectivo: data.montoRealEfectivo ?? data.saldoFinal ?? 0,
    };
    const response = await apiClient.post<CerrarTurnoResponse>('/api/caja/cerrar-turno', payload);
    return response.data;
  },
};
