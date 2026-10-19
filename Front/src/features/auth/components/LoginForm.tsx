import React, { useState } from 'react';
import { ArrowRight, LockKey, WarningCircle, X } from '@phosphor-icons/react';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import { authApi } from '../api/authApi';
import { useAuthStore } from '../../../stores/useAuthStore';
import { useTenantStore } from '../../../stores/useTenantStore';
import type { AxiosError } from 'axios';

interface LoginFormProps {
  onSuccess?: () => void;
  fillCredentials?: { email: string; password: string } | null;
}

export const LoginForm: React.FC<LoginFormProps> = ({ onSuccess, fillCredentials }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  React.useEffect(() => {
    if (fillCredentials) {
      setEmail(fillCredentials.email);
      setPassword(fillCredentials.password);
      setErrorMessage(null);
    }
  }, [fillCredentials]);

  const setAuth = useAuthStore((state) => state.setAuth);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!email.trim() || !password) {
      setErrorMessage('Por favor ingresa tanto el correo como la contraseña.');
      return;
    }

    const isSandboxMode = useTenantStore.getState().isSandboxMode;

    try {
      const response = await authApi.login({
        email: email.trim(),
        password,
        isSandboxMode,
      });

      setAuth(response);
      onSuccess?.();
    } catch (err) {
      const axiosError = err as AxiosError<{ detail?: string; title?: string }>;
      const msg =
        axiosError.response?.data?.detail ||
        axiosError.response?.data?.title ||
        'Credenciales inválidas o servicio no disponible.';
      setErrorMessage(msg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3.5 w-full text-left">
      {errorMessage && (
        <div className="border border-red-500/30 bg-red-500/10 rounded-lg p-2.5 text-red-600 dark:text-red-400 text-xs font-sans flex items-start justify-between gap-2.5">
          <div className="flex items-start gap-2">
            <WarningCircle size={16} weight="bold" className="shrink-0 mt-0.5" />
            <span className="leading-snug">{errorMessage}</span>
          </div>
          <button
            type="button"
            onClick={() => setErrorMessage(null)}
            className="hover:opacity-75 p-0.5 transition-opacity cursor-pointer shrink-0 focus:outline-none"
            aria-label="Cerrar advertencia"
            title="Cerrar mensaje"
          >
            <X size={15} weight="bold" />
          </button>
        </div>
      )}

      <div className="flex flex-col gap-3">
        <Input
          id="email"
          label="CORREO ELECTRÓNICO"
          type="email"
          placeholder="tomidev@dastik.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          disabled={isLoading}
          autoComplete="email"
          autoFocus
          required
        />

        <Input
          id="password"
          label="CONTRASEÑA"
          type="password"
          placeholder="••••••••••••"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          disabled={isLoading}
          autoComplete="current-password"
          required
        />
      </div>

      <div className="pt-1">
        <Button
          type="submit"
          variant="primary"
          size="md"
          className="w-full justify-between py-2.5"
          disabled={isLoading}
        >
          <span className="flex items-center gap-2">
            <LockKey size={17} weight="bold" />
            {isLoading ? 'VERIFICANDO CREDENCIALES...' : 'INGRESAR AL SISTEMA'}
          </span>
          <ArrowRight size={17} weight="bold" />
        </Button>
      </div>
    </form>
  );
};
