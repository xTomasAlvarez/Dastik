import React, { useState, useMemo, useEffect, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'motion/react';
import {
  ArrowsClockwise,
  MagnifyingGlass,
  Barcode,
  WarningCircle,
  CheckCircle,
  X,
  CaretLeft,
  CaretRight,
  CaretUp,
  SquaresFour,
  EyeSlash,
  SortAscending,
} from '@phosphor-icons/react';
import {
  inventarioApi,
  calcularStockTotalProducto,
  compararProductosMasNuevosConStock,
  ORDEN_CATEGORIAS_OFICIALES,
  normalizarUrlImagenAltaRes,
  type ProductoCatalogoDto,
} from '../api/inventarioApi';
import { useCartStore } from '../stores/useCartStore';
import { ProductCard } from './ProductCard';
import { ModalQuickViewPos } from './ModalQuickViewPos';

interface CatalogoGridProps {
  onProductosLoaded?: (productos: ProductoCatalogoDto[]) => void;
}

type OrdenCatalogoPos =
  | 'NUEVOS_CON_STOCK'
  | 'MENOR_PRECIO'
  | 'MAYOR_PRECIO'
  | 'MAYOR_STOCK';

const PAGE_SIZE = 12;

export const CatalogoGrid: React.FC<CatalogoGridProps> = ({ onProductosLoaded }) => {
  const [omnibarInput, setOmnibarInput] = useState('');
  const [filtroUnidad, setFiltroUnidad] = useState<'TODOS' | 'DASTIK' | 'HIDDEN'>('TODOS');
  const [categoriaActiva, setCategoriaActiva] = useState<string>('TODAS');
  const [ordenActivo, setOrdenActivo] = useState<OrdenCatalogoPos>('NUEVOS_CON_STOCK');
  const [ocultarAgotados, setOcultarAgotados] = useState(false);
  const [paginaActual, setPaginaActual] = useState(1);
  const [quickViewProducto, setQuickViewProducto] = useState<ProductoCatalogoDto | null>(null);
  const [expandirCategorias, setExpandirCategorias] = useState(false);

  const [scanFeedback, setScanFeedback] = useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);

  const inputRef = useRef<HTMLInputElement>(null);
  const categoriesRef = useRef<HTMLDivElement>(null);
  const feedbackTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const scrollCategorias = (direccion: 'izq' | 'der') => {
    if (categoriesRef.current) {
      const delta = direccion === 'izq' ? -260 : 260;
      categoriesRef.current.scrollBy({ left: delta, behavior: 'smooth' });
    }
  };

  const handleCategoriesWheel = (e: React.WheelEvent<HTMLDivElement>) => {
    if (categoriesRef.current && !expandirCategorias) {
      if (categoriesRef.current.scrollWidth > categoriesRef.current.clientWidth) {
        if (Math.abs(e.deltaY) > Math.abs(e.deltaX)) {
          categoriesRef.current.scrollLeft += e.deltaY;
        }
      }
    }
  };

  const addItem = useCartStore((state) => state.addItem);

  const {
    data: productos = [],
    isLoading,
    isError,
    error,
    refetch,
    isFetching,
  } = useQuery({
    queryKey: ['catalogo-pos'],
    queryFn: async () => {
      const data = await inventarioApi.obtenerProductos();
      if (onProductosLoaded) {
        onProductosLoaded(data);
      }
      return data;
    },
  });

  const showScanFeedback = (type: 'success' | 'error', message: string) => {
    if (feedbackTimerRef.current) clearTimeout(feedbackTimerRef.current);
    setScanFeedback({ type, message });
    feedbackTimerRef.current = setTimeout(() => {
      setScanFeedback(null);
    }, 3000);
  };

  useEffect(() => {
    return () => {
      if (feedbackTimerRef.current) clearTimeout(feedbackTimerRef.current);
    };
  }, []);

  // Atajo F1 para enfocar la Omnibar inmediatamente
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'F1') {
        e.preventDefault();
        inputRef.current?.focus();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Procesar escaneo EAN-13 al presionar Enter en la Omnibar (pistola lectora USB física)
  const handleOmnibarSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const code = omnibarInput.trim();
    if (!code) return;

    for (const prod of productos) {
      const variante = prod.variantes.find(
        (v) => v.codigoBarras && v.codigoBarras.toLowerCase() === code.toLowerCase()
      );

      if (variante) {
        if (variante.stockFisico <= 0) {
          showScanFeedback(
            'error',
            `Sin stock: ${prod.nombre} (${variante.talle})`
          );
          setOmnibarInput('');
          return;
        }

        const rawImagen =
          (prod.imagenes && prod.imagenes.length > 0
            ? prod.imagenes[0]
            : prod.imagenUrl) || '';

        addItem({
          varianteId: variante.id,
          productoId: prod.id,
          nombreProducto: prod.nombre,
          marca: prod.marca,
          talle: variante.talle,
          color: variante.color,
          codigoBarras: variante.codigoBarras,
          precioUnitario: prod.precioVenta,
          stockFisico: variante.stockFisico,
          imagenUrl: normalizarUrlImagenAltaRes(rawImagen),
        });

        showScanFeedback(
          'success',
          `+1 ${prod.nombre} (${variante.talle})`
        );
        setOmnibarInput('');
        return;
      }
    }

    if (/^\d{8,14}$/.test(code)) {
      showScanFeedback('error', `EAN no encontrado: ${code}`);
      setOmnibarInput('');
    }
  };

  // Productos filtrados por Unidad y Ocultar Agotados (base para conteo de pills de categorías)
  const productosBaseParaCategorias = useMemo(() => {
    return productos.filter((p) => {
      if (
        filtroUnidad === 'DASTIK' &&
        !p.unidadNegocio?.toLowerCase().includes('dastik')
      ) {
        return false;
      }
      if (
        filtroUnidad === 'HIDDEN' &&
        !p.unidadNegocio?.toLowerCase().includes('hidden')
      ) {
        return false;
      }
      if (ocultarAgotados) {
        if (calcularStockTotalProducto(p) <= 0) return false;
      }
      return true;
    });
  }, [productos, filtroUnidad, ocultarAgotados]);

  // Calcular categorías con conteos reales (ordenadas según taxonomía de tienda)
  const categoriasConConteo = useMemo(() => {
    const mapa = new Map<string, number>();
    for (const p of productosBaseParaCategorias) {
      const cat = p.categoria || 'General';
      mapa.set(cat, (mapa.get(cat) || 0) + 1);
    }

    const lista = Array.from(mapa.entries()).map(([nombre, cantidad]) => ({
      nombre,
      cantidad,
    }));

    lista.sort((a, b) => {
      const idxA = ORDEN_CATEGORIAS_OFICIALES.indexOf(a.nombre);
      const idxB = ORDEN_CATEGORIAS_OFICIALES.indexOf(b.nombre);
      if (idxA !== -1 && idxB !== -1) return idxA - idxB;
      if (idxA !== -1) return -1;
      if (idxB !== -1) return 1;
      return b.cantidad - a.cantidad;
    });

    return lista;
  }, [productosBaseParaCategorias]);

  // Filtrado y Ordenamiento reactivo en memoria
  const productosFiltrados = useMemo(() => {
    const filtrados = productosBaseParaCategorias.filter((p) => {
      if (categoriaActiva !== 'TODAS' && p.categoria !== categoriaActiva) {
        return false;
      }

      if (!omnibarInput.trim()) return true;

      const termino = omnibarInput.toLowerCase().trim();
      const coincideNombre = p.nombre.toLowerCase().includes(termino);
      const coincideMarca = p.marca.toLowerCase().includes(termino);
      const coincideCategoria = p.categoria.toLowerCase().includes(termino);
      const coincideVariante = p.variantes.some(
        (v) =>
          v.talle.toLowerCase().includes(termino) ||
          v.codigoBarras.toLowerCase().includes(termino)
      );

      return (
        coincideNombre ||
        coincideMarca ||
        coincideCategoria ||
        coincideVariante
      );
    });

    return [...filtrados].sort((a, b) => {
      const stockA = calcularStockTotalProducto(a);
      const stockB = calcularStockTotalProducto(b);

      // Siempre priorizar productos con stock disponible por encima de los agotados
      const tieneStockA = stockA > 0 ? 1 : 0;
      const tieneStockB = stockB > 0 ? 1 : 0;
      if (tieneStockA !== tieneStockB) {
        return tieneStockB - tieneStockA;
      }

      if (ordenActivo === 'MENOR_PRECIO') {
        if (a.precioVenta !== b.precioVenta) return a.precioVenta - b.precioVenta;
      } else if (ordenActivo === 'MAYOR_PRECIO') {
        if (a.precioVenta !== b.precioVenta) return b.precioVenta - a.precioVenta;
      } else if (ordenActivo === 'MAYOR_STOCK') {
        if (stockA !== stockB) return stockB - stockA;
      }

      return compararProductosMasNuevosConStock(a, b);
    });
  }, [productosBaseParaCategorias, categoriaActiva, omnibarInput, ordenActivo]);

  // Resetear a la página 1 cuando cambian los filtros u orden
  useEffect(() => {
    setPaginaActual(1);
  }, [omnibarInput, filtroUnidad, categoriaActiva, ordenActivo, ocultarAgotados]);

  const totalPaginas = Math.max(1, Math.ceil(productosFiltrados.length / PAGE_SIZE));
  const indiceInicio = (paginaActual - 1) * PAGE_SIZE;
  const productosPaginados = useMemo(() => {
    return productosFiltrados.slice(indiceInicio, indiceInicio + PAGE_SIZE);
  }, [productosFiltrados, indiceInicio]);

  return (
    <div className="flex-1 flex flex-col gap-3.5">
      {/* 1. Omnibar Unificada + Filtros + Barra Horizontal de Categorías */}
      <div className="rounded-xl border border-subtle bg-surface p-3 shadow-surface flex flex-col gap-2.5">
        <div className="flex flex-col xl:flex-row items-stretch xl:items-center justify-between gap-2.5">
          {/* Input Híbrido (Buscador + Escáner EAN-13 en Enter) */}
          <form onSubmit={handleOmnibarSubmit} className="relative flex-1">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-muted gap-1.5">
              <MagnifyingGlass size={16} weight="bold" />
            </div>
            <input
              ref={inputRef}
              type="text"
              value={omnibarInput}
              onChange={(e) => setOmnibarInput(e.target.value)}
              placeholder="Buscar modelo, marca, talle o escanear código EAN-13 [Enter]..."
              className="w-full pl-10 pr-24 py-2 bg-elevated focus:bg-surface border border-subtle focus:border-amber-500/80 focus:ring-2 focus:ring-amber-500/20 rounded-lg text-xs sm:text-sm font-sans text-primary placeholder:text-muted outline-none transition-fast"
              autoFocus
            />
            <div className="absolute inset-y-0 right-2 flex items-center gap-1">
              {omnibarInput ? (
                <button
                  type="button"
                  onClick={() => {
                    setOmnibarInput('');
                    inputRef.current?.focus();
                  }}
                  className="h-6 px-2 rounded-md flex items-center gap-1 text-[11px] font-medium text-secondary hover:text-primary hover:bg-surface cursor-pointer"
                >
                  <X size={12} weight="bold" />
                  <span>Limpiar</span>
                </button>
              ) : (
                <span className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded border border-subtle bg-surface text-[10px] font-mono text-muted select-none">
                  <Barcode size={13} weight="bold" className="text-amber-500" />
                  EAN / F1
                </span>
              )}
            </div>
          </form>

          {/* Controles de Filtro y Ordenamiento en la misma barra */}
          <div className="flex flex-wrap items-center justify-between sm:justify-end gap-2">
            {/* Segmented Control con Indicador Deslizante (Motion layoutId) */}
            <div className="flex items-center bg-elevated p-1 rounded-lg border border-subtle">
              {(
                [
                  { id: 'TODOS', label: 'Todos' },
                  { id: 'DASTIK', label: 'Dastik' },
                  { id: 'HIDDEN', label: 'Hidden Sneakers' },
                ] as const
              ).map((tab) => {
                const activo = filtroUnidad === tab.id;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setFiltroUnidad(tab.id)}
                    className={`relative px-3 py-1 text-xs font-sans font-semibold rounded-md transition-colors cursor-pointer ${
                      activo ? 'text-primary' : 'text-secondary hover:text-primary'
                    }`}
                  >
                    {activo && (
                      <motion.div
                        layoutId="pos-unit-pill"
                        transition={{ type: 'spring', stiffness: 420, damping: 32 }}
                        className="absolute inset-0 bg-surface rounded-md shadow-sm border border-subtle/60"
                      />
                    )}
                    <span className="relative z-10">{tab.label}</span>
                  </button>
                );
              })}
            </div>

            {/* Selector de Ordenamiento */}
            <div className="relative flex items-center">
              <SortAscending
                size={14}
                weight="bold"
                className="absolute left-2.5 text-amber-500 pointer-events-none"
              />
              <select
                value={ordenActivo}
                onChange={(e) => setOrdenActivo(e.target.value as OrdenCatalogoPos)}
                className="pl-8 pr-3 py-1.5 rounded-lg border border-subtle bg-elevated hover:border-strong text-xs font-sans font-medium text-primary focus:outline-none focus:border-amber-500/80 transition-fast cursor-pointer"
                title="Ordenar catálogo"
              >
                <option value="NUEVOS_CON_STOCK">Más nuevos (Con stock)</option>
                <option value="MENOR_PRECIO">Menor precio</option>
                <option value="MAYOR_PRECIO">Mayor precio</option>
                <option value="MAYOR_STOCK">Mayor stock</option>
              </select>
            </div>

            {/* Toggle Ocultar Agotados */}
            <button
              type="button"
              onClick={() => setOcultarAgotados((prev) => !prev)}
              className={`px-2.5 py-1.5 rounded-lg border text-xs font-sans font-medium flex items-center gap-1.5 transition-fast cursor-pointer ${
                ocultarAgotados
                  ? 'border-amber-500/50 bg-amber-500/10 text-amber-600 dark:text-amber-400 font-semibold'
                  : 'border-subtle bg-elevated text-secondary hover:text-primary'
              }`}
              title="Ocultar productos sin stock disponible"
            >
              <EyeSlash size={14} weight={ocultarAgotados ? 'fill' : 'regular'} />
              <span className="hidden sm:inline">Ocultar agotados</span>
            </button>

            {/* Botón Refrescar */}
            <button
              type="button"
              onClick={() => refetch()}
              disabled={isFetching}
              title="Recargar catálogo"
              className="border border-subtle bg-elevated hover:bg-surface hover:border-strong rounded-lg p-2 text-secondary hover:text-primary transition-fast cursor-pointer disabled:opacity-40 active:scale-[0.97]"
            >
              <ArrowsClockwise
                size={15}
                weight="bold"
                className={isFetching ? 'animate-spin text-amber-500' : ''}
              />
            </button>
          </div>
        </div>

        {/* Barra de Categorías con Navegación y Scroll Horizontal */}
        {categoriasConConteo.length > 0 && (
          <div className="pt-2 border-t border-subtle flex flex-col gap-1.5">
            {expandirCategorias ? (
              <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-mono text-muted uppercase tracking-wider">
                    Todas las Categorías ({categoriasConConteo.length + 1})
                  </span>
                  <button
                    type="button"
                    onClick={() => setExpandirCategorias(false)}
                    className="h-7 px-2.5 rounded-lg border border-subtle bg-elevated hover:bg-surface text-secondary hover:text-primary flex items-center gap-1 text-xs font-sans font-medium transition-fast cursor-pointer active:scale-95 shadow-2xs"
                    title="Colapsar a fila desplazable"
                  >
                    <CaretUp size={13} weight="bold" />
                    <span>Colapsar carrusel</span>
                  </button>
                </div>
                <div className="flex flex-wrap items-center gap-1.5 max-h-[190px] overflow-y-auto pr-1">
                  <button
                    type="button"
                    onClick={() => setCategoriaActiva('TODAS')}
                    className={`px-3 py-1.5 rounded-lg border text-xs font-sans font-semibold whitespace-nowrap transition-fast cursor-pointer flex items-center gap-1.5 shrink-0 ${
                      categoriaActiva === 'TODAS'
                        ? 'border-amber-500/60 bg-amber-500/15 text-amber-600 dark:text-amber-400 shadow-xs'
                        : 'border-subtle bg-elevated/70 hover:bg-elevated text-secondary hover:text-primary'
                    }`}
                  >
                    <span>Todas</span>
                    <span className="font-mono text-[10px] opacity-80">
                      ({productosBaseParaCategorias.length})
                    </span>
                  </button>

                  {categoriasConConteo.map((cat) => {
                    const activa = categoriaActiva === cat.nombre;
                    return (
                      <button
                        key={cat.nombre}
                        type="button"
                        onClick={() =>
                          setCategoriaActiva((prev) =>
                            prev === cat.nombre ? 'TODAS' : cat.nombre
                          )
                        }
                        className={`px-3 py-1.5 rounded-lg border text-xs font-sans font-semibold whitespace-nowrap transition-fast cursor-pointer flex items-center gap-1.5 shrink-0 ${
                          activa
                            ? 'border-amber-500/60 bg-amber-500/15 text-amber-600 dark:text-amber-400 shadow-xs'
                            : 'border-subtle bg-elevated/70 hover:bg-elevated text-secondary hover:text-primary'
                        }`}
                      >
                        <span>{cat.nombre}</span>
                        <span className="font-mono text-[10px] opacity-80">
                          ({cat.cantidad})
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-1.5">
                {/* Botón Scroll Izquierda */}
                <button
                  type="button"
                  onClick={() => scrollCategorias('izq')}
                  className="h-8 w-8 rounded-lg border border-subtle bg-elevated hover:bg-surface hover:border-strong text-secondary hover:text-primary flex items-center justify-center shrink-0 transition-fast cursor-pointer active:scale-95 shadow-2xs"
                  title="Desplazar categorías hacia la izquierda"
                  aria-label="Desplazar izquierda"
                >
                  <CaretLeft size={14} weight="bold" />
                </button>

                {/* Contenedor Carrusel Horizontal con onWheel y scrollbar estilizada */}
                <div
                  ref={categoriesRef}
                  onWheel={handleCategoriesWheel}
                  className="flex-1 flex items-center gap-1.5 overflow-x-auto pb-1.5 pt-0.5 custom-scrollbar-h select-none"
                >
                  <button
                    type="button"
                    onClick={() => setCategoriaActiva('TODAS')}
                    className={`px-3 py-1.5 rounded-lg border text-xs font-sans font-semibold whitespace-nowrap transition-fast cursor-pointer flex items-center gap-1.5 shrink-0 ${
                      categoriaActiva === 'TODAS'
                        ? 'border-amber-500/60 bg-amber-500/15 text-amber-600 dark:text-amber-400 shadow-xs'
                        : 'border-subtle bg-elevated/70 hover:bg-elevated text-secondary hover:text-primary'
                    }`}
                  >
                    <span>Todas</span>
                    <span className="font-mono text-[10px] opacity-80">
                      ({productosBaseParaCategorias.length})
                    </span>
                  </button>

                  {categoriasConConteo.map((cat) => {
                    const activa = categoriaActiva === cat.nombre;
                    return (
                      <button
                        key={cat.nombre}
                        type="button"
                        onClick={() =>
                          setCategoriaActiva((prev) =>
                            prev === cat.nombre ? 'TODAS' : cat.nombre
                          )
                        }
                        className={`px-3 py-1.5 rounded-lg border text-xs font-sans font-semibold whitespace-nowrap transition-fast cursor-pointer flex items-center gap-1.5 shrink-0 ${
                          activa
                            ? 'border-amber-500/60 bg-amber-500/15 text-amber-600 dark:text-amber-400 shadow-xs'
                            : 'border-subtle bg-elevated/70 hover:bg-elevated text-secondary hover:text-primary'
                        }`}
                      >
                        <span>{cat.nombre}</span>
                        <span className="font-mono text-[10px] opacity-80">
                          ({cat.cantidad})
                        </span>
                      </button>
                    );
                  })}
                </div>

                {/* Botón Scroll Derecha */}
                <button
                  type="button"
                  onClick={() => scrollCategorias('der')}
                  className="h-8 w-8 rounded-lg border border-subtle bg-elevated hover:bg-surface hover:border-strong text-secondary hover:text-primary flex items-center justify-center shrink-0 transition-fast cursor-pointer active:scale-95 shadow-2xs"
                  title="Desplazar categorías hacia la derecha"
                  aria-label="Desplazar derecha"
                >
                  <CaretRight size={14} weight="bold" />
                </button>

                {/* Botón Ver Todas / Expandir */}
                <button
                  type="button"
                  onClick={() => setExpandirCategorias(true)}
                  className="h-8 px-2.5 rounded-lg border border-subtle bg-elevated hover:bg-surface hover:border-strong text-secondary hover:text-primary flex items-center gap-1 shrink-0 text-xs font-sans font-medium transition-fast cursor-pointer active:scale-95 shadow-2xs"
                  title="Ver todas las categorías en cuadrícula"
                >
                  <SquaresFour size={14} weight="bold" />
                  <span className="hidden sm:inline">Ver todas</span>
                </button>
              </div>
            )}
          </div>
        )}

        {/* Toast Inline de Escaneo EAN-13 */}
        <AnimatePresence>
          {scanFeedback && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className={`rounded-lg px-3 py-1.5 flex items-center justify-between text-xs font-sans border ${
                scanFeedback.type === 'success'
                  ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-600 dark:text-emerald-400'
                  : 'bg-red-500/10 border-red-500/30 text-red-600 dark:text-red-400'
              }`}
            >
              <div className="flex items-center gap-2 font-medium">
                {scanFeedback.type === 'success' ? (
                  <CheckCircle size={15} weight="fill" />
                ) : (
                  <WarningCircle size={15} weight="fill" />
                )}
                <span>{scanFeedback.message}</span>
              </div>
              <button
                type="button"
                onClick={() => setScanFeedback(null)}
                className="opacity-70 hover:opacity-100 cursor-pointer"
              >
                <X size={13} />
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* 2. Contenedor de Grilla de Productos */}
      <div className="flex-1 min-h-[380px]">
        {/* Loading Skeletons */}
        {isLoading && (
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-3.5">
            {Array.from({ length: 8 }).map((_, idx) => (
              <div
                key={idx}
                className="rounded-xl border border-subtle bg-surface overflow-hidden animate-pulse flex flex-col"
              >
                <div className="aspect-[4/5] bg-elevated" />
                <div className="p-3.5 space-y-2.5 flex-1">
                  <div className="h-4 w-3/4 rounded bg-elevated" />
                  <div className="h-4 w-1/3 rounded bg-elevated" />
                  <div className="flex flex-wrap gap-1.5 pt-2">
                    {[1, 2, 3, 4].map((s) => (
                      <div key={s} className="h-7 w-10 rounded-lg bg-elevated" />
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Error State */}
        {isError && (
          <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-8 flex flex-col items-center justify-center text-center gap-3">
            <WarningCircle size={32} weight="duotone" className="text-red-500" />
            <h4 className="font-heading text-sm font-bold text-red-600 dark:text-red-300">
              Error al sincronizar catálogo
            </h4>
            <p className="text-xs font-sans text-secondary max-w-md">
              {error instanceof Error
                ? error.message
                : 'No se pudo conectar con el servicio de inventario.'}
            </p>
            <button
              type="button"
              onClick={() => refetch()}
              className="mt-1 px-4 py-2 rounded-lg border border-red-500/40 bg-red-500/15 text-red-700 dark:text-red-200 text-xs font-semibold hover:bg-red-500/25 transition-fast cursor-pointer"
            >
              Reintentar conexión
            </button>
          </div>
        )}

        {/* Empty State */}
        {!isLoading && !isError && productosFiltrados.length === 0 && (
          <div className="h-72 flex flex-col items-center justify-center rounded-xl border border-dashed border-subtle bg-surface/50 p-8 text-center">
            <MagnifyingGlass size={32} weight="duotone" className="text-muted mb-2.5" />
            <span className="text-sm font-heading font-bold text-primary block">
              Sin coincidencias en catálogo
            </span>
            <p className="text-xs font-sans text-secondary max-w-sm mt-1">
              No encontramos artículos con los filtros actuales. Prueba limpiar la búsqueda o seleccionar &quot;Todas&quot; las categorías.
            </p>
          </div>
        )}

        {/* Grilla Paginada (12 por página) con animación escalonada (Stagger) */}
        {!isLoading && !isError && productosPaginados.length > 0 && (
          <motion.div
            key={`${categoriaActiva}-${paginaActual}-${filtroUnidad}-${ordenActivo}-${ocultarAgotados}`}
            initial="hidden"
            animate="show"
            variants={{
              hidden: { opacity: 0 },
              show: {
                opacity: 1,
                transition: {
                  staggerChildren: 0.03,
                },
              },
            }}
            className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-3.5 items-stretch"
          >
            {productosPaginados.map((producto) => (
              <motion.div
                key={producto.id}
                className="h-full"
                variants={{
                  hidden: { opacity: 0, y: 10 },
                  show: {
                    opacity: 1,
                    y: 0,
                    transition: { duration: 0.28, ease: 'easeOut' },
                  },
                }}
              >
                <ProductCard
                  producto={producto}
                  onOpenQuickView={(prod) => setQuickViewProducto(prod)}
                />
              </motion.div>
            ))}
          </motion.div>
        )}
      </div>

      {/* 3. Paginador Origin UI (12 productos por página) */}
      {!isLoading && !isError && productosFiltrados.length > PAGE_SIZE && (
        <div className="rounded-xl border border-subtle bg-surface px-4 py-2.5 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-secondary shadow-surface">
          <span>
            Mostrando{' '}
            <strong className="font-mono tabular-nums text-primary">
              {indiceInicio + 1}
            </strong>
            –
            <strong className="font-mono tabular-nums text-primary">
              {Math.min(indiceInicio + PAGE_SIZE, productosFiltrados.length)}
            </strong>{' '}
            de{' '}
            <strong className="font-mono tabular-nums text-primary">
              {productosFiltrados.length}
            </strong>{' '}
            productos
          </span>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => setPaginaActual((p) => Math.max(1, p - 1))}
              disabled={paginaActual <= 1}
              className="px-2.5 py-1.5 rounded-lg border border-subtle bg-elevated hover:bg-surface text-primary disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1 font-medium transition-fast cursor-pointer"
            >
              <CaretLeft size={13} weight="bold" />
              <span>Anterior</span>
            </button>

            <span className="px-3 py-1.5 rounded-lg border border-subtle bg-elevated font-mono tabular-nums font-semibold text-primary">
              {paginaActual} / {totalPaginas}
            </span>

            <button
              type="button"
              onClick={() => setPaginaActual((p) => Math.min(totalPaginas, p + 1))}
              disabled={paginaActual >= totalPaginas}
              className="px-2.5 py-1.5 rounded-lg border border-subtle bg-elevated hover:bg-surface text-primary disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1 font-medium transition-fast cursor-pointer"
            >
              <span>Siguiente</span>
              <CaretRight size={13} weight="bold" />
            </button>
          </div>
        </div>
      )}

      {/* 4. Modal Quick-View con Carrusel de Fotos y Código EAN-13 */}
      <ModalQuickViewPos
        isOpen={Boolean(quickViewProducto)}
        onClose={() => setQuickViewProducto(null)}
        producto={quickViewProducto}
      />
    </div>
  );
};
