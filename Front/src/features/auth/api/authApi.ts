import { apiClient } from '../../../lib/axios/apiClient';
import type { CambiarPasswordRequest, LoginRequest, LoginResponse } from '../../../types/auth.types';

export interface RecuperarPasswordRequest {
  identificador: string;
  claveMaestra: string;
  nuevaPassword: string;
}

export interface RecuperarPasswordResponse {
  mensaje: string;
  nombre: string;
}

export interface CambiarPasswordResponse {
  mensaje: string;
  token?: string;
  debeCambiarPassword: boolean;
}

export interface SolicitarPinResponse {
  exitoso: boolean;
  mensaje: string;
  pinSimuladoDesarrollo?: string;
}

export interface VerificarPinResponse {
  valido: boolean;
  mensaje: string;
}

export const authApi = {
  login: async (credentials: LoginRequest): Promise<LoginResponse> => {
    const response = await apiClient.post<LoginResponse>('/api/auth/login', credentials);
    return response.data;
  },

  cambiarPassword: async (data: CambiarPasswordRequest): Promise<CambiarPasswordResponse> => {
    const response = await apiClient.post<CambiarPasswordResponse>('/api/auth/cambiar-password', data);
    return response.data;
  },

  recuperarPassword: async (data: RecuperarPasswordRequest): Promise<RecuperarPasswordResponse> => {
    const response = await apiClient.post<RecuperarPasswordResponse>('/api/auth/recuperar-password', data);
    return response.data;
  },

  solicitarPinRecuperacion: async (email: string): Promise<SolicitarPinResponse> => {
    const response = await apiClient.post<SolicitarPinResponse>('/api/auth/solicitar-pin-recuperacion', { email });
    return response.data;
  },

  verificarPinRecuperacion: async (email: string, pin: string): Promise<VerificarPinResponse> => {
    const response = await apiClient.post<VerificarPinResponse>('/api/auth/verificar-pin-recuperacion', { email, pin });
    return response.data;
  },

  confirmarRecuperacionPin: async (data: { email: string; pin: string; nuevaPassword: string; confirmarPassword: string }): Promise<{ mensaje: string }> => {
    const response = await apiClient.post<{ mensaje: string }>('/api/auth/confirmar-recuperacion-pin', data);
    return response.data;
  },
};
