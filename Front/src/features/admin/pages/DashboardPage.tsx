import React from 'react';
import { motion } from 'motion/react';
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
import { Button } from '../../../components/ui/Button';

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.07,
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

export const DashboardPage: React.FC = () => {
  const {
    data: dashboardData,
    isLoading: isLoadingDashboard,
    isRefetching: isRefetchingDashboard,
    refetch: refetchDashboard,
  } = useQuery({
    queryKey: ['admin-dashboard-resumen'],
    queryFn: metricasApi.obtenerDashboard,
    refetchInterval: 30000,
  });

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

  const ingresosHoy = dashboardData?.ingresosHoy ?? 0;
  const gananciaNetaHoy = dashboardData?.gananciaNetaHoy ?? 0;
  const cantidadVentasHoy = dashboardData?.cantidadVentasHoy ?? 0;
  const margenPorcentaje = dashboardData?.margenPorcentajeHoy ?? 0;
  const ventas7Dias = dashboardData?.ventasUltimos7Dias ?? [];

  const ticketPromedio =
    cantidadVentasHoy > 0 ? Math.round(ingresosHoy / cantidadVentasHoy) : 0;

  const maxVenta7Dias =
    ventas7Dias.length > 0 ? Math.max(...ventas7Dias.map((v) => v.total), 1) : 1;

  const totalSemanal = ventas7Dias.reduce((acc, v) => acc + v.total, 0);

  return (
    <div className="p-6 md:p-8 space-y-6 max-w-[1600px] mx-auto w-full">
      {/* Header del Dashboard */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-5 border-b border-subtle">
        <div>
          <span className="text-xs font-medium text-amber-500 block">
            Panel de Control del Dueño
          </span>
          <h1 className="font-heading font-extrabold text-2xl md:text-3xl text-primary tracking-tight">
            Dashboard General
          </h1>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="secondary"
            size="sm"
            onClick={handleRefrescar}
            disabled={isRefreshing}
            title="Actualizar datos en vivo"
          >
            <ArrowClockwise
              size={15}
              weight="regular"
              className={isRefreshing ? 'animate-spin text-amber-500' : 'text-secondary'}
            />
            <span>Actualizar</span>
          </Button>

          <Link
            to="/admin/inventario"
            className="rounded-lg border border-subtle bg-surface hover:bg-elevated hover:border-strong text-primary px-4 py-2 text-xs font-sans font-semibold flex items-center gap-2 transition-fast shadow-surface active:scale-[0.98]"
          >
            <Package size={15} weight="duotone" className="text-amber-500" />
            <span>Ir a Inventario</span>
            <ArrowRight size={13} weight="regular" className="text-muted" />
          </Link>
        </div>
      </div>

      {/* Fila 1: Tarjetas de Resumen Financiero y Operativo */}
      <motion.div variants={containerVariants} initial="hidden" animate="visible" className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Tarjeta 1: Ingresos Hoy */}
        <motion.div variants={itemVariants} className="rounded-xl border border-subtle bg-surface p-5 flex flex-col justify-between shadow-surface hover:border-strong transition-fast">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-secondary flex items-center gap-1.5">
              <CurrencyDollar size={17} weight="duotone" className="text-emerald-500" />
              Ingresos Hoy
            </span>
            <span className="text-[11px] font-medium px-2 py-0.5 rounded-md border border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
              Ventas del día
            </span>
          </div>

          <div className="my-4">
            <div className="text-2xl sm:text-3xl font-mono tabular-nums font-bold tracking-tight text-primary">
              $ {ingresosHoy.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
            </div>
            <span className="text-xs text-muted mt-1 block">
              Total facturado en caja hoy
            </span>
          </div>

          <div className="pt-3 border-t border-subtle flex items-center justify-between text-xs font-sans text-secondary">
            <span>Ticket promedio:</span>
            <span className="text-primary font-mono tabular-nums font-bold">
              $ {ticketPromedio.toLocaleString('es-AR')}
            </span>
          </div>
        </motion.div>

        {/* Tarjeta 2: Ganancia Neta Hoy */}
        <motion.div variants={itemVariants} className="rounded-xl border border-subtle bg-surface p-5 flex flex-col justify-between shadow-surface hover:border-strong transition-fast">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-secondary flex items-center gap-1.5">
              <TrendUp size={17} weight="duotone" className="text-amber-500" />
              Ganancia Neta Hoy
            </span>
            <span className="text-[11px] font-mono tabular-nums font-semibold px-2 py-0.5 rounded-md border border-amber-500/30 bg-amber-500/10 text-amber-600 dark:text-amber-400">
              Margen: {margenPorcentaje}%
            </span>
          </div>

          <div className="my-4">
            <div className="text-2xl sm:text-3xl font-mono tabular-nums font-bold tracking-tight text-amber-500">
              $ {gananciaNetaHoy.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
            </div>
            <span className="text-xs text-muted mt-1 block">
              Ingresos menos costo de mercadería
            </span>
          </div>

          <div className="pt-3 border-t border-subtle flex items-center justify-between text-xs font-sans text-secondary">
            <span>Rendimiento estimado:</span>
            <span className="text-amber-600 dark:text-amber-400 font-mono tabular-nums font-bold">
              {margenPorcentaje > 0 ? `+${margenPorcentaje}% sobre venta` : '0%'}
            </span>
          </div>
        </motion.div>

        {/* Tarjeta 3: Ventas Realizadas */}
        <motion.div variants={itemVariants} className="rounded-xl border border-subtle bg-surface p-5 flex flex-col justify-between shadow-surface hover:border-strong transition-fast">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-secondary flex items-center gap-1.5">
              <Receipt size={17} weight="duotone" className="text-sky-500" />
              Ventas Realizadas
            </span>
            <span className="text-[11px] font-medium px-2 py-0.5 rounded-md border border-subtle bg-elevated text-secondary">
              Operaciones hoy
            </span>
          </div>

          <div className="my-4">
            <div className="text-2xl sm:text-3xl font-mono tabular-nums font-bold tracking-tight text-primary">
              {cantidadVentasHoy}{' '}
              <span className="text-sm font-sans font-medium text-muted">op.</span>
            </div>
            <span className="text-xs text-muted mt-1 block">
              Órdenes cobradas en el local
            </span>
          </div>

          <div className="pt-3 border-t border-subtle flex items-center justify-between text-xs font-sans text-secondary">
            <span>Estado del local:</span>
            <span className="text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              {cantidadVentasHoy > 0 ? 'Activo en curso' : 'Sin ventas hoy'}
            </span>
          </div>
        </motion.div>
      </motion.div>

      {/* Fila 2: Panel Dividido (70% Gráfico Volumen | 30% Alertas de Stock) */}
      <div className="grid grid-cols-1 lg:grid-cols-10 gap-6">
        {/* Columna Izquierda: Volumen de Ventas (70% -> lg:col-span-7) */}
        <div className="lg:col-span-7 rounded-xl border border-subtle bg-surface p-6 flex flex-col justify-between shadow-surface">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-subtle">
            <div>
              <span className="text-xs font-medium text-muted block">
                Evolución Comercial
              </span>
              <h2 className="text-base font-heading font-bold text-primary">
                Volumen de Ventas (Últimos 7 Días)
              </h2>
            </div>

            <div className="text-left sm:text-right">
              <span className="text-[11px] font-medium text-muted block">
                Total Acumulado
              </span>
              <span className="text-base font-mono tabular-nums font-bold text-primary">
                $ {totalSemanal.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
              </span>
            </div>
          </div>

          {/* Gráfico de Barras Interactivo */}
          <div className="mt-8 mb-4">
            {isLoadingDashboard ? (
              <div className="h-56 flex items-center justify-center text-xs font-sans text-muted">
                Cargando métricas de ventas...
              </div>
            ) : ventas7Dias.length === 0 ? (
              <div className="h-56 flex items-center justify-center text-xs font-sans text-muted">
                Sin registros de ventas en los últimos 7 días.
              </div>
            ) : (
              <div className="grid grid-cols-7 gap-2 sm:gap-4 items-end h-56 pt-8">
                {ventas7Dias.map((v, idx) => {
                  const alturaPorcentaje =
                    maxVenta7Dias > 0
                      ? Math.max(Math.round((v.total / maxVenta7Dias) * 100), 6)
                      : 6;
                  const esHoy = idx === ventas7Dias.length - 1;

                  return (
                    <div
                      key={v.fecha}
                      className="flex flex-col items-center h-full justify-end group"
                    >
                      {/* Tooltip con valor al hacer hover */}
                      <div className="opacity-0 group-hover:opacity-100 transition-opacity text-[11px] font-mono tabular-nums font-semibold text-primary bg-elevated border border-subtle px-2 py-0.5 rounded-md mb-1.5 pointer-events-none whitespace-nowrap shadow-sm">
                        $ {v.total.toLocaleString('es-AR')}
                      </div>

                      {/* Barra con bordes redondeados */}
                      <div className="w-full max-w-[44px] bg-elevated/70 border border-subtle rounded-lg flex flex-col justify-end p-1 relative h-full overflow-hidden">
                        <div
                          style={{ height: `${alturaPorcentaje}%` }}
                          className={`w-full rounded-md transition-all duration-200 ${
                            esHoy
                              ? 'bg-amber-500 group-hover:bg-amber-400'
                              : 'bg-[var(--btn-primary-bg)] opacity-85 group-hover:opacity-100'
                          }`}
                        />
                      </div>

                      {/* Etiquetas de Día y Fecha */}
                      <div className="mt-2.5 text-center">
                        <span
                          className={`text-xs font-semibold block ${
                            esHoy ? 'text-amber-500 font-bold' : 'text-primary'
                          }`}
                        >
                          {v.diaSemana}
                        </span>
                        <span className="text-[11px] font-mono tabular-nums text-muted block">
                          {v.fecha.slice(5)}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div className="pt-3 border-t border-subtle flex items-center justify-between text-xs text-muted">
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-sm bg-amber-500 inline-block" />
              Barra ámbar = Jornada actual
            </span>
            <span>Ventas validadas en caja</span>
          </div>
        </div>

        {/* Columna Derecha: Alertas de Stock Crítico (30% -> lg:col-span-3) */}
        <div className="lg:col-span-3 rounded-xl border border-subtle bg-surface p-5 flex flex-col justify-between shadow-surface">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-subtle">
              <div className="flex items-center gap-2">
                <Fire size={18} weight="duotone" className="text-amber-500" />
                <h2 className="text-sm font-heading font-bold text-primary">
                  Alertas de Stock
                </h2>
              </div>
              <span
                className={`text-[11px] font-mono tabular-nums font-semibold px-2 py-0.5 rounded-md border ${
                  alertasStock.length > 0
                    ? 'border-amber-500/30 bg-amber-500/10 text-amber-600 dark:text-amber-400'
                    : 'border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                }`}
              >
                {alertasStock.length} críticos
              </span>
            </div>

            <p className="text-xs text-muted mt-2 mb-3">
              Variantes con stock físico ≤ 3 unidades
            </p>

            {/* Lista Compacta de Alertas con Scroll */}
            <div className="space-y-2 max-h-[380px] overflow-y-auto pr-1">
              {isLoadingAlertas ? (
                <div className="py-8 text-center text-xs text-muted">
                  Consultando niveles de stock...
                </div>
              ) : alertasStock.length === 0 ? (
                <div className="py-12 text-center flex flex-col items-center justify-center gap-2">
                  <CheckCircle size={32} weight="duotone" className="text-emerald-500" />
                  <span className="text-xs font-medium text-secondary">
                    Stock saludable en todo el catálogo
                  </span>
                </div>
              ) : (
                alertasStock.map((alerta) => {
                  const sinStock = alerta.stockFisico === 0;

                  return (
                    <div
                      key={alerta.varianteId}
                      className="rounded-lg border border-subtle bg-elevated/50 hover:bg-elevated p-2.5 flex items-center justify-between gap-3 transition-fast"
                    >
                      {/* Miniatura y Detalle del Producto */}
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="w-9 h-9 rounded-lg border border-subtle bg-surface shrink-0 overflow-hidden flex items-center justify-center relative">
                          {alerta.imagenUrl ? (
                            <img
                              src={alerta.imagenUrl}
                              alt={alerta.nombreProducto}
                              className="w-full h-full object-cover"
                              loading="lazy"
                              onError={(e) => {
                                e.currentTarget.style.display = 'none';
                                const fb =
                                  e.currentTarget.parentElement?.querySelector('.alt-fb');
                                if (fb) fb.classList.remove('hidden');
                              }}
                            />
                          ) : null}
                          <div
                            className={`w-full h-full flex items-center justify-center text-muted bg-elevated ${
                              alerta.imagenUrl ? 'hidden alt-fb' : ''
                            }`}
                          >
                            <ImageIcon size={15} weight="regular" />
                          </div>
                        </div>

                        <div className="truncate">
                          <span className="text-xs font-semibold text-primary block truncate">
                            {alerta.nombreProducto}
                          </span>
                          <div className="flex items-center gap-1.5 mt-0.5 text-[11px]">
                            <span className="font-mono tabular-nums text-amber-600 dark:text-amber-400 font-semibold">
                              Talle {alerta.talle}
                            </span>
                            <span className="text-muted">·</span>
                            <span className="text-secondary truncate">{alerta.color}</span>
                          </div>
                        </div>
                      </div>

                      {/* Badge de Stock Físico */}
                      <div className="text-right shrink-0">
                        <span
                          className={`text-[11px] font-mono tabular-nums font-bold px-2 py-0.5 rounded-md border block text-center ${
                            sinStock
                              ? 'border-red-500/30 bg-red-500/10 text-red-600 dark:text-red-400'
                              : 'border-amber-500/30 bg-amber-500/10 text-amber-600 dark:text-amber-400'
                          }`}
                        >
                          {sinStock ? 'Agotado' : `${alerta.stockFisico} u.`}
                        </span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          <div className="pt-3 border-t border-subtle mt-4">
            <Link
              to="/admin/inventario"
              className="w-full py-2 rounded-lg border border-subtle bg-elevated hover:bg-surface hover:border-strong text-xs font-semibold text-center block text-primary transition-fast"
            >
              Gestionar Reposición en Inventario
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};
