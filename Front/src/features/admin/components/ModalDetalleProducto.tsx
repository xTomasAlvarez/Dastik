import React, { useEffect } from 'react';
import {
  X,
  Image as ImageIcon,
  Barcode,
  Package,
  Tag
} from '@phosphor-icons/react';
import { type ProductoCatalogoDto } from '../../pos/api/inventarioApi';
import { Button } from '../../../components/ui/Button';

interface ModalDetalleProductoProps {
  isOpen: boolean;
  onClose: () => void;
  producto: ProductoCatalogoDto | null;
}

export const ModalDetalleProducto: React.FC<ModalDetalleProductoProps> = ({
  isOpen,
  onClose,
  producto
}) => {
  // Manejo de tecla Escape para cerrar
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !producto) return null;

  const stockTotal = producto.variantes?.reduce((acc, v) => acc + v.stockFisico, 0) || 0;
  const sinStockGlobal = stockTotal === 0;

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      {/* Backdrop con Blur Avant-Garde */}
      <div
        className="fixed inset-0 bg-black/80 backdrop-blur-sm transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Slide-Over Drawer Container */}
      <div className="relative w-full max-w-xl md:max-w-2xl bg-[#090909] border-l border-[#333333] h-full flex flex-col shadow-2xl z-10 overflow-hidden animate-in slide-in-from-right duration-200">
        {/* 1. Header del Drawer */}
        <div className="flex items-center justify-between p-5 border-b border-[#222222] bg-[#0C0C0C]">
          <div className="flex flex-col">
            <span className="text-[10px] font-mono uppercase tracking-[0.2em] text-[#71717A]">
              PANEL DE AUDITORÍA · DASTIK // INVENTARIO
            </span>
            <span className="text-sm font-heading font-bold uppercase tracking-wider text-[#FAFAFA] mt-0.5">
              DETALLE DE PRODUCTO #{producto.id}
            </span>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 border border-[#333333] bg-[#111111] hover:bg-[#1F1F1F] text-[#FAFAFA] transition-fast cursor-pointer"
            title="Cerrar panel (Esc)"
          >
            <X size={16} weight="light" />
          </button>
        </div>

        {/* 2. Cuerpo Scrollable */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Foto Destacada en Tamaño Grande */}
          <div className="w-full h-72 md:h-80 border border-[#222222] bg-[#000000] flex items-center justify-center overflow-hidden relative">
            {producto.imagenUrl ? (
              <img
                src={producto.imagenUrl}
                alt={producto.nombre}
                className="w-full h-full object-contain p-2"
                loading="lazy"
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
              <ImageIcon size={44} weight="light" />
              <span className="text-[10px] uppercase font-mono tracking-widest text-[#71717A]">
                FOTO NO DISPONIBLE
              </span>
            </div>
          </div>

          {/* Información Principal */}
          <div className="border border-[#222222] bg-[#0C0C0C] p-5 space-y-4">
            {/* Badges de Unidad y Categoría */}
            <div className="flex flex-wrap items-center gap-2">
              <span
                className={`text-[9px] font-mono uppercase tracking-widest px-2 py-0.5 border ${
                  producto.unidadNegocio?.toLowerCase().includes('hidden')
                    ? 'border-amber-900/80 bg-amber-950/40 text-amber-300'
                    : 'border-[#333333] bg-[#141414] text-[#A1A1AA]'
                }`}
              >
                UNIDAD: {producto.unidadNegocio}
              </span>

              <span className="text-[9px] font-mono uppercase tracking-widest px-2 py-0.5 border border-[#333333] bg-[#141414] text-[#A1A1AA]">
                CATEGORÍA: {producto.categoria}
              </span>

              <span
                className={`text-[9px] font-mono uppercase tracking-widest px-2 py-0.5 border ml-auto ${
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

            {/* Marca y Nombre */}
            <div>
              <div className="text-xs font-mono uppercase tracking-widest text-amber-400 font-bold mb-1">
                {producto.marca}
              </div>
              <h2 className="text-xl md:text-2xl font-heading font-extrabold text-[#FAFAFA] uppercase tracking-tight">
                {producto.nombre}
              </h2>
            </div>

            {/* Precio de Venta */}
            <div className="pt-2 border-t border-[#1C1C1C] flex items-baseline justify-between">
              <span className="text-[10px] font-mono uppercase tracking-widest text-[#71717A]">
                PRECIO AL PÚBLICO
              </span>
              <span className="text-2xl md:text-3xl font-heading font-black text-[#FAFAFA]">
                ${producto.precioVenta.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
              </span>
            </div>
          </div>

          {/* Descripción Limpia */}
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

          {/* Lista de Variantes y Stock */}
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
                            className={`text-[8px] font-mono uppercase tracking-widest px-1.5 py-0.5 border mt-0.5 ${
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
        <div className="p-4 border-t border-[#222222] bg-[#0C0C0C] flex items-center justify-between">
          <span className="text-[10px] font-mono text-[#555555] uppercase tracking-wider">
            ESC PARA SALIR
          </span>
          <Button
            variant="secondary"
            size="md"
            onClick={onClose}
            className="px-6 text-xs font-heading font-semibold tracking-wider border-[#333333]"
          >
            CERRAR VISTA
          </Button>
        </div>
      </div>
    </div>
  );
};
