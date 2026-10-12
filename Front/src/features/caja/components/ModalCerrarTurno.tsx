import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Archive,
  CheckCircle,
  WarningCircle,
  X,
  SignOut,
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
  const { logout } = useAuthStore();

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
      refetchResumen();
    }
  }, [isOpen, refetchResumen]);

  // Cuando carga el resumen, sugerimos el monto esperado
  useEffect(() => {
    if (resumen && efectivoReal === '') {
      setEfectivoReal(resumen.saldoEsperado.toString());
    }
  }, [resumen, efectivoReal]);

  if (!isOpen) return null;

  const formatearDinero = (monto: number) => {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS',
      minimumFractionDigits: 2,
    }).format(monto);
  };

  const saldoEsperado = resumen?.saldoEsperado ?? 0;
  const contadoNum = parseFloat(efectivoReal) || 0;
  const diferencia = contadoNum - saldoEsperado;

  const handleCerrarTurno = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (turnoId <= 0) {
      setError('No hay un turno válido para cerrar.');
      return;
    }

    if (isNaN(contadoNum) || contadoNum < 0) {
      setError('Por favor ingresa un monto real válido en efectivo.');
      return;
    }

    setIsSubmitting(true);
    try {
      const resultado = await cajaApi.cerrarTurno({
        turnoId,
        saldoFinal: contadoNum,
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
    <div className="fixed inset-0 z-50 bg-[#000000]/95 flex items-center justify-center p-4">
      <div className="w-full max-w-lg bg-[#090909] border border-[#333333] p-6 md:p-8 flex flex-col gap-6 text-left relative">
        {/* Header */}
        <div className="flex items-start justify-between border-b border-[#222222] pb-4">
          <div className="flex items-center gap-3">
            <div className="border border-[#222222] bg-[#111111] p-2 text-[#FAFAFA] shrink-0">
              <Archive size={22} weight="light" />
            </div>
            <div>
              <span className="text-[10px] uppercase tracking-[0.25em] text-[#71717A] font-mono block">
                TERMINAL POS // ARQUEO DE CAJA
              </span>
              <h2 className="text-xl font-heading font-extrabold text-[#FAFAFA] tracking-tight">
                CIERRE DE TURNO #{turnoId}
              </h2>
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
                TURNO CERRADO EXITOSAMENTE
              </h3>
              <p className="text-xs font-sans text-[#A1A1AA] mt-1">
                El arqueo ha sido registrado en el sistema. Redirigiendo a la pantalla de login...
              </p>
            </div>
            <div className="border border-[#222222] bg-[#111111] p-3 w-full text-xs font-mono space-y-1 text-left">
              <div className="flex justify-between text-[#A1A1AA]">
                <span>Efectivo Real Contado:</span>
                <span className="text-[#FAFAFA] font-bold">{formatearDinero(cierreCompletado.saldoFinal)}</span>
              </div>
              <div className="flex justify-between text-[#A1A1AA]">
                <span>Efectivo Esperado:</span>
                <span className="text-[#FAFAFA]">{formatearDinero(cierreCompletado.saldoEsperado)}</span>
              </div>
              <div className="flex justify-between pt-1 border-t border-[#222222]">
                <span>Diferencia de Balance:</span>
                <span className={cierreCompletado.diferencia === 0 ? 'text-emerald-400 font-bold' : cierreCompletado.diferencia > 0 ? 'text-green-400 font-bold' : 'text-red-400 font-bold'}>
                  {cierreCompletado.diferencia === 0
                    ? 'CUADRE EXACTO ($0,00)'
                    : `${cierreCompletado.diferencia > 0 ? '+' : ''}${formatearDinero(cierreCompletado.diferencia)}`}
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

            {/* Resumen de Métricas del Turno */}
            <div className="border border-[#222222] bg-[#111111] p-4 flex flex-col gap-2.5">
              <span className="text-[9px] uppercase tracking-widest text-[#71717A] font-mono">
                BALANCE DEL TURNO ({resumen?.cantidadOrdenes ?? 0} {resumen?.cantidadOrdenes === 1 ? 'VENTA' : 'VENTAS'})
              </span>

              {isLoadingResumen ? (
                <div className="space-y-2 animate-pulse">
                  <div className="h-4 bg-[#1E1E1E] w-full" />
                  <div className="h-4 bg-[#1E1E1E] w-3/4" />
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-3 text-xs font-sans">
                  <div className="border border-[#1E1E1E] bg-[#0E0E0E] p-2.5">
                    <span className="text-[10px] text-[#71717A] block uppercase">Fondo Inicial:</span>
                    <span className="font-heading font-bold text-[#FAFAFA]">
                      {formatearDinero(resumen?.saldoInicial ?? 0)}
                    </span>
                  </div>

                  <div className="border border-[#1E1E1E] bg-[#0E0E0E] p-2.5">
                    <span className="text-[10px] text-[#71717A] block uppercase">Ventas Efectivo:</span>
                    <span className="font-heading font-bold text-[#FAFAFA]">
                      {formatearDinero(resumen?.totalVentasEfectivo ?? 0)}
                    </span>
                  </div>

                  <div className="border border-[#1E1E1E] bg-[#0E0E0E] p-2.5">
                    <span className="text-[10px] text-[#71717A] block uppercase">Ventas Tarjeta:</span>
                    <span className="font-heading font-bold text-[#FAFAFA]">
                      {formatearDinero(resumen?.totalVentasTarjeta ?? 0)}
                    </span>
                  </div>

                  <div className="border border-[#1E1E1E] bg-[#0E0E0E] p-2.5">
                    <span className="text-[10px] text-[#71717A] block uppercase">Total Facturado:</span>
                    <span className="font-heading font-bold text-[#FAFAFA]">
                      {formatearDinero(resumen?.totalVentas ?? 0)}
                    </span>
                  </div>
                </div>
              )}

              {/* Total Efectivo Esperado en Caja Física */}
              <div className="border-t border-[#1F1F1F] pt-2.5 flex justify-between items-baseline">
                <span className="text-[10px] uppercase font-mono tracking-widest text-[#A1A1AA]">
                  EFECTIVO ESPERADO EN CAJA FÍSICA:
                </span>
                <span className="font-heading text-base font-extrabold text-[#FAFAFA]">
                  {formatearDinero(saldoEsperado)}
                </span>
              </div>
            </div>

            {/* Formulario de Conteo de Efectivo */}
            <form onSubmit={handleCerrarTurno} className="flex flex-col gap-5">
              <div>
                <div className="flex justify-between items-center mb-1.5">
                  <label className="text-[10px] uppercase font-sans tracking-widest text-[#71717A]">
                    EFECTIVO REAL CONTADO EN CAJA FÍSICA (ARS)
                  </label>
                  <button
                    type="button"
                    onClick={() => setEfectivoReal(saldoEsperado.toString())}
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
                  <span className="text-[9px] uppercase tracking-widest block opacity-75">
                    ESTADO DE ARQUEO
                  </span>
                  <span className="font-heading font-bold text-sm">
                    {diferencia === 0
                      ? 'CUADRE PERFECTO'
                      : diferencia > 0
                      ? 'SOBRANTE EN CAJA'
                      : 'FALTANTE EN CAJA'}
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-[9px] uppercase tracking-widest block opacity-75">
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
                  <span>{isSubmitting ? 'CERRANDO TURNO...' : 'CONFIRMAR CIERRE Y SALIR'}</span>
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
