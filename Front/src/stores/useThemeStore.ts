import { create } from 'zustand';

export type ThemeMode = 'dark' | 'light';

const THEME_STORAGE_KEY = 'dastik-theme';

interface ThemeState {
  theme: ThemeMode;
  toggleTheme: () => void;
  setTheme: (theme: ThemeMode) => void;
}

const getInitialTheme = (): ThemeMode => {
  if (typeof window === 'undefined') return 'dark';
  const saved = localStorage.getItem(THEME_STORAGE_KEY);
  if (saved === 'light' || saved === 'dark') {
    return saved;
  }
  return 'dark';
};

/**
 * Patrón Vercel / shadcn/ui para cambio de tema en 0ms sin lag:
 * Inyecta temporalmente <style>* { transition: none !important; }</style>,
 * aplica el cambio de clase .dark/.light, fuerza un reflow sincrónico y
 * remueve el bloqueo en el siguiente frame.
 */
const applyThemeToDom = (theme: ThemeMode, instant = false) => {
  if (typeof document === 'undefined') return;

  let styleEl: HTMLStyleElement | null = null;
  if (instant) {
    styleEl = document.createElement('style');
    styleEl.setAttribute('data-disable-transitions', 'true');
    styleEl.appendChild(
      document.createTextNode(
        '*, *::before, *::after { -webkit-transition: none !important; -moz-transition: none !important; -o-transition: none !important; -ms-transition: none !important; transition: none !important; }'
      )
    );
    document.head.appendChild(styleEl);
  }

  const root = document.documentElement;
  if (theme === 'dark') {
    root.classList.add('dark');
    root.classList.remove('light');
    root.setAttribute('data-theme', 'dark');
    root.style.colorScheme = 'dark';
  } else {
    root.classList.remove('dark');
    root.classList.add('light');
    root.setAttribute('data-theme', 'light');
    root.style.colorScheme = 'light';
  }

  if (instant && styleEl) {
    // Forzar reflow inmediato con transiciones desactivadas
    void window.getComputedStyle(document.body).opacity;
    requestAnimationFrame(() => {
      if (styleEl && document.head.contains(styleEl)) {
        document.head.removeChild(styleEl);
      }
    });
  }
};

export const useThemeStore = create<ThemeState>((set, get) => {
  const initialTheme = getInitialTheme();
  applyThemeToDom(initialTheme, false);

  return {
    theme: initialTheme,
    toggleTheme: () => {
      const next: ThemeMode = get().theme === 'dark' ? 'light' : 'dark';
      localStorage.setItem(THEME_STORAGE_KEY, next);
      applyThemeToDom(next, true);
      set({ theme: next });
    },
    setTheme: (theme) => {
      localStorage.setItem(THEME_STORAGE_KEY, theme);
      applyThemeToDom(theme, true);
      set({ theme });
    },
  };
});
