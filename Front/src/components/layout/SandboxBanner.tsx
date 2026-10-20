import React, { useState, useRef, useEffect } from 'react';
import { Lightning, CaretDown, Check, ArrowUUpLeft, UserCircle } from '@phosphor-icons/react';
import { useTenantStore } from '../../stores/useTenantStore';
import { useAuthStore, SANDBOX_ACCOUNTS } from '../../stores/useAuthStore';

export const SandboxBanner: React.FC = () => {
  const { isSandboxMode, setSandboxMode } = useTenantStore();
  const { usuario, fastSwitchSandboxUser } = useAuthStore();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isSwitching, setIsSwitching] = useState(false);
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

  const currentAccount =
    SANDBOX_ACCOUNTS.find(
      (a) =>
        a.email.toLowerCase() === usuario?.email?.toLowerCase() ||
        a.nombre.toLowerCase() === usuario?.nombre?.toLowerCase() ||
        (usuario?.nombre?.toLowerCase().includes('franco') && a.id === 'franco') ||
        (usuario?.nombre?.toLowerCase().includes('lucas') && a.id === 'lucas') ||
        (usuario?.nombre?.toLowerCase().includes('tomi') && a.id === 'tomiDev')
    ) || SANDBOX_ACCOUNTS[0];

  const handleSelectAccount = async (accountId: string) => {
    setIsSwitching(true);
    setIsDropdownOpen(false);
    try {
      await fastSwitchSandboxUser(accountId);
    } finally {
      setIsSwitching(false);
    }
  };

  return (
    <div className="h-7 bg-amber-500/10 border-b border-amber-500/30 text-amber-600 dark:text-amber-400 font-mono text-[11px] flex items-center justify-between px-3 sm:px-4 shrink-0 z-50 select-none">
      {/* Texto de advertencia operativo a la izquierda */}
      <div className="flex items-center gap-1.5 min-w-0 truncate">
        <Lightning size={13} weight="fill" className="text-amber-500 shrink-0" />
        <span className="truncate">
          <strong className="font-bold">ENTORNO SANDBOX</strong> // BASE DE DATOS DE PRUEBA AISLADA (Tiendanube Offline)
        </span>
      </div>

      {/* Selector Rápido de Cajero + Botón Salir a Producción */}
      <div className="flex items-center gap-2 sm:gap-3 shrink-0 ml-2">
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
            <span className="truncate max-w-[140px] sm:max-w-none">
              {currentAccount ? currentAccount.label : usuario?.nombre || 'Cajero'}
            </span>
            <CaretDown size={11} weight="bold" className="text-muted" />
          </button>

          {isDropdownOpen && (
            <div className="absolute right-0 mt-1 w-64 rounded-xl border border-subtle bg-surface/95 backdrop-blur-md shadow-floating p-1.5 z-50 space-y-1 animate-in fade-in zoom-in-95 duration-150">
              <div className="px-2.5 py-1 text-[10px] font-mono uppercase tracking-wider text-muted border-b border-subtle mb-1">
                Selector Rápido de Cajero
              </div>
              {SANDBOX_ACCOUNTS.map((acc) => {
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
          <span>[ Salir a Producción ]</span>
        </button>
      </div>
    </div>
  );
};
