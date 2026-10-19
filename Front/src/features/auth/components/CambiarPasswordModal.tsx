import React, { useState } from 'react';
import { CheckCircle, Key, WarningCircle, X } from '@phosphor-icons/react';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import { authApi } from '../api/authApi';
import { useAuthStore } from '../../../stores/useAuthStore';
import type { AxiosError } from 'axios';

interface CambiarPasswordModalProps {
  isOpen: boolean;
}

export const CambiarPasswordModal: React.FC<CambiarPasswordModalProps> = ({ isOpen }) => {
  const [passwordActual, setPasswordActual] = useState('');
  const [passwordNuevo, setPasswordNuevo] = useState('');
  const [confirmarPassword, setConfirmarPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const setPasswordCambiado = useAuthStore((state) => state.setPasswordCambiado);
  const logout = useAuthStore((state) => state.logout);

  if (!isOpen) return null;

  // Validación de requisitos de fortaleza de contraseña
  const tieneMinimo8 = passwordNuevo.length >= 8;
  const tieneMayuscula = /[A-Z]/.test(passwordNuevo);
  const tieneNumero = /[0-9]/.test(passwordNuevo);
  const passwordsCoinciden = passwordNuevo === confirmarPassword && passwordNuevo.length > 0;
  const esValido = tieneMinimo8 && tieneMayuscula && tieneNumero && passwordsCoinciden;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!esValido) {
      setErrorMessage('La nueva contraseña no cumple con los requisitos de seguridad requeridos.');
      return;
    }

    setIsLoading(true);

    try {
      await authApi.cambiarPassword({
        passwordActual,
        passwordNuevo,
      });

      setSuccessMessage('Contraseña actualizada correctamente. Desbloqueando sesión...');
      setTimeout(() => {
        setPasswordCambiado();
      }, 1000);
    } catch (err) {
      const axiosError = err as AxiosError<{ detail?: string; title?: string }>;
      const msg =
        axiosError.response?.data?.detail ||
        axiosError.response?.data?.title ||
        'Error al actualizar la contraseña. Verifica la contraseña actual.';
      setErrorMessage(msg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4">
      {/* Ventana Modal con tokens semánticos */}
      <div className="w-full max-w-lg border border-subtle bg-surface rounded-xl shadow-floating p-8 md:p-10 text-left">
        {/* Header con botón de Cancelar/Salir */}
        <div className="flex items-start justify-between border-b border-subtle pb-4 mb-6">
          <div className="flex items-start gap-3">
            <Key size={26} weight="duotone" className="text-primary shrink-0 mt-0.5" />
            <div>
              <span className="text-[10px] uppercase tracking-[0.2em] text-muted font-mono">
                SEGURIDAD OBLIGATORIA // CUENTA INICIAL
              </span>
              <h2 className="text-xl md:text-2xl font-heading font-bold tracking-tight mt-1 text-primary">
                RESETEO DE CONTRASEÑA
              </h2>
            </div>
          </div>
          <button
            type="button"
            onClick={logout}
            className="text-secondary hover:text-primary border border-subtle hover:border-strong rounded-lg px-2.5 py-1.5 transition-colors cursor-pointer flex items-center gap-1.5 text-[10px] uppercase tracking-wider font-sans shrink-0 ml-3"
            title="Cerrar sesión y volver al Login"
          >
            <span>CANCELAR</span>
            <X size={14} weight="bold" />
          </button>
        </div>

        <p className="text-xs font-sans text-secondary mb-6 leading-relaxed">
          Tu cuenta fue creada con una credencial temporal. Por política de ciberseguridad corporativa, es obligatorio
          establecer una contraseña personal y segura antes de operar la terminal POS.
        </p>

        {errorMessage && (
          <div className="border border-red-500/30 bg-red-500/10 rounded-lg p-3.5 text-red-600 dark:text-red-400 text-xs font-sans flex items-start justify-between gap-3 mb-6">
            <div className="flex items-start gap-2.5">
              <WarningCircle size={18} weight="bold" className="shrink-0 mt-0.5" />
              <span className="leading-snug">{errorMessage}</span>
            </div>
            <button
              type="button"
              onClick={() => setErrorMessage(null)}
              className="hover:opacity-75 p-0.5 transition-opacity cursor-pointer shrink-0 focus:outline-none"
              aria-label="Cerrar error"
              title="Cerrar mensaje"
            >
              <X size={16} weight="bold" />
            </button>
          </div>
        )}

        {successMessage && (
          <div className="border border-emerald-500/30 bg-emerald-500/10 rounded-lg p-3.5 text-emerald-600 dark:text-emerald-400 text-xs font-sans flex items-start justify-between gap-3 mb-6">
            <div className="flex items-start gap-2.5">
              <CheckCircle size={18} weight="bold" className="shrink-0 mt-0.5" />
              <span className="leading-snug">{successMessage}</span>
            </div>
            <button
              type="button"
              onClick={() => setSuccessMessage(null)}
              className="hover:opacity-75 p-0.5 transition-opacity cursor-pointer shrink-0 focus:outline-none"
              aria-label="Cerrar mensaje"
              title="Cerrar mensaje"
            >
              <X size={16} weight="bold" />
            </button>
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          <Input
            id="passwordActual"
            label="CONTRASEÑA TEMPORAL ACTUAL"
            type="password"
            placeholder="Dastik2026!"
            value={passwordActual}
            onChange={(e) => setPasswordActual(e.target.value)}
            disabled={isLoading}
            required
            autoFocus
          />

          <Input
            id="passwordNuevo"
            label="NUEVA CONTRASEÑA"
            type="password"
            placeholder="Mínimo 8 caracteres, 1 mayúscula, 1 número"
            value={passwordNuevo}
            onChange={(e) => setPasswordNuevo(e.target.value)}
            disabled={isLoading}
            required
          />

          <Input
            id="confirmarPassword"
            label="CONFIRMAR NUEVA CONTRASEÑA"
            type="password"
            placeholder="Repite la nueva contraseña"
            value={confirmarPassword}
            onChange={(e) => setConfirmarPassword(e.target.value)}
            disabled={isLoading}
            required
          />

          {/* Checklist de Requisitos en Tiempo Real */}
          <div className="border border-subtle bg-elevated rounded-lg p-4 text-[11px] font-sans space-y-1.5 my-1">
            <span className="text-[10px] uppercase tracking-widest text-muted block mb-2 font-semibold">
              REGLAS DE COMPLEJIDAD:
            </span>
            <div className={`flex items-center gap-2 ${tieneMinimo8 ? 'text-emerald-600 dark:text-emerald-400 font-medium' : 'text-muted'}`}>
              <span>•</span>
              <span>Mínimo 8 caracteres</span>
            </div>
            <div className={`flex items-center gap-2 ${tieneMayuscula ? 'text-emerald-600 dark:text-emerald-400 font-medium' : 'text-muted'}`}>
              <span>•</span>
              <span>Al menos una letra mayúscula</span>
            </div>
            <div className={`flex items-center gap-2 ${tieneNumero ? 'text-emerald-600 dark:text-emerald-400 font-medium' : 'text-muted'}`}>
              <span>•</span>
              <span>Al menos un número</span>
            </div>
            <div className={`flex items-center gap-2 ${passwordsCoinciden ? 'text-emerald-600 dark:text-emerald-400 font-medium' : 'text-muted'}`}>
              <span>•</span>
              <span>Las contraseñas coinciden</span>
            </div>
          </div>

          <div className="pt-2 flex flex-col gap-2">
            <Button
              type="submit"
              variant="primary"
              size="lg"
              className="w-full"
              disabled={isLoading || !esValido}
            >
              {isLoading ? 'ACTUALIZANDO SEGURIDAD...' : 'DESBLOQUEAR Y GUARDAR'}
            </Button>
            <Button
              type="button"
              variant="secondary"
              size="md"
              className="w-full text-xs"
              onClick={logout}
              disabled={isLoading}
            >
              CANCELAR Y CERRAR SESIÓN
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
