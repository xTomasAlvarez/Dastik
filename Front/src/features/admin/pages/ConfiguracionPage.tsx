import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Gear,
  Truck,
  Tag,
  Folders,
  Plus,
  CheckCircle,
  WarningCircle,
  Sun,
  Moon,
  Percent,
  Sparkle,
} from '@phosphor-icons/react';
import { configuracionApi } from '../api/configuracionApi';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import { useThemeStore } from '../../../stores/useThemeStore';
import type { AxiosError } from 'axios';

type TabConfig = 'proveedores' | 'marcas' | 'categorias';

const TEMPORADAS_SUGERIDAS = [
  'Todo el Año / Permanente',
  'Otoño / Invierno (AW)',
  'Primavera / Verano (SS)',
  'Drop Limitado / Cápsula',
];

const ESQUEMAS_TALLES_SUGERIDOS = [
  'XS-S-M-L-XL',
  'S-M-L-XL-XXL',
  '36-38-40-42-44-46-48',
  '35-36-37-38-39-40-41-42-43',
  'US 7 - US 12 (Sneakers)',
  'Talle Único (TU)',
];

/**
 * Formatea el MarkupPorDefecto para mostrar tanto el porcentaje (+55%)
 * como el multiplicador equivalente (1.55x), soportando valores guardados como 1.50 o 55.
 */
const formatearMarkup = (valor: number): { porcentaje: string; factor: string } => {
  if (valor <= 10) {
    const pct = Math.round((valor - 1) * 100);
    return {
      porcentaje: `${pct}%`,
      factor: `${valor.toFixed(2)}x`,
    };
  }
  const factor = 1 + valor / 100;
  return {
    porcentaje: `${Math.round(valor)}%`,
    factor: `${factor.toFixed(2)}x`,
  };
};

