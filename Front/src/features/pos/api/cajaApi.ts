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

export const cajaApi = {
  obtenerTurnoActivo: async (): Promise<TurnoActivoDto | null> => {
    const response = await apiClient.get<TurnoActivoDto | null>('/api/caja/turno-activo');
    return response.data;
  },

  abrirTurno: async (data: AbrirTurnoRequest): Promise<AbrirTurnoResponse> => {
    const response = await apiClient.post<AbrirTurnoResponse>('/api/caja/abrir-turno', data);
    return response.data;
  },
};
