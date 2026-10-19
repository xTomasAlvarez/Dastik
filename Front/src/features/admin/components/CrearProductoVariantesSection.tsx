import React from 'react';
import { Plus, Trash, Barcode, Sparkle } from '@phosphor-icons/react';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import type { CrearVarianteItemRequest } from '../../pos/api/inventarioApi';

export interface VarianteTemporal extends CrearVarianteItemRequest {
  tempId: string;
}

export interface CurvaTallesConfig {
  id: string;
  label: string;
  shortLabel: string;
  talles: string[];
}

export const CURVAS_DISPONIBLES: CurvaTallesConfig[] = [
  {
    id: 'arriba',
    label: 'Partes de arriba (Remeras, Buzos, Camperas)',
    shortLabel: 'Arriba (XS-XL)',
    talles: ['XS', 'S', 'M', 'L', 'XL'],
  },
  {
    id: 'abajo',
    label: 'Partes de abajo (Pantalones, Bermudas)',
    shortLabel: 'Abajo (36-50)',
    talles: ['36', '38', '40', '42', '44', '46', '48', '50'],
  },
  {
    id: 'zapatillasBajos',
    label: 'Zapatillas Brasil (Bajos 35-39)',
    shortLabel: 'Zapatillas (35-39)',
    talles: ['35', '36', '37', '38', '39'],
  },
  {
    id: 'zapatillasAltos',
    label: 'Zapatillas Brasil (Altos 39-43)',
    shortLabel: 'Zapatillas (39-43)',
    talles: ['39', '40', '41', '42', '43'],
  },
  {
    id: 'accesorios',
    label: 'Accesorios (Gorras, Medias, Cintos)',
    shortLabel: 'Accesorios (TU)',
    talles: ['TU'],
  },
];

interface CrearProductoVariantesSectionProps {
  variantes: VarianteTemporal[];
  curvaActivaId: string;
  onChangeCurvaActivaId: (id: string) => void;
  nuevoTalle: string;
  onChangeNuevoTalle: (val: string) => void;
  nuevoColor: string;
  onChangeNuevoColor: (val: string) => void;
  nuevoStock: string;
  onChangeNuevoStock: (val: string) => void;
  nuevoCodigoBarras: string;
  onChangeNuevoCodigoBarras: (val: string) => void;
  onAutogenerarEan: () => void;
  onAgregarVariante: () => void;
  onAgregarCurvaCompleta: (talles: string[]) => void;
  onEliminarVariante: (tempId: string) => void;
  isLoading: boolean;
}

