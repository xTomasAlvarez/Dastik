import React, { useState, useEffect, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'motion/react';
import {
  Receipt,
  ShoppingCart,
  Trash,
  CheckCircle,
  X,
  Barcode,
  Package,
  CaretRight,
  CaretLeft,
} from '@phosphor-icons/react';
import { PosHeader } from '../components/PosHeader';
import { CatalogoGrid } from '../components/CatalogoGrid';
import { ModalAbrirTurno } from '../components/ModalAbrirTurno';
import { ModalPago } from '../components/ModalPago';
import { ModalCerrarTurno } from '../components/ModalCerrarTurno';
import { ModalCambio } from '../components/ModalCambio';
import { cajaApi } from '../api/cajaApi';
import { type RegistrarCambioResponse } from '../api/posApi';
import { useCartStore } from '../stores/useCartStore';
import { Button } from '../../../components/ui/Button';
import { queryClient } from '../../../lib/react-query/queryClient';

export const DashboardPos: React.FC = () => {
  const { items, removeItem, updateQuantity, clearCart, getTotal, getItemCount } =
    useCartStore();

  const [isModalPagoOpen, setIsModalPagoOpen] = useState(false);
  const [isModalCerrarTurnoOpen, setIsModalCerrarTurnoOpen] = useState(false);
  const [isModalCambioOpen, setIsModalCambioOpen] = useState(false);
  const [confirmandoVaciar, setConfirmandoVaciar] = useState(false);
  const vaciarTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [isCartCollapsed, setIsCartCollapsed] = useState<boolean>(() => {
    try {
      return localStorage.getItem('dastik_pos_cart_collapsed') === 'true';
    } catch {
      return false;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem('dastik_pos_cart_collapsed', String(isCartCollapsed));
    } catch {
      // ignore
    }
  }, [isCartCollapsed]);

  const [ventaExitosa, setVentaExitosa] = useState<{
    ordenId: number;
    total: number;
    vuelto: number;
  } | null>(null);

  const [cambioExitoso, setCambioExitoso] = useState<RegistrarCambioResponse | null>(
    null
  );

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

  // Manejo de confirmación en dos pasos para vaciar ticket
  const handleVaciarClick = () => {
    if (!confirmandoVaciar) {
      setConfirmandoVaciar(true);
      if (vaciarTimerRef.current) clearTimeout(vaciarTimerRef.current);
      vaciarTimerRef.current = setTimeout(() => {
        setConfirmandoVaciar(false);
      }, 3500);
    } else {
      clearCart();
      setConfirmandoVaciar(false);
      if (vaciarTimerRef.current) clearTimeout(vaciarTimerRef.current);
    }
  };

  // Limpiar timer de vaciado al desmontar
  useEffect(() => {
    return () => {
      if (vaciarTimerRef.current) clearTimeout(vaciarTimerRef.current);
    };
  }, []);

  // Atajos de teclado POS: F2 para cobrar orden / Ctrl + B para alternar panel derecho
  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      // Toggle de panel orden en curso con Ctrl + B
      if ((e.ctrlKey || e.metaKey) && (e.key === 'b' || e.key === 'B')) {
        e.preventDefault();
        setIsCartCollapsed((prev) => !prev);
        return;
      }

      if (
        (e.key === 'F2' || e.key === 'F4') &&
        items.length > 0 &&
        turnoActivo &&
        !isModalPagoOpen &&
        !isModalCerrarTurnoOpen
      ) {
        e.preventDefault();
        setIsCartCollapsed(false); // Despliega automáticamente si estaba minimizado
        setIsModalPagoOpen(true);
      }
    };

    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, [items.length, turnoActivo, isModalPagoOpen, isModalCerrarTurnoOpen]);

  return (
    <div className="h-full w-full bg-canvas text-primary flex flex-col overflow-hidden">
      {/* 1. Header Superior */}
      <PosHeader
        turnoActivo={turnoActivo}
        onSolicitarCierreTurno={() => setIsModalCerrarTurnoOpen(true)}
        onSolicitarCambio={() => setIsModalCambioOpen(true)}
      />

      {/* 2. Banner de Venta Exitosa */}
      {ventaExitosa && (
        <div className="bg-emerald-500/10 border-b border-emerald-500/30 px-6 py-3 flex items-center justify-between text-xs font-sans">
          <div className="flex items-center gap-3">
            <CheckCircle size={20} weight="duotone" className="text-emerald-500 shrink-0" />
            <div>
              <span className="text-[11px] uppercase tracking-wider text-emerald-600 dark:text-emerald-400 font-bold block">
                Venta Asentada · Orden #{ventaExitosa.ordenId}
              </span>
              <span className="text-xs font-semibold text-primary font-mono tabular-nums">
                Monto cobrado: {formatearDinero(ventaExitosa.total)}
                {ventaExitosa.vuelto > 0 && (
                  <span className="text-emerald-600 dark:text-emerald-300 ml-2">
                    (Vuelto entregado: {formatearDinero(ventaExitosa.vuelto)})
                  </span>
                )}
              </span>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setVentaExitosa(null)}
            className="text-muted hover:text-primary p-1 rounded-md cursor-pointer"
            title="Descartar aviso"
          >
            <X size={16} weight="regular" />
          </button>
        </div>
      )}

      {/* 2.1 Banner de Cambio Exitoso */}
      {cambioExitoso && (
        <div className="bg-amber-500/10 border-b border-amber-500/30 px-6 py-3 flex items-center justify-between text-xs font-sans">
          <div className="flex items-center gap-3">
            <CheckCircle size={20} weight="duotone" className="text-amber-500 shrink-0" />
            <div>
              <span className="text-[11px] uppercase tracking-wider text-amber-600 dark:text-amber-400 font-bold block">
                Cambio de Prenda Asentado · Operación #{cambioExitoso.ordenId} — {cambioExitoso.motivoCambio}
              </span>
              <span className="text-xs font-semibold text-primary font-mono tabular-nums">
                {cambioExitoso.diferencia === 0
                  ? 'Cambio mano a mano ($0 diferencia). Stock actualizado.'
                  : cambioExitoso.diferencia > 0
                  ? `Diferencia cobrada: ${formatearDinero(cambioExitoso.montoCobrado)} (${
                      cambioExitoso.metodoPago === 1
                        ? 'Efectivo'
                        : cambioExitoso.metodoPago === 2
                        ? 'Transferencia'
                        : cambioExitoso.metodoPago === 4
                        ? 'Débito'
                        : 'Crédito'
                    })`
                  : `Saldo a favor del cliente registrado: ${formatearDinero(
                      Math.abs(cambioExitoso.diferencia)
                    )}`}
              </span>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setCambioExitoso(null)}
            className="text-muted hover:text-primary p-1 rounded-md cursor-pointer"
            title="Descartar aviso"
          >
            <X size={16} weight="regular" />
          </button>
        </div>
      )}

      {/* 3. Área Principal Dividida 70% / 30% */}
      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden relative">
        {/* ======================================================== */}
        {/* PANEL IZQUIERDO: Omnibar + Grilla Retail Paginada        */}
        {/* ======================================================== */}
        <main
          className={`w-full flex-1 flex flex-col overflow-y-auto p-3.5 md:p-4 transition-all duration-300 ${
            isCartCollapsed ? 'lg:w-full' : 'lg:w-[70%]'
          }`}
        >
          <CatalogoGrid />
        </main>

        {/* ======================================================== */}
        {/* PANEL DERECHO: Ticket de Venta en Vivo (PosCart)         */}
        {/* ======================================================== */}
        <AnimatePresence>
          {!isCartCollapsed && (
            <motion.aside
              key="pos-cart-panel"
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: 'auto', opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 380, damping: 32 }}
              className="w-full lg:w-[30%] lg:min-w-[360px] lg:max-w-[420px] border-t lg:border-t-0 lg:border-l border-subtle bg-surface flex flex-col h-full shrink-0 shadow-surface overflow-hidden"
            >
              {/* Header del Ticket */}
              <div className="px-4 py-3.5 border-b border-subtle flex items-center justify-between bg-surface">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-lg bg-elevated border border-subtle text-primary">
                    <Receipt size={18} weight="duotone" className="text-amber-500" />
                  </div>
                  <div>
                    <h3 className="font-heading text-xs font-bold tracking-wide text-primary uppercase">
                      Orden en Curso
                    </h3>
                    <span className="text-[11px] text-muted font-mono tabular-nums block">
                      {itemCount} {itemCount === 1 ? 'artículo' : 'artículos'}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-1.5">
                  {items.length > 0 && (
                    <>
                      {confirmandoVaciar && (
                        <button
                          type="button"
                          onClick={() => {
                            setConfirmandoVaciar(false);
                            if (vaciarTimerRef.current) clearTimeout(vaciarTimerRef.current);
                          }}
                          className="text-[11px] font-medium px-2 py-1 rounded-md border border-subtle bg-elevated text-secondary hover:text-primary transition-fast cursor-pointer"
                        >
                          Cancelar
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={handleVaciarClick}
                        className={`text-[11px] font-semibold flex items-center gap-1 cursor-pointer transition-fast px-2.5 py-1 rounded-md border ${
                          confirmandoVaciar
                            ? 'bg-red-500/15 border-red-500/50 text-red-600 dark:text-red-300'
                            : 'border-transparent text-red-500 hover:bg-red-500/10'
                        }`}
                        title={
                          confirmandoVaciar
                            ? 'Clic para confirmar vaciado de ticket'
                            : 'Vaciar ticket actual'
                        }
                      >
                        <Trash size={14} weight={confirmandoVaciar ? 'bold' : 'regular'} />
                        <span>{confirmandoVaciar ? '¿Vaciar?' : 'Vaciar'}</span>
                      </button>
                    </>
                  )}

                  {/* Botón Minimizar Panel */}
                  <button
                    type="button"
                    onClick={() => setIsCartCollapsed(true)}
                    className="p-1.5 rounded-lg border border-subtle bg-elevated hover:bg-surface text-secondary hover:text-primary transition-fast cursor-pointer active:scale-95 ml-1"
                    title="Minimizar orden en curso [Ctrl + B]"
                  >
                    <CaretRight size={15} weight="bold" />
                  </button>
                </div>
              </div>

          {/* Lista de Artículos en el Carrito Animada con Miniatura y EAN-13 */}
          <div className="flex-1 overflow-y-auto p-3.5 space-y-2.5">
            {items.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-8 rounded-xl border border-dashed border-subtle bg-elevated/30">
                <ShoppingCart size={34} weight="duotone" className="text-muted mb-3" />
                <span className="text-xs font-heading font-semibold text-primary block">
                  Ticket vacío
                </span>
                <p className="text-xs font-sans text-muted mt-1 max-w-[230px]">
                  Escanea un código EAN-13 en la barra superior o toca un talle para agregarlo al ticket.
                </p>
              </div>
            ) : (
              <AnimatePresence initial={false}>
                {items.map((item) => (
                  <motion.div
                    key={item.varianteId}
                    layout
                    initial={{ opacity: 0, y: -8, scale: 0.98 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, x: 24, scale: 0.96 }}
                    transition={{ duration: 0.16, ease: 'easeOut' }}
                    className="rounded-xl border border-subtle bg-elevated/60 p-3 flex flex-col gap-2.5 text-left"
                  >
                    <div className="flex items-start justify-between gap-2.5">
                      {/* Miniatura real de la prenda */}
                      <div className="w-10 h-10 rounded-lg border border-subtle bg-surface overflow-hidden shrink-0 flex items-center justify-center">
                        {item.imagenUrl ? (
                          <img
                            src={item.imagenUrl}
                            alt={item.nombreProducto}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              e.currentTarget.style.display = 'none';
                            }}
                          />
                        ) : (
                          <Package size={18} weight="duotone" className="text-muted" />
                        )}
                      </div>

                      {/* Datos del artículo + Código EAN-13 visible */}
                      <div className="flex-1 min-w-0">
                        <h4 className="font-heading text-xs font-bold text-primary leading-snug truncate">
                          {item.nombreProducto}
                        </h4>

                        <div className="flex flex-wrap items-center gap-1.5 mt-1 text-[10px] font-mono tabular-nums text-secondary">
                          <span className="rounded border border-subtle bg-surface px-1.5 py-0.5 font-semibold text-primary">
                            Talle {item.talle}
                          </span>
                          <span className="rounded border border-subtle bg-surface px-1.5 py-0.5">
                            {item.color}
                          </span>
                          {item.codigoBarras && (
                            <span
                              className="inline-flex items-center gap-1 rounded border border-subtle bg-surface px-1.5 py-0.5 text-muted select-all"
                              title="Código EAN-13 del artículo"
                            >
                              <Barcode size={11} weight="bold" className="text-amber-500" />
                              {item.codigoBarras}
                            </span>
                          )}
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => removeItem(item.varianteId)}
                        className="text-muted hover:text-red-500 hover:bg-red-500/10 rounded-md transition-fast cursor-pointer p-1 shrink-0"
                        title="Eliminar de la orden"
                      >
                        <Trash size={14} weight="regular" />
                      </button>
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-subtle">
                      {/* Control de cantidad */}
                      <div className="flex items-center rounded-lg border border-subtle bg-surface overflow-hidden">
                        <button
                          type="button"
                          onClick={() =>
                            updateQuantity(item.varianteId, item.cantidad - 1)
                          }
                          className="px-2.5 py-1 text-xs font-bold text-primary hover:bg-elevated transition-fast cursor-pointer"
                        >
                          −
                        </button>
                        <span className="px-2.5 py-1 text-xs font-mono tabular-nums font-semibold text-primary border-x border-subtle">
                          {item.cantidad}
                        </span>
                        <button
                          type="button"
                          onClick={() =>
                            updateQuantity(item.varianteId, item.cantidad + 1)
                          }
                          disabled={item.cantidad >= item.stockFisico}
                          className="px-2.5 py-1 text-xs font-bold text-primary hover:bg-elevated disabled:opacity-30 disabled:cursor-not-allowed transition-fast cursor-pointer"
                        >
                          +
                        </button>
                      </div>

                      {/* Subtotal del item */}
                      <div className="text-right">
                        <span className="text-sm font-mono tabular-nums font-bold text-primary">
                          {formatearDinero(item.precioUnitario * item.cantidad)}
                        </span>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            )}
          </div>

          {/* Footer de Totales y Acción de Cobro */}
          <div className="border-t border-subtle bg-elevated/50 p-4 flex flex-col gap-3">
            <div className="flex justify-between items-center text-xs font-sans text-secondary">
              <span className="font-medium">Subtotal</span>
              <span className="font-mono tabular-nums font-semibold text-primary">
                {formatearDinero(total)}
              </span>
            </div>

            <div className="flex justify-between items-baseline border-t border-subtle pt-2.5">
              <span className="font-heading text-xs font-bold tracking-wide text-primary uppercase">
                Total a Cobrar
              </span>
              <span className="font-mono tabular-nums text-xl md:text-2xl font-bold text-primary tracking-tight">
                {formatearDinero(total)}
              </span>
            </div>

            <Button
              variant="primary"
              size="lg"
              className="w-full mt-1 font-semibold rounded-xl shadow-surface"
              disabled={items.length === 0 || !turnoActivo}
              onClick={() => setIsModalPagoOpen(true)}
            >
              {!turnoActivo
                ? 'Turno de Caja Cerrado'
                : `Cobrar Orden [F2] ${items.length > 0 ? `· ${formatearDinero(total)}` : ''}`}
            </Button>
          </div>
        </motion.aside>
      )}
    </AnimatePresence>

    {/* Dock Flotante cuando el panel está Minimizado */}
    <AnimatePresence>
      {isCartCollapsed && (
        <motion.button
          type="button"
          initial={{ opacity: 0, scale: 0.9, y: 16 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 16 }}
          transition={{ type: 'spring', stiffness: 420, damping: 28 }}
          onClick={() => setIsCartCollapsed(false)}
          className="fixed right-6 bottom-6 z-40 rounded-2xl border border-subtle bg-surface/95 backdrop-blur-md hover:border-amber-500/60 shadow-floating px-4 py-3 flex items-center gap-3.5 group cursor-pointer transition-all active:scale-[0.98]"
          title="Desplegar orden en curso [Ctrl + B]"
        >
          <div className="relative p-2.5 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-500">
            <Receipt size={22} weight="duotone" />
            {itemCount > 0 && (
              <span className="absolute -top-1.5 -right-1.5 min-w-[20px] h-5 px-1 rounded-full bg-amber-500 text-black font-mono text-[11px] font-extrabold flex items-center justify-center shadow-xs">
                {itemCount}
              </span>
            )}
          </div>

          <div className="text-left pr-1">
            <div className="text-[10px] font-heading font-bold uppercase tracking-wider text-muted flex items-center gap-1.5">
              <span>Orden en Curso</span>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            </div>
            <div className="text-base font-mono tabular-nums font-extrabold text-primary">
              {formatearDinero(total)}
            </div>
          </div>

          <div className="p-1 rounded-md text-muted group-hover:text-amber-500 group-hover:translate-x-0.5 transition-all">
            <CaretLeft size={16} weight="bold" />
          </div>
        </motion.button>
      )}
    </AnimatePresence>
  </div>

      {/* 4. Modal Bloqueante de Apertura de Turno */}
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
          queryClient.invalidateQueries({ queryKey: ['catalogo-pos'] });
        }}
      />

      {/* 6. Modal de Arqueo y Cierre de Turno */}
      <ModalCerrarTurno
        isOpen={isModalCerrarTurnoOpen}
        onClose={() => setIsModalCerrarTurnoOpen(false)}
        turnoId={turnoActivo?.turnoId ?? 0}
      />

      {/* 7. Modal de Gestión de Cambios de Prendas */}
      <ModalCambio
        isOpen={isModalCambioOpen}
        onClose={() => setIsModalCambioOpen(false)}
        turnoId={turnoActivo?.turnoId ?? 0}
        onCambioExitoso={(res) => {
          setCambioExitoso(res);
        }}
      />
    </div>
  );
};
