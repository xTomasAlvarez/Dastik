import React, { useState, useEffect } from 'react';
import { CreditCard, Money, WarningCircle, X, ArrowRight } from '@phosphor-icons/react';
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
  const total = getTotal();

  const [metodoPago, setMetodoPago] = useState<MetodoPagoTipo>(MetodosPago.Efectivo);
  const [pagaCon, setPagaCon] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Inicializar "paga con" con el total exacto cuando se abre el modal
  useEffect(() => {
    if (isOpen) {
      setPagaCon(total.toString());
      setError(null);
    }
  }, [isOpen, total]);

  if (!isOpen) return null;

  const formatearDinero = (monto: number) => {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS',
      minimumFractionDigits: 2,
    }).format(monto);
  };

  const pagaConNum = parseFloat(pagaCon) || 0;
  const vuelto = Math.max(0, pagaConNum - total);
  const dineroInsuficiente = metodoPago === MetodosPago.Efectivo && pagaConNum < total;

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
      setError(`El monto entregado (${formatearDinero(pagaConNum)}) es inferior al total.`);
      return;
    }

    setIsLoading(true);
    try {
      const itemsPayload = items.map((i) => ({
        varianteId: i.varianteId,
        cantidad: i.cantidad,
        precioUnitario: i.precioUnitario,
      }));

      const pagosPayload = [
        {
          metodoPago,
          monto: total, // La orden asienta el monto total exacto
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
    <div className="fixed inset-0 z-50 bg-[#000000]/95 flex items-center justify-center p-4">
      <div className="w-full max-w-lg bg-[#090909] border border-[#333333] p-6 md:p-8 flex flex-col gap-6 text-left relative">
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
        <div className="border border-[#222222] bg-[#0E0E0E] p-5 flex flex-col items-center justify-center text-center">
          <span className="text-[10px] uppercase tracking-widest text-[#71717A] font-mono mb-1">
            TOTAL FINAL A COBRAR ({items.length} {items.length === 1 ? 'ARTÍCULO' : 'ARTÍCULOS'})
          </span>
          <span className="font-heading text-3xl md:text-4xl font-extrabold text-[#FAFAFA] tracking-tight">
            {formatearDinero(total)}
          </span>
        </div>

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
          {/* Selector de Método de Pago */}
          <div>
            <span className="text-[10px] uppercase font-sans tracking-widest text-[#71717A] block mb-2">
              MÉTODO DE PAGO
            </span>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => {
                  setMetodoPago(MetodosPago.Efectivo);
                  setPagaCon(total.toString());
                }}
                className={`
                  border p-3 flex items-center justify-center gap-2.5 transition-fast cursor-pointer
                  ${
                    metodoPago === MetodosPago.Efectivo
                      ? 'border-[#FAFAFA] bg-[#FAFAFA] text-[#000000] font-bold'
                      : 'border-[#222222] bg-[#111111] text-[#A1A1AA] hover:border-[#444444]'
                  }
                `}
              >
                <Money size={20} weight="light" />
                <span className="font-heading text-xs uppercase tracking-wider">EFECTIVO</span>
              </button>

              <button
                type="button"
                onClick={() => setMetodoPago(MetodosPago.Tarjeta)}
                className={`
                  border p-3 flex items-center justify-center gap-2.5 transition-fast cursor-pointer
                  ${
                    metodoPago === MetodosPago.Tarjeta
                      ? 'border-[#FAFAFA] bg-[#FAFAFA] text-[#000000] font-bold'
                      : 'border-[#222222] bg-[#111111] text-[#A1A1AA] hover:border-[#444444]'
                  }
                `}
              >
                <CreditCard size={20} weight="light" />
                <span className="font-heading text-xs uppercase tracking-wider">TARJETA</span>
              </button>
            </div>
          </div>

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
                    onClick={() => setPagaCon(total.toString())}
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
                    placeholder={total.toString()}
                    className="bg-transparent text-base font-mono font-bold text-[#FAFAFA] outline-none w-full"
                    autoFocus
                  />
                </div>

                {/* Accesos Rápidos */}
                <div className="flex items-center gap-2 mt-2">
                  {[1000, 2000, 5000, 10000].map((monto) => (
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
                      ? `Faltan ${formatearDinero(total - pagaConNum)}`
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

          {/* Acciones */}
          <div className="flex items-center gap-3 mt-2">
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
