import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Receipt, ShoppingCart, Trash, CheckCircle, X } from '@phosphor-icons/react';
import { PosHeader } from '../components/PosHeader';
import { PosBarcodeScanner } from '../components/PosBarcodeScanner';
import { CatalogoGrid } from '../components/CatalogoGrid';
import { ModalAbrirTurno } from '../components/ModalAbrirTurno';
import { ModalPago } from '../components/ModalPago';
import { cajaApi } from '../api/cajaApi';
import { useCartStore } from '../stores/useCartStore';
import { Button } from '../../../components/ui/Button';
import { queryClient } from '../../../lib/react-query/queryClient';

export const DashboardPos: React.FC = () => {
  const { items, removeItem, updateQuantity, clearCart, getTotal, getItemCount } = useCartStore();

  const [isModalPagoOpen, setIsModalPagoOpen] = useState(false);
  const [ventaExitosa, setVentaExitosa] = useState<{
    ordenId: number;
    total: number;
    vuelto: number;
  } | null>(null);

  // 1. Consulta Reactiva del Turno Activo de Caja
  const {
    data: turnoActivo,
    isLoading: isLoadingTurno,
    refetch: refetchTurno,
  } = useQuery({
    queryKey: ['turno-activo'],
    queryFn: cajaApi.obtenerTurnoActivo,
  });

  const total = getTotal();
  const itemCount = getItemCount();

  const formatearDinero = (monto: number) => {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS',
      minimumFractionDigits: 2,
    }).format(monto);
  };

  return (
    <div className="h-screen w-screen bg-[#000000] text-[#FAFAFA] flex flex-col overflow-hidden selection:bg-[#FAFAFA] selection:text-[#000000]">
      {/* 1. Header Superior Arquitectónico */}
      <PosHeader turnoActivo={turnoActivo} />

      {/* 2. Banner de Venta Exitosa (Toast Discreto) */}
      {ventaExitosa && (
        <div className="bg-[#0B150F] border-b border-emerald-600/80 px-6 py-3 flex items-center justify-between text-xs font-mono transition-fast">
          <div className="flex items-center gap-3">
            <CheckCircle size={20} weight="light" className="text-emerald-400 shrink-0" />
            <div>
              <span className="text-[10px] uppercase tracking-widest text-emerald-400 font-bold block">
                VENTA ASENTADA // ORDEN #{ventaExitosa.ordenId}
              </span>
              <span className="text-xs font-heading font-bold text-[#FAFAFA]">
                Monto cobrado: {formatearDinero(ventaExitosa.total)}
                {ventaExitosa.vuelto > 0 && (
                  <span className="text-emerald-300 ml-2">
                    (Vuelto entregado: {formatearDinero(ventaExitosa.vuelto)})
                  </span>
                )}
              </span>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setVentaExitosa(null)}
            className="text-[#71717A] hover:text-[#FAFAFA] p-1 cursor-pointer"
            title="Descartar aviso"
          >
            <X size={16} weight="light" />
          </button>
        </div>
      )}

      {/* 3. Área Principal Dividida 70% / 30% */}
      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
        {/* ======================================================== */}
        {/* PANEL IZQUIERDO (70%): Búsqueda, Scanner y Grilla Retail */}
        {/* ======================================================== */}
        <main className="w-full lg:w-[70%] flex-1 flex flex-col overflow-y-auto p-4 md:p-6 gap-6">
          {/* Lector Óptico de Código de Barras (EAN-13) */}
          <PosBarcodeScanner />

          {/* Catálogo Retail y Grilla de Variantes */}
          <CatalogoGrid />
        </main>

        {/* ======================================================== */}
        {/* PANEL DERECHO (30%): Ticket de Venta en Vivo (PosCart)   */}
        {/* ======================================================== */}
        <aside className="w-full lg:w-[30%] lg:min-w-[360px] lg:max-w-[420px] border-t lg:border-t-0 lg:border-l border-[#333333] bg-[#090909] flex flex-col h-full shrink-0">
          {/* Header del Ticket */}
          <div className="p-4 border-b border-[#333333] flex items-center justify-between bg-[#0B0B0B]">
            <div className="flex items-center gap-2.5">
              <Receipt size={20} weight="light" className="text-[#FAFAFA]" />
              <div>
                <h3 className="font-heading text-xs font-extrabold tracking-wider text-[#FAFAFA] uppercase">
                  ORDEN EN CURSO
                </h3>
                <span className="text-[9px] uppercase tracking-widest text-[#71717A] font-mono block">
                  {itemCount} {itemCount === 1 ? 'ARTÍCULO' : 'ARTÍCULOS'}
                </span>
              </div>
            </div>

            {items.length > 0 && (
              <button
                type="button"
                onClick={clearCart}
                className="text-[10px] uppercase font-sans tracking-widest text-red-400 hover:text-red-300 transition-fast flex items-center gap-1 cursor-pointer"
                title="Vaciar ticket actual"
              >
                <Trash size={14} weight="light" />
                <span>VACIAR</span>
              </button>
            )}
          </div>

          {/* Lista de Artículos en el Carrito */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {items.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-8 border border-dashed border-[#222222]">
                <ShoppingCart size={32} weight="light" className="text-[#444444] mb-3" />
                <span className="text-xs font-heading font-semibold text-[#71717A] uppercase tracking-wider block">
                  TICKET VACÍO
                </span>
                <p className="text-[11px] font-sans text-[#555555] mt-1">
                  Escanea un código de barras o selecciona una prenda de la grilla para iniciar la venta.
                </p>
              </div>
            ) : (
              items.map((item) => (
                <div
                  key={item.varianteId}
                  className="border border-[#222222] bg-[#111111] p-3 flex flex-col gap-2 text-left"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <span className="text-[9px] uppercase tracking-widest text-[#71717A] font-sans block">
                        {item.marca}
                      </span>
                      <h4 className="font-heading text-xs font-bold text-[#FAFAFA] leading-tight">
                        {item.nombreProducto}
                      </h4>
                      <div className="flex items-center gap-2 mt-1 text-[10px] font-mono text-[#A1A1AA]">
                        <span className="border border-[#333333] px-1.5 py-0.2">TALLE: {item.talle}</span>
                        <span className="border border-[#333333] px-1.5 py-0.2">COLOR: {item.color}</span>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => removeItem(item.varianteId)}
                      className="text-[#71717A] hover:text-red-400 transition-fast cursor-pointer p-1"
                      title="Eliminar de la orden"
                    >
                      <Trash size={14} weight="light" />
                    </button>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-[#1A1A1A]">
                    {/* Control de cantidad */}
                    <div className="flex items-center border border-[#333333] bg-[#000000]">
                      <button
                        type="button"
                        onClick={() => updateQuantity(item.varianteId, item.cantidad - 1)}
                        className="px-2 py-1 text-xs text-[#FAFAFA] hover:bg-[#222222] transition-fast cursor-pointer"
                      >
                        -
                      </button>
                      <span className="px-2.5 py-1 text-xs font-mono font-semibold text-[#FAFAFA]">
                        {item.cantidad}
                      </span>
                      <button
                        type="button"
                        onClick={() => updateQuantity(item.varianteId, item.cantidad + 1)}
                        disabled={item.cantidad >= item.stockFisico}
                        className="px-2 py-1 text-xs text-[#FAFAFA] hover:bg-[#222222] disabled:opacity-30 disabled:cursor-not-allowed transition-fast cursor-pointer"
                      >
                        +
                      </button>
                    </div>

                    {/* Subtotal del item */}
                    <div className="text-right">
                      <span className="text-xs font-heading font-extrabold text-[#FAFAFA]">
                        {formatearDinero(item.precioUnitario * item.cantidad)}
                      </span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Footer de Totales y Acción de Cobro */}
          <div className="border-t border-[#333333] bg-[#0E0E0E] p-4 flex flex-col gap-3">
            <div className="flex justify-between items-center text-xs font-sans text-[#71717A]">
              <span className="uppercase tracking-widest">SUBTOTAL</span>
              <span className="font-mono text-[#FAFAFA]">{formatearDinero(total)}</span>
            </div>

            <div className="flex justify-between items-baseline border-t border-[#222222] pt-2">
              <span className="font-heading text-xs font-extrabold tracking-widest text-[#FAFAFA] uppercase">
                TOTAL A COBRAR
              </span>
              <span className="font-heading text-xl md:text-2xl font-extrabold text-[#FAFAFA] tracking-tight">
                {formatearDinero(total)}
              </span>
            </div>

            <Button
              variant="primary"
              size="lg"
              className="w-full mt-2 font-heading font-bold tracking-wider"
              disabled={items.length === 0 || !turnoActivo}
              onClick={() => setIsModalPagoOpen(true)}
            >
              {!turnoActivo
                ? 'TURNO DE CAJA CERRADO'
                : `COBRAR ORDEN ${items.length > 0 ? `(${formatearDinero(total)})` : ''}`}
            </Button>
          </div>
        </aside>
      </div>

      {/* 4. Modal Bloqueante de Apertura de Turno (Si no hay turno activo) */}
      <ModalAbrirTurno
        isOpen={!isLoadingTurno && !turnoActivo}
        onTurnoAbierto={() => {
          refetchTurno();
        }}
      />

      {/* 5. Modal de Cobro y Métodos de Pago */}
      <ModalPago
        isOpen={isModalPagoOpen}
        onClose={() => setIsModalPagoOpen(false)}
        turnoId={turnoActivo?.turnoId ?? 0}
        onVentaExitosa={(res, vuelto) => {
          setVentaExitosa({
            ordenId: res.ordenId,
            total: res.total,
            vuelto,
          });
          // Refrescar inventario en la grilla para reflejar descuento atómico de stock
          queryClient.invalidateQueries({ queryKey: ['catalogo-pos'] });
        }}
      />
    </div>
  );
};
