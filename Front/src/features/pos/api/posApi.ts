import { apiClient } from '../../../lib/axios/apiClient';

export const MetodosPago = {
  Efectivo: 1,
  Transferencia: 2,
  Tarjeta: 3,
} as const;

export type MetodoPagoTipo = (typeof MetodosPago)[keyof typeof MetodosPago];

export interface ItemCobroRequest {
  varianteId: number;
  cantidad: number;
  precioUnitario: number;
}

export interface PagoCobroRequest {
  metodoPago: MetodoPagoTipo;
  monto: number;
}

export interface CobrarOrdenRequest {
  turnoId: number;
  items: ItemCobroRequest[];
  pagos: PagoCobroRequest[];
}

export interface CobrarOrdenResponse {
  ordenId: number;
  turnoId: number;
  fecha: string;
  total: number;
  comisionCalculada: number;
  cantidadItems: number;
}

export const posApi = {
  cobrarOrden: async (data: CobrarOrdenRequest): Promise<CobrarOrdenResponse> => {
    const response = await apiClient.post<CobrarOrdenResponse>('/api/caja/cobrar', data);
    return response.data;
  },
};
