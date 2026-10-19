import React, { useState, useMemo, useEffect } from 'react';
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
  X,
} from '@phosphor-icons/react';
import { inventarioApi, type ProductoCatalogoDto } from '../../pos/api/inventarioApi';
import { Button } from '../../../components/ui/Button';
import { ModalCrearProducto } from '../components/ModalCrearProducto';
import { ModalDetalleProducto } from '../components/ModalDetalleProducto';

export const InventarioPage: React.FC = () => {
  const queryClient = useQueryClient();

  const [busqueda, setBusqueda] = useState('');
  const [unidadFiltro, setUnidadFiltro] = useState<'TODAS' | 'DASTIK' | 'HIDDEN'>('TODAS');
  const [categoriaFiltro, setCategoriaFiltro] = useState<string>('TODAS');
  const [stockFiltro, setStockFiltro] = useState<'TODOS' | 'CON_STOCK' | 'SIN_STOCK' | 'BAJO_STOCK'>('TODOS');

  const PAGE_SIZE = 15;
  const [paginaActual, setPaginaActual] = useState(1);

  const [isModalCrearOpen, setIsModalCrearOpen] = useState(false);
  const [isModalDetalleOpen, setIsModalDetalleOpen] = useState(false);
  const [productoSeleccionado, setProductoSeleccionado] = useState<ProductoCatalogoDto | null>(null);
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
      queryClient.invalidateQueries({ queryKey: ['productos'] });
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

  const categoriasDisponibles = useMemo(() => {
    const setCat = new Set<string>();
    productos.forEach((p) => {
      if (p.categoria) setCat.add(p.categoria);
    });
    return Array.from(setCat).sort();
  }, [productos]);

  const productosFiltrados = useMemo(() => {
    return productos.filter((p) => {
      if (unidadFiltro === 'DASTIK') {
        const esDastik = p.unidadNegocio?.toLowerCase().includes('dastik') ?? false;
        if (!esDastik) return false;
      } else if (unidadFiltro === 'HIDDEN') {
        const esHidden = p.unidadNegocio?.toLowerCase().includes('hidden') ?? false;
        if (!esHidden) return false;
      }

      if (categoriaFiltro !== 'TODAS' && p.categoria !== categoriaFiltro) {
        return false;
      }

      const stockTotal = p.variantes?.reduce((acc, v) => acc + (v.stockFisico || 0), 0) ?? 0;
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
  }, [productos, unidadFiltro, categoriaFiltro, stockFiltro, busqueda]);

  useEffect(() => {
    setPaginaActual(1);
  }, [busqueda, unidadFiltro, categoriaFiltro, stockFiltro]);

  const totalPaginas = Math.max(1, Math.ceil(productosFiltrados.length / PAGE_SIZE));
  const indiceInicio = (paginaActual - 1) * PAGE_SIZE;
  const productosPaginados = useMemo(() => {
    return productosFiltrados.slice(indiceInicio, indiceInicio + PAGE_SIZE);
  }, [productosFiltrados, indiceInicio]);

  const totalItemsEnStock = useMemo(() => {
    return productos.reduce((accProd, p) => {
      const stockProd = p.variantes?.reduce((accVar, v) => accVar + (v.stockFisico || 0), 0) ?? 0;
      return accProd + stockProd;
    }, 0);
  }, [productos]);

  const totalSinStock = useMemo(() => {
    return productos.filter((p) => {
      const stock = p.variantes?.reduce((acc, v) => acc + (v.stockFisico || 0), 0) ?? 0;
      return stock === 0;
    }).length;
  }, [productos]);

  const handleVerDetalle = (producto: ProductoCatalogoDto) => {
    setProductoSeleccionado(producto);
    setIsModalDetalleOpen(true);
  };

  const handleCreacionExitosa = () => {
    queryClient.invalidateQueries({ queryKey: ['productos-inventario'] });
    queryClient.invalidateQueries({ queryKey: ['productos'] });
    setMensajeNotificacion({
      tipo: 'exito',
      texto: 'Producto creado exitosamente y sincronizado con el catálogo.',
    });
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
            onClick={() => setIsModalCrearOpen(true)}
          >
            <Plus size={16} weight="bold" />
            <span>Nuevo Producto</span>
          </Button>
        </div>
      </div>

      {/* Tarjetas de Métricas Rápidas */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-xl border border-subtle bg-surface p-4 flex flex-col justify-between shadow-surface">
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
        </div>

        <div className="rounded-xl border border-subtle bg-surface p-4 flex flex-col justify-between shadow-surface">
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
        </div>

        <div className="rounded-xl border border-subtle bg-surface p-4 flex flex-col justify-between shadow-surface">
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
        </div>

        <div className="rounded-xl border border-subtle bg-surface p-4 flex flex-col justify-between shadow-surface">
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
        </div>
      </div>

      {/* Barra de Filtros y Búsqueda */}
      <div className="rounded-xl border border-subtle bg-surface p-4 flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3 shadow-surface">
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
          <div className="flex items-center rounded-lg border border-subtle bg-elevated p-1">
            {(['TODAS', 'DASTIK', 'HIDDEN'] as const).map((u) => (
              <button
                key={u}
                type="button"
                onClick={() => setUnidadFiltro(u)}
                className={`px-3 py-1 text-xs font-sans font-semibold rounded-md transition-fast cursor-pointer ${
                  unidadFiltro === u
                    ? 'bg-surface text-primary shadow-sm'
                    : 'text-secondary hover:text-primary'
                }`}
              >
                {u === 'TODAS' ? 'Todas' : u === 'DASTIK' ? 'Dastik' : 'Hidden'}
              </button>
            ))}
          </div>

          {/* Selector de Categoría */}
          <select
            value={categoriaFiltro}
            onChange={(e) => setCategoriaFiltro(e.target.value)}
            className="bg-elevated border border-subtle rounded-lg px-3 py-2 text-xs font-sans font-medium text-primary focus:outline-none focus:border-amber-500/80 transition-fast cursor-pointer"
          >
            <option value="TODAS">Todas las categorías</option>
            {categoriasDisponibles.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>

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
                </tr>
              </thead>
              <tbody className="divide-y divide-subtle">
                {productosPaginados.map((producto) => {
                  const stockTotal =
                    producto.variantes?.reduce((acc, v) => acc + (v.stockFisico || 0), 0) ?? 0;
                  const sinStock = stockTotal === 0;

                  return (
                    <tr
                      key={producto.id}
                      onClick={() => handleVerDetalle(producto)}
                      className="hover:bg-elevated/50 transition-fast group cursor-pointer"
                      title="Ver detalle del producto y desglose de variantes"
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
                          <div className="w-10 h-10 shrink-0 rounded-lg border border-subtle bg-elevated overflow-hidden flex items-center justify-center relative">
                            {producto.imagenUrl ? (
                              <img
                                src={producto.imagenUrl}
                                alt={producto.nombre}
                                className="w-full h-full object-cover"
                                loading="lazy"
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
                                producto.imagenUrl ? 'hidden img-fallback' : ''
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
                            <span className="text-[11px] text-muted font-sans mt-0.5">
                              Categoría: {producto.categoria}
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
                                className={`text-[11px] font-mono tabular-nums px-2 py-0.5 rounded-md border ${
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
        onClose={() => setIsModalCrearOpen(false)}
        onSuccess={handleCreacionExitosa}
      />

      {/* Slide-Over Drawer de Detalle y Variantes */}
      <ModalDetalleProducto
        isOpen={isModalDetalleOpen}
        onClose={() => {
          setIsModalDetalleOpen(false);
          setProductoSeleccionado(null);
        }}
        producto={productoSeleccionado}
      />
    </div>
  );
};
