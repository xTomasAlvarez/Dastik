import { create } from 'zustand';
import type { LoginResponse, UsuarioDto, RolUsuario } from '../types/auth.types';
import { queryClient } from '../lib/react-query/queryClient';
import { apiClient } from '../lib/axios/apiClient';

export interface SandboxAccount {
  id: string;
  nombre: string;
  email: string;
  password: string;
  label: string;
  rol: RolUsuario;
  turno: string;
  tarifa: string;
  esOcultoDev?: boolean;
}

export const SANDBOX_ACCOUNTS: SandboxAccount[] = [
  {
    id: 'diego',
    nombre: 'Diego',
    email: 'diego@dastik.com',
    password: 'Dastik2026!',
    label: 'Diego (Dueño)',
    rol: 'Admin',
    turno: 'Completo',
    tarifa: '$ 0/h',
  },
  {
    id: 'ale',
    nombre: 'Ale',
    email: 'ale@dastik.com',
    password: 'Dastik2026!',
    label: 'Ale (Cajero)',
    rol: 'Empleado',
    turno: 'Mañana',
    tarifa: '$ 4.500/h',
  },
  {
    id: 'facundo',
    nombre: 'Facundo',
    email: 'facundo@dastik.com',
    password: 'Dastik2026!',
    label: 'Facundo (Cajero)',
    rol: 'Empleado',
    turno: 'Tarde',
    tarifa: '$ 4.500/h',
  },
  {
    id: 'tomiDev',
    nombre: 'Tomi (Admin Dev)',
    email: 'tomidev@dastik.com',
    password: 'TomiDev2026!',
    label: 'Tomi (Dev)',
    rol: 'Admin',
    turno: 'Completo',
    tarifa: '$ 0/h',
    esOcultoDev: true,
  },
];

interface AuthState {
  token: string | null;
  usuario: UsuarioDto | null;
  isAuthenticated: boolean;
  debeCambiarPassword: boolean;

  setAuth: (data: LoginResponse) => void;
  setPasswordCambiado: (nuevoToken?: string) => void;
  syncEnvironment: (isSandbox: boolean) => void;
  fastSwitchSandboxUser: (accountId: string) => Promise<boolean>;
  logout: () => void;
}

const TOKEN_PROD_KEY = 'dastik-token-prod';
const USER_PROD_KEY = 'dastik-user-prod';
const TOKEN_SANDBOX_KEY = 'dastik-token-sandbox';
const USER_SANDBOX_KEY = 'dastik-user-sandbox';
const TENANT_STORAGE_KEY = 'dastik_sandbox_mode';

function getActiveStorageKeys(isSandbox?: boolean) {
  const sandboxActive =
    isSandbox ?? localStorage.getItem(TENANT_STORAGE_KEY) === 'true';
  return {
    isSandbox: sandboxActive,
    tokenKey: sandboxActive ? TOKEN_SANDBOX_KEY : TOKEN_PROD_KEY,
    userKey: sandboxActive ? USER_SANDBOX_KEY : USER_PROD_KEY,
  };
}

function loadInitialState() {
  const { isSandbox, tokenKey, userKey } = getActiveStorageKeys();

  let token = localStorage.getItem(tokenKey);
  let user: UsuarioDto | null = null;

  // Retrocompatibilidad con legacy keys para producción
  if (!isSandbox && !token) {
    token = localStorage.getItem('dastik_auth_token');
    const legacyUser = localStorage.getItem('dastik_auth_user');
    if (legacyUser) {
      try {
        user = JSON.parse(legacyUser);
      } catch {
        user = null;
      }
    }
  } else {
    const storedUser = localStorage.getItem(userKey);
    if (storedUser) {
      try {
        user = JSON.parse(storedUser);
      } catch {
        user = null;
      }
    }
  }

  return {
    token,
    usuario: user,
    isAuthenticated: !!token,
    debeCambiarPassword: user?.debeCambiarPassword ?? false,
  };
}

const initial = loadInitialState();

