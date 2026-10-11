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
      const target = e.target as HTMLElement | null;
      // Si el usuario no está haciendo clic en otro input, textarea o botón, reenfocar el scanner
      if (target && !['INPUT', 'TEXTAREA', 'BUTTON', 'A'].includes(target.tagName)) {
        inputRef.current?.focus();
      }
    };

    window.addEventListener('click', handleWindowClick);
    return () => window.removeEventListener('click', handleWindowClick);
  }, []);

  const procesarCodigo = (codigo: string) => {
    const cleanCode = codigo.trim();
    if (!cleanCode) return;

    // Buscar la variante y su producto padre correspondiente
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
          mensaje: `SIN STOCK: ${foundProduct.nombre} (${foundVariant.talle}) no tiene unidades disponibles.`,
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
          mensaje: `AGREGADO: ${foundProduct.nombre} - Talle ${foundVariant.talle} (${foundVariant.codigoBarras})`,
        });
      }
    } else {
      setFeedback({
        tipo: 'error',
        mensaje: `CÓDIGO NO ENCONTRADO: El EAN-13 "${cleanCode}" no pertenece a ningún artículo activo.`,
      });
      triggerShake();
    }

    setCodigoIngresado('');

    // Auto-limpiar feedback tras 3.5 segundos
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
      className={`
        border bg-[#090909] p-4 flex flex-col gap-3 transition-fast
        ${
          isShaking
            ? 'border-red-500 translate-x-1 duration-75'
            : feedback?.tipo === 'error'
            ? 'border-red-900/80'
            : feedback?.tipo === 'ok'
            ? 'border-emerald-600/80'
            : 'border-[#333333]'
        }
      `}
    >
      <div className="flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Indicador de Estado del Lector Láser */}
        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="border border-[#222222] bg-[#111111] p-2 text-[#FAFAFA] shrink-0">
            <Barcode size={24} weight="light" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-[10px] uppercase tracking-widest text-[#71717A] font-mono">
                LECTOR ÓPTICO EAN-13 ONLINE
              </span>
            </div>
            <span className="text-xs font-heading font-bold text-[#FAFAFA] block mt-0.5">
              AUTO-SCAN ACTIVO: DISPARA EL LÁSER O INGRESA MANUALMENTE
            </span>
          </div>
        </div>

        {/* Formulario e Input de Captura Constante */}
        <form onSubmit={handleSubmit} className="w-full md:w-96 relative">
          <div className="flex items-center border border-[#333333] focus-within:border-[#FAFAFA] bg-[#111111] px-3 py-2 transition-fast">
            <span className="font-mono text-emerald-400 mr-2 text-xs select-none">&gt;</span>
            <input
              ref={inputRef}
              type="text"
              inputMode="numeric"
              value={codigoIngresado}
              onChange={(e) => setCodigoIngresado(e.target.value)}
              placeholder="Escanea con láser o tipea EAN..."
              className="bg-transparent text-xs font-mono text-[#FAFAFA] placeholder:text-[#555555] outline-none w-full"
              autoFocus
              onBlur={() => {
                // Reenfocar automáticamente si el cajero hace click en la UI
                setTimeout(() => {
                  if (document.activeElement?.tagName !== 'INPUT' && document.activeElement?.tagName !== 'TEXTAREA') {
                    inputRef.current?.focus();
                  }
                }, 100);
              }}
            />
            {codigoIngresado && (
              <button
                type="submit"
                className="text-[9px] font-mono uppercase bg-[#FAFAFA] text-[#000000] px-2 py-0.5 font-bold hover:bg-[#E5E5E5] transition-fast cursor-pointer shrink-0 ml-2"
              >
                INGRESAR
              </button>
            )}
          </div>
        </form>
      </div>

      {/* Toast / Feedback discreto de escaneo */}
      {feedback && (
        <div
          className={`
            border px-3 py-2 flex items-center justify-between text-xs font-mono transition-fast
            ${
              feedback.tipo === 'ok'
                ? 'border-emerald-900/80 bg-emerald-950/30 text-emerald-300'
                : 'border-red-900/80 bg-red-950/30 text-red-300'
            }
          `}
        >
          <div className="flex items-center gap-2">
            {feedback.tipo === 'ok' ? (
              <CheckCircle size={16} weight="light" className="text-emerald-400 shrink-0" />
            ) : (
              <WarningCircle size={16} weight="light" className="text-red-400 shrink-0" />
            )}
            <span>{feedback.mensaje}</span>
          </div>
          <button
            type="button"
            onClick={() => setFeedback(null)}
            className="text-[#71717A] hover:text-[#FAFAFA] p-0.5 cursor-pointer"
          >
            <X size={12} weight="light" />
          </button>
        </div>
      )}
    </div>
  );
};
