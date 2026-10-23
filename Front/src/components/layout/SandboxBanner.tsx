import React, { useState, useRef, useEffect } from 'react';
import {
  Lightning,
  CaretDown,
  Check,
  ArrowUUpLeft,
  UserCircle,
  ArrowClockwise,
  BookOpen,
} from '@phosphor-icons/react';
import { useQueryClient } from '@tanstack/react-query';
import { useTenantStore } from '../../stores/useTenantStore';
import { useAuthStore, SANDBOX_ACCOUNTS } from '../../stores/useAuthStore';
import { sandboxApi } from '../../features/sandbox/api/sandboxApi';
import { ModalGuiaPractica } from './ModalGuiaPractica';

export const SandboxBanner: React.FC = () => {
  const queryClient = useQueryClient();
  const { isSandboxMode, setSandboxMode } = useTenantStore();
  const { usuario, fastSwitchSandboxUser } = useAuthStore();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isSwitching, setIsSwitching] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const [isGuiaOpen, setIsGuiaOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isDropdownOpen) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isDropdownOpen]);

  if (!isSandboxMode) return null;

  const isCurrentTomi =
    usuario?.email?.toLowerCase() === 'tomidev@dastik.com' ||
    usuario?.email?.toLowerCase() === 'tomi.empleado@dastik.com' ||
    Boolean(usuario?.esOcultoDev) ||
    Boolean(usuario?.nombre?.toLowerCase().includes('tomi'));

  const visibleAccounts = SANDBOX_ACCOUNTS.filter(
    (acc) => isCurrentTomi || (acc.id !== 'tomiDev' && !acc.email.toLowerCase().includes('tomi'))
  );

  const currentAccount =
    visibleAccounts.find(
      (a) =>
        a.email.toLowerCase() === usuario?.email?.toLowerCase() ||
        a.nombre.toLowerCase() === usuario?.nombre?.toLowerCase() ||
        (usuario?.nombre?.toLowerCase().includes('diego') && a.id === 'diego') ||
        (usuario?.nombre?.toLowerCase().includes('ale') && a.id === 'ale') ||
        (usuario?.nombre?.toLowerCase().includes('facundo') && a.id === 'facundo') ||
        (isCurrentTomi && a.id === 'tomiDev')
    ) || visibleAccounts[0];

  const handleSelectAccount = async (accountId: string) => {
    setIsSwitching(true);
    setIsDropdownOpen(false);
    try {
      await fastSwitchSandboxUser(accountId);
    } finally {
      setIsSwitching(false);
    }
  };

  const handleReiniciarPractica = async () => {
    const seguro = window.confirm(
      '¿Deseás reiniciar el entorno de práctica en Sandbox?\n\n' +
      '• Se borrarán las ventas, pagos y turnos de prueba registrados.\n' +
      '• El stock de las prendas se restaurará a 10 unidades para practicar.\n' +
      '• La caja quedará cerrada lista para abrir un nuevo turno.'
    );

    if (!seguro) return;

    try {
      setIsResetting(true);
      await sandboxApi.resetSandbox();
      await queryClient.invalidateQueries();
      window.location.reload();
    } catch {
      alert('Hubo un error al reiniciar el Sandbox. Verificá que el servidor esté activo.');
    } finally {
      setIsResetting(false);
    }
  };

  return (
    <>
      <div className="h-7 bg-amber-500/10 border-b border-amber-500/30 text-amber-600 dark:text-amber-400 font-mono text-[11px] flex items-center justify-between px-3 sm:px-4 shrink-0 z-50 select-none">
        {/* Texto de advertencia operativo a la izquierda */}
        <div className="flex items-center gap-1.5 min-w-0 truncate">
          <Lightning size={13} weight="fill" className="text-amber-500 shrink-0" />
          <span className="truncate">
            <strong className="font-bold">MODO CAPACITACIÓN</strong> // SANDBOX AISLADO (Tiendanube Offline)
          </span>
        </div>

        {/* Acciones de Entrenamiento + Selector Rápido de Cajero + Salir */}
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0 ml-2">
          {/* Botón Guía de Práctica / Misiones */}
          <button
            type="button"
            onClick={() => setIsGuiaOpen(true)}
            className="flex items-center gap-1 px-2 py-0.5 rounded border border-amber-500/40 bg-surface/90 hover:bg-surface text-amber-600 dark:text-amber-400 font-mono text-[10px] sm:text-[11px] font-semibold transition-fast cursor-pointer active:scale-95"
            title="Ver las 5 misiones de entrenamiento de cajero"
          >
            <BookOpen size={12} weight="bold" />
            <span className="hidden md:inline">Guía de Práctica</span>
            <span className="md:hidden">Misiones</span>
          </button>

          {/* Botón Reiniciar Práctica */}
          <button
            type="button"
            onClick={handleReiniciarPractica}
            disabled={isResetting}
            className="flex items-center gap-1 px-2 py-0.5 rounded border border-amber-500/40 bg-surface/90 hover:bg-surface text-secondary hover:text-primary font-mono text-[10px] sm:text-[11px] font-semibold transition-fast cursor-pointer active:scale-95 disabled:opacity-50"
            title="Borrar ventas de prueba y restablecer stock para empezar de nuevo"
          >
            <ArrowClockwise
              size={12}
              weight="bold"
              className={isResetting ? 'animate-spin text-amber-500' : ''}
            />
            <span className="hidden sm:inline">Reiniciar Práctica</span>
          </button>

          {/* Dropdown Fast Switcher */}
          <div className="relative" ref={dropdownRef}>
            <button
              type="button"
              onClick={() => setIsDropdownOpen((prev) => !prev)}
              disabled={isSwitching}
              className="flex items-center gap-1.5 px-2 py-0.5 rounded border border-amber-500/40 bg-surface/90 hover:bg-surface text-primary text-[10px] sm:text-[11px] font-sans font-semibold transition-fast cursor-pointer disabled:opacity-50"
              title="Cambiar cajero en Sandbox al instante sin pedir contraseña"
            >
              <UserCircle size={13} weight="duotone" className="text-amber-500" />
              <span className="truncate max-w-[130px] sm:max-w-none">
                {currentAccount ? currentAccount.label : usuario?.nombre || 'Cajero'}
              </span>
              <CaretDown size={11} weight="bold" className="text-muted" />
            </button>

            {isDropdownOpen && (
              <div className="absolute right-0 mt-1 w-64 rounded-xl border border-subtle bg-surface/95 backdrop-blur-md shadow-floating p-1.5 z-50 space-y-1 animate-in fade-in zoom-in-95 duration-150">
                <div className="px-2.5 py-1 text-[10px] font-mono uppercase tracking-wider text-muted border-b border-subtle mb-1">
                  Selector Rápido de Cajero
                </div>
                {visibleAccounts.map((acc) => {
                  const isSelected =
                    currentAccount?.id === acc.id ||
                    usuario?.email?.toLowerCase() === acc.email.toLowerCase() ||
                    usuario?.nombre?.toLowerCase() === acc.nombre.toLowerCase();

                  return (
                    <button
                      key={acc.id}
                      type="button"
                      onClick={() => handleSelectAccount(acc.id)}
                      className={`w-full px-2.5 py-1.5 rounded-lg flex items-center justify-between text-xs transition-fast cursor-pointer text-left ${
                        isSelected
                          ? 'bg-amber-500/15 border border-amber-500/30 text-primary font-bold'
                          : 'hover:bg-elevated text-secondary hover:text-primary'
                      }`}
                    >
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="font-semibold text-primary">{acc.label}</span>
                        </div>
                        <div className="text-[10px] font-mono text-muted">
                          Rol: {acc.rol} · {acc.tarifa}
                        </div>
                      </div>
                      {isSelected && (
                        <Check size={13} weight="bold" className="text-amber-500 shrink-0 ml-1" />
                      )}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Botón Salir a Producción */}
          <button
            type="button"
            onClick={() => setSandboxMode(false)}
            className="flex items-center gap-1 px-2 py-0.5 rounded border border-amber-500/40 hover:border-amber-500/70 bg-amber-500/15 hover:bg-amber-500/25 text-amber-600 dark:text-amber-300 font-mono text-[10px] sm:text-[11px] font-semibold transition-fast cursor-pointer active:scale-95"
            title="Regresar a la tienda oficial de Producción"
          >
            <ArrowUUpLeft size={12} weight="bold" />
            <span className="hidden sm:inline">[ Salir a Producción ]</span>
            <span className="sm:hidden">Salir</span>
          </button>
        </div>
      </div>

      {/* Modal Guía de Práctica */}
      <ModalGuiaPractica
        isOpen={isGuiaOpen}
        onClose={() => setIsGuiaOpen(false)}
      />
    </>
  );
};
