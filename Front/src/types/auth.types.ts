export type RolUsuario = 'Admin' | 'Empleado';

export interface UsuarioDto {
  id: number;
  nombre: string;
  email: string;
  rol: RolUsuario;
  debeCambiarPassword: boolean;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  usuarioId: number;
  email: string;
  nombre: string;
  rol: RolUsuario;
  debeCambiarPassword: boolean;
  isSandboxMode: boolean;
}

export interface CambiarPasswordRequest {
  passwordActual: string;
  passwordNuevo: string;
}
