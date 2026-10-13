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
    <div className="fixed inset-0 z-50 bg-[#000000]/95 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-[#090909] border border-[#333333] p-6 md:p-8 flex flex-col gap-6 text-left">
        {/* Header */}
        <div className="border-b border-[#222222] pb-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] uppercase tracking-[0.25em] text-[#71717A] font-mono">
              TERMINAL POS // APERTURA DE CAJA
            </span>
            <span className="text-[10px] font-mono border border-emerald-900 bg-emerald-950/40 text-emerald-400 px-2 py-0.5 uppercase tracking-wider">
              {new Date().getHours() < 14 ? 'TURNO MAÑANA' : 'TURNO TARDE'}
            </span>
          </div>
          <h2 className="text-xl font-heading font-extrabold text-[#FAFAFA] tracking-tight">
            FONDO DE CAJA INICIAL
          </h2>
          <p className="text-xs font-sans text-[#71717A] mt-1 leading-relaxed">
            Ingresa el efectivo inicial disponible en caja física para dar cambio antes de operar la terminal de ventas.
          </p>
        </div>

        {/* Banner de Usuario / Responsable */}
        <div className="border border-[#222222] bg-[#111111] p-3 flex items-center justify-between">
          <div>
            <span className="text-[10px] uppercase tracking-widest text-[#71717A] font-sans block">
              RESPONSABLE DE APERTURA
            </span>
            <span className="text-xs font-heading font-bold text-[#FAFAFA]">
              {usuario?.nombre || 'Empleado en Turno'}{' '}
              <span className="text-[#71717A] font-normal">
                ({usuario?.rol === 'Admin' ? 'Dueño' : 'Empleado'})
              </span>
            </span>
            <span className="text-[10px] font-mono text-[#71717A] block">
              {usuario?.email}
            </span>
          </div>
          <div className="border border-[#222222] bg-[#090909] p-2 text-[#FAFAFA]">
            <CurrencyDollar size={20} weight="light" />
          </div>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="border border-red-900/80 bg-red-950/30 p-3 flex items-start justify-between gap-3 text-xs text-red-300 font-sans">
            <div className="flex items-center gap-2">
              <WarningCircle size={16} weight="light" className="text-red-400 shrink-0" />
              <span>{error}</span>
            </div>
            <button
              type="button"
              onClick={() => setError(null)}
              className="text-red-400 hover:text-red-200 cursor-pointer p-0.5"
            >
              <X size={14} weight="light" />
            </button>
          </div>
        )}

        {/* Formulario */}
        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          <div>
            <label className="text-[10px] uppercase font-sans tracking-widest text-[#71717A] block mb-2">
              MONTO DE APERTURA (ARS)
            </label>
            <div className="flex items-center border border-[#333333] focus-within:border-[#FAFAFA] bg-[#111111] px-4 py-3 transition-fast">
              <span className="font-heading text-lg font-bold text-[#71717A] mr-2">$</span>
              <input
                type="number"
                min="0"
                step="100"
                value={saldoInicial}
                onChange={(e) => setSaldoInicial(e.target.value)}
                placeholder="20000"
                autoFocus
                required
                className="bg-transparent text-xl font-heading font-extrabold text-[#FAFAFA] placeholder:text-[#444444] outline-none w-full"
              />
            </div>

            {/* Presets Rápidos */}
            <div className="flex items-center gap-2 mt-2">
              {presetMontos.map((monto) => (
                <button
                  key={monto}
                  type="button"
                  onClick={() => setSaldoInicial(monto.toString())}
                  className="px-2 py-1 border border-[#222222] bg-[#111111] hover:border-[#444444] text-[10px] font-mono text-[#A1A1AA] hover:text-[#FAFAFA] transition-fast cursor-pointer"
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
            className="w-full font-heading font-bold tracking-wider mt-2"
          >
            {isLoading ? 'ABRIENDO TURNO...' : 'ABRIR TURNO Y COMENZAR VENTAS'}
          </Button>

          {/* Opción de Cancelar / Logout */}
          <div className="text-center pt-2 border-t border-[#1C1C1C]">
            <button
              type="button"
              onClick={logout}
              className="text-[10px] uppercase font-sans tracking-widest text-[#71717A] hover:text-red-400 transition-fast flex items-center justify-center gap-1.5 mx-auto cursor-pointer"
            >
              <SignOut size={13} weight="light" />
              <span>Cerrar sesión ({usuario?.rol === 'Admin' ? 'Dueño' : 'Empleado'})</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
