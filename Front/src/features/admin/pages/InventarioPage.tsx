import React, { useState, useMemo, useEffect, useRef } from 'react';
import { motion } from 'motion/react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  MagnifyingGlass,
  Plus,
  Funnel,
  Package,
  Barcode,
  TrendUp,
  CloudArrowDown,
  SpinnerGap,
  Image,
  CaretLeft,
  CaretRight,
  CaretUp,
  SquaresFour,
  X,
  SortAscending,
  PencilSimple,
} from '@phosphor-icons/react';
import {
  inventarioApi,
  calcularStockTotalProducto,
  compararProductosMasNuevosConStock,
  ORDEN_CATEGORIAS_OFICIALES,
  normalizarUrlImagenAltaRes,
  type ProductoCatalogoDto,
} from '../../pos/api/inventarioApi';
import { Button } from '../../../components/ui/Button';
import { ModalCrearProducto } from '../components/ModalCrearProducto';
import { ModalDetalleProducto } from '../components/ModalDetalleProducto';

type OrdenInventario =
  | 'NUEVOS_CON_STOCK'
  | 'MENOR_PRECIO'
  | 'MAYOR_PRECIO'
  | 'MAYOR_STOCK';

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.06,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 12 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      type: 'spring' as const,
      stiffness: 400,
      damping: 28,
    },
  },
};

