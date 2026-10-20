import React, { useState, useEffect } from 'react';
import { Key, ShieldCheck, UserCheck, WarningCircle, CheckCircle, X, LockKey } from '@phosphor-icons/react';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import { authApi } from '../api/authApi';
import type { AxiosError } from 'axios';

interface ModalRecuperarPasswordProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ModalRecuperarPassword: React.FC<ModalRecuperarPasswordProps> = ({
  isOpen,
  onClose,
}) => {
  const [activeTab, setActiveTab] = useState<'admin' | 'empleado'>('admin');
  const [identificador, setIdentificador] = useState('');
  const [claveMaestra, setClaveMaestra] = useState('');
  const [nuevaPassword, setNuevaPassword] = useState('');
  const [confirmarPassword, setConfirmarPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [exitoMensaje, setExitoMensaje] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) {
      setIdentificador('');
      setClaveMaestra('');
      setNuevaPassword('');
      setConfirmarPassword('');
      setErrorMessage(null);
      setExitoMensaje(null);
      setActiveTab('admin');
    }
  }, [isOpen]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleSubmitAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setExitoMensaje(null);

    if (!identificador.trim()) {
      setErrorMessage('Ingresá tu usuario o correo electrónico.');
      return;
    }

    if (!claveMaestra.trim()) {
      setErrorMessage('Ingresá la Llave Maestra de seguridad del local.');
      return;
    }

    if (nuevaPassword.length < 6) {
      setErrorMessage('La nueva contraseña debe tener al menos 6 caracteres.');
      return;
    }

    if (nuevaPassword !== confirmarPassword) {
      setErrorMessage('Las contraseñas no coinciden.');
      return;
    }

    setIsLoading(true);
    try {
      const resp = await authApi.recuperarPassword({
        identificador: identificador.trim(),
        claveMaestra: claveMaestra.trim(),
        nuevaPassword,
      });

      setExitoMensaje(resp.mensaje || 'Contraseña restablecida con éxito. Ya podés iniciar sesión.');
    } catch (err) {
      const axiosError = err as AxiosError<{ error?: string; detail?: string }>;
      const msg =
        axiosError.response?.data?.error ||
        axiosError.response?.data?.detail ||
        'No se pudo restablecer la contraseña. Verificá los datos ingresados.';
      setErrorMessage(msg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="rounded-xl border border-subtle bg-surface w-full max-w-md p-6 space-y-5 shadow-floating">
        {/* Cabecera */}
        <div className="flex items-center justify-between pb-3 border-b border-subtle">
          <div className="flex items-center gap-2.5">
            <div className="rounded-lg border border-subtle bg-elevated p-2 text-amber-500">
              <Key size={18} weight="duotone" />
            </div>
            <div>
              <span className="text-[11px] font-medium text-muted block uppercase tracking-wider font-mono">
                Seguridad de Cuentas
              </span>
              <h2 className="font-heading font-bold text-lg text-primary">
                Recuperación de Contraseña
              </h2>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-muted hover:text-primary transition-fast p-1 rounded-md cursor-pointer"
            title="Cerrar modal [ESC]"
          >
            <X size={18} />
          </button>
        </div>

        {/* Pestañas de Selección de Perfil */}
        <div className="flex rounded-lg border border-subtle bg-elevated/60 p-1 gap-1">
          <button
            type="button"
            onClick={() => {
              setActiveTab('admin');
              setErrorMessage(null);
            }}
            className={`flex-1 py-1.5 px-3 rounded-md text-xs font-semibold transition-fast cursor-pointer flex items-center justify-center gap-1.5 ${
              activeTab === 'admin'
                ? 'bg-surface text-primary shadow-xs border border-subtle'
                : 'text-secondary hover:text-primary'
            }`}
          >
            <ShieldCheck size={14} weight="duotone" className="text-amber-500" />
            <span>Soy Dueño / Admin</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setActiveTab('empleado');
              setErrorMessage(null);
            }}
            className={`flex-1 py-1.5 px-3 rounded-md text-xs font-semibold transition-fast cursor-pointer flex items-center justify-center gap-1.5 ${
              activeTab === 'empleado'
                ? 'bg-surface text-primary shadow-xs border border-subtle'
                : 'text-secondary hover:text-primary'
            }`}
          >
            <UserCheck size={14} weight="duotone" className="text-sky-500" />
            <span>Soy Empleado / Cajero</span>
          </button>
        </div>

        {/* Mensajes de Alerta */}
        {errorMessage && (
          <div className="border border-red-500/30 bg-red-500/10 rounded-lg p-3 text-red-600 dark:text-red-400 text-xs font-sans flex items-start gap-2.5">
            <WarningCircle size={16} weight="bold" className="shrink-0 mt-0.5" />
            <span className="leading-snug">{errorMessage}</span>
          </div>
        )}

        {exitoMensaje && (
          <div className="border border-emerald-500/30 bg-emerald-500/10 rounded-lg p-3 text-emerald-700 dark:text-emerald-300 text-xs font-sans flex items-start gap-2.5">
            <CheckCircle size={16} weight="bold" className="shrink-0 mt-0.5" />
            <div className="space-y-1">
              <span className="font-bold block">¡Éxito!</span>
              <span className="leading-snug block">{exitoMensaje}</span>
            </div>
          </div>
        )}

        {/* Pestaña Dueño / Admin */}
        {activeTab === 'admin' && (
          <div className="space-y-4">
            {!exitoMensaje ? (
              <form onSubmit={handleSubmitAdmin} className="space-y-3.5">
                <p className="text-xs text-secondary leading-relaxed">
                  Para restablecer tu contraseña como administrador, ingresá tu usuario y la <strong>Llave Maestra</strong> física configurada para el local.
                </p>

                <Input
                  id="recuperar-identificador"
                  label="USUARIO O CORREO ELECTRÓNICO"
                  type="text"
                  placeholder="tomidev@dastik.com"
                  value={identificador}
                  onChange={(e) => setIdentificador(e.target.value)}
                  disabled={isLoading}
                  required
                />

                <Input
                  id="recuperar-clave-maestra"
                  label="LLAVE MAESTRA DEL LOCAL"
                  type="password"
                  placeholder="••••••••••••"
                  value={claveMaestra}
                  onChange={(e) => setClaveMaestra(e.target.value)}
                  disabled={isLoading}
                  required
                />

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <Input
                    id="recuperar-nueva-password"
                    label="NUEVA CONTRASEÑA"
                    type="password"
                    placeholder="Mínimo 6 carácteres"
                    value={nuevaPassword}
                    onChange={(e) => setNuevaPassword(e.target.value)}
                    disabled={isLoading}
                    required
                  />

                  <Input
                    id="recuperar-confirmar-password"
                    label="CONFIRMAR"
                    type="password"
                    placeholder="Repetir contraseña"
                    value={confirmarPassword}
                    onChange={(e) => setConfirmarPassword(e.target.value)}
                    disabled={isLoading}
                    required
                  />
                </div>

                <div className="pt-2 flex items-center justify-end gap-2.5">
                  <Button type="button" variant="secondary" onClick={onClose} disabled={isLoading}>
                    Cancelar
                  </Button>
                  <Button type="submit" variant="primary" disabled={isLoading}>
                    <LockKey size={16} weight="bold" />
                    <span>{isLoading ? 'Verificando...' : 'Restablecer Clave'}</span>
                  </Button>
                </div>
              </form>
            ) : (
              <div className="pt-2 flex justify-end">
                <Button type="button" variant="primary" onClick={onClose}>
                  Ir a Iniciar Sesión
                </Button>
              </div>
            )}
          </div>
        )}

        {/* Pestaña Empleado / Cajero */}
        {activeTab === 'empleado' && (
          <div className="space-y-4 text-xs font-sans text-secondary">
            <div className="rounded-xl border border-subtle bg-elevated/60 p-4 space-y-3">
              <div className="flex items-center gap-2 text-primary font-bold text-sm">
                <LockKey size={16} weight="bold" className="text-amber-500" />
                <span>Seguridad de Caja y Auditoría</span>
              </div>
              <p className="leading-relaxed">
                Por políticas de control financiero y arqueo de turnos, las cuentas de cajeros y empleados <strong>no pueden recuperarse mediante llave maestra</strong>.
              </p>
              <div className="border-t border-subtle pt-2.5 space-y-2">
                <span className="font-semibold text-primary block">¿Cómo restablecer tu clave?</span>
                <ol className="list-decimal list-inside space-y-1.5 text-muted">
                  <li>Avisale al dueño o encargado del local.</li>
                  <li>El dueño ingresa al panel <strong>Admin → Gestión de Empleados</strong>.</li>
                  <li>Hace clic en el ícono de llave <strong>"Cambiar Clave"</strong> en tu usuario y te asignará una nueva contraseña en segundos.</li>
                </ol>
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <Button type="button" variant="secondary" onClick={onClose}>
                Entendido, volver al Login
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
