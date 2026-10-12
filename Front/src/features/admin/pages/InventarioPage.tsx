import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Plus,
  MagnifyingGlass,
  ArrowClockwise,
  WarningCircle,
  Package,
  SlidersHorizontal,
  Barcode
} from '@phosphor-icons/react';
import { inventarioApi, type ProductoCatalogoDto } from '../../pos/api/inventarioApi';
import { Button } from '../../../components/ui/Button';

export const InventarioPage: React.FC = () => {
  const [busqueda, setBusqueda] = useState('');
  const [filtroUnidad, setFiltroUnidad] = useState<string>('TODAS');

  // Consulta de catálogo completo con TanStack Query
  const {
    data: productos = [],
    isLoading,
    isError,
    error,
    refetch,
    isFetching
  } = useQuery<ProductoCatalogoDto[]>({
    queryKey: ['productos-inventario'],
    queryFn: inventarioApi.obtenerProductos
  });

  // Cálculo de productos filtrados
  const productosFiltrados = useMemo(() => {
    return productos.filter((prod) => {
      // Filtro por unidad de negocio
      if (filtroUnidad !== 'TODAS' && prod.unidadNegocio?.toUpperCase() !== filtroUnidad.toUpperCase()) {
        return false;
      }

      // Filtro por término de búsqueda (nombre, marca, descripción, código de barras)
      if (!busqueda.trim()) return true;

      const term = busqueda.toLowerCase().trim();
      const coincideBasico =
        prod.nombre.toLowerCase().includes(term) ||
        prod.marca.toLowerCase().includes(term) ||
        prod.categoria.toLowerCase().includes(term) ||
        prod.unidadNegocio.toLowerCase().includes(term);

      if (coincideBasico) return true;

      // Buscar si algún talle o código de barras coincide
      return prod.variantes.some(
        (v) =>
          v.talle.toLowerCase().includes(term) ||
          v.color.toLowerCase().includes(term) ||
          v.codigoBarras.includes(term)
      );
    });
  }, [productos, busqueda, filtroUnidad]);

  // Métricas rápidas de cabecera
  const metricas = useMemo(() => {
    const totalItems = productos.length;
    const totalVariantes = productos.reduce((acc, p) => acc + (p.variantes?.length || 0), 0);
    const totalStock = productos.reduce(
      (acc, p) => acc + (p.variantes?.reduce((s, v) => s + v.stockFisico, 0) || 0),
      0
    );
    return { totalItems, totalVariantes, totalStock };
  }, [productos]);

  const handleNuevoProducto = () => {
    console.log('NUEVO PRODUCTO');
  };

  return (
    <div className="flex-1 flex flex-col p-6 md:p-8 space-y-6 max-w-7xl w-full mx-auto">
      {/* 1. Header de la Página */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-[#333333]">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl md:text-3xl font-heading font-extrabold uppercase tracking-tight text-[#FAFAFA]">
              INVENTARIO CENTRAL
            </h1>
            <span className="border border-[#222222] bg-[#111111] px-2.5 py-1 text-[10px] uppercase tracking-widest text-[#71717A] font-sans">
              CATÁLOGO & STOCK
            </span>
          </div>
          <p className="text-xs text-[#71717A] uppercase tracking-wider font-sans mt-1">
            CONTROL MULTI-TIENDA · DASTIK // HIDDEN SNEAKERS
          </p>
        </div>

        {/* Botón Principal: NUEVO PRODUCTO */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => refetch()}
            disabled={isFetching}
            className="p-2.5 border border-[#333333] bg-[#111111] hover:bg-[#1A1A1A] hover:border-[#555555] text-[#FAFAFA] transition-fast cursor-pointer disabled:opacity-50"
            title="Refrescar catálogo"
          >
            <ArrowClockwise size={16} weight="light" className={isFetching ? 'animate-spin' : ''} />
          </button>

          <Button
            variant="primary"
            size="md"
            onClick={handleNuevoProducto}
            className="gap-2 px-5 py-2.5 font-bold tracking-widest"
          >
            <Plus size={16} weight="bold" />
            <span>NUEVO PRODUCTO</span>
          </Button>
        </div>
      </div>

      {/* 2. Tarjetas de Resumen Rápido (Estilo Flat Avant-Garde) */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="border border-[#222222] bg-[#090909] p-4 flex flex-col justify-between">
          <span className="text-[10px] uppercase tracking-[0.2em] text-[#71717A] font-sans">
            PRODUCTOS REGISTRADOS
          </span>
          <span className="text-2xl md:text-3xl font-heading font-bold text-[#FAFAFA] mt-2">
            {isLoading ? '...' : metricas.totalItems}
          </span>
        </div>

        <div className="border border-[#222222] bg-[#090909] p-4 flex flex-col justify-between">
          <span className="text-[10px] uppercase tracking-[0.2em] text-[#71717A] font-sans">
            SKUS / VARIANTES TOTALES
          </span>
          <span className="text-2xl md:text-3xl font-heading font-bold text-[#FAFAFA] mt-2">
            {isLoading ? '...' : metricas.totalVariantes}
          </span>
        </div>

        <div className="border border-[#222222] bg-[#090909] p-4 flex flex-col justify-between">
          <span className="text-[10px] uppercase tracking-[0.2em] text-[#71717A] font-sans">
            STOCK FÍSICO GLOBAL
          </span>
          <span className="text-2xl md:text-3xl font-heading font-bold text-amber-400 mt-2">
            {isLoading ? '...' : metricas.totalStock}
          </span>
        </div>
      </div>

      {/* 3. Barra de Búsqueda y Filtros */}
      <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between bg-[#090909] p-3 border border-[#222222]">
        {/* Buscador Input */}
        <div className="relative flex-1">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[#71717A]">
            <MagnifyingGlass size={16} weight="light" />
          </div>
          <input
            type="text"
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            placeholder="BUSCAR POR NOMBRE, MARCA, TALLE O CÓDIGO DE BARRAS..."
            className="w-full pl-9 pr-4 py-2 bg-[#111111] border border-[#333333] text-xs font-sans text-[#FAFAFA] placeholder:text-[#555555] uppercase tracking-wider focus:outline-none focus:border-[#FAFAFA] transition-fast rounded-none"
          />
        </div>

        {/* Filtros de Unidad de Negocio */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0">
          <div className="flex items-center gap-1.5 text-[#71717A] text-[10px] uppercase tracking-wider mr-2 font-mono shrink-0">
            <SlidersHorizontal size={14} weight="light" />
            <span>UNIDAD:</span>
          </div>

          {['TODAS', 'DASTIK', 'HIDDEN SNEAKERS'].map((unidad) => (
            <button
              key={unidad}
              type="button"
              onClick={() => setFiltroUnidad(unidad)}
              className={`px-3 py-1.5 text-[10px] font-heading font-semibold uppercase tracking-wider transition-fast border shrink-0 cursor-pointer ${
                filtroUnidad === unidad
                  ? 'bg-[#FAFAFA] text-[#000000] border-[#FAFAFA]'
                  : 'bg-[#111111] text-[#71717A] border-[#222222] hover:text-[#FAFAFA] hover:border-[#444444]'
              }`}
            >
              {unidad}
            </button>
          ))}
        </div>
      </div>

      {/* 4. Tabla de Datos (Flat Data Grid) */}
      <div className="border border-[#333333] bg-[#090909] overflow-hidden">
        {isLoading ? (
          <div className="py-20 flex flex-col items-center justify-center space-y-3">
            <ArrowClockwise size={28} weight="light" className="animate-spin text-[#71717A]" />
            <span className="text-xs uppercase tracking-widest text-[#71717A] font-sans">
              CARGANDO INVENTARIO CENTRAL...
            </span>
          </div>
        ) : isError ? (
          <div className="py-16 px-6 text-center space-y-3">
            <WarningCircle size={32} weight="light" className="text-red-400 mx-auto" />
            <p className="text-xs text-red-300 font-sans uppercase tracking-wider">
              {error instanceof Error ? error.message : 'Error al conectar con la base de datos de inventario.'}
            </p>
            <Button variant="secondary" size="sm" onClick={() => refetch()} className="mx-auto text-[10px]">
              REINTENTAR CONSULTA
            </Button>
          </div>
        ) : productosFiltrados.length === 0 ? (
          <div className="py-20 text-center space-y-3">
            <Package size={36} weight="light" className="text-[#333333] mx-auto" />
            <p className="text-xs uppercase tracking-widest text-[#71717A] font-sans">
              NO SE ENCONTRARON PRODUCTOS QUE COINCIDAN CON LA BÚSQUEDA
            </p>
            {(busqueda || filtroUnidad !== 'TODAS') && (
              <button
                type="button"
                onClick={() => {
                  setBusqueda('');
                  setFiltroUnidad('TODAS');
                }}
                className="text-[10px] uppercase font-sans tracking-widest text-amber-400 hover:underline cursor-pointer"
              >
                Limpiar filtros
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse font-sans">
              <thead>
                <tr className="bg-[#0D0D0D] border-b border-[#333333] text-[10px] uppercase tracking-widest text-[#71717A] font-semibold">
                  <th className="py-3 px-4 w-40">MARCA</th>
                  <th className="py-3 px-4">PRODUCTO</th>
                  <th className="py-3 px-4 text-right w-36">PRECIO</th>
                  <th className="py-3 px-4 w-48">VARIANTES</th>
                  <th className="py-3 px-4 text-right w-36">STOCK TOTAL</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1A1A1A] text-xs">
                {productosFiltrados.map((producto) => {
                  const stockTotal = producto.variantes?.reduce((s, v) => s + v.stockFisico, 0) || 0;
                  const sinStock = stockTotal === 0;

                  return (
                    <tr
                      key={producto.id}
                      className="hover:bg-[#121212] transition-fast group"
                    >
                      {/* Columna 1: Marca */}
                      <td className="py-3.5 px-4 font-heading font-bold text-[#FAFAFA] uppercase tracking-wider text-xs align-top">
                        <div className="flex flex-col gap-1">
                          <span>{producto.marca}</span>
                          <span
                            className={`inline-block w-fit text-[8px] font-mono uppercase tracking-widest px-1.5 py-0.5 border ${
                              producto.unidadNegocio?.toLowerCase().includes('hidden')
                                ? 'border-amber-900/60 bg-amber-950/30 text-amber-300'
                                : 'border-[#333333] bg-[#141414] text-[#A1A1AA]'
                            }`}
                          >
                            {producto.unidadNegocio}
                          </span>
                        </div>
                      </td>

                      {/* Columna 2: Producto */}
                      <td className="py-3.5 px-4 align-top">
                        <div className="flex flex-col gap-1">
                          <span className="font-heading font-semibold text-[#FAFAFA] text-sm group-hover:text-white transition-fast">
                            {producto.nombre}
                          </span>
                          {producto.descripcion && (
                            <span className="text-[11px] text-[#71717A] line-clamp-1 font-sans">
                              {producto.descripcion}
                            </span>
                          )}
                          <span className="text-[9px] uppercase tracking-widest text-[#555555] font-mono mt-0.5">
                            CATEGORÍA: {producto.categoria}
                          </span>
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
                                className={`text-[9px] font-mono px-1.5 py-0.5 border ${
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
                            className={`text-[8px] font-mono uppercase tracking-widest px-1.5 py-0.5 border ${
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

        {/* Footer de la Tabla con Conteo */}
        {!isLoading && !isError && productosFiltrados.length > 0 && (
          <div className="p-3 bg-[#0D0D0D] border-t border-[#222222] flex items-center justify-between text-[10px] text-[#71717A] uppercase tracking-wider font-mono">
            <span>MOSTRANDO {productosFiltrados.length} DE {productos.length} PRODUCTOS</span>
            <span className="flex items-center gap-1.5">
              <Barcode size={14} weight="light" />
              SISTEMA CENTRAL DE INVENTARIO
            </span>
          </div>
        )}
      </div>
    </div>
  );
};
