import React from 'react';
import { Link } from 'react-router-dom';
import { Archive, ShieldCheck, SignOut, Storefront, TestTube, SlidersHorizontal } from '@phosphor-icons/react';
import { Button } from '../../../components/ui/Button';
import { useAuthStore } from '../../../stores/useAuthStore';
import { useTenantStore } from '../../../stores/useTenantStore';
import type { TurnoActivoDto } from '../api/cajaApi';

interface PosHeaderProps {
  turnoActivo?: TurnoActivoDto | null;
  onSolicitarCierreTurno?: () => void;
}

export const PosHeader: React.FC<PosHeaderProps> = ({ turnoActivo, onSolicitarCierreTurno }) => {
  const { usuario, logout } = useAuthStore();
  const { isSandboxMode, toggleSandboxMode } = useTenantStore();

  return (
    <header className="w-full bg-[#090909] border-b border-[#333333] px-4 lg:px-6 py-3 flex items-center justify-between gap-4 selection:bg-[#FAFAFA] selection:text-[#000000] overflow-x-auto">
      {/* Brand & Título de Terminal */}
      <div className="flex items-center gap-3 shrink-0">
        <div className="border border-[#333333] bg-[#111111] p-1.5 text-[#FAFAFA] shrink-0">
          <Storefront size={20} weight="light" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-base md:text-lg font-heading font-extrabold tracking-tight text-[#FAFAFA] whitespace-nowrap">
              DASTIK <span className="text-[#71717A] font-normal">//</span> HIDDEN SNEAKERS
            </h1>
            <span className="border border-[#222222] bg-[#111111] px-1.5 py-0.5 text-[10px] uppercase tracking-widest text-[#71717A] font-sans">
              POS V1.0
            </span>
          </div>
          <span className="text-[10px] uppercase tracking-[0.2em] text-[#71717A] font-sans block whitespace-nowrap">
            TERMINAL DE COBRO & CONTROL DE INVENTARIO
          </span>
        </div>
      </div>

      {/* Controles del Personal y Estado en una sola línea */}
      <div className="flex items-center gap-2 lg:gap-2.5 flex-nowrap shrink-0">
        {/* Indicador de Estado de Turno */}
        <div
          className={`px-2.5 py-1 flex items-center gap-2 text-xs font-sans border shrink-0 whitespace-nowrap ${
            turnoActivo
              ? 'border-[#222222] bg-[#111111]'
              : 'border-amber-900/60 bg-amber-950/20'
          }`}
        >
          <span
            className={`inline-block w-2 h-2 rounded-none ${
              turnoActivo ? 'bg-green-400' : 'bg-amber-400'
            }`}
          />
          <span className="text-[10px] uppercase tracking-widest text-[#71717A]">CAJA:</span>
          <span
            className={`text-xs font-semibold tracking-wider ${
              turnoActivo ? 'text-[#FAFAFA]' : 'text-amber-300'
            }`}
          >
            {turnoActivo
              ? `${new Date(turnoActivo.fechaApertura).getHours() < 14 ? 'TURNO MAÑANA' : 'TURNO TARDE'} (#${turnoActivo.turnoId})`
              : 'SIN TURNO'}
          </span>
        </div>

        {/* Botón de Cierre de Turno (Arqueo) si hay turno activo */}
        {turnoActivo && onSolicitarCierreTurno && (
          <Button
            variant="secondary"
            size="sm"
            onClick={onSolicitarCierreTurno}
            className="gap-1.5 text-[10px] tracking-wider py-1 px-2.5 border-amber-900/60 hover:border-amber-500 text-amber-300 hover:text-amber-200 shrink-0 whitespace-nowrap"
            title="Realizar arqueo y cierre del turno actual"
          >
            <Archive size={14} weight="light" />
            <span>CERRAR TURNO</span>
          </Button>
        )}

        {/* Tenant Selector (Producción vs Sandbox) */}
        <div className="border border-[#333333] bg-[#111111] px-2.5 py-1 flex items-center gap-2 text-xs font-sans shrink-0 whitespace-nowrap">
          <TestTube size={15} weight="light" className={isSandboxMode ? 'text-amber-400' : 'text-[#71717A]'} />
          <span className="text-[10px] uppercase tracking-widest text-[#71717A]">BASE:</span>
          <span className={`text-xs font-heading font-semibold tracking-wider ${isSandboxMode ? 'text-amber-400' : 'text-[#FAFAFA]'}`}>
            {isSandboxMode ? 'SANDBOX' : 'PRODUCCIÓN'}
          </span>
          <button
            type="button"
            onClick={toggleSandboxMode}
            className="text-[10px] uppercase font-sans tracking-widest border-l border-[#222222] pl-2 text-[#71717A] hover:text-[#FAFAFA] transition-fast cursor-pointer"
            title="Alternar entre base de pruebas y producción"
          >
            Cambiar
          </button>
        </div>

        {/* Datos del Personal (Dueño / Empleado) */}
        <div className="border border-[#333333] bg-[#111111] px-2.5 py-1 flex items-center gap-2 text-xs font-sans shrink-0 whitespace-nowrap">
          <ShieldCheck size={15} weight="light" className="text-green-400 shrink-0" />
          <span className="font-heading text-xs font-medium text-[#FAFAFA]">
            {usuario?.nombre}{' '}
            <span className="text-[#71717A]">
              ({usuario?.rol === 'Admin' ? 'Dueño' : 'Empleado'})
            </span>
          </span>
        </div>

        {/* Acceso a Back-Office Admin (Visible únicamente para Dueño / Admin) */}
        {usuario?.rol === 'Admin' && (
          <Link
            to="/admin/inventario"
            className="border border-[#333333] bg-[#111111] hover:bg-[#1A1A1A] hover:border-[#555555] text-[#FAFAFA] px-2.5 py-1 flex items-center gap-1.5 text-[10px] font-heading font-semibold uppercase tracking-wider transition-fast shrink-0 whitespace-nowrap"
            title="Ir al panel de administración e inventario"
          >
            <SlidersHorizontal size={14} weight="light" className="text-amber-400" />
            <span>ADMIN</span>
          </Link>
        )}

        {/* Cierre de Sesión */}
        <Button
          variant="secondary"
          size="sm"
          onClick={logout}
          className="gap-1.5 text-[10px] tracking-wider py-1 px-2.5 shrink-0 whitespace-nowrap"
          title="Cerrar sesión del operador"
        >
          <SignOut size={15} weight="light" />
          <span>SALIR</span>
        </Button>
      </div>
    </header>
  );
};
