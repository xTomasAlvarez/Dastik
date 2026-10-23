import { apiClient } from '../../../lib/axios/apiClient';

export const MetodosPago = {
  Efectivo: 1,
  Transferencia: 2,
  Tarjeta: 3,
  Debito: 4,
  Credito: 5,
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

export interface RegistrarCambioRequest {
  turnoId: number;
  varianteDevueltaId: number;
  cantidadDevuelta: number;
  varianteNuevaId: number;
  cantidadNueva: number;
  motivoCambio: string;
  metodoPagoDiferencia?: MetodoPagoTipo | null;
  montoDiferenciaPagada?: number | null;
  ordenIdOriginal?: number | null;
}

export interface RegistrarCambioResponse {
  ordenId: number;
  turnoId: number;
  fecha: string;
  subtotalDevuelto: number;
  subtotalNuevo: number;
  diferencia: number;
  montoCobrado: number;
  metodoPago?: MetodoPagoTipo | null;
  motivoCambio: string;
  stockDevueltoFinal: number;
  stockNuevoFinal: number;
  ordenOrigenId?: number | null;
}

export const posApi = {
  cobrarOrden: async (data: CobrarOrdenRequest): Promise<CobrarOrdenResponse> => {
    const response = await apiClient.post<CobrarOrdenResponse>('/api/caja/cobrar', data);
    return response.data;
  },

  registrarCambio: async (data: RegistrarCambioRequest): Promise<RegistrarCambioResponse> => {
    const response = await apiClient.post<RegistrarCambioResponse>('/api/caja/cambios', data);
    return response.data;
  },
};
