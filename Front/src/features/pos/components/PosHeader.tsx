import React from 'react';
import { Link } from 'react-router-dom';
import {
  Archive,
  ShieldCheck,
  SignOut,
  Storefront,
  TestTube,
  SlidersHorizontal,
  ArrowsLeftRight,
  Sun,
  Moon,
} from '@phosphor-icons/react';
import { Button } from '../../../components/ui/Button';
import { useAuthStore } from '../../../stores/useAuthStore';
import { useTenantStore } from '../../../stores/useTenantStore';
import { useThemeStore } from '../../../stores/useThemeStore';
import type { TurnoActivoDto } from '../api/cajaApi';

interface PosHeaderProps {
  turnoActivo?: TurnoActivoDto | null;
  onSolicitarCierreTurno?: () => void;
  onSolicitarCambio?: () => void;
}

export const PosHeader: React.FC<PosHeaderProps> = ({
  turnoActivo,
  onSolicitarCierreTurno,
  onSolicitarCambio,
}) => {
  const { usuario, logout } = useAuthStore();
  const { isSandboxMode, toggleSandboxMode } = useTenantStore();
  const { theme, toggleTheme } = useThemeStore();

  return (
    <header className="w-full bg-surface border-b border-subtle px-4 lg:px-5 py-2.5 flex flex-wrap lg:flex-nowrap items-center justify-between gap-3 shrink-0 z-20 shadow-surface">
      {/* Brand & Título de Terminal */}
      <div className="flex items-center gap-3 min-w-0">
        <div className="border border-subtle bg-elevated rounded-lg p-2 text-primary shrink-0 shadow-surface">
          <Storefront size={20} weight="duotone" className="text-amber-500" />
        </div>
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <h1 className="text-sm md:text-base font-heading font-extrabold tracking-tight text-primary truncate">
              DASTIK <span className="text-muted font-normal">//</span> HIDDEN SNEAKERS
            </h1>
            <span className="border border-subtle bg-elevated rounded-md px-1.5 py-0.5 text-[10px] font-mono font-semibold text-secondary shrink-0">
              POS v1.0
            </span>
          </div>
          <span className="text-[11px] text-muted font-sans hidden sm:block truncate">
            Terminal de Cobro & Control de Inventario
          </span>
        </div>
      </div>

      {/* Controles del Personal y Estado sin generar overflow horizontal */}
      <div className="flex items-center flex-wrap lg:flex-nowrap gap-2 shrink-0">
        {/* Indicador de Estado de Turno */}
        <div
          className={`px-2.5 py-1.5 rounded-lg flex items-center gap-2 text-xs font-sans border shrink-0 ${
            turnoActivo
              ? 'border-subtle bg-elevated text-primary'
              : 'border-amber-500/40 bg-amber-500/10 text-amber-600 dark:text-amber-300'
          }`}
        >
          <span
            className={`inline-block w-2 h-2 rounded-full ${
              turnoActivo ? 'bg-emerald-500' : 'bg-amber-500'
            }`}
          />
          <span className="text-[11px] font-medium text-muted">Caja:</span>
          <span className="text-xs font-semibold font-mono tabular-nums">
            {turnoActivo
              ? `${new Date(turnoActivo.fechaApertura).getHours() < 14 ? 'Mañana' : 'Tarde'} (#${turnoActivo.turnoId})`
              : 'Sin Turno'}
          </span>
        </div>

        {/* Botón de Cierre de Turno (Arqueo) si hay turno activo */}
        {turnoActivo && onSolicitarCierreTurno && (
          <Button
            variant="secondary"
            size="sm"
            onClick={onSolicitarCierreTurno}
            className="border-amber-500/40 hover:border-amber-500 text-amber-600 dark:text-amber-300"
            title="Realizar arqueo y cierre del turno actual"
          >
            <Archive size={15} weight="duotone" />
            <span>Cerrar Turno</span>
          </Button>
        )}

        {/* Botón de Cambio de Prenda */}
        {turnoActivo && onSolicitarCambio && (
          <Button
            variant="secondary"
            size="sm"
            onClick={onSolicitarCambio}
            className="hover:border-amber-500/60"
            title="Registrar cambio de prenda mano a mano o con diferencia"
          >
            <ArrowsLeftRight size={15} weight="bold" className="text-amber-500" />
            <span>Cambio</span>
          </Button>
        )}

        {/* Tenant Selector (Producción vs Sandbox) */}
        <div className="border border-subtle bg-elevated rounded-lg px-2.5 py-1.5 flex items-center gap-2 text-xs font-sans shrink-0">
          <TestTube
            size={15}
            weight="duotone"
            className={isSandboxMode ? 'text-amber-500' : 'text-muted'}
          />
          <span
            className={`text-xs font-semibold ${
              isSandboxMode ? 'text-amber-600 dark:text-amber-400' : 'text-primary'
            }`}
          >
            {isSandboxMode ? 'Sandbox' : 'Prod'}
          </span>
          <button
            type="button"
            onClick={toggleSandboxMode}
            className="text-[11px] font-medium border-l border-subtle pl-2 text-secondary hover:text-primary transition-fast cursor-pointer"
            title="Alternar entre base de pruebas y producción"
          >
            Cambiar
          </button>
        </div>

        {/* Toggle Dark / Light Mode Instantáneo */}
        <button
          type="button"
          onClick={toggleTheme}
          className="border border-subtle bg-elevated hover:bg-surface hover:border-strong text-primary rounded-lg px-2.5 py-1.5 flex items-center gap-1.5 text-xs font-semibold transition-fast cursor-pointer shrink-0 shadow-surface active:scale-[0.98]"
          title={
            theme === 'dark'
              ? 'Cambiar a modo claro (Light Mode)'
              : 'Cambiar a modo oscuro (Dark Mode)'
          }
          aria-label="Alternar tema claro u oscuro"
        >
          {theme === 'dark' ? (
            <>
              <Sun size={15} weight="duotone" className="text-amber-400" />
              <span className="hidden xl:inline">Claro</span>
            </>
          ) : (
            <>
              <Moon size={15} weight="duotone" className="text-indigo-600" />
              <span className="hidden xl:inline">Oscuro</span>
            </>
          )}
        </button>

        {/* Datos del Personal (Dueño / Empleado) */}
        <div className="border border-subtle bg-elevated rounded-lg px-2.5 py-1.5 hidden md:flex items-center gap-2 text-xs font-sans shrink-0">
          <ShieldCheck size={16} weight="duotone" className="text-emerald-500 shrink-0" />
          <span className="text-xs font-semibold text-primary">
            {usuario?.nombre}{' '}
            <span className="text-muted font-normal">
              ({usuario?.rol === 'Admin' ? 'Dueño' : 'Staff'})
            </span>
          </span>
        </div>

        {/* Acceso a Back-Office Admin (Visible únicamente para Dueño / Admin) */}
        {usuario?.rol === 'Admin' && (
          <Link
            to="/admin/inventario"
            className="border border-subtle bg-elevated hover:bg-surface hover:border-strong text-primary rounded-lg px-3 py-1.5 flex items-center gap-1.5 text-xs font-semibold transition-fast shrink-0 shadow-surface active:scale-[0.98]"
            title="Ir al panel de administración e inventario"
          >
            <SlidersHorizontal size={15} weight="duotone" className="text-amber-500" />
            <span>Admin</span>
          </Link>
        )}

        {/* Cierre de Sesión */}
        <Button
          variant="secondary"
          size="sm"
          onClick={logout}
          title="Cerrar sesión del operador"
        >
          <SignOut size={15} weight="regular" />
          <span className="hidden sm:inline">Salir</span>
        </Button>
      </div>
    </header>
  );
};
