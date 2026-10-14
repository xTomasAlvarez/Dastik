import React, { useState, useEffect } from 'react';
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
} from '@phosphor-icons/react';
import { Button } from '../../../components/ui/Button';
import { ModalImprimirEtiquetas } from './ModalImprimirEtiquetas';
import type { ProductoCatalogoDto } from '../../pos/api/inventarioApi';

interface ModalDetalleProductoProps {
  isOpen: boolean;
  onClose: () => void;
  producto: ProductoCatalogoDto | null;
}

export const ModalDetalleProducto: React.FC<ModalDetalleProductoProps> = ({
  isOpen,
  onClose,
  producto,
}) => {
  const [isModalEtiquetasOpen, setIsModalEtiquetasOpen] = useState(false);
  // Manejo de tecla Escape para cerrar
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
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
  }, [isOpen, onClose]);

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

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      {/* Backdrop con Blur y Oscuridad Avant-Garde */}
      <div
        className="fixed inset-0 bg-black/85 backdrop-blur-sm transition-opacity duration-150"
        onClick={onClose}
      />

      {/* Slide-Over Drawer Lateral */}
      <div className="relative w-full max-w-xl bg-[#090909] border-l border-[#333333] flex flex-col h-full z-10 animate-in slide-in-from-right duration-150">
        {/* 1. Header del Drawer */}
        <div className="p-5 border-b border-[#222222] bg-[#0C0C0C] flex items-center justify-between">
          <div className="flex flex-col gap-0.5">
            <span className="text-[10px] uppercase font-mono tracking-widest text-amber-400 font-bold">
              FICHA TÉCNICA DE PRODUCTO
            </span>
            <div className="flex items-center gap-2">
              <h3 className="font-heading font-extrabold text-[#FAFAFA] text-base uppercase tracking-wider">
                ID #{producto.id} — {producto.marca}
              </h3>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 border border-[#333333] bg-[#141414] hover:bg-[#222222] text-[#A1A1AA] hover:text-white transition-fast"
            title="Cerrar (Esc)"
          >
            <X size={18} weight="light" />
          </button>
        </div>

        {/* 2. Cuerpo Desplazable del Drawer */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Imagen Grande con Fallback Gris Oscuro */}
          <div className="w-full aspect-[4/3] border border-[#333333] bg-[#111111] overflow-hidden flex items-center justify-center relative">
            {producto.imagenUrl ? (
              <img
                src={producto.imagenUrl}
                alt={producto.nombre}
                className="w-full h-full object-contain p-2 bg-[#0E0E0E]"
                loading="eager"
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                  const fb = e.currentTarget.parentElement?.querySelector('.drawer-img-fb');
                  if (fb) fb.classList.remove('hidden');
                }}
              />
            ) : null}
            <div
              className={`flex flex-col items-center justify-center gap-2 text-[#555555] ${
                producto.imagenUrl ? 'hidden drawer-img-fb' : ''
              }`}
            >
              <ImageIcon size={48} weight="light" />
              <span className="text-[10px] uppercase font-mono tracking-widest text-[#71717A]">
                FOTO NO DISPONIBLE
              </span>
            </div>
          </div>

          {/* Información de Identificación y Tags */}
          <div className="border border-[#222222] bg-[#0C0C0C] p-5 space-y-4">
            {/* Badges de Unidad y Categoría */}
            <div className="flex flex-wrap items-center gap-2">
              <span
                className={`text-[10px] font-mono uppercase tracking-widest px-2 py-0.5 border ${
                  producto.unidadNegocio?.toLowerCase().includes('hidden')
                    ? 'border-amber-900/80 bg-amber-950/40 text-amber-300'
                    : 'border-[#333333] bg-[#141414] text-[#A1A1AA]'
                }`}
              >
                UNIDAD: {producto.unidadNegocio}
              </span>

              <span className="text-[10px] font-mono uppercase tracking-widest px-2 py-0.5 border border-[#333333] bg-[#141414] text-[#A1A1AA]">
                CATEGORÍA: {producto.categoria}
              </span>

              <span
                className={`text-[10px] font-mono uppercase tracking-widest px-2 py-0.5 border ml-auto ${
                  sinStockGlobal
                    ? 'border-red-900/80 bg-red-950/40 text-red-300'
                    : stockTotal <= 5
                    ? 'border-amber-900/80 bg-amber-950/40 text-amber-300'
                    : 'border-emerald-900/80 bg-emerald-950/30 text-emerald-300'
                }`}
              >
                {sinStockGlobal ? 'SIN STOCK GLOBAL' : `STOCK TOTAL: ${stockTotal} U.`}
              </span>
            </div>

            {/* Nombre y Marca */}
            <div>
              <div className="text-xs font-mono uppercase tracking-widest text-amber-400 font-bold mb-1">
                {producto.marca}
              </div>
              <h2 className="text-xl md:text-2xl font-heading font-extrabold text-[#FAFAFA] uppercase tracking-tight">
                {producto.nombre}
              </h2>
            </div>
          </div>

          {/* Métricas Financieras: Precio, Costo, Markup */}
          <div className="grid grid-cols-3 gap-2.5">
            {/* Precio al Público */}
            <div className="border border-[#333333] bg-[#0D0D0D] p-3.5 flex flex-col justify-between">
              <span className="text-[10px] font-mono uppercase tracking-widest text-[#71717A] flex items-center gap-1">
                <CurrencyDollar size={12} weight="light" className="text-emerald-400" />
                PRECIO VENTA
              </span>
              <span className="text-lg md:text-xl font-heading font-black text-[#FAFAFA] mt-2">
                ${producto.precioVenta.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
              </span>
              <span className="text-[10px] font-mono uppercase text-[#555555] mt-1">
                PÚBLICO FINAL
              </span>
            </div>

            {/* Costo Base */}
            <div className="border border-[#333333] bg-[#0D0D0D] p-3.5 flex flex-col justify-between">
              <span className="text-[10px] font-mono uppercase tracking-widest text-[#71717A] flex items-center gap-1">
                <TrendUp size={12} weight="light" className="text-amber-400" />
                COSTO BASE
              </span>
              <span className="text-lg md:text-xl font-heading font-black text-[#D4D4D8] mt-2">
                ${costoBase.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
              </span>
              <span className="text-[10px] font-mono uppercase text-[#555555] mt-1">
                VALOR REPOSICIÓN
              </span>
            </div>

            {/* Markup y Margen */}
            <div className="border border-[#333333] bg-[#0D0D0D] p-3.5 flex flex-col justify-between">
              <span className="text-[10px] font-mono uppercase tracking-widest text-[#71717A] flex items-center gap-1">
                <Percent size={12} weight="light" className="text-blue-400" />
                MARKUP / MARGEN
              </span>
              <span className="text-lg md:text-xl font-heading font-black text-amber-400 mt-2">
                {markupCalculado.toFixed(2)}x
              </span>
              <span className="text-[10px] font-mono uppercase text-emerald-400/90 mt-1">
                MARGEN: {margenPorcentaje}%
              </span>
            </div>
          </div>

          {/* Descripción Limpia (Texto Plano) */}
          <div className="space-y-2">
            <span className="text-[10px] font-sans uppercase tracking-[0.2em] text-[#71717A] font-semibold flex items-center gap-1.5">
              <Tag size={13} weight="light" />
              DESCRIPCIÓN DEL CATÁLOGO
            </span>
            <div className="border border-[#222222] bg-[#0C0C0C] p-4 text-xs font-sans text-[#D4D4D8] leading-relaxed whitespace-pre-line">
              {producto.descripcion && producto.descripcion.trim().length > 0 ? (
                producto.descripcion
              ) : (
                <span className="text-[#555555] italic">Sin descripción registrada para este artículo.</span>
              )}
            </div>
          </div>

          {/* Curva Completa de Variantes (Talles y Colores) con Stock Físico */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-sans uppercase tracking-[0.2em] text-[#71717A] font-semibold flex items-center gap-1.5">
                <Package size={13} weight="light" />
                CURVA DE VARIANTES ({producto.variantes?.length || 0})
              </span>
              <span className="text-[10px] font-mono text-[#71717A]">
                DESGLOSE FÍSICO POR SKU
              </span>
            </div>

            <div className="border border-[#222222] bg-[#0C0C0C] divide-y divide-[#1A1A1A]">
              {producto.variantes && producto.variantes.length > 0 ? (
                producto.variantes.map((v) => {
                  const sinStockVar = v.stockFisico === 0;
                  const stockCritico = v.stockFisico > 0 && v.stockFisico <= 3;

                  return (
                    <div
                      key={v.id}
                      className="p-3.5 flex items-center justify-between gap-4 hover:bg-[#111111] transition-fast"
                    >
                      {/* Talle y Color */}
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 border border-[#333333] bg-[#141414] flex items-center justify-center font-heading font-bold text-sm text-[#FAFAFA]">
                          {v.talle}
                        </div>
                        <div className="flex flex-col">
                          <span className="text-xs font-heading font-semibold text-[#FAFAFA]">
                            Color: {v.color}
                          </span>
                          <span className="text-[10px] font-mono text-[#71717A] flex items-center gap-1 mt-0.5">
                            <Barcode size={12} weight="light" />
                            {v.codigoBarras || 'SIN EAN'}
                          </span>
                        </div>
                      </div>

                      {/* Stock y Estado */}
                      <div className="flex items-center gap-3 text-right">
                        <div className="flex flex-col items-end">
                          <span
                            className={`text-sm font-heading font-bold ${
                              sinStockVar
                                ? 'text-red-400'
                                : stockCritico
                                ? 'text-amber-400'
                                : 'text-[#FAFAFA]'
                            }`}
                          >
                            {v.stockFisico} u.
                          </span>
                          <span
                            className={`text-[10px] font-mono uppercase tracking-widest px-1.5 py-0.5 border mt-0.5 ${
                              sinStockVar
                                ? 'border-red-900/60 bg-red-950/30 text-red-300'
                                : stockCritico
                                ? 'border-amber-900/60 bg-amber-950/30 text-amber-300'
                                : 'border-emerald-900/60 bg-emerald-950/30 text-emerald-300'
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
                <div className="p-6 text-center text-xs font-sans text-[#71717A] italic">
                  Este producto no posee variantes configuradas.
                </div>
              )}
            </div>
          </div>
        </div>

        {/* 3. Footer del Drawer */}
        <div className="p-4 border-t border-[#222222] bg-[#0C0C0C] flex items-center justify-between gap-3">
          <Button
            variant="secondary"
            size="md"
            onClick={() => setIsModalEtiquetasOpen(true)}
            className="gap-2 text-xs font-heading font-bold tracking-wider px-4 border-amber-400 text-amber-300 hover:text-amber-200 hover:bg-amber-950/30 cursor-pointer"
            title="Generar etiquetas de código de barras o QR para imprimir"
          >
            <Printer size={16} weight="bold" />
            <span>IMPRIMIR ETIQUETAS</span>
          </Button>

          <Button
            variant="secondary"
            size="md"
            onClick={onClose}
            className="px-6 text-xs font-heading font-semibold tracking-wider border-[#333333]"
          >
            CERRAR FICHA
          </Button>
        </div>
      </div>

      {/* Modal de Impresión de Etiquetas de Código de Barras / QR */}
      <ModalImprimirEtiquetas
        isOpen={isModalEtiquetasOpen}
        onClose={() => setIsModalEtiquetasOpen(false)}
        producto={producto}
      />
    </div>
  );
};