export const ConfiguracionPage: React.FC = () => {
  const queryClient = useQueryClient();
  const { theme, toggleTheme } = useThemeStore();

  const [tabActiva, setTabActiva] = useState<TabConfig>('proveedores');
  const [feedback, setFeedback] = useState<{ tipo: 'ok' | 'error'; texto: string } | null>(null);

  // Estado Formulario Proveedor
  const [mostrarFormProveedor, setMostrarFormProveedor] = useState(false);
  const [nombreProveedor, setNombreProveedor] = useState('');
  const [markupPorDefecto, setMarkupPorDefecto] = useState('55');

  // Estado Formulario Marca
  const [nombreMarca, setNombreMarca] = useState('');

  // Estado Formulario Categoría
  const [nombreCategoria, setNombreCategoria] = useState('');
  const [temporadaCategoria, setTemporadaCategoria] = useState(TEMPORADAS_SUGERIDAS[0]);
  const [esquemaTallesCategoria, setEsquemaTallesCategoria] = useState(ESQUEMAS_TALLES_SUGERIDOS[0]);

  const mostrarMensaje = (tipo: 'ok' | 'error', texto: string) => {
    setFeedback({ tipo, texto });
    setTimeout(() => {
      setFeedback((prev) => (prev?.texto === texto ? null : prev));
    }, 4500);
  };

  // Queries
  const { data: proveedores = [], isLoading: loadingProveedores } = useQuery({
    queryKey: ['configuracion', 'proveedores'],
    queryFn: configuracionApi.obtenerProveedores,
  });

  const { data: marcas = [], isLoading: loadingMarcas } = useQuery({
    queryKey: ['configuracion', 'marcas'],
    queryFn: configuracionApi.obtenerMarcas,
  });

  const { data: categorias = [], isLoading: loadingCategorias } = useQuery({
    queryKey: ['configuracion', 'categorias'],
    queryFn: configuracionApi.obtenerCategorias,
  });

  // Mutations
  const crearProveedorMutation = useMutation({
    mutationFn: configuracionApi.crearProveedor,
    onSuccess: (nuevo) => {
      queryClient.invalidateQueries({ queryKey: ['configuracion', 'proveedores'] });
      setNombreProveedor('');
      setMarkupPorDefecto('55');
      setMostrarFormProveedor(false);
      mostrarMensaje('ok', `Proveedor "${nuevo.nombre}" registrado correctamente.`);
    },
    onError: (err: AxiosError<{ detail?: string }>) => {
      mostrarMensaje(
        'error',
        err.response?.data?.detail || 'No se pudo crear el proveedor. Verifica los datos.'
      );
    },
  });

  const crearMarcaMutation = useMutation({
    mutationFn: configuracionApi.crearMarca,
    onSuccess: (nueva) => {
      queryClient.invalidateQueries({ queryKey: ['configuracion', 'marcas'] });
      setNombreMarca('');
      mostrarMensaje('ok', `Marca "${nueva.nombre}" agregada al catálogo.`);
    },
    onError: (err: AxiosError<{ detail?: string }>) => {
      mostrarMensaje(
        'error',
        err.response?.data?.detail || 'No se pudo crear la marca. Verifica que no exista.'
      );
    },
  });

  const crearCategoriaMutation = useMutation({
    mutationFn: configuracionApi.crearCategoria,
    onSuccess: (nueva) => {
      queryClient.invalidateQueries({ queryKey: ['configuracion', 'categorias'] });
      setNombreCategoria('');
      mostrarMensaje('ok', `Categoría "${nueva.nombre}" registrada con éxito.`);
    },
    onError: (err: AxiosError<{ detail?: string }>) => {
      mostrarMensaje(
        'error',
        err.response?.data?.detail || 'No se pudo crear la categoría. Verifica los campos.'
      );
    },
  });

  const handleSubmitProveedor = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nombreProveedor.trim()) {
      mostrarMensaje('error', 'El nombre del proveedor es obligatorio.');
      return;
    }
    const markupNum = parseFloat(markupPorDefecto);
    if (isNaN(markupNum) || markupNum <= 0) {
      mostrarMensaje('error', 'El Markup % por defecto debe ser mayor a 0.');
      return;
    }
    crearProveedorMutation.mutate({
      nombre: nombreProveedor.trim(),
      markupPorDefecto: markupNum,
    });
  };

  const handleSubmitMarca = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nombreMarca.trim()) {
      mostrarMensaje('error', 'Ingresa el nombre de la marca.');
      return;
    }
    crearMarcaMutation.mutate({ nombre: nombreMarca.trim() });
  };

  const handleSubmitCategoria = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nombreCategoria.trim()) {
      mostrarMensaje('error', 'Ingresa el nombre de la categoría.');
      return;
    }
    crearCategoriaMutation.mutate({
      nombre: nombreCategoria.trim(),
      temporada: temporadaCategoria,
      esquemaTalles: esquemaTallesCategoria,
    });
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-[1600px] mx-auto w-full">
      {/* ======================================================== */}
      {/* 1. Header & Control de Apariencia (Dark / Light Mode)     */}
      {/* ======================================================== */}
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4 border-b border-subtle pb-5">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-xs font-medium text-amber-500">
            <Gear size={15} weight="duotone" />
            <span>Back-Office · Configuración Maestra</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-heading font-extrabold tracking-tight text-primary">
            Catálogos Base &amp; Apariencia
          </h1>
          <p className="text-xs sm:text-sm text-secondary font-sans max-w-2xl">
            Administra proveedores con su porcentaje de ganancia (Markup) sugerido, marcas
            oficiales, categorías con curvas de talles y el modo visual de las terminales.
          </p>
        </div>

        {/* Tarjeta de Cambio Rápido Dark / Light Mode */}
        <div className="flex items-center gap-4 bg-surface border border-subtle rounded-xl p-3.5 shrink-0 shadow-surface">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg border border-subtle bg-elevated text-amber-500">
              {theme === 'dark' ? (
                <Moon size={18} weight="duotone" />
              ) : (
                <Sun size={18} weight="duotone" />
              )}
            </div>
            <div>
              <span className="text-[11px] font-medium text-muted block">
                Modo Visual Activo
              </span>
              <span className="text-xs font-heading font-bold text-primary">
                {theme === 'dark' ? 'Dark Mode (Carbon Slate)' : 'Light Mode (Alabaster)'}
              </span>
            </div>
          </div>

          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={toggleTheme}
          >
            {theme === 'dark' ? (
              <>
                <Sun size={15} weight="duotone" className="text-amber-400" />
                <span>Pasar a Claro</span>
              </>
            ) : (
              <>
                <Moon size={15} weight="duotone" className="text-indigo-500" />
                <span>Pasar a Oscuro</span>
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Feedback Banner */}
      {feedback && (
        <div
          className={`p-3.5 rounded-xl border text-xs font-sans flex items-center justify-between ${
            feedback.tipo === 'ok'
              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-700 dark:text-emerald-300'
              : 'bg-red-500/10 border-red-500/30 text-red-700 dark:text-red-300'
          }`}
        >
          <div className="flex items-center gap-2 font-medium">
            {feedback.tipo === 'ok' ? (
              <CheckCircle size={17} weight="duotone" className="text-emerald-500 shrink-0" />
            ) : (
              <WarningCircle size={17} weight="duotone" className="text-red-500 shrink-0" />
            )}
            <span>{feedback.texto}</span>
          </div>
          <button
            type="button"
            onClick={() => setFeedback(null)}
            className="text-muted hover:text-primary font-bold px-2 cursor-pointer"
          >
            ✕
          </button>
        </div>
      )}

      {/* ======================================================== */}
      {/* 2. Selector de Pestañas / Tarjetas                       */}
      {/* ======================================================== */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <button
          type="button"
          onClick={() => setTabActiva('proveedores')}
          className={`p-4 rounded-xl border text-left transition-fast cursor-pointer flex items-center justify-between shadow-surface ${
            tabActiva === 'proveedores'
              ? 'bg-surface border-amber-500/60 ring-2 ring-amber-500/15'
              : 'bg-surface border-subtle hover:border-strong'
          }`}
        >
          <div className="flex items-center gap-3">
            <div
              className={`p-2.5 rounded-lg border ${
                tabActiva === 'proveedores'
                  ? 'border-amber-500/40 bg-amber-500/10 text-amber-500'
                  : 'border-subtle bg-elevated text-secondary'
              }`}
            >
              <Truck size={20} weight="duotone" />
            </div>
            <div>
              <span className="text-xs font-heading font-bold text-primary block">
                1. Proveedores
              </span>
              <span className="text-[11px] font-sans text-muted">
                Markup % por defecto y costos
              </span>
            </div>
          </div>
          <span className="text-lg font-mono tabular-nums font-bold text-primary">
            {proveedores.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setTabActiva('marcas')}
          className={`p-4 rounded-xl border text-left transition-fast cursor-pointer flex items-center justify-between shadow-surface ${
            tabActiva === 'marcas'
              ? 'bg-surface border-amber-500/60 ring-2 ring-amber-500/15'
              : 'bg-surface border-subtle hover:border-strong'
          }`}
        >
          <div className="flex items-center gap-3">
            <div
              className={`p-2.5 rounded-lg border ${
                tabActiva === 'marcas'
                  ? 'border-amber-500/40 bg-amber-500/10 text-amber-500'
                  : 'border-subtle bg-elevated text-secondary'
              }`}
            >
              <Tag size={20} weight="duotone" />
            </div>
            <div>
              <span className="text-xs font-heading font-bold text-primary block">
                2. Marcas
              </span>
              <span className="text-[11px] font-sans text-muted">
                Dastik, Hidden Sneakers, Nike...
              </span>
            </div>
          </div>
          <span className="text-lg font-mono tabular-nums font-bold text-primary">
            {marcas.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setTabActiva('categorias')}
          className={`p-4 rounded-xl border text-left transition-fast cursor-pointer flex items-center justify-between shadow-surface ${
            tabActiva === 'categorias'
              ? 'bg-surface border-amber-500/60 ring-2 ring-amber-500/15'
              : 'bg-surface border-subtle hover:border-strong'
          }`}
        >
          <div className="flex items-center gap-3">
            <div
              className={`p-2.5 rounded-lg border ${
                tabActiva === 'categorias'
                  ? 'border-amber-500/40 bg-amber-500/10 text-amber-500'
                  : 'border-subtle bg-elevated text-secondary'
              }`}
            >
              <Folders size={20} weight="duotone" />
            </div>
            <div>
              <span className="text-xs font-heading font-bold text-primary block">
                3. Categorías
              </span>
              <span className="text-[11px] font-sans text-muted">
                Temporadas y curvas de talles
              </span>
            </div>
          </div>
          <span className="text-lg font-mono tabular-nums font-bold text-primary">
            {categorias.length}
          </span>
        </button>
      </div>

      {/* ======================================================== */}
      {/* PESTAÑA 1: PROVEEDORES                                   */}
      {/* ======================================================== */}
      {tabActiva === 'proveedores' && (
        <div className="bg-surface border border-subtle rounded-xl p-5 sm:p-6 space-y-5 shadow-surface">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-subtle">
            <div>
              <h2 className="font-heading font-bold text-base text-primary">
                Directorio de Proveedores &amp; Markup
              </h2>
              <p className="text-xs font-sans text-secondary">
                Cada proveedor define un porcentaje de ganancia por defecto (ej. 55%) para sugerir
                precios de venta al dar de alta mercadería.
              </p>
            </div>
            <Button
              type="button"
              variant={mostrarFormProveedor ? 'secondary' : 'primary'}
              size="sm"
              onClick={() => setMostrarFormProveedor((prev) => !prev)}
            >
              <Plus size={15} weight="bold" />
              <span>{mostrarFormProveedor ? 'Cerrar Formulario' : 'Nuevo Proveedor'}</span>
            </Button>
          </div>

          {/* Formulario Nuevo Proveedor */}
          {mostrarFormProveedor && (
            <form
              onSubmit={handleSubmitProveedor}
              className="p-5 bg-elevated/60 border border-subtle rounded-xl space-y-4"
            >
              <div className="flex items-center justify-between border-b border-subtle pb-2.5">
                <span className="text-xs font-semibold text-amber-500 flex items-center gap-1.5">
                  <Sparkle size={15} weight="duotone" />
                  Alta de Nuevo Proveedor
                </span>
                <span className="text-[11px] font-mono tabular-nums text-secondary">
                  Ej: Costo $10.000 + {markupPorDefecto || 0}% = Venta $
                  {Math.round(10000 * (1 + (parseFloat(markupPorDefecto) || 0) / 100)).toLocaleString(
                    'es-AR'
                  )}
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="md:col-span-2">
                  <Input
                    id="nombreProveedor"
                    label="Nombre / Razón Social del Proveedor *"
                    placeholder="Ej: Taller Textil Avellaneda / Importadora Brasil"
                    value={nombreProveedor}
                    onChange={(e) => setNombreProveedor(e.target.value)}
                    required
                  />
                </div>

                <div>
                  <Input
                    id="markupPorDefecto"
                    label="Markup % por Defecto (Ej: 55%) *"
                    type="number"
                    step="0.5"
                    min="1"
                    placeholder="55"
                    value={markupPorDefecto}
                    onChange={(e) => setMarkupPorDefecto(e.target.value)}
                    required
                  />
                  <div className="flex items-center gap-1.5 mt-2">
                    {[50, 55, 60, 80, 100].map((pct) => (
                      <button
                        key={pct}
                        type="button"
                        onClick={() => setMarkupPorDefecto(pct.toString())}
                        className={`px-2 py-0.5 text-[11px] font-mono tabular-nums rounded-md border cursor-pointer transition-fast ${
                          markupPorDefecto === pct.toString()
                            ? 'bg-amber-500 text-black border-amber-500 font-bold'
                            : 'bg-surface text-secondary border-subtle hover:text-primary'
                        }`}
                      >
                        +{pct}%
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={() => setMostrarFormProveedor(false)}
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  size="sm"
                  disabled={crearProveedorMutation.isPending}
                >
                  {crearProveedorMutation.isPending ? 'Guardando...' : 'Guardar Proveedor'}
                </Button>
              </div>
            </form>
          )}

          {/* Grilla de Proveedores */}
          {loadingProveedores ? (
            <div className="p-8 text-center text-xs font-mono text-muted">
              Cargando proveedores...
            </div>
          ) : proveedores.length === 0 ? (
            <div className="p-8 text-center text-xs font-sans text-muted rounded-xl border border-dashed border-subtle">
              No hay proveedores registrados. Haz clic en &quot;Nuevo Proveedor&quot; para comenzar.
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {proveedores.map((prov) => {
                const infoMarkup = formatearMarkup(prov.markupPorDefecto);
                return (
                  <div
                    key={prov.id}
                    className="p-4 rounded-xl bg-elevated/50 border border-subtle hover:border-strong flex flex-col justify-between gap-4 transition-fast"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <span className="text-[11px] font-mono tabular-nums text-muted block">
                          ID #{prov.id}
                        </span>
                        <h3 className="font-heading font-bold text-sm text-primary mt-0.5">
                          {prov.nombre}
                        </h3>
                      </div>
                      <span className="px-2.5 py-0.5 rounded-md bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 text-xs font-mono tabular-nums font-bold flex items-center gap-1">
                        <Percent size={12} weight="bold" />
                        +{infoMarkup.porcentaje}
                      </span>
                    </div>

                    <div className="pt-3 border-t border-subtle flex items-center justify-between text-xs font-mono tabular-nums text-secondary">
                      <span>Factor: {infoMarkup.factor}</span>
                      <span>{prov.cantidadProductos} prod. activos</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ======================================================== */}
      {/* PESTAÑA 2: MARCAS                                        */}
      {/* ======================================================== */}
      {tabActiva === 'marcas' && (
        <div className="bg-surface border border-subtle rounded-xl p-5 sm:p-6 space-y-5 shadow-surface">
          <div className="pb-4 border-b border-subtle">
            <h2 className="font-heading font-bold text-base text-primary">
              Marcas Comerciales
            </h2>
            <p className="text-xs font-sans text-secondary">
              Gestiona las marcas oficiales disponibles al clasificar prendas o zapatillas en el
              inventario.
            </p>
          </div>

          {/* Formulario rápido en línea para agregar Marca */}
          <form
            onSubmit={handleSubmitMarca}
            className="p-4 rounded-xl bg-elevated/50 border border-subtle flex flex-col sm:flex-row items-stretch sm:items-end gap-3"
          >
            <div className="flex-1">
              <Input
                id="nombreMarca"
                label="Nueva Marca *"
                placeholder="Ej: Dastik, Hidden Sneakers, Nike, Adidas, Jordan..."
                value={nombreMarca}
                onChange={(e) => setNombreMarca(e.target.value)}
                required
              />
            </div>
            <Button
              type="submit"
              variant="primary"
              size="md"
              disabled={crearMarcaMutation.isPending}
              className="shrink-0"
            >
              <Plus size={15} weight="bold" />
              <span>{crearMarcaMutation.isPending ? 'Agregando...' : 'Agregar Marca'}</span>
            </Button>
          </form>

          {/* Grilla de Marcas */}
          {loadingMarcas ? (
            <div className="p-8 text-center text-xs font-mono text-muted">
              Cargando marcas...
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
              {marcas.map((marca) => (
                <div
                  key={marca.id}
                  className="p-4 rounded-xl bg-elevated/50 border border-subtle hover:border-strong flex items-center justify-between transition-fast"
                >
                  <div>
                    <span className="text-[11px] font-mono tabular-nums text-muted block">
                      Marca #{marca.id}
                    </span>
                    <span className="font-heading font-bold text-sm text-primary">
                      {marca.nombre}
                    </span>
                  </div>
                  <span className="px-2.5 py-0.5 rounded-md bg-surface border border-subtle text-xs font-mono tabular-nums text-secondary">
                    {marca.cantidadProductos} prod.
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ======================================================== */}
      {/* PESTAÑA 3: CATEGORÍAS                                    */}
      {/* ======================================================== */}
      {tabActiva === 'categorias' && (
        <div className="bg-surface border border-subtle rounded-xl p-5 sm:p-6 space-y-5 shadow-surface">
          <div className="pb-4 border-b border-subtle">
            <h2 className="font-heading font-bold text-base text-primary">
              Categorías, Temporadas &amp; Esquemas de Talles
            </h2>
            <p className="text-xs font-sans text-secondary">
              Estructura los rubros del catálogo asociando su temporada comercial y curva de talles
              estándar.
            </p>
          </div>

          {/* Formulario para crear Categoría */}
          <form
            onSubmit={handleSubmitCategoria}
            className="p-5 rounded-xl bg-elevated/50 border border-subtle space-y-4"
          >
            <span className="text-xs font-semibold text-amber-500 block">
              Nueva Categoría de Producto
            </span>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Input
                id="nombreCategoria"
                label="Nombre de la Categoría *"
                placeholder="Ej: Remeras, Pantalones, Buzos, Sneakers..."
                value={nombreCategoria}
                onChange={(e) => setNombreCategoria(e.target.value)}
                required
              />

              <div className="flex flex-col gap-1.5">
                <label
                  htmlFor="temporadaCategoria"
                  className="text-xs font-medium tracking-wide text-secondary font-sans"
                >
                  Temporada *
                </label>
                <select
                  id="temporadaCategoria"
                  value={temporadaCategoria}
                  onChange={(e) => setTemporadaCategoria(e.target.value)}
                  className="w-full bg-surface text-primary border border-subtle rounded-lg px-3.5 py-2 text-sm outline-none font-sans cursor-pointer shadow-surface focus:border-amber-500/80 focus:ring-2 focus:ring-amber-500/20"
                >
                  {TEMPORADAS_SUGERIDAS.map((temp) => (
                    <option key={temp} value={temp}>
                      {temp}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex flex-col gap-1.5">
                <label
                  htmlFor="esquemaTallesCategoria"
                  className="text-xs font-medium tracking-wide text-secondary font-sans"
                >
                  Esquema de Talles *
                </label>
                <select
                  id="esquemaTallesCategoria"
                  value={esquemaTallesCategoria}
                  onChange={(e) => setEsquemaTallesCategoria(e.target.value)}
                  className="w-full bg-surface text-primary border border-subtle rounded-lg px-3.5 py-2 text-sm outline-none font-mono cursor-pointer shadow-surface focus:border-amber-500/80 focus:ring-2 focus:ring-amber-500/20"
                >
                  {ESQUEMAS_TALLES_SUGERIDOS.map((esq) => (
                    <option key={esq} value={esq}>
                      {esq}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex justify-end">
              <Button
                type="submit"
                variant="primary"
                size="sm"
                disabled={crearCategoriaMutation.isPending}
              >
                <Plus size={15} weight="bold" />
                <span>
                  {crearCategoriaMutation.isPending ? 'Creando...' : 'Crear Categoría'}
                </span>
              </Button>
            </div>
          </form>

          {/* Tabla / Lista de Categorías */}
          {loadingCategorias ? (
            <div className="p-8 text-center text-xs font-mono text-muted">
              Cargando categorías...
            </div>
          ) : (
            <div className="overflow-x-auto rounded-xl border border-subtle">
              <table className="w-full text-left text-xs font-sans border-collapse">
                <thead className="bg-elevated text-secondary border-b border-subtle">
                  <tr>
                    <th className="py-3 px-4 font-semibold">ID</th>
                    <th className="py-3 px-4 font-semibold">Categoría</th>
                    <th className="py-3 px-4 font-semibold">Temporada</th>
                    <th className="py-3 px-4 font-semibold">Esquema de Talles</th>
                    <th className="py-3 px-4 font-semibold text-right">Productos</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-subtle bg-surface">
                  {categorias.map((cat) => (
                    <tr key={cat.id} className="hover:bg-elevated/60 transition-fast">
                      <td className="py-3 px-4 font-mono tabular-nums text-muted">#{cat.id}</td>
                      <td className="py-3 px-4 font-heading font-bold text-primary text-sm">
                        {cat.nombre}
                      </td>
                      <td className="py-3 px-4">
                        <span className="px-2.5 py-0.5 rounded-md bg-elevated border border-subtle text-secondary font-medium">
                          {cat.temporada}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <span className="px-2.5 py-0.5 rounded-md bg-amber-500/10 border border-amber-500/30 text-amber-600 dark:text-amber-400 font-mono tabular-nums">
                          {cat.esquemaTalles}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right font-mono tabular-nums text-secondary">
                        {cat.cantidadProductos}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
