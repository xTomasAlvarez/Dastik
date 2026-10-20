import React, { useState, useEffect } from 'react';
import {
  BookOpen,
  CheckCircle,
  X,
  Target,
  ArrowClockwise,
  Storefront,
  Barcode,
  ArrowsLeftRight,
  Receipt,
  Archive,
} from '@phosphor-icons/react';
import { Button } from '../ui/Button';

interface MisionItem {
  id: string;
  numero: number;
  titulo: string;
  icono: React.ReactNode;
  descripcion: string;
  consejo: string;
}

const MISIONES: MisionItem[] = [
  {
    id: 'mision-1',
    numero: 1,
    titulo: 'Apertura de Turno con Fondo Inicial',
    icono: <Storefront size={18} weight="duotone" className="text-amber-500" />,
    descripcion: 'Iniciá la jornada abriendo caja con un fondo de cambio inicial sugerido de $10.000.',
    consejo: 'Podés abrir turno desde el modal que aparece al ingresar o desde el botón de estado en la barra superior.',
  },
  {
    id: 'mision-2',
    numero: 2,
    titulo: 'Venta con Código EAN-13 o Búsqueda',
    icono: <Barcode size={18} weight="duotone" className="text-sky-500" />,
    descripcion: 'Buscá una prenda o probá copiar su código EAN-13 desde la Vista Rápida para simular el escáner láser. Elegí un talle y completá el cobro en Efectivo o Tarjeta.',
    consejo: 'Probá ingresar un monto mayor en Efectivo para comprobar que el sistema calcule el vuelto exacto automáticamente.',
  },
  {
    id: 'mision-3',
    numero: 3,
    titulo: 'Cambio de Prenda o Talle en Mostrador',
    icono: <ArrowsLeftRight size={18} weight="duotone" className="text-indigo-500" />,
    descripcion: 'Hacé clic en el botón "Cambio" en la barra superior para procesar la devolución de una prenda y entregar otra (mano a mano o con diferencia de precio).',
    consejo: 'El sistema devuelve al stock la prenda ingresada y descuenta la nueva de forma 100% atómica.',
  },
  {
    id: 'mision-4',
    numero: 4,
    titulo: 'Registro de Gasto Operativo de Caja',
    icono: <Receipt size={18} weight="duotone" className="text-emerald-500" />,
    descripcion: 'Practicá asentar una salida menor de efectivo (ej: pago de delivery / Uber para traer mercadería o insumos de limpieza).',
    consejo: 'Los gastos registrados reducen el efectivo esperado en el arqueo final sin desfasar la caja.',
  },
  {
    id: 'mision-5',
    numero: 5,
    titulo: 'Arqueo Ciego y Cierre de Turno',
    icono: <Archive size={18} weight="duotone" className="text-rose-500" />,
    descripcion: 'Hacé clic en "Cerrar Turno", contá los billetes físicos simulados e ingresá el total para verificar si cuadra con la recaudación del sistema.',
    consejo: 'El arqueo ciego evita manipulaciones: el cajero declara lo que ve y el sistema audita las diferencias.',
  },
];

const STORAGE_KEY = 'dastik_sandbox_misiones_checked';

