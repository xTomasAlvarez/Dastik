import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  X,
  Barcode,
  Copy,
  Check,
  ShoppingCart,
  Printer,
  Image as ImageIcon,
  CaretLeft,
  CaretRight,
} from '@phosphor-icons/react';
import { Button } from '../../../components/ui/Button';
import {
  normalizarUrlImagenAltaRes,
  type ProductoCatalogoDto,
  type VarianteDto,
} from '../api/inventarioApi';
import { useCartStore } from '../stores/useCartStore';
import { ModalImprimirEtiquetas } from '../../admin/components/ModalImprimirEtiquetas';

interface ModalQuickViewPosProps {
  isOpen: boolean;
  onClose: () => void;
  producto: ProductoCatalogoDto | null;
}

export const ModalQuickViewPos: React.FC<ModalQuickViewPosProps> = ({
  isOpen,
  onClose,
  producto,
}) => {
  const addItem = useCartStore((state) => state.addItem);

  const [selectedVariantId, setSelectedVariantId] = useState<number | null>(null);
  const [activeImageIndex, setActiveImageIndex] = useState<number>(0);
  const [copiedEan, setCopiedEan] = useState(false);
  const [justAdded, setJustAdded] = useState(false);
  const [isModalEtiquetasOpen, setIsModalEtiquetasOpen] = useState(false);

  // Construir galería de fotos reales en alta resolución (-1024-1024)
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

  // Inicializar variante e imagen activa al abrir el producto
  useEffect(() => {
    if (isOpen && producto) {
      setActiveImageIndex(0);
      setCopiedEan(false);
      setJustAdded(false);
      const primeraConStock =
        producto.variantes.find((v) => v.stockFisico > 0) ||
        producto.variantes[0] ||
        null;
      setSelectedVariantId(primeraConStock ? primeraConStock.id : null);
    }
  }, [isOpen, producto]);

  // Cerrar con Escape
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !isModalEtiquetasOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, isModalEtiquetasOpen, onClose]);

  if (!producto) return null;

  const varianteSeleccionada: VarianteDto | undefined =
    producto.variantes.find((v) => v.id === selectedVariantId) ||
    producto.variantes[0];

  const stockTotal = producto.variantes.reduce((acc, v) => acc + v.stockFisico, 0);

  const formatearDinero = (monto: number) =>
    new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS',
      minimumFractionDigits: 2,
    }).format(monto);

  const handleCopyEan = async () => {
    if (!varianteSeleccionada?.codigoBarras) return;
    try {
      await navigator.clipboard.writeText(varianteSeleccionada.codigoBarras);
      setCopiedEan(true);
      setTimeout(() => setCopiedEan(false), 1800);
    } catch {
      // Fallback silencioso
    }
  };

  const handleAddToTicket = () => {
    if (!varianteSeleccionada || varianteSeleccionada.stockFisico <= 0) return;

    addItem({
      varianteId: varianteSeleccionada.id,
      productoId: producto.id,
      nombreProducto: producto.nombre,
      marca: producto.marca,
      talle: varianteSeleccionada.talle,
      color: varianteSeleccionada.color,
      codigoBarras: varianteSeleccionada.codigoBarras,
      precioUnitario: producto.precioVenta,
      stockFisico: varianteSeleccionada.stockFisico,
      imagenUrl: galeriaImagenes[0] || normalizarUrlImagenAltaRes(producto.imagenUrl),
    });

    setJustAdded(true);
    setTimeout(() => setJustAdded(false), 1200);
  };

  const imagenActivaUrl = galeriaImagenes[activeImageIndex] || null;

  return (
    <>
      <AnimatePresence>
        {isOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.16 }}
              className="fixed inset-0 bg-black/75 backdrop-blur-sm"
              onClick={onClose}
            />

            {/* Dialog Box */}
            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: 8 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 8 }}
              transition={{ duration: 0.18, ease: 'easeOut' }}
              role="dialog"
              aria-modal="true"
              className="relative w-full max-w-3xl bg-surface border border-subtle rounded-2xl shadow-floating overflow-hidden z-10 flex flex-col md:flex-row max-h-[90vh]"
            >
              {/* Columna Izquierda: Galería / Carrusel de Imágenes */}
              <div className="w-full md:w-[46%] bg-elevated/60 border-b md:border-b-0 md:border-r border-subtle p-4 flex flex-col justify-between gap-3">
                {/* Visor Principal con proporción vertical (4:5) */}
                <div className="relative w-full aspect-[4/5] rounded-xl border border-subtle bg-surface overflow-hidden flex items-center justify-center">
                  {imagenActivaUrl ? (
                    <img
                      src={imagenActivaUrl}
                      alt={`${producto.nombre} - Foto ${activeImageIndex + 1}`}
                      decoding="async"
                      className="w-full h-full object-contain p-2 select-none"
                    />
                  ) : (
                    <div className="flex flex-col items-center justify-center gap-2 text-muted">
                      <ImageIcon size={44} weight="duotone" />
                      <span className="text-[11px] font-mono uppercase tracking-wider">
                        Sin imagen
                      </span>
                    </div>
                  )}

                  {/* Flechas del Carrusel si hay múltiples imágenes */}
                  {galeriaImagenes.length > 1 && (
                    <>
                      <button
                        type="button"
                        onClick={() =>
                          setActiveImageIndex((prev) =>
                            prev === 0 ? galeriaImagenes.length - 1 : prev - 1
                          )
                        }
                        className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-surface/90 border border-subtle text-primary flex items-center justify-center shadow-surface hover:border-strong cursor-pointer"
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
                        className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-surface/90 border border-subtle text-primary flex items-center justify-center shadow-surface hover:border-strong cursor-pointer"
                        title="Siguiente foto"
                      >
                        <CaretRight size={15} weight="bold" />
                      </button>
                    </>
                  )}

                  {/* Contador de fotos */}
                  {galeriaImagenes.length > 0 && (
                    <span className="absolute bottom-2 right-2 px-2 py-0.5 rounded-md bg-surface/90 border border-subtle text-[10px] font-mono font-semibold text-secondary">
                      {activeImageIndex + 1} / {galeriaImagenes.length}
                    </span>
                  )}
                </div>

                {/* Tira de Miniaturas seleccionables */}
                {galeriaImagenes.length > 0 && (
                  <div className="flex items-center gap-2 overflow-x-auto pb-1">
                    {galeriaImagenes.map((url, idx) => (
                      <button
                        key={`${url}-${idx}`}
                        type="button"
                        onClick={() => setActiveImageIndex(idx)}
                        className={`w-14 h-14 rounded-lg border overflow-hidden shrink-0 transition-fast cursor-pointer bg-surface ${
                          activeImageIndex === idx
                            ? 'border-amber-500 ring-2 ring-amber-500/25'
                            : 'border-subtle opacity-70 hover:opacity-100'
                        }`}
                        title={`Ver foto ${idx + 1}`}
                      >
                        <img
                          src={url}
                          alt={`Miniatura ${idx + 1}`}
                          decoding="async"
                          className="w-full h-full object-cover"
                        />
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Columna Derecha: Información, Talles y Código EAN-13 */}
              <div className="w-full md:w-[54%] p-5 sm:p-6 flex flex-col justify-between overflow-y-auto gap-4">
                <div className="space-y-4">
                  {/* Cabecera con Marca, Categoría y Botón Cerrar */}
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-[11px] font-semibold uppercase tracking-wider text-amber-600 dark:text-amber-400">
                          {producto.marca}
                        </span>
                        <span className="text-muted text-xs">·</span>
                        <span className="text-[11px] font-medium text-secondary">
                          {producto.categoria}
                        </span>
                        <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded border border-subtle bg-elevated text-secondary">
                          {stockTotal > 0 ? `${stockTotal} u. totales` : 'Agotado'}
                        </span>
                      </div>
                      <h2 className="text-lg sm:text-xl font-heading font-bold text-primary tracking-tight mt-1">
                        {producto.nombre}
                      </h2>
                    </div>

                    <button
                      type="button"
                      onClick={onClose}
                      className="p-1.5 rounded-lg border border-subtle bg-elevated hover:bg-surface text-secondary hover:text-primary transition-fast cursor-pointer shrink-0"
                      title="Cerrar [Esc]"
                    >
                      <X size={17} weight="bold" />
                    </button>
                  </div>

                  {/* Precio Venta */}
                  <div className="flex items-baseline justify-between border-y border-subtle py-3">
                    <span className="text-xs font-medium text-secondary">
                      Precio de Venta
                    </span>
                    <span className="text-2xl font-mono tabular-nums font-bold text-primary">
                      {formatearDinero(producto.precioVenta)}
                    </span>
                  </div>

                  {/* Descripción breve si existe */}
                  {producto.descripcion && (
                    <p className="text-xs text-secondary leading-relaxed line-clamp-3">
                      {producto.descripcion}
                    </p>
                  )}

                  {/* Selector de Variante (Talles con flex-wrap para soportar talles largos como '7 3/8 (58.7 CM)') */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-primary">
                        Seleccionar Talle / Variante
                      </span>
                      {varianteSeleccionada && (
                        <span className="text-[11px] font-mono text-secondary">
                          Color: <strong className="text-primary">{varianteSeleccionada.color}</strong> · Stock:{' '}
                          <strong
                            className={
                              varianteSeleccionada.stockFisico > 0
                                ? 'text-emerald-600 dark:text-emerald-400'
                                : 'text-red-500'
                            }
                          >
                            {varianteSeleccionada.stockFisico} u.
                          </strong>
                        </span>
                      )}
                    </div>

                    <div className="flex flex-wrap gap-2">
                      {producto.variantes.map((v) => {
                        const isSelected = varianteSeleccionada?.id === v.id;
                        const agotado = v.stockFisico <= 0;

                        return (
                          <motion.button
                            key={v.id}
                            type="button"
                            whileTap={{ scale: 0.95 }}
                            onClick={() => setSelectedVariantId(v.id)}
                            className={`rounded-lg border min-w-[2.5rem] w-auto px-2.5 py-1.5 whitespace-nowrap flex flex-col items-center justify-center transition-fast cursor-pointer ${
                              isSelected
                                ? 'border-amber-500 bg-amber-500/15 text-primary ring-2 ring-amber-500/20'
                                : agotado
                                ? 'border-subtle bg-elevated/40 text-muted opacity-55'
                                : 'border-subtle bg-elevated hover:border-strong text-primary'
                            }`}
                          >
                            <span className="font-mono text-xs font-bold leading-none whitespace-nowrap">
                              {v.talle}
                            </span>
                            <span className="text-[10px] font-mono text-muted mt-1 leading-none whitespace-nowrap">
                              {v.stockFisico}u
                            </span>
                          </motion.button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Bloque Destacado: Código EAN-13 del Talle Seleccionado */}
                  {varianteSeleccionada && (
                    <div className="rounded-xl border border-subtle bg-elevated p-3.5 flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="p-2 rounded-lg bg-surface border border-subtle text-amber-500 shrink-0">
                          <Barcode size={20} weight="bold" />
                        </div>
                        <div className="min-w-0">
                          <span className="text-[10px] font-sans font-semibold uppercase tracking-wider text-muted block">
                            Código de Ticket / EAN-13 (Talle {varianteSeleccionada.talle})
                          </span>
                          <span className="font-mono text-sm font-bold text-primary tracking-wider block truncate select-all">
                            {varianteSeleccionada.codigoBarras || 'SIN CÓDIGO'}
                          </span>
                        </div>
                      </div>

                      {varianteSeleccionada.codigoBarras && (
                        <button
                          type="button"
                          onClick={handleCopyEan}
                          className="px-2.5 py-1.5 rounded-lg border border-subtle bg-surface hover:border-strong text-xs font-mono font-semibold text-primary flex items-center gap-1.5 transition-fast cursor-pointer shrink-0"
                          title="Copiar código EAN-13 al portapapeles"
                        >
                          {copiedEan ? (
                            <>
                              <Check size={14} weight="bold" className="text-emerald-500" />
                              <span className="text-emerald-600 dark:text-emerald-400">
                                Copiado
                              </span>
                            </>
                          ) : (
                            <>
                              <Copy size={14} weight="regular" />
                              <span>Copiar EAN</span>
                            </>
                          )}
                        </button>
                      )}
                    </div>
                  )}
                </div>

                {/* Acciones Inferiores: Imprimir Etiqueta + Agregar al Ticket */}
                <div className="pt-4 border-t border-subtle flex items-center justify-between gap-2.5">
                  <Button
                    type="button"
                    variant="secondary"
                    size="md"
                    onClick={() => setIsModalEtiquetasOpen(true)}
                    className="gap-1.5 text-xs"
                    title="Abrir generador de etiquetas térmicas 38x21mm"
                  >
                    <Printer size={16} weight="duotone" className="text-amber-500" />
                    <span>Etiquetas</span>
                  </Button>

                  <Button
                    type="button"
                    variant="primary"
                    size="md"
                    disabled={!varianteSeleccionada || varianteSeleccionada.stockFisico <= 0}
                    onClick={handleAddToTicket}
                    className="flex-1 gap-2 text-xs font-bold"
                  >
                    {justAdded ? (
                      <>
                        <Check size={16} weight="bold" />
                        <span>Agregado al Ticket</span>
                      </>
                    ) : !varianteSeleccionada || varianteSeleccionada.stockFisico <= 0 ? (
                      <span>Talle Sin Stock</span>
                    ) : (
                      <>
                        <ShoppingCart size={16} weight="duotone" />
                        <span>
                          Agregar Talle {varianteSeleccionada.talle} al Ticket
                        </span>
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Modal de Impresión de Etiquetas reutilizado */}
      <ModalImprimirEtiquetas
        isOpen={isModalEtiquetasOpen}
        onClose={() => setIsModalEtiquetasOpen(false)}
        producto={producto}
      />
    </>
  );
};
