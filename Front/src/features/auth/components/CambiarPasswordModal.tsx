import React, { useState } from 'react';
import {
  CheckCircle,
  Circle,
  Eye,
  EyeSlash,
  LockKey,
  ShieldCheck,
  WarningCircle,
  X,
  ArrowRight,
} from '@phosphor-icons/react';
import { Button } from '../../../components/ui/Button';
import { authApi } from '../api/authApi';
import { useAuthStore } from '../../../stores/useAuthStore';
import type { AxiosError } from 'axios';

interface CambiarPasswordModalProps {
  isOpen: boolean;
}

export const CambiarPasswordModal: React.FC<CambiarPasswordModalProps> = ({ isOpen }) => {
  const [passwordActual, setPasswordActual] = useState('Dastik2026!');
  const [passwordNuevo, setPasswordNuevo] = useState('');
  const [confirmarPassword, setConfirmarPassword] = useState('');

  const [showActual, setShowActual] = useState(false);
  const [showNuevo, setShowNuevo] = useState(false);
  const [showConfirmar, setShowConfirmar] = useState(false);

  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const setPasswordCambiado = useAuthStore((state) => state.setPasswordCambiado);
  const logout = useAuthStore((state) => state.logout);
  const usuario = useAuthStore((state) => state.usuario);

  if (!isOpen) return null;

  // Checklist de fortaleza de contraseña en tiempo real
  const tieneMinimo8 = passwordNuevo.length >= 8;
  const tieneMayuscula = /[A-Z]/.test(passwordNuevo);
  const tieneMinuscula = /[a-z]/.test(passwordNuevo);
  const tieneNumero = /[0-9]/.test(passwordNuevo);
  const tieneEspecial = /[!@#$%^&*._\-]/.test(passwordNuevo);
  const passwordsCoinciden = passwordNuevo === confirmarPassword && passwordNuevo.length > 0;
  const esDistintaAProvisoria =
    passwordNuevo.length > 0 &&
    passwordNuevo !== passwordActual &&
    passwordNuevo !== 'Dastik2026!';

  const esValido =
    tieneMinimo8 &&
    tieneMayuscula &&
    tieneMinuscula &&
    tieneNumero &&
    tieneEspecial &&
    passwordsCoinciden &&
    esDistintaAProvisoria;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!esValido) {
      setErrorMessage('La nueva contraseña no cumple con todas las reglas de seguridad requeridas.');
      return;
    }

    setIsLoading(true);

    try {
      const res = await authApi.cambiarPassword({
        passwordActual: passwordActual.trim(),
        passwordNuevo: passwordNuevo.trim(),
      });

      setSuccessMessage('¡Contraseña activada exitosamente! Ingresando a la terminal...');
      setTimeout(() => {
        setPasswordCambiado(res.token);
      }, 750);
    } catch (err) {
      const axiosError = err as AxiosError<{ detail?: string; title?: string; error?: string }>;
      const msg =
        axiosError.response?.data?.detail ||
        axiosError.response?.data?.error ||
        axiosError.response?.data?.title ||
        'Error al actualizar la contraseña. Verifica la contraseña actual.';
      setErrorMessage(msg);
    } finally {
      setIsLoading(false);
    }
  };

  const checklistItems = [
    { id: 'len', label: 'Al menos 8 caracteres', cumple: tieneMinimo8 },
    { id: 'mayus', label: 'Al menos una letra mayúscula (A-Z)', cumple: tieneMayuscula },
    { id: 'minus', label: 'Al menos una letra minúscula (a-z)', cumple: tieneMinuscula },
    { id: 'num', label: 'Al menos un número (0-9)', cumple: tieneNumero },
    { id: 'spec', label: 'Al menos un caracter especial (!@#$%^&*._-)', cumple: tieneEspecial },
    { id: 'match', label: 'Las contraseñas coinciden', cumple: passwordsCoinciden },
    { id: 'diff', label: 'Distinta a la provisoria (Dastik2026!)', cumple: esDistintaAProvisoria },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in duration-200">
      <div className="w-full max-w-lg border border-subtle bg-surface rounded-2xl shadow-floating p-6 sm:p-8 text-left max-h-[92vh] overflow-y-auto">
        {/* Cabecera de Activación */}
        <div className="flex items-start justify-between border-b border-subtle pb-4 mb-5">
          <div className="flex items-start gap-3">
            <div className="p-2.5 rounded-xl border border-primary/20 bg-primary/10 text-primary shrink-0 mt-0.5">
              <ShieldCheck size={26} weight="duotone" />
            </div>
            <div>
              <span className="text-[10px] uppercase tracking-[0.2em] text-muted font-mono block font-semibold">
                PRIMER INGRESO // SEGURIDAD REQUERIDA
              </span>
              <h2 className="text-lg sm:text-xl font-heading font-bold tracking-tight mt-0.5 text-primary">
                Activación de Cuenta
              </h2>
              {usuario && (
                <p className="text-xs text-secondary mt-0.5">
                  Hola <strong className="text-primary">{usuario.nombre}</strong> ({usuario.email})
                </p>
              )}
            </div>
          </div>
          <button
            type="button"
            onClick={logout}
            className="text-muted hover:text-primary border border-subtle hover:border-strong rounded-lg p-2 transition-colors cursor-pointer shrink-0"
            title="Cerrar sesión y volver al Login"
            aria-label="Cerrar sesión"
          >
            <X size={16} weight="bold" />
          </button>
        </div>

        <p className="text-xs font-sans text-secondary mb-5 leading-relaxed">
          Tu cuenta fue creada con una credencial temporal. Por política de seguridad del negocio, es obligatorio establecer una nueva contraseña personal antes de continuar.
        </p>

        {errorMessage && (
          <div className="border border-red-500/30 bg-red-500/10 rounded-xl p-3 text-red-600 dark:text-red-400 text-xs font-sans flex items-start justify-between gap-2.5 mb-5">
            <div className="flex items-start gap-2">
              <WarningCircle size={17} weight="bold" className="shrink-0 mt-0.5" />
              <span className="leading-snug">{errorMessage}</span>
            </div>
            <button
              type="button"
              onClick={() => setErrorMessage(null)}
              className="hover:opacity-75 p-0.5 transition-opacity cursor-pointer shrink-0"
              title="Cerrar error"
            >
              <X size={15} weight="bold" />
            </button>
          </div>
        )}

        {successMessage && (
          <div className="border border-emerald-500/30 bg-emerald-500/10 rounded-xl p-3 text-emerald-600 dark:text-emerald-400 text-xs font-sans flex items-start justify-between gap-2.5 mb-5">
            <div className="flex items-start gap-2">
              <CheckCircle size={17} weight="fill" className="shrink-0 mt-0.5 text-emerald-500" />
              <span className="leading-snug font-medium">{successMessage}</span>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {/* Contraseña Temporal Actual */}
          <div>
            <label className="text-[11px] font-mono uppercase text-muted tracking-wider block mb-1.5 font-semibold">
              CONTRASEÑA TEMPORAL ACTUAL
            </label>
            <div className="relative">
              <input
                id="passwordActual"
                type={showActual ? 'text' : 'password'}
                value={passwordActual}
                onChange={(e) => setPasswordActual(e.target.value)}
                disabled={isLoading}
                placeholder="Dastik2026!"
                required
                className="w-full bg-elevated border border-subtle focus:border-strong rounded-xl text-primary px-3.5 py-2.5 pr-10 text-xs font-mono tracking-wide placeholder:text-muted outline-none transition-colors"
              />
              <button
                type="button"
                onClick={() => setShowActual(!showActual)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-primary transition-colors cursor-pointer"
                title={showActual ? 'Ocultar' : 'Mostrar'}
              >
                {showActual ? <EyeSlash size={16} weight="bold" /> : <Eye size={16} weight="bold" />}
              </button>
            </div>
          </div>

          {/* Nueva Contraseña */}
          <div>
            <label className="text-[11px] font-mono uppercase text-muted tracking-wider block mb-1.5 font-semibold">
              NUEVA CONTRASEÑA DEFINITIVA
            </label>
            <div className="relative">
              <input
                id="passwordNuevo"
                type={showNuevo ? 'text' : 'password'}
                value={passwordNuevo}
                onChange={(e) => setPasswordNuevo(e.target.value)}
                disabled={isLoading}
                placeholder="Ingresa tu nueva clave personal"
                autoFocus
                required
                className="w-full bg-elevated border border-subtle focus:border-strong rounded-xl text-primary px-3.5 py-2.5 pr-10 text-xs font-mono tracking-wide placeholder:text-muted outline-none transition-colors"
              />
              <button
                type="button"
                onClick={() => setShowNuevo(!showNuevo)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-primary transition-colors cursor-pointer"
                title={showNuevo ? 'Ocultar' : 'Mostrar'}
              >
                {showNuevo ? <EyeSlash size={16} weight="bold" /> : <Eye size={16} weight="bold" />}
              </button>
            </div>
          </div>

          {/* Confirmar Nueva Contraseña */}
          <div>
            <label className="text-[11px] font-mono uppercase text-muted tracking-wider block mb-1.5 font-semibold">
              CONFIRMAR NUEVA CONTRASEÑA
            </label>
            <div className="relative">
              <input
                id="confirmarPassword"
                type={showConfirmar ? 'text' : 'password'}
                value={confirmarPassword}
                onChange={(e) => setConfirmarPassword(e.target.value)}
                disabled={isLoading}
                placeholder="Repite la nueva contraseña"
                required
                className="w-full bg-elevated border border-subtle focus:border-strong rounded-xl text-primary px-3.5 py-2.5 pr-10 text-xs font-mono tracking-wide placeholder:text-muted outline-none transition-colors"
              />
              <button
                type="button"
                onClick={() => setShowConfirmar(!showConfirmar)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-primary transition-colors cursor-pointer"
                title={showConfirmar ? 'Ocultar' : 'Mostrar'}
              >
                {showConfirmar ? <EyeSlash size={16} weight="bold" /> : <Eye size={16} weight="bold" />}
              </button>
            </div>
          </div>

          {/* Checklist Dinámico de Seguridad */}
          <div className="border border-subtle bg-elevated/70 rounded-xl p-3.5 text-xs font-sans space-y-1.5 my-1">
            <span className="text-[10px] uppercase tracking-widest text-muted block mb-2 font-mono font-semibold">
              REQUISITOS DE SEGURIDAD EN VIVO:
            </span>
            {checklistItems.map((item) => (
              <div
                key={item.id}
                className={`flex items-center gap-2 text-[11px] transition-colors ${
                  item.cumple
                    ? 'text-emerald-600 dark:text-emerald-400 font-medium'
                    : 'text-muted'
                }`}
              >
                {item.cumple ? (
                  <CheckCircle size={15} weight="fill" className="shrink-0 text-emerald-500" />
                ) : (
                  <Circle size={15} weight="regular" className="shrink-0 opacity-40" />
                )}
                <span>{item.label}</span>
              </div>
            ))}
          </div>

          {/* Botones de Acción */}
          <div className="pt-2 flex flex-col sm:flex-row gap-2.5">
            <Button
              type="submit"
              variant="primary"
              size="md"
              className="flex-1 justify-center py-2.5"
              disabled={isLoading || !esValido}
            >
              <span className="flex items-center gap-2 font-semibold">
                <LockKey size={16} weight="bold" />
                {isLoading ? 'ACTIVANDO SEGURIDAD...' : 'ACTIVAR CUENTA E INGRESAR'}
              </span>
              <ArrowRight size={16} weight="bold" />
            </Button>
            <Button
              type="button"
              variant="secondary"
              size="md"
              className="text-xs"
              onClick={logout}
              disabled={isLoading}
            >
              CERRAR SESIÓN
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
