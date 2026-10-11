import { apiClient } from '../../../lib/axios/apiClient';
import type { CambiarPasswordRequest, LoginRequest, LoginResponse } from '../../../types/auth.types';

export const authApi = {
  login: async (credentials: LoginRequest): Promise<LoginResponse> => {
    const response = await apiClient.post<LoginResponse>('/api/auth/login', credentials);
    return response.data;
  },

  cambiarPassword: async (data: CambiarPasswordRequest): Promise<{ mensaje: string }> => {
    const response = await apiClient.post<{ mensaje: string }>('/api/auth/cambiar-password', data);
    return response.data;
  },
};
