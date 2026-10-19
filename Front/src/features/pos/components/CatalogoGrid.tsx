import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ArrowsClockwise, MagnifyingGlass, WarningCircle, X } from '@phosphor-icons/react';
import { inventarioApi, type ProductoCatalogoDto } from '../api/inventarioApi';
import { ProductCard } from './ProductCard';

interface CatalogoGridProps {
  onProductosLoaded?: (productos: ProductoCatalogoDto[]) => void;
}

export const CatalogoGrid: React.FC<CatalogoGridProps> = ({ onProductosLoaded }) => {
  const [filtroTexto, setFiltroTexto] = useState('');
  const [filtroUnidad, setFiltroUnidad] = useState<'TODOS' | 'DASTIK' | 'HIDDEN'>('TODOS');

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

  // Filtrado reactivo en memoria
  const productosFiltrados = useMemo(() => {
    return productos.filter((p) => {
      if (filtroUnidad === 'DASTIK' && !p.unidadNegocio?.toLowerCase().includes('dastik')) {
        return false;
      }
      if (filtroUnidad === 'HIDDEN' && !p.unidadNegocio?.toLowerCase().includes('hidden')) {
        return false;
      }

      if (!filtroTexto.trim()) return true;

      const termino = filtroTexto.toLowerCase().trim();
      const coincideNombre = p.nombre.toLowerCase().includes(termino);
      const coincideMarca = p.marca.toLowerCase().includes(termino);
      const coincideCategoria = p.categoria.toLowerCase().includes(termino);
      const coincideTalle = p.variantes.some(
        (v) => v.talle.toLowerCase().includes(termino) || v.codigoBarras.includes(termino)
      );

      return coincideNombre || coincideMarca || coincideCategoria || coincideTalle;
    });
  }, [productos, filtroTexto, filtroUnidad]);

  return (
    <div className="flex-1 rounded-xl border border-subtle bg-surface p-5 flex flex-col gap-4 shadow-surface">
      {/* 1. Header del Catálogo con Filtros y Buscador */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-subtle pb-4">
        <div>
          <span className="text-[11px] font-medium tracking-wider uppercase text-muted font-sans block">
            Catálogo Retail en Tiempo Real
          </span>
          <h2 className="text-base md:text-lg font-heading font-bold text-primary tracking-tight">
            Prendas &amp; Sneakers Disponibles
          </h2>
        </div>

        {/* Segmented Control de Filtro por Unidad de Negocio */}
        <div className="flex items-center gap-2 self-stretch sm:self-auto">
          <div className="flex items-center bg-elevated p-1 rounded-lg border border-subtle">
            {(['TODOS', 'DASTIK', 'HIDDEN'] as const).map((unidad) => {
              const activo = filtroUnidad === unidad;
              return (
                <button
                  key={unidad}
                  type="button"
                  onClick={() => setFiltroUnidad(unidad)}
                  className={`px-3 py-1 text-xs font-sans font-semibold rounded-md transition-fast cursor-pointer ${
                    activo
                      ? 'bg-surface text-primary shadow-sm'
                      : 'text-secondary hover:text-primary'
                  }`}
                >
                  {unidad === 'HIDDEN' ? 'Hidden Sneakers' : unidad === 'DASTIK' ? 'Dastik' : 'Todos'}
                </button>
              );
            })}
          </div>

          <button
            type="button"
            onClick={() => refetch()}
            disabled={isFetching}
            title="Recargar catálogo desde el backend"
            className="border border-subtle bg-elevated hover:bg-surface hover:border-strong rounded-lg p-2 text-secondary hover:text-primary transition-fast cursor-pointer disabled:opacity-40 active:scale-[0.98]"
          >
            <ArrowsClockwise
              size={15}
              weight="regular"
              className={isFetching ? 'animate-spin text-amber-500' : ''}
            />
          </button>
        </div>
      </div>

      {/* 2. Barra de Búsqueda Rápida de Catálogo (100% Semántica en Light y Dark Mode) */}
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-muted">
          <MagnifyingGlass size={16} weight="regular" />
        </div>
        <input
          type="text"
          value={filtroTexto}
          onChange={(e) => setFiltroTexto(e.target.value)}
          placeholder="Filtrar por modelo, marca (Nike, Dastik), talle (M, US 9) o EAN..."
          className="w-full pl-10 pr-20 py-2.5 bg-elevated focus:bg-surface border border-subtle focus:border-amber-500/80 focus:ring-2 focus:ring-amber-500/20 rounded-lg text-xs md:text-sm font-sans text-primary placeholder:text-muted outline-none transition-fast"
        />
        {filtroTexto && (
          <button
            type="button"
            onClick={() => setFiltroTexto('')}
            className="absolute inset-y-0 right-2 my-auto h-6 px-2 rounded-md flex items-center gap-1 text-[11px] font-medium text-secondary hover:text-primary hover:bg-surface cursor-pointer"
          >
            <X size={12} />
            <span>Limpiar</span>
          </button>
        )}
      </div>

      {/* 3. Contenedor de la Grilla / Estados */}
      <div className="flex-1 min-h-[360px]">
        {/* Loading Skeletons */}
        {isLoading && (
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
            {[1, 2, 3, 4, 5, 6].map((idx) => (
              <div
                key={idx}
                className="rounded-xl border border-subtle bg-elevated/50 p-4 flex flex-col justify-between animate-pulse h-48"
              >
                <div className="flex justify-between items-center mb-3">
                  <div className="h-4 w-16 rounded-md bg-elevated" />
                  <div className="h-4 w-14 rounded-md bg-elevated" />
                </div>
                <div className="flex gap-3 mb-4">
                  <div className="w-12 h-12 rounded-lg bg-elevated shrink-0" />
                  <div className="flex-1 space-y-2">
                    <div className="h-3 w-20 rounded bg-elevated" />
                    <div className="h-4 w-32 rounded bg-elevated" />
                    <div className="h-4 w-24 rounded bg-elevated" />
                  </div>
                </div>
                <div className="grid grid-cols-5 gap-1.5 pt-3 border-t border-subtle">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <div key={s} className="h-8 rounded-lg bg-elevated" />
                  ))}
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
              className="mt-2 px-4 py-2 rounded-lg border border-red-500/40 bg-red-500/15 text-red-700 dark:text-red-200 text-xs font-semibold hover:bg-red-500/25 transition-fast cursor-pointer"
            >
              Reintentar conexión
            </button>
          </div>
        )}

        {/* Empty State */}
        {!isLoading && !isError && productosFiltrados.length === 0 && (
          <div className="h-full flex flex-col items-center justify-center rounded-xl border border-dashed border-subtle p-12 text-center">
            <MagnifyingGlass size={32} weight="duotone" className="text-muted mb-3" />
            <span className="text-sm font-heading font-bold text-primary block">
              Sin coincidencias en catálogo
            </span>
            <p className="text-xs font-sans text-secondary max-w-sm mt-1">
              No hay productos que coincidan con &quot;{filtroTexto}&quot;. Revisa los filtros o
              busca por código EAN.
            </p>
          </div>
        )}

        {/* Grilla de Productos */}
        {!isLoading && !isError && productosFiltrados.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
            {productosFiltrados.map((producto) => (
              <ProductCard key={producto.id} producto={producto} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
