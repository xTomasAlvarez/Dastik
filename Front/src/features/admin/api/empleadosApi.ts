import { apiClient } from '../../../lib/axios/apiClient';

export interface EmpleadoDto {
  id: number;
  nombre: string;
  email: string;
  rol: string;
  turnoAsignado: string;
  tarifaPorHora: number;
  activo: boolean;
  fechaCreacion: string;
  debeCambiarPassword?: boolean;
}

export interface CrearEmpleadoRequest {
  nombre: string;
  email: string;
  password?: string;
  turno: string;
  tarifaPorHora: number;
  rol?: string;
}

export interface ActualizarEmpleadoRequest {
  nombre: string;
  email: string;
  turno?: string;
  tarifaPorHora: number;
  rol?: string;
}

export interface CalcularPagoResponse {
  empleadoId: number;
  nombre: string;
  turnoAsignado: string;
  tarifaPorHora: number;
  horasTrabajadas: number;
  totalAPagar: number;
}

export const empleadosApi = {
  obtenerEmpleados: async (): Promise<EmpleadoDto[]> => {
    const response = await apiClient.get<EmpleadoDto[]>('/api/usuarios/empleados');
    return response.data;
  },

  crearEmpleado: async (data: CrearEmpleadoRequest): Promise<EmpleadoDto> => {
    const response = await apiClient.post<EmpleadoDto>('/api/usuarios/empleados', data);
    return response.data;
  },

  actualizarEmpleado: async (id: number, data: ActualizarEmpleadoRequest): Promise<EmpleadoDto> => {
    const response = await apiClient.put<EmpleadoDto>(`/api/usuarios/empleados/${id}`, data);
    return response.data;
  },

  calcularPago: async (empleadoId: number, horasTrabajadas: number): Promise<CalcularPagoResponse> => {
    const response = await apiClient.post<CalcularPagoResponse>(
      `/api/usuarios/empleados/${empleadoId}/calcular-pago`,
      { horasTrabajadas }
    );
    return response.data;
  },

  resetPassword: async (empleadoId: number, nuevaPassword = 'Dastik2026!', debeCambiarPassword = true): Promise<{ message: string }> => {
    const response = await apiClient.post<{ message: string }>(
      `/api/usuarios/empleados/${empleadoId}/reset-password`,
      { nuevaPassword, debeCambiarPassword }
    );
    return response.data;
  },

  toggleActivo: async (empleadoId: number): Promise<{ id: number; nombre: string; activo: boolean; message: string }> => {
    const response = await apiClient.patch<{ id: number; nombre: string; activo: boolean; message: string }>(
      `/api/usuarios/empleados/${empleadoId}/toggle-activo`
    );
    return response.data;
  },
};