export const CrearProductoVariantesSection: React.FC<CrearProductoVariantesSectionProps> = ({
  variantes,
  curvaActivaId,
  onChangeCurvaActivaId,
  nuevoTalle,
  onChangeNuevoTalle,
  nuevoColor,
  onChangeNuevoColor,
  nuevoStock,
  onChangeNuevoStock,
  nuevoCodigoBarras,
  onChangeNuevoCodigoBarras,
  onAutogenerarEan,
  onAgregarVariante,
  onAgregarCurvaCompleta,
  onEliminarVariante,
  isLoading,
}) => {
  const curvaActiva =
    CURVAS_DISPONIBLES.find((c) => c.id === curvaActivaId) || CURVAS_DISPONIBLES[0];
  const totalStockConfigurado = variantes.reduce((acc, v) => acc + v.stockFisico, 0);

  return (
    <div className="border border-subtle bg-elevated rounded-xl p-4 md:p-5 space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-subtle pb-3">
        <div>
          <span className="text-[10px] uppercase tracking-widest text-secondary font-sans font-semibold block">
            INVENTARIO DE VARIANTES (SKUS)
          </span>
          <span className="text-xs text-secondary font-sans">
            {variantes.length} {variantes.length === 1 ? 'variante' : 'variantes'} configuradas ·{' '}
            <span className="text-primary font-bold tabular-nums">
              {totalStockConfigurado} unidades totales
            </span>
          </span>
        </div>

        {/* Selector de Curvas Oficiales y Talles */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-2">
          <div className="flex items-center gap-1 flex-wrap">
            <span className="text-[10px] uppercase tracking-wider text-muted">CURVA:</span>
            {CURVAS_DISPONIBLES.map((c) => (
              <button
                key={c.id}
                type="button"
                onClick={() => onChangeCurvaActivaId(c.id)}
                className={`px-2 py-0.5 rounded text-[10px] font-mono border transition-colors cursor-pointer ${
                  curvaActivaId === c.id
                    ? 'border-strong bg-surface text-primary font-bold shadow-surface'
                    : 'border-subtle bg-surface/60 text-secondary hover:border-strong'
                }`}
              >
                {c.shortLabel}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Fila de Talles Rápidos de la Curva Activa y Botón de Lote */}
      <div className="bg-surface border border-subtle rounded-lg p-2.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-[10px] uppercase tracking-wider text-muted">
            TALLES {curvaActiva.shortLabel.toUpperCase()}:
          </span>
          {curvaActiva.talles.map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => onChangeNuevoTalle(t)}
              className="border border-subtle hover:border-strong bg-elevated rounded px-2 py-0.5 text-[10px] text-primary font-mono transition-colors cursor-pointer"
              title={`Seleccionar talle ${t}`}
            >
              {t}
            </button>
          ))}
        </div>

        <button
          type="button"
          onClick={() => onAgregarCurvaCompleta(curvaActiva.talles)}
          className="text-[10px] uppercase font-mono font-bold tracking-wider rounded-md border border-emerald-500/30 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 px-2.5 py-1 transition-colors cursor-pointer shrink-0"
          title="Generar todas las variantes de esta curva con códigos EAN-13"
        >
          + AGREGAR CURVA COMPLETA ({curvaActiva.talles.length} TALLES)
        </button>
      </div>

      {/* Mini-Formulario para Añadir Variante */}
      <div className="bg-surface border border-subtle rounded-lg p-3.5 space-y-3">
        <span className="text-[10px] uppercase tracking-wider text-secondary font-heading font-bold block">
          + CONFIGURAR NUEVA VARIANTE
        </span>
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
          <Input
            id="nuevoTalle"
            label="TALLE / MEDIDA *"
            placeholder="ej: M, L o US 10"
            value={nuevoTalle}
            onChange={(e) => onChangeNuevoTalle(e.target.value)}
            disabled={isLoading}
          />

          <Input
            id="nuevoColor"
            label="COLOR"
            placeholder="ej: Negro, Blanco"
            value={nuevoColor}
            onChange={(e) => onChangeNuevoColor(e.target.value)}
            disabled={isLoading}
          />

          <Input
            id="nuevoStock"
            label="STOCK INICIAL *"
            type="number"
            min="0"
            placeholder="5"
            value={nuevoStock}
            onChange={(e) => onChangeNuevoStock(e.target.value)}
            disabled={isLoading}
          />

          <div className="flex flex-col gap-1.5 w-full text-left">
            <label
              htmlFor="nuevoCodigoBarras"
              className="text-[11px] font-semibold uppercase tracking-wider text-secondary font-sans"
            >
              CÓDIGO EAN-13
            </label>
            <div className="flex items-center gap-1.5">
              <input
                id="nuevoCodigoBarras"
                type="text"
                placeholder="Autogenerar si vacío"
                value={nuevoCodigoBarras}
                onChange={(e) => onChangeNuevoCodigoBarras(e.target.value)}
                disabled={isLoading}
                className="w-full bg-surface text-primary border border-subtle focus:border-strong rounded-lg px-2.5 py-2 text-xs font-mono outline-none placeholder-muted"
              />
              <button
                type="button"
                onClick={onAutogenerarEan}
                className="border border-subtle hover:border-strong bg-elevated rounded-lg text-primary p-2 transition-colors cursor-pointer shrink-0"
                title="Generar EAN-13 numérico aleatorio"
              >
                <Sparkle size={15} weight="bold" />
              </button>
            </div>
          </div>
        </div>

        <div className="flex justify-end pt-1">
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={onAgregarVariante}
            disabled={isLoading || !nuevoTalle.trim()}
            className="gap-1.5 text-xs py-2 px-4"
          >
            <Plus size={14} weight="bold" />
            <span>AGREGAR VARIANTE A LA LISTA</span>
          </Button>
        </div>
      </div>

      {/* Tabla de Variantes Temporales */}
      {variantes.length === 0 ? (
        <div className="text-center py-6 border border-dashed border-subtle rounded-lg text-muted text-xs">
          No hay variantes añadidas. Completa los campos arriba y haz clic en &quot;AGREGAR VARIANTE&quot;.
        </div>
      ) : (
        <div className="overflow-x-auto border border-subtle rounded-lg bg-surface">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-subtle bg-elevated text-secondary text-[10px] uppercase tracking-wider font-sans">
                <th className="py-2.5 px-3">Talle</th>
                <th className="py-2.5 px-3">Color</th>
                <th className="py-2.5 px-3 text-right">Stock Físico</th>
                <th className="py-2.5 px-3">Código EAN-13</th>
                <th className="py-2.5 px-3 text-center">Acción</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-subtle font-sans">
              {variantes.map((v) => (
                <tr key={v.tempId} className="hover:bg-elevated/60 transition-colors">
                  <td className="py-2.5 px-3 font-heading font-bold text-primary">
                    <span className="border border-subtle bg-elevated rounded px-2 py-0.5 text-xs">
                      {v.talle}
                    </span>
                  </td>
                  <td className="py-2.5 px-3 text-secondary">{v.color}</td>
                  <td className="py-2.5 px-3 text-right">
                    <span className="font-mono text-primary font-semibold text-sm tabular-nums">
                      {v.stockFisico}
                    </span>
                  </td>
                  <td className="py-2.5 px-3">
                    <div className="flex items-center gap-1.5 font-mono text-[11px] text-secondary">
                      <Barcode size={14} weight="bold" className="text-muted" />
                      <span>{v.codigoBarras}</span>
                    </div>
                  </td>
                  <td className="py-2.5 px-3 text-center">
                    <button
                      type="button"
                      onClick={() => onEliminarVariante(v.tempId)}
                      className="text-muted hover:text-red-600 dark:hover:text-red-400 p-1 transition-colors cursor-pointer"
                      title="Eliminar variante"
                    >
                      <Trash size={15} weight="bold" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
