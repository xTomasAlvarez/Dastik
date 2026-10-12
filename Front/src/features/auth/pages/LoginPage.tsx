import React from 'react';
import { Storefront, TestTube } from '@phosphor-icons/react';
import { LoginForm } from '../components/LoginForm';
import { CambiarPasswordModal } from '../components/CambiarPasswordModal';
import { useAuthStore } from '../../../stores/useAuthStore';
import { useTenantStore } from '../../../stores/useTenantStore';

export const LoginPage: React.FC = () => {
  const { isSandboxMode, toggleSandboxMode } = useTenantStore();
  const debeCambiarPassword = useAuthStore((state) => state.debeCambiarPassword);

  const [fillCreds, setFillCreds] = React.useState<{ email: string; password: string } | null>(null);

  return (
    <div className="h-screen w-screen overflow-hidden bg-[#000000] text-[#FAFAFA] flex items-center justify-center p-6 selection:bg-[#FAFAFA] selection:text-[#000000]">
      {/* Contenedor Arquitectónico Flat Design: Perfectamente centrado con márgenes simétricos arriba y abajo */}
      <div className="w-full max-w-[440px] border border-[#333333] bg-[#090909] p-8 md:p-9">
        {/* Brand Header */}
        <div className="flex items-center justify-between border-b border-[#333333] pb-4 mb-5">
          <div>
            <span className="text-[10px] uppercase tracking-[0.25em] text-[#71717A] font-sans block">
              RETAIL POS & ERP // TERMINAL
            </span>
            <h1 className="text-2xl md:text-3xl font-heading font-extrabold tracking-tight mt-1">
              DASTIK <span className="text-[#71717A] font-normal">//</span> HIDDEN SNEAKERS
            </h1>
          </div>
          <Storefront size={26} weight="light" className="text-[#FAFAFA] shrink-0" />
        </div>

        {/* Sandbox Mode Toggle Banner */}
        <div className="border border-[#222222] bg-[#111111] px-3.5 py-2.5 flex items-center justify-between mb-5">
          <div className="flex items-center gap-2.5">
            <TestTube size={17} weight="light" className={isSandboxMode ? 'text-amber-400' : 'text-[#71717A]'} />
            <div>
              <span className="text-[8px] uppercase tracking-widest text-[#71717A] block">MODO BASE DE DATOS</span>
              <span className="font-heading text-xs font-semibold tracking-wider">
                {isSandboxMode ? 'SANDBOX (ENTRENAMIENTO)' : 'PRODUCCIÓN (OFICIAL)'}
              </span>
            </div>
          </div>
          <button
            type="button"
            onClick={toggleSandboxMode}
            className="text-[9px] uppercase font-sans tracking-wider border border-[#333333] px-2.5 py-1 text-[#FAFAFA] hover:bg-[#222222] transition-fast cursor-pointer"
          >
            Alternar
          </button>
        </div>

        {/* Login Form */}
        <LoginForm fillCredentials={fillCreds} />

        {/* Developer Sandbox Accounts Helper */}
        <div className="mt-6 pt-4 border-t border-[#1F1F1F] text-left">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[9px] uppercase tracking-widest text-[#555555] font-semibold">
              ACCESOS RÁPIDOS (CLIC PARA AUTOLLENAR):
            </span>
          </div>
          <div className="space-y-1.5 text-[10px] font-sans text-[#71717A]">
            <button
              type="button"
              onClick={() => setFillCreds({ email: 'tomidev@dastik.com', password: 'Dastik2026!' })}
              className="w-full text-left flex justify-between items-center border border-[#1A1A1A] hover:border-[#333333] bg-[#0D0D0D] hover:bg-[#141414] px-2.5 py-1.5 transition-fast cursor-pointer group"
              title="Autollenar credenciales de Admin tomiDev"
            >
              <div>
                <span className="text-[#FAFAFA] font-medium block">Admin tomiDev (Directo)</span>
                <code className="text-[#A1A1AA] text-[9.5px]">tomidev@dastik.com</code>
              </div>
              <span className="text-emerald-400 font-mono text-[9px] bg-emerald-950/40 border border-emerald-900/50 px-1.5 py-0.5">ADMIN</span>
            </button>

            <button
              type="button"
              onClick={() => setFillCreds({ email: 'admin@dastik.com', password: 'Dastik2026!' })}
              className="w-full text-left flex justify-between items-center border border-[#1A1A1A] hover:border-[#333333] bg-[#0D0D0D] hover:bg-[#141414] px-2.5 py-1.5 transition-fast cursor-pointer group"
              title="Autollenar credenciales de Admin Fundador"
            >
              <div>
                <span className="text-[#E4E4E7] block">Admin Fundador (Reseteo)</span>
                <code className="text-[#71717A] text-[9.5px]">admin@dastik.com</code>
              </div>
              <span className="text-[#71717A] font-mono text-[9px] border border-[#222222] px-1.5 py-0.5">RESETEO</span>
            </button>

            <button
              type="button"
              onClick={() => setFillCreds({ email: 'cajero.sandbox@dastik.com', password: 'Dastik2026!' })}
              className="w-full text-left flex justify-between items-center border border-[#1A1A1A] hover:border-[#333333] bg-[#0D0D0D] hover:bg-[#141414] px-2.5 py-1.5 transition-fast cursor-pointer group"
              title="Autollenar credenciales de Cajero Sandbox"
            >
              <div>
                <span className="text-[#E4E4E7] block">Cajero Sandbox (Directo)</span>
                <code className="text-[#71717A] text-[9.5px]">cajero.sandbox@dastik.com</code>
              </div>
              <span className="text-amber-400 font-mono text-[9px] bg-amber-950/40 border border-amber-900/50 px-1.5 py-0.5">CAJERO</span>
            </button>
          </div>
        </div>
      </div>

      {/* Modal de Cambio Obligatorio de Contraseña */}
      <CambiarPasswordModal isOpen={debeCambiarPassword} />
    </div>
  );
};
