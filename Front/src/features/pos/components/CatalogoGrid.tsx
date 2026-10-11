import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ArrowsClockwise, MagnifyingGlass, WarningCircle } from '@phosphor-icons/react';
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
      // Filtro por unidad de negocio
      if (filtroUnidad === 'DASTIK' && !p.unidadNegocio?.toLowerCase().includes('dastik')) {
        return false;
      }
      if (filtroUnidad === 'HIDDEN' && !p.unidadNegocio?.toLowerCase().includes('hidden')) {
        return false;
      }

      // Filtro por texto libre (nombre, marca, descripción, o talles)
      if (!filtroTexto.trim()) return true;

      const termino = filtroTexto.toLowerCase().trim();
      const coincideNombre = p.nombre.toLowerCase().includes(termino);
      const coincideMarca = p.marca.toLowerCase().includes(termino);
      const coincideCategoria = p.categoria.toLowerCase().includes(termino);
      const coincideTalle = p.variantes.some((v) =>
        v.talle.toLowerCase().includes(termino) || v.codigoBarras.includes(termino)
      );

      return coincideNombre || coincideMarca || coincideCategoria || coincideTalle;
    });
  }, [productos, filtroTexto, filtroUnidad]);

  return (
    <div className="flex-1 border border-[#333333] bg-[#090909] p-5 flex flex-col gap-4">
      {/* 1. Header del Catálogo con Filtros y Buscador */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-[#222222] pb-4">
        <div>
          <span className="text-[10px] uppercase tracking-[0.25em] text-[#71717A] font-sans block">
            CATÁLOGO RETAIL EN TIEMPO REAL
          </span>
          <h2 className="text-base font-heading font-extrabold text-[#FAFAFA] tracking-tight">
            PRENDAS & SNEAKERS DISPONIBLES
          </h2>
        </div>

        {/* Botones de Filtro por Unidad de Negocio */}
        <div className="flex items-center gap-1.5 self-stretch sm:self-auto">
          {(['TODOS', 'DASTIK', 'HIDDEN'] as const).map((unidad) => (
            <button
              key={unidad}
              type="button"
              onClick={() => setFiltroUnidad(unidad)}
              className={`
                px-2.5 py-1 text-[10px] font-mono uppercase tracking-wider transition-fast border cursor-pointer
                ${
                  filtroUnidad === unidad
                    ? 'border-[#FAFAFA] bg-[#FAFAFA] text-[#000000] font-bold'
                    : 'border-[#222222] bg-[#111111] text-[#71717A] hover:text-[#FAFAFA] hover:border-[#444444]'
                }
              `}
            >
              {unidad === 'HIDDEN' ? 'HIDDEN SNEAKERS' : unidad}
            </button>
          ))}

          <button
            type="button"
            onClick={() => refetch()}
            disabled={isFetching}
            title="Recargar catálogo desde el backend"
            className="border border-[#222222] bg-[#111111] p-1.5 text-[#71717A] hover:text-[#FAFAFA] hover:border-[#444444] transition-fast cursor-pointer disabled:opacity-40"
          >
            <ArrowsClockwise
              size={14}
              weight="light"
              className={isFetching ? 'animate-spin text-[#FAFAFA]' : ''}
            />
          </button>
        </div>
      </div>

      {/* 2. Barra de Búsqueda Rápida de Catálogo */}
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[#71717A]">
          <MagnifyingGlass size={14} weight="light" />
        </div>
        <input
          type="text"
          value={filtroTexto}
          onChange={(e) => setFiltroTexto(e.target.value)}
          placeholder="Filtrar por modelo, marca (Nike, Dastik), talle (M, US 9)..."
          className="w-full pl-9 pr-3 py-2 bg-[#0E0E0E] border border-[#222222] focus:border-[#FAFAFA] text-xs font-sans text-[#FAFAFA] placeholder:text-[#555555] outline-none transition-fast"
        />
        {filtroTexto && (
          <button
            type="button"
            onClick={() => setFiltroTexto('')}
            className="absolute inset-y-0 right-0 pr-3 flex items-center text-[10px] font-mono text-[#71717A] hover:text-[#FAFAFA] cursor-pointer"
          >
            LIMPIAR
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
                className="border border-[#222222] bg-[#0E0E0E] p-4 flex flex-col justify-between animate-pulse h-48"
              >
                <div className="flex justify-between items-center mb-3">
                  <div className="h-3 w-16 bg-[#1A1A1A]" />
                  <div className="h-3 w-12 bg-[#1A1A1A]" />
                </div>
                <div className="flex gap-3 mb-4">
                  <div className="w-12 h-12 bg-[#1A1A1A] shrink-0" />
                  <div className="flex-1 space-y-2">
                    <div className="h-2.5 w-20 bg-[#1A1A1A]" />
                    <div className="h-3.5 w-32 bg-[#1A1A1A]" />
                    <div className="h-4 w-24 bg-[#1A1A1A]" />
                  </div>
                </div>
                <div className="grid grid-cols-5 gap-1.5 pt-3 border-t border-[#1A1A1A]">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <div key={s} className="h-8 bg-[#1A1A1A]" />
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Error State */}
        {isError && (
          <div className="border border-red-900/60 bg-red-950/20 p-8 flex flex-col items-center justify-center text-center gap-3">
            <WarningCircle size={32} weight="light" className="text-red-400" />
            <h4 className="font-heading text-sm font-bold text-red-300 uppercase tracking-wider">
              Error al sincronizar catálogo
            </h4>
            <p className="text-xs font-sans text-[#A1A1AA] max-w-md">
              {error instanceof Error ? error.message : 'No se pudo conectar con el servicio de inventario.'}
            </p>
            <button
              type="button"
              onClick={() => refetch()}
              className="mt-2 px-4 py-2 border border-red-500/50 bg-red-950/40 text-red-200 text-xs font-mono uppercase tracking-wider hover:bg-red-900/40 transition-fast cursor-pointer"
            >
              Reintentar Conexión
            </button>
          </div>
        )}

        {/* Empty State */}
        {!isLoading && !isError && productosFiltrados.length === 0 && (
          <div className="h-full flex flex-col items-center justify-center border border-dashed border-[#222222] p-12 text-center">
            <MagnifyingGlass size={32} weight="light" className="text-[#444444] mb-3" />
            <span className="text-xs font-heading font-bold tracking-wider text-[#FAFAFA] uppercase block">
              Sin coincidencias en catálogo
            </span>
            <p className="text-xs font-sans text-[#71717A] max-w-sm mt-1">
              No hay productos que coincidan con &quot;{filtroTexto}&quot;. Revisa los filtros o busca por código EAN.
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
