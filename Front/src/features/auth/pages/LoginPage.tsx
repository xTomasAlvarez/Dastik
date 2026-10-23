import React from 'react';
import { TestTube } from '@phosphor-icons/react';
import { LoginForm } from '../components/LoginForm';
import { CambiarPasswordModal } from '../components/CambiarPasswordModal';
import { useAuthStore } from '../../../stores/useAuthStore';
import { useTenantStore } from '../../../stores/useTenantStore';

export const LoginPage: React.FC = () => {
  const { isSandboxMode, toggleSandboxMode } = useTenantStore();
  const debeCambiarPassword = useAuthStore((state) => state.debeCambiarPassword);

  return (
    <div className="h-screen w-screen overflow-hidden bg-canvas text-primary flex items-center justify-center p-6">
      {/* Contenedor Arquitectónico con tokens semánticos */}
      <div className="w-full max-w-[440px] border border-subtle bg-surface rounded-xl shadow-floating p-8 md:p-9">
        {/* Brand Header con DastikSinFondo.png a la derecha */}
        <div className="flex items-center justify-between border-b border-subtle pb-4 mb-5 gap-3">
          <div>
            <span className="text-[11px] font-semibold uppercase tracking-wider text-muted font-sans block">
              Acceso Operativo
            </span>
            <h1 className="text-lg sm:text-xl font-heading font-bold tracking-tight mt-0.5 text-primary">
              Dastik &amp; Hidden Sneakers
            </h1>
          </div>
          <img
            src="/DastikSinFondo.png"
            alt="Dastik"
            className="h-7 sm:h-8 w-auto object-contain select-none brightness-50 contrast-125 dark:brightness-110 dark:contrast-100 shrink-0"
          />
        </div>

        {/* Sandbox Mode Toggle Banner */}
        <div className="border border-subtle bg-elevated rounded-lg px-3.5 py-2.5 flex items-center justify-between mb-5">
          <div className="flex items-center gap-2.5">
            <TestTube size={18} weight="bold" className={isSandboxMode ? 'text-amber-500 dark:text-amber-400' : 'text-muted'} />
            <div>
              <span className="text-[10px] uppercase tracking-widest text-muted font-mono block">MODO BASE DE DATOS</span>
              <span className="font-heading text-xs font-bold tracking-wide text-primary">
                {isSandboxMode ? 'SANDBOX (ENTRENAMIENTO)' : 'PRODUCCIÓN (OFICIAL)'}
              </span>
            </div>
          </div>
          <button
            type="button"
            onClick={toggleSandboxMode}
            className="text-[11px] uppercase font-sans font-semibold tracking-wider border border-subtle rounded-md bg-surface px-2.5 py-1 text-primary hover:border-strong transition-colors cursor-pointer"
          >
            Alternar
          </button>
        </div>

        {/* Login Form */}
        <LoginForm />
      </div>

      {/* Modal de Cambio Obligatorio de Contraseña */}
      <CambiarPasswordModal isOpen={debeCambiarPassword} />
    </div>
  );
};
