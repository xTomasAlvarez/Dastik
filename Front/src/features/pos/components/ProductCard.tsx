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
  const [imageError, setImageError] = useState(false);

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

  const renderProductIcon = () => {
    const catLower = producto.categoria?.toLowerCase() || '';
    if (catLower.includes('calzado') || producto.unidadNegocio?.toLowerCase().includes('sneakers')) {
      return <Sneaker size={24} weight="duotone" className="text-amber-500" />;
    }
    if (catLower.includes('indumentaria') || catLower.includes('remera') || catLower.includes('pantalon')) {
      return <TShirt size={24} weight="duotone" className="text-secondary" />;
    }
    return <Package size={24} weight="duotone" className="text-secondary" />;
  };

  const stockTotal = producto.variantes.reduce((sum, v) => sum + v.stockFisico, 0);
  const mostrarImagenReal = Boolean(producto.imagenUrl?.trim()) && !imageError;

  return (
    <article className="rounded-xl border border-subtle hover:border-strong bg-surface p-4 flex flex-col justify-between shadow-surface hover:shadow-floating transition-fast group relative">
      {/* 1. Header de Card: Unidad de Negocio & Stock Total */}
      <div className="flex items-center justify-between gap-2 mb-3">
        <span className="text-[10px] uppercase tracking-wider font-semibold rounded-md border border-subtle bg-elevated px-2 py-0.5 text-secondary">
          {producto.unidadNegocio || 'DASTIK'}
        </span>
        <span
          className={`text-[11px] font-mono tabular-nums font-semibold rounded-md px-2 py-0.5 border ${
            stockTotal > 0
              ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
              : 'border-red-500/30 bg-red-500/10 text-red-600 dark:text-red-400'
          }`}
        >
          {stockTotal > 0 ? `${stockTotal} u. disp.` : 'Agotado'}
        </span>
      </div>

      {/* 2. Visual / Imagen Real (con fallback elegante a icono) y Metadatos Principales */}
      <div className="flex items-start gap-3.5 mb-4">
        <div className="w-14 h-14 shrink-0 rounded-lg border border-subtle bg-elevated overflow-hidden flex items-center justify-center group-hover:border-strong transition-fast">
          {mostrarImagenReal ? (
            <img
              src={producto.imagenUrl}
              alt={producto.nombre}
              loading="lazy"
              onError={() => setImageError(true)}
              className="w-full h-full object-cover rounded-lg group-hover:scale-105 transition-transform duration-200"
            />
          ) : (
            renderProductIcon()
          )}
        </div>
        <div className="flex-1 min-w-0">
          <span className="text-[11px] font-medium text-muted block truncate">
            {producto.marca}
          </span>
          <h3
            className="font-heading text-sm font-bold text-primary leading-snug truncate mt-0.5"
            title={producto.nombre}
          >
            {producto.nombre}
          </h3>
          <p className="font-mono tabular-nums text-base font-bold text-primary mt-1 tracking-tight">
            {formatearDinero(producto.precioVenta)}
          </p>
        </div>
      </div>

      {/* 3. Selector de Talles / Variantes en Pills Redondeados */}
      <div className="border-t border-subtle pt-3 mt-auto">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[11px] font-medium text-secondary">
            Seleccionar talle
          </span>
          <span className="text-[11px] font-mono tabular-nums text-muted">
            {producto.variantes.length} {producto.variantes.length === 1 ? 'var.' : 'vars.'}
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
                className={`relative rounded-lg border py-1.5 px-1 text-center transition-fast flex flex-col items-center justify-center active:scale-[0.96] ${
                  isOutOfStock
                    ? 'border-subtle bg-elevated/40 text-muted opacity-45 line-through cursor-not-allowed'
                    : isJustAdded
                    ? 'border-emerald-500 bg-emerald-500 text-white cursor-pointer shadow-sm'
                    : 'border-subtle bg-elevated hover:border-amber-500/60 hover:bg-amber-500/10 text-primary cursor-pointer'
                }`}
              >
                {isJustAdded ? (
                  <Check size={14} weight="bold" />
                ) : (
                  <>
                    <span className="font-mono tabular-nums text-xs font-bold leading-none">
                      {variante.talle}
                    </span>
                    <span className="text-[10px] font-mono tabular-nums text-muted mt-0.5 leading-none">
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
