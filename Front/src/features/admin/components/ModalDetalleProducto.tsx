import React, { useState, useEffect, useMemo } from 'react';
import {
  X,
  Image as ImageIcon,
  Barcode,
  Tag,
  Package,
  TrendUp,
  CurrencyDollar,
  Percent,
  Printer,
  PencilSimple,
  CaretLeft,
  CaretRight,
} from '@phosphor-icons/react';
import { Button } from '../../../components/ui/Button';
import { ModalImprimirEtiquetas } from './ModalImprimirEtiquetas';
import {
  normalizarUrlImagenAltaRes,
  type ProductoCatalogoDto,
} from '../../pos/api/inventarioApi';

interface ModalDetalleProductoProps {
  isOpen: boolean;
  onClose: () => void;
  producto: ProductoCatalogoDto | null;
  onEditar?: (producto: ProductoCatalogoDto) => void;
}

export const ModalDetalleProducto: React.FC<ModalDetalleProductoProps> = ({
  isOpen,
  onClose,
  producto,
  onEditar,
}) => {
  const [isModalEtiquetasOpen, setIsModalEtiquetasOpen] = useState(false);
  const [activeImageIndex, setActiveImageIndex] = useState(0);

  const galeriaImagenes = useMemo(() => {
    if (!producto) return [];
    const urls: string[] = [];

    if (producto.imagenes && producto.imagenes.length > 0) {
      for (const u of producto.imagenes) {
        const norm = normalizarUrlImagenAltaRes(u);
        if (norm && !urls.includes(norm)) {
          urls.push(norm);
        }
      }
    }

    if (urls.length === 0 && producto.imagenUrl) {
      const norm = normalizarUrlImagenAltaRes(producto.imagenUrl);
      if (norm) urls.push(norm);
    }

    return urls;
  }, [producto]);

  useEffect(() => {
    if (isOpen) {
      setActiveImageIndex(0);
    }
  }, [isOpen, producto]);

  // Manejo de tecla Escape para cerrar
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen && !isModalEtiquetasOpen) {
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
  }, [isOpen, isModalEtiquetasOpen, onClose]);

  if (!isOpen || !producto) return null;

  // Cálculos de Stock y Métricas Financieras
  const stockTotal = producto.variantes?.reduce((acc, v) => acc + (v.stockFisico || 0), 0) ?? 0;
  const sinStockGlobal = stockTotal === 0;

  // Costo y Markup con fallbacks consistentes con la regla de negocio
  const costoBase = producto.costoBase && producto.costoBase > 0
    ? producto.costoBase
    : Math.round((producto.precioVenta / 1.5) * 100) / 100;

  const markupCalculado = producto.markupAplicado && producto.markupAplicado > 0
    ? producto.markupAplicado
    : costoBase > 0
    ? Math.round((producto.precioVenta / costoBase) * 100) / 100
    : 1.5;

  const margenPorcentaje = costoBase > 0
    ? Math.round(((producto.precioVenta - costoBase) / producto.precioVenta) * 100)
    : 33;

  const imagenActivaUrl =
    galeriaImagenes[activeImageIndex] ||
    normalizarUrlImagenAltaRes(producto.imagenUrl) ||
    '';

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      {/* Backdrop con Blur */}
      <div
        className="fixed inset-0 bg-black/75 backdrop-blur-sm transition-opacity duration-150"
        onClick={onClose}
      />

      {/* Slide-Over Drawer Lateral */}
      <div className="relative w-full max-w-xl bg-surface border-l border-subtle shadow-floating flex flex-col h-full z-10">
        {/* 1. Header Limpio del Drawer */}
        <div className="px-5 py-4 border-b border-subtle bg-elevated/60 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <span className="text-xs font-mono font-bold px-2 py-0.5 rounded border border-subtle bg-surface text-secondary">
              #{producto.id}
            </span>
            <h3 className="font-heading font-bold text-primary text-base tracking-tight">
              {producto.marca}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg border border-subtle bg-surface hover:bg-elevated text-secondary hover:text-primary transition-colors cursor-pointer"
            title="Cerrar (Esc)"
          >
            <X size={18} weight="bold" />
          </button>
        </div>

        {/* 2. Cuerpo Desplazable del Drawer */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Galería de Imágenes con Miniaturas en Alta Resolución */}
          <div className="space-y-2.5">
            <div className="w-full aspect-[4/5] max-h-96 border border-subtle rounded-xl bg-elevated overflow-hidden flex items-center justify-center relative">
              {imagenActivaUrl ? (
                <img
                  src={imagenActivaUrl}
                  alt={producto.nombre}
                  decoding="async"
                  className="w-full h-full object-contain p-2 bg-elevated"
                  loading="eager"
                />
              ) : (
                <div className="flex flex-col items-center justify-center gap-2 text-muted">
                  <ImageIcon size={48} weight="duotone" />
                  <span className="text-[10px] uppercase font-mono tracking-widest text-muted">
                    FOTO NO DISPONIBLE
                  </span>
                </div>
              )}

              {galeriaImagenes.length > 1 && (
                <>
                  <button
                    type="button"
                    onClick={() =>
                      setActiveImageIndex((prev) =>
                        prev === 0 ? galeriaImagenes.length - 1 : prev - 1
                      )
                    }
                    className="absolute left-2.5 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-surface/90 border border-subtle text-primary flex items-center justify-center shadow-surface hover:border-strong cursor-pointer"
                    title="Foto anterior"
                  >
                    <CaretLeft size={15} weight="bold" />
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      setActiveImageIndex((prev) =>
                        prev === galeriaImagenes.length - 1 ? 0 : prev + 1
                      )
                    }
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-surface/90 border border-subtle text-primary flex items-center justify-center shadow-surface hover:border-strong cursor-pointer"
                    title="Siguiente foto"
                  >
                    <CaretRight size={15} weight="bold" />
                  </button>
                </>
              )}

              {galeriaImagenes.length > 0 && (
                <span className="absolute bottom-2.5 right-2.5 px-2 py-0.5 rounded-md bg-surface/90 border border-subtle text-[10px] font-mono font-semibold text-secondary">
                  {activeImageIndex + 1} / {galeriaImagenes.length} fotos
                </span>
              )}
            </div>

            {/* Miniaturas de la Galería */}
            {galeriaImagenes.length > 0 && (
              <div className="flex items-center gap-2 overflow-x-auto pb-1">
                {galeriaImagenes.map((url, idx) => (
                  <button
                    key={`${url}-${idx}`}
                    type="button"
                    onClick={() => setActiveImageIndex(idx)}
                    className={`w-14 h-14 rounded-lg border overflow-hidden shrink-0 transition-fast cursor-pointer bg-elevated ${
                      activeImageIndex === idx
                        ? 'border-amber-500 ring-2 ring-amber-500/25'
                        : 'border-subtle opacity-70 hover:opacity-100'
                    }`}
                    title={`Ver foto ${idx + 1}`}
                  >
                    <img
                      src={url}
                      alt={`${producto.nombre} miniatura ${idx + 1}`}
                      decoding="async"
                      className="w-full h-full object-cover"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Información de Identificación y Tags */}
          <div className="border border-subtle bg-elevated rounded-xl p-5 space-y-4">
            {/* Badges de Unidad y Categoría */}
            <div className="flex flex-wrap items-center gap-2">
              <span
                className={`text-[10px] font-mono font-bold uppercase tracking-widest px-2.5 py-0.5 rounded-md border ${
                  producto.unidadNegocio?.toLowerCase().includes('hidden')
                    ? 'border-amber-500/30 bg-amber-500/10 text-amber-600 dark:text-amber-400'
                    : 'border-subtle bg-surface text-secondary'
                }`}
              >
                {producto.unidadNegocio}
              </span>

              <span className="text-[10px] font-mono uppercase tracking-widest px-2.5 py-0.5 rounded-md border border-subtle bg-surface text-secondary">
                {producto.categoria}
              </span>

              <span
                className={`text-[10px] font-mono font-bold uppercase tracking-widest px-2.5 py-0.5 rounded-md border ml-auto ${
                  sinStockGlobal
                    ? 'border-red-500/30 bg-red-500/10 text-red-600 dark:text-red-400'
                    : stockTotal <= 5
                    ? 'border-amber-500/30 bg-amber-500/10 text-amber-600 dark:text-amber-400'
                    : 'border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                }`}
              >
                {sinStockGlobal ? 'SIN STOCK GLOBAL' : `STOCK TOTAL: ${stockTotal} U.`}
              </span>
            </div>

            {/* Nombre */}
            <div>
              <h2 className="text-xl md:text-2xl font-heading font-bold text-primary tracking-tight">
                {producto.nombre}
              </h2>
            </div>
          </div>

          {/* Métricas Financieras: Precio, Costo, Markup */}
          <div className="grid grid-cols-3 gap-2.5">
            {/* Precio al Público */}
            <div className="border border-subtle bg-elevated rounded-xl p-3.5 flex flex-col justify-between">
              <span className="text-[10px] font-mono uppercase tracking-widest text-secondary flex items-center gap-1">
                <CurrencyDollar size={12} weight="bold" className="text-emerald-600 dark:text-emerald-400" />
                PRECIO VENTA
              </span>
              <span className="text-lg md:text-xl font-mono font-bold text-primary mt-2 tabular-nums">
                ${producto.precioVenta.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
              </span>
              <span className="text-[10px] font-mono uppercase text-muted mt-1">
                PÚBLICO FINAL
              </span>
            </div>

            {/* Costo Base */}
            <div className="border border-subtle bg-elevated rounded-xl p-3.5 flex flex-col justify-between">
              <span className="text-[10px] font-mono uppercase tracking-widest text-secondary flex items-center gap-1">
                <TrendUp size={12} weight="bold" className="text-amber-500 dark:text-amber-400" />
                COSTO BASE
              </span>
              <span className="text-lg md:text-xl font-mono font-bold text-secondary mt-2 tabular-nums">
                ${costoBase.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
              </span>
              <span className="text-[10px] font-mono uppercase text-muted mt-1">
                VALOR REPOSICIÓN
              </span>
            </div>

            {/* Markup y Margen */}
            <div className="border border-subtle bg-elevated rounded-xl p-3.5 flex flex-col justify-between">
              <span className="text-[10px] font-mono uppercase tracking-widest text-secondary flex items-center gap-1">
                <Percent size={12} weight="bold" className="text-blue-600 dark:text-blue-400" />
                MARKUP / MARGEN
              </span>
              <span className="text-lg md:text-xl font-mono font-bold text-amber-600 dark:text-amber-400 mt-2 tabular-nums">
                {markupCalculado.toFixed(2)}x
              </span>
              <span className="text-[10px] font-mono uppercase text-emerald-600 dark:text-emerald-400 mt-1 tabular-nums">
                MARGEN: {margenPorcentaje}%
              </span>
            </div>
          </div>

          {/* Descripción Limpia (Texto Plano) */}
          <div className="space-y-2">
            <span className="text-[10px] font-sans uppercase tracking-[0.2em] text-secondary font-semibold flex items-center gap-1.5">
              <Tag size={13} weight="bold" />
              DESCRIPCIÓN DEL CATÁLOGO
            </span>
            <div className="border border-subtle bg-elevated rounded-xl p-4 text-xs font-sans text-secondary leading-relaxed whitespace-pre-line">
              {producto.descripcion && producto.descripcion.trim().length > 0 ? (
                producto.descripcion
              ) : (
                <span className="text-muted italic">Sin descripción registrada para este artículo.</span>
              )}
            </div>
          </div>

          {/* Curva Completa de Variantes (Talles y Colores) con Stock Físico */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-sans uppercase tracking-[0.2em] text-secondary font-semibold flex items-center gap-1.5">
                <Package size={13} weight="bold" />
                CURVA DE VARIANTES ({producto.variantes?.length || 0})
              </span>
              <span className="text-[10px] font-mono text-muted">
                DESGLOSE FÍSICO POR SKU
              </span>
            </div>

            <div className="border border-subtle bg-surface rounded-xl divide-y divide-subtle overflow-hidden">
              {producto.variantes && producto.variantes.length > 0 ? (
                producto.variantes.map((v) => {
                  const sinStockVar = v.stockFisico === 0;
                  const stockCritico = v.stockFisico > 0 && v.stockFisico <= 3;

                  return (
                    <div
                      key={v.id}
                      className="p-3.5 flex items-center justify-between gap-4 hover:bg-elevated/60 transition-colors"
                    >
                      {/* Talle y Color */}
                      <div className="flex items-center gap-3">
                        <div className="min-w-[2.5rem] w-auto px-2.5 h-10 rounded-lg border border-subtle bg-elevated flex items-center justify-center font-mono font-bold text-xs text-primary whitespace-nowrap">
                          {v.talle}
                        </div>
                        <div className="flex flex-col">
                          <span className="text-xs font-heading font-semibold text-primary">
                            Color: {v.color}
                          </span>
                          <span className="text-[10px] font-mono text-muted flex items-center gap-1 mt-0.5 select-all">
                            <Barcode size={12} weight="bold" />
                            {v.codigoBarras || 'SIN EAN'}
                          </span>
                        </div>
                      </div>

                      {/* Stock y Estado */}
                      <div className="flex items-center gap-3 text-right">
                        <div className="flex flex-col items-end">
                          <span
                            className={`text-sm font-mono font-bold tabular-nums ${
                              sinStockVar
                                ? 'text-red-600 dark:text-red-400'
                                : stockCritico
                                ? 'text-amber-600 dark:text-amber-400'
                                : 'text-primary'
                            }`}
                          >
                            {v.stockFisico} u.
                          </span>
                          <span
                            className={`text-[10px] font-mono font-bold uppercase tracking-widest px-1.5 py-0.5 rounded border mt-0.5 ${
                              sinStockVar
                                ? 'border-red-500/30 bg-red-500/10 text-red-600 dark:text-red-400'
                                : stockCritico
                                ? 'border-amber-500/30 bg-amber-500/10 text-amber-600 dark:text-amber-400'
                                : 'border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                            }`}
                          >
                            {sinStockVar ? 'AGOTADO' : stockCritico ? 'STOCK CRÍTICO' : 'DISPONIBLE'}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="p-6 text-center text-xs font-sans text-muted italic">
                  Este producto no posee variantes configuradas.
                </div>
              )}
            </div>
          </div>
        </div>

        {/* 3. Footer del Drawer */}
        <div className="p-4 border-t border-subtle bg-elevated/60 flex items-center justify-between gap-3">
          <Button
            variant="secondary"
            size="md"
            onClick={() => setIsModalEtiquetasOpen(true)}
            className="gap-2 text-xs font-heading font-bold tracking-wider px-4 border-amber-500/40 bg-amber-500/10 text-amber-600 dark:text-amber-400 hover:bg-amber-500/20 cursor-pointer"
            title="Generar etiquetas térmicas EAN-13 (38x21mm) para imprimir"
          >
            <Printer size={16} weight="bold" />
            <span>IMPRIMIR ETIQUETAS</span>
          </Button>

          <div className="flex items-center gap-2">
            {onEditar && (
              <Button
                variant="primary"
                size="md"
                onClick={() => {
                  onClose();
                  onEditar(producto);
                }}
                className="gap-2 text-xs font-heading font-bold tracking-wider px-4"
                title="Editar datos de la prenda y variantes"
              >
                <PencilSimple size={16} weight="bold" />
                <span>EDITAR PRENDA</span>
              </Button>
            )}
            <Button
              variant="secondary"
              size="md"
              onClick={onClose}
              className="px-5 text-xs font-heading font-semibold tracking-wider"
            >
              CERRAR FICHA
            </Button>
          </div>
        </div>
      </div>

      {/* Modal de Impresión de Etiquetas de Código de Barras EAN-13 */}
      <ModalImprimirEtiquetas
        isOpen={isModalEtiquetasOpen}
        onClose={() => setIsModalEtiquetasOpen(false)}
        producto={producto}
      />
    </div>
  );
};
