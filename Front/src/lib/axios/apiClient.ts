import axios from 'axios';
import type { AxiosError, InternalAxiosRequestConfig } from 'axios';
import { useAuthStore } from '../../stores/useAuthStore';
import { useTenantStore } from '../../stores/useTenantStore';

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5031';

export const apiClient = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000,
});

// Interceptor de Petición: Inyección de Bearer Token y cabecera de Modo Sandbox
apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    // 1. Inyectar token JWT si existe en el store
    const token = useAuthStore.getState().token;
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    // 2. Inyectar cabecera de Sandbox para soporte complementario en desarrollo
    const isSandboxMode = useTenantStore.getState().isSandboxMode;
    config.headers['X-Sandbox-Mode'] = isSandboxMode ? 'true' : 'false';

    return config;
  },
  (error: AxiosError) => {
    return Promise.reject(error);
  }
);

// Interceptor de Respuesta: Manejo unificado de 401 Unauthorized y reseteo de sesión
apiClient.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    if (error.response?.status === 401) {
      // Sesión expirada o token inválido
      const logout = useAuthStore.getState().logout;
      logout();

      // Redirigir al login si no estamos ya en la página de autenticación
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }

    return Promise.reject(error);
  }
);
