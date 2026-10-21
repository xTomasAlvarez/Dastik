import React, { useState, useEffect, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  X,
  Printer,
  Barcode as BarcodeIcon,
  ArrowsClockwise,
  ListNumbers,
  DownloadSimple,
} from '@phosphor-icons/react';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import { Button } from '../../../components/ui/Button';
import { BarcodeEan13Svg } from './BarcodeEan13Svg';
import type { ProductoCatalogoDto } from '../../pos/api/inventarioApi';

interface ModalImprimirEtiquetasProps {
  isOpen: boolean;
  onClose: () => void;
  producto: ProductoCatalogoDto | null;
}

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

  const totalEtiquetas = listaEtiquetas.length;
  const variantesDisponibles = producto?.variantes ?? [];

  // Renderizador de cada etiqueta exacta de 38mm x 21mm (proporción 144px x 80px)
  // INTOCABLE: Geometría estricta 144x80px para html2canvas + jsPDF
  const renderEtiqueta = (item: EtiquetaItem, index: number) => {
    const nombreSeguro =
      (item.nombre || '').length > 18
        ? (item.nombre || '').substring(0, 18).toUpperCase()
        : (item.nombre || '').toUpperCase();

    const unidadNegocioNombre =
      item.unidadNegocio || item.marca || producto?.unidadNegocio || 'DASTIK';

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
          padding: '4px 7px 6px 7px',
          boxSizing: 'border-box',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          border: '1px solid #E5E7EB',
          fontFamily: "'Space Grotesk', 'Inter', system-ui, sans-serif",
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
            <span
              style={{
                fontSize: '5.5px',
                fontWeight: 800,
                letterSpacing: '1.2px',
                color: '#000000',
                whiteSpace: 'nowrap',
              }}
            >
              {unidadNegocioNombre.toUpperCase()}
            </span>
            <span
              style={{
                fontSize: '6.5px',
                fontWeight: 900,
                letterSpacing: '-0.2px',
                color: '#000000',
                whiteSpace: 'nowrap',
              }}
            >
              {nombreSeguro}
            </span>
          </div>

          <span
            style={{
              fontSize: '7.5px',
              fontWeight: 900,
              letterSpacing: '0.3px',
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

        {/* 2. CENTRO: Código de barras compacto con números EAN-13 encajados (exclusivo EAN-13) */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            width: '100%',
            marginTop: '3.5px',
            marginBottom: '1px',
          }}
        >
          <BarcodeEan13Svg
            code={codigoBarrasSeguro}
            height={26}
            style={{ height: '26px', width: '100%', maxWidth: '130px' }}
          />
        </div>

        {/* 3. PIE: Precios apilados a la derecha con margen inferior protegido */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'flex-end',
            justifyContent: 'flex-end',
            width: '100%',
            lineHeight: '1.1',
            paddingBottom: '2px',
            border: 'none',
          }}
        >
          <span style={{ fontSize: '6.5px', fontWeight: 600, color: '#000000', whiteSpace: 'nowrap' }}>
            Lista: $ {precioLista.toLocaleString('es-AR')}
          </span>
          <span style={{ fontSize: '9.5px', fontWeight: 900, letterSpacing: '-0.2px', color: '#000000', whiteSpace: 'nowrap' }}>
            Contado: $ {precioContado.toLocaleString('es-AR')}
          </span>
        </div>
      </div>
    );
  };

  return (
    <AnimatePresence>
      {isOpen && producto && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 overflow-y-auto">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/75 backdrop-blur-sm print:hidden"
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

      {/* Modal Dialog (Controles del Modal con tokens semánticos) */}
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.97, y: 8 }}
        transition={{ type: 'spring', stiffness: 420, damping: 30, mass: 0.8 }}
        className="relative w-full max-w-4xl bg-surface border border-subtle rounded-xl shadow-floating text-primary flex flex-col max-h-[92vh] z-10 overflow-hidden print:hidden"
      >
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-subtle bg-elevated/60 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg border border-subtle bg-surface flex items-center justify-center text-amber-500 dark:text-amber-400">
              <Printer size={18} weight="bold" />
            </div>
            <div>
              <span className="text-[10px] uppercase font-mono tracking-widest text-amber-600 dark:text-amber-400 font-bold block">
                CONTROL DE STOCK // ETIQUETAS TÉRMICAS & A4 (38x21 MM · EAN-13)
              </span>
              <h2 className="font-heading font-bold text-base sm:text-lg text-primary tracking-tight uppercase">
                ETIQUETAS: {producto.nombre}
              </h2>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg border border-subtle bg-surface hover:bg-elevated text-secondary hover:text-primary transition-colors cursor-pointer"
            title="Cerrar (Esc)"
          >
            <X size={16} weight="bold" />
          </button>
        </div>

        {/* Controles de Configuración */}
        <div className="p-4 sm:p-5 border-b border-subtle bg-surface space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-4">
            {/* Indicador fijo de estándar EAN-13 (QR eliminado) */}
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-amber-500/40 bg-amber-500/15 text-amber-600 dark:text-amber-400 text-xs font-heading font-semibold">
                <BarcodeIcon size={16} weight="bold" />
                <span>CÓDIGO DE BARRAS (EAN-13)</span>
              </div>
            </div>

            {/* Acciones rápidas de carga */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleCargarCurva}
                className="text-[10px] font-mono uppercase tracking-wider px-2.5 py-1.5 rounded-lg border border-subtle bg-elevated hover:border-strong text-secondary hover:text-primary transition-colors cursor-pointer flex items-center gap-1"
                title="Carga 1 etiqueta por cada talle del producto"
              >
                <ListNumbers size={13} />
                <span>1 POR TALLE (CURVA)</span>
              </button>

              <button
                type="button"
                onClick={handleCargarStockActual}
                className="text-[10px] font-mono uppercase tracking-wider px-2.5 py-1.5 rounded-lg border border-amber-500/30 bg-amber-500/10 hover:bg-amber-500/20 text-amber-600 dark:text-amber-400 font-bold transition-colors cursor-pointer flex items-center gap-1"
                title="Carga la cantidad según stock físico en tienda"
              >
                <ArrowsClockwise size={13} />
                <span>SEGÚN STOCK ACTUAL</span>
              </button>

              <button
                type="button"
                onClick={handleLimpiarTodo}
                className="text-[10px] font-mono uppercase tracking-wider px-2 py-1.5 rounded-lg border border-transparent hover:border-red-500/30 text-red-600 dark:text-red-400 transition-colors cursor-pointer"
              >
                LIMPIAR
              </button>
            </div>
          </div>

          {/* Selector de cantidad por variante */}
          <div className="border border-subtle bg-elevated rounded-xl p-3">
            <span className="text-[10px] font-mono uppercase tracking-widest text-secondary block mb-2">
              CANTIDAD DE ETIQUETAS POR TALLE:
            </span>
            <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-2.5">
              {variantesDisponibles.map((v) => {
                const qty = cantidades[v.id] || 0;
                return (
                  <div
                    key={v.id}
                    className="border border-subtle bg-surface rounded-lg p-2 flex flex-col items-center gap-1.5"
                  >
                    <div className="flex items-center gap-1.5">
                      <span className="font-heading font-bold text-xs text-primary whitespace-nowrap">
                        {v.talle || 'U'}
                      </span>
                      <span className="text-[10px] font-mono text-muted">
                        ({v.stockFisico || 0}u)
                      </span>
                    </div>

                    <div className="flex items-center border border-subtle bg-elevated rounded-md overflow-hidden">
                      <button
                        type="button"
                        onClick={() => setCantidadVariante(v.id, qty - 1)}
                        className="px-2 py-0.5 text-xs text-primary hover:bg-surface cursor-pointer"
                      >
                        -
                      </button>
                      <input
                        type="number"
                        min="0"
                        value={qty}
                        onChange={(e) => setCantidadVariante(v.id, parseInt(e.target.value) || 0)}
                        className="w-10 text-center bg-transparent text-xs font-mono font-bold text-amber-600 dark:text-amber-400 outline-none tabular-nums"
                      />
                      <button
                        type="button"
                        onClick={() => setCantidadVariante(v.id, qty + 1)}
                        className="px-2 py-0.5 text-xs text-primary hover:bg-surface cursor-pointer"
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
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-canvas space-y-3">
          <div className="flex items-center justify-between text-xs font-mono">
            <span className="text-secondary uppercase tracking-wider">
              VISTA PREVIA ESTÁNDAR 38x21 MM ({totalEtiquetas} ETIQUETAS)
            </span>
            <span className="text-amber-600 dark:text-amber-400 font-bold">
              ESPECIFICACIÓN: 38x21 MM (144x80 PX) // LISTA Y CONTADO
            </span>
          </div>

          {totalEtiquetas === 0 ? (
            <div className="p-12 text-center border border-dashed border-subtle rounded-xl text-muted text-xs font-mono">
              No hay etiquetas seleccionadas para imprimir. Ajusta las cantidades arriba.
            </div>
          ) : (
            <div className="flex flex-wrap gap-2.5 p-3 bg-elevated border border-subtle rounded-xl max-h-[360px] overflow-y-auto">
              {listaEtiquetas.map((item, idx) => renderEtiqueta(item, idx))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 sm:p-5 border-t border-subtle bg-elevated/60 flex items-center justify-between">
          <span className="text-[10px] font-mono text-secondary uppercase tracking-wider">
            Total a emitir: <strong className="text-primary">{totalEtiquetas}</strong> etiquetas (38x21mm)
          </span>

          <div className="flex items-center gap-2.5">
            <Button
              variant="secondary"
              size="md"
              onClick={onClose}
              className="text-xs font-mono tracking-wider"
            >
              CERRAR
            </Button>

            <Button
              variant="secondary"
              size="md"
              disabled={totalEtiquetas === 0 || isExportingPdf}
              onClick={handleImprimirDirecto}
              className="gap-1.5 text-xs font-heading font-semibold tracking-wider cursor-pointer"
              title="Abre la ventana de impresión nativa del navegador"
            >
              <Printer size={16} weight="bold" />
              <span>IMPRIMIR (CTRL+P)</span>
            </Button>

            <Button
              variant="primary"
              size="md"
              disabled={totalEtiquetas === 0 || isExportingPdf}
              onClick={handleExportarPdf}
              className="gap-2 text-xs font-heading font-bold tracking-wider px-5 bg-amber-400 text-zinc-950 hover:bg-amber-300 border-amber-400 cursor-pointer"
              title="Genera y descarga un PDF en alta resolución con html2canvas y jsPDF"
            >
              <DownloadSimple size={16} weight="bold" />
              <span>{isExportingPdf ? 'GENERANDO PDF...' : 'GUARDAR PDF (A4 / 38x21MM)'}</span>
            </Button>
          </div>
        </div>
      </motion.div>

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
      )}
    </AnimatePresence>
  );
};
