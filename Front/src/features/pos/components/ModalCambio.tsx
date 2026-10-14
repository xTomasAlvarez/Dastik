import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  X,
  ArrowsLeftRight,
  Barcode,
  CheckCircle,
  WarningCircle,
  CurrencyDollar,
  CreditCard,
  Bank,
  Money,
  ArrowsClockwise,
} from '@phosphor-icons/react';
import { Button } from '../../../components/ui/Button';
import { inventarioApi, type ProductoCatalogoDto, type VarianteDto } from '../api/inventarioApi';
import { posApi, MetodosPago, type MetodoPagoTipo, type RegistrarCambioResponse } from '../api/posApi';
import { queryClient } from '../../../lib/react-query/queryClient';

interface ModalCambioProps {
  isOpen: boolean;
  onClose: () => void;
  turnoId: number;
  onCambioExitoso?: (res: RegistrarCambioResponse) => void;
}

interface VarianteConProducto extends VarianteDto {
  producto: ProductoCatalogoDto;
}

export const ModalCambio: React.FC<ModalCambioProps> = ({
  isOpen,
  onClose,
  turnoId,
  onCambioExitoso,
}) => {
  // 1. Estados del Wizard de Cambio
  const [pasoActual, setPasoActual] = useState<1 | 2 | 3 | 4>(1);

  // Prenda devuelta (Entra)
  const [busquedaDevuelta, setBusquedaDevuelta] = useState('');
  const [varianteDevuelta, setVarianteDevuelta] = useState<VarianteConProducto | null>(null);
  const [cantidadDevuelta, setCantidadDevuelta] = useState(1);

  // Prenda nueva (Sale)
  const [busquedaNueva, setBusquedaNueva] = useState('');
  const [varianteNueva, setVarianteNueva] = useState<VarianteConProducto | null>(null);
  const [cantidadNueva, setCantidadNueva] = useState(1);

  // Motivo
  const [motivoCambio, setMotivoCambio] = useState('');

  // Liquidación y Método de pago
  const [metodoPago, setMetodoPago] = useState<MetodoPagoTipo>(MetodosPago.Efectivo);
  const [pagaConEfectivo, setPagaConEfectivo] = useState<string>('');
  const [aplicaRecargoCredito, setAplicaRecargoCredito] = useState(false);

  // Estados de operación
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const inputDevueltaRef = useRef<HTMLInputElement>(null);
  const inputNuevaRef = useRef<HTMLInputElement>(null);

  // 2. Consulta del Catálogo para búsqueda de prendas
  const { data: catalogo = [] } = useQuery({
    queryKey: ['catalogo-pos'],
    queryFn: inventarioApi.obtenerCatalogoPos,
    enabled: isOpen,
  });

  // Aplanar todas las variantes con su producto para búsqueda rápida
  const todasLasVariantes = useMemo<VarianteConProducto[]>(() => {
    const list: VarianteConProducto[] = [];
    catalogo.forEach((p) => {
      p.variantes?.forEach((v) => {
        list.push({ ...v, producto: p });
      });
    });
    return list;
  }, [catalogo]);

  // Manejo de tecla Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen && !isSubmitting) {
        onClose();
      }
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, isSubmitting, onClose]);

  // Reset al abrir
  useEffect(() => {
    if (isOpen) {
      setPasoActual(1);
      setBusquedaDevuelta('');
      setVarianteDevuelta(null);
      setCantidadDevuelta(1);
      setBusquedaNueva('');
      setVarianteNueva(null);
      setCantidadNueva(1);
      setMotivoCambio('');
      setMetodoPago(MetodosPago.Efectivo);
      setPagaConEfectivo('');
      setAplicaRecargoCredito(false);
      setErrorMessage(null);
      setIsSubmitting(false);
      setTimeout(() => inputDevueltaRef.current?.focus(), 100);
    }
  }, [isOpen]);

  // Filtrado de variantes devueltas
  const variantesDevueltasFiltradas = useMemo(() => {
    const query = busquedaDevuelta.trim().toLowerCase();
    if (!query) return [];
    return todasLasVariantes
      .filter(
        (v) =>
          v.codigoBarras.toLowerCase().includes(query) ||
          v.producto.nombre.toLowerCase().includes(query) ||
          v.producto.marca.toLowerCase().includes(query) ||
          v.talle.toLowerCase().includes(query) ||
          v.color.toLowerCase().includes(query)
      )
      .slice(0, 8);
  }, [todasLasVariantes, busquedaDevuelta]);

  // Filtrado de variantes nuevas
  const variantesNuevasFiltradas = useMemo(() => {
    const query = busquedaNueva.trim().toLowerCase();
    if (!query) return [];
    return todasLasVariantes
      .filter(
        (v) =>
          v.codigoBarras.toLowerCase().includes(query) ||
          v.producto.nombre.toLowerCase().includes(query) ||
          v.producto.marca.toLowerCase().includes(query) ||
          v.talle.toLowerCase().includes(query) ||
          v.color.toLowerCase().includes(query)
      )
      .slice(0, 8);
  }, [todasLasVariantes, busquedaNueva]);

  // Auto-selección si el escaneo coincide exactamente con un código de barras
  const handleBusquedaDevueltaChange = (val: string) => {
    setBusquedaDevuelta(val);
    const matchExacto = todasLasVariantes.find(
      (v) => v.codigoBarras.trim() === val.trim() && val.trim().length >= 6
    );
    if (matchExacto) {
      setVarianteDevuelta(matchExacto);
      setBusquedaDevuelta('');
    }
  };

  const handleBusquedaNuevaChange = (val: string) => {
    setBusquedaNueva(val);
    const matchExacto = todasLasVariantes.find(
      (v) => v.codigoBarras.trim() === val.trim() && val.trim().length >= 6
    );
    if (matchExacto) {
      setVarianteNueva(matchExacto);
      setBusquedaNueva('');
    }
  };

  // 3. Cálculos de Diferencia y Montos
  const subtotalDevuelto = varianteDevuelta
    ? varianteDevuelta.producto.precioVenta * cantidadDevuelta
    : 0;

  const subtotalNuevo = varianteNueva
    ? varianteNueva.producto.precioVenta * cantidadNueva
    : 0;

  const diferenciaBase = subtotalNuevo - subtotalDevuelto;

  const diferenciaConRecargo =
    diferenciaBase > 0 && metodoPago === MetodosPago.Credito && aplicaRecargoCredito
      ? Math.round(diferenciaBase * 1.25 * 100) / 100
      : diferenciaBase;

  const montoFinalCobrar = diferenciaBase > 0 ? diferenciaConRecargo : 0;

  const vueltoEfectivo = useMemo(() => {
    if (metodoPago !== MetodosPago.Efectivo || montoFinalCobrar <= 0) return 0;
    const pagado = parseFloat(pagaConEfectivo) || 0;
    return Math.max(0, pagado - montoFinalCobrar);
  }, [metodoPago, montoFinalCobrar, pagaConEfectivo]);

  const formatearDinero = (monto: number) => {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS',
      minimumFractionDigits: 2,
    }).format(monto);
  };

  // 4. Confirmación y Envío al Backend
  const handleConfirmarCambio = async () => {
    if (!varianteDevuelta) {
      setErrorMessage('Debe seleccionar la prenda que devuelve el cliente.');
      setPasoActual(1);
      return;
    }
    if (!varianteNueva) {
      setErrorMessage('Debe seleccionar la nueva prenda que lleva el cliente.');
      setPasoActual(2);
      return;
    }
    if (!motivoCambio.trim()) {
      setErrorMessage('El motivo del cambio es obligatorio.');
      setPasoActual(3);
      return;
    }

    if (varianteNueva.stockFisico < cantidadNueva && varianteNueva.id !== varianteDevuelta.id) {
      setErrorMessage(
        `Stock insuficiente para la nueva prenda. Stock disponible: ${varianteNueva.stockFisico}`
      );
      setPasoActual(2);
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      const response = await posApi.registrarCambio({
        turnoId,
        varianteDevueltaId: varianteDevuelta.id,
        cantidadDevuelta,
        varianteNuevaId: varianteNueva.id,
        cantidadNueva,
        motivoCambio: motivoCambio.trim(),
        metodoPagoDiferencia: diferenciaBase > 0 ? metodoPago : null,
        montoDiferenciaPagada: diferenciaBase > 0 ? montoFinalCobrar : 0,
      });

      // Refrescar caché de TanStack Query
      queryClient.invalidateQueries({ queryKey: ['catalogo-pos'] });
      queryClient.invalidateQueries({ queryKey: ['turno-activo'] });
      queryClient.invalidateQueries({ queryKey: ['turnos'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-resumen'] });

      onCambioExitoso?.(response);
      onClose();
    } catch (err: any) {
      const serverMsg =
        err?.response?.data?.error ||
        err?.response?.data?.title ||
        err?.message ||
        'Error al registrar el cambio.';
      setErrorMessage(serverMsg);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/85 backdrop-blur-sm transition-opacity duration-150"
        onClick={() => !isSubmitting && onClose()}
      />

      {/* Modal Dialog Box Avant-Garde */}
      <div className="relative w-full max-w-3xl bg-[#090909] border border-[#333333] text-[#FAFAFA] flex flex-col max-h-[92vh] z-10 animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-[#222222] bg-[#0C0C0C] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 border border-[#333333] bg-[#141414] flex items-center justify-center text-amber-400">
              <ArrowsLeftRight size={18} weight="bold" />
            </div>
            <div>
              <span className="text-[10px] uppercase font-mono tracking-widest text-amber-400 font-bold block">
                TERMINAL DE COBRO // MÓDULO DE CAMBIOS
              </span>
              <h2 className="font-heading font-extrabold text-base sm:text-lg text-[#FAFAFA] tracking-tight uppercase">
                GESTIÓN DE CAMBIO DE PRENDA
              </h2>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="p-1.5 border border-[#333333] bg-[#141414] hover:bg-[#222222] text-[#A1A1AA] hover:text-white transition-fast cursor-pointer"
            title="Cerrar (Esc)"
          >
            <X size={16} weight="light" />
          </button>
        </div>

        {/* Stepper Tabs */}
        <div className="grid grid-cols-4 border-b border-[#222222] bg-[#090909] text-[10px] font-mono uppercase tracking-wider">
          <button
            type="button"
            onClick={() => setPasoActual(1)}
            className={`py-2.5 px-2 border-r border-[#222222] flex items-center justify-center gap-1.5 cursor-pointer transition-fast ${
              pasoActual === 1
                ? 'bg-[#181818] text-[#FAFAFA] font-bold border-b-2 border-b-amber-400'
                : varianteDevuelta
                ? 'text-emerald-400'
                : 'text-[#71717A] hover:text-[#FAFAFA]'
            }`}
          >
            <span>1. DEVUELVE</span>
            {varianteDevuelta && <CheckCircle size={12} weight="bold" className="text-emerald-400" />}
          </button>

          <button
            type="button"
            onClick={() => varianteDevuelta && setPasoActual(2)}
            disabled={!varianteDevuelta}
            className={`py-2.5 px-2 border-r border-[#222222] flex items-center justify-center gap-1.5 transition-fast ${
              !varianteDevuelta
                ? 'opacity-40 cursor-not-allowed text-[#555555]'
                : pasoActual === 2
                ? 'bg-[#181818] text-[#FAFAFA] font-bold border-b-2 border-b-amber-400 cursor-pointer'
                : varianteNueva
                ? 'text-emerald-400 cursor-pointer'
                : 'text-[#71717A] hover:text-[#FAFAFA] cursor-pointer'
            }`}
          >
            <span>2. LLEVA</span>
            {varianteNueva && <CheckCircle size={12} weight="bold" className="text-emerald-400" />}
          </button>

          <button
            type="button"
            onClick={() => varianteDevuelta && varianteNueva && setPasoActual(3)}
            disabled={!varianteDevuelta || !varianteNueva}
            className={`py-2.5 px-2 border-r border-[#222222] flex items-center justify-center gap-1.5 transition-fast ${
              !varianteDevuelta || !varianteNueva
                ? 'opacity-40 cursor-not-allowed text-[#555555]'
                : pasoActual === 3
                ? 'bg-[#181818] text-[#FAFAFA] font-bold border-b-2 border-b-amber-400 cursor-pointer'
                : motivoCambio.trim()
                ? 'text-emerald-400 cursor-pointer'
                : 'text-[#71717A] hover:text-[#FAFAFA] cursor-pointer'
            }`}
          >
            <span>3. MOTIVO</span>
            {motivoCambio.trim() && <CheckCircle size={12} weight="bold" className="text-emerald-400" />}
          </button>

          <button
            type="button"
            onClick={() => varianteDevuelta && varianteNueva && motivoCambio.trim() && setPasoActual(4)}
            disabled={!varianteDevuelta || !varianteNueva || !motivoCambio.trim()}
            className={`py-2.5 px-2 flex items-center justify-center gap-1.5 transition-fast ${
              !varianteDevuelta || !varianteNueva || !motivoCambio.trim()
                ? 'opacity-40 cursor-not-allowed text-[#555555]'
                : pasoActual === 4
                ? 'bg-[#181818] text-[#FAFAFA] font-bold border-b-2 border-b-amber-400 cursor-pointer'
                : 'text-[#71717A] hover:text-[#FAFAFA] cursor-pointer'
            }`}
          >
            <span>4. LIQUIDACIÓN</span>
          </button>
        </div>

        {/* Mensaje de Error si ocurre */}
        {errorMessage && (
          <div className="bg-red-950/70 border-b border-red-800 px-4 py-2 text-xs font-mono text-red-200 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <WarningCircle size={16} weight="bold" className="text-red-400 shrink-0" />
              <span>{errorMessage}</span>
            </div>
            <button
              type="button"
              onClick={() => setErrorMessage(null)}
              className="text-red-400 hover:text-white p-1"
            >
              <X size={14} />
            </button>
          </div>
        )}

        {/* Contenido del Paso */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-5">
          {/* ======================================================== */}
          {/* PASO 1: Prenda que Devuelve (Entra al stock)            */}
          {/* ======================================================== */}
          {pasoActual === 1 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xs font-heading font-extrabold text-[#FAFAFA] uppercase tracking-wider">
                    PASO 1 — PRENDA QUE DEVUELVE (ENTRA AL STOCK)
                  </h3>
                  <p className="text-[11px] font-sans text-[#71717A] mt-0.5">
                    Escanea el código de barras o busca la prenda entregada por el cliente.
                  </p>
                </div>
                <span className="text-[10px] font-mono px-2 py-0.5 border border-emerald-900/60 bg-emerald-950/30 text-emerald-300">
                  +1 STOCK FÍSICO
                </span>
              </div>

              {!varianteDevuelta ? (
                <div className="space-y-3">
                  <div className="relative">
                    <Barcode
                      size={18}
                      weight="light"
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-[#71717A]"
                    />
                    <input
                      ref={inputDevueltaRef}
                      type="text"
                      value={busquedaDevuelta}
                      onChange={(e) => handleBusquedaDevueltaChange(e.target.value)}
                      placeholder="ESCANEAR CÓDIGO EAN-13 O BUSCAR POR NOMBRE / TALLE..."
                      className="w-full bg-[#111111] border border-[#333333] focus:border-[#FAFAFA] text-[#FAFAFA] pl-10 pr-4 py-2.5 text-xs font-mono uppercase tracking-wide placeholder:text-[#555555] outline-none transition-fast"
                      autoFocus
                    />
                  </div>

                  {/* Resultados rápidos de búsqueda */}
                  {busquedaDevuelta.trim() && (
                    <div className="border border-[#222222] bg-[#0C0C0C] divide-y divide-[#1A1A1A] max-h-56 overflow-y-auto">
                      {variantesDevueltasFiltradas.length > 0 ? (
                        variantesDevueltasFiltradas.map((v) => (
                          <button
                            key={v.id}
                            type="button"
                            onClick={() => {
                              setVarianteDevuelta(v);
                              setBusquedaDevuelta('');
                            }}
                            className="w-full p-2.5 flex items-center justify-between hover:bg-[#151515] text-left transition-fast cursor-pointer"
                          >
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 border border-[#333333] bg-[#141414] flex items-center justify-center font-heading font-bold text-xs text-[#FAFAFA]">
                                {v.talle}
                              </div>
                              <div>
                                <span className="text-[10px] font-mono uppercase text-amber-400 block">
                                  {v.producto.marca} // {v.producto.unidadNegocio}
                                </span>
                                <h4 className="text-xs font-heading font-semibold text-[#FAFAFA]">
                                  {v.producto.nombre}
                                </h4>
                                <span className="text-[10px] font-mono text-[#71717A]">
                                  Color: {v.color} | EAN: {v.codigoBarras || 'S/C'}
                                </span>
                              </div>
                            </div>
                            <div className="text-right">
                              <span className="text-xs font-heading font-bold text-[#FAFAFA] block">
                                {formatearDinero(v.producto.precioVenta)}
                              </span>
                              <span className="text-[10px] font-mono text-[#71717A]">
                                Stock actual: {v.stockFisico} u.
                              </span>
                            </div>
                          </button>
                        ))
                      ) : (
                        <div className="p-4 text-center text-xs text-[#71717A]">
                          No se encontraron coincidencias para "{busquedaDevuelta}".
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ) : (
                /* Prenda Devuelta Seleccionada */
                <div className="border border-[#333333] bg-[#111111] p-4 flex flex-col gap-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 border border-[#333333] bg-[#181818] flex items-center justify-center font-heading font-black text-sm text-[#FAFAFA]">
                        {varianteDevuelta.talle}
                      </div>
                      <div>
                        <span className="text-[10px] font-mono uppercase tracking-widest text-amber-400 font-bold block">
                          {varianteDevuelta.producto.marca} // {varianteDevuelta.producto.unidadNegocio}
                        </span>
                        <h4 className="text-sm font-heading font-bold text-[#FAFAFA]">
                          {varianteDevuelta.producto.nombre}
                        </h4>
                        <div className="flex items-center gap-2 mt-1 text-[10px] font-mono text-[#A1A1AA]">
                          <span>COLOR: {varianteDevuelta.color}</span>
                          <span>•</span>
                          <span>EAN: {varianteDevuelta.codigoBarras || 'SIN EAN'}</span>
                          <span>•</span>
                          <span>STOCK ACTUAL: {varianteDevuelta.stockFisico} U.</span>
                        </div>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        setVarianteDevuelta(null);
                        setTimeout(() => inputDevueltaRef.current?.focus(), 100);
                      }}
                      className="text-[10px] font-mono uppercase tracking-wider text-red-400 hover:text-red-300 border border-red-900/60 hover:border-red-500 px-2 py-1 cursor-pointer transition-fast"
                    >
                      CAMBIAR
                    </button>
                  </div>

                  <div className="flex items-center justify-between pt-3 border-t border-[#222222]">
                    <div className="flex items-center gap-2 text-xs">
                      <span className="text-[10px] uppercase font-mono text-[#71717A]">CANTIDAD A DEVOLVER:</span>
                      <div className="flex items-center border border-[#333333]">
                        <button
                          type="button"
                          onClick={() => setCantidadDevuelta(Math.max(1, cantidadDevuelta - 1))}
                          className="px-2 py-0.5 text-xs text-[#FAFAFA] hover:bg-[#222222]"
                        >
                          -
                        </button>
                        <span className="px-3 py-0.5 font-mono text-xs font-bold text-[#FAFAFA]">
                          {cantidadDevuelta}
                        </span>
                        <button
                          type="button"
                          onClick={() => setCantidadDevuelta(cantidadDevuelta + 1)}
                          className="px-2 py-0.5 text-xs text-[#FAFAFA] hover:bg-[#222222]"
                        >
                          +
                        </button>
                      </div>
                    </div>

                    <div className="text-right">
                      <span className="text-[10px] font-mono uppercase text-[#71717A] block">VALOR RECONOCIDO:</span>
                      <span className="text-sm font-heading font-black text-emerald-400">
                        {formatearDinero(subtotalDevuelto)}
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ======================================================== */}
          {/* PASO 2: Prenda que Lleva (Sale del stock)               */}
          {/* ======================================================== */}
          {pasoActual === 2 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xs font-heading font-extrabold text-[#FAFAFA] uppercase tracking-wider">
                    PASO 2 — PRENDA QUE LLEVA (SALE DEL STOCK)
                  </h3>
                  <p className="text-[11px] font-sans text-[#71717A] mt-0.5">
                    Escanea o busca la nueva prenda que el cliente desea llevar.
                  </p>
                </div>
                <span className="text-[10px] font-mono px-2 py-0.5 border border-amber-900/60 bg-amber-950/30 text-amber-300">
                  -1 STOCK FÍSICO
                </span>
              </div>

              {!varianteNueva ? (
                <div className="space-y-3">
                  <div className="relative">
                    <Barcode
                      size={18}
                      weight="light"
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-[#71717A]"
                    />
                    <input
                      ref={inputNuevaRef}
                      type="text"
                      value={busquedaNueva}
                      onChange={(e) => handleBusquedaNuevaChange(e.target.value)}
                      placeholder="ESCANEAR NUEVA PRENDA O BUSCAR POR NOMBRE / TALLE..."
                      className="w-full bg-[#111111] border border-[#333333] focus:border-[#FAFAFA] text-[#FAFAFA] pl-10 pr-4 py-2.5 text-xs font-mono uppercase tracking-wide placeholder:text-[#555555] outline-none transition-fast"
                      autoFocus
                    />
                  </div>

                  {busquedaNueva.trim() && (
                    <div className="border border-[#222222] bg-[#0C0C0C] divide-y divide-[#1A1A1A] max-h-56 overflow-y-auto">
                      {variantesNuevasFiltradas.length > 0 ? (
                        variantesNuevasFiltradas.map((v) => {
                          const stockAgotado = v.stockFisico <= 0 && v.id !== varianteDevuelta?.id;
                          return (
                            <button
                              key={v.id}
                              type="button"
                              disabled={stockAgotado}
                              onClick={() => {
                                setVarianteNueva(v);
                                setBusquedaNueva('');
                              }}
                              className={`w-full p-2.5 flex items-center justify-between text-left transition-fast ${
                                stockAgotado
                                  ? 'opacity-40 cursor-not-allowed bg-[#090909]'
                                  : 'hover:bg-[#151515] cursor-pointer'
                              }`}
                            >
                              <div className="flex items-center gap-3">
                                <div className="w-8 h-8 border border-[#333333] bg-[#141414] flex items-center justify-center font-heading font-bold text-xs text-[#FAFAFA]">
                                  {v.talle}
                                </div>
                                <div>
                                  <span className="text-[10px] font-mono uppercase text-amber-400 block">
                                    {v.producto.marca} // {v.producto.unidadNegocio}
                                  </span>
                                  <h4 className="text-xs font-heading font-semibold text-[#FAFAFA]">
                                    {v.producto.nombre}
                                  </h4>
                                  <span className="text-[10px] font-mono text-[#71717A]">
                                    Color: {v.color} | EAN: {v.codigoBarras || 'S/C'}
                                  </span>
                                </div>
                              </div>
                              <div className="text-right">
                                <span className="text-xs font-heading font-bold text-[#FAFAFA] block">
                                  {formatearDinero(v.producto.precioVenta)}
                                </span>
                                <span
                                  className={`text-[10px] font-mono ${
                                    stockAgotado ? 'text-red-400' : 'text-emerald-400'
                                  }`}
                                >
                                  {stockAgotado ? 'SIN STOCK' : `Stock: ${v.stockFisico} u.`}
                                </span>
                              </div>
                            </button>
                          );
                        })
                      ) : (
                        <div className="p-4 text-center text-xs text-[#71717A]">
                          No se encontraron prendas para "{busquedaNueva}".
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ) : (
                /* Prenda Nueva Seleccionada */
                <div className="border border-[#333333] bg-[#111111] p-4 flex flex-col gap-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 border border-[#333333] bg-[#181818] flex items-center justify-center font-heading font-black text-sm text-[#FAFAFA]">
                        {varianteNueva.talle}
                      </div>
                      <div>
                        <span className="text-[10px] font-mono uppercase tracking-widest text-amber-400 font-bold block">
                          {varianteNueva.producto.marca} // {varianteNueva.producto.unidadNegocio}
                        </span>
                        <h4 className="text-sm font-heading font-bold text-[#FAFAFA]">
                          {varianteNueva.producto.nombre}
                        </h4>
                        <div className="flex items-center gap-2 mt-1 text-[10px] font-mono text-[#A1A1AA]">
                          <span>COLOR: {varianteNueva.color}</span>
                          <span>•</span>
                          <span>EAN: {varianteNueva.codigoBarras || 'SIN EAN'}</span>
                          <span>•</span>
                          <span className="text-emerald-400 font-bold">
                            STOCK DISPONIBLE: {varianteNueva.stockFisico} U.
                          </span>
                        </div>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        setVarianteNueva(null);
                        setTimeout(() => inputNuevaRef.current?.focus(), 100);
                      }}
                      className="text-[10px] font-mono uppercase tracking-wider text-red-400 hover:text-red-300 border border-red-900/60 hover:border-red-500 px-2 py-1 cursor-pointer transition-fast"
                    >
                      CAMBIAR
                    </button>
                  </div>

                  <div className="flex items-center justify-between pt-3 border-t border-[#222222]">
                    <div className="flex items-center gap-2 text-xs">
                      <span className="text-[10px] uppercase font-mono text-[#71717A]">CANTIDAD A LLEVAR:</span>
                      <div className="flex items-center border border-[#333333]">
                        <button
                          type="button"
                          onClick={() => setCantidadNueva(Math.max(1, cantidadNueva - 1))}
                          className="px-2 py-0.5 text-xs text-[#FAFAFA] hover:bg-[#222222]"
                        >
                          -
                        </button>
                        <span className="px-3 py-0.5 font-mono text-xs font-bold text-[#FAFAFA]">
                          {cantidadNueva}
                        </span>
                        <button
                          type="button"
                          onClick={() => setCantidadNueva(cantidadNueva + 1)}
                          disabled={cantidadNueva >= varianteNueva.stockFisico && varianteNueva.id !== varianteDevuelta?.id}
                          className="px-2 py-0.5 text-xs text-[#FAFAFA] hover:bg-[#222222] disabled:opacity-30 disabled:cursor-not-allowed"
                        >
                          +
                        </button>
                      </div>
                    </div>

                    <div className="text-right">
                      <span className="text-[10px] font-mono uppercase text-[#71717A] block">VALOR PRENDA NUEVA:</span>
                      <span className="text-sm font-heading font-black text-[#FAFAFA]">
                        {formatearDinero(subtotalNuevo)}
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ======================================================== */}
          {/* PASO 3: Motivo del Cambio                               */}
          {/* ======================================================== */}
          {pasoActual === 3 && (
            <div className="space-y-4">
              <div>
                <h3 className="text-xs font-heading font-extrabold text-[#FAFAFA] uppercase tracking-wider">
                  PASO 3 — MOTIVO DEL CAMBIO (OBLIGATORIO)
                </h3>
                <p className="text-[11px] font-sans text-[#71717A] mt-0.5">
                  Selecciona una opción rápida o escribe el motivo específico de la operación.
                </p>
              </div>

              {/* Botones rápidos (Pills) */}
              <div className="flex flex-wrap gap-2">
                {[
                  'Cambio de Talle',
                  'Cambio de Color',
                  'Regalo',
                  'Falla de Costura',
                  'Preferencia de Modelo',
                ].map((pill) => (
                  <button
                    key={pill}
                    type="button"
                    onClick={() => setMotivoCambio(pill)}
                    className={`text-[11px] font-mono uppercase tracking-wider px-3 py-1.5 border transition-fast cursor-pointer ${
                      motivoCambio === pill
                        ? 'border-amber-400 bg-amber-950/40 text-amber-300 font-bold'
                        : 'border-[#333333] bg-[#111111] text-[#A1A1AA] hover:border-[#555555] hover:text-[#FAFAFA]'
                    }`}
                  >
                    {pill}
                  </button>
                ))}
              </div>

              {/* Input de texto manual */}
              <div>
                <textarea
                  value={motivoCambio}
                  onChange={(e) => setMotivoCambio(e.target.value)}
                  placeholder="ESCRIBE EL MOTIVO DETALLADO DEL CAMBIO..."
                  rows={3}
                  className="w-full bg-[#111111] border border-[#333333] focus:border-[#FAFAFA] text-[#FAFAFA] p-3 text-xs font-mono uppercase tracking-wide placeholder:text-[#555555] outline-none transition-fast"
                  autoFocus
                />
                <span className="text-[10px] font-mono text-[#71717A] mt-1 block">
                  * Este motivo quedará registrado en la auditoría de caja y ventas.
                </span>
              </div>
            </div>
          )}

          {/* ======================================================== */}
          {/* PASO 4: Liquidación de Diferencia                       */}
          {/* ======================================================== */}
          {pasoActual === 4 && (
            <div className="space-y-5">
              <div>
                <h3 className="text-xs font-heading font-extrabold text-[#FAFAFA] uppercase tracking-wider">
                  PASO 4 — LIQUIDACIÓN CONTABLE DE DIFERENCIA
                </h3>
                <p className="text-[11px] font-sans text-[#71717A] mt-0.5">
                  Balance financiero entre la prenda devuelta y la nueva prenda.
                </p>
              </div>

              {/* Resumen de Valores de Ambas Prendas */}
              <div className="grid grid-cols-2 gap-3 border border-[#222222] bg-[#0C0C0C] p-3.5 text-xs font-mono">
                <div>
                  <span className="text-[10px] text-[#71717A] block uppercase">PRENDA DEVUELTA ({cantidadDevuelta}U):</span>
                  <span className="font-bold text-[#FAFAFA] block truncate">{varianteDevuelta?.producto.nombre}</span>
                  <span className="text-emerald-400 font-heading font-bold text-sm">
                    {formatearDinero(subtotalDevuelto)}
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-[10px] text-[#71717A] block uppercase">PRENDA NUEVA ({cantidadNueva}U):</span>
                  <span className="font-bold text-[#FAFAFA] block truncate">{varianteNueva?.producto.nombre}</span>
                  <span className="text-amber-400 font-heading font-bold text-sm">
                    {formatearDinero(subtotalNuevo)}
                  </span>
                </div>
              </div>

              {/* CASO A: Diferencia $0 (Mano a Mano) */}
              {diferenciaBase === 0 && (
                <div className="border border-emerald-600/60 bg-emerald-950/20 p-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <CheckCircle size={24} weight="bold" className="text-emerald-400" />
                    <div>
                      <span className="text-xs font-heading font-black text-emerald-300 uppercase tracking-wider block">
                        CAMBIO MANO A MANO ($0 DIFERENCIA)
                      </span>
                      <span className="text-[11px] font-mono text-[#A1A1AA]">
                        Prendas con el mismo valor de venta. No se altera la caja física.
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* CASO B: Diferencia > $0 (A Pagar por el Cliente) */}
              {diferenciaBase > 0 && (
                <div className="space-y-4 border border-[#333333] bg-[#111111] p-4">
                  <div className="flex items-baseline justify-between border-b border-[#222222] pb-3">
                    <div>
                      <span className="text-[10px] font-mono uppercase tracking-widest text-amber-400 font-bold block">
                        DIFERENCIA A COBRAR AL CLIENTE
                      </span>
                      <span className="text-[11px] font-mono text-[#71717A]">
                        Únicamente este saldo impactará en el arqueo del turno.
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="text-xl md:text-2xl font-heading font-black text-[#FAFAFA]">
                        {formatearDinero(montoFinalCobrar)}
                      </span>
                      {aplicaRecargoCredito && metodoPago === MetodosPago.Credito && (
                        <span className="text-[10px] font-mono text-amber-400 block">
                          (+25% recargo cuotas aplicado)
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Selector de Método de Pago */}
                  <div className="space-y-2">
                    <span className="text-[10px] font-mono uppercase tracking-widest text-[#71717A] block">
                      SELECCIONAR MÉTODO DE PAGO PARA LA DIFERENCIA:
                    </span>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      <button
                        type="button"
                        onClick={() => setMetodoPago(MetodosPago.Efectivo)}
                        className={`p-2.5 border text-xs font-heading font-bold flex flex-col items-center gap-1.5 transition-fast cursor-pointer ${
                          metodoPago === MetodosPago.Efectivo
                            ? 'border-amber-400 bg-amber-950/40 text-amber-300'
                            : 'border-[#333333] bg-[#141414] text-[#A1A1AA] hover:text-[#FAFAFA]'
                        }`}
                      >
                        <Money size={18} weight="light" />
                        <span>EFECTIVO</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setMetodoPago(MetodosPago.Transferencia)}
                        className={`p-2.5 border text-xs font-heading font-bold flex flex-col items-center gap-1.5 transition-fast cursor-pointer ${
                          metodoPago === MetodosPago.Transferencia
                            ? 'border-amber-400 bg-amber-950/40 text-amber-300'
                            : 'border-[#333333] bg-[#141414] text-[#A1A1AA] hover:text-[#FAFAFA]'
                        }`}
                      >
                        <Bank size={18} weight="light" />
                        <span>TRANSFERENCIA</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setMetodoPago(MetodosPago.Debito)}
                        className={`p-2.5 border text-xs font-heading font-bold flex flex-col items-center gap-1.5 transition-fast cursor-pointer ${
                          metodoPago === MetodosPago.Debito
                            ? 'border-amber-400 bg-amber-950/40 text-amber-300'
                            : 'border-[#333333] bg-[#141414] text-[#A1A1AA] hover:text-[#FAFAFA]'
                        }`}
                      >
                        <CreditCard size={18} weight="light" />
                        <span>DÉBITO</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setMetodoPago(MetodosPago.Credito)}
                        className={`p-2.5 border text-xs font-heading font-bold flex flex-col items-center gap-1.5 transition-fast cursor-pointer ${
                          metodoPago === MetodosPago.Credito
                            ? 'border-amber-400 bg-amber-950/40 text-amber-300'
                            : 'border-[#333333] bg-[#141414] text-[#A1A1AA] hover:text-[#FAFAFA]'
                        }`}
                      >
                        <CurrencyDollar size={18} weight="light" />
                        <span>CRÉDITO</span>
                      </button>
                    </div>
                  </div>

                  {/* Detalles específicos del método de pago */}
                  {metodoPago === MetodosPago.Efectivo && (
                    <div className="bg-[#141414] border border-[#222222] p-3 flex items-center justify-between gap-3 text-xs font-mono">
                      <div>
                        <span className="text-[10px] text-[#71717A] uppercase block">PAGA CON ($):</span>
                        <input
                          type="number"
                          value={pagaConEfectivo}
                          onChange={(e) => setPagaConEfectivo(e.target.value)}
                          placeholder={montoFinalCobrar.toString()}
                          className="bg-[#090909] border border-[#333333] text-[#FAFAFA] px-2 py-1 text-xs w-32 outline-none font-bold mt-1"
                        />
                      </div>
                      <div className="text-right">
                        <span className="text-[10px] text-[#71717A] uppercase block">VUELTO A ENTREGAR:</span>
                        <span className="text-sm font-heading font-bold text-emerald-400">
                          {formatearDinero(vueltoEfectivo)}
                        </span>
                      </div>
                    </div>
                  )}

                  {metodoPago === MetodosPago.Transferencia && (
                    <div className="bg-[#141414] border border-[#222222] p-3 text-xs font-mono space-y-1">
                      <span className="text-[10px] text-amber-400 font-bold uppercase tracking-wider block">
                        RECORDATORIO DE ALIAS // VERIFICAR ACREDITACIÓN:
                      </span>
                      <p className="text-[#A1A1AA]">
                        • Alias Ale: <strong className="text-white">ale.dastik</strong> | Alias Gordo:{' '}
                        <strong className="text-white">gordo.dastik</strong>
                      </p>
                      <p className="text-[11px] text-[#71717A]">
                        Verifica el comprobante bancario antes de confirmar la entrega.
                      </p>
                    </div>
                  )}

                  {metodoPago === MetodosPago.Credito && (
                    <div className="bg-[#141414] border border-[#222222] p-3 flex items-center justify-between text-xs font-mono">
                      <div>
                        <span className="font-bold text-white block">CUOTAS CON INTERÉS (+25%)</span>
                        <span className="text-[10px] text-[#71717A]">
                          Recargo financiero aplicable para 3 o 6 cuotas.
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => setAplicaRecargoCredito(!aplicaRecargoCredito)}
                        className={`text-[10px] font-mono uppercase px-3 py-1.5 border transition-fast cursor-pointer ${
                          aplicaRecargoCredito
                            ? 'border-amber-400 bg-amber-950/40 text-amber-300 font-bold'
                            : 'border-[#333333] text-[#71717A] hover:text-white'
                        }`}
                      >
                        {aplicaRecargoCredito ? 'RECARGO ACTIVADO (+25%)' : '1 PAGO (SIN RECARGO)'}
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* CASO C: Diferencia < $0 (Saldo a Favor del Cliente) */}
              {diferenciaBase < 0 && (
                <div className="border border-amber-600/70 bg-amber-950/20 p-4 space-y-2">
                  <div className="flex items-center gap-3">
                    <WarningCircle size={24} weight="bold" className="text-amber-400 shrink-0" />
                    <div>
                      <span className="text-xs font-heading font-black text-amber-300 uppercase tracking-wider block">
                        SALDO A FAVOR DEL CLIENTE: {formatearDinero(Math.abs(diferenciaBase))}
                      </span>
                      <span className="text-[11px] font-mono text-[#D4D4D8]">
                        La prenda nueva es de menor valor que la prenda devuelta.
                      </span>
                    </div>
                  </div>
                  <p className="text-[11px] font-mono text-[#A1A1AA] pt-2 border-t border-amber-900/50">
                    * No se realiza egreso de caja física. Se registra el comprobante de cambio con crédito a favor en cuenta del cliente.
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer con Navegación de Pasos y Confirmación */}
        <div className="p-4 sm:p-5 border-t border-[#222222] bg-[#0C0C0C] flex items-center justify-between gap-3">
          <div>
            {pasoActual > 1 && (
              <Button
                variant="secondary"
                size="sm"
                disabled={isSubmitting}
                onClick={() => setPasoActual((prev) => (prev - 1) as any)}
                className="text-[11px] font-mono tracking-wider px-3 border-[#333333]"
              >
                ← ANTERIOR
              </Button>
            )}
          </div>

          <div className="flex items-center gap-2">
            {pasoActual < 4 ? (
              <Button
                variant="primary"
                size="sm"
                disabled={
                  (pasoActual === 1 && !varianteDevuelta) ||
                  (pasoActual === 2 && !varianteNueva) ||
                  (pasoActual === 3 && !motivoCambio.trim())
                }
                onClick={() => setPasoActual((prev) => (prev + 1) as any)}
                className="text-[11px] font-mono tracking-wider px-4 font-bold"
              >
                SIGUIENTE →
              </Button>
            ) : (
              <Button
                variant="primary"
                size="md"
                disabled={isSubmitting}
                onClick={handleConfirmarCambio}
                className="text-xs font-heading font-bold tracking-wider px-5 bg-amber-400 text-black hover:bg-amber-300 border-amber-400"
              >
                {isSubmitting ? (
                  <span className="flex items-center gap-2">
                    <ArrowsClockwise size={16} className="animate-spin" />
                    PROCESANDO CAMBIO...
                  </span>
                ) : diferenciaBase === 0 ? (
                  'CONFIRMAR CAMBIO MANO A MANO'
                ) : diferenciaBase > 0 ? (
                  `COBRAR ${formatearDinero(montoFinalCobrar)} Y CONFIRMAR`
                ) : (
                  'CONFIRMAR CAMBIO CON SALDO A FAVOR'
                )}
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
