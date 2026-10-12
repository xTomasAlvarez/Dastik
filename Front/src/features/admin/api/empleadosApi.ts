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
}

export interface CrearEmpleadoRequest {
  nombre: string;
  email: string;
  password: string;
  turno: string;
  tarifaPorHora: number;
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

  calcularPago: async (empleadoId: number, horasTrabajadas: number): Promise<CalcularPagoResponse> => {
    const response = await apiClient.post<CalcularPagoResponse>(
      `/api/usuarios/empleados/${empleadoId}/calcular-pago`,
      { horasTrabajadas }
    );
    return response.data;
  },
};
