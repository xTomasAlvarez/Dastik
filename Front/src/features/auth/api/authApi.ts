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

export const authApi = {
  login: async (credentials: LoginRequest): Promise<LoginResponse> => {
    const response = await apiClient.post<LoginResponse>('/api/auth/login', credentials);
    return response.data;
  },

  cambiarPassword: async (data: CambiarPasswordRequest): Promise<{ mensaje: string }> => {
    const response = await apiClient.post<{ mensaje: string }>('/api/auth/cambiar-password', data);
    return response.data;
  },

  recuperarPassword: async (data: RecuperarPasswordRequest): Promise<RecuperarPasswordResponse> => {
    const response = await apiClient.post<RecuperarPasswordResponse>('/api/auth/recuperar-password', data);
    return response.data;
  },
};
