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
  ArrowClockwise,
  Sun,
  Moon,
  Percent,
} from '@phosphor-icons/react';
import { configuracionApi } from '../api/configuracionApi';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import { useThemeStore } from '../../../stores/useThemeStore';
import type { AxiosError } from 'axios';

type TabActiva = 'proveedores' | 'marcas' | 'categorias';

const ESQUEMAS_TALLES_SUGERIDOS = [
  'XS-XL',
  'S-XXL',
  '36-50',
  '35-39',
  '39-43',
  'US 8-11',
  'TU (Talle Único)',
];

const TEMPORADAS_SUGERIDAS = [
  'Todo el año',
  'Otoño / Invierno',
  'Primavera / Verano',
  'Drop Limitado',
];

// Formateador inteligente de Markup (soporta tanto factor 1.55 como porcentaje 55%)
function formatearMarkup(valor: number): { porcentaje: string; factor: string } {
  if (valor > 0 && valor <= 10) {
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
}

export const ConfiguracionPage: React.FC = () => {
  const queryClient = useQueryClient();
  const { theme, toggleTheme } = useThemeStore();

  const [tabActiva, setTabActiva] = useState<TabActiva>('proveedores');
  const [feedbackExito, setFeedbackExito] = useState<string | null>(null);
  const [feedbackError, setFeedbackError] = useState<string | null>(null);

  // Estado Formulario Nuevo Proveedor
  const [mostrarFormProveedor, setMostrarFormProveedor] = useState<boolean>(false);
  const [nombreProveedor, setNombreProveedor] = useState<string>('');
  const [markupPorcentaje, setMarkupPorcentaje] = useState<string>('55');

  // Estado Formulario Nueva Marca
  const [nombreMarca, setNombreMarca] = useState<string>('');

  // Estado Formulario Nueva Categoría
  const [nombreCategoria, setNombreCategoria] = useState<string>('');
  const [temporadaCategoria, setTemporadaCategoria] = useState<string>('Todo el año');
  const [esquemaTallesCategoria, setEsquemaTallesCategoria] = useState<string>('XS-XL');

  // Queries
  const {
    data: proveedores = [],
    isLoading: loadingProveedores,
    refetch: refetchProveedores,
  } = useQuery({
    queryKey: ['admin-config-proveedores'],
    queryFn: configuracionApi.obtenerProveedores,
  });

  const {
    data: marcas = [],
    isLoading: loadingMarcas,
    refetch: refetchMarcas,
  } = useQuery({
    queryKey: ['admin-config-marcas'],
    queryFn: configuracionApi.obtenerMarcas,
  });

  const {
    data: categorias = [],
    isLoading: loadingCategorias,
    refetch: refetchCategorias,
  } = useQuery({
    queryKey: ['admin-config-categorias'],
    queryFn: configuracionApi.obtenerCategorias,
  });

  const limpiarMensajes = () => {
    setFeedbackExito(null);
    setFeedbackError(null);
  };

  // Mutación: Crear Proveedor
  const crearProveedorMutation = useMutation({
    mutationFn: configuracionApi.crearProveedor,
    onSuccess: (creado) => {
      queryClient.invalidateQueries({ queryKey: ['admin-config-proveedores'] });
      setNombreProveedor('');
      setMarkupPorcentaje('55');
      setMostrarFormProveedor(false);
      setFeedbackError(null);
      setFeedbackExito(`Proveedor "${creado.nombre}" registrado correctamente.`);
    },
    onError: (err: AxiosError<{ error?: string }>) => {
      setFeedbackExito(null);
      setFeedbackError(
        err.response?.data?.error || 'No se pudo crear el proveedor. Verifica los datos.'
      );
    },
  });

  // Mutación: Crear Marca
  const crearMarcaMutation = useMutation({
    mutationFn: configuracionApi.crearMarca,
    onSuccess: (creada) => {
      queryClient.invalidateQueries({ queryKey: ['admin-config-marcas'] });
      setNombreMarca('');
      setFeedbackError(null);
      setFeedbackExito(`Marca "${creada.nombre}" agregada al catálogo.`);
    },
    onError: (err: AxiosError<{ error?: string }>) => {
      setFeedbackExito(null);
      setFeedbackError(
        err.response?.data?.error || 'No se pudo agregar la marca.'
      );
    },
  });

  // Mutación: Crear Categoría
  const crearCategoriaMutation = useMutation({
    mutationFn: configuracionApi.crearCategoria,
    onSuccess: (creada) => {
      queryClient.invalidateQueries({ queryKey: ['admin-config-categorias'] });
      setNombreCategoria('');
      setFeedbackError(null);
      setFeedbackExito(`Categoría "${creada.nombre}" registrada con éxito.`);
    },
    onError: (err: AxiosError<{ error?: string }>) => {
      setFeedbackExito(null);
      setFeedbackError(
        err.response?.data?.error || 'No se pudo registrar la categoría.'
      );
    },
  });

  const handleSubmitProveedor = (e: React.FormEvent) => {
    e.preventDefault();
    limpiarMensajes();
    if (!nombreProveedor.trim()) {
      setFeedbackError('Ingresa el nombre del proveedor.');
      return;
    }
    const numMarkup = parseFloat(markupPorcentaje);
    if (isNaN(numMarkup) || numMarkup < 0) {
      setFeedbackError('Ingresa un porcentaje de markup válido (ej: 55).');
      return;
    }
    crearProveedorMutation.mutate({
      nombre: nombreProveedor.trim(),
      markupPorDefecto: numMarkup,
    });
  };

  const handleSubmitMarca = (e: React.FormEvent) => {
    e.preventDefault();
    limpiarMensajes();
    if (!nombreMarca.trim()) {
      setFeedbackError('Ingresa el nombre de la marca.');
      return;
    }
    crearMarcaMutation.mutate({
      nombre: nombreMarca.trim(),
    });
  };

  const handleSubmitCategoria = (e: React.FormEvent) => {
    e.preventDefault();
    limpiarMensajes();
    if (!nombreCategoria.trim()) {
      setFeedbackError('Ingresa el nombre de la categoría.');
      return;
    }
    crearCategoriaMutation.mutate({
      nombre: nombreCategoria.trim(),
      temporada: temporadaCategoria.trim() || 'Todo el año',
      esquemaTalles: esquemaTallesCategoria.trim() || 'XS-XL',
    });
  };

  const handleRefrescarTodo = () => {
    limpiarMensajes();
    refetchProveedores();
    refetchMarcas();
    refetchCategorias();
  };

  return (
    <div className="p-4 sm:p-6 md:p-8 space-y-6 max-w-7xl mx-auto">
      {/* ======================================================== */}
      {/* 1. Cabecera Avant-Garde                                  */}
      {/* ======================================================== */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-4 border-b border-[#222222]">
        <div>
          <span className="text-[10px] font-mono uppercase tracking-[0.25em] text-[#71717A] block">
            SISTEMA // CATÁLOGOS BASE & PREFERENCIAS VISUALES
          </span>
          <h1 className="font-heading font-extrabold text-2xl md:text-3xl text-[#FAFAFA] tracking-tight uppercase flex items-center gap-2.5">
            <Gear size={28} weight="light" className="text-amber-400" />
            <span>CONFIGURACIÓN DEL SISTEMA</span>
          </h1>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Selector rápido de Tema Visual */}
          <button
            type="button"
            onClick={toggleTheme}
            className="px-3.5 py-2 border border-[#333333] bg-[#0C0C0C] hover:border-amber-400 text-xs font-mono uppercase tracking-wider flex items-center gap-2 cursor-pointer transition-fast"
            title="Alternar entre Modo Oscuro y Modo Claro"
          >
            {theme === 'dark' ? (
              <>
                <Sun size={16} weight="bold" className="text-amber-400" />
                <span className="text-[#FAFAFA]"> CAMBIAR A LIGHT MODE</span>
              </>
            ) : (
              <>
                <Moon size={16} weight="bold" className="text-amber-400" />
                <span className="text-[#FAFAFA]"> CAMBIAR A DARK MODE</span>
              </>
            )}
          </button>

          <Button
            variant="secondary"
            size="sm"
            onClick={handleRefrescarTodo}
            className="border-[#333333] text-xs font-mono gap-1.5"
          >
            <ArrowClockwise size={14} />
            <span>REFRESCAR</span>
          </Button>
        </div>
      </div>

      {/* ======================================================== */}
      {/* 2. Banners de Feedback                                   */}
      {/* ======================================================== */}
      {feedbackExito && (
        <div className="p-3.5 border border-emerald-700 bg-emerald-950/40 text-emerald-400 text-xs font-mono flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle size={18} weight="bold" />
            <span>{feedbackExito}</span>
          </div>
          <button
            type="button"
            onClick={() => setFeedbackExito(null)}
            className="text-[10px] uppercase underline cursor-pointer"
          >
            Cerrar
          </button>
        </div>
      )}

      {feedbackError && (
        <div className="p-3.5 border border-red-700 bg-red-950/40 text-red-400 text-xs font-mono flex items-center justify-between">
          <div className="flex items-center gap-2">
            <WarningCircle size={18} weight="bold" />
            <span>{feedbackError}</span>
          </div>
          <button
            type="button"
            onClick={() => setFeedbackError(null)}
            className="text-[10px] uppercase underline cursor-pointer"
          >
            Cerrar
          </button>
        </div>
      )}

      {/* ======================================================== */}
      {/* 3. Navegación por Pestañas (Proveedores / Marcas / Cat)  */}
      {/* ======================================================== */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <button
          type="button"
          onClick={() => {
            limpiarMensajes();
            setTabActiva('proveedores');
          }}
          className={`p-4 border text-left transition-fast cursor-pointer flex items-center justify-between ${
            tabActiva === 'proveedores'
              ? 'border-amber-400 bg-[#141414]'
              : 'border-[#222222] bg-[#090909] hover:border-[#333333]'
          }`}
        >
          <div className="flex items-center gap-3">
            <div className="p-2 border border-[#333333] bg-[#0C0C0C] text-amber-400">
              <Truck size={20} weight="light" />
            </div>
            <div>
              <span className="font-heading font-extrabold text-sm uppercase text-[#FAFAFA] block">
                1. PROVEEDORES
              </span>
              <span className="text-[11px] font-mono text-[#71717A]">
                Talleres y Markup % por defecto
              </span>
            </div>
          </div>
          <span className="px-2 py-0.5 text-xs font-mono font-bold bg-[#111111] border border-[#333333] text-amber-400">
            {proveedores.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => {
            limpiarMensajes();
            setTabActiva('marcas');
          }}
          className={`p-4 border text-left transition-fast cursor-pointer flex items-center justify-between ${
            tabActiva === 'marcas'
              ? 'border-amber-400 bg-[#141414]'
              : 'border-[#222222] bg-[#090909] hover:border-[#333333]'
          }`}
        >
          <div className="flex items-center gap-3">
            <div className="p-2 border border-[#333333] bg-[#0C0C0C] text-amber-400">
              <Tag size={20} weight="light" />
            </div>
            <div>
              <span className="font-heading font-extrabold text-sm uppercase text-[#FAFAFA] block">
                2. MARCAS
              </span>
              <span className="text-[11px] font-mono text-[#71717A]">
                Dastik, Hidden Sneakers, Nike...
              </span>
            </div>
          </div>
          <span className="px-2 py-0.5 text-xs font-mono font-bold bg-[#111111] border border-[#333333] text-amber-400">
            {marcas.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => {
            limpiarMensajes();
            setTabActiva('categorias');
          }}
          className={`p-4 border text-left transition-fast cursor-pointer flex items-center justify-between ${
            tabActiva === 'categorias'
              ? 'border-amber-400 bg-[#141414]'
              : 'border-[#222222] bg-[#090909] hover:border-[#333333]'
          }`}
        >
          <div className="flex items-center gap-3">
            <div className="p-2 border border-[#333333] bg-[#0C0C0C] text-amber-400">
              <Folders size={20} weight="light" />
            </div>
            <div>
              <span className="font-heading font-extrabold text-sm uppercase text-[#FAFAFA] block">
                3. CATEGORÍAS
              </span>
              <span className="text-[11px] font-mono text-[#71717A]">
                Temporadas y curvas de talles
              </span>
            </div>
          </div>
          <span className="px-2 py-0.5 text-xs font-mono font-bold bg-[#111111] border border-[#333333] text-amber-400">
            {categorias.length}
          </span>
        </button>
      </div>

      {/* ======================================================== */}
      {/* PESTAÑA 1: PROVEEDORES                                   */}
      {/* ======================================================== */}
      {tabActiva === 'proveedores' && (
        <div className="bg-[#090909] border border-[#222222] p-5 sm:p-6 space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-[#222222]">
            <div>
              <h2 className="font-heading font-extrabold text-base uppercase text-[#FAFAFA] tracking-wide">
                DIRECTORIO DE PROVEEDORES & TALLERES
              </h2>
              <p className="text-xs font-sans text-[#71717A]">
                Define el porcentaje de Markup por defecto para calcular automáticamente el precio sugerido al dar de alta mercadería.
              </p>
            </div>

            <Button
              variant="primary"
              size="sm"
              onClick={() => setMostrarFormProveedor((prev) => !prev)}
              className="gap-1.5 text-xs font-heading font-bold tracking-wider shrink-0"
            >
              <Plus size={15} weight="bold" />
              <span>{mostrarFormProveedor ? 'CANCELAR' : 'NUEVO PROVEEDOR'}</span>
            </Button>
          </div>

          {/* Formulario Desplegable: Nuevo Proveedor */}
          {mostrarFormProveedor && (
            <form
              onSubmit={handleSubmitProveedor}
              className="p-4 bg-[#0C0C0C] border border-amber-400/50 space-y-4"
            >
              <div className="flex items-center justify-between border-b border-[#222222] pb-2">
                <span className="text-xs font-mono uppercase tracking-wider text-amber-400 font-bold">
                  ALTA DE NUEVO PROVEEDOR
                </span>
                <span className="text-[10px] font-mono text-[#71717A]">
                  Ej: Markup 55% = multiplica el costo base x 1.55
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-end">
                <div className="sm:col-span-2">
                  <Input
                    id="nombreProveedor"
                    label="NOMBRE DEL PROVEEDOR / TALLER *"
                    placeholder="Ej: Taller Textil Flores / Importadora Brasil"
                    value={nombreProveedor}
                    onChange={(e) => setNombreProveedor(e.target.value)}
                    required
                  />
                </div>

                <div>
                  <label
                    htmlFor="markupPorcentaje"
                    className="text-xs uppercase tracking-widest text-[#71717A] font-sans block mb-1"
                  >
                    MARKUP % POR DEFECTO *
                  </label>
                  <div className="relative flex items-center">
                    <input
                      id="markupPorcentaje"
                      type="number"
                      step="0.5"
                      min="0"
                      value={markupPorcentaje}
                      onChange={(e) => setMarkupPorcentaje(e.target.value)}
                      className="w-full bg-[#111111] text-[#FAFAFA] border border-[#333333] focus:border-[#FAFAFA] px-3 py-2.5 text-sm font-mono font-bold outline-none"
                      required
                    />
                    <Percent size={15} className="absolute right-3 text-amber-400 pointer-events-none" />
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
                  CANCELAR
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  size="sm"
                  disabled={crearProveedorMutation.isPending}
                >
                  {crearProveedorMutation.isPending ? 'GUARDANDO...' : 'GUARDAR PROVEEDOR'}
                </Button>
              </div>
            </form>
          )}

          {/* Grilla de Proveedores */}
          {loadingProveedores ? (
            <div className="p-8 text-center text-xs font-mono text-[#71717A]">
              CARGANDO PROVEEDORES...
            </div>
          ) : proveedores.length === 0 ? (
            <div className="p-8 text-center text-xs font-mono text-[#71717A] border border-dashed border-[#222222]">
              No hay proveedores registrados. Haz clic en &quot;Nuevo Proveedor&quot; para comenzar.
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {proveedores.map((prov) => {
                const infoMarkup = formatearMarkup(prov.markupPorDefecto);
                return (
                  <div
                    key={prov.id}
                    className="p-4 bg-[#0C0C0C] border border-[#222222] hover:border-[#333333] flex flex-col justify-between gap-4 transition-fast"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <span className="text-[10px] font-mono text-[#71717A] block">
                          ID #{prov.id}
                        </span>
                        <h3 className="font-heading font-extrabold text-sm uppercase text-[#FAFAFA] mt-0.5">
                          {prov.nombre}
                        </h3>
                      </div>
                      <span className="px-2 py-0.5 bg-emerald-950/40 border border-emerald-700/60 text-emerald-400 text-xs font-mono font-bold">
                        +{infoMarkup.porcentaje}
                      </span>
                    </div>

                    <div className="pt-3 border-t border-[#1A1A1A] flex items-center justify-between text-[11px] font-mono text-[#A1A1AA]">
                      <span>Factor: {infoMarkup.factor}</span>
                      <span>{prov.cantidadProductos} productos activos</span>
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
        <div className="bg-[#090909] border border-[#222222] p-5 sm:p-6 space-y-5">
          <div className="pb-4 border-b border-[#222222]">
            <h2 className="font-heading font-extrabold text-base uppercase text-[#FAFAFA] tracking-wide">
              MARCAS COMERCIALES
            </h2>
            <p className="text-xs font-sans text-[#71717A]">
              Gestiona las marcas oficiales disponibles al clasificar prendas o zapatillas en el inventario.
            </p>
          </div>

          {/* Formulario rápido en línea para agregar Marca */}
          <form
            onSubmit={handleSubmitMarca}
            className="p-4 bg-[#0C0C0C] border border-[#222222] flex flex-col sm:flex-row items-stretch sm:items-end gap-3"
          >
            <div className="flex-1">
              <Input
                id="nombreMarca"
                label="NUEVA MARCA *"
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
              className="gap-1.5 text-xs font-heading font-bold tracking-wider shrink-0"
            >
              <Plus size={15} weight="bold" />
              <span>{crearMarcaMutation.isPending ? 'AGREGANDO...' : 'AGREGAR MARCA'}</span>
            </Button>
          </form>

          {/* Grilla de Marcas */}
          {loadingMarcas ? (
            <div className="p-8 text-center text-xs font-mono text-[#71717A]">
              CARGANDO MARCAS...
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
              {marcas.map((marca) => (
                <div
                  key={marca.id}
                  className="p-4 bg-[#0C0C0C] border border-[#222222] hover:border-[#333333] flex items-center justify-between transition-fast"
                >
                  <div>
                    <span className="text-[10px] font-mono text-[#71717A] block">
                      MARCA #{marca.id}
                    </span>
                    <span className="font-heading font-extrabold text-sm uppercase text-[#FAFAFA]">
                      {marca.nombre}
                    </span>
                  </div>
                  <span className="px-2 py-0.5 bg-[#141414] border border-[#333333] text-[11px] font-mono text-[#A1A1AA]">
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
        <div className="bg-[#090909] border border-[#222222] p-5 sm:p-6 space-y-5">
          <div className="pb-4 border-b border-[#222222]">
            <h2 className="font-heading font-extrabold text-base uppercase text-[#FAFAFA] tracking-wide">
              CATEGORÍAS, TEMPORADAS & ESQUEMAS DE TALLES
            </h2>
            <p className="text-xs font-sans text-[#71717A]">
              Estructura los rubros del catálogo asociando su temporada comercial y curva de talles estándar.
            </p>
          </div>

          {/* Formulario para crear Categoría */}
          <form
            onSubmit={handleSubmitCategoria}
            className="p-4 bg-[#0C0C0C] border border-[#222222] space-y-4"
          >
            <span className="text-xs font-mono uppercase tracking-wider text-amber-400 font-bold block">
              NUEVA CATEGORÍA DE PRODUCTO
            </span>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Input
                id="nombreCategoria"
                label="NOMBRE DE LA CATEGORÍA *"
                placeholder="Ej: Remeras, Pantalones, Buzos, Sneakers..."
                value={nombreCategoria}
                onChange={(e) => setNombreCategoria(e.target.value)}
                required
              />

              <div className="flex flex-col gap-1">
                <label
                  htmlFor="temporadaCategoria"
                  className="text-xs uppercase tracking-widest text-[#71717A] font-sans"
                >
                  TEMPORADA *
                </label>
                <select
                  id="temporadaCategoria"
                  value={temporadaCategoria}
                  onChange={(e) => setTemporadaCategoria(e.target.value)}
                  className="w-full bg-[#111111] text-[#FAFAFA] border border-[#333333] focus:border-[#FAFAFA] px-3 py-2.5 text-sm outline-none font-sans cursor-pointer"
                >
                  {TEMPORADAS_SUGERIDAS.map((temp) => (
                    <option key={temp} value={temp}>
                      {temp}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex flex-col gap-1">
                <label
                  htmlFor="esquemaTallesCategoria"
                  className="text-xs uppercase tracking-widest text-[#71717A] font-sans"
                >
                  ESQUEMA DE TALLES *
                </label>
                <select
                  id="esquemaTallesCategoria"
                  value={esquemaTallesCategoria}
                  onChange={(e) => setEsquemaTallesCategoria(e.target.value)}
                  className="w-full bg-[#111111] text-[#FAFAFA] border border-[#333333] focus:border-[#FAFAFA] px-3 py-2.5 text-sm outline-none font-mono cursor-pointer"
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
                className="gap-1.5 text-xs font-heading font-bold tracking-wider"
              >
                <Plus size={15} weight="bold" />
                <span>{crearCategoriaMutation.isPending ? 'CREANDO...' : 'CREAR CATEGORÍA'}</span>
              </Button>
            </div>
          </form>

          {/* Tabla / Lista de Categorías */}
          {loadingCategorias ? (
            <div className="p-8 text-center text-xs font-mono text-[#71717A]">
              CARGANDO CATEGORÍAS...
            </div>
          ) : (
            <div className="overflow-x-auto border border-[#222222]">
              <table className="w-full text-left text-xs font-mono border-collapse">
                <thead className="bg-[#0C0C0C] text-[#71717A] border-b border-[#222222]">
                  <tr>
                    <th className="py-3 px-4 uppercase tracking-wider font-semibold">ID</th>
                    <th className="py-3 px-4 uppercase tracking-wider font-semibold">Categoría</th>
                    <th className="py-3 px-4 uppercase tracking-wider font-semibold">Temporada</th>
                    <th className="py-3 px-4 uppercase tracking-wider font-semibold">Esquema de Talles</th>
                    <th className="py-3 px-4 uppercase tracking-wider font-semibold text-right">
                      Productos Activos
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#1A1A1A]">
                  {categorias.map((cat) => (
                    <tr key={cat.id} className="hover:bg-[#111111] transition-colors">
                      <td className="py-3 px-4 text-[#71717A]">#{cat.id}</td>
                      <td className="py-3 px-4 font-heading font-extrabold text-sm text-[#FAFAFA] uppercase">
                        {cat.nombre}
                      </td>
                      <td className="py-3 px-4 text-[#A1A1AA]">{cat.temporada}</td>
                      <td className="py-3 px-4">
                        <span className="px-2 py-0.5 bg-[#141414] border border-[#333333] text-amber-400 font-bold">
                          {cat.esquemaTalles}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right font-bold text-[#FAFAFA]">
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