interface ModalGuiaPracticaProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ModalGuiaPractica: React.FC<ModalGuiaPracticaProps> = ({ isOpen, onClose }) => {
  const [completadas, setCompletadas] = useState<Record<string, boolean>>(() => {
    try {
      const guardado = localStorage.getItem(STORAGE_KEY);
      return guardado ? JSON.parse(guardado) : {};
    } catch {
      return {};
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(completadas));
    } catch {
      // Ignorar error de almacenamiento
    }
  }, [completadas]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const toggleMision = (id: string) => {
    setCompletadas((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const reiniciarProgreso = () => {
    setCompletadas({});
  };

  const totalCompletadas = MISIONES.filter((m) => completadas[m.id]).length;
  const porcentaje = Math.round((totalCompletadas / MISIONES.length) * 100);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="rounded-2xl border border-subtle bg-surface w-full max-w-xl p-6 space-y-5 shadow-floating max-h-[90vh] flex flex-col">
        {/* Cabecera */}
        <div className="flex items-center justify-between pb-3 border-b border-subtle shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 p-2 text-amber-500">
              <BookOpen size={20} weight="duotone" />
            </div>
            <div>
              <span className="text-[11px] font-mono uppercase tracking-wider text-amber-600 dark:text-amber-400 font-bold block">
                Modo Capacitación // Sandbox
              </span>
              <h2 className="font-heading font-bold text-lg text-primary">
                Guía de Práctica: 5 Misiones de Cajero
              </h2>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-muted hover:text-primary transition-fast p-1 rounded-md cursor-pointer"
            title="Cerrar modal [ESC]"
          >
            <X size={18} />
          </button>
        </div>

        {/* Barra de Progreso */}
        <div className="rounded-xl border border-subtle bg-elevated/60 p-3.5 space-y-2 shrink-0">
          <div className="flex items-center justify-between text-xs font-sans">
            <span className="font-semibold text-primary flex items-center gap-1.5">
              <Target size={15} weight="bold" className="text-amber-500" />
              Progreso del Entrenamiento
            </span>
            <span className="font-mono font-bold text-amber-600 dark:text-amber-400">
              {totalCompletadas} de {MISIONES.length} misiones ({porcentaje}%)
            </span>
          </div>
          <div className="w-full h-2 rounded-full bg-surface border border-subtle overflow-hidden">
            <div
              className="h-full bg-amber-500 transition-all duration-300 rounded-full"
              style={{ width: `${porcentaje}%` }}
            />
          </div>
        </div>

        {/* Lista de Misiones Scrolleable */}
        <div className="space-y-3 overflow-y-auto pr-1 flex-1 no-scrollbar">
          {MISIONES.map((mision) => {
            const isDone = Boolean(completadas[mision.id]);

            return (
              <div
                key={mision.id}
                onClick={() => toggleMision(mision.id)}
                className={`p-3.5 rounded-xl border transition-all cursor-pointer text-left select-none ${
                  isDone
                    ? 'border-emerald-500/30 bg-emerald-500/5'
                    : 'border-subtle bg-surface hover:border-strong hover:bg-elevated/40'
                }`}
              >
                <div className="flex items-start gap-3">
                  <button
                    type="button"
                    aria-label={`Marcar misión ${mision.numero}`}
                    className={`mt-0.5 rounded-md p-1 transition-fast shrink-0 cursor-pointer ${
                      isDone
                        ? 'text-emerald-500 bg-emerald-500/10'
                        : 'text-muted border border-subtle hover:border-strong bg-elevated'
                    }`}
                  >
                    <CheckCircle size={18} weight={isDone ? 'fill' : 'regular'} />
                  </button>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      {mision.icono}
                      <h4
                        className={`text-xs sm:text-sm font-heading font-bold ${
                          isDone ? 'line-through text-muted' : 'text-primary'
                        }`}
                      >
                        Misión {mision.numero}: {mision.titulo}
                      </h4>
                    </div>

                    <p className="text-xs text-secondary leading-relaxed font-sans mb-1.5">
                      {mision.descripcion}
                    </p>

                    <div className="text-[11px] font-sans text-muted bg-elevated/80 rounded-md px-2.5 py-1 border border-subtle">
                      <strong className="text-primary font-medium">Tip de caja: </strong>
                      {mision.consejo}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="pt-3 border-t border-subtle flex items-center justify-between gap-3 shrink-0">
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={reiniciarProgreso}
            title="Reiniciar casillas de verificación de la guía"
          >
            <ArrowClockwise size={14} />
            <span>Reiniciar Checklist</span>
          </Button>

          <Button type="button" variant="primary" size="sm" onClick={onClose}>
            ¡A practicar! [ESC]
          </Button>
        </div>
      </div>
    </div>
  );
};
