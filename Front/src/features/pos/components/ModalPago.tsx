import React, { useState, useEffect, useMemo } from 'react';
import {
  CreditCard,
  Money,
  ArrowsLeftRight,
  WarningCircle,
  X,
  ArrowRight,
  Flame,
  Percent
} from '@phosphor-icons/react';
import { useCartStore } from '../stores/useCartStore';
import { posApi, MetodosPago, type MetodoPagoTipo, type CobrarOrdenResponse } from '../api/posApi';
import { Button } from '../../../components/ui/Button';

interface ModalPagoProps {
  isOpen: boolean;
  onClose: () => void;
  turnoId: number;
  onVentaExitosa: (orden: CobrarOrdenResponse, vuelto: number) => void;
}

export const ModalPago: React.FC<ModalPagoProps> = ({
  isOpen,
  onClose,
  turnoId,
  onVentaExitosa,
}) => {
  const { items, getTotal, clearCart } = useCartStore();
  const subtotalOriginal = getTotal();

  // Métodos de pago exactos del negocio
  const [metodoPago, setMetodoPago] = useState<MetodoPagoTipo>(MetodosPago.Efectivo);

  // Estados de modificadores de tarjeta
  const [aplicarDescuentoDebito, setAplicarDescuentoDebito] = useState(false);
  const [porcentajeDescuentoDebito, setPorcentajeDescuentoDebito] = useState<number>(10); // 10% estándar

  const [aplicarInteresCredito, setAplicarInteresCredito] = useState(true); // 25% por defecto al elegir crédito

  // Estado de efectivo y vuelto
  const [pagaCon, setPagaCon] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Simulación opcional de Sábado para desarrollo/pruebas
  const hoyEsSabadoReal = new Date().getDay() === 6;
  const [simularSabado, setSimularSabado] = useState(hoyEsSabadoReal);

  // Cálculo del total final reactivo en tiempo real
  const totalFinal = useMemo(() => {
    let t = subtotalOriginal;

    if (metodoPago === MetodosPago.Debito && aplicarDescuentoDebito) {
      const descuento = t * (porcentajeDescuentoDebito / 100);
      t = Math.max(0, t - descuento);
    } else if (metodoPago === MetodosPago.Credito && aplicarInteresCredito) {
      const interes = t * 0.25; // 25% de interés
      t = t + interes;
    }

    return Math.round(t);
  }, [subtotalOriginal, metodoPago, aplicarDescuentoDebito, porcentajeDescuentoDebito, aplicarInteresCredito]);

  // Al abrir o cambiar el total, sincronizar el monto entregado en efectivo
  useEffect(() => {
    if (isOpen) {
      setPagaCon(totalFinal.toString());
      setError(null);
    }
  }, [isOpen, totalFinal]);

  // Manejo de tecla Escape para cerrar y bloqueo de scroll de fondo
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !isLoading) {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    document.body.style.overflow = 'hidden';

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, isLoading, onClose]);

  if (!isOpen) return null;

  const formatearDinero = (monto: number) => {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS',
      minimumFractionDigits: 2,
    }).format(monto);
  };

  const pagaConNum = parseFloat(pagaCon) || 0;
  const vuelto = Math.max(0, pagaConNum - totalFinal);
  const dineroInsuficiente = metodoPago === MetodosPago.Efectivo && pagaConNum < totalFinal;

  // Regla de Negocio: Comisión de Sábado
  // Si es sábado y el total supera los $120.000 -> 5% de comisión para el empleado
  const esSabadoActivo = hoyEsSabadoReal || simularSabado;
  const calificaComisionSabado = esSabadoActivo && totalFinal > 120000;
  const montoComisionEmpleado = calificaComisionSabado ? totalFinal * 0.05 : 0;

  const handlePagar = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (items.length === 0) {
      setError('El ticket está vacío.');
      return;
    }

    if (turnoId <= 0) {
      setError('No hay un turno de caja activo para procesar el cobro.');
      return;
    }

    if (dineroInsuficiente) {
      setError(`El monto entregado (${formatearDinero(pagaConNum)}) es inferior al total a cobrar.`);
      return;
    }

    setIsLoading(true);
    try {
      // Ajustar precios unitarios proporcionales para que la suma exacta de los items coincida con el total cobrado (ACID backend validation)
      const factor = subtotalOriginal > 0 ? totalFinal / subtotalOriginal : 1;
      let acumulado = 0;
      const itemsPayload = items.map((i, idx) => {
        if (idx === items.length - 1) {
          const precioUnitario = Number(((totalFinal - acumulado) / i.cantidad).toFixed(2));
          return {
            varianteId: i.varianteId,
            cantidad: i.cantidad,
            precioUnitario,
          };
        }
        const precioUnitario = Number((i.precioUnitario * factor).toFixed(2));
        acumulado += precioUnitario * i.cantidad;
        return {
          varianteId: i.varianteId,
          cantidad: i.cantidad,
          precioUnitario,
        };
      });

      const pagosPayload = [
        {
          metodoPago,
          monto: totalFinal,
        },
      ];

      const resultado = await posApi.cobrarOrden({
        turnoId,
        items: itemsPayload,
        pagos: pagosPayload,
      });

      // Limpiar el carrito en Zustand
      clearCart();

      // Notificar éxito con el vuelto calculado
      onVentaExitosa(resultado, vuelto);
      onClose();
    } catch (err: unknown) {
      const mensaje =
        err && typeof err === 'object' && 'response' in err
          ? (err as { response?: { data?: { error?: string; title?: string } } }).response?.data
              ?.error ||
            (err as { response?: { data?: { title?: string } } }).response?.data?.title
          : 'Ocurrió un error al procesar el cobro.';
      setError(mensaje || 'Error al procesar la venta en caja.');
    } finally {
      setIsLoading(false);
    }
  };

  // Botones de acceso rápido para efectivo
  const agregarEfectivo = (adicional: number) => {
    const actual = parseFloat(pagaCon) || 0;
    setPagaCon((actual + adicional).toString());
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="w-full max-w-lg bg-surface border border-subtle rounded-xl shadow-floating p-6 md:p-8 flex flex-col gap-6 text-left relative my-auto">
        {/* Header del Modal */}
        <div className="flex items-start justify-between border-b border-subtle pb-4">
          <div>
            <span className="text-[10px] uppercase tracking-[0.2em] text-muted font-mono block">
              TERMINAL POS // COBRO DE TICKET
            </span>
            <h2 className="text-xl font-heading font-bold text-primary tracking-tight">
              FINALIZAR VENTA
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-muted hover:text-primary transition-colors p-1.5 rounded-lg hover:bg-elevated cursor-pointer"
            title="Cancelar y volver al POS [ESC]"
          >
            <X size={18} weight="bold" />
          </button>
        </div>

        {/* Display Gigante del Total a Cobrar */}
        <div className="border border-subtle bg-elevated rounded-xl p-5 flex flex-col items-center justify-center text-center relative overflow-hidden">
          <span className="text-[10px] uppercase tracking-widest text-muted font-mono mb-1">
            TOTAL FINAL A COBRAR ({items.length} {items.length === 1 ? 'ARTÍCULO' : 'ARTÍCULOS'})
          </span>
          <span className="font-mono text-3xl md:text-4xl font-bold text-primary tracking-tight tabular-nums">
            {formatearDinero(totalFinal)}
          </span>
          {subtotalOriginal !== totalFinal && (
            <span className="text-xs font-mono text-muted mt-1 line-through tabular-nums">
              Subtotal base: {formatearDinero(subtotalOriginal)}
            </span>
          )}
        </div>

        {/* ALERTA DESTACADA: Comisión de Sábado */}
        {calificaComisionSabado && (
          <div className="border border-amber-500/30 bg-amber-500/10 rounded-xl p-3.5 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <Flame size={22} weight="fill" className="text-amber-500 dark:text-amber-400 shrink-0" />
              <div>
                <span className="text-xs font-heading font-bold tracking-wider block text-amber-600 dark:text-amber-400">
                  VENTA CALIFICADA: 5% COMISIÓN PARA EMPLEADO
                </span>
                <span className="text-[11px] font-sans text-secondary">
                  Venta en sábado mayor a $120.000 · Comisión ganada:{' '}
                  <strong className="text-primary font-mono tabular-nums">{formatearDinero(montoComisionEmpleado)}</strong>
                </span>
              </div>
            </div>
          </div>
        )}

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

        <form onSubmit={handlePagar} className="flex flex-col gap-5">
          {/* Selector de Métodos de Pago Reales (4 Métodos Exactos) */}
          <div>
            <span className="text-[11px] uppercase font-sans font-semibold tracking-wider text-secondary block mb-2">
              MÉTODO DE PAGO
            </span>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              {/* 1. Efectivo */}
              <button
                type="button"
                onClick={() => setMetodoPago(MetodosPago.Efectivo)}
                className={`
                  border rounded-lg p-2.5 flex flex-col items-center justify-center gap-1.5 transition-all cursor-pointer
                  ${
                    metodoPago === MetodosPago.Efectivo
                      ? 'border-zinc-900 bg-zinc-900 text-white dark:border-zinc-100 dark:bg-zinc-100 dark:text-zinc-900 font-bold shadow-surface'
                      : 'border-subtle bg-elevated text-secondary hover:border-strong hover:text-primary'
                  }
                `}
              >
                <Money size={20} weight={metodoPago === MetodosPago.Efectivo ? 'bold' : 'regular'} />
                <span className="font-heading text-[11px] uppercase tracking-wider">EFECTIVO</span>
              </button>

              {/* 2. Transferencia */}
              <button
                type="button"
                onClick={() => setMetodoPago(MetodosPago.Transferencia)}
                className={`
                  border rounded-lg p-2.5 flex flex-col items-center justify-center gap-1.5 transition-all cursor-pointer
                  ${
                    metodoPago === MetodosPago.Transferencia
                      ? 'border-zinc-900 bg-zinc-900 text-white dark:border-zinc-100 dark:bg-zinc-100 dark:text-zinc-900 font-bold shadow-surface'
                      : 'border-subtle bg-elevated text-secondary hover:border-strong hover:text-primary'
                  }
                `}
              >
                <ArrowsLeftRight size={20} weight={metodoPago === MetodosPago.Transferencia ? 'bold' : 'regular'} />
                <span className="font-heading text-[11px] uppercase tracking-wider">TRANSF.</span>
              </button>

              {/* 3. Débito */}
              <button
                type="button"
                onClick={() => setMetodoPago(MetodosPago.Debito)}
                className={`
                  border rounded-lg p-2.5 flex flex-col items-center justify-center gap-1.5 transition-all cursor-pointer
                  ${
                    metodoPago === MetodosPago.Debito
                      ? 'border-zinc-900 bg-zinc-900 text-white dark:border-zinc-100 dark:bg-zinc-100 dark:text-zinc-900 font-bold shadow-surface'
                      : 'border-subtle bg-elevated text-secondary hover:border-strong hover:text-primary'
                  }
                `}
              >
                <CreditCard size={20} weight={metodoPago === MetodosPago.Debito ? 'bold' : 'regular'} />
                <span className="font-heading text-[11px] uppercase tracking-wider">DÉBITO</span>
              </button>

              {/* 4. Crédito */}
              <button
                type="button"
                onClick={() => setMetodoPago(MetodosPago.Credito)}
                className={`
                  border rounded-lg p-2.5 flex flex-col items-center justify-center gap-1.5 transition-all cursor-pointer
                  ${
                    metodoPago === MetodosPago.Credito
                      ? 'border-zinc-900 bg-zinc-900 text-white dark:border-zinc-100 dark:bg-zinc-100 dark:text-zinc-900 font-bold shadow-surface'
                      : 'border-subtle bg-elevated text-secondary hover:border-strong hover:text-primary'
                  }
                `}
              >
                <Percent size={20} weight={metodoPago === MetodosPago.Credito ? 'bold' : 'regular'} />
                <span className="font-heading text-[11px] uppercase tracking-wider">CRÉDITO</span>
              </button>
            </div>
          </div>

          {/* Sección Dinámica para Transferencia */}
          {metodoPago === MetodosPago.Transferencia && (
            <div className="border border-subtle bg-elevated rounded-xl p-4 space-y-2">
              <span className="text-[10px] uppercase font-sans font-semibold tracking-widest text-muted block">
                ALIAS BANCARIOS DE RECEPCIÓN
              </span>
              <div className="border border-subtle bg-surface rounded-lg p-3 text-xs font-mono space-y-1.5">
                <div className="flex items-center justify-between text-primary">
                  <span>Alias oficial:</span>
                  <code className="text-amber-600 dark:text-amber-400 font-bold bg-elevated rounded px-2 py-0.5 border border-subtle">
                    el de Ale / el del Gordo
                  </code>
                </div>
                <p className="text-[11px] font-sans text-secondary pt-1">
                  Verifica que el cliente muestre el comprobante y coincida con el monto total de{' '}
                  <strong className="text-primary font-mono tabular-nums">{formatearDinero(totalFinal)}</strong> antes de confirmar.
                </p>
              </div>
            </div>
          )}

          {/* Sección Dinámica para Débito (Switch / Descuento) */}
          {metodoPago === MetodosPago.Debito && (
            <div className="border border-subtle bg-elevated rounded-xl p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-xs font-heading font-bold text-primary block">
                    DESCUENTO POR DÉBITO
                  </span>
                  <span className="text-[11px] font-sans text-secondary">
                    Aplica bonificación por pago directo con tarjeta de débito
                  </span>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={aplicarDescuentoDebito}
                    onChange={(e) => setAplicarDescuentoDebito(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-surface rounded-full peer-focus:outline-none border border-subtle peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-primary after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600 peer-checked:after:bg-white" />
                </label>
              </div>

              {aplicarDescuentoDebito && (
                <div className="pt-2 border-t border-subtle flex items-center justify-between text-xs font-mono">
                  <div className="flex items-center gap-2">
                    <span className="text-secondary">Descuento:</span>
                    <select
                      value={porcentajeDescuentoDebito}
                      onChange={(e) => setPorcentajeDescuentoDebito(Number(e.target.value))}
                      className="bg-surface border border-subtle rounded-md text-emerald-600 dark:text-emerald-400 font-bold px-2 py-1 text-xs outline-none"
                    >
                      <option value={5}>-5%</option>
                      <option value={10}>-10%</option>
                      <option value={15}>-15%</option>
                    </select>
                  </div>
                  <span className="text-emerald-600 dark:text-emerald-400 font-bold tabular-nums">
                    Ahorro: -{formatearDinero(subtotalOriginal * (porcentajeDescuentoDebito / 100))}
                  </span>
                </div>
              )}
            </div>
          )}

          {/* Sección Dinámica para Crédito (Switch / Interés del 25%) */}
          {metodoPago === MetodosPago.Credito && (
            <div className="border border-subtle bg-elevated rounded-xl p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-xs font-heading font-bold text-primary block">
                    RECARGO DE CRÉDITO (INTERÉS 25%)
                  </span>
                  <span className="text-[11px] font-sans text-secondary">
                    Regla de negocio: +25% de interés financiero para pagos con tarjeta de crédito
                  </span>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={aplicarInteresCredito}
                    onChange={(e) => setAplicarInteresCredito(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-surface rounded-full peer-focus:outline-none border border-subtle peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-primary after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-amber-500 peer-checked:after:bg-white" />
                </label>
              </div>

              {aplicarInteresCredito && (
                <div className="pt-2 border-t border-subtle flex items-center justify-between text-xs font-mono">
                  <span className="text-secondary">Recargo financiero (+25%):</span>
                  <span className="text-amber-600 dark:text-amber-400 font-bold tabular-nums">
                    +{formatearDinero(subtotalOriginal * 0.25)}
                  </span>
                </div>
              )}
            </div>
          )}

          {/* Sección Dinámica para Efectivo (Paga Con + Vuelto) */}
          {metodoPago === MetodosPago.Efectivo && (
            <div className="border border-subtle bg-elevated rounded-xl p-4 space-y-4">
              <div>
                <div className="flex justify-between items-center mb-1.5">
                  <label className="text-[10px] uppercase font-sans font-semibold tracking-wider text-secondary">
                    MONTO RECIBIDO DEL CLIENTE
                  </label>
                  <button
                    type="button"
                    onClick={() => setPagaCon(totalFinal.toString())}
                    className="text-[10px] font-mono font-bold text-primary underline cursor-pointer hover:text-secondary"
                  >
                    EXACTO
                  </button>
                </div>
                <div className="flex items-center border border-subtle focus-within:border-strong bg-surface rounded-lg px-3 py-2 transition-colors">
                  <span className="text-sm font-mono text-muted mr-2">$</span>
                  <input
                    type="number"
                    min="0"
                    step="100"
                    value={pagaCon}
                    onChange={(e) => setPagaCon(e.target.value)}
                    placeholder={totalFinal.toString()}
                    className="bg-transparent text-base font-mono font-bold text-primary outline-none w-full tabular-nums"
                    autoFocus
                  />
                </div>

                {/* Accesos Rápidos */}
                <div className="flex items-center gap-2 mt-2 flex-wrap">
                  {[1000, 2000, 5000, 10000, 20000].map((monto) => (
                    <button
                      key={monto}
                      type="button"
                      onClick={() => agregarEfectivo(monto)}
                      className="px-2 py-0.5 rounded border border-subtle bg-surface text-[10px] font-mono text-secondary hover:text-primary hover:border-strong transition-colors cursor-pointer tabular-nums"
                    >
                      +${monto.toLocaleString('es-AR')}
                    </button>
                  ))}
                </div>
              </div>

              {/* Display de Vuelto en Vivo */}
              <div className="border-t border-subtle pt-3 flex items-center justify-between">
                <div>
                  <span className="text-[10px] uppercase font-sans tracking-widest text-muted block">
                    VUELTO / CAMBIO A ENTREGAR
                  </span>
                  <span
                    className={`font-mono text-lg font-bold tabular-nums ${
                      dineroInsuficiente ? 'text-red-600 dark:text-red-400' : 'text-emerald-600 dark:text-emerald-400'
                    }`}
                  >
                    {dineroInsuficiente
                      ? `Faltan ${formatearDinero(totalFinal - pagaConNum)}`
                      : formatearDinero(vuelto)}
                  </span>
                </div>
                {!dineroInsuficiente && vuelto > 0 && (
                  <span className="text-[10px] font-mono font-bold bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 rounded-md px-2 py-1">
                    CAMBIO LISTO
                  </span>
                )}
              </div>
            </div>
          )}

          {/* Test helper discreto para simular sábado */}
          <div className="flex items-center justify-between text-[10px] text-muted font-mono pt-1">
            <span>Día detectado: {hoyEsSabadoReal ? 'SÁBADO (Activo)' : 'Día de semana'}</span>
            <button
              type="button"
              onClick={() => setSimularSabado(!simularSabado)}
              className="hover:text-primary underline cursor-pointer"
            >
              {simularSabado ? 'Modo normal' : 'Simular sábado'}
            </button>
          </div>

          {/* Acciones */}
          <div className="flex items-center gap-3 mt-1">
            <Button
              type="button"
              variant="secondary"
              size="lg"
              onClick={onClose}
              disabled={isLoading}
              className="w-1/3 text-xs font-mono"
            >
              CANCELAR [ESC]
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="lg"
              disabled={isLoading || dineroInsuficiente}
              className="w-2/3 font-heading font-bold tracking-wide flex items-center justify-center gap-2"
            >
              <span>{isLoading ? 'PROCESANDO COBRO...' : 'CONFIRMAR COBRO'}</span>
              <ArrowRight size={16} weight="bold" />
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
