import React from 'react';
import { ShieldCheck, SignOut, Storefront, TestTube } from '@phosphor-icons/react';
import { Button } from '../../../components/ui/Button';
import { useAuthStore } from '../../../stores/useAuthStore';
import { useTenantStore } from '../../../stores/useTenantStore';

export const PosHeader: React.FC = () => {
  const { usuario, logout } = useAuthStore();
  const { isSandboxMode, toggleSandboxMode } = useTenantStore();

  return (
    <header className="w-full bg-[#090909] border-b border-[#333333] px-6 py-4 flex flex-col md:flex-row md:items-center justify-between gap-4 selection:bg-[#FAFAFA] selection:text-[#000000]">
      {/* Brand & Título de Terminal */}
      <div className="flex items-center gap-3">
        <div className="border border-[#333333] bg-[#111111] p-2 text-[#FAFAFA] shrink-0">
          <Storefront size={22} weight="light" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-lg md:text-xl font-heading font-extrabold tracking-tight text-[#FAFAFA]">
              DASTIK <span className="text-[#71717A] font-normal">//</span> HIDDEN SNEAKERS
            </h1>
            <span className="border border-[#222222] bg-[#111111] px-2 py-0.5 text-[9px] uppercase tracking-widest text-[#71717A] font-sans">
              POS V1.0
            </span>
          </div>
          <span className="text-[10px] uppercase tracking-[0.25em] text-[#71717A] font-sans block">
            TERMINAL DE COBRO & CONTROL DE INVENTARIO
          </span>
        </div>
      </div>

      {/* Controles del Operador y Estado */}
      <div className="flex flex-wrap items-center gap-3">
        {/* Indicador de Estado de Turno */}
        <div className="border border-[#222222] bg-[#111111] px-3 py-1.5 flex items-center gap-2 text-xs font-sans">
          <span className="inline-block w-2 h-2 rounded-none bg-green-400 animate-pulse"></span>
          <span className="text-[10px] uppercase tracking-widest text-[#71717A]">CAJA:</span>
          <span className="text-xs font-semibold tracking-wider text-[#FAFAFA]">OPERANDO</span>
        </div>

        {/* Tenant Selector (Producción vs Sandbox) */}
        <div className="border border-[#333333] bg-[#111111] px-3 py-1.5 flex items-center gap-2 text-xs font-sans">
          <TestTube size={16} weight="light" className={isSandboxMode ? 'text-amber-400' : 'text-[#71717A]'} />
          <span className="text-[10px] uppercase tracking-widest text-[#71717A]">BASE:</span>
          <span className={`text-xs font-heading font-semibold tracking-wider ${isSandboxMode ? 'text-amber-400' : 'text-[#FAFAFA]'}`}>
            {isSandboxMode ? 'SANDBOX' : 'PRODUCCIÓN'}
          </span>
          <button
            type="button"
            onClick={toggleSandboxMode}
            className="text-[9px] uppercase font-sans tracking-widest border-l border-[#222222] pl-2 text-[#71717A] hover:text-[#FAFAFA] transition-fast cursor-pointer"
            title="Alternar entre base de pruebas y producción"
          >
            Cambiar
          </button>
        </div>

        {/* Datos del Operador */}
        <div className="border border-[#333333] bg-[#111111] px-3 py-1.5 flex items-center gap-2 text-xs font-sans">
          <ShieldCheck size={16} weight="light" className="text-green-400 shrink-0" />
          <span className="font-heading text-xs font-medium text-[#FAFAFA]">
            {usuario?.nombre} <span className="text-[#71717A]">({usuario?.rol})</span>
          </span>
        </div>

        {/* Cierre de Sesión */}
        <Button
          variant="secondary"
          size="sm"
          onClick={logout}
          className="gap-2 text-[10px] tracking-wider py-1.5"
          title="Cerrar sesión del operador"
        >
          <SignOut size={16} weight="light" />
          <span>SALIR</span>
        </Button>
      </div>
    </header>
  );
};
