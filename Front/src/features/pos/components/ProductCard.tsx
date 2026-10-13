import React, { useState } from 'react';
import { Sneaker, TShirt, Package, Check } from '@phosphor-icons/react';
import type { ProductoCatalogoDto, VarianteDto } from '../api/inventarioApi';
import { useCartStore } from '../stores/useCartStore';

interface ProductCardProps {
  producto: ProductoCatalogoDto;
}

export const ProductCard: React.FC<ProductCardProps> = ({ producto }) => {
  const addItem = useCartStore((state) => state.addItem);
  const [lastAddedVariantId, setLastAddedVariantId] = useState<number | null>(null);

  const formatearDinero = (monto: number) => {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS',
      minimumFractionDigits: 2,
    }).format(monto);
  };

  const handleSelectVariant = (variante: VarianteDto) => {
    if (variante.stockFisico <= 0) return;

    addItem({
      varianteId: variante.id,
      productoId: producto.id,
      nombreProducto: producto.nombre,
      marca: producto.marca,
      talle: variante.talle,
      color: variante.color,
      codigoBarras: variante.codigoBarras,
      precioUnitario: producto.precioVenta,
      stockFisico: variante.stockFisico,
    });

    setLastAddedVariantId(variante.id);
    setTimeout(() => {
      setLastAddedVariantId(null);
    }, 800);
  };

  // Ícono según categoría o unidad
  const renderProductIcon = () => {
    const catLower = producto.categoria?.toLowerCase() || '';
    if (catLower.includes('calzado') || producto.unidadNegocio?.toLowerCase().includes('sneakers')) {
      return <Sneaker size={26} weight="light" className="text-[#A1A1AA]" />;
    }
    if (catLower.includes('indumentaria') || catLower.includes('remera') || catLower.includes('pantalon')) {
      return <TShirt size={26} weight="light" className="text-[#A1A1AA]" />;
    }
    return <Package size={26} weight="light" className="text-[#A1A1AA]" />;
  };

  const stockTotal = producto.variantes.reduce((sum, v) => sum + v.stockFisico, 0);

  return (
    <article className="border border-[#222222] hover:border-[#444444] bg-[#090909] p-4 flex flex-col justify-between transition-fast group relative">
      {/* 1. Header de Card: Unidad de Negocio & Stock Total */}
      <div className="flex items-center justify-between gap-2 mb-3">
        <span className="text-[10px] uppercase tracking-[0.2em] font-mono border border-[#222222] bg-[#111111] px-2 py-0.5 text-[#A1A1AA]">
          {producto.unidadNegocio || 'DASTIK'}
        </span>
        <span
          className={`text-[10px] font-mono tracking-wider px-1.5 py-0.5 border ${
            stockTotal > 0
              ? 'border-emerald-950/60 bg-emerald-950/20 text-emerald-400'
              : 'border-red-950/60 bg-red-950/20 text-red-400'
          }`}
        >
          {stockTotal > 0 ? `${stockTotal} U. DISP.` : 'AGOTADO'}
        </span>
      </div>

      {/* 2. Visual / Icono y Metadatos Principales */}
      <div className="flex items-start gap-3.5 mb-4">
        <div className="w-12 h-12 shrink-0 border border-[#222222] bg-[#111111] flex items-center justify-center group-hover:border-[#333333] transition-fast">
          {renderProductIcon()}
        </div>
        <div className="flex-1 min-w-0">
          <span className="text-[10px] uppercase font-sans tracking-widest text-[#71717A] block truncate">
            {producto.marca}
          </span>
          <h3 className="font-heading text-sm font-bold text-[#FAFAFA] leading-tight truncate mt-0.5" title={producto.nombre}>
            {producto.nombre}
          </h3>
          <p className="font-heading text-base font-extrabold text-[#FAFAFA] mt-1 tracking-tight">
            {formatearDinero(producto.precioVenta)}
          </p>
        </div>
      </div>

      {/* 3. Selector Flat de Talles / Variantes */}
      <div className="border-t border-[#1F1F1F] pt-3 mt-auto">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[10px] uppercase font-sans tracking-widest text-[#71717A]">
            SELECCIONAR TALLE:
          </span>
          <span className="text-[10px] font-mono text-[#555555]">
            {producto.variantes.length} {producto.variantes.length === 1 ? 'VAR.' : 'VARS.'}
          </span>
        </div>

        <div className="grid grid-cols-4 sm:grid-cols-5 gap-1.5">
          {producto.variantes.map((variante) => {
            const isOutOfStock = variante.stockFisico <= 0;
            const isJustAdded = lastAddedVariantId === variante.id;

            return (
              <button
                key={variante.id}
                type="button"
                onClick={() => handleSelectVariant(variante)}
                disabled={isOutOfStock}
                title={`${variante.talle} - ${variante.color} (${variante.stockFisico} disponibles)`}
                className={`
                  relative border py-1.5 px-1 text-center transition-fast flex flex-col items-center justify-center
                  ${
                    isOutOfStock
                      ? 'border-[#1C1C1C] bg-[#0C0C0C] text-[#444444] opacity-40 line-through cursor-not-allowed'
                      : isJustAdded
                      ? 'border-[#FAFAFA] bg-[#FAFAFA] text-[#000000] cursor-pointer'
                      : 'border-[#2B2B2B] bg-[#121212] hover:border-[#FAFAFA] hover:bg-[#1E1E1E] text-[#FAFAFA] cursor-pointer'
                  }
                `}
              >
                {isJustAdded ? (
                  <Check size={12} weight="bold" />
                ) : (
                  <>
                    <span className="font-mono text-xs font-bold leading-none">
                      {variante.talle}
                    </span>
                    <span className="text-[10px] font-mono text-[#71717A] mt-0.5 leading-none">
                      {variante.stockFisico}u
                    </span>
                  </>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </article>
  );
};