export const useAuthStore = create<AuthState>((set) => ({
  token: initial.token,
  usuario: initial.usuario,
  isAuthenticated: initial.isAuthenticated,
  debeCambiarPassword: initial.debeCambiarPassword,

  setAuth: (data: LoginResponse) => {
    const isSandbox =
      data.isSandboxMode ??
      localStorage.getItem(TENANT_STORAGE_KEY) === 'true';

    const { tokenKey, userKey } = getActiveStorageKeys(isSandbox);

    const esDev =
      data.esOcultoDev ||
      data.email?.toLowerCase() === 'tomidev@dastik.com' ||
      data.email?.toLowerCase() === 'tomi.empleado@dastik.com';

    const usuario: UsuarioDto = {
      id: data.usuarioId,
      nombre: data.nombre,
      email: data.email,
      rol: data.rol,
      debeCambiarPassword: data.debeCambiarPassword,
      esOcultoDev: esDev,
    };

    localStorage.setItem(tokenKey, data.token);
    localStorage.setItem(userKey, JSON.stringify(usuario));

    // Mantener sincronizado en keys legacy si es producción
    if (!isSandbox) {
      localStorage.setItem('dastik_auth_token', data.token);
      localStorage.setItem('dastik_auth_user', JSON.stringify(usuario));
    }

    set({
      token: data.token,
      usuario,
      isAuthenticated: true,
      debeCambiarPassword: data.debeCambiarPassword,
    });
  },

  setPasswordCambiado: (nuevoToken?: string) => {
    set((state) => {
      if (!state.usuario) return state;
      const { isSandbox, userKey, tokenKey } = getActiveStorageKeys();
      const updatedUser: UsuarioDto = {
        ...state.usuario,
        debeCambiarPassword: false,
      };
      localStorage.setItem(userKey, JSON.stringify(updatedUser));
      if (!isSandbox) {
        localStorage.setItem('dastik_auth_user', JSON.stringify(updatedUser));
      }
      if (nuevoToken) {
        localStorage.setItem(tokenKey, nuevoToken);
        if (!isSandbox) {
          localStorage.setItem('dastik_auth_token', nuevoToken);
        }
      }
      return {
        token: nuevoToken || state.token,
        usuario: updatedUser,
        debeCambiarPassword: false,
      };
    });
  },

  syncEnvironment: (isSandbox: boolean) => {
    const { tokenKey, userKey } = getActiveStorageKeys(isSandbox);

    let token = localStorage.getItem(tokenKey);
    let user: UsuarioDto | null = null;

    if (!isSandbox && !token) {
      token = localStorage.getItem('dastik_auth_token');
      const legacyUser = localStorage.getItem('dastik_auth_user');
      if (legacyUser) {
        try {
          user = JSON.parse(legacyUser);
        } catch {
          user = null;
        }
      }
    } else {
      const storedUser = localStorage.getItem(userKey);
      if (storedUser) {
        try {
          user = JSON.parse(storedUser);
        } catch {
          user = null;
        }
      }
    }

    queryClient.clear();

    set({
      token,
      usuario: user,
      isAuthenticated: !!token,
      debeCambiarPassword: user?.debeCambiarPassword ?? false,
    });
  },

  fastSwitchSandboxUser: async (accountId: string) => {
    const account = SANDBOX_ACCOUNTS.find((a) => a.id === accountId);
    if (!account) return false;

    try {
      const response = await apiClient.post<LoginResponse>('/api/auth/login', {
        email: account.email,
        password: account.password,
        isSandboxMode: true,
      });

      const data = response.data;
      const esDev =
        data.esOcultoDev ||
        account.esOcultoDev ||
        account.id === 'tomiDev' ||
        data.email?.toLowerCase() === 'tomidev@dastik.com';

      const usuario: UsuarioDto = {
        id: data.usuarioId,
        nombre: data.nombre,
        email: data.email,
        rol: data.rol,
        debeCambiarPassword: data.debeCambiarPassword,
        esOcultoDev: esDev,
      };

      localStorage.setItem(TOKEN_SANDBOX_KEY, data.token);
      localStorage.setItem(USER_SANDBOX_KEY, JSON.stringify(usuario));

      queryClient.clear();

      set({
        token: data.token,
        usuario,
        isAuthenticated: true,
        debeCambiarPassword: data.debeCambiarPassword,
      });

      return true;
    } catch {
      // Fallback offline en sandbox si el backend no estuviese corriendo
      const fallbackUser: UsuarioDto = {
        id: account.id === 'tomiDev' ? 1 : account.id === 'franco' ? 2 : 3,
        nombre: account.nombre,
        email: account.email,
        rol: account.rol,
        debeCambiarPassword: false,
        esOcultoDev: account.esOcultoDev || account.id === 'tomiDev',
      };

      const fallbackToken = `mock-sandbox-jwt-${account.id}-${Date.now()}`;
      localStorage.setItem(TOKEN_SANDBOX_KEY, fallbackToken);
      localStorage.setItem(USER_SANDBOX_KEY, JSON.stringify(fallbackUser));

      queryClient.clear();

      set({
        token: fallbackToken,
        usuario: fallbackUser,
        isAuthenticated: true,
        debeCambiarPassword: false,
      });

      return true;
    }
  },

  logout: () => {
    const { isSandbox, tokenKey, userKey } = getActiveStorageKeys();

    localStorage.removeItem(tokenKey);
    localStorage.removeItem(userKey);

    if (!isSandbox) {
      localStorage.removeItem('dastik_auth_token');
      localStorage.removeItem('dastik_auth_user');
    }

    queryClient.clear();
    set({
      token: null,
      usuario: null,
      isAuthenticated: false,
      debeCambiarPassword: false,
    });
  },
}));
