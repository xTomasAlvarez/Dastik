import React, { useState, useMemo } from 'react';
import { motion } from 'motion/react';
import { Sneaker, TShirt, Package, Check, Eye } from '@phosphor-icons/react';
import {
  normalizarUrlImagenAltaRes,
  type ProductoCatalogoDto,
  type VarianteDto,
} from '../api/inventarioApi';
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

  // Extraer y normalizar galería completa de imágenes en alta resolución
  const imagenesNormalizadas = useMemo(() => {
    const urls: string[] = [];
    if (producto.imagenes && producto.imagenes.length > 0) {
      for (const u of producto.imagenes) {
        const norm = normalizarUrlImagenAltaRes(u);
        if (norm && !urls.includes(norm)) urls.push(norm);
      }
    }
    if (urls.length === 0 && producto.imagenUrl) {
      const norm = normalizarUrlImagenAltaRes(producto.imagenUrl);
      if (norm) urls.push(norm);
    }
    return urls;
  }, [producto]);

  const fotoFrontal = imagenesNormalizadas[0] || null;
  const fotoSecundaria = imagenesNormalizadas.length > 1 ? imagenesNormalizadas[1] : null;

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
      imagenUrl: fotoFrontal || '',
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
      catLower.includes('zapatilla') ||
      catLower.includes('sneaker') ||
      producto.unidadNegocio?.toLowerCase().includes('sneakers')
    ) {
      return <Sneaker size={36} weight="duotone" className="text-amber-500/80" />;
    }
    if (
      catLower.includes('indumentaria') ||
      catLower.includes('remera') ||
      catLower.includes('pantalon') ||
      catLower.includes('buzo') ||
      catLower.includes('campera')
    ) {
      return <TShirt size={36} weight="duotone" className="text-muted" />;
    }
    return <Package size={36} weight="duotone" className="text-muted" />;
  };

  const stockTotal = producto.variantes.reduce((sum, v) => sum + v.stockFisico, 0);
  const mostrarImagenReal = Boolean(fotoFrontal) && !imageError;

  return (
    <article className="border border-black/[0.08] dark:border-white/[0.07] bg-white dark:bg-[#0E1015]/90 hover:border-black/20 dark:hover:border-white/[0.22] shadow-sm hover:shadow-[0_8px_30px_rgb(0,0,0,0.12)] dark:hover:shadow-[0_8px_30px_rgb(0,0,0,0.5)] transition-all duration-300 rounded-xl overflow-hidden flex flex-col h-full group">
      {/* 1. Cabecera Visual con Proporción Vertical (aspect-[4/5]), Flip en Hover y Vignette */}
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
        className="relative aspect-[4/5] w-full bg-elevated/70 border-b border-subtle overflow-hidden flex items-center justify-center cursor-pointer select-none shrink-0"
        title="Ver detalles, galería y código EAN-13"
      >
        {mostrarImagenReal ? (
          <>
            {/* Foto Frontal con zoom cinemático en hover */}
            <img
              src={fotoFrontal!}
              alt={producto.nombre}
              loading="lazy"
              decoding="async"
              onError={() => setImageError(true)}
              className="absolute inset-0 w-full h-full object-cover object-center transition-transform duration-700 ease-out group-hover:scale-105"
            />

            {/* Foto Secundaria (Flip en hover con disolvencia suave estilo Godly/editorial) */}
            {fotoSecundaria && !imageError && (
              <img
                src={fotoSecundaria}
                alt={`${producto.nombre} - dorso / lookbook`}
                loading="lazy"
                decoding="async"
                className="absolute inset-0 w-full h-full object-cover object-center opacity-0 group-hover:opacity-100 transition-all duration-500 ease-out group-hover:scale-105"
              />
            )}
          </>
        ) : (
          renderProductIcon()
        )}

        {/* Vignette Cinematográfico sutil en el pie de la imagen */}
        <div className="absolute inset-x-0 bottom-0 h-28 bg-gradient-to-t from-black/60 via-black/15 to-transparent pointer-events-none z-1" />

        {/* Badge Glassmorphism Superior Izquierdo: Marca */}
        <span className="absolute top-2.5 left-2.5 z-10 backdrop-blur-md bg-black/50 border border-white/10 text-white/90 font-mono text-[10px] tracking-wider px-2 py-0.5 rounded-md truncate max-w-[60%] uppercase">
          {producto.marca}
        </span>

        {/* Badge Glassmorphism Superior Derecho: Stock Limpio Técnico (Sin punto verde) */}
        <span className="absolute top-2.5 right-2.5 z-10 backdrop-blur-md bg-black/50 border border-white/10 text-zinc-300 font-mono text-[10px] tracking-wider px-2 py-0.5 rounded-md uppercase select-none">
          {stockTotal > 0 ? `[ ${String(stockTotal).padStart(2, '0')} U. ]` : '[ AGOTADO ]'}
        </span>

        {/* Botón Flotante Minimalista: "Vista Rápida" en Hover */}
        <div className="absolute inset-x-0 bottom-3 z-10 flex justify-center pointer-events-none">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onOpenQuickView?.(producto);
            }}
            className="pointer-events-auto backdrop-blur-md bg-black/75 hover:bg-black/90 border border-white/20 hover:border-white/40 text-white/95 px-3 py-1.5 rounded-full text-[10px] font-mono tracking-widest uppercase flex items-center gap-1.5 shadow-lg translate-y-2 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300 cursor-pointer active:scale-95"
          >
            <Eye size={13} weight="bold" className="text-amber-400" />
            <span>Vista Rápida</span>
            {imagenesNormalizadas.length > 1 && (
              <span className="text-white/50 text-[9px]">({imagenesNormalizadas.length})</span>
            )}
          </button>
        </div>
      </div>

      {/* 2. Cuerpo: Nombre + Precio + Categoría + Talles anclados al fondo con mt-auto */}
      <div className="p-3.5 pb-3 flex-1 flex flex-col justify-between">
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
          <div className="flex items-baseline justify-between mt-1 gap-2">
            <p className="font-mono tabular-nums text-sm sm:text-base font-bold text-primary tracking-tight shrink-0">
              {formatearDinero(producto.precioVenta)}
            </p>
            <span className="text-[10px] text-muted font-sans truncate">
              {producto.categoria}
            </span>
          </div>
        </div>

        {/* 3. Pills Táctiles de Talles (hasta 6 talles en una fila, anclados prolijamente al fondo) */}
        <div className="mt-auto pt-3 border-t border-subtle">
          <div className="flex flex-wrap gap-1">
            {producto.variantes.map((variante) => {
              const isOutOfStock = variante.stockFisico <= 0;
              const isJustAdded = lastAddedVariantId === variante.id;

              return (
                <motion.button
                  key={variante.id}
                  type="button"
                  whileHover={!isOutOfStock ? { y: -1 } : undefined}
                  whileTap={!isOutOfStock ? { scale: 0.92 } : undefined}
                  onClick={() => handleSelectVariant(variante)}
                  disabled={isOutOfStock}
                  title={`Talle ${variante.talle} (${variante.color}) · ${variante.stockFisico} disp. · EAN: ${variante.codigoBarras}`}
                  className={`relative rounded-lg border min-w-[2rem] w-auto px-1.5 py-1 whitespace-nowrap text-center transition-all duration-200 flex flex-col items-center justify-center ${
                    isOutOfStock
                      ? 'border-subtle bg-elevated/35 text-muted opacity-40 line-through cursor-not-allowed'
                      : isJustAdded
                      ? 'border-emerald-400 bg-emerald-500/90 text-white shadow-[0_0_12px_rgba(52,211,153,0.7)] ring-2 ring-emerald-400/50 cursor-pointer'
                      : 'border-subtle bg-elevated hover:border-amber-500/60 hover:bg-amber-500/10 text-primary cursor-pointer'
                  }`}
                >
                  {isJustAdded ? (
                    <motion.div
                      initial={{ scale: 0.5, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      className="flex items-center justify-center"
                    >
                      <Check size={13} weight="bold" className="text-white drop-shadow" />
                    </motion.div>
                  ) : (
                    <>
                      <span className="font-mono tabular-nums text-[11px] font-bold leading-none whitespace-nowrap">
                        {variante.talle}
                      </span>
                      <span className="text-[9px] font-mono tabular-nums text-muted mt-0.5 leading-none whitespace-nowrap">
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
