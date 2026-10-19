import React, { useState, useEffect } from 'react';
import { CurrencyDollar, WarningCircle, X, SignOut } from '@phosphor-icons/react';
import { cajaApi, type TurnoActivoDto } from '../api/cajaApi';
import { useAuthStore } from '../../../stores/useAuthStore';
import { Button } from '../../../components/ui/Button';

interface ModalAbrirTurnoProps {
  isOpen: boolean;
  onTurnoAbierto: (turno: TurnoActivoDto) => void;
}

export const ModalAbrirTurno: React.FC<ModalAbrirTurnoProps> = ({ isOpen, onTurnoAbierto }) => {
  const [saldoInicial, setSaldoInicial] = useState<string>('20000');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { usuario, logout } = useAuthStore();

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const montoNumerico = parseFloat(saldoInicial.replace(/\./g, '').replace(',', '.'));
    if (isNaN(montoNumerico) || montoNumerico < 0) {
      setError('Por favor ingresa un saldo inicial válido igual o mayor a $0.');
      return;
    }

    setIsLoading(true);
    try {
      const response = await cajaApi.abrirTurno({
        saldoInicial: montoNumerico,
        empleadoId: usuario?.id,
      });

      onTurnoAbierto({
        turnoId: response.turnoId,
        empleadoId: response.empleadoId,
        fechaApertura: response.fechaApertura,
        saldoInicial: response.saldoInicial,
        estado: 'Abierto',
      });
    } catch (err: unknown) {
      const mensaje =
        err && typeof err === 'object' && 'response' in err
          ? (err as { response?: { data?: { error?: string } } }).response?.data?.error
          : 'Error al abrir el turno de caja. Verifica tu conexión.';
      setError(mensaje || 'No se pudo abrir el turno de caja.');
    } finally {
      setIsLoading(false);
    }
  };

  const presetMontos = [0, 10000, 20000, 50000];

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-surface border border-subtle rounded-xl shadow-floating p-6 md:p-8 flex flex-col gap-6 text-left">
        {/* Header */}
        <div className="border-b border-subtle pb-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] uppercase tracking-[0.2em] text-muted font-mono">
              TERMINAL POS // APERTURA DE CAJA
            </span>
            <span className="text-[10px] font-mono font-bold border border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-md px-2 py-0.5 uppercase tracking-wider">
              {new Date().getHours() < 14 ? 'TURNO MAÑANA' : 'TURNO TARDE'}
            </span>
          </div>
          <h2 className="text-xl font-heading font-bold text-primary tracking-tight">
            FONDO DE CAJA INICIAL
          </h2>
          <p className="text-xs font-sans text-secondary mt-1 leading-relaxed">
            Ingresa el efectivo inicial disponible en caja física para dar cambio antes de operar la terminal de ventas.
          </p>
        </div>

        {/* Banner de Usuario / Responsable */}
        <div className="border border-subtle bg-elevated rounded-lg p-3.5 flex items-center justify-between">
          <div>
            <span className="text-[10px] uppercase tracking-widest text-muted font-sans block">
              RESPONSABLE DE APERTURA
            </span>
            <span className="text-xs font-heading font-bold text-primary">
              {usuario?.nombre || 'Empleado en Turno'}{' '}
              <span className="text-secondary font-normal">
                ({usuario?.rol === 'Admin' ? 'Dueño' : 'Empleado'})
              </span>
            </span>
            <span className="text-[11px] font-mono text-muted block">
              {usuario?.email}
            </span>
          </div>
          <div className="border border-subtle bg-surface rounded-lg p-2 text-primary">
            <CurrencyDollar size={20} weight="duotone" />
          </div>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="border border-red-500/30 bg-red-500/10 rounded-lg p-3 flex items-start justify-between gap-3 text-xs text-red-600 dark:text-red-400 font-sans">
            <div className="flex items-center gap-2">
              <WarningCircle size={16} weight="bold" className="shrink-0" />
              <span>{error}</span>
            </div>
            <button
              type="button"
              onClick={() => setError(null)}
              className="hover:opacity-75 cursor-pointer p-0.5"
            >
              <X size={14} weight="bold" />
            </button>
          </div>
        )}

        {/* Formulario */}
        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          <div>
            <label className="text-[11px] uppercase font-sans font-semibold tracking-wider text-secondary block mb-2">
              MONTO DE APERTURA (ARS)
            </label>
            <div className="flex items-center border border-subtle focus-within:border-strong bg-elevated rounded-lg px-4 py-3 transition-colors">
              <span className="font-mono text-lg font-bold text-muted mr-2">$</span>
              <input
                type="number"
                min="0"
                step="100"
                value={saldoInicial}
                onChange={(e) => setSaldoInicial(e.target.value)}
                placeholder="20000"
                autoFocus
                required
                className="bg-transparent text-xl font-mono font-bold text-primary placeholder:text-muted outline-none w-full tabular-nums"
              />
            </div>

            {/* Presets Rápidos */}
            <div className="flex items-center gap-2 mt-2">
              {presetMontos.map((monto) => (
                <button
                  key={monto}
                  type="button"
                  onClick={() => setSaldoInicial(monto.toString())}
                  className="px-2.5 py-1 rounded-md border border-subtle bg-elevated hover:border-strong text-[11px] font-mono text-secondary hover:text-primary transition-colors cursor-pointer tabular-nums"
                >
                  {monto === 0 ? '$0' : `$${monto.toLocaleString('es-AR')}`}
                </button>
              ))}
            </div>
          </div>

          <Button
            type="submit"
            variant="primary"
            size="lg"
            disabled={isLoading}
            className="w-full font-heading font-bold tracking-wide mt-2"
          >
            {isLoading ? 'ABRIENDO TURNO...' : 'ABRIR TURNO Y COMENZAR VENTAS'}
          </Button>

          {/* Opción de Cancelar / Logout */}
          <div className="text-center pt-2 border-t border-subtle">
            <button
              type="button"
              onClick={logout}
              className="text-[11px] uppercase font-sans font-semibold tracking-wider text-muted hover:text-red-600 dark:hover:text-red-400 transition-colors flex items-center justify-center gap-1.5 mx-auto cursor-pointer"
            >
              <SignOut size={14} weight="bold" />
              <span>Cerrar sesión ({usuario?.rol === 'Admin' ? 'Dueño' : 'Empleado'})</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
