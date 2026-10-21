import React, { useState, useMemo } from 'react';
import { motion } from 'motion/react';
import { useQuery } from '@tanstack/react-query';
import {
  Receipt,
  ArrowClockwise,
  CheckCircle,
  Warning,
  MagnifyingGlass,
  TrendDown,
} from '@phosphor-icons/react';
import { arqueosApi } from '../api/arqueosApi';
import { Button } from '../../../components/ui/Button';
import { ArqueoAccordionItem } from '../components/ArqueoAccordionItem';

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

export const ArqueosPage: React.FC = () => {
  const [busqueda, setBusqueda] = useState('');
  const [filtroEstado, setFiltroEstado] = useState<'TODOS' | 'CUADRADA' | 'FALTANTE' | 'SOBRANTE'>('TODOS');
  const [filtroTurno, setFiltroTurno] = useState<'TODOS' | 'Turno Mañana' | 'Turno Tarde'>('TODOS');
  const [expandedTurnoId, setExpandedTurnoId] = useState<number | null>(null);

  const {
    data: arqueos = [],
    isLoading,
    isRefetching,
    refetch,
  } = useQuery({
    queryKey: ['admin-historial-arqueos'],
    queryFn: arqueosApi.obtenerArqueos,
    refetchInterval: 60000,
  });

  const formatearDinero = (monto: number) => {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS',
      minimumFractionDigits: 2,
    }).format(monto);
  };

  const formatearFecha = (fechaStr: string | null) => {
    if (!fechaStr) return 'En curso';
    const d = new Date(fechaStr);
    return new Intl.DateTimeFormat('es-AR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(d);
  };

  const formatearSoloHora = (fechaStr: string | null) => {
    if (!fechaStr) return '-';
    const d = new Date(fechaStr);
    return new Intl.DateTimeFormat('es-AR', {
      hour: '2-digit',
      minute: '2-digit',
    }).format(d);
  };

  const toggleAcordeon = (id: number) => {
    setExpandedTurnoId((prev) => (prev === id ? null : id));
  };

  const arqueosFiltrados = useMemo(() => {
    return arqueos.filter((a) => {
      if (filtroEstado !== 'TODOS' && a.estadoDiferencia !== filtroEstado) {
        return false;
      }
      if (filtroTurno !== 'TODOS' && a.turno !== filtroTurno) {
        return false;
      }
      if (busqueda.trim()) {
        const query = busqueda.toLowerCase().trim();
        const coincideOperador = a.operador.toLowerCase().includes(query);
        const coincideId = a.turnoId.toString().includes(query);
        const coincideTurno = a.turno.toLowerCase().includes(query);
        return coincideOperador || coincideId || coincideTurno;
      }
      return true;
    });
  }, [arqueos, filtroEstado, filtroTurno, busqueda]);

  const metrics = useMemo(() => {
    const total = arqueos.length;
    const cuadradas = arqueos.filter((a) => a.estadoDiferencia === 'CUADRADA').length;
    const faltantes = arqueos.filter((a) => a.estadoDiferencia === 'FALTANTE').length;
    const sobrantes = arqueos.filter((a) => a.estadoDiferencia === 'SOBRANTE').length;
    const totalGastos = arqueos.reduce((acc, a) => acc + a.gastosTurno, 0);
    const totalDiferenciaFaltante = arqueos
      .filter((a) => a.diferencia < 0)
      .reduce((acc, a) => acc + Math.abs(a.diferencia), 0);

    return {
      total,
      cuadradas,
      faltantes,
      sobrantes,
      totalGastos,
      totalDiferenciaFaltante,
    };
  }, [arqueos]);

  return (
    <div className="p-6 md:p-8 space-y-6 max-w-[1600px] mx-auto w-full">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-5 border-b border-subtle">
        <div>
          <span className="text-xs font-medium text-amber-500 block">
            Auditoría &amp; Flujo de Efectivo
          </span>
          <h1 className="font-heading font-extrabold text-2xl md:text-3xl text-primary tracking-tight">
            Control de Arqueos y Gastos
          </h1>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => refetch()}
            disabled={isRefetching}
            title="Refrescar auditoría de turnos"
          >
            <ArrowClockwise
              size={15}
              weight="regular"
              className={isRefetching ? 'animate-spin text-amber-500' : 'text-secondary'}
            />
            <span>{isRefetching ? 'Actualizando...' : 'Refrescar'}</span>
          </Button>
        </div>
      </div>

      {/* Tarjetas KPI de Auditoría */}
      <motion.div variants={containerVariants} initial="hidden" animate="visible" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <motion.div variants={itemVariants} className="rounded-xl border border-subtle bg-surface p-5 shadow-surface">
          <div className="flex items-center justify-between text-secondary mb-3">
            <span className="text-xs font-semibold">Turnos Auditados</span>
            <Receipt size={18} weight="duotone" className="text-amber-500" />
          </div>
          <div className="font-mono tabular-nums font-bold text-3xl text-primary tracking-tight">
            {metrics.total}
          </div>
          <p className="text-xs text-muted mt-1 font-sans">
            Historial completo de turnos cerrados
          </p>
        </motion.div>

        <motion.div variants={itemVariants} className="rounded-xl border border-subtle bg-surface p-5 shadow-surface">
          <div className="flex items-center justify-between text-secondary mb-3">
            <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">
              Cajas Cuadradas
            </span>
            <CheckCircle size={18} weight="duotone" className="text-emerald-500" />
          </div>
          <div className="font-mono tabular-nums font-bold text-3xl text-emerald-600 dark:text-emerald-400 tracking-tight">
            {metrics.cuadradas}
          </div>
          <p className="text-xs text-muted mt-1 font-sans">
            {metrics.total > 0
              ? `${Math.round((metrics.cuadradas / metrics.total) * 100)}% de efectividad`
              : 'Sin registros'}
          </p>
        </motion.div>

        <motion.div variants={itemVariants} className="rounded-xl border border-subtle bg-surface p-5 shadow-surface">
          <div className="flex items-center justify-between text-secondary mb-3">
            <span className="text-xs font-semibold text-red-500">Desvíos / Faltantes</span>
            <Warning size={18} weight="duotone" className="text-red-500" />
          </div>
          <div className="font-mono tabular-nums font-bold text-3xl text-red-500 tracking-tight">
            {metrics.faltantes}
          </div>
          <p className="text-xs text-muted mt-1 font-mono tabular-nums">
            Acumulado: −{formatearDinero(metrics.totalDiferenciaFaltante)}
          </p>
        </motion.div>

        <motion.div variants={itemVariants} className="rounded-xl border border-subtle bg-surface p-5 shadow-surface">
          <div className="flex items-center justify-between text-secondary mb-3">
            <span className="text-xs font-semibold text-amber-500">Gastos de Turno</span>
            <TrendDown size={18} weight="duotone" className="text-amber-500" />
          </div>
          <div className="font-mono tabular-nums font-bold text-2xl text-amber-500 tracking-tight">
            {formatearDinero(metrics.totalGastos)}
          </div>
          <p className="text-xs text-muted mt-1 font-sans">
            Retiros de efectivo (Uber, almuerzos, insumos)
          </p>
        </motion.div>
      </motion.div>

      {/* Barra de Filtros y Búsqueda */}
      <div className="rounded-xl border border-subtle bg-surface p-4 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 shadow-surface">
        <div className="relative flex-1 max-w-md">
          <MagnifyingGlass
            size={16}
            weight="regular"
            className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted"
          />
          <input
            type="text"
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            placeholder="Buscar por operador o ID de turno..."
            className="w-full bg-elevated focus:bg-surface border border-subtle focus:border-amber-500/80 focus:ring-2 focus:ring-amber-500/20 rounded-lg text-primary text-xs md:text-sm font-sans pl-10 pr-4 py-2 placeholder:text-muted outline-none transition-fast"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Segmented Control Estado */}
          <div className="flex items-center gap-1 rounded-lg border border-subtle bg-elevated p-1 relative">
            {(['TODOS', 'CUADRADA', 'FALTANTE', 'SOBRANTE'] as const).map((estado) => {
              const activo = filtroEstado === estado;
              return (
                <button
                  key={estado}
                  type="button"
                  onClick={() => setFiltroEstado(estado)}
                  className={`relative px-2.5 py-1 text-xs font-sans font-semibold rounded-md transition-colors cursor-pointer ${
                    activo
                      ? 'text-primary'
                      : 'text-secondary hover:text-primary'
                  }`}
                >
                  {activo && (
                    <motion.div
                      layoutId="arqueos-filtro-estado-pill"
                      className="absolute inset-0 bg-surface rounded-md shadow-xs border border-subtle"
                      transition={{ type: 'spring', stiffness: 500, damping: 35 }}
                    />
                  )}
                  <span className="relative z-10">
                    {estado === 'TODOS'
                      ? 'Todos'
                      : estado === 'CUADRADA'
                      ? 'Cuadrada'
                      : estado === 'FALTANTE'
                      ? 'Faltante'
                      : 'Sobrante'}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Segmented Control Horario */}
          <div className="flex items-center gap-1 rounded-lg border border-subtle bg-elevated p-1 relative">
            {(['TODOS', 'Turno Mañana', 'Turno Tarde'] as const).map((t) => {
              const activo = filtroTurno === t;
              return (
                <button
                  key={t}
                  type="button"
                  onClick={() => setFiltroTurno(t)}
                  className={`relative px-2.5 py-1 text-xs font-sans font-semibold rounded-md transition-colors cursor-pointer ${
                    activo
                      ? 'text-primary'
                      : 'text-secondary hover:text-primary'
                  }`}
                >
                  {activo && (
                    <motion.div
                      layoutId="arqueos-filtro-turno-pill"
                      className="absolute inset-0 bg-surface rounded-md shadow-xs border border-subtle"
                      transition={{ type: 'spring', stiffness: 500, damping: 35 }}
                    />
                  )}
                  <span className="relative z-10">
                    {t === 'TODOS' ? 'Todos' : t === 'Turno Mañana' ? 'Mañana' : 'Tarde'}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Lista Master-Detail / Accordion de Arqueos */}
      {isLoading ? (
        <div className="rounded-xl border border-subtle bg-surface p-12 text-center space-y-3 shadow-surface">
          <ArrowClockwise size={28} weight="bold" className="animate-spin text-amber-500 mx-auto" />
          <p className="text-xs font-medium text-secondary">
            Cargando historial de arqueos...
          </p>
        </div>
      ) : arqueosFiltrados.length === 0 ? (
        <div className="rounded-xl border border-subtle bg-surface p-12 text-center space-y-3 shadow-surface">
          <Receipt size={36} weight="duotone" className="text-muted mx-auto" />
          <p className="text-xs font-medium text-secondary">
            No se encontraron registros de arqueo con los filtros actuales
          </p>
          {(busqueda || filtroEstado !== 'TODOS' || filtroTurno !== 'TODOS') && (
            <button
              onClick={() => {
                setBusqueda('');
                setFiltroEstado('TODOS');
                setFiltroTurno('TODOS');
              }}
              className="text-xs font-semibold text-amber-500 underline cursor-pointer"
            >
              Restablecer filtros
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {arqueosFiltrados.map((arqueo) => (
            <ArqueoAccordionItem
              key={arqueo.turnoId}
              arqueo={arqueo}
              isExpanded={expandedTurnoId === arqueo.turnoId}
              onToggle={toggleAcordeon}
              formatearDinero={formatearDinero}
              formatearFecha={formatearFecha}
              formatearSoloHora={formatearSoloHora}
            />
          ))}
        </div>
      )}
    </div>
  );
};
