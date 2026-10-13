import { create } from 'zustand';
import type { LoginResponse, UsuarioDto } from '../types/auth.types';
import { queryClient } from '../lib/react-query/queryClient';

interface AuthState {
  token: string | null;
  usuario: UsuarioDto | null;
  isAuthenticated: boolean;
  debeCambiarPassword: boolean;

  setAuth: (data: LoginResponse) => void;
  setPasswordCambiado: () => void;
  logout: () => void;
}

const TOKEN_KEY = 'dastik_auth_token';
const USER_KEY = 'dastik_auth_user';

const initialToken = localStorage.getItem(TOKEN_KEY);
let initialUser: UsuarioDto | null = null;
try {
  const storedUser = localStorage.getItem(USER_KEY);
  if (storedUser) {
    initialUser = JSON.parse(storedUser);
  }
} catch {
  initialUser = null;
}

export const useAuthStore = create<AuthState>((set) => ({
  token: initialToken,
  usuario: initialUser,
  isAuthenticated: !!initialToken,
  debeCambiarPassword: initialUser?.debeCambiarPassword ?? false,

  setAuth: (data: LoginResponse) => {
    const usuario: UsuarioDto = {
      id: data.usuarioId,
      nombre: data.nombre,
      email: data.email,
      rol: data.rol,
      debeCambiarPassword: data.debeCambiarPassword,
    };

    localStorage.setItem(TOKEN_KEY, data.token);
    localStorage.setItem(USER_KEY, JSON.stringify(usuario));

    set({
      token: data.token,
      usuario,
      isAuthenticated: true,
      debeCambiarPassword: data.debeCambiarPassword,
    });
  },

  setPasswordCambiado: () => {
    set((state) => {
      if (!state.usuario) return state;
      const updatedUser: UsuarioDto = {
        ...state.usuario,
        debeCambiarPassword: false,
      };
      localStorage.setItem(USER_KEY, JSON.stringify(updatedUser));
      return {
        usuario: updatedUser,
        debeCambiarPassword: false,
      };
    });
  },

  logout: () => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    queryClient.clear();
    set({
      token: null,
      usuario: null,
      isAuthenticated: false,
      debeCambiarPassword: false,
    });
  },
}));
