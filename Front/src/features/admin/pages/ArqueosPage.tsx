import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Receipt,
  ArrowClockwise,
  CheckCircle,
  WarningCircle,
  Warning,
  CaretDown,
  CaretUp,
  MagnifyingGlass,
  Money,
  CreditCard,
  Bank,
  TrendUp,
  TrendDown,
  Vault,
  User,
} from '@phosphor-icons/react';
import { arqueosApi } from '../api/arqueosApi';
import { Button } from '../../../components/ui/Button';

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
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-xl border border-subtle bg-surface p-5 shadow-surface">
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
        </div>

        <div className="rounded-xl border border-subtle bg-surface p-5 shadow-surface">
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
        </div>

        <div className="rounded-xl border border-subtle bg-surface p-5 shadow-surface">
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
        </div>

        <div className="rounded-xl border border-subtle bg-surface p-5 shadow-surface">
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
        </div>
      </div>

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
          <div className="flex items-center gap-1 rounded-lg border border-subtle bg-elevated p-1">
            {(['TODOS', 'CUADRADA', 'FALTANTE', 'SOBRANTE'] as const).map((estado) => (
              <button
                key={estado}
                type="button"
                onClick={() => setFiltroEstado(estado)}
                className={`px-2.5 py-1 text-xs font-sans font-semibold rounded-md transition-fast cursor-pointer ${
                  filtroEstado === estado
                    ? 'bg-surface text-primary shadow-sm'
                    : 'text-secondary hover:text-primary'
                }`}
              >
                {estado === 'TODOS'
                  ? 'Todos'
                  : estado === 'CUADRADA'
                  ? 'Cuadrada'
                  : estado === 'FALTANTE'
                  ? 'Faltante'
                  : 'Sobrante'}
              </button>
            ))}
          </div>

          {/* Segmented Control Horario */}
          <div className="flex items-center gap-1 rounded-lg border border-subtle bg-elevated p-1">
            {(['TODOS', 'Turno Mañana', 'Turno Tarde'] as const).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setFiltroTurno(t)}
                className={`px-2.5 py-1 text-xs font-sans font-semibold rounded-md transition-fast cursor-pointer ${
                  filtroTurno === t
                    ? 'bg-surface text-primary shadow-sm'
                    : 'text-secondary hover:text-primary'
                }`}
              >
                {t === 'TODOS' ? 'Todos' : t === 'Turno Mañana' ? 'Mañana' : 'Tarde'}
              </button>
            ))}
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
          {arqueosFiltrados.map((arqueo) => {
            const isExpanded = expandedTurnoId === arqueo.turnoId;
            const esCuadrada = arqueo.estadoDiferencia === 'CUADRADA';
            const esFaltante = arqueo.estadoDiferencia === 'FALTANTE';
            const esSobrante = arqueo.estadoDiferencia === 'SOBRANTE';

            return (
              <div
                key={arqueo.turnoId}
                className={`rounded-xl border transition-fast bg-surface shadow-surface overflow-hidden ${
                  isExpanded ? 'border-strong ring-1 ring-amber-500/20' : 'border-subtle hover:border-strong'
                }`}
              >
                {/* Cabecera del Accordion (Fila Master) */}
                <div
                  onClick={() => toggleAcordeon(arqueo.turnoId)}
                  className="p-4 md:p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4 cursor-pointer select-none hover:bg-elevated/30 transition-fast"
                >
                  <div className="flex items-start sm:items-center gap-4">
                    <div
                      className={`w-10 h-10 rounded-lg border flex items-center justify-center shrink-0 ${
                        esCuadrada
                          ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-500'
                          : esFaltante
                          ? 'border-red-500/30 bg-red-500/10 text-red-500'
                          : 'border-amber-500/30 bg-amber-500/10 text-amber-500'
                      }`}
                      title={`Estado: ${arqueo.estadoDiferencia}`}
                    >
                      {esCuadrada && <CheckCircle size={20} weight="duotone" />}
                      {esFaltante && <WarningCircle size={20} weight="duotone" />}
                      {esSobrante && <Warning size={20} weight="duotone" />}
                    </div>

                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-mono tabular-nums text-sm font-bold text-primary">
                          {formatearFecha(arqueo.fechaCierre || arqueo.fechaApertura)}
                        </span>
                        <span className="text-[11px] font-semibold px-2 py-0.5 rounded-md border border-subtle bg-elevated text-secondary">
                          {arqueo.turno}
                        </span>
                        <span className="text-xs font-mono tabular-nums text-muted">
                          ID #{arqueo.turnoId}
                        </span>
                      </div>

                      <div className="flex items-center gap-3 mt-1 text-xs text-secondary">
                        <span className="flex items-center gap-1.5 font-sans">
                          <User size={13} weight="duotone" />
                          <strong className="text-primary font-semibold">{arqueo.operador}</strong>
                        </span>
                        <span>·</span>
                        <span className="font-mono tabular-nums">
                          {arqueo.cantidadOrdenes}{' '}
                          {arqueo.cantidadOrdenes === 1 ? 'orden' : 'órdenes'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Info Financiera Sintética */}
                  <div className="flex items-center justify-between lg:justify-end gap-6 border-t lg:border-t-0 pt-3 lg:pt-0 border-subtle">
                    <div className="text-left lg:text-right">
                      <span className="text-[11px] font-medium text-muted block">
                        Ventas Totales
                      </span>
                      <span className="font-mono tabular-nums text-sm font-bold text-primary">
                        {formatearDinero(arqueo.totalVentas)}
                      </span>
                    </div>

                    <div className="text-left lg:text-right hidden sm:block">
                      <span className="text-[11px] font-medium text-muted block">
                        Efectivo Declarado
                      </span>
                      <span className="font-mono tabular-nums text-sm font-semibold text-secondary">
                        {formatearDinero(arqueo.efectivoRealDeclarado)}
                      </span>
                    </div>

                    <div className="shrink-0 text-right">
                      <span className="text-[11px] font-medium text-muted block mb-0.5">
                        Diferencia
                      </span>
                      <span
                        className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-mono tabular-nums font-bold border ${
                          esCuadrada
                            ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-600 dark:text-emerald-400'
                            : esFaltante
                            ? 'bg-red-500/10 border-red-500/30 text-red-600 dark:text-red-400'
                            : 'bg-amber-500/10 border-amber-500/30 text-amber-600 dark:text-amber-400'
                        }`}
                      >
                        {esCuadrada && 'Cuadrada · $0,00'}
                        {esFaltante && `Faltante · ${formatearDinero(arqueo.diferencia)}`}
                        {esSobrante && `Sobrante · +${formatearDinero(arqueo.diferencia)}`}
                      </span>
                    </div>

                    <div className="text-muted pl-2">
                      {isExpanded ? (
                        <CaretUp size={18} weight="bold" className="text-primary" />
                      ) : (
                        <CaretDown size={18} weight="bold" />
                      )}
                    </div>
                  </div>
                </div>

                {/* Desglose Financiero Detallado (Accordion Detail) */}
                {isExpanded && (
                  <div className="border-t border-subtle bg-elevated/40 p-5 md:p-6">
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
                      {/* COLUMNA 1: INGRESOS POR MÉTODO */}
                      <div className="rounded-xl border border-emerald-500/25 bg-surface p-5 flex flex-col justify-between shadow-surface">
                        <div>
                          <div className="flex items-center justify-between pb-3 mb-3 border-b border-subtle">
                            <div className="flex items-center gap-2">
                              <TrendUp size={16} weight="duotone" className="text-emerald-500" />
                              <h3 className="font-heading font-bold text-xs uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                                Ingresos por Método
                              </h3>
                            </div>
                            <span className="text-[11px] font-medium text-emerald-500">
                              Entradas
                            </span>
                          </div>

                          <div className="space-y-2.5 text-xs font-sans">
                            <div className="flex items-center justify-between py-1.5 border-b border-subtle">
                              <span className="text-secondary flex items-center gap-2">
                                <Money size={15} className="text-emerald-500" />
                                Efectivo en Mostrador
                              </span>
                              <span className="text-emerald-600 dark:text-emerald-400 font-mono tabular-nums font-bold">
                                {formatearDinero(arqueo.totalEfectivo)}
                              </span>
                            </div>

                            <div className="flex items-center justify-between py-1.5 border-b border-subtle">
                              <span className="text-secondary flex items-center gap-2">
                                <Bank size={15} className="text-sky-500" />
                                Transferencia (Alias)
                              </span>
                              <span className="text-primary font-mono tabular-nums font-medium">
                                {formatearDinero(arqueo.totalTransferencia)}
                              </span>
                            </div>

                            <div className="flex items-center justify-between py-1.5 border-b border-subtle">
                              <span className="text-secondary flex items-center gap-2">
                                <CreditCard size={15} className="text-amber-500" />
                                Tarjeta de Débito
                              </span>
                              <span className="text-primary font-mono tabular-nums font-medium">
                                {formatearDinero(arqueo.totalDebito)}
                              </span>
                            </div>

                            <div className="flex items-center justify-between py-1.5 border-b border-subtle">
                              <span className="text-secondary flex items-center gap-2">
                                <CreditCard size={15} className="text-indigo-500" />
                                Tarjeta de Crédito / Posnet
                              </span>
                              <span className="text-primary font-mono tabular-nums font-medium">
                                {formatearDinero(arqueo.totalCredito)}
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="pt-4 mt-4 border-t border-subtle">
                          <div className="flex items-center justify-between text-xs font-bold">
                            <span className="text-emerald-600 dark:text-emerald-400">
                              Total Facturado
                            </span>
                            <span className="text-emerald-600 dark:text-emerald-300 font-mono tabular-nums text-sm">
                              {formatearDinero(arqueo.totalVentas)}
                            </span>
                          </div>
                          <span className="text-[11px] text-muted font-sans mt-1 block">
                            Suma bruta de cobros en los diferentes medios de pago.
                          </span>
                        </div>
                      </div>

                      {/* COLUMNA 2: SALIDAS Y RETIROS */}
                      <div className="rounded-xl border border-red-500/25 bg-surface p-5 flex flex-col justify-between shadow-surface">
                        <div>
                          <div className="flex items-center justify-between pb-3 mb-3 border-b border-subtle">
                            <div className="flex items-center gap-2">
                              <TrendDown size={16} weight="duotone" className="text-red-500" />
                              <h3 className="font-heading font-bold text-xs uppercase tracking-wider text-red-500">
                                Salidas del Turno
                              </h3>
                            </div>
                            <span className="text-[11px] font-medium text-red-500">Retiros</span>
                          </div>

                          <div className="space-y-2.5 text-xs font-sans">
                            <div className="flex items-center justify-between py-1.5 border-b border-subtle">
                              <span className="text-secondary">
                                Gastos Operativos (Uber, Almuerzo)
                              </span>
                              <span className="text-red-500 font-mono tabular-nums font-bold">
                                {arqueo.gastosTurno > 0
                                  ? `−${formatearDinero(arqueo.gastosTurno)}`
                                  : '$ 0,00'}
                              </span>
                            </div>

                            <div className="flex items-center justify-between py-1.5 border-b border-subtle">
                              <span className="text-secondary">
                                Retiros de Caja Fuerte / Dueño
                              </span>
                              <span className="text-muted font-mono tabular-nums">$ 0,00</span>
                            </div>

                            <div className="flex items-center justify-between py-1.5 border-b border-subtle">
                              <span className="text-secondary">Insumos de Mostrador</span>
                              <span className="text-muted font-mono tabular-nums">$ 0,00</span>
                            </div>
                          </div>
                        </div>

                        <div className="pt-4 mt-4 border-t border-subtle">
                          <div className="flex items-center justify-between text-xs font-bold">
                            <span className="text-red-500">Total Gastos Turno</span>
                            <span className="text-red-500 font-mono tabular-nums text-sm">
                              {arqueo.gastosTurno > 0
                                ? `−${formatearDinero(arqueo.gastosTurno)}`
                                : '$ 0,00'}
                            </span>
                          </div>
                          <span className="text-[11px] text-muted font-sans mt-1 block">
                            Efectivo retirado de la gaveta durante el horario laboral.
                          </span>
                        </div>
                      </div>

                      {/* COLUMNA 3: AUDITORÍA & CONCILIACIÓN DE CAJA */}
                      <div className="rounded-xl border border-subtle bg-surface p-5 flex flex-col justify-between shadow-surface">
                        <div>
                          <div className="flex items-center justify-between pb-3 mb-3 border-b border-subtle">
                            <div className="flex items-center gap-2">
                              <Vault size={16} weight="duotone" className="text-amber-500" />
                              <h3 className="font-heading font-bold text-xs uppercase tracking-wider text-primary">
                                Balance &amp; Conciliación
                              </h3>
                            </div>
                            <span className="text-[11px] font-medium text-muted">
                              Gaveta Física
                            </span>
                          </div>

                          <div className="space-y-2 text-xs font-sans">
                            <div className="flex items-center justify-between py-0.5 text-secondary">
                              <span>Saldo Inicial (Apertura):</span>
                              <span className="text-primary font-mono tabular-nums">
                                {formatearDinero(arqueo.saldoInicial)}
                              </span>
                            </div>

                            <div className="flex items-center justify-between py-0.5 text-secondary">
                              <span>(+) Ventas en Efectivo:</span>
                              <span className="text-emerald-600 dark:text-emerald-400 font-mono tabular-nums">
                                +{formatearDinero(arqueo.totalEfectivo)}
                              </span>
                            </div>

                            <div className="flex items-center justify-between py-0.5 text-secondary">
                              <span>(−) Gastos de Turno:</span>
                              <span className="text-red-500 font-mono tabular-nums">
                                {arqueo.gastosTurno > 0
                                  ? `−${formatearDinero(arqueo.gastosTurno)}`
                                  : '$ 0,00'}
                              </span>
                            </div>

                            <div className="flex items-center justify-between py-2 border-t border-b border-subtle font-bold text-primary">
                              <span>(=) Efectivo Esperado:</span>
                              <span className="text-amber-500 font-mono tabular-nums">
                                {formatearDinero(arqueo.efectivoEsperado)}
                              </span>
                            </div>

                            <div className="flex items-center justify-between py-1 text-secondary">
                              <span>Efectivo Real Declarado:</span>
                              <span className="text-primary font-mono tabular-nums font-bold text-sm">
                                {formatearDinero(arqueo.efectivoRealDeclarado)}
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="mt-4 pt-3">
                          <div
                            className={`p-3.5 rounded-xl border text-center ${
                              esCuadrada
                                ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-600 dark:text-emerald-400'
                                : esFaltante
                                ? 'bg-red-500/10 border-red-500/40 text-red-600 dark:text-red-400'
                                : 'bg-amber-500/10 border-amber-500/40 text-amber-600 dark:text-amber-400'
                            }`}
                          >
                            <span className="text-[10px] font-bold uppercase tracking-wider block mb-0.5">
                              {esCuadrada
                                ? 'Auditoría Conforme'
                                : esFaltante
                                ? 'Alerta de Faltante'
                                : 'Registro de Sobrante'}
                            </span>
                            <div className="font-mono tabular-nums font-bold text-lg tracking-tight">
                              {esCuadrada && 'Caja Cuadrada ($ 0,00)'}
                              {esFaltante && `Faltante: ${formatearDinero(arqueo.diferencia)}`}
                              {esSobrante && `Sobrante: +${formatearDinero(arqueo.diferencia)}`}
                            </div>
                          </div>

                          <div className="mt-3 flex items-center justify-between text-[11px] font-mono tabular-nums text-muted pt-2 border-t border-subtle">
                            <span>Apertura: {formatearSoloHora(arqueo.fechaApertura)}</span>
                            <span>·</span>
                            <span>Cierre: {formatearSoloHora(arqueo.fechaCierre)}</span>
                            <span>·</span>
                            <span>{arqueo.operador}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
