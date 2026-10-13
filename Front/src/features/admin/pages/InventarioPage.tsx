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
} from '@phosphor-icons/react';
import { inventarioApi, type ProductoCatalogoDto } from '../../pos/api/inventarioApi';
import { Button } from '../../../components/ui/Button';
import { ModalCrearProducto } from '../components/ModalCrearProducto';
import { ModalDetalleProducto } from '../components/ModalDetalleProducto';

export const InventarioPage: React.FC = () => {
  const queryClient = useQueryClient();

  // Estados de Filtros y Búsqueda
  const [busqueda, setBusqueda] = useState('');
  const [unidadFiltro, setUnidadFiltro] = useState<'TODAS' | 'DASTIK' | 'HIDDEN'>('TODAS');
  const [categoriaFiltro, setCategoriaFiltro] = useState<string>('TODAS');
  const [stockFiltro, setStockFiltro] = useState<'TODOS' | 'CON_STOCK' | 'SIN_STOCK' | 'BAJO_STOCK'>('TODOS');

  // Paginación Local Client-Side
  const PAGE_SIZE = 15;
  const [paginaActual, setPaginaActual] = useState(1);

  // Estados de Modales y Notificación
  const [isModalCrearOpen, setIsModalCrearOpen] = useState(false);
  const [isModalDetalleOpen, setIsModalDetalleOpen] = useState(false);
  const [productoSeleccionado, setProductoSeleccionado] = useState<ProductoCatalogoDto | null>(null);
  const [mensajeNotificacion, setMensajeNotificacion] = useState<{
    tipo: 'exito' | 'error';
    texto: string;
  } | null>(null);

  // Consulta de Catálogo Centralizado
  const {
    data: productos = [],
    isLoading,
    isError,
    refetch,
  } = useQuery({
    queryKey: ['productos-inventario'],
    queryFn: inventarioApi.obtenerProductos,
  });

  // Mutación para sincronizar catálogo desde Tiendanube
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

  // Lista única de Categorías para el filtro
  const categoriasDisponibles = useMemo(() => {
    const setCat = new Set<string>();
    productos.forEach((p) => {
      if (p.categoria) setCat.add(p.categoria);
    });
    return Array.from(setCat).sort();
  }, [productos]);

  // Filtrado reactivo en memoria
  const productosFiltrados = useMemo(() => {
    return productos.filter((p) => {
      // 1. Filtro por Unidad de Negocio
      if (unidadFiltro === 'DASTIK') {
        const esDastik = p.unidadNegocio?.toLowerCase().includes('dastik') ?? false;
        if (!esDastik) return false;
      } else if (unidadFiltro === 'HIDDEN') {
        const esHidden = p.unidadNegocio?.toLowerCase().includes('hidden') ?? false;
        if (!esHidden) return false;
      }

      // 2. Filtro por Categoría
      if (categoriaFiltro !== 'TODAS' && p.categoria !== categoriaFiltro) {
        return false;
      }

      // 3. Filtro por Estado de Stock
      const stockTotal = p.variantes?.reduce((acc, v) => acc + (v.stockFisico || 0), 0) ?? 0;
      if (stockFiltro === 'CON_STOCK' && stockTotal <= 0) return false;
      if (stockFiltro === 'SIN_STOCK' && stockTotal > 0) return false;
      if (stockFiltro === 'BAJO_STOCK' && (stockTotal <= 0 || stockTotal > 5)) return false;

      // 4. Búsqueda por Texto
      if (busqueda.trim() !== '') {
        const query = busqueda.toLowerCase().trim();
        const matchNombre = p.nombre.toLowerCase().includes(query);
        const matchMarca = p.marca.toLowerCase().includes(query);
        const matchCategoria = p.categoria.toLowerCase().includes(query);
        const matchBarcode = p.variantes?.some((v) =>
          v.codigoBarras?.toLowerCase().includes(query)
        );

        if (!matchNombre && !matchMarca && !matchCategoria && !matchBarcode) {
          return false;
        }
      }

      return true;
    });
  }, [productos, unidadFiltro, categoriaFiltro, stockFiltro, busqueda]);

  // Reset de página al cambiar cualquier filtro de búsqueda
  useEffect(() => {
    setPaginaActual(1);
  }, [busqueda, unidadFiltro, categoriaFiltro, stockFiltro]);

  // Cálculo de Paginación Local
  const totalPaginas = Math.ceil(productosFiltrados.length / PAGE_SIZE) || 1;

  useEffect(() => {
    if (paginaActual > totalPaginas) {
      setPaginaActual(Math.max(1, totalPaginas));
    }
  }, [paginaActual, totalPaginas]);

  const indiceInicio = (paginaActual - 1) * PAGE_SIZE;
  const productosPaginados = useMemo(() => {
    return productosFiltrados.slice(indiceInicio, indiceInicio + PAGE_SIZE);
  }, [productosFiltrados, indiceInicio, PAGE_SIZE]);

  // Cálculos de Resumen
  const totalItemsEnStock = useMemo(() => {
    return productos.reduce((acc, p) => {
      const sumVar = p.variantes?.reduce((vAcc, v) => vAcc + (v.stockFisico || 0), 0) ?? 0;
      return acc + sumVar;
    }, 0);
  }, [productos]);

  const totalSinStock = useMemo(() => {
    return productos.filter((p) => {
      const sumVar = p.variantes?.reduce((vAcc, v) => vAcc + (v.stockFisico || 0), 0) ?? 0;
      return sumVar === 0;
    }).length;
  }, [productos]);

  const handleCreacionExitosa = () => {
    queryClient.invalidateQueries({ queryKey: ['productos-inventario'] });
    queryClient.invalidateQueries({ queryKey: ['productos'] });
  };

  const handleVerDetalle = (producto: ProductoCatalogoDto) => {
    setProductoSeleccionado(producto);
    setIsModalDetalleOpen(true);
  };

  return (
    <div className="space-y-6">
      {/* Notificación de Sincronización o Acción */}
      {mensajeNotificacion && (
        <div
          className={`p-4 border text-xs font-mono uppercase tracking-wider flex items-center justify-between transition-all ${
            mensajeNotificacion.tipo === 'exito'
              ? 'border-green-800 bg-green-950/40 text-green-300'
              : 'border-red-800 bg-red-950/40 text-red-300'
          }`}
        >
          <span>{mensajeNotificacion.texto}</span>
          <button
            onClick={() => setMensajeNotificacion(null)}
            className="text-[#A1A1AA] hover:text-white ml-4 font-bold"
          >
            ✕
          </button>
        </div>
      )}

      {/* Header del Inventario & Acciones Principales */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-4 border-b border-[#222222]">
        <div>
          <span className="text-[10px] font-mono uppercase tracking-[0.2em] text-[#71717A]">
            GESTIÓN DE STOCK CENTRAL
          </span>
          <h1 className="font-heading font-extrabold text-2xl md:text-3xl text-[#FAFAFA] tracking-tight uppercase">
            INVENTARIO DE PRODUCTOS
          </h1>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Botón Sincronizar Tiendanube */}
          <Button
            variant="secondary"
            size="md"
            onClick={() => sincronizarMutation.mutate()}
            disabled={sincronizarMutation.isPending}
            className="border-[#333333] hover:border-[#555555] text-xs font-heading font-semibold tracking-wider flex items-center gap-2"
          >
            {sincronizarMutation.isPending ? (
              <>
                <SpinnerGap size={16} weight="light" className="animate-spin text-amber-400" />
                <span className="text-amber-400">SINCRONIZANDO CATÁLOGO COMPLETO...</span>
              </>
            ) : (
              <>
                <CloudArrowDown size={16} weight="light" className="text-amber-400" />
                <span>SINCRONIZAR NUBE</span>
              </>
            )}
          </Button>

          {/* Botón Nuevo Producto */}
          <Button
            variant="primary"
            size="md"
            onClick={() => setIsModalCrearOpen(true)}
            className="text-xs font-heading font-bold tracking-wider flex items-center gap-2"
          >
            <Plus size={16} weight="bold" />
            <span>NUEVO PRODUCTO</span>
          </Button>
        </div>
      </div>

      {/* Tarjetas de Métricas Rápidas Avant-Garde */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="border border-[#222222] bg-[#0C0C0C] p-4 flex flex-col justify-between">
          <span className="text-[10px] font-mono uppercase tracking-widest text-[#71717A] flex items-center gap-1.5">
            <Package size={14} weight="light" />
            TOTAL ARTÍCULOS
          </span>
          <div className="mt-3 flex items-baseline justify-between">
            <span className="font-heading font-bold text-2xl text-[#FAFAFA]">
              {productos.length}
            </span>
            <span className="text-[10px] font-mono text-[#71717A]">SKUs PADRE</span>
          </div>
        </div>

        <div className="border border-[#222222] bg-[#0C0C0C] p-4 flex flex-col justify-between">
          <span className="text-[10px] font-mono uppercase tracking-widest text-[#71717A] flex items-center gap-1.5">
            <Barcode size={14} weight="light" />
            UNIDADES EN STOCK
          </span>
          <div className="mt-3 flex items-baseline justify-between">
            <span className="font-heading font-bold text-2xl text-[#FAFAFA]">
              {totalItemsEnStock}
            </span>
            <span className="text-[10px] font-mono text-green-400">FÍSICO REAL</span>
          </div>
        </div>

        <div className="border border-[#222222] bg-[#0C0C0C] p-4 flex flex-col justify-between">
          <span className="text-[10px] font-mono uppercase tracking-widest text-[#71717A] flex items-center gap-1.5">
            <TrendUp size={14} weight="light" />
            SIN STOCK FÍSICO
          </span>
          <div className="mt-3 flex items-baseline justify-between">
            <span className="font-heading font-bold text-2xl text-red-400">
              {totalSinStock}
            </span>
            <span className="text-[10px] font-mono text-red-500/80">QUIEBRE STOCK</span>
          </div>
        </div>

        <div className="border border-[#222222] bg-[#0C0C0C] p-4 flex flex-col justify-between">
          <span className="text-[10px] font-mono uppercase tracking-widest text-[#71717A] flex items-center gap-1.5">
            <Funnel size={14} weight="light" />
            RESULTADOS FILTRO
          </span>
          <div className="mt-3 flex items-baseline justify-between">
            <span className="font-heading font-bold text-2xl text-amber-400">
              {productosFiltrados.length}
            </span>
            <span className="text-[10px] font-mono text-[#71717A]">VISIBLES</span>
          </div>
        </div>
      </div>

      {/* Barra de Filtros y Búsqueda */}
      <div className="border border-[#222222] bg-[#0A0A0A] p-4 flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
        {/* Buscador */}
        <div className="relative flex-1">
          <MagnifyingGlass
            size={18}
            weight="light"
            className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#71717A]"
          />
          <input
            type="text"
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            placeholder="BUSCAR POR NOMBRE, MARCA, CATEGORÍA O CÓDIGO DE BARRAS..."
            className="w-full bg-[#111111] border border-[#2B2B2B] pl-10 pr-4 py-2 text-xs font-mono text-[#FAFAFA] placeholder:text-[#555555] focus:outline-none focus:border-[#FAFAFA] transition-fast uppercase"
          />
        </div>

        {/* Filtros Selectores */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Selector de Unidad */}
          <div className="flex items-center border border-[#2B2B2B] bg-[#111111] p-0.5">
            <button
              onClick={() => setUnidadFiltro('TODAS')}
              className={`px-2.5 py-1 text-[10px] font-mono uppercase tracking-wider transition-fast ${
                unidadFiltro === 'TODAS'
                  ? 'bg-[#222222] text-[#FAFAFA] font-bold'
                  : 'text-[#71717A] hover:text-[#D4D4D8]'
              }`}
            >
              TODAS
            </button>
            <button
              onClick={() => setUnidadFiltro('DASTIK')}
              className={`px-2.5 py-1 text-[10px] font-mono uppercase tracking-wider transition-fast ${
                unidadFiltro === 'DASTIK'
                  ? 'bg-[#222222] text-[#FAFAFA] font-bold'
                  : 'text-[#71717A] hover:text-[#D4D4D8]'
              }`}
            >
              DASTIK
            </button>
            <button
              onClick={() => setUnidadFiltro('HIDDEN')}
              className={`px-2.5 py-1 text-[10px] font-mono uppercase tracking-wider transition-fast ${
                unidadFiltro === 'HIDDEN'
                  ? 'bg-amber-950/60 text-amber-300 font-bold border border-amber-900/40'
                  : 'text-[#71717A] hover:text-[#D4D4D8]'
              }`}
            >
              HIDDEN
            </button>
          </div>

          {/* Selector de Categoría */}
          <select
            value={categoriaFiltro}
            onChange={(e) => setCategoriaFiltro(e.target.value)}
            className="bg-[#111111] border border-[#2B2B2B] px-3 py-1.5 text-[11px] font-mono text-[#FAFAFA] focus:outline-none focus:border-[#FAFAFA] transition-fast uppercase cursor-pointer"
          >
            <option value="TODAS">TODAS LAS CATEGORÍAS</option>
            {categoriasDisponibles.map((cat) => (
              <option key={cat} value={cat}>
                {cat.toUpperCase()}
              </option>
            ))}
          </select>

          {/* Selector de Stock */}
          <select
            value={stockFiltro}
            onChange={(e) => setStockFiltro(e.target.value as any)}
            className="bg-[#111111] border border-[#2B2B2B] px-3 py-1.5 text-[11px] font-mono text-[#FAFAFA] focus:outline-none focus:border-[#FAFAFA] transition-fast uppercase cursor-pointer"
          >
            <option value="TODOS">TODOS LOS NIVELES</option>
            <option value="CON_STOCK">DISPONIBLES (STOCK &gt; 0)</option>
            <option value="BAJO_STOCK">STOCK BAJO (1 A 5)</option>
            <option value="SIN_STOCK">QUIEBRE (STOCK = 0)</option>
          </select>
        </div>
      </div>

      {/* Tabla Data Grid de Inventario */}
      <div className="border border-[#222222] bg-[#0A0A0A] overflow-hidden">
        {isLoading ? (
          <div className="p-12 text-center flex flex-col items-center justify-center gap-3">
            <SpinnerGap size={32} weight="light" className="animate-spin text-amber-400" />
            <span className="font-mono text-xs uppercase tracking-widest text-[#71717A]">
              CARGANDO CATÁLOGO CENTRAL...
            </span>
          </div>
        ) : isError ? (
          <div className="p-12 text-center flex flex-col items-center justify-center gap-3 text-red-400">
            <span className="font-mono text-xs uppercase tracking-widest">
              FALLÓ LA CONEXIÓN CON EL SERVIDOR DE INVENTARIO
            </span>
            <Button variant="secondary" size="sm" onClick={() => refetch()}>
              REINTENTAR
            </Button>
          </div>
        ) : productosFiltrados.length === 0 ? (
          <div className="p-12 text-center flex flex-col items-center justify-center gap-2">
            <Package size={36} weight="light" className="text-[#333333]" />
            <span className="font-mono text-xs uppercase tracking-widest text-[#71717A]">
              NO SE ENCONTRARON PRODUCTOS CON LOS FILTROS ACTUALES
            </span>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-[#222222] bg-[#0D0D0D] text-[10px] font-mono uppercase tracking-[0.15em] text-[#71717A]">
                  <th className="py-3 px-4 w-36">MARCA / UNIDAD</th>
                  <th className="py-3 px-4 min-w-[260px]">PRODUCTO</th>
                  <th className="py-3 px-4 text-right w-28">PRECIO VTA</th>
                  <th className="py-3 px-4 w-72">VARIANTES (TALLE / STOCK)</th>
                  <th className="py-3 px-4 text-right w-32">STOCK TOTAL</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1A1A1A]">
                {productosPaginados.map((producto) => {
                  const stockTotal =
                    producto.variantes?.reduce((acc, v) => acc + (v.stockFisico || 0), 0) ?? 0;
                  const sinStock = stockTotal === 0;

                  return (
                    <tr
                      key={producto.id}
                      onClick={() => handleVerDetalle(producto)}
                      className="hover:bg-[#151515] transition-fast group cursor-pointer"
                      title="Ver detalle del producto y desglose de variantes"
                    >
                      {/* Columna 1: Marca */}
                      <td className="py-3.5 px-4 font-heading font-bold text-[#FAFAFA] uppercase tracking-wider text-xs align-top">
                        <div className="flex flex-col gap-1">
                          <span>{producto.marca}</span>
                          <span
                            className={`inline-block w-fit text-[10px] font-mono uppercase tracking-widest px-1.5 py-0.5 border ${
                              producto.unidadNegocio?.toLowerCase().includes('hidden')
                                ? 'border-amber-900/60 bg-amber-950/30 text-amber-300'
                                : 'border-[#333333] bg-[#141414] text-[#A1A1AA]'
                            }`}
                          >
                            {producto.unidadNegocio}
                          </span>
                        </div>
                      </td>

                      {/* Columna 2: Producto (con miniatura cuadrada w-10 h-10 border border-[#333333]) */}
                      <td className="py-3.5 px-4 align-top">
                        <div className="flex items-start gap-3">
                          {/* Miniatura Cuadrada Avant-Garde w-10 h-10 */}
                          <div className="w-10 h-10 shrink-0 border border-[#333333] bg-[#111111] overflow-hidden flex items-center justify-center relative">
                            {producto.imagenUrl ? (
                              <img
                                src={producto.imagenUrl}
                                alt={producto.nombre}
                                className="w-full h-full object-cover"
                                loading="lazy"
                                onError={(e) => {
                                  e.currentTarget.style.display = 'none';
                                  const fallback = e.currentTarget.parentElement?.querySelector('.img-fallback');
                                  if (fallback) fallback.classList.remove('hidden');
                                }}
                              />
                            ) : null}
                            <div
                              className={`w-full h-full flex items-center justify-center text-[#71717A] bg-[#111111] ${
                                producto.imagenUrl ? 'hidden img-fallback' : ''
                              }`}
                              title="Sin imagen"
                            >
                              <Image size={18} weight="light" />
                            </div>
                          </div>

                          {/* Info del Producto */}
                          <div className="flex flex-col gap-1 min-w-0">
                            <span className="font-heading font-semibold text-[#FAFAFA] text-sm group-hover:text-white transition-fast truncate">
                              {producto.nombre}
                            </span>
                            {producto.descripcion && (
                              <span className="text-[11px] text-[#71717A] line-clamp-1 font-sans">
                                {producto.descripcion}
                              </span>
                            )}
                            <span className="text-[10px] uppercase tracking-widest text-[#555555] font-mono mt-0.5">
                              CATEGORÍA: {producto.categoria}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Columna 3: Precio */}
                      <td className="py-3.5 px-4 text-right font-heading font-bold text-[#FAFAFA] text-sm align-top whitespace-nowrap">
                        ${producto.precioVenta.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                      </td>

                      {/* Columna 4: Variantes (Cantidad y badges) */}
                      <td className="py-3.5 px-4 align-top">
                        <div className="flex flex-col gap-1.5">
                          <span className="text-[11px] font-mono font-medium text-[#A1A1AA]">
                            {producto.variantes?.length || 0} {producto.variantes?.length === 1 ? 'Variante' : 'Variantes'}
                          </span>
                          <div className="flex flex-wrap gap-1 max-w-xs">
                            {producto.variantes?.map((v) => (
                              <span
                                key={v.id}
                                className={`text-[10px] font-mono px-1.5 py-0.5 border ${
                                  v.stockFisico === 0
                                    ? 'border-red-950 bg-red-950/20 text-red-400 line-through'
                                    : 'border-[#222222] bg-[#141414] text-[#D4D4D8]'
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
                            className={`text-sm font-heading font-bold ${
                              sinStock ? 'text-red-400' : stockTotal <= 5 ? 'text-amber-400' : 'text-[#FAFAFA]'
                            }`}
                          >
                            {stockTotal} u.
                          </span>
                          <span
                            className={`text-[10px] font-mono uppercase tracking-widest px-1.5 py-0.5 border ${
                              sinStock
                                ? 'border-red-900/60 bg-red-950/40 text-red-300'
                                : stockTotal <= 5
                                ? 'border-amber-900/60 bg-amber-950/40 text-amber-300'
                                : 'border-green-900/60 bg-green-950/30 text-green-300'
                            }`}
                          >
                            {sinStock ? 'SIN STOCK' : stockTotal <= 5 ? 'STOCK BAJO' : 'DISPONIBLE'}
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

        {/* Footer de la Tabla con Paginación Client-Side y Conteo */}
        {!isLoading && !isError && productosFiltrados.length > 0 && (
          <div className="p-3 bg-[#0D0D0D] border-t border-[#222222] flex flex-col sm:flex-row items-center justify-between gap-3 text-[10px] text-[#71717A] uppercase tracking-wider font-mono">
            {/* Información de Registros */}
            <div className="flex items-center gap-2">
              <span>
                MOSTRANDO {indiceInicio + 1} -{' '}
                {Math.min(indiceInicio + PAGE_SIZE, productosFiltrados.length)} DE{' '}
                {productosFiltrados.length} PRODUCTOS
              </span>
              {productosFiltrados.length !== productos.length && (
                <span className="text-[#555555]">
                  (TOTAL CATÁLOGO: {productos.length})
                </span>
              )}
            </div>

            {/* Controles de Navegación de Páginas */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPaginaActual((p) => Math.max(p - 1, 1))}
                disabled={paginaActual <= 1}
                className="px-2.5 py-1.5 border border-[#333333] bg-[#141414] hover:bg-[#222222] text-[#FAFAFA] disabled:opacity-30 disabled:cursor-not-allowed flex items-center gap-1 transition-fast"
                title="Página Anterior"
              >
                <CaretLeft size={12} weight="bold" />
                <span>ANT</span>
              </button>

              <span className="px-3 py-1.5 border border-[#222222] bg-[#0A0A0A] text-[#FAFAFA] font-bold">
                PÁGINA {paginaActual} DE {totalPaginas}
              </span>

              <button
                onClick={() => setPaginaActual((p) => Math.min(p + 1, totalPaginas))}
                disabled={paginaActual >= totalPaginas}
                className="px-2.5 py-1.5 border border-[#333333] bg-[#141414] hover:bg-[#222222] text-[#FAFAFA] disabled:opacity-30 disabled:cursor-not-allowed flex items-center gap-1 transition-fast"
                title="Página Siguiente"
              >
                <span>SIG</span>
                <CaretRight size={12} weight="bold" />
              </button>
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
