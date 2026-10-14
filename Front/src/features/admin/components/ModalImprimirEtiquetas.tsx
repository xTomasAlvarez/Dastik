import React, { useState, useEffect, useMemo } from 'react';
import {
  X,
  Printer,
  Barcode as BarcodeIcon,
  QrCode as QrCodeIcon,
  ArrowsClockwise,
  ListNumbers,
} from '@phosphor-icons/react';
import { Button } from '../../../components/ui/Button';
import { BarcodeEan13Svg } from './BarcodeEan13Svg';
import { QrCodeSvg } from './QrCodeSvg';
import type { ProductoCatalogoDto } from '../../pos/api/inventarioApi';

interface ModalImprimirEtiquetasProps {
  isOpen: boolean;
  onClose: () => void;
  producto: ProductoCatalogoDto | null;
}

type FormatoEtiqueta = 'ean13' | 'qr';

export const ModalImprimirEtiquetas: React.FC<ModalImprimirEtiquetasProps> = ({
  isOpen,
  onClose,
  producto,
}) => {
  const [formato, setFormato] = useState<FormatoEtiqueta>('ean13');
  const [cantidades, setCantidades] = useState<Record<number, number>>({});

  // Manejo de tecla Escape
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

  // Inicializar cantidades con 1 por talle (curva base) al abrir
  useEffect(() => {
    if (isOpen && producto && producto.variantes) {
      const init: Record<number, number> = {};
      producto.variantes.forEach((v) => {
        init[v.id] = 1;
      });
      setCantidades(init);
      setFormato('ean13');
    }
  }, [isOpen, producto]);

  if (!isOpen || !producto) return null;

  // Acciones rápidas de carga
  const handleCargarCurva = () => {
    const next: Record<number, number> = {};
    producto.variantes?.forEach((v) => {
      next[v.id] = 1;
    });
    setCantidades(next);
  };

  const handleCargarStockActual = () => {
    const next: Record<number, number> = {};
    producto.variantes?.forEach((v) => {
      next[v.id] = Math.max(0, v.stockFisico || 0);
    });
    setCantidades(next);
  };

  const handleLimpiarTodo = () => {
    const next: Record<number, number> = {};
    producto.variantes?.forEach((v) => {
      next[v.id] = 0;
    });
    setCantidades(next);
  };

  const setCantidadVariante = (varianteId: number, qty: number) => {
    setCantidades((prev) => ({
      ...prev,
      [varianteId]: Math.max(0, qty),
    }));
  };

  // Generar lista plana de etiquetas a imprimir
  const listaEtiquetas = useMemo(() => {
    const list: Array<{
      varianteId: number;
      talle: string;
      color: string;
      codigoBarras: string;
      precio: number;
      marca: string;
      nombre: string;
      unidadNegocio: string;
    }> = [];

    producto.variantes?.forEach((v) => {
      const cant = cantidades[v.id] || 0;
      for (let i = 0; i < cant; i++) {
        list.push({
          varianteId: v.id,
          talle: v.talle,
          color: v.color,
          codigoBarras: v.codigoBarras || `20${String(v.id).padStart(10, '0')}`,
          precio: producto.precioVenta,
          marca: producto.marca || 'DASTIK',
          nombre: producto.nombre,
          unidadNegocio: producto.unidadNegocio || 'Dastik',
        });
      }
    });

    return list;
  }, [producto, cantidades]);

  const totalEtiquetas = listaEtiquetas.length;

  const handleImprimir = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/85 backdrop-blur-sm transition-opacity duration-150 print:hidden"
        onClick={onClose}
      />

      {/* Estilos para impresión @media print */}
      <style>{`
        @media print {
          body * {
            visibility: hidden !important;
          }
          #printable-labels-container, #printable-labels-container * {
            visibility: visible !important;
          }
          #printable-labels-container {
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 100% !important;
            background: #FFFFFF !important;
            color: #000000 !important;
            padding: 0 !important;
            margin: 0 !important;
          }
          .label-print-card {
            page-break-inside: avoid !important;
            break-inside: avoid !important;
            border: 1px dashed #444444 !important;
            color: #000000 !important;
            background: #FFFFFF !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
        }
      `}</style>

      {/* Modal Dialog */}
      <div className="relative w-full max-w-4xl bg-[#090909] border border-[#333333] text-[#FAFAFA] flex flex-col max-h-[92vh] z-10 animate-in fade-in zoom-in-95 duration-150 print:hidden">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-[#222222] bg-[#0C0C0C] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 border border-[#333333] bg-[#141414] flex items-center justify-center text-amber-400">
              <Printer size={18} weight="bold" />
            </div>
            <div>
              <span className="text-[10px] uppercase font-mono tracking-widest text-amber-400 font-bold block">
                CONTROL DE STOCK // IMPRESIÓN CASERA DE ETIQUETAS
              </span>
              <h2 className="font-heading font-extrabold text-base sm:text-lg text-[#FAFAFA] tracking-tight uppercase">
                ETIQUETAS: {producto.nombre}
              </h2>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 border border-[#333333] bg-[#141414] hover:bg-[#222222] text-[#A1A1AA] hover:text-white transition-fast cursor-pointer"
            title="Cerrar (Esc)"
          >
            <X size={16} weight="light" />
          </button>
        </div>

        {/* Controles de Configuración */}
        <div className="p-4 sm:p-5 border-b border-[#222222] bg-[#0A0A0A] space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-4">
            {/* Formato Visual (EAN-13 vs QR) */}
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono uppercase tracking-widest text-[#71717A] mr-1">
                FORMATO VISUAL:
              </span>
              <button
                type="button"
                onClick={() => setFormato('ean13')}
                className={`flex items-center gap-1.5 px-3 py-1.5 border text-xs font-heading font-semibold transition-fast cursor-pointer ${
                  formato === 'ean13'
                    ? 'border-amber-400 bg-amber-950/40 text-amber-300'
                    : 'border-[#333333] bg-[#141414] text-[#A1A1AA] hover:text-white'
                }`}
              >
                <BarcodeIcon size={16} weight="light" />
                <span>CÓDIGO DE BARRAS (EAN-13)</span>
              </button>

              <button
                type="button"
                onClick={() => setFormato('qr')}
                className={`flex items-center gap-1.5 px-3 py-1.5 border text-xs font-heading font-semibold transition-fast cursor-pointer ${
                  formato === 'qr'
                    ? 'border-amber-400 bg-amber-950/40 text-amber-300'
                    : 'border-[#333333] bg-[#141414] text-[#A1A1AA] hover:text-white'
                }`}
              >
                <QrCodeIcon size={16} weight="light" />
                <span>CÓDIGO QR</span>
              </button>
            </div>

            {/* Botones rápidos de carga */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleCargarCurva}
                className="text-[10px] font-mono uppercase tracking-wider px-2.5 py-1.5 border border-[#333333] bg-[#111111] hover:border-[#555555] text-[#A1A1AA] hover:text-white transition-fast cursor-pointer flex items-center gap-1"
                title="Carga 1 etiqueta por cada talle del producto"
              >
                <ListNumbers size={13} />
                <span>1 POR TALLE (CURVA)</span>
              </button>

              <button
                type="button"
                onClick={handleCargarStockActual}
                className="text-[10px] font-mono uppercase tracking-wider px-2.5 py-1.5 border border-[#333333] bg-[#111111] hover:border-amber-400 text-amber-300 hover:text-amber-200 transition-fast cursor-pointer flex items-center gap-1"
                title="Carga la cantidad exacta según el stock físico en tienda"
              >
                <ArrowsClockwise size={13} />
                <span>CARGAR SEGÚN STOCK ACTUAL</span>
              </button>

              <button
                type="button"
                onClick={handleLimpiarTodo}
                className="text-[10px] font-mono uppercase tracking-wider px-2 py-1.5 border border-transparent hover:border-red-900 text-red-400 hover:text-red-300 transition-fast cursor-pointer"
              >
                LIMPIAR
              </button>
            </div>
          </div>

          {/* Selector de cantidad por variante */}
          <div className="border border-[#222222] bg-[#111111] p-3">
            <span className="text-[10px] font-mono uppercase tracking-widest text-[#71717A] block mb-2">
              CANTIDAD DE ETIQUETAS POR TALLE:
            </span>
            <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-2.5">
              {producto.variantes?.map((v) => {
                const qty = cantidades[v.id] || 0;
                return (
                  <div
                    key={v.id}
                    className="border border-[#2A2A2A] bg-[#0E0E0E] p-2 flex flex-col items-center gap-1.5"
                  >
                    <div className="flex items-center gap-1.5">
                      <span className="font-heading font-black text-sm text-[#FAFAFA]">
                        {v.talle}
                      </span>
                      <span className="text-[10px] font-mono text-[#71717A]">
                        ({v.stockFisico}u)
                      </span>
                    </div>

                    <div className="flex items-center border border-[#333333] bg-black">
                      <button
                        type="button"
                        onClick={() => setCantidadVariante(v.id, qty - 1)}
                        className="px-2 py-0.5 text-xs text-[#FAFAFA] hover:bg-[#222222] cursor-pointer"
                      >
                        -
                      </button>
                      <input
                        type="number"
                        min="0"
                        value={qty}
                        onChange={(e) => setCantidadVariante(v.id, parseInt(e.target.value) || 0)}
                        className="w-10 text-center bg-transparent text-xs font-mono font-bold text-amber-400 outline-none"
                      />
                      <button
                        type="button"
                        onClick={() => setCantidadVariante(v.id, qty + 1)}
                        className="px-2 py-0.5 text-xs text-[#FAFAFA] hover:bg-[#222222] cursor-pointer"
                      >
                        +
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Vista previa en pantalla de las etiquetas */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-[#070707] space-y-3">
          <div className="flex items-center justify-between text-xs font-mono">
            <span className="text-[#71717A] uppercase tracking-wider">
              VISTA PREVIA DE HOJA DE IMPRESIÓN ({totalEtiquetas} ETIQUETAS GENERADAS)
            </span>
            <span className="text-amber-400 font-bold">
              FORMATO: {formato === 'ean13' ? 'EAN-13 LÁSER' : 'CÓDIGO QR ÓPTICO'}
            </span>
          </div>

          {totalEtiquetas === 0 ? (
            <div className="p-12 text-center border border-dashed border-[#222222] text-[#71717A] text-xs font-mono">
              No hay etiquetas seleccionadas para imprimir. Ajusta las cantidades arriba.
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              {listaEtiquetas.map((item, idx) => (
                <div
                  key={`${item.varianteId}-${idx}`}
                  className="bg-white text-black p-3.5 border border-zinc-300 flex flex-col justify-between select-none shadow-none"
                  style={{ minHeight: '140px' }}
                >
                  {/* Encabezado: Marca y Nombre */}
                  <div className="border-b border-black pb-1.5 flex items-start justify-between gap-1">
                    <div className="overflow-hidden">
                      <span className="text-[10px] font-mono uppercase tracking-widest font-black block text-zinc-900 leading-none">
                        {item.marca.toUpperCase()}
                      </span>
                      <h4 className="font-heading font-extrabold text-xs uppercase leading-tight mt-0.5 truncate text-black">
                        {item.nombre}
                      </h4>
                    </div>
                    {/* Talle BIEN GRANDE */}
                    <div className="border-2 border-black px-2 py-0.5 font-heading font-black text-base leading-none shrink-0 bg-black text-white">
                      {item.talle}
                    </div>
                  </div>

                  {/* Cuerpo: Gráfico Barcode o QR */}
                  <div className="py-2 flex flex-col items-center justify-center">
                    {formato === 'ean13' ? (
                      <BarcodeEan13Svg code={item.codigoBarras} height={42} className="w-full" />
                    ) : (
                      <QrCodeSvg value={item.codigoBarras} size={64} />
                    )}
                  </div>

                  {/* Pie: Número legible y precio */}
                  <div className="border-t border-black pt-1 flex items-center justify-between text-[10px] font-mono">
                    <span className="tracking-widest font-bold text-zinc-900">
                      {item.codigoBarras}
                    </span>
                    <span className="font-heading font-black text-xs text-black">
                      ${item.precio.toLocaleString('es-AR', { minimumFractionDigits: 0 })}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 sm:p-5 border-t border-[#222222] bg-[#0C0C0C] flex items-center justify-between">
          <span className="text-[10px] font-mono text-[#555555] uppercase tracking-wider">
            Total a imprimir: <strong className="text-white">{totalEtiquetas}</strong> etiquetas
          </span>

          <div className="flex items-center gap-3">
            <Button
              variant="secondary"
              size="md"
              onClick={onClose}
              className="text-xs font-mono tracking-wider border-[#333333]"
            >
              CANCELAR
            </Button>

            <Button
              variant="primary"
              size="md"
              disabled={totalEtiquetas === 0}
              onClick={handleImprimir}
              className="gap-2 text-xs font-heading font-bold tracking-wider px-5 bg-amber-400 text-black hover:bg-amber-300 border-amber-400 cursor-pointer"
            >
              <Printer size={16} weight="bold" />
              <span>IMPRIMIR / GUARDAR PDF</span>
            </Button>
          </div>
        </div>
      </div>

      {/* ======================================================== */}
      {/* Contenedor Limpio Exclusivo para Impresión Física         */}
      {/* ======================================================== */}
      <div id="printable-labels-container" className="hidden print:grid grid-cols-3 gap-2 p-2">
        {listaEtiquetas.map((item, idx) => (
          <div
            key={`print-${item.varianteId}-${idx}`}
            className="label-print-card p-3 flex flex-col justify-between bg-white text-black"
            style={{ width: '65mm', height: '40mm', boxSizing: 'border-box' }}
          >
            <div className="border-b border-black pb-1 flex items-start justify-between gap-1">
              <div className="overflow-hidden">
                <span className="text-[9px] font-mono uppercase tracking-widest font-black block leading-none">
                  {item.marca.toUpperCase()}
                </span>
                <h4 className="font-heading font-extrabold text-[11px] uppercase leading-tight truncate">
                  {item.nombre}
                </h4>
              </div>
              <div className="border-2 border-black px-1.5 py-0.5 font-heading font-black text-sm leading-none bg-black text-white shrink-0">
                {item.talle}
              </div>
            </div>

            <div className="py-1 flex items-center justify-center">
              {formato === 'ean13' ? (
                <BarcodeEan13Svg code={item.codigoBarras} height={36} className="w-full" />
              ) : (
                <QrCodeSvg value={item.codigoBarras} size={48} />
              )}
            </div>

            <div className="border-t border-black pt-0.5 flex items-center justify-between text-[9px] font-mono">
              <span className="tracking-widest font-bold">{item.codigoBarras}</span>
              <span className="font-heading font-black text-[10px]">
                ${item.precio.toLocaleString('es-AR', { minimumFractionDigits: 0 })}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
