import { apiClient } from '../../../lib/axios/apiClient';

export interface ArqueoResumenResponse {
  turnoId: number;
  empleadoId: number;
  operador: string;
  turno: string;
  fechaApertura: string;
  fechaCierre: string | null;
  saldoInicial: number;
  totalEfectivo: number;
  totalTransferencia: number;
  totalDebito: number;
  totalCredito: number;
  totalVentas: number;
  gastosTurno: number;
  efectivoEsperado: number;
  efectivoRealDeclarado: number;
  diferencia: number;
  cantidadOrdenes: number;
  estadoDiferencia: 'CUADRADA' | 'FALTANTE' | 'SOBRANTE' | string;
}

export const arqueosApi = {
  obtenerArqueos: async (): Promise<ArqueoResumenResponse[]> => {
    const response = await apiClient.get<ArqueoResumenResponse[]>('/api/caja/arqueos');
    return response.data;
  },
};
