import React, { useState, useRef, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Barcode, CheckCircle, WarningCircle, X } from '@phosphor-icons/react';
import { inventarioApi, type ProductoCatalogoDto } from '../api/inventarioApi';
import { useCartStore } from '../stores/useCartStore';

interface PosBarcodeScannerProps {
  productos?: ProductoCatalogoDto[];
}

export const PosBarcodeScanner: React.FC<PosBarcodeScannerProps> = ({ productos: productosProp }) => {
  const [codigoIngresado, setCodigoIngresado] = useState('');
  const [feedback, setFeedback] = useState<{ tipo: 'ok' | 'error'; mensaje: string } | null>(null);
  const [isShaking, setIsShaking] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const addItem = useCartStore((state) => state.addItem);

  // Obtener productos desde TanStack Query (reutiliza cache de CatalogoGrid)
  const { data: productosQuery = [] } = useQuery({
    queryKey: ['catalogo-pos'],
    queryFn: inventarioApi.obtenerProductos,
    enabled: !productosProp || productosProp.length === 0,
  });

  const productos = productosProp && productosProp.length > 0 ? productosProp : productosQuery;

  // Garantizar auto-focus constante para la pistola lectora láser
  useEffect(() => {
    inputRef.current?.focus();

    const handleWindowClick = (e: MouseEvent) => {
      // Si hay un modal o diálogo abierto (body overflow hidden), no robar foco
      if (document.body.style.overflow === 'hidden') {
        return;
      }

      const target = e.target as HTMLElement | null;
      if (target && !['INPUT', 'TEXTAREA', 'BUTTON', 'A', 'SELECT'].includes(target.tagName)) {
        inputRef.current?.focus();
      }
    };

    window.addEventListener('click', handleWindowClick);
    return () => window.removeEventListener('click', handleWindowClick);
  }, []);

  const procesarCodigo = (codigo: string) => {
    const cleanCode = codigo.trim();
    if (!cleanCode) return;

    let foundProduct = null;
    let foundVariant = null;

    for (const prod of productos) {
      const match = prod.variantes.find(
        (v) => v.codigoBarras.trim() === cleanCode || v.codigoBarras === cleanCode
      );
      if (match) {
        foundProduct = prod;
        foundVariant = match;
        break;
      }
    }

    if (foundProduct && foundVariant) {
      if (foundVariant.stockFisico <= 0) {
        setFeedback({
          tipo: 'error',
          mensaje: `Sin stock: ${foundProduct.nombre} (${foundVariant.talle}) no tiene unidades disponibles.`,
        });
        triggerShake();
      } else {
        addItem({
          varianteId: foundVariant.id,
          productoId: foundProduct.id,
          nombreProducto: foundProduct.nombre,
          marca: foundProduct.marca,
          talle: foundVariant.talle,
          color: foundVariant.color,
          codigoBarras: foundVariant.codigoBarras,
          precioUnitario: foundProduct.precioVenta,
          stockFisico: foundVariant.stockFisico,
        });

        setFeedback({
          tipo: 'ok',
          mensaje: `Agregado: ${foundProduct.nombre} · Talle ${foundVariant.talle} (${foundVariant.codigoBarras})`,
        });
      }
    } else {
      setFeedback({
        tipo: 'error',
        mensaje: `Código no encontrado: El EAN-13 "${cleanCode}" no pertenece a ningún artículo activo.`,
      });
      triggerShake();
    }

    setCodigoIngresado('');

    setTimeout(() => {
      setFeedback(null);
    }, 3500);
  };

  const triggerShake = () => {
    setIsShaking(true);
    setTimeout(() => {
      setIsShaking(false);
    }, 400);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    procesarCodigo(codigoIngresado);
  };

  return (
    <div
      className={`rounded-xl border bg-surface p-4 flex flex-col gap-3 shadow-surface transition-fast ${
        isShaking
          ? 'border-red-500 translate-x-1 duration-75'
          : feedback?.tipo === 'error'
          ? 'border-red-500/60'
          : feedback?.tipo === 'ok'
          ? 'border-emerald-500/60'
          : 'border-subtle'
      }`}
    >
      <div className="flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Indicador de Estado del Lector Láser */}
        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="border border-subtle bg-elevated rounded-lg p-2.5 text-primary shrink-0">
            <Barcode size={22} weight="duotone" className="text-emerald-500" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-[11px] font-medium text-secondary">
                Lector Óptico EAN-13 Online
              </span>
            </div>
            <span className="text-xs font-semibold text-primary block mt-0.5">
              Auto-Scan activo: dispara el láser o ingresa el código manualmente
            </span>
          </div>
        </div>

        {/* Formulario e Input de Captura Constante */}
        <form onSubmit={handleSubmit} className="w-full md:w-96 relative">
          <div className="flex items-center border border-subtle focus-within:border-amber-500/80 focus-within:ring-2 focus-within:ring-amber-500/20 bg-elevated rounded-lg px-3 py-2 transition-fast">
            <span className="font-mono text-emerald-500 font-bold mr-2 text-xs select-none">&gt;</span>
            <input
              ref={inputRef}
              type="text"
              inputMode="numeric"
              value={codigoIngresado}
              onChange={(e) => setCodigoIngresado(e.target.value)}
              placeholder="Escanea con láser o tipea EAN..."
              className="bg-transparent text-xs font-mono tabular-nums text-primary placeholder:text-muted outline-none w-full"
              autoFocus
              onBlur={() => {
                setTimeout(() => {
                  if (
                    document.activeElement?.tagName !== 'INPUT' &&
                    document.activeElement?.tagName !== 'TEXTAREA' &&
                    document.activeElement?.tagName !== 'SELECT'
                  ) {
                    inputRef.current?.focus();
                  }
                }, 100);
              }}
            />
            {codigoIngresado && (
              <button
                type="submit"
                className="text-[11px] font-sans font-semibold bg-[var(--btn-primary-bg)] text-[var(--btn-primary-text)] rounded-md px-2.5 py-1 hover:opacity-90 transition-fast cursor-pointer shrink-0 ml-2"
              >
                Ingresar
              </button>
            )}
          </div>
        </form>
      </div>

      {/* Toast / Feedback discreto de escaneo */}
      {feedback && (
        <div
          className={`rounded-lg border px-3.5 py-2 flex items-center justify-between text-xs font-sans transition-fast ${
            feedback.tipo === 'ok'
              ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300'
              : 'border-red-500/30 bg-red-500/10 text-red-700 dark:text-red-300'
          }`}
        >
          <div className="flex items-center gap-2">
            {feedback.tipo === 'ok' ? (
              <CheckCircle size={16} weight="duotone" className="text-emerald-500 shrink-0" />
            ) : (
              <WarningCircle size={16} weight="duotone" className="text-red-500 shrink-0" />
            )}
            <span className="font-medium">{feedback.mensaje}</span>
          </div>
          <button
            type="button"
            onClick={() => setFeedback(null)}
            className="text-muted hover:text-primary p-0.5 cursor-pointer rounded-md"
          >
            <X size={14} weight="regular" />
          </button>
        </div>
      )}
    </div>
  );
};
