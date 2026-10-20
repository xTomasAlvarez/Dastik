import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Sneaker, TShirt, Package, Check, CornersOut } from '@phosphor-icons/react';
import type { ProductoCatalogoDto, VarianteDto } from '../api/inventarioApi';
import { useCartStore } from '../stores/useCartStore';

interface ProductCardProps {
  producto: ProductoCatalogoDto;
  onOpenQuickView?: (producto: ProductoCatalogoDto) => void;
}

export const ProductCard: React.FC<ProductCardProps> = ({
  producto,
  onOpenQuickView,
}) => {
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

  const imagenPrincipal =
    (producto.imagenes && producto.imagenes.length > 0
      ? producto.imagenes[0]
      : producto.imagenUrl) || '';

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
      imagenUrl: imagenPrincipal,
    });

    setLastAddedVariantId(variante.id);
    setTimeout(() => {
      setLastAddedVariantId(null);
    }, 750);
  };

  const renderProductIcon = () => {
    const catLower = producto.categoria?.toLowerCase() || '';
    if (
      catLower.includes('calzado') ||
      producto.unidadNegocio?.toLowerCase().includes('sneakers')
    ) {
      return <Sneaker size={32} weight="duotone" className="text-amber-500/80" />;
    }
    if (
      catLower.includes('indumentaria') ||
      catLower.includes('remera') ||
      catLower.includes('pantalon')
    ) {
      return <TShirt size={32} weight="duotone" className="text-muted" />;
    }
    return <Package size={32} weight="duotone" className="text-muted" />;
  };

  const stockTotal = producto.variantes.reduce((sum, v) => sum + v.stockFisico, 0);
  const mostrarImagenReal = Boolean(imagenPrincipal.trim()) && !imageError;
  const cantidadFotos = producto.imagenes?.length || (imagenPrincipal ? 1 : 0);

  return (
    <article className="rounded-xl border border-subtle hover:border-strong bg-surface overflow-hidden flex flex-col justify-between shadow-surface hover:shadow-floating transition-fast group">
      {/* 1. Cabecera Visual con Imagen Protagonista (h-36) y clic para Quick-View */}
      <div
        role="button"
        tabIndex={0}
        onClick={() => onOpenQuickView?.(producto)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            onOpenQuickView?.(producto);
          }
        }}
        className="relative h-36 w-full bg-elevated/70 border-b border-subtle overflow-hidden flex items-center justify-center cursor-pointer"
        title="Ver galería de fotos y códigos EAN-13"
      >
        {mostrarImagenReal ? (
          <img
            src={imagenPrincipal}
            alt={producto.nombre}
            loading="lazy"
            onError={() => setImageError(true)}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          renderProductIcon()
        )}

        {/* Badge Flotante Izquierdo: Categoría / Marca (sin repetir DASTIK + Dastik) */}
        <span className="absolute top-2.5 left-2.5 px-2 py-0.5 rounded-md bg-surface/90 backdrop-blur-sm border border-subtle text-[10px] font-sans font-semibold text-secondary truncate max-w-[60%]">
          {producto.marca}
        </span>

        {/* Badge Flotante Derecho: Stock Total */}
        <span
          className={`absolute top-2.5 right-2.5 text-[10px] font-mono tabular-nums font-bold rounded-md px-2 py-0.5 border backdrop-blur-sm ${
            stockTotal > 0
              ? 'border-emerald-500/30 bg-surface/90 text-emerald-600 dark:text-emerald-400'
              : 'border-red-500/30 bg-surface/90 text-red-600 dark:text-red-400'
          }`}
        >
          {stockTotal > 0 ? `${stockTotal} u.` : 'Agotado'}
        </span>

        {/* Botón sutil de Quick-View en hover */}
        <div className="absolute bottom-2 right-2 px-2 py-1 rounded-md bg-surface/90 backdrop-blur-sm border border-subtle text-[10px] font-mono font-semibold text-primary opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1 shadow-sm">
          <CornersOut size={12} weight="bold" />
          <span>{cantidadFotos > 1 ? `${cantidadFotos} fotos · EAN` : 'Ver EAN'}</span>
        </div>
      </div>

      {/* 2. Cuerpo: Nombre + Precio */}
      <div className="p-3.5 flex-1 flex flex-col justify-between gap-3">
        <div
          onClick={() => onOpenQuickView?.(producto)}
          className="cursor-pointer group/title"
        >
          <div className="flex items-start justify-between gap-2">
            <h3
              className="font-heading text-xs sm:text-sm font-bold text-primary group-hover/title:text-amber-500 transition-colors leading-snug line-clamp-1"
              title={producto.nombre}
            >
              {producto.nombre}
            </h3>
          </div>
          <div className="flex items-baseline justify-between mt-1">
            <p className="font-mono tabular-nums text-sm sm:text-base font-bold text-primary tracking-tight">
              {formatearDinero(producto.precioVenta)}
            </p>
            <span className="text-[10px] text-muted font-sans truncate">
              {producto.categoria}
            </span>
          </div>
        </div>

        {/* 3. Pills Táctiles de Talles con Motion */}
        <div className="pt-2.5 border-t border-subtle">
          <div className="grid grid-cols-4 sm:grid-cols-5 gap-1.5">
            {producto.variantes.map((variante) => {
              const isOutOfStock = variante.stockFisico <= 0;
              const isJustAdded = lastAddedVariantId === variante.id;

              return (
                <motion.button
                  key={variante.id}
                  type="button"
                  whileTap={!isOutOfStock ? { scale: 0.93 } : undefined}
                  onClick={() => handleSelectVariant(variante)}
                  disabled={isOutOfStock}
                  title={`Talle ${variante.talle} (${variante.color}) · ${variante.stockFisico} disp. · EAN: ${variante.codigoBarras}`}
                  className={`relative rounded-lg border py-1.5 px-1 text-center transition-fast flex flex-col items-center justify-center ${
                    isOutOfStock
                      ? 'border-subtle bg-elevated/35 text-muted opacity-40 line-through cursor-not-allowed'
                      : isJustAdded
                      ? 'border-emerald-500 bg-emerald-500 text-white cursor-pointer shadow-sm'
                      : 'border-subtle bg-elevated hover:border-amber-500/60 hover:bg-amber-500/10 text-primary cursor-pointer'
                  }`}
                >
                  {isJustAdded ? (
                    <Check size={13} weight="bold" />
                  ) : (
                    <>
                      <span className="font-mono tabular-nums text-[11px] font-bold leading-none">
                        {variante.talle}
                      </span>
                      <span className="text-[9px] font-mono tabular-nums text-muted mt-0.5 leading-none">
                        {variante.stockFisico}u
                      </span>
                    </>
                  )}
                </motion.button>
              );
            })}
          </div>
        </div>
      </div>
    </article>
  );
};
