import React from 'react';
import { ShieldCheck, SignOut, Storefront, TerminalWindow } from '@phosphor-icons/react';
import { Button } from '../../../components/ui/Button';
import { useAuthStore } from '../../../stores/useAuthStore';
import { useTenantStore } from '../../../stores/useTenantStore';

export const DashboardPos: React.FC = () => {
  const { usuario, logout } = useAuthStore();
  const { isSandboxMode, toggleSandboxMode } = useTenantStore();

  return (
    <div className="min-h-screen bg-[#000000] text-[#FAFAFA] flex flex-col p-6 md:p-10 selection:bg-[#FAFAFA] selection:text-[#000000]">
      {/* Header Arquitectónico 1px */}
      <header className="w-full border-b border-[#333333] pb-6 mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <span className="text-[10px] uppercase tracking-[0.3em] text-[#71717A] font-sans block">
            SISTEMA INTEGRADO DE PUNTO DE VENTA // SESIÓN ACTIVA
          </span>
          <h1 className="text-2xl md:text-3xl font-heading font-extrabold tracking-tight mt-1">
            DASTIK <span className="text-[#71717A] font-normal">//</span> HIDDEN SNEAKERS
          </h1>
        </div>

        {/* Controles de Operador */}
        <div className="flex flex-wrap items-center gap-4">
          {/* Tenant Selector */}
          <div className="border border-[#333333] bg-[#111111] px-3.5 py-1.5 flex items-center gap-2">
            <span className="text-[9px] uppercase tracking-widest text-[#71717A]">BASE:</span>
            <span className="font-heading font-semibold text-xs tracking-wider text-amber-400">
              {isSandboxMode ? 'SANDBOX' : 'PRODUCCIÓN'}
            </span>
            <button
              onClick={toggleSandboxMode}
              className="text-[9px] uppercase font-sans tracking-widest underline text-[#71717A] hover:text-[#FAFAFA] transition-fast ml-1 cursor-pointer"
            >
              Cambiar
            </button>
          </div>

          {/* User Badge */}
          <div className="border border-[#333333] bg-[#111111] px-3.5 py-1.5 flex items-center gap-2">
            <ShieldCheck size={16} weight="light" className="text-green-400" />
            <span className="font-heading text-xs font-semibold">
              {usuario?.nombre} <span className="text-[#71717A]">({usuario?.rol})</span>
            </span>
          </div>

          {/* Logout Button */}
          <Button variant="secondary" size="sm" onClick={logout} className="gap-2">
            <SignOut size={16} weight="light" />
            <span>CERRAR SESIÓN</span>
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex flex-col items-center justify-center">
        <div className="w-full max-w-3xl border border-[#333333] bg-[#090909] p-8 md:p-12 text-left">
          <div className="flex items-center gap-3 text-[#FAFAFA] font-heading font-bold text-lg mb-2">
            <Storefront size={24} weight="light" />
            <span>TERMINAL LISTA PARA OPERAR</span>
          </div>

          <p className="text-xs font-sans text-[#71717A] leading-relaxed mb-8">
            Has iniciado sesión exitosamente con credenciales validadas por el backend .NET 8.
            El token JWT activo contiene rol <strong className="text-[#FAFAFA]">{usuario?.rol}</strong> y claim de aislamiento{' '}
            <strong className="text-amber-400">{isSandboxMode ? 'IsSandboxMode=true' : 'IsSandboxMode=false'}</strong>.
          </p>

          {/* Grid de Módulos */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            <div className="border border-[#222222] bg-[#111111] p-5 flex flex-col justify-between">
              <div>
                <span className="text-[10px] uppercase tracking-widest text-[#71717A]">MÓDULO 01</span>
                <h3 className="font-heading text-base font-bold mt-1 text-[#FAFAFA]">CAJA & TURNOS</h3>
                <p className="text-[11px] font-sans text-[#71717A] mt-2">
                  Apertura de turno único, arqueo y control de efectivo.
                </p>
              </div>
              <Button variant="secondary" size="sm" className="mt-4 w-full">
                ABRIR TURNO
              </Button>
            </div>

            <div className="border border-[#222222] bg-[#111111] p-5 flex flex-col justify-between">
              <div>
                <span className="text-[10px] uppercase tracking-widest text-[#71717A]">MÓDULO 02</span>
                <h3 className="font-heading text-base font-bold mt-1 text-[#FAFAFA]">PUNTO DE VENTA</h3>
                <p className="text-[11px] font-sans text-[#71717A] mt-2">
                  Scanner EAN-13, cobro atómico ACID y Outbox para Tiendanube.
                </p>
              </div>
              <Button variant="primary" size="sm" className="mt-4 w-full">
                NUEVA VENTA
              </Button>
            </div>

            <div className="border border-[#222222] bg-[#111111] p-5 flex flex-col justify-between">
              <div>
                <span className="text-[10px] uppercase tracking-widest text-[#71717A]">MÓDULO 03</span>
                <h3 className="font-heading text-base font-bold mt-1 text-[#FAFAFA]">INVENTARIO</h3>
                <p className="text-[11px] font-sans text-[#71717A] mt-2">
                  Consulta de variantes por talle/color y stock físico.
                </p>
              </div>
              <Button variant="secondary" size="sm" className="mt-4 w-full">
                VER CATÁLOGO
              </Button>
            </div>
          </div>

          {/* Footer de Estado de Conexión */}
          <div className="border border-[#222222] bg-[#0E0E0E] p-4 flex items-center justify-between text-xs font-sans text-[#71717A]">
            <div className="flex items-center gap-2">
              <TerminalWindow size={16} weight="light" className="text-green-400" />
              <span>Conexión establecida con Backend .NET 8 (API Port 5185)</span>
            </div>
            <span className="font-mono text-[10px] text-[#555555]">BUILD V1.0-STABLE</span>
          </div>
        </div>
      </main>
    </div>
  );
};
