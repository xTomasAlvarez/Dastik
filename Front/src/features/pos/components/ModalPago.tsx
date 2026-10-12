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
    <div className="fixed inset-0 z-50 bg-[#000000]/95 flex items-center justify-center p-4 overflow-y-auto">
      <div className="w-full max-w-lg bg-[#090909] border border-[#333333] p-6 md:p-8 flex flex-col gap-6 text-left relative my-auto shadow-2xl">
        {/* Header del Modal */}
        <div className="flex items-start justify-between border-b border-[#222222] pb-4">
          <div>
            <span className="text-[10px] uppercase tracking-[0.25em] text-[#71717A] font-mono block">
              TERMINAL POS // COBRO DE TICKET
            </span>
            <h2 className="text-xl font-heading font-extrabold text-[#FAFAFA] tracking-tight">
              FINALIZAR VENTA
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-[#71717A] hover:text-[#FAFAFA] transition-fast p-1 cursor-pointer"
            title="Cancelar y volver al POS"
          >
            <X size={18} weight="light" />
          </button>
        </div>

        {/* Display Gigante del Total a Cobrar */}
        <div className="border border-[#222222] bg-[#0E0E0E] p-5 flex flex-col items-center justify-center text-center relative overflow-hidden">
          <span className="text-[10px] uppercase tracking-widest text-[#71717A] font-mono mb-1">
            TOTAL FINAL A COBRAR ({items.length} {items.length === 1 ? 'ARTÍCULO' : 'ARTÍCULOS'})
          </span>
          <span className="font-heading text-3xl md:text-4xl font-extrabold text-[#FAFAFA] tracking-tight">
            {formatearDinero(totalFinal)}
          </span>
          {subtotalOriginal !== totalFinal && (
            <span className="text-xs font-mono text-[#71717A] mt-1 line-through">
              Subtotal base: {formatearDinero(subtotalOriginal)}
            </span>
          )}
        </div>

        {/* ALERTA DESTACADA: Comisión de Sábado */}
        {calificaComisionSabado && (
          <div className="border border-amber-500/80 bg-gradient-to-r from-amber-950/50 to-orange-950/40 p-3.5 flex items-center justify-between gap-3 text-amber-200 shadow-lg animate-pulse">
            <div className="flex items-center gap-2.5">
              <Flame size={22} weight="fill" className="text-amber-400 shrink-0" />
              <div>
                <span className="text-xs font-heading font-extrabold tracking-wider block text-amber-300">
                  🔥 VENTA CALIFICADA: 5% COMISIÓN PARA EMPLEADO
                </span>
                <span className="text-[11px] font-sans text-amber-200/90">
                  Venta en sábado mayor a $120.000 · Comisión ganada:{' '}
                  <strong className="text-[#FAFAFA] font-mono">{formatearDinero(montoComisionEmpleado)}</strong>
                </span>
              </div>
            </div>
          </div>
        )}

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

        <form onSubmit={handlePagar} className="flex flex-col gap-5">
          {/* Selector de Métodos de Pago Reales (4 Métodos Exactos) */}
          <div>
            <span className="text-[10px] uppercase font-sans tracking-widest text-[#71717A] block mb-2">
              MÉTODO DE PAGO
            </span>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              {/* 1. Efectivo */}
              <button
                type="button"
                onClick={() => setMetodoPago(MetodosPago.Efectivo)}
                className={`
                  border p-2.5 flex flex-col items-center justify-center gap-1.5 transition-fast cursor-pointer
                  ${
                    metodoPago === MetodosPago.Efectivo
                      ? 'border-[#FAFAFA] bg-[#FAFAFA] text-[#000000] font-bold'
                      : 'border-[#222222] bg-[#111111] text-[#A1A1AA] hover:border-[#444444]'
                  }
                `}
              >
                <Money size={20} weight={metodoPago === MetodosPago.Efectivo ? 'bold' : 'light'} />
                <span className="font-heading text-[11px] uppercase tracking-wider">EFECTIVO</span>
              </button>

              {/* 2. Transferencia */}
              <button
                type="button"
                onClick={() => setMetodoPago(MetodosPago.Transferencia)}
                className={`
                  border p-2.5 flex flex-col items-center justify-center gap-1.5 transition-fast cursor-pointer
                  ${
                    metodoPago === MetodosPago.Transferencia
                      ? 'border-[#FAFAFA] bg-[#FAFAFA] text-[#000000] font-bold'
                      : 'border-[#222222] bg-[#111111] text-[#A1A1AA] hover:border-[#444444]'
                  }
                `}
              >
                <ArrowsLeftRight size={20} weight={metodoPago === MetodosPago.Transferencia ? 'bold' : 'light'} />
                <span className="font-heading text-[11px] uppercase tracking-wider">TRANSF.</span>
              </button>

              {/* 3. Débito */}
              <button
                type="button"
                onClick={() => setMetodoPago(MetodosPago.Debito)}
                className={`
                  border p-2.5 flex flex-col items-center justify-center gap-1.5 transition-fast cursor-pointer
                  ${
                    metodoPago === MetodosPago.Debito
                      ? 'border-[#FAFAFA] bg-[#FAFAFA] text-[#000000] font-bold'
                      : 'border-[#222222] bg-[#111111] text-[#A1A1AA] hover:border-[#444444]'
                  }
                `}
              >
                <CreditCard size={20} weight={metodoPago === MetodosPago.Debito ? 'bold' : 'light'} />
                <span className="font-heading text-[11px] uppercase tracking-wider">DÉBITO</span>
              </button>

              {/* 4. Crédito */}
              <button
                type="button"
                onClick={() => setMetodoPago(MetodosPago.Credito)}
                className={`
                  border p-2.5 flex flex-col items-center justify-center gap-1.5 transition-fast cursor-pointer
                  ${
                    metodoPago === MetodosPago.Credito
                      ? 'border-[#FAFAFA] bg-[#FAFAFA] text-[#000000] font-bold'
                      : 'border-[#222222] bg-[#111111] text-[#A1A1AA] hover:border-[#444444]'
                  }
                `}
              >
                <Percent size={20} weight={metodoPago === MetodosPago.Credito ? 'bold' : 'light'} />
                <span className="font-heading text-[11px] uppercase tracking-wider">CRÉDITO</span>
              </button>
            </div>
          </div>

          {/* Sección Dinámica para Transferencia */}
          {metodoPago === MetodosPago.Transferencia && (
            <div className="border border-[#2E2E2E] bg-[#111111] p-4 space-y-2">
              <span className="text-[10px] uppercase font-sans tracking-widest text-[#71717A] block">
                ALIAS BANCARIOS DE RECEPCIÓN
              </span>
              <div className="border border-[#1F1F1F] bg-[#0A0A0A] p-3 text-xs font-mono space-y-1.5">
                <div className="flex items-center justify-between text-[#FAFAFA]">
                  <span>Alias oficial:</span>
                  <code className="text-amber-300 font-bold bg-[#141414] px-2 py-0.5 border border-[#222222]">
                    el de Ale / el del Gordo
                  </code>
                </div>
                <p className="text-[11px] font-sans text-[#71717A] pt-1">
                  Verifica que el cliente muestre el comprobante y coincida con el monto total de{' '}
                  <strong className="text-[#FAFAFA]">{formatearDinero(totalFinal)}</strong> antes de confirmar.
                </p>
              </div>
            </div>
          )}

          {/* Sección Dinámica para Débito (Switch / Descuento) */}
          {metodoPago === MetodosPago.Debito && (
            <div className="border border-[#2E2E2E] bg-[#111111] p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-xs font-heading font-bold text-[#FAFAFA] block">
                    DESCUENTO POR DÉBITO
                  </span>
                  <span className="text-[11px] font-sans text-[#71717A]">
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
                  <div className="w-11 h-6 bg-[#222222] peer-focus:outline-none border border-[#444444] peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-[#FAFAFA] after:border-gray-300 after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-800" />
                </label>
              </div>

              {aplicarDescuentoDebito && (
                <div className="pt-2 border-t border-[#1F1F1F] flex items-center justify-between text-xs font-mono">
                  <div className="flex items-center gap-2">
                    <span className="text-[#71717A]">Descuento:</span>
                    <select
                      value={porcentajeDescuentoDebito}
                      onChange={(e) => setPorcentajeDescuentoDebito(Number(e.target.value))}
                      className="bg-[#0A0A0A] border border-[#333333] text-emerald-400 px-2 py-1 text-xs outline-none"
                    >
                      <option value={5}>-5%</option>
                      <option value={10}>-10%</option>
                      <option value={15}>-15%</option>
                    </select>
                  </div>
                  <span className="text-emerald-400 font-bold">
                    Ahorro: -{formatearDinero(subtotalOriginal * (porcentajeDescuentoDebito / 100))}
                  </span>
                </div>
              )}
            </div>
          )}

          {/* Sección Dinámica para Crédito (Switch / Interés del 25%) */}
          {metodoPago === MetodosPago.Credito && (
            <div className="border border-[#2E2E2E] bg-[#111111] p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-xs font-heading font-bold text-[#FAFAFA] block">
                    RECARGO DE CRÉDITO (INTERÉS 25%)
                  </span>
                  <span className="text-[11px] font-sans text-[#71717A]">
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
                  <div className="w-11 h-6 bg-[#222222] peer-focus:outline-none border border-[#444444] peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-[#FAFAFA] after:border-gray-300 after:h-5 after:w-5 after:transition-all peer-checked:bg-amber-700" />
                </label>
              </div>

              {aplicarInteresCredito && (
                <div className="pt-2 border-t border-[#1F1F1F] flex items-center justify-between text-xs font-mono">
                  <span className="text-[#71717A]">Recargo financiero (+25%):</span>
                  <span className="text-amber-400 font-bold">
                    +{formatearDinero(subtotalOriginal * 0.25)}
                  </span>
                </div>
              )}
            </div>
          )}

          {/* Sección Dinámica para Efectivo (Paga Con + Vuelto) */}
          {metodoPago === MetodosPago.Efectivo && (
            <div className="border border-[#222222] bg-[#111111] p-4 space-y-4">
              <div>
                <div className="flex justify-between items-center mb-1.5">
                  <label className="text-[10px] uppercase font-sans tracking-widest text-[#71717A]">
                    MONTO RECIBIDO DEL CLIENTE
                  </label>
                  <button
                    type="button"
                    onClick={() => setPagaCon(totalFinal.toString())}
                    className="text-[10px] font-mono text-[#FAFAFA] underline cursor-pointer hover:text-[#A1A1AA]"
                  >
                    EXACTO
                  </button>
                </div>
                <div className="flex items-center border border-[#333333] focus-within:border-[#FAFAFA] bg-[#000000] px-3 py-2">
                  <span className="text-sm font-mono text-[#71717A] mr-2">$</span>
                  <input
                    type="number"
                    min="0"
                    step="100"
                    value={pagaCon}
                    onChange={(e) => setPagaCon(e.target.value)}
                    placeholder={totalFinal.toString()}
                    className="bg-transparent text-base font-mono font-bold text-[#FAFAFA] outline-none w-full"
                    autoFocus
                  />
                </div>

                {/* Accesos Rápidos */}
                <div className="flex items-center gap-2 mt-2">
                  {[1000, 2000, 5000, 10000, 20000].map((monto) => (
                    <button
                      key={monto}
                      type="button"
                      onClick={() => agregarEfectivo(monto)}
                      className="px-2 py-0.5 border border-[#222222] bg-[#090909] text-[9px] font-mono text-[#71717A] hover:text-[#FAFAFA] hover:border-[#444444] transition-fast cursor-pointer"
                    >
                      +${monto.toLocaleString('es-AR')}
                    </button>
                  ))}
                </div>
              </div>

              {/* Display de Vuelto en Vivo */}
              <div className="border-t border-[#1F1F1F] pt-3 flex items-center justify-between">
                <div>
                  <span className="text-[9px] uppercase font-sans tracking-widest text-[#71717A] block">
                    VUELTO / CAMBIO A ENTREGAR
                  </span>
                  <span
                    className={`font-heading text-lg font-extrabold ${
                      dineroInsuficiente ? 'text-red-400' : 'text-emerald-400'
                    }`}
                  >
                    {dineroInsuficiente
                      ? `Faltan ${formatearDinero(totalFinal - pagaConNum)}`
                      : formatearDinero(vuelto)}
                  </span>
                </div>
                {!dineroInsuficiente && vuelto > 0 && (
                  <span className="text-[10px] font-mono bg-emerald-950/40 border border-emerald-900 text-emerald-300 px-2 py-1">
                    CAMBIO LISTO
                  </span>
                )}
              </div>
            </div>
          )}

          {/* Test helper discreto para simular sábado */}
          <div className="flex items-center justify-between text-[9px] text-[#555555] font-mono pt-1">
            <span>Día detectado: {hoyEsSabadoReal ? 'SÁBADO (Activo)' : 'Día de semana'}</span>
            <button
              type="button"
              onClick={() => setSimularSabado(!simularSabado)}
              className="hover:text-[#A1A1AA] underline cursor-pointer"
            >
              {simularSabado ? 'Modo normal' : 'Simular sábado'}
            </button>
          </div>

          {/* Acciones */}
          <div className="flex items-center gap-3 mt-1">
            <button
              type="button"
              onClick={onClose}
              disabled={isLoading}
              className="w-1/3 py-3 border border-[#333333] hover:border-[#555555] bg-transparent text-xs font-mono uppercase tracking-wider text-[#A1A1AA] hover:text-[#FAFAFA] transition-fast cursor-pointer disabled:opacity-40"
            >
              CANCELAR
            </button>
            <Button
              type="submit"
              variant="primary"
              size="lg"
              disabled={isLoading || dineroInsuficiente}
              className="w-2/3 font-heading font-bold tracking-wider flex items-center justify-center gap-2"
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
