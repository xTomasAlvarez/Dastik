import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import {
  CurrencyDollar,
  TrendUp,
  Receipt,
  Package,
  ArrowRight,
  ArrowClockwise,
  Fire,
  Image as ImageIcon,
  CheckCircle,
} from '@phosphor-icons/react';
import { metricasApi } from '../api/metricasApi';

export const DashboardPage: React.FC = () => {
  // 1. Consulta del resumen del Dashboard
  const {
    data: dashboardData,
    isLoading: isLoadingDashboard,
    isRefetching: isRefetchingDashboard,
    refetch: refetchDashboard,
  } = useQuery({
    queryKey: ['admin-dashboard-resumen'],
    queryFn: metricasApi.obtenerDashboard,
    refetchInterval: 30000, // Refresco cada 30 segundos
  });

  // 2. Consulta de Alertas de Stock (<= 3 unidades)
  const {
    data: alertasStock = [],
    isLoading: isLoadingAlertas,
    isRefetching: isRefetchingAlertas,
    refetch: refetchAlertas,
  } = useQuery({
    queryKey: ['admin-alertas-stock'],
    queryFn: metricasApi.obtenerAlertasStock,
    refetchInterval: 30000,
  });

  const handleRefrescar = () => {
    refetchDashboard();
    refetchAlertas();
  };

  const isRefreshing = isRefetchingDashboard || isRefetchingAlertas;

  // Cálculos de métricas
  const ingresosHoy = dashboardData?.ingresosHoy ?? 0;
  const gananciaNetaHoy = dashboardData?.gananciaNetaHoy ?? 0;
  const cantidadVentasHoy = dashboardData?.cantidadVentasHoy ?? 0;
  const margenPorcentaje = dashboardData?.margenPorcentajeHoy ?? 0;
  const ventas7Dias = dashboardData?.ventasUltimos7Dias ?? [];

  const ticketPromedio = cantidadVentasHoy > 0
    ? Math.round(ingresosHoy / cantidadVentasHoy)
    : 0;

  // Cálculo para el gráfico de barras (máximo para escalar porcentualmente)
  const maxVenta7Dias = ventas7Dias.length > 0
    ? Math.max(...ventas7Dias.map((v) => v.total), 1)
    : 1;

  const totalSemanal = ventas7Dias.reduce((acc, v) => acc + v.total, 0);

  return (
    <div className="p-6 md:p-8 space-y-6">
      {/* Header Avant-Garde del Dashboard */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-4 border-b border-[#222222]">
        <div>
          <span className="text-[10px] font-mono uppercase tracking-[0.25em] text-[#71717A]">
            PANEL DE CONTROL DEL DUEÑO
          </span>
          <h1 className="font-heading font-extrabold text-2xl md:text-3xl text-[#FAFAFA] tracking-tight uppercase">
            DASHBOARD GENERAL
          </h1>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleRefrescar}
            disabled={isRefreshing}
            className="border border-[#333333] bg-[#0E0E0E] hover:bg-[#1A1A1A] text-[#FAFAFA] px-3.5 py-2 text-xs font-mono uppercase tracking-wider flex items-center gap-2 transition-fast disabled:opacity-50"
            title="Actualizar datos en vivo"
          >
            <ArrowClockwise
              size={15}
              weight="light"
              className={isRefreshing ? 'animate-spin text-amber-400' : 'text-[#71717A]'}
            />
            <span>ACTUALIZAR</span>
          </button>

          <Link
            to="/admin/inventario"
            className="border border-[#333333] bg-[#141414] hover:bg-[#222222] text-[#FAFAFA] px-4 py-2 text-xs font-heading font-semibold uppercase tracking-wider flex items-center gap-2 transition-fast"
          >
            <Package size={15} weight="light" className="text-amber-400" />
            <span>IR A INVENTARIO</span>
            <ArrowRight size={13} weight="light" className="text-[#71717A]" />
          </Link>
        </div>
      </div>

      {/* Fila 1: Tarjetas de Resumen Financiero y Operativo */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Tarjeta 1: Ingresos Hoy */}
        <div className="border border-[#222222] bg-[#0A0A0A] p-5 flex flex-col justify-between relative overflow-hidden group hover:border-[#3A3A3A] transition-fast">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono uppercase tracking-widest text-[#71717A] flex items-center gap-1.5">
              <CurrencyDollar size={15} weight="light" className="text-emerald-400" />
              INGRESOS HOY
            </span>
            <span className="text-[9px] font-mono uppercase tracking-widest px-1.5 py-0.5 border border-emerald-900/60 bg-emerald-950/30 text-emerald-300">
              VENTAS DEL DÍA
            </span>
          </div>

          <div className="my-4">
            <div className="text-3xl sm:text-4xl font-heading font-black tracking-tight text-[#FAFAFA]">
              ${ingresosHoy.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
            </div>
            <span className="text-[10px] font-mono uppercase text-[#71717A] mt-1 block">
              TOTAL FACTURADO EN CAJA
            </span>
          </div>

          <div className="pt-3 border-t border-[#1C1C1C] flex items-center justify-between text-[11px] font-mono text-[#A1A1AA]">
            <span>Ticket Promedio:</span>
            <span className="text-[#FAFAFA] font-bold">
              ${ticketPromedio.toLocaleString('es-AR')}
            </span>
          </div>
        </div>

        {/* Tarjeta 2: Ganancia Neta Hoy */}
        <div className="border border-[#222222] bg-[#0A0A0A] p-5 flex flex-col justify-between relative overflow-hidden group hover:border-[#3A3A3A] transition-fast">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono uppercase tracking-widest text-[#71717A] flex items-center gap-1.5">
              <TrendUp size={15} weight="light" className="text-amber-400" />
              GANANCIA NETA HOY
            </span>
            <span className="text-[9px] font-mono uppercase tracking-widest px-1.5 py-0.5 border border-amber-900/60 bg-amber-950/30 text-amber-300">
              MARGEN: {margenPorcentaje}%
            </span>
          </div>

          <div className="my-4">
            <div className="text-3xl sm:text-4xl font-heading font-black tracking-tight text-amber-400">
              ${gananciaNetaHoy.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
            </div>
            <span className="text-[10px] font-mono uppercase text-[#71717A] mt-1 block">
              INGRESOS MENOS COSTO MERCADERÍA
            </span>
          </div>

          <div className="pt-3 border-t border-[#1C1C1C] flex items-center justify-between text-[11px] font-mono text-[#A1A1AA]">
            <span>Rendimiento Estimado:</span>
            <span className="text-amber-300 font-bold">
              {margenPorcentaje > 0 ? `+${margenPorcentaje}% sobre venta` : '0%'}
            </span>
          </div>
        </div>

        {/* Tarjeta 3: Ventas Realizadas */}
        <div className="border border-[#222222] bg-[#0A0A0A] p-5 flex flex-col justify-between relative overflow-hidden group hover:border-[#3A3A3A] transition-fast">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono uppercase tracking-widest text-[#71717A] flex items-center gap-1.5">
              <Receipt size={15} weight="light" className="text-blue-400" />
              VENTAS REALIZADAS
            </span>
            <span className="text-[9px] font-mono uppercase tracking-widest px-1.5 py-0.5 border border-[#333333] bg-[#141414] text-[#D4D4D8]">
              OPERACIONES HOY
            </span>
          </div>

          <div className="my-4">
            <div className="text-3xl sm:text-4xl font-heading font-black tracking-tight text-[#FAFAFA]">
              {cantidadVentasHoy} <span className="text-lg font-normal text-[#71717A]">OP.</span>
            </div>
            <span className="text-[10px] font-mono uppercase text-[#71717A] mt-1 block">
              ÓRDENES COBRADAS EN EL LOCAL
            </span>
          </div>

          <div className="pt-3 border-t border-[#1C1C1C] flex items-center justify-between text-[11px] font-mono text-[#A1A1AA]">
            <span>Estado del Local:</span>
            <span className="text-emerald-400 font-bold uppercase">
              {cantidadVentasHoy > 0 ? 'Activo en Curso' : 'Sin Ventas Hoy'}
            </span>
          </div>
        </div>
      </div>

      {/* Fila 2: Panel Dividido (70% Gráfico Volumen | 30% Alertas de Stock) */}
      <div className="grid grid-cols-1 lg:grid-cols-10 gap-6">
        {/* Columna Izquierda: Volumen de Ventas (70% -> lg:col-span-7) */}
        <div className="lg:col-span-7 border border-[#222222] bg-[#0A0A0A] p-6 flex flex-col justify-between">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-[#1C1C1C]">
            <div>
              <span className="text-[10px] font-mono uppercase tracking-[0.2em] text-[#71717A]">
                EVOLUCIÓN COMERCIAL
              </span>
              <h2 className="text-base font-heading font-bold text-[#FAFAFA] uppercase tracking-wider">
                VOLUMEN DE VENTAS (ÚLTIMOS 7 DÍAS)
              </h2>
            </div>

            <div className="text-right">
              <span className="text-[10px] font-mono uppercase tracking-widest text-[#71717A] block">
                TOTAL ACUMULADO
              </span>
              <span className="text-base font-heading font-bold text-[#FAFAFA]">
                ${totalSemanal.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
              </span>
            </div>
          </div>

          {/* Gráfico de Barras Avant-Garde Interactivo */}
          <div className="mt-8 mb-4">
            {isLoadingDashboard ? (
              <div className="h-56 flex items-center justify-center text-xs font-mono uppercase text-[#71717A]">
                Cargando métricas de ventas...
              </div>
            ) : ventas7Dias.length === 0 ? (
              <div className="h-56 flex items-center justify-center text-xs font-mono uppercase text-[#71717A]">
                Sin registros de ventas en los últimos 7 días.
              </div>
            ) : (
              <div className="grid grid-cols-7 gap-2 sm:gap-4 items-end h-56 pt-8">
                {ventas7Dias.map((v, idx) => {
                  const alturaPorcentaje = maxVenta7Dias > 0
                    ? Math.max(Math.round((v.total / maxVenta7Dias) * 100), 4)
                    : 4;
                  const esHoy = idx === ventas7Dias.length - 1;

                  return (
                    <div key={v.fecha} className="flex flex-col items-center h-full justify-end group">
                      {/* Tooltip con valor al hacer hover */}
                      <div className="opacity-0 group-hover:opacity-100 transition-opacity text-[10px] font-mono text-[#FAFAFA] bg-[#181818] border border-[#333333] px-1.5 py-0.5 rounded-none mb-1 pointer-events-none whitespace-nowrap shadow-lg">
                        ${v.total.toLocaleString('es-AR')}
                      </div>

                      {/* Barra Brutalista */}
                      <div className="w-full max-w-[48px] bg-[#141414] border border-[#2B2B2B] flex flex-col justify-end p-0.5 relative h-full">
                        <div
                          style={{ height: `${alturaPorcentaje}%` }}
                          className={`w-full transition-all duration-500 ${
                            esHoy
                              ? 'bg-amber-400 group-hover:bg-amber-300'
                              : 'bg-[#FAFAFA] group-hover:bg-white'
                          }`}
                        />
                      </div>

                      {/* Etiquetas de Día y Fecha */}
                      <div className="mt-2 text-center">
                        <span
                          className={`text-[11px] font-heading font-bold block ${
                            esHoy ? 'text-amber-400' : 'text-[#FAFAFA]'
                          }`}
                        >
                          {v.diaSemana}
                        </span>
                        <span className="text-[9px] font-mono text-[#71717A] block">
                          {v.fecha.slice(5)}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div className="pt-3 border-t border-[#1C1C1C] flex items-center justify-between text-[10px] font-mono text-[#71717A] uppercase">
            <span>BARRA DORADA = JORNADA ACTUAL</span>
            <span>VENTAS VALIDADAS EN CAJA</span>
          </div>
        </div>

        {/* Columna Derecha: Alertas de Stock Crítico (30% -> lg:col-span-3) */}
        <div className="lg:col-span-3 border border-[#222222] bg-[#0A0A0A] p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-[#1C1C1C]">
              <div className="flex items-center gap-2">
                <Fire size={18} weight="fill" className="text-amber-500 animate-pulse" />
                <h2 className="text-sm font-heading font-bold text-[#FAFAFA] uppercase tracking-wider">
                  ALERTAS DE STOCK
                </h2>
              </div>
              <span
                className={`text-[9px] font-mono uppercase tracking-widest px-2 py-0.5 border ${
                  alertasStock.length > 0
                    ? 'border-amber-900/80 bg-amber-950/40 text-amber-300 font-bold'
                    : 'border-emerald-900/80 bg-emerald-950/30 text-emerald-300'
                }`}
              >
                {alertasStock.length} CRÍTICOS
              </span>
            </div>

            <p className="text-[10px] font-mono text-[#71717A] uppercase mt-2 mb-3">
              REGLA ESTRICTA: STOCK FÍSICO ≤ 3 UNIDADES
            </p>

            {/* Lista Compacta de Alertas con Scroll */}
            <div className="space-y-2 max-h-[380px] overflow-y-auto pr-1">
              {isLoadingAlertas ? (
                <div className="py-8 text-center text-xs font-mono uppercase text-[#71717A]">
                  Consultando niveles de stock...
                </div>
              ) : alertasStock.length === 0 ? (
                <div className="py-12 text-center flex flex-col items-center justify-center gap-2">
                  <CheckCircle size={32} weight="light" className="text-emerald-400" />
                  <span className="text-xs font-mono uppercase text-[#71717A]">
                    STOCK SALUDABLE EN TODO EL CATÁLOGO
                  </span>
                </div>
              ) : (
                alertasStock.map((alerta) => {
                  const sinStock = alerta.stockFisico === 0;

                  return (
                    <div
                      key={alerta.varianteId}
                      className="border border-[#222222] bg-[#0E0E0E] hover:bg-[#141414] p-2.5 flex items-center justify-between gap-3 transition-fast"
                    >
                      {/* Miniatura y Detalle del Producto */}
                      <div className="flex items-center gap-2.5 min-w-0">
                        {/* Miniatura */}
                        <div className="w-9 h-9 border border-[#333333] bg-[#111111] shrink-0 overflow-hidden flex items-center justify-center relative">
                          {alerta.imagenUrl ? (
                            <img
                              src={alerta.imagenUrl}
                              alt={alerta.nombreProducto}
                              className="w-full h-full object-cover"
                              loading="lazy"
                              onError={(e) => {
                                e.currentTarget.style.display = 'none';
                                const fb = e.currentTarget.parentElement?.querySelector('.alt-fb');
                                if (fb) fb.classList.remove('hidden');
                              }}
                            />
                          ) : null}
                          <div
                            className={`w-full h-full flex items-center justify-center text-[#555555] bg-[#111111] ${
                              alerta.imagenUrl ? 'hidden alt-fb' : ''
                            }`}
                          >
                            <ImageIcon size={15} weight="light" />
                          </div>
                        </div>

                        {/* Texto */}
                        <div className="truncate">
                          <span className="text-xs font-heading font-semibold text-[#FAFAFA] block truncate">
                            {alerta.nombreProducto}
                          </span>
                          <div className="flex items-center gap-1.5 mt-0.5">
                            <span className="text-[9px] font-mono text-amber-400 font-bold uppercase">
                              TALLE {alerta.talle}
                            </span>
                            <span className="text-[9px] text-[#555555]">|</span>
                            <span className="text-[9px] font-mono text-[#71717A] truncate">
                              {alerta.color}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Badge de Stock Físico */}
                      <div className="text-right shrink-0">
                        <span
                          className={`text-[9px] font-mono uppercase tracking-widest px-2 py-1 border block text-center ${
                            sinStock
                              ? 'border-red-900/80 bg-red-950/50 text-red-300 font-bold'
                              : 'border-amber-900/80 bg-amber-950/40 text-amber-300 font-bold'
                          }`}
                        >
                          {sinStock ? '0 u. (AGOTADO)' : `${alerta.stockFisico} u.`}
                        </span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          <div className="pt-3 border-t border-[#1C1C1C] mt-4">
            <Link
              to="/admin/inventario"
              className="w-full py-2 border border-[#333333] bg-[#111111] hover:bg-[#1A1A1A] text-xs font-mono uppercase tracking-wider text-center block text-[#FAFAFA] transition-fast"
            >
              GESTIONAR PEDIDOS DE REPOSICIÓN
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};
