import React from 'react';
import { Storefront, TestTube } from '@phosphor-icons/react';
import { LoginForm } from '../components/LoginForm';
import { CambiarPasswordModal } from '../components/CambiarPasswordModal';
import { useAuthStore } from '../../../stores/useAuthStore';
import { useTenantStore } from '../../../stores/useTenantStore';

export const LoginPage: React.FC = () => {
  const { isSandboxMode, toggleSandboxMode } = useTenantStore();
  const debeCambiarPassword = useAuthStore((state) => state.debeCambiarPassword);

  return (
    <div className="min-h-screen bg-[#000000] text-[#FAFAFA] flex flex-col items-center justify-center p-6 selection:bg-[#FAFAFA] selection:text-[#000000]">
      {/* Contenedor Arquitectónico Flat Design */}
      <div className="w-full max-w-md border border-[#333333] bg-[#090909] p-8 md:p-10">
        {/* Brand Header */}
        <div className="flex items-center justify-between border-b border-[#333333] pb-6 mb-8">
          <div>
            <span className="text-[10px] uppercase tracking-[0.3em] text-[#71717A] font-sans block">
              RETAIL POS & ERP // TERMINAL
            </span>
            <h1 className="text-2xl md:text-3xl font-heading font-extrabold tracking-tight mt-1">
              DASTIK <span className="text-[#71717A] font-normal">//</span> HIDDEN SNEAKERS
            </h1>
          </div>
          <Storefront size={28} weight="light" className="text-[#FAFAFA] shrink-0" />
        </div>

        {/* Sandbox Mode Toggle Banner */}
        <div className="border border-[#222222] bg-[#111111] p-3.5 flex items-center justify-between mb-8">
          <div className="flex items-center gap-2.5">
            <TestTube size={18} weight="light" className={isSandboxMode ? 'text-amber-400' : 'text-[#71717A]'} />
            <div>
              <span className="text-[9px] uppercase tracking-widest text-[#71717A] block">MODO BASE DE DATOS</span>
              <span className="font-heading text-xs font-semibold tracking-wider">
                {isSandboxMode ? 'SANDBOX (ENTRENAMIENTO)' : 'PRODUCCIÓN (OFICIAL)'}
              </span>
            </div>
          </div>
          <button
            type="button"
            onClick={toggleSandboxMode}
            className="text-[10px] uppercase font-sans tracking-widest border border-[#333333] px-2.5 py-1 text-[#FAFAFA] hover:bg-[#222222] transition-fast cursor-pointer"
          >
            Alternar
          </button>
        </div>

        {/* Login Form */}
        <LoginForm />

        {/* Developer Sandbox Accounts Helper */}
        <div className="mt-8 pt-6 border-t border-[#222222] text-left">
          <span className="text-[10px] uppercase tracking-widest text-[#555555] block mb-2 font-semibold">
            ACCESOS DE PRUEBA RÁPIDA:
          </span>
          <div className="space-y-1.5 text-[11px] font-sans text-[#71717A]">
            <div className="flex justify-between border-b border-[#1A1A1A] pb-1">
              <span>Dueño (Reseteo Forzado):</span>
              <code className="text-[#FAFAFA]">admin@dastik.com</code>
            </div>
            <div className="flex justify-between border-b border-[#1A1A1A] pb-1">
              <span>Cajero Sandbox (Directo):</span>
              <code className="text-[#FAFAFA]">cajero.sandbox@dastik.com</code>
            </div>
            <div className="flex justify-between pt-0.5">
              <span>Clave genérica:</span>
              <code className="text-amber-400">Dastik2026!</code>
            </div>
          </div>
        </div>
      </div>

      {/* Footer minimalista */}
      <div className="mt-8 text-center text-[10px] tracking-[0.2em] text-[#444444] uppercase font-sans">
        AVANT-GARDE ARCHITECTURE // FLAT MONOCHROME SYSTEM
      </div>

      {/* Modal de Cambio Obligatorio de Contraseña */}
      <CambiarPasswordModal isOpen={debeCambiarPassword} />
    </div>
  );
};
