import React, { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Archive,
  ShieldCheck,
  SignOut,
  TestTube,
  SlidersHorizontal,
  ArrowsLeftRight,
  Sun,
  Moon,
  List,
  X,
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

  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuContainerRef = useRef<HTMLDivElement>(null);

  // Cerrar el menú hamburguesa al hacer clic fuera o presionar Escape
  useEffect(() => {
    if (!isMenuOpen) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (
        menuContainerRef.current &&
        !menuContainerRef.current.contains(event.target as Node)
      ) {
        setIsMenuOpen(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isMenuOpen]);

  return (
    <header className="w-full bg-surface border-b border-subtle px-4 lg:px-5 py-2.5 flex items-center justify-between gap-3 shrink-0 z-30 shadow-surface">
      {/* Brand con Logo Oficial Dastik & Título de Terminal */}
      <div className="flex items-center gap-3 min-w-0">
        <div className="border border-subtle bg-black rounded-lg px-2.5 py-1.5 flex items-center justify-center shrink-0 shadow-surface">
          <img
            src="/dastik-logo.png"
            alt="Dastik"
            className="h-5 sm:h-6 w-auto object-contain select-none"
          />
        </div>
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <h1 className="text-sm md:text-base font-heading font-extrabold tracking-tight text-primary truncate">
              DASTIK <span className="text-muted font-normal">//</span> HIDDEN SNEAKERS
            </h1>
            <span className="border border-subtle bg-elevated rounded-md px-1.5 py-0.5 text-[10px] font-mono font-semibold text-secondary shrink-0">
              POS v1.0
            </span>
            {isSandboxMode && (
              <span className="hidden md:inline-flex items-center gap-1 border border-amber-500/40 bg-amber-500/10 text-amber-600 dark:text-amber-400 rounded-md px-1.5 py-0.5 text-[10px] font-mono font-bold shrink-0">
                <TestTube size={11} weight="fill" />
                SANDBOX
              </span>
            )}
          </div>
          <span className="text-[11px] text-muted font-sans hidden sm:block truncate">
            Terminal de Cobro &amp; Control de Inventario
          </span>
        </div>
      </div>

      {/* Controles Operativos Inmediatos de Caja + Menú Hamburguesa */}
      <div className="flex items-center gap-2 shrink-0">
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
          <span className="text-[11px] font-medium text-muted hidden sm:inline">Caja:</span>
          <span className="text-xs font-semibold font-mono tabular-nums">
            {turnoActivo
              ? `${new Date(turnoActivo.fechaApertura).getHours() < 14 ? 'Mañana' : 'Tarde'} (#${turnoActivo.turnoId})`
              : 'Sin Turno'}
          </span>
        </div>

        {/* Botón de Cambio de Prenda (acción rápida del cajero) */}
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
            <span className="hidden sm:inline">Cerrar Turno</span>
          </Button>
        )}

        {/* Menú Hamburguesa de Sistema y Cuenta */}
        <div className="relative" ref={menuContainerRef}>
          <button
            type="button"
            onClick={() => setIsMenuOpen((prev) => !prev)}
            className={`border rounded-lg p-2 flex items-center justify-center gap-1.5 text-xs font-semibold transition-fast cursor-pointer shadow-surface active:scale-[0.97] ${
              isMenuOpen
                ? 'border-strong bg-elevated text-primary'
                : 'border-subtle bg-elevated hover:bg-surface hover:border-strong text-primary'
            }`}
            aria-expanded={isMenuOpen}
            aria-haspopup="menu"
            aria-label="Abrir menú de opciones del sistema"
            title="Opciones de cuenta, tema, base de datos y panel admin"
          >
            {isMenuOpen ? (
              <X size={18} weight="bold" />
            ) : (
              <List size={18} weight="bold" />
            )}
          </button>

          {isMenuOpen && (
            <div
              role="menu"
              className="absolute right-0 mt-2 w-72 rounded-xl border border-subtle bg-surface/95 backdrop-blur-md shadow-floating p-2 z-50 space-y-1 animate-in fade-in zoom-in-95 duration-150"
            >
              {/* 1. Información de la Cuenta */}
              <div className="px-3 py-2.5 rounded-lg bg-elevated/70 border border-subtle flex items-center justify-between gap-2">
                <div className="flex items-center gap-2.5 min-w-0">
                  <ShieldCheck
                    size={18}
                    weight="duotone"
                    className="text-emerald-500 shrink-0"
                  />
                  <div className="min-w-0">
                    <div className="text-xs font-bold text-primary truncate">
                      {usuario?.nombre || 'Operador'}
                    </div>
                    <div className="text-[11px] text-muted truncate">
                      {usuario?.email || 'Sesión activa'}
                    </div>
                  </div>
                </div>
                <span className="text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded-md border border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 shrink-0">
                  {usuario?.rol === 'Admin' ? 'Dueño' : 'Staff'}
                </span>
              </div>

              <div className="border-t border-subtle my-1" />

              {/* 2. Alternar Producción / Sandbox */}
              <button
                type="button"
                role="menuitem"
                onClick={() => {
                  toggleSandboxMode();
                  setIsMenuOpen(false);
                }}
                className="w-full px-3 py-2 rounded-lg hover:bg-elevated flex items-center justify-between text-xs font-sans transition-fast cursor-pointer text-left"
              >
                <div className="flex items-center gap-2.5">
                  <TestTube
                    size={16}
                    weight="duotone"
                    className={isSandboxMode ? 'text-amber-500' : 'text-secondary'}
                  />
                  <div>
                    <span className="font-semibold text-primary block">
                      Entorno de Base de Datos
                    </span>
                    <span className="text-[11px] text-muted">
                      Actual: {isSandboxMode ? 'Sandbox (Pruebas)' : 'Producción (Oficial)'}
                    </span>
                  </div>
                </div>
                <span
                  className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-md border ${
                    isSandboxMode
                      ? 'border-amber-500/40 bg-amber-500/10 text-amber-600 dark:text-amber-400'
                      : 'border-subtle bg-elevated text-secondary'
                  }`}
                >
                  {isSandboxMode ? 'SANDBOX' : 'PROD'}
                </span>
              </button>

              {/* 3. Alternar Modo Claro / Oscuro */}
              <button
                type="button"
                role="menuitem"
                onClick={() => {
                  toggleTheme();
                }}
                className="w-full px-3 py-2 rounded-lg hover:bg-elevated flex items-center justify-between text-xs font-sans transition-fast cursor-pointer text-left"
              >
                <div className="flex items-center gap-2.5">
                  {theme === 'dark' ? (
                    <Sun size={16} weight="duotone" className="text-amber-400" />
                  ) : (
                    <Moon size={16} weight="duotone" className="text-indigo-500" />
                  )}
                  <div>
                    <span className="font-semibold text-primary block">
                      Tema de Interfaz
                    </span>
                    <span className="text-[11px] text-muted">
                      {theme === 'dark' ? 'Cambiar a Modo Claro' : 'Cambiar a Modo Oscuro'}
                    </span>
                  </div>
                </div>
                <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded-md border border-subtle bg-elevated text-secondary">
                  {theme === 'dark' ? 'DARK' : 'LIGHT'}
                </span>
              </button>

              {/* 4. Ir al Panel Admin (solo rol Admin) */}
              {usuario?.rol === 'Admin' && (
                <>
                  <div className="border-t border-subtle my-1" />
                  <Link
                    to="/admin/inventario"
                    role="menuitem"
                    onClick={() => setIsMenuOpen(false)}
                    className="w-full px-3 py-2 rounded-lg hover:bg-elevated flex items-center justify-between text-xs font-sans font-semibold text-primary transition-fast"
                  >
                    <div className="flex items-center gap-2.5">
                      <SlidersHorizontal
                        size={16}
                        weight="duotone"
                        className="text-amber-500"
                      />
                      <span>Ir al Panel Admin</span>
                    </div>
                    <span className="text-[10px] font-mono text-muted">ERP</span>
                  </Link>
                </>
              )}

              <div className="border-t border-subtle my-1" />

              {/* 5. Cerrar Sesión / Salir */}
              <button
                type="button"
                role="menuitem"
                onClick={() => {
                  setIsMenuOpen(false);
                  logout();
                }}
                className="w-full px-3 py-2 rounded-lg hover:bg-red-500/10 text-red-600 dark:text-red-400 flex items-center justify-between text-xs font-sans font-semibold transition-fast cursor-pointer text-left"
              >
                <div className="flex items-center gap-2.5">
                  <SignOut size={16} weight="bold" />
                  <span>Cerrar Sesión</span>
                </div>
                <span className="text-[10px] font-mono opacity-75">Salir</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
