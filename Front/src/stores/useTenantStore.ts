import { create } from 'zustand';

interface TenantState {
  isSandboxMode: boolean;
  setSandboxMode: (isSandbox: boolean) => void;
  toggleSandboxMode: () => void;
}

const STORAGE_KEY = 'dastik_sandbox_mode';

export const useTenantStore = create<TenantState>((set) => ({
  isSandboxMode: localStorage.getItem(STORAGE_KEY) === 'true',

  setSandboxMode: (isSandbox: boolean) => {
    localStorage.setItem(STORAGE_KEY, isSandbox ? 'true' : 'false');
    set({ isSandboxMode: isSandbox });
  },

  toggleSandboxMode: () => {
    set((state) => {
      const next = !state.isSandboxMode;
      localStorage.setItem(STORAGE_KEY, next ? 'true' : 'false');
      return { isSandboxMode: next };
    });
  },
}));