export const InventarioPage: React.FC = () => {
  const queryClient = useQueryClient();

  const [busqueda, setBusqueda] = useState('');
  const [unidadFiltro, setUnidadFiltro] = useState<'TODAS' | 'DASTIK' | 'HIDDEN'>('TODAS');
  const [categoriaFiltro, setCategoriaFiltro] = useState<string>('TODAS');
  const [stockFiltro, setStockFiltro] = useState<'TODOS' | 'CON_STOCK' | 'SIN_STOCK' | 'BAJO_STOCK'>('TODOS');
  const [ordenActivo, setOrdenActivo] = useState<OrdenInventario>('NUEVOS_CON_STOCK');

  const PAGE_SIZE = 15;
  const [paginaActual, setPaginaActual] = useState(1);

  const [isModalCrearOpen, setIsModalCrearOpen] = useState(false);
  const [productoAEditar, setProductoAEditar] = useState<ProductoCatalogoDto | null>(null);
  const [isModalDetalleOpen, setIsModalDetalleOpen] = useState(false);
  const [productoSeleccionado, setProductoSeleccionado] = useState<ProductoCatalogoDto | null>(null);
  const [expandirCategorias, setExpandirCategorias] = useState(false);
  const categoriesRef = useRef<HTMLDivElement>(null);

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

  const [mensajeNotificacion, setMensajeNotificacion] = useState<{
    tipo: 'exito' | 'error';
    texto: string;
  } | null>(null);

  const {
    data: productos = [],
    isLoading,
    isError,
    refetch,
  } = useQuery({
    queryKey: ['productos-inventario'],
    queryFn: inventarioApi.obtenerProductos,
  });

  const sincronizarMutation = useMutation({
    mutationFn: inventarioApi.sincronizarTiendanube,
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['productos-inventario'] });
      queryClient.invalidateQueries({ queryKey: ['catalogo-pos'] });
      queryClient.invalidateQueries({ queryKey: ['productos'] });
      queryClient.invalidateQueries({ queryKey: ['config-categorias'] });
      queryClient.invalidateQueries({ queryKey: ['config-marcas'] });
      setMensajeNotificacion({
        tipo: 'exito',
        texto: `Sincronización completada: ${res.productosNuevos} nuevos, ${res.productosActualizados} actualizados (${res.totalVariantesImportadas} variantes).`,
      });
      setTimeout(() => setMensajeNotificacion(null), 7000);
    },
    onError: (err: any) => {
      const errorMsg =
        err?.response?.data?.error ||
        err?.message ||
        'Error desconocido al sincronizar con Tiendanube.';
      setMensajeNotificacion({
        tipo: 'error',
        texto: `Error de sincronización: ${errorMsg}`,
      });
      setTimeout(() => setMensajeNotificacion(null), 8000);
    },
  });

  // Base de productos filtrados por unidad para calcular conteos reales de cada categoría
  const productosPorUnidad = useMemo(() => {
    return productos.filter((p) => {
      if (unidadFiltro === 'DASTIK') {
        return p.unidadNegocio?.toLowerCase().includes('dastik') ?? false;
      }
      if (unidadFiltro === 'HIDDEN') {
        return p.unidadNegocio?.toLowerCase().includes('hidden') ?? false;
      }
      return true;
    });
  }, [productos, unidadFiltro]);

  const categoriasConConteo = useMemo(() => {
    const mapa = new Map<string, number>();
    for (const p of productosPorUnidad) {
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
  }, [productosPorUnidad]);

  const productosFiltrados = useMemo(() => {
    const filtrados = productosPorUnidad.filter((p) => {
      if (categoriaFiltro !== 'TODAS' && p.categoria !== categoriaFiltro) {
        return false;
      }

      const stockTotal = calcularStockTotalProducto(p);
      if (stockFiltro === 'CON_STOCK' && stockTotal <= 0) return false;
      if (stockFiltro === 'SIN_STOCK' && stockTotal > 0) return false;
      if (stockFiltro === 'BAJO_STOCK' && (stockTotal <= 0 || stockTotal > 5)) return false;

      if (busqueda.trim() !== '') {
        const query = busqueda.toLowerCase().trim();
        const matchNombre = p.nombre.toLowerCase().includes(query);
        const matchMarca = p.marca.toLowerCase().includes(query);
        const matchCategoria = p.categoria.toLowerCase().includes(query);
        const matchBarcode = p.variantes?.some((v) =>
          v.codigoBarras?.toLowerCase().includes(query)
        );

        return matchNombre || matchMarca || matchCategoria || matchBarcode;
      }

      return true;
    });

    return [...filtrados].sort((a, b) => {
      const stockA = calcularStockTotalProducto(a);
      const stockB = calcularStockTotalProducto(b);

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
  }, [productosPorUnidad, categoriaFiltro, stockFiltro, busqueda, ordenActivo]);

  useEffect(() => {
    setPaginaActual(1);
  }, [busqueda, unidadFiltro, categoriaFiltro, stockFiltro, ordenActivo]);

  const totalPaginas = Math.max(1, Math.ceil(productosFiltrados.length / PAGE_SIZE));
  const indiceInicio = (paginaActual - 1) * PAGE_SIZE;
  const productosPaginados = useMemo(() => {
    return productosFiltrados.slice(indiceInicio, indiceInicio + PAGE_SIZE);
  }, [productosFiltrados, indiceInicio]);

  const totalItemsEnStock = useMemo(() => {
    return productos.reduce((accProd, p) => {
      return accProd + calcularStockTotalProducto(p);
    }, 0);
  }, [productos]);

  const totalSinStock = useMemo(() => {
    return productos.filter((p) => calcularStockTotalProducto(p) === 0).length;
  }, [productos]);

  const handleVerDetalle = (producto: ProductoCatalogoDto) => {
    setProductoSeleccionado(producto);
    setIsModalDetalleOpen(true);
  };

  const handleEditarProducto = (producto: ProductoCatalogoDto) => {
    setProductoAEditar(producto);
    setIsModalCrearOpen(true);
  };

  const handleNuevoProducto = () => {
    setProductoAEditar(null);
    setIsModalCrearOpen(true);
  };

  const handleCreacionExitosa = () => {
    queryClient.invalidateQueries({ queryKey: ['productos-inventario'] });
    queryClient.invalidateQueries({ queryKey: ['catalogo-pos'] });
    queryClient.invalidateQueries({ queryKey: ['productos'] });
    setMensajeNotificacion({
      tipo: 'exito',
      texto: productoAEditar
        ? 'Producto actualizado exitosamente y sincronizado con el catálogo.'
        : 'Producto creado exitosamente y sincronizado con el catálogo.',
    });
    setIsModalCrearOpen(false);
    setProductoAEditar(null);
    setTimeout(() => setMensajeNotificacion(null), 5000);
  };

  return (
    <div className="p-6 md:p-8 space-y-6 max-w-[1600px] mx-auto w-full">
      {/* Banner de Notificaciones */}
      {mensajeNotificacion && (
        <div
          className={`rounded-xl border px-4 py-3 text-xs font-sans flex items-center justify-between ${
            mensajeNotificacion.tipo === 'exito'
              ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300'
              : 'border-red-500/30 bg-red-500/10 text-red-700 dark:text-red-300'
          }`}
        >
          <span className="font-medium">{mensajeNotificacion.texto}</span>
          <button
            onClick={() => setMensajeNotificacion(null)}
            className="text-muted hover:text-primary ml-4 p-1 cursor-pointer"
          >
            <X size={15} />
          </button>
        </div>
      )}

      {/* Header del Inventario & Acciones Principales */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-5 border-b border-subtle">
        <div>
          <span className="text-xs font-medium text-amber-500 block">
            Gestión de Stock Central
          </span>
          <h1 className="font-heading font-extrabold text-2xl md:text-3xl text-primary tracking-tight">
            Inventario de Productos
          </h1>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <Button
            variant="secondary"
            size="md"
            onClick={() => sincronizarMutation.mutate()}
            disabled={sincronizarMutation.isPending}
          >
            {sincronizarMutation.isPending ? (
              <>
                <SpinnerGap size={16} weight="bold" className="animate-spin text-amber-500" />
                <span className="text-amber-500">Sincronizando Catálogo...</span>
              </>
            ) : (
              <>
                <CloudArrowDown size={16} weight="duotone" className="text-amber-500" />
                <span>Sincronizar Tiendanube</span>
              </>
            )}
          </Button>

          <Button
            variant="primary"
            size="md"
            onClick={handleNuevoProducto}
          >
            <Plus size={16} weight="bold" />
            <span>Nuevo Producto</span>
          </Button>
        </div>
      </div>

      {/* Tarjetas de Métricas Rápidas */}
      <motion.div variants={containerVariants} initial="hidden" animate="visible" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <motion.div variants={itemVariants} className="rounded-xl border border-subtle bg-surface p-4 flex flex-col justify-between shadow-surface">
          <span className="text-xs font-medium text-secondary flex items-center gap-1.5">
            <Package size={16} weight="duotone" className="text-amber-500" />
            Total Artículos
          </span>
          <div className="mt-3 flex items-baseline justify-between">
            <span className="font-mono tabular-nums font-bold text-2xl text-primary">
              {productos.length}
            </span>
            <span className="text-[11px] font-medium text-muted">SKUs Padre</span>
          </div>
        </motion.div>

        <motion.div variants={itemVariants} className="rounded-xl border border-subtle bg-surface p-4 flex flex-col justify-between shadow-surface">
          <span className="text-xs font-medium text-secondary flex items-center gap-1.5">
            <Barcode size={16} weight="duotone" className="text-emerald-500" />
            Unidades en Stock
          </span>
          <div className="mt-3 flex items-baseline justify-between">
            <span className="font-mono tabular-nums font-bold text-2xl text-primary">
              {totalItemsEnStock}
            </span>
            <span className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
              Físico Real
            </span>
          </div>
        </motion.div>

        <motion.div variants={itemVariants} className="rounded-xl border border-subtle bg-surface p-4 flex flex-col justify-between shadow-surface">
          <span className="text-xs font-medium text-secondary flex items-center gap-1.5">
            <TrendUp size={16} weight="duotone" className="text-red-500" />
            Sin Stock Físico
          </span>
          <div className="mt-3 flex items-baseline justify-between">
            <span className="font-mono tabular-nums font-bold text-2xl text-red-500">
              {totalSinStock}
            </span>
            <span className="text-[11px] font-medium text-red-500/80">Quiebre Stock</span>
          </div>
        </motion.div>

        <motion.div variants={itemVariants} className="rounded-xl border border-subtle bg-surface p-4 flex flex-col justify-between shadow-surface">
          <span className="text-xs font-medium text-secondary flex items-center gap-1.5">
            <Funnel size={16} weight="duotone" className="text-amber-500" />
            Resultados Filtro
          </span>
          <div className="mt-3 flex items-baseline justify-between">
            <span className="font-mono tabular-nums font-bold text-2xl text-amber-500">
              {productosFiltrados.length}
            </span>
            <span className="text-[11px] font-medium text-muted">Visibles</span>
          </div>
        </motion.div>
      </motion.div>

      {/* Barra de Filtros, Ordenamiento y Pills de Categorías */}
      <div className="rounded-xl border border-subtle bg-surface p-4 flex flex-col gap-3 shadow-surface">
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
          {/* Buscador */}
          <div className="relative flex-1">
            <MagnifyingGlass
              size={17}
              weight="regular"
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted"
            />
            <input
              type="text"
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              placeholder="Buscar por nombre, marca, categoría o código de barras EAN..."
              className="w-full bg-elevated focus:bg-surface border border-subtle focus:border-amber-500/80 focus:ring-2 focus:ring-amber-500/20 rounded-lg pl-10 pr-4 py-2 text-xs md:text-sm font-sans text-primary placeholder:text-muted outline-none transition-fast"
            />
          </div>

          {/* Filtros Selectores */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Segmented Control de Unidad */}
            <div className="flex items-center rounded-lg border border-subtle bg-elevated p-1 relative">
              {(['TODAS', 'DASTIK', 'HIDDEN'] as const).map((u) => {
                const activo = unidadFiltro === u;
                return (
                  <button
                    key={u}
                    type="button"
                    onClick={() => setUnidadFiltro(u)}
                    className={`relative px-3 py-1 text-xs font-sans font-semibold rounded-md transition-colors cursor-pointer ${
                      activo
                        ? 'text-primary'
                        : 'text-secondary hover:text-primary'
                    }`}
                  >
                    {activo && (
                      <motion.div
                        layoutId="inventario-unidad-pill"
                        className="absolute inset-0 bg-surface rounded-md shadow-xs border border-subtle"
                        transition={{ type: 'spring', stiffness: 500, damping: 35 }}
                      />
                    )}
                    <span className="relative z-10">
                      {u === 'TODAS' ? 'Todas' : u === 'DASTIK' ? 'Dastik' : 'Hidden'}
                    </span>
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
                onChange={(e) => setOrdenActivo(e.target.value as OrdenInventario)}
                className="bg-elevated border border-subtle rounded-lg pl-8 pr-3 py-2 text-xs font-sans font-medium text-primary focus:outline-none focus:border-amber-500/80 transition-fast cursor-pointer"
              >
                <option value="NUEVOS_CON_STOCK">Más nuevos (Con stock)</option>
                <option value="MENOR_PRECIO">Menor precio</option>
                <option value="MAYOR_PRECIO">Mayor precio</option>
                <option value="MAYOR_STOCK">Mayor stock</option>
              </select>
            </div>

            {/* Selector de Stock */}
            <select
              value={stockFiltro}
              onChange={(e) => setStockFiltro(e.target.value as any)}
              className="bg-elevated border border-subtle rounded-lg px-3 py-2 text-xs font-sans font-medium text-primary focus:outline-none focus:border-amber-500/80 transition-fast cursor-pointer"
            >
              <option value="TODOS">Todos los niveles</option>
              <option value="CON_STOCK">Disponibles (&gt; 0)</option>
              <option value="BAJO_STOCK">Stock bajo (1 a 5)</option>
              <option value="SIN_STOCK">Quiebre (= 0)</option>
            </select>
          </div>
        </div>

        {/* Barra de Categorías con Navegación y Scroll Horizontal */}
        {categoriasConConteo.length > 0 && (
          <div className="pt-2.5 border-t border-subtle flex flex-col gap-1.5">
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
                    onClick={() => setCategoriaFiltro('TODAS')}
                    className={`px-3 py-1.5 rounded-lg border text-xs font-sans font-semibold whitespace-nowrap transition-fast cursor-pointer flex items-center gap-1.5 shrink-0 ${
                      categoriaFiltro === 'TODAS'
                        ? 'border-amber-500/60 bg-amber-500/15 text-amber-600 dark:text-amber-400 shadow-xs'
                        : 'border-subtle bg-elevated/70 hover:bg-elevated text-secondary hover:text-primary'
                    }`}
                  >
                    <span>Todas</span>
                    <span className="font-mono text-[10px] opacity-80">
                      ({productosPorUnidad.length})
                    </span>
                  </button>

                  {categoriasConConteo.map((cat) => {
                    const activa = categoriaFiltro === cat.nombre;
                    return (
                      <button
                        key={cat.nombre}
                        type="button"
                        onClick={() =>
                          setCategoriaFiltro((prev) =>
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
                    onClick={() => setCategoriaFiltro('TODAS')}
                    className={`px-3 py-1.5 rounded-lg border text-xs font-sans font-semibold whitespace-nowrap transition-fast cursor-pointer flex items-center gap-1.5 shrink-0 ${
                      categoriaFiltro === 'TODAS'
                        ? 'border-amber-500/60 bg-amber-500/15 text-amber-600 dark:text-amber-400 shadow-xs'
                        : 'border-subtle bg-elevated/70 hover:bg-elevated text-secondary hover:text-primary'
                    }`}
                  >
                    <span>Todas</span>
                    <span className="font-mono text-[10px] opacity-80">
                      ({productosPorUnidad.length})
                    </span>
                  </button>

                  {categoriasConConteo.map((cat) => {
                    const activa = categoriaFiltro === cat.nombre;
                    return (
                      <button
                        key={cat.nombre}
                        type="button"
                        onClick={() =>
                          setCategoriaFiltro((prev) =>
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
      </div>

      {/* Tabla Data Grid de Inventario */}
      <div className="rounded-xl border border-subtle bg-surface overflow-hidden shadow-surface">
        {isLoading ? (
          <div className="p-12 text-center flex flex-col items-center justify-center gap-3">
            <SpinnerGap size={32} weight="bold" className="animate-spin text-amber-500" />
            <span className="font-sans text-xs font-medium text-muted">
              Cargando catálogo central...
            </span>
          </div>
        ) : isError ? (
          <div className="p-12 text-center flex flex-col items-center justify-center gap-3 text-red-500">
            <span className="font-sans text-xs font-semibold">
              Falló la conexión con el servidor de inventario
            </span>
            <Button variant="secondary" size="sm" onClick={() => refetch()}>
              Reintentar
            </Button>
          </div>
        ) : productosFiltrados.length === 0 ? (
          <div className="p-12 text-center flex flex-col items-center justify-center gap-2">
            <Package size={36} weight="duotone" className="text-muted" />
            <span className="font-sans text-xs font-medium text-secondary">
              No se encontraron productos con los filtros actuales
            </span>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-subtle bg-elevated/60 text-[11px] font-semibold uppercase tracking-wider text-secondary">
                  <th className="py-3.5 px-4 w-36">Marca / Unidad</th>
                  <th className="py-3.5 px-4 min-w-[260px]">Producto</th>
                  <th className="py-3.5 px-4 text-right w-32">Precio Venta</th>
                  <th className="py-3.5 px-4 w-72">Variantes (Talle / Stock)</th>
                  <th className="py-3.5 px-4 text-right w-32">Stock Total</th>
                  <th className="py-3.5 px-4 text-center w-20">Acción</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-subtle">
                {productosPaginados.map((producto) => {
                  const stockTotal = calcularStockTotalProducto(producto);
                  const sinStock = stockTotal === 0;
                  const thumbUrl = normalizarUrlImagenAltaRes(
                    (producto.imagenes && producto.imagenes[0]) || producto.imagenUrl
                  );

                  return (
                    <tr
                      key={producto.id}
                      onClick={() => handleVerDetalle(producto)}
                      className="hover:bg-elevated/50 transition-fast group cursor-pointer"
                      title="Ver detalle del producto, galería de fotos y desglose de variantes"
                    >
                      {/* Columna 1: Marca */}
                      <td className="py-3.5 px-4 font-heading font-bold text-primary text-xs align-top">
                        <div className="flex flex-col gap-1.5">
                          <span>{producto.marca}</span>
                          <span
                            className={`inline-block w-fit text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-md border ${
                              producto.unidadNegocio?.toLowerCase().includes('hidden')
                                ? 'border-amber-500/30 bg-amber-500/10 text-amber-600 dark:text-amber-400'
                                : 'border-subtle bg-elevated text-secondary'
                            }`}
                          >
                            {producto.unidadNegocio}
                          </span>
                        </div>
                      </td>

                      {/* Columna 2: Producto */}
                      <td className="py-3.5 px-4 align-top">
                        <div className="flex items-start gap-3">
                          <div className="w-11 h-14 shrink-0 rounded-lg border border-subtle bg-elevated overflow-hidden flex items-center justify-center relative">
                            {thumbUrl ? (
                              <img
                                src={thumbUrl}
                                alt={producto.nombre}
                                className="w-full h-full object-cover"
                                loading="lazy"
                                decoding="async"
                                onError={(e) => {
                                  e.currentTarget.style.display = 'none';
                                  const fallback =
                                    e.currentTarget.parentElement?.querySelector('.img-fallback');
                                  if (fallback) fallback.classList.remove('hidden');
                                }}
                              />
                            ) : null}
                            <div
                              className={`w-full h-full flex items-center justify-center text-muted bg-elevated ${
                                thumbUrl ? 'hidden img-fallback' : ''
                              }`}
                              title="Sin imagen"
                            >
                              <Image size={18} weight="regular" />
                            </div>
                          </div>

                          <div className="flex flex-col gap-0.5 min-w-0">
                            <span className="font-heading font-bold text-primary text-sm group-hover:text-amber-500 transition-fast truncate">
                              {producto.nombre}
                            </span>
                            {producto.descripcion && (
                              <span className="text-xs text-secondary line-clamp-1 font-sans">
                                {producto.descripcion}
                              </span>
                            )}
                            <span className="text-[11px] text-amber-600 dark:text-amber-400 font-sans font-medium mt-0.5">
                              {producto.categoria}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Columna 3: Precio */}
                      <td className="py-3.5 px-4 text-right font-mono tabular-nums font-bold text-primary text-sm align-top whitespace-nowrap">
                        $ {producto.precioVenta.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                      </td>

                      {/* Columna 4: Variantes */}
                      <td className="py-3.5 px-4 align-top">
                        <div className="flex flex-col gap-1.5">
                          <span className="text-[11px] font-medium text-secondary">
                            {producto.variantes?.length || 0}{' '}
                            {producto.variantes?.length === 1 ? 'variante' : 'variantes'}
                          </span>
                          <div className="flex flex-wrap gap-1 max-w-xs">
                            {producto.variantes?.map((v) => (
                              <span
                                key={v.id}
                                className={`text-[11px] font-mono tabular-nums px-2 py-0.5 rounded-md border whitespace-nowrap ${
                                  v.stockFisico === 0
                                    ? 'border-red-500/30 bg-red-500/10 text-red-500 line-through'
                                    : 'border-subtle bg-elevated text-primary font-medium'
                                }`}
                                title={`Talle: ${v.talle} | Color: ${v.color} | Stock: ${v.stockFisico} | EAN: ${v.codigoBarras}`}
                              >
                                {v.talle} ({v.stockFisico})
                              </span>
                            ))}
                          </div>
                        </div>
                      </td>

                      {/* Columna 5: Stock Total */}
                      <td className="py-3.5 px-4 text-right align-top whitespace-nowrap">
                        <div className="flex flex-col items-end gap-1">
                          <span
                            className={`text-sm font-mono tabular-nums font-bold ${
                              sinStock
                                ? 'text-red-500'
                                : stockTotal <= 5
                                ? 'text-amber-500'
                                : 'text-primary'
                            }`}
                          >
                            {stockTotal} u.
                          </span>
                          <span
                            className={`text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-md border ${
                              sinStock
                                ? 'border-red-500/30 bg-red-500/10 text-red-600 dark:text-red-400'
                                : stockTotal <= 5
                                ? 'border-amber-500/30 bg-amber-500/10 text-amber-600 dark:text-amber-400'
                                : 'border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                            }`}
                          >
                            {sinStock ? 'Sin Stock' : stockTotal <= 5 ? 'Stock Bajo' : 'Disponible'}
                          </span>
                        </div>
                      </td>

                      {/* Columna 6: Acciones */}
                      <td
                        className="py-3.5 px-4 text-center align-middle whitespace-nowrap"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <button
                          type="button"
                          onClick={() => handleEditarProducto(producto)}
                          className="inline-flex items-center justify-center p-2 rounded-lg border border-subtle bg-elevated/80 hover:bg-amber-500/10 hover:border-amber-500/40 text-secondary hover:text-amber-500 transition-fast cursor-pointer"
                          title="Editar producto y variantes"
                        >
                          <PencilSimple size={15} weight="bold" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Footer de la Tabla con Paginación */}
        {!isLoading && !isError && productosFiltrados.length > 0 && (
          <div className="p-3.5 bg-elevated/40 border-t border-subtle flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-secondary font-sans">
            <div className="flex items-center gap-2">
              <span>
                Mostrando{' '}
                <strong className="font-mono tabular-nums text-primary">{indiceInicio + 1}</strong> –{' '}
                <strong className="font-mono tabular-nums text-primary">
                  {Math.min(indiceInicio + PAGE_SIZE, productosFiltrados.length)}
                </strong>{' '}
                de{' '}
                <strong className="font-mono tabular-nums text-primary">
                  {productosFiltrados.length}
                </strong>{' '}
                productos
              </span>
              {productosFiltrados.length !== productos.length && (
                <span className="text-muted">(Total catálogo: {productos.length})</span>
              )}
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setPaginaActual((p) => Math.max(p - 1, 1))}
                disabled={paginaActual <= 1}
                title="Página Anterior"
              >
                <CaretLeft size={13} weight="bold" />
                <span>Anterior</span>
              </Button>

              <span className="px-3 py-1.5 rounded-lg border border-subtle bg-surface text-primary text-xs font-mono tabular-nums font-semibold">
                Pág. {paginaActual} / {totalPaginas}
              </span>

              <Button
                variant="secondary"
                size="sm"
                onClick={() => setPaginaActual((p) => Math.min(p + 1, totalPaginas))}
                disabled={paginaActual >= totalPaginas}
                title="Página Siguiente"
              >
                <span>Siguiente</span>
                <CaretRight size={13} weight="bold" />
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Modal de Alta de Nuevo Producto y Variantes */}
      <ModalCrearProducto
        isOpen={isModalCrearOpen}
        onClose={() => {
          setIsModalCrearOpen(false);
          setProductoAEditar(null);
        }}
        onSuccess={handleCreacionExitosa}
        productoAEditar={productoAEditar}
      />

      {/* Slide-Over Drawer de Detalle y Variantes */}
      <ModalDetalleProducto
        isOpen={isModalDetalleOpen}
        onClose={() => {
          setIsModalDetalleOpen(false);
          setProductoSeleccionado(null);
        }}
        producto={productoSeleccionado}
        onEditar={(p) => {
          setIsModalDetalleOpen(false);
          handleEditarProducto(p);
        }}
      />
    </div>
  );
};
