import React, { useState, useEffect } from 'react';
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

  if (!isOpen) return null;

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
    <div className="fixed inset-0 z-50 bg-[#000000]/95 flex items-center justify-center p-4 overflow-y-auto">
      <div className="w-full max-w-lg bg-[#090909] border border-[#333333] p-6 md:p-8 flex flex-col gap-5 text-left relative my-auto">
        {/* Header con Lenguaje de Dominio */}
        <div className="flex items-start justify-between border-b border-[#222222] pb-4">
          <div className="flex items-center gap-3">
            <div className="border border-[#222222] bg-[#111111] p-2 text-[#FAFAFA] shrink-0">
              <Archive size={22} weight="light" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] uppercase tracking-[0.25em] text-[#71717A] font-mono block">
                  TERMINAL // ARQUEO DE CAJA
                </span>
                <span className="text-[10px] uppercase tracking-wider font-mono border border-[#333333] bg-[#141414] px-1.5 py-0.2 text-amber-300">
                  {nombreTurno}
                </span>
              </div>
              <h2 className="text-xl font-heading font-extrabold text-[#FAFAFA] tracking-tight">
                CIERRE DE {nombreTurno} (#{turnoId})
              </h2>
              <span className="text-xs text-[#71717A] font-sans">
                Responsable: <strong className="text-[#A1A1AA]">{usuario?.nombre}</strong> ({rolPersonal})
              </span>
            </div>
          </div>
          {!cierreCompletado && (
            <button
              type="button"
              onClick={onClose}
              className="text-[#71717A] hover:text-[#FAFAFA] transition-fast p-1 cursor-pointer"
              title="Cancelar y volver al POS"
            >
              <X size={18} weight="light" />
            </button>
          )}
        </div>

        {/* Vista de Éxito al Cerrar */}
        {cierreCompletado ? (
          <div className="border border-emerald-900/80 bg-emerald-950/20 p-6 flex flex-col items-center justify-center text-center gap-4">
            <CheckCircle size={44} weight="light" className="text-emerald-400" />
            <div>
              <h3 className="font-heading text-base font-bold text-[#FAFAFA] uppercase tracking-wider">
                {nombreTurno} CERRADO EXITOSAMENTE
              </h3>
              <p className="text-xs font-sans text-[#A1A1AA] mt-1">
                El arqueo de gaveta ha sido guardado. Redirigiendo a la pantalla de login...
              </p>
            </div>
            <div className="border border-[#222222] bg-[#111111] p-3.5 w-full text-xs font-mono space-y-1.5 text-left">
              <div className="flex justify-between text-[#A1A1AA]">
                <span>Efectivo Real Contado:</span>
                <span className="text-[#FAFAFA] font-bold">{formatearDinero(cierreCompletado.saldoFinal)}</span>
              </div>
              {gastosNum > 0 && (
                <div className="flex justify-between text-red-400">
                  <span>Salidas / Gastos del Turno:</span>
                  <span>-{formatearDinero(gastosNum)}</span>
                </div>
              )}
              <div className="flex justify-between text-[#A1A1AA]">
                <span>Efectivo Esperado en Gaveta:</span>
                <span className="text-[#FAFAFA]">{formatearDinero(efectivoEsperadoEnGaveta)}</span>
              </div>
              <div className="flex justify-between pt-1.5 border-t border-[#222222]">
                <span>Diferencia de Balance:</span>
                <span className={diferencia === 0 ? 'text-emerald-400 font-bold' : diferencia > 0 ? 'text-green-400 font-bold' : 'text-red-400 font-bold'}>
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

            {/* 1. Resumen de Ventas del Turno */}
            <div className="border border-[#222222] bg-[#111111] p-4 flex flex-col gap-2.5">
              <span className="text-[10px] uppercase tracking-widest text-[#71717A] font-mono flex items-center gap-1.5">
                <Clock size={13} weight="light" />
                MÉTRICAS DEL {nombreTurno} ({resumen?.cantidadOrdenes ?? 0} {resumen?.cantidadOrdenes === 1 ? 'VENTA' : 'VENTAS'})
              </span>

              {isLoadingResumen ? (
                <div className="space-y-2 animate-pulse">
                  <div className="h-4 bg-[#1E1E1E] w-full" />
                  <div className="h-4 bg-[#1E1E1E] w-3/4" />
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-2.5 text-xs font-sans">
                  <div className="border border-[#1E1E1E] bg-[#0E0E0E] p-2.5">
                    <span className="text-[10px] text-[#71717A] block uppercase">Fondo Inicial:</span>
                    <span className="font-heading font-bold text-[#FAFAFA]">
                      {formatearDinero(saldoInicial)}
                    </span>
                  </div>

                  <div className="border border-[#1E1E1E] bg-[#0E0E0E] p-2.5">
                    <span className="text-[10px] text-[#71717A] block uppercase">(+) Ventas Efectivo:</span>
                    <span className="font-heading font-bold text-emerald-400">
                      +{formatearDinero(ventasEfectivo)}
                    </span>
                  </div>

                  <div className="border border-[#1E1E1E] bg-[#0E0E0E] p-2.5">
                    <span className="text-[10px] text-[#71717A] block uppercase">Ventas Tarjeta:</span>
                    <span className="font-heading font-bold text-[#FAFAFA]">
                      {formatearDinero(resumen?.totalVentasTarjeta ?? 0)}
                    </span>
                  </div>

                  <div className="border border-[#1E1E1E] bg-[#0E0E0E] p-2.5">
                    <span className="text-[10px] text-[#71717A] block uppercase">Transferencias:</span>
                    <span className="font-heading font-bold text-[#FAFAFA]">
                      {formatearDinero(resumen?.totalVentasTransferencia ?? 0)}
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* 2. SECCIÓN NUEVA: SALIDAS / GASTOS DEL TURNO */}
            <div className="border border-[#333333] bg-[#0D0D0D] p-4 space-y-3">
              <div className="flex items-center justify-between border-b border-[#222222] pb-2">
                <div className="flex items-center gap-2">
                  <MinusCircle size={17} weight="light" className="text-red-400" />
                  <span className="text-[10px] uppercase tracking-widest text-[#FAFAFA] font-heading font-bold">
                    SALIDAS / GASTOS DEL TURNO
                  </span>
                </div>
                <span className="text-[10px] text-[#71717A] font-sans">
                  Resta de gaveta física
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] uppercase font-sans tracking-wider text-[#71717A] block mb-1">
                    MONTO TOTAL GASTOS (ARS)
                  </label>
                  <div className="flex items-center border border-[#333333] focus-within:border-[#FAFAFA] bg-[#141414] px-3 py-2">
                    <span className="text-sm font-mono text-[#71717A] mr-2">$</span>
                    <input
                      type="number"
                      min="0"
                      step="50"
                      value={gastosTurno}
                      onChange={(e) => setGastosTurno(e.target.value)}
                      placeholder="0"
                      className="bg-transparent text-sm font-mono font-bold text-[#FAFAFA] outline-none w-full"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[10px] uppercase font-sans tracking-wider text-[#71717A] block mb-1">
                    MOTIVO / CONCEPTO
                  </label>
                  <input
                    type="text"
                    value={motivoGastos}
                    onChange={(e) => setMotivoGastos(e.target.value)}
                    placeholder="ej: Desayuno, Uber, Almuerzo"
                    className="w-full bg-[#141414] border border-[#333333] focus:border-[#FAFAFA] px-3 py-2 text-xs text-[#FAFAFA] outline-none placeholder-[#555555]"
                  />
                </div>
              </div>

              {/* Botones de Presets Rápidos de Gastos */}
              <div className="flex items-center gap-2 pt-1 flex-wrap">
                <span className="text-[10px] uppercase tracking-wider text-[#71717A]">PRESETS:</span>
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
                    className="px-2 py-0.5 border border-[#222222] bg-[#141414] hover:border-[#444444] text-[10px] font-mono text-[#A1A1AA] hover:text-[#FAFAFA] transition-fast cursor-pointer"
                  >
                    +{preset.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Display de Efectivo Esperado en Gaveta con Fórmula del Negocio */}
            <div className="border border-[#2A2A2A] bg-[#111111] p-3.5 flex items-center justify-between">
              <div>
                <span className="text-[10px] uppercase font-mono tracking-widest text-[#71717A] block">
                  EFECTIVO ESPERADO EN GAVETA FÍSICA:
                </span>
                <span className="text-[11px] text-[#555555] font-sans">
                  (Saldo Inicial + Ventas Efectivo) - Gastos
                </span>
              </div>
              <span className="font-heading text-lg font-extrabold text-[#FAFAFA]">
                {formatearDinero(efectivoEsperadoEnGaveta)}
              </span>
            </div>

            {/* 3. Formulario de Conteo de Efectivo Real */}
            <form onSubmit={handleCerrarTurno} className="flex flex-col gap-4">
              <div>
                <div className="flex justify-between items-center mb-1.5">
                  <label className="text-[10px] uppercase font-sans tracking-widest text-[#71717A]">
                    EFECTIVO REAL CONTADO EN GAVETA (ARS)
                  </label>
                  <button
                    type="button"
                    onClick={() => setEfectivoReal(efectivoEsperadoEnGaveta.toString())}
                    className="text-[10px] font-mono text-[#FAFAFA] underline cursor-pointer hover:text-[#A1A1AA]"
                  >
                    COPIAR ESPERADO
                  </button>
                </div>

                <div className="flex items-center border border-[#333333] focus-within:border-[#FAFAFA] bg-[#111111] px-4 py-3 transition-fast">
                  <span className="font-heading text-lg font-bold text-[#71717A] mr-2">$</span>
                  <input
                    type="number"
                    min="0"
                    step="100"
                    value={efectivoReal}
                    onChange={(e) => setEfectivoReal(e.target.value)}
                    placeholder="0"
                    autoFocus
                    required
                    className="bg-transparent text-2xl font-heading font-extrabold text-[#FAFAFA] placeholder:text-[#444444] outline-none w-full"
                  />
                </div>
              </div>

              {/* Indicador de Diferencia en Tiempo Real */}
              <div
                className={`
                  border p-3 flex items-center justify-between text-xs font-mono transition-fast
                  ${
                    diferencia === 0
                      ? 'border-emerald-900/80 bg-emerald-950/20 text-emerald-300'
                      : diferencia > 0
                      ? 'border-green-900/80 bg-green-950/20 text-green-300'
                      : 'border-red-900/80 bg-red-950/20 text-red-300'
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
                  <span className="font-heading font-bold text-sm">
                    {diferencia === 0
                      ? '$ 0,00'
                      : `${diferencia > 0 ? '+' : ''}${formatearDinero(diferencia)}`}
                  </span>
                </div>
              </div>

              {/* Acciones */}
              <div className="flex items-center gap-3 mt-1">
                <button
                  type="button"
                  onClick={onClose}
                  disabled={isSubmitting}
                  className="w-1/3 py-3 border border-[#333333] hover:border-[#555555] bg-transparent text-xs font-mono uppercase tracking-wider text-[#A1A1AA] hover:text-[#FAFAFA] transition-fast cursor-pointer disabled:opacity-40"
                >
                  CANCELAR
                </button>
                <Button
                  type="submit"
                  variant="primary"
                  size="lg"
                  disabled={isSubmitting}
                  className="w-2/3 font-heading font-bold tracking-wider flex items-center justify-center gap-2"
                >
                  <span>{isSubmitting ? 'CERRANDO TURNO...' : 'CONFIRMAR ARQUEO Y SALIR'}</span>
                  <SignOut size={16} weight="light" />
                </Button>
              </div>
            </form>
          </>
        )}
      </div>
    </div>
  );
};
