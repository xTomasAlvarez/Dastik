import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  X,
  Printer,
  Barcode as BarcodeIcon,
  QrCode as QrCodeIcon,
  ArrowsClockwise,
  ListNumbers,
  DownloadSimple,
} from '@phosphor-icons/react';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
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

interface EtiquetaItem {
  varianteId: number;
  talle: string;
  color: string;
  codigoBarras: string;
  precioContado: number;
  precioLista: number;
  marca: string;
  nombre: string;
  unidadNegocio: string;
}

export const ModalImprimirEtiquetas: React.FC<ModalImprimirEtiquetasProps> = ({
  isOpen,
  onClose,
  producto,
}) => {
  // 1. TODOS LOS HOOKS SE DECLARAN INCONDICIONALMENTE AL INICIO
  const [formato, setFormato] = useState<FormatoEtiqueta>('ean13');
  const [cantidades, setCantidades] = useState<Record<number, number>>({});
  const [isExportingPdf, setIsExportingPdf] = useState(false);
  const printSheetRef = useRef<HTMLDivElement>(null);

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
    if (isOpen && producto) {
      const init: Record<number, number> = {};
      const variantes = producto.variantes ?? [];
      variantes.forEach((v) => {
        init[v.id] = 1;
      });
      setCantidades(init);
      setFormato('ean13');
      setIsExportingPdf(false);
    }
  }, [isOpen, producto]);

  // Generar lista plana de etiquetas de forma defensiva
  const listaEtiquetas = useMemo<EtiquetaItem[]>(() => {
    if (!isOpen || !producto) return [];
    const list: EtiquetaItem[] = [];

    const variantes = producto.variantes ?? [];
    const precioBase = Math.round(producto.precioVenta ?? 0);
    const precioListaBase = Math.round(precioBase * 1.25);

    variantes.forEach((v) => {
      const cant = cantidades[v.id] || 0;
      const rawCode = v.codigoBarras ? v.codigoBarras.trim() : '';
      const codigoSeguro = rawCode.length >= 6 ? rawCode : `20${String(v.id).padStart(10, '0')}`;

      for (let i = 0; i < cant; i++) {
        list.push({
          varianteId: v.id,
          talle: v.talle || 'U',
          color: v.color || '',
          codigoBarras: codigoSeguro,
          precioContado: precioBase,
          precioLista: precioListaBase,
          marca: producto.marca || 'DASTIK',
          nombre: producto.nombre || 'PRENDA',
          unidadNegocio: producto.unidadNegocio || 'Dastik',
        });
      }
    });

    return list;
  }, [isOpen, producto, cantidades]);

  // Handlers para cantidades
  const handleCargarCurva = () => {
    if (!producto) return;
    const next: Record<number, number> = {};
    const variantes = producto.variantes ?? [];
    variantes.forEach((v) => {
      next[v.id] = 1;
    });
    setCantidades(next);
  };

  const handleCargarStockActual = () => {
    if (!producto) return;
    const next: Record<number, number> = {};
    const variantes = producto.variantes ?? [];
    variantes.forEach((v) => {
      next[v.id] = Math.max(0, v.stockFisico || 0);
    });
    setCantidades(next);
  };

  const handleLimpiarTodo = () => {
    if (!producto) return;
    const next: Record<number, number> = {};
    const variantes = producto.variantes ?? [];
    variantes.forEach((v) => {
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

  // Exportar a PDF con html2canvas y jsPDF
  const handleExportarPdf = async () => {
    if (!printSheetRef.current || listaEtiquetas.length === 0) return;
    setIsExportingPdf(true);

    try {
      const canvas = await html2canvas(printSheetRef.current, {
        scale: 3, // Calidad 300 DPI para escaneo láser óptimo
        useCORS: true,
        backgroundColor: '#FFFFFF',
        logging: false,
      });

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pageWidth = 210;
      const pageHeight = 297;
      const marginX = 8;
      const marginY = 8;
      const printWidth = pageWidth - marginX * 2;
      const printHeight = (canvas.height * printWidth) / canvas.width;

      let heightLeft = printHeight;
      let position = marginY;

      pdf.addImage(imgData, 'PNG', marginX, position, printWidth, printHeight);
      heightLeft -= (pageHeight - marginY * 2);

      while (heightLeft > 0) {
        position = heightLeft - printHeight + marginY;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', marginX, position, printWidth, printHeight);
        heightLeft -= (pageHeight - marginY * 2);
      }

      const safeName = (producto?.nombre || 'Prenda').replace(/[^a-zA-Z0-9_-]/g, '_');
      pdf.save(`Etiquetas_38x21_${safeName}.pdf`);
    } catch (err) {
      console.error('Error al exportar PDF con html2canvas/jsPDF:', err);
    } finally {
      setIsExportingPdf(false);
    }
  };

  const handleImprimirDirecto = () => {
    window.print();
  };

  // SI NO ESTÁ ABIERTO O NO HAY PRODUCTO, RETORNAR NULL DESPUÉS DE DECLARAR TODOS LOS HOOKS
  if (!isOpen || !producto) return null;

  const totalEtiquetas = listaEtiquetas.length;
  const variantesDisponibles = producto.variantes ?? [];

  // Renderizador de cada etiqueta exacta de 38mm x 21mm (proporción 144px x 80px)
  const renderEtiqueta = (item: EtiquetaItem, index: number) => {
    const nombreSeguro =
      (item.nombre || '').length > 18
        ? (item.nombre || '').substring(0, 18).toUpperCase()
        : (item.nombre || '').toUpperCase();

    const unidadNegocioNombre =
      item.unidadNegocio || item.marca || producto.unidadNegocio || 'DASTIK';

    const codigoBarrasSeguro = item.codigoBarras;
    const precioLista = item.precioLista;
    const precioContado = item.precioContado;

    return (
      <div
        key={`${item.varianteId}-${index}`}
        className="etiqueta-38x21"
        style={{
          width: '144px',
          height: '80px',
          backgroundColor: '#FFFFFF',
          color: '#000000',
          padding: '4px 6px',
          boxSizing: 'border-box',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          border: '1px solid #E5E7EB',
          fontFamily: 'Arial, Helvetica, sans-serif',
          overflow: 'hidden',
        }}
      >
        {/* 1. ENCABEZADO: Marca + Nombre a la izquierda | TALLE limpio a la derecha (SIN FONDO NEGRO) */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            width: '100%',
            lineHeight: '1.1',
          }}
        >
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', lineHeight: '1.1' }}>
            <span style={{ fontSize: '5px', fontWeight: 'bold', color: '#555555', whiteSpace: 'nowrap' }}>
              {unidadNegocioNombre.toUpperCase()}
            </span>
            <span style={{ fontSize: '6px', fontWeight: 'bold', color: '#000000', whiteSpace: 'nowrap' }}>
              {nombreSeguro}
            </span>
          </div>

          <span
            style={{
              fontSize: '7px',
              fontWeight: 'bold',
              color: '#000000',
              backgroundColor: 'transparent',
              border: 'none',
              whiteSpace: 'nowrap',
              lineHeight: '1',
            }}
          >
            TALLE: {item.talle}
          </span>
        </div>

        {/* 2. CENTRO: Código de barras compacto */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            width: '100%',
            margin: '1px 0',
          }}
        >
          {formato === 'ean13' ? (
            <BarcodeEan13Svg
              code={codigoBarrasSeguro}
              height={20}
              style={{ height: '20px', width: '100%', maxWidth: '130px' }}
            />
          ) : (
            <QrCodeSvg
              value={codigoBarrasSeguro}
              size={20}
              style={{ width: '20px', height: '20px' }}
            />
          )}
        </div>

        {/* 3. PIE: Número EAN-13 pequeño a la izquierda | Precios apilados en 1 sola línea a la derecha */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'flex-end',
            width: '100%',
            border: 'none',
          }}
        >
          <span
            style={{
              fontSize: '5px',
              fontFamily: 'monospace',
              color: '#000000',
              whiteSpace: 'nowrap',
              lineHeight: '1',
            }}
          >
            {codigoBarrasSeguro}
          </span>

          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'flex-end',
              lineHeight: '1.1',
              border: 'none',
            }}
          >
            <span style={{ fontSize: '6.5px', color: '#000000', whiteSpace: 'nowrap' }}>
              Lista: $ {precioLista.toLocaleString('es-AR')}
            </span>
            <span style={{ fontSize: '9.5px', fontWeight: 'bold', color: '#000000', whiteSpace: 'nowrap' }}>
              Contado: $ {precioContado.toLocaleString('es-AR')}
            </span>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/85 backdrop-blur-sm transition-opacity duration-150 print:hidden"
        onClick={onClose}
      />

      {/* Reglas CSS para impresión directa @media print */}
      <style>{`
        @media print {
          body * {
            visibility: hidden !important;
          }
          #print-sheet-a4, #print-sheet-a4 * {
            visibility: visible !important;
          }
          #print-sheet-a4 {
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 100% !important;
            background: #FFFFFF !important;
            padding: 0 !important;
            margin: 0 !important;
          }
          .etiqueta-38x21 {
            page-break-inside: avoid !important;
            break-inside: avoid !important;
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
                CONTROL DE STOCK // ETIQUETAS TÉRMICAS & A4 (38x21 MM)
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
                FORMATO:
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

            {/* Acciones rápidas de carga */}
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
                title="Carga la cantidad según stock físico en tienda"
              >
                <ArrowsClockwise size={13} />
                <span>SEGÚN STOCK ACTUAL</span>
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
              {variantesDisponibles.map((v) => {
                const qty = cantidades[v.id] || 0;
                return (
                  <div
                    key={v.id}
                    className="border border-[#2A2A2A] bg-[#0E0E0E] p-2 flex flex-col items-center gap-1.5"
                  >
                    <div className="flex items-center gap-1.5">
                      <span className="font-heading font-black text-sm text-[#FAFAFA]">
                        {v.talle || 'U'}
                      </span>
                      <span className="text-[10px] font-mono text-[#71717A]">
                        ({v.stockFisico || 0}u)
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

        {/* Vista previa de las etiquetas de 38x21mm (144x80 px) */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-[#070707] space-y-3">
          <div className="flex items-center justify-between text-xs font-mono">
            <span className="text-[#71717A] uppercase tracking-wider">
              VISTA PREVIA ESTÁNDAR 38x21 MM ({totalEtiquetas} ETIQUETAS)
            </span>
            <span className="text-amber-400 font-bold">
              ESPECIFICACIÓN: 38x21 MM (144x80 PX) // LISTA Y CONTADO
            </span>
          </div>

          {totalEtiquetas === 0 ? (
            <div className="p-12 text-center border border-dashed border-[#222222] text-[#71717A] text-xs font-mono">
              No hay etiquetas seleccionadas para imprimir. Ajusta las cantidades arriba.
            </div>
          ) : (
            <div className="flex flex-wrap gap-2.5 p-3 bg-[#111111] border border-[#222222] max-h-[360px] overflow-y-auto">
              {listaEtiquetas.map((item, idx) => renderEtiqueta(item, idx))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 sm:p-5 border-t border-[#222222] bg-[#0C0C0C] flex items-center justify-between">
          <span className="text-[10px] font-mono text-[#555555] uppercase tracking-wider">
            Total a emitir: <strong className="text-white">{totalEtiquetas}</strong> etiquetas (38x21mm)
          </span>

          <div className="flex items-center gap-2.5">
            <Button
              variant="secondary"
              size="md"
              onClick={onClose}
              className="text-xs font-mono tracking-wider border-[#333333]"
            >
              CERRAR
            </Button>

            <Button
              variant="secondary"
              size="md"
              disabled={totalEtiquetas === 0 || isExportingPdf}
              onClick={handleImprimirDirecto}
              className="gap-1.5 text-xs font-heading font-semibold tracking-wider border-[#444444] text-[#FAFAFA] hover:border-[#666666] cursor-pointer"
              title="Abre la ventana de impresión nativa del navegador"
            >
              <Printer size={16} weight="light" />
              <span>IMPRIMIR (CTRL+P)</span>
            </Button>

            <Button
              variant="primary"
              size="md"
              disabled={totalEtiquetas === 0 || isExportingPdf}
              onClick={handleExportarPdf}
              className="gap-2 text-xs font-heading font-bold tracking-wider px-5 bg-amber-400 text-black hover:bg-amber-300 border-amber-400 cursor-pointer"
              title="Genera y descarga un PDF en alta resolución con html2canvas y jsPDF"
            >
              <DownloadSimple size={16} weight="bold" />
              <span>{isExportingPdf ? 'GENERANDO PDF...' : 'GUARDAR PDF (A4 / 38x21MM)'}</span>
            </Button>
          </div>
        </div>
      </div>

      {/* ======================================================== */}
      {/* Contenedor Oculto para Exportación en Alta Resolución    */}
      {/* (Capturado por html2canvas / impreso por window.print)   */}
      {/* ======================================================== */}
      <div
        style={{
          position: 'fixed',
          left: '-9999px',
          top: 0,
          backgroundColor: '#FFFFFF',
        }}
      >
        <div
          ref={printSheetRef}
          id="print-sheet-a4"
          style={{
            width: '740px',
            backgroundColor: '#FFFFFF',
            color: '#000000',
            display: 'flex',
            flexWrap: 'wrap',
            gap: '4px',
            padding: '8px',
            boxSizing: 'border-box',
          }}
        >
          {listaEtiquetas.map((item, idx) => renderEtiqueta(item, idx))}
        </div>
      </div>
    </div>
  );
};
