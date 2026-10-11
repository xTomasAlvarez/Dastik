import React, { useState } from 'react';
import { ArrowRight, LockKey, WarningCircle, X } from '@phosphor-icons/react';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import { authApi } from '../api/authApi';
import { useAuthStore } from '../../../stores/useAuthStore';
import type { AxiosError } from 'axios';

interface LoginFormProps {
  onSuccess?: () => void;
}

export const LoginForm: React.FC<LoginFormProps> = ({ onSuccess }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const setAuth = useAuthStore((state) => state.setAuth);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!email.trim() || !password) {
      setErrorMessage('Por favor ingresa tanto el correo como la contraseña.');
      return;
    }

    setIsLoading(true);

    try {
      const response = await authApi.login({
        email: email.trim(),
        password,
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
    <form onSubmit={handleSubmit} className="flex flex-col gap-6 w-full text-left">
      {errorMessage && (
        <div className="border border-red-900 bg-red-950/40 p-3.5 text-red-200 text-xs font-sans flex items-start justify-between gap-3">
          <div className="flex items-start gap-2.5">
            <WarningCircle size={18} weight="light" className="shrink-0 text-red-400 mt-0.5" />
            <span className="leading-relaxed">{errorMessage}</span>
          </div>
          <button
            type="button"
            onClick={() => setErrorMessage(null)}
            className="text-red-400 hover:text-red-200 p-0.5 transition-fast cursor-pointer shrink-0 focus:outline-none"
            aria-label="Cerrar advertencia"
            title="Cerrar mensaje"
          >
            <X size={16} weight="light" />
          </button>
        </div>
      )}

      <div className="flex flex-col gap-4">
        <Input
          id="email"
          label="CORREO ELECTRÓNICO"
          type="email"
          placeholder="admin@dastik.com"
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

      <div className="pt-2">
        <Button
          type="submit"
          variant="primary"
          size="lg"
          className="w-full justify-between"
          disabled={isLoading}
        >
          <span className="flex items-center gap-2">
            <LockKey size={18} weight="light" />
            {isLoading ? 'VERIFICANDO CREDENCIALES...' : 'INGRESAR AL SISTEMA'}
          </span>
          <ArrowRight size={18} weight="light" />
        </Button>
      </div>
    </form>
  );
};
