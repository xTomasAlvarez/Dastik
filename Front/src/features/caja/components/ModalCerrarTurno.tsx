import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useQuery } from '@tanstack/react-query';
import {
  Archive,
  CheckCircle,
  WarningCircle,
  X,
  SignOut,
  MinusCircle,
  Clock
} from '@phosphor-icons/react';
import { cajaApi, type ResumenTurnoDto, type CerrarTurnoResponse } from '../api/cajaApi';
import { useAuthStore } from '../../../stores/useAuthStore';
import { Button } from '../../../components/ui/Button';

interface ModalCerrarTurnoProps {
  isOpen: boolean;
  onClose: () => void;
  turnoId: number;
}

export const ModalCerrarTurno: React.FC<ModalCerrarTurnoProps> = ({
  isOpen,
  onClose,
  turnoId,
}) => {
  const { logout, usuario } = useAuthStore();

  // Estados de Gastos / Salidas del Turno
  const [gastosTurno, setGastosTurno] = useState<string>('');
  const [motivoGastos, setMotivoGastos] = useState<string>('');

  // Efectivo contado en gaveta
  const [efectivoReal, setEfectivoReal] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cierreCompletado, setCierreCompletado] = useState<CerrarTurnoResponse | null>(null);

  // Obtener resumen en vivo de ventas del turno actual
  const {
    data: resumen,
    isLoading: isLoadingResumen,
    refetch: refetchResumen,
  } = useQuery<ResumenTurnoDto>({
    queryKey: ['resumen-turno', turnoId],
    queryFn: () => cajaApi.obtenerResumenTurno(turnoId),
    enabled: isOpen && turnoId > 0,
    staleTime: 0,
  });

  useEffect(() => {
    if (isOpen) {
      setError(null);
      setCierreCompletado(null);
      setGastosTurno('');
      setMotivoGastos('');
      refetchResumen();
    }
  }, [isOpen, refetchResumen]);

  // Manejo de tecla Escape para cerrar y bloqueo de scroll de fondo
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !isSubmitting && !cierreCompletado) {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    document.body.style.overflow = 'hidden';

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, isSubmitting, cierreCompletado, onClose]);

  // Cálculos de Arqueo y Gaveta
  const saldoInicial = resumen?.saldoInicial ?? 0;
  const ventasEfectivo = resumen?.totalVentasEfectivo ?? 0;
  const gastosNum = Math.max(0, parseFloat(gastosTurno) || 0);

  // Regla de Negocio: Efectivo Esperado en Gaveta = (Saldo Inicial + Ventas Efectivo) - Gastos
  const efectivoEsperadoEnGaveta = Math.max(0, saldoInicial + ventasEfectivo - gastosNum);

  // Inicializar o sugerir el efectivo real
  useEffect(() => {
    if (resumen && efectivoReal === '') {
      setEfectivoReal(efectivoEsperadoEnGaveta.toString());
    }
  }, [resumen, efectivoReal, efectivoEsperadoEnGaveta]);


  const formatearDinero = (monto: number) => {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS',
      minimumFractionDigits: 2,
    }).format(monto);
  };

  const contadoNum = parseFloat(efectivoReal) || 0;
  const diferencia = contadoNum - efectivoEsperadoEnGaveta;

  // Detección de Turno Mañana vs Turno Tarde
  const horaApertura = resumen?.fechaApertura ? new Date(resumen.fechaApertura).getHours() : new Date().getHours();
  const nombreTurno = horaApertura < 14 ? 'TURNO MAÑANA' : 'TURNO TARDE';
  const rolPersonal = usuario?.rol === 'Admin' ? 'Dueño' : 'Empleado';

  const handleCerrarTurno = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (turnoId <= 0) {
      setError('No hay un turno válido para cerrar.');
      return;
    }

    if (isNaN(contadoNum) || contadoNum < 0) {
      setError('Por favor ingresa un monto real válido en efectivo contado.');
      return;
    }

    setIsSubmitting(true);
    try {
      const resultado = await cajaApi.cerrarTurno({
        turnoId,
        saldoFinal: contadoNum,
        gastosTurno: gastosNum,
        motivoGastos: motivoGastos.trim() || undefined,
        montoRealEfectivo: contadoNum,
      });

      setCierreCompletado(resultado);

      // Desloguear y retornar al login tras breve confirmación
      setTimeout(() => {
        logout();
      }, 2500);
    } catch (err: unknown) {
      const mensaje =
        err && typeof err === 'object' && 'response' in err
          ? (err as { response?: { data?: { error?: string } } }).response?.data?.error
          : 'Error al procesar el cierre de caja.';
      setError(mensaje || 'No se pudo cerrar el turno.');
      setIsSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
            onClick={!isSubmitting && !cierreCompletado ? onClose : undefined}
            className="fixed inset-0 bg-black/75 backdrop-blur-sm"
          />

          {/* Dialog */}
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.97, y: 8 }}
            transition={{ type: 'spring', stiffness: 420, damping: 30, mass: 0.8 }}
            className="w-full max-w-lg bg-surface border border-subtle rounded-xl shadow-floating p-6 md:p-8 flex flex-col gap-5 text-left relative my-auto z-10"
          >
        {/* Header con Lenguaje de Dominio */}
        <div className="flex items-start justify-between border-b border-subtle pb-4">
          <div className="flex items-center gap-3">
            <div className="border border-subtle bg-elevated rounded-lg p-2 text-primary shrink-0">
              <Archive size={22} weight="duotone" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] uppercase tracking-[0.2em] text-muted font-mono block">
                  TERMINAL // ARQUEO DE CAJA
                </span>
                <span className="text-[10px] uppercase tracking-wider font-mono font-bold border border-amber-500/30 bg-amber-500/10 rounded px-1.5 py-0.5 text-amber-600 dark:text-amber-400">
                  {nombreTurno}
                </span>
              </div>
              <h2 className="text-xl font-heading font-bold text-primary tracking-tight">
                CIERRE DE {nombreTurno} (#{turnoId})
              </h2>
              <span className="text-xs text-muted font-sans">
                Responsable: <strong className="text-secondary">{usuario?.nombre}</strong> ({rolPersonal})
              </span>
            </div>
          </div>
          {!cierreCompletado && (
            <button
              type="button"
              onClick={onClose}
              className="text-muted hover:text-primary transition-colors p-1.5 rounded-lg hover:bg-elevated cursor-pointer"
              title="Cancelar y volver al POS [ESC]"
            >
              <X size={18} weight="bold" />
            </button>
          )}
        </div>

        {/* Vista de Éxito al Cerrar */}
        {cierreCompletado ? (
          <div className="border border-emerald-500/30 bg-emerald-500/10 rounded-xl p-6 flex flex-col items-center justify-center text-center gap-4">
            <CheckCircle size={44} weight="duotone" className="text-emerald-600 dark:text-emerald-400" />
            <div>
              <h3 className="font-heading text-base font-bold text-primary uppercase tracking-wider">
                {nombreTurno} CERRADO EXITOSAMENTE
              </h3>
              <p className="text-xs font-sans text-secondary mt-1">
                El arqueo de gaveta ha sido guardado. Redirigiendo a la pantalla de login...
              </p>
            </div>
            <div className="border border-subtle bg-surface rounded-lg p-3.5 w-full text-xs font-mono space-y-1.5 text-left tabular-nums">
              <div className="flex justify-between text-secondary">
                <span>Efectivo Real Contado:</span>
                <span className="text-primary font-bold">{formatearDinero(cierreCompletado.saldoFinal)}</span>
              </div>
              {gastosNum > 0 && (
                <div className="flex justify-between text-red-600 dark:text-red-400">
                  <span>Salidas / Gastos del Turno:</span>
                  <span>-{formatearDinero(gastosNum)}</span>
                </div>
              )}
              <div className="flex justify-between text-secondary">
                <span>Efectivo Esperado en Gaveta:</span>
                <span className="text-primary">{formatearDinero(efectivoEsperadoEnGaveta)}</span>
              </div>
              <div className="flex justify-between pt-1.5 border-t border-subtle">
                <span>Diferencia de Balance:</span>
                <span className={diferencia === 0 ? 'text-emerald-600 dark:text-emerald-400 font-bold' : diferencia > 0 ? 'text-emerald-600 dark:text-emerald-400 font-bold' : 'text-red-600 dark:text-red-400 font-bold'}>
                  {diferencia === 0
                    ? 'CUADRE EXACTO ($0,00)'
                    : `${diferencia > 0 ? '+' : ''}${formatearDinero(diferencia)}`}
                </span>
              </div>
            </div>
            <Button
              type="button"
              variant="primary"
              size="sm"
              onClick={() => logout()}
              className="w-full mt-2"
            >
              SALIR AHORA
            </Button>
          </div>
        ) : (
          <>
            {/* Mensaje de Error */}
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

            {/* 1. Resumen de Ventas del Turno */}
            <div className="border border-subtle bg-elevated rounded-xl p-4 flex flex-col gap-2.5">
              <span className="text-[10px] uppercase tracking-widest text-muted font-mono flex items-center gap-1.5">
                <Clock size={13} weight="bold" />
                MÉTRICAS DEL {nombreTurno} ({resumen?.cantidadOrdenes ?? 0} {resumen?.cantidadOrdenes === 1 ? 'VENTA' : 'VENTAS'})
              </span>

              {isLoadingResumen ? (
                <div className="space-y-2 animate-pulse">
                  <div className="h-4 bg-surface rounded w-full" />
                  <div className="h-4 bg-surface rounded w-3/4" />
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-2.5 text-xs font-sans">
                  <div className="border border-subtle bg-surface rounded-lg p-2.5">
                    <span className="text-[10px] text-muted block uppercase">Fondo Inicial:</span>
                    <span className="font-mono font-bold text-primary tabular-nums">
                      {formatearDinero(saldoInicial)}
                    </span>
                  </div>

                  <div className="border border-subtle bg-surface rounded-lg p-2.5">
                    <span className="text-[10px] text-muted block uppercase">(+) Ventas Efectivo:</span>
                    <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400 tabular-nums">
                      +{formatearDinero(ventasEfectivo)}
                    </span>
                  </div>

                  <div className="border border-subtle bg-surface rounded-lg p-2.5">
                    <span className="text-[10px] text-muted block uppercase">Ventas Tarjeta:</span>
                    <span className="font-mono font-bold text-primary tabular-nums">
                      {formatearDinero(resumen?.totalVentasTarjeta ?? 0)}
                    </span>
                  </div>

                  <div className="border border-subtle bg-surface rounded-lg p-2.5">
                    <span className="text-[10px] text-muted block uppercase">Transferencias:</span>
                    <span className="font-mono font-bold text-primary tabular-nums">
                      {formatearDinero(resumen?.totalVentasTransferencia ?? 0)}
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* 2. SECCIÓN: SALIDAS / GASTOS DEL TURNO */}
            <div className="border border-subtle bg-elevated rounded-xl p-4 space-y-3">
              <div className="flex items-center justify-between border-b border-subtle pb-2">
                <div className="flex items-center gap-2">
                  <MinusCircle size={17} weight="bold" className="text-red-600 dark:text-red-400" />
                  <span className="text-[11px] uppercase tracking-wider text-primary font-heading font-bold">
                    SALIDAS / GASTOS DEL TURNO
                  </span>
                </div>
                <span className="text-[10px] text-muted font-sans">
                  Resta de gaveta física
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] uppercase font-sans tracking-wider text-secondary block mb-1">
                    MONTO TOTAL GASTOS (ARS)
                  </label>
                  <div className="flex items-center border border-subtle focus-within:border-strong bg-surface rounded-lg px-3 py-2">
                    <span className="text-sm font-mono text-muted mr-2">$</span>
                    <input
                      type="number"
                      min="0"
                      step="50"
                      value={gastosTurno}
                      onChange={(e) => setGastosTurno(e.target.value)}
                      placeholder="0"
                      className="bg-transparent text-sm font-mono font-bold text-primary outline-none w-full tabular-nums"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[10px] uppercase font-sans tracking-wider text-secondary block mb-1">
                    MOTIVO / CONCEPTO
                  </label>
                  <input
                    type="text"
                    value={motivoGastos}
                    onChange={(e) => setMotivoGastos(e.target.value)}
                    placeholder="ej: Desayuno, Uber, Almuerzo"
                    className="w-full bg-surface border border-subtle focus:border-strong rounded-lg px-3 py-2 text-xs text-primary outline-none placeholder-muted"
                  />
                </div>
              </div>

              {/* Botones de Presets Rápidos de Gastos */}
              <div className="flex items-center gap-2 pt-1 flex-wrap">
                <span className="text-[10px] uppercase tracking-wider text-muted">PRESETS:</span>
                {[
                  { label: 'Desayuno ($1.500)', monto: 1500, motivo: 'Desayuno' },
                  { label: 'Uber ($3.500)', monto: 3500, motivo: 'Uber mercadería' },
                  { label: 'Almuerzo ($5.000)', monto: 5000, motivo: 'Almuerzo personal' },
                ].map((preset) => (
                  <button
                    key={preset.label}
                    type="button"
                    onClick={() => {
                      setGastosTurno(preset.monto.toString());
                      setMotivoGastos(preset.motivo);
                    }}
                    className="px-2 py-0.5 rounded border border-subtle bg-surface hover:border-strong text-[10px] font-mono text-secondary hover:text-primary transition-colors cursor-pointer"
                  >
                    +{preset.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Display de Efectivo Esperado en Gaveta con Fórmula del Negocio */}
            <div className="border border-subtle bg-elevated rounded-lg p-3.5 flex items-center justify-between">
              <div>
                <span className="text-[10px] uppercase font-mono tracking-widest text-secondary block">
                  EFECTIVO ESPERADO EN GAVETA FÍSICA:
                </span>
                <span className="text-[11px] text-muted font-sans">
                  (Saldo Inicial + Ventas Efectivo) - Gastos
                </span>
              </div>
              <span className="font-mono text-lg font-bold text-primary tabular-nums">
                {formatearDinero(efectivoEsperadoEnGaveta)}
              </span>
            </div>

            {/* 3. Formulario de Conteo de Efectivo Real */}
            <form onSubmit={handleCerrarTurno} className="flex flex-col gap-4">
              <div>
                <div className="flex justify-between items-center mb-1.5">
                  <label className="text-[10px] uppercase font-sans font-semibold tracking-wider text-secondary">
                    EFECTIVO REAL CONTADO EN GAVETA (ARS)
                  </label>
                  <button
                    type="button"
                    onClick={() => setEfectivoReal(efectivoEsperadoEnGaveta.toString())}
                    className="text-[10px] font-mono font-bold text-primary underline cursor-pointer hover:text-secondary"
                  >
                    COPIAR ESPERADO
                  </button>
                </div>

                <div className="flex items-center border border-subtle focus-within:border-strong bg-elevated rounded-lg px-4 py-3 transition-colors">
                  <span className="font-mono text-lg font-bold text-muted mr-2">$</span>
                  <input
                    type="number"
                    min="0"
                    step="100"
                    value={efectivoReal}
                    onChange={(e) => setEfectivoReal(e.target.value)}
                    placeholder="0"
                    autoFocus
                    required
                    className="bg-transparent text-2xl font-mono font-bold text-primary placeholder:text-muted outline-none w-full tabular-nums"
                  />
                </div>
              </div>

              {/* Indicador de Diferencia en Tiempo Real */}
              <div
                className={`
                  border rounded-lg p-3 flex items-center justify-between text-xs font-mono transition-colors tabular-nums
                  ${
                    diferencia === 0
                      ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                      : diferencia > 0
                      ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                      : 'border-red-500/30 bg-red-500/10 text-red-600 dark:text-red-400'
                  }
                `}
              >
                <div>
                  <span className="text-[10px] uppercase tracking-widest block opacity-75">
                    BALANCE DE GAVETA
                  </span>
                  <span className="font-heading font-bold text-sm">
                    {diferencia === 0
                      ? 'CUADRE EXACTO ($0,00)'
                      : diferencia > 0
                      ? 'SOBRANTE EN GAVETA'
                      : 'FALTANTE EN GAVETA'}
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-[10px] uppercase tracking-widest block opacity-75">
                    DIFERENCIA
                  </span>
                  <span className="font-mono font-bold text-sm">
                    {diferencia === 0
                      ? '$ 0,00'
                      : `${diferencia > 0 ? '+' : ''}${formatearDinero(diferencia)}`}
                  </span>
                </div>
              </div>

              {/* Acciones */}
              <div className="flex items-center gap-3 mt-1">
                <Button
                  type="button"
                  variant="secondary"
                  size="lg"
                  onClick={onClose}
                  disabled={isSubmitting}
                  className="w-1/3 text-xs font-mono"
                >
                  CANCELAR [ESC]
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  size="lg"
                  disabled={isSubmitting}
                  className="w-2/3 font-heading font-bold tracking-wide flex items-center justify-center gap-2"
                >
                  <span>{isSubmitting ? 'CERRANDO TURNO...' : 'CONFIRMAR ARQUEO Y SALIR'}</span>
                  <SignOut size={16} weight="bold" />
                </Button>
              </div>
            </form>
          </>
        )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
