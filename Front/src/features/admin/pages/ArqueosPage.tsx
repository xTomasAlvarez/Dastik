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

export const ArqueosPage: React.FC = () => {
  // Filtros y Búsqueda
  const [busqueda, setBusqueda] = useState('');
  const [filtroEstado, setFiltroEstado] = useState<'TODOS' | 'CUADRADA' | 'FALTANTE' | 'SOBRANTE'>('TODOS');
  const [filtroTurno, setFiltroTurno] = useState<'TODOS' | 'Turno Mañana' | 'Turno Tarde'>('TODOS');
  
  // Estado para acordeón (ID del turno expandido, o null si ninguno)
  const [expandedTurnoId, setExpandedTurnoId] = useState<number | null>(null);

  // Consulta de Arqueos
  const {
    data: arqueos = [],
    isLoading,
    isRefetching,
    refetch,
  } = useQuery({
    queryKey: ['admin-historial-arqueos'],
    queryFn: arqueosApi.obtenerArqueos,
    refetchInterval: 60000, // Refresco cada 60 segundos
  });

  // Helpers de Formato
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

  // Toggle de acordeón
  const toggleAcordeon = (id: number) => {
    setExpandedTurnoId((prev) => (prev === id ? null : id));
  };

  // Filtrado de Arqueos
  const arqueosFiltrados = useMemo(() => {
    return arqueos.filter((a) => {
      // Filtro por Estado de Diferencia
      if (filtroEstado !== 'TODOS' && a.estadoDiferencia !== filtroEstado) {
        return false;
      }

      // Filtro por Turno (Mañana / Tarde)
      if (filtroTurno !== 'TODOS' && a.turno !== filtroTurno) {
        return false;
      }

      // Búsqueda por Operador o ID de Turno
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

  // Métricas Globales de Arqueos
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
    <div className="p-6 md:p-8 space-y-6">
      {/* Header Avant-Garde */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-4 border-b border-[#222222]">
        <div>
          <span className="text-[10px] font-mono uppercase tracking-[0.25em] text-[#71717A]">
            AUDITORÍA & FLUJO DE EFECTIVO
          </span>
          <h1 className="font-heading font-extrabold text-2xl md:text-3xl text-[#FAFAFA] tracking-tight uppercase">
            CONTROL DE ARQUEOS Y GASTOS
          </h1>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => refetch()}
            disabled={isRefetching}
            className="border border-[#333333] bg-[#0E0E0E] hover:bg-[#1A1A1A] text-[#FAFAFA] px-3.5 py-2 text-xs font-mono uppercase tracking-wider flex items-center gap-2 transition-fast disabled:opacity-50"
            title="Refrescar auditoría de turnos"
          >
            <ArrowClockwise
              size={15}
              weight="light"
              className={isRefetching ? 'animate-spin text-amber-400' : 'text-[#71717A]'}
            />
            <span>{isRefetching ? 'ACTUALIZANDO...' : 'REFRESCAR'}</span>
          </button>
        </div>
      </div>

      {/* Tarjetas KPI Avant-Garde de Auditoría */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* KPI 1: Total Arqueos Auditados */}
        <div className="border border-[#222222] bg-[#090909] p-5">
          <div className="flex items-center justify-between text-[#71717A] mb-3">
            <span className="text-[10px] uppercase font-mono tracking-widest">TURNOS AUDITADOS</span>
            <Receipt size={18} weight="light" />
          </div>
          <div className="font-heading font-bold text-3xl text-[#FAFAFA] tracking-tight">
            {metrics.total}
          </div>
          <p className="text-[11px] text-[#71717A] mt-1 font-sans">
            Historial completo de turnos cerrados
          </p>
        </div>

        {/* KPI 2: Cajas Cuadradas */}
        <div className="border border-[#222222] bg-[#090909] p-5">
          <div className="flex items-center justify-between text-[#71717A] mb-3">
            <span className="text-[10px] uppercase font-mono tracking-widest text-emerald-400">CAJAS CUADRADAS</span>
            <CheckCircle size={18} weight="light" className="text-emerald-400" />
          </div>
          <div className="font-heading font-bold text-3xl text-emerald-400 tracking-tight">
            {metrics.cuadradas}
          </div>
          <p className="text-[11px] text-[#71717A] mt-1 font-sans">
            {metrics.total > 0 ? `${Math.round((metrics.cuadradas / metrics.total) * 100)}% de efectividad` : 'Sin registros'}
          </p>
        </div>

        {/* KPI 3: Faltantes / Desvíos */}
        <div className="border border-[#222222] bg-[#090909] p-5">
          <div className="flex items-center justify-between text-[#71717A] mb-3">
            <span className="text-[10px] uppercase font-mono tracking-widest text-rose-400">DESVÍOS / FALTANTES</span>
            <Warning size={18} weight="light" className="text-rose-400" />
          </div>
          <div className="font-heading font-bold text-3xl text-rose-400 tracking-tight">
            {metrics.faltantes}
          </div>
          <p className="text-[11px] text-[#71717A] mt-1 font-mono">
            Acumulado: -{formatearDinero(metrics.totalDiferenciaFaltante)}
          </p>
        </div>

        {/* KPI 4: Total Gastos de Caja */}
        <div className="border border-[#222222] bg-[#090909] p-5">
          <div className="flex items-center justify-between text-[#71717A] mb-3">
            <span className="text-[10px] uppercase font-mono tracking-widest text-amber-400">GASTOS DE TURNO</span>
            <TrendDown size={18} weight="light" className="text-amber-400" />
          </div>
          <div className="font-heading font-bold text-2xl text-amber-400 tracking-tight font-mono">
            {formatearDinero(metrics.totalGastos)}
          </div>
          <p className="text-[11px] text-[#71717A] mt-1 font-sans">
            Retiros de efectivo (Uber, almuerzos, insumos)
          </p>
        </div>
      </div>

      {/* Barra de Filtros y Búsqueda */}
      <div className="border border-[#222222] bg-[#090909] p-4 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
        {/* Input de Búsqueda */}
        <div className="relative flex-1 max-w-md">
          <MagnifyingGlass
            size={16}
            weight="light"
            className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#71717A]"
          />
          <input
            type="text"
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            placeholder="Buscar por operador o ID de turno..."
            className="w-full bg-[#000000] border border-[#333333] focus:border-[#FAFAFA] text-[#FAFAFA] text-xs font-mono pl-10 pr-4 py-2.5 placeholder:text-[#555555] outline-none transition-fast"
          />
        </div>

        {/* Filtros de Estado */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1 border border-[#333333] bg-[#000000] p-1">
            <span className="text-[10px] font-mono uppercase text-[#71717A] px-2">ESTADO:</span>
            {(['TODOS', 'CUADRADA', 'FALTANTE', 'SOBRANTE'] as const).map((estado) => (
              <button
                key={estado}
                onClick={() => setFiltroEstado(estado)}
                className={`px-2.5 py-1 text-[10px] font-mono uppercase tracking-wider transition-fast ${
                  filtroEstado === estado
                    ? estado === 'CUADRADA'
                      ? 'bg-emerald-950 text-emerald-400 border border-emerald-600/50'
                      : estado === 'FALTANTE'
                      ? 'bg-rose-950 text-rose-400 border border-rose-600/50'
                      : estado === 'SOBRANTE'
                      ? 'bg-amber-950 text-amber-400 border border-amber-600/50'
                      : 'bg-[#FAFAFA] text-[#000000]'
                    : 'text-[#71717A] hover:text-[#FAFAFA]'
                }`}
              >
                {estado}
              </button>
            ))}
          </div>

          {/* Filtro de Turno */}
          <div className="flex items-center gap-1 border border-[#333333] bg-[#000000] p-1">
            <span className="text-[10px] font-mono uppercase text-[#71717A] px-2">HORARIO:</span>
            {(['TODOS', 'Turno Mañana', 'Turno Tarde'] as const).map((t) => (
              <button
                key={t}
                onClick={() => setFiltroTurno(t)}
                className={`px-2.5 py-1 text-[10px] font-mono uppercase tracking-wider transition-fast ${
                  filtroTurno === t
                    ? 'bg-[#FAFAFA] text-[#000000]'
                    : 'text-[#71717A] hover:text-[#FAFAFA]'
                }`}
              >
                {t === 'TODOS' ? 'TODOS' : t === 'Turno Mañana' ? 'MAÑANA' : 'TARDE'}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Lista Master-Detail / Accordion de Arqueos */}
      {isLoading ? (
        <div className="border border-[#222222] bg-[#090909] p-12 text-center space-y-3">
          <ArrowClockwise size={28} weight="light" className="animate-spin text-[#71717A] mx-auto" />
          <p className="text-xs font-mono uppercase tracking-widest text-[#71717A]">
            CARGANDO HISTORIAL DE ARQUEOS...
          </p>
        </div>
      ) : arqueosFiltrados.length === 0 ? (
        <div className="border border-[#222222] bg-[#090909] p-12 text-center space-y-3">
          <Receipt size={36} weight="light" className="text-[#333333] mx-auto" />
          <p className="text-xs font-mono uppercase tracking-widest text-[#71717A]">
            NO SE ENCONTRARON REGISTROS DE ARQUEO CON LOS FILTROS ACTUALES
          </p>
          {(busqueda || filtroEstado !== 'TODOS' || filtroTurno !== 'TODOS') && (
            <button
              onClick={() => {
                setBusqueda('');
                setFiltroEstado('TODOS');
                setFiltroTurno('TODOS');
              }}
              className="text-xs font-mono text-[#FAFAFA] underline hover:text-emerald-400 transition-fast"
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
                className={`border transition-fast bg-[#090909] ${
                  isExpanded ? 'border-[#555555]' : 'border-[#222222] hover:border-[#333333]'
                }`}
              >
                {/* Cabecera del Accordion (Fila Master) */}
                <div
                  onClick={() => toggleAcordeon(arqueo.turnoId)}
                  className="p-4 md:p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4 cursor-pointer select-none"
                >
                  {/* Info Primaria: Estado, Fecha, Operador, Turno */}
                  <div className="flex items-start sm:items-center gap-4">
                    {/* Indicador de Estado */}
                    <div
                      className={`w-9 h-9 border flex items-center justify-center shrink-0 ${
                        esCuadrada
                          ? 'border-emerald-600/50 bg-emerald-950/40 text-emerald-400'
                          : esFaltante
                          ? 'border-rose-600/50 bg-rose-950/40 text-rose-400'
                          : 'border-amber-600/50 bg-amber-950/40 text-amber-400'
                      }`}
                      title={`Estado: ${arqueo.estadoDiferencia}`}
                    >
                      {esCuadrada && <CheckCircle size={20} weight="bold" />}
                      {esFaltante && <WarningCircle size={20} weight="bold" />}
                      {esSobrante && <Warning size={20} weight="bold" />}
                    </div>

                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-mono text-sm font-bold text-[#FAFAFA]">
                          {formatearFecha(arqueo.fechaCierre || arqueo.fechaApertura)}
                        </span>
                        <span className="text-[10px] font-mono px-2 py-0.5 border border-[#333333] bg-[#111111] text-[#A1A1AA] uppercase">
                          {arqueo.turno}
                        </span>
                        <span className="text-[10px] font-mono text-[#71717A]">
                          ID #{arqueo.turnoId}
                        </span>
                      </div>

                      <div className="flex items-center gap-3 mt-1 text-xs text-[#71717A]">
                        <span className="flex items-center gap-1.5 font-sans">
                          <User size={13} weight="light" />
                          <strong className="text-[#FAFAFA] font-medium">{arqueo.operador}</strong>
                        </span>
                        <span>•</span>
                        <span className="font-mono">
                          {arqueo.cantidadOrdenes} {arqueo.cantidadOrdenes === 1 ? 'orden' : 'órdenes'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Info Financiera Sintética (Colapsada) */}
                  <div className="flex items-center justify-between lg:justify-end gap-6 border-t lg:border-t-0 pt-3 lg:pt-0 border-[#1A1A1A]">
                    {/* Ventas Totales */}
                    <div className="text-left lg:text-right">
                      <span className="text-[10px] font-mono uppercase tracking-widest text-[#71717A] block">
                        VENTAS TOTALES
                      </span>
                      <span className="font-mono text-sm font-bold text-[#FAFAFA]">
                        {formatearDinero(arqueo.totalVentas)}
                      </span>
                    </div>

                    {/* Efectivo Real Declarado */}
                    <div className="text-left lg:text-right hidden sm:block">
                      <span className="text-[10px] font-mono uppercase tracking-widest text-[#71717A] block">
                        EFECTIVO DECLARADO
                      </span>
                      <span className="font-mono text-sm font-medium text-[#A1A1AA]">
                        {formatearDinero(arqueo.efectivoRealDeclarado)}
                      </span>
                    </div>

                    {/* Badge Destacado de Diferencia */}
                    <div className="shrink-0 text-right">
                      <span className="text-[10px] font-mono uppercase tracking-widest text-[#71717A] block mb-0.5">
                        DIFERENCIA
                      </span>
                      <span
                        className={`inline-flex items-center gap-1.5 px-3 py-1 text-xs font-mono font-bold tracking-wider border ${
                          esCuadrada
                            ? 'bg-emerald-950/40 border-emerald-500 text-emerald-400'
                            : esFaltante
                            ? 'bg-rose-950/40 border-rose-500 text-rose-400'
                            : 'bg-amber-950/40 border-amber-500 text-amber-400'
                        }`}
                      >
                        {esCuadrada && 'CUADRADA · $0.00'}
                        {esFaltante && `FALTANTE · ${formatearDinero(arqueo.diferencia)}`}
                        {esSobrante && `SOBRANTE · +${formatearDinero(arqueo.diferencia)}`}
                      </span>
                    </div>

                    {/* Chevron Expandir */}
                    <div className="text-[#71717A] pl-2">
                      {isExpanded ? (
                        <CaretUp size={18} weight="bold" className="text-[#FAFAFA]" />
                      ) : (
                        <CaretDown size={18} weight="bold" />
                      )}
                    </div>
                  </div>
                </div>

                {/* Desglose Financiero Detallado (Accordion Detail) */}
                {isExpanded && (
                  <div className="border-t border-[#222222] bg-[#050505] p-5 md:p-6 animate-fadeIn">
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                      {/* COLUMNA 1: INGRESOS POR MÉTODO (Columna Verde) */}
                      <div className="border border-emerald-900/30 bg-[#08120b]/50 p-5 flex flex-col justify-between">
                        <div>
                          <div className="flex items-center justify-between pb-3 mb-3 border-b border-emerald-900/40">
                            <div className="flex items-center gap-2">
                              <TrendUp size={16} weight="light" className="text-emerald-400" />
                              <h3 className="font-heading font-bold text-xs uppercase tracking-wider text-emerald-400">
                                INGRESOS POR MÉTODO
                              </h3>
                            </div>
                            <span className="text-[10px] font-mono text-emerald-500/80 uppercase">
                              ENTRADAS
                            </span>
                          </div>

                          <div className="space-y-2.5 text-xs font-mono">
                            <div className="flex items-center justify-between py-1 border-b border-[#112215]">
                              <span className="text-[#A1A1AA] flex items-center gap-2">
                                <Money size={14} className="text-emerald-400" />
                                Efectivo en Mostrador
                              </span>
                              <span className="text-emerald-300 font-bold">
                                {formatearDinero(arqueo.totalEfectivo)}
                              </span>
                            </div>

                            <div className="flex items-center justify-between py-1 border-b border-[#112215]">
                              <span className="text-[#A1A1AA] flex items-center gap-2">
                                <Bank size={14} className="text-emerald-400" />
                                Transferencia (Alias)
                              </span>
                              <span className="text-[#FAFAFA]">
                                {formatearDinero(arqueo.totalTransferencia)}
                              </span>
                            </div>

                            <div className="flex items-center justify-between py-1 border-b border-[#112215]">
                              <span className="text-[#A1A1AA] flex items-center gap-2">
                                <CreditCard size={14} className="text-emerald-400" />
                                Tarjeta de Débito
                              </span>
                              <span className="text-[#FAFAFA]">
                                {formatearDinero(arqueo.totalDebito)}
                              </span>
                            </div>

                            <div className="flex items-center justify-between py-1 border-b border-[#112215]">
                              <span className="text-[#A1A1AA] flex items-center gap-2">
                                <CreditCard size={14} className="text-emerald-400" />
                                Tarjeta de Crédito / Posnet
                              </span>
                              <span className="text-[#FAFAFA]">
                                {formatearDinero(arqueo.totalCredito)}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Total Ingresos */}
                        <div className="pt-4 mt-4 border-t border-emerald-900/40">
                          <div className="flex items-center justify-between text-xs font-mono font-bold">
                            <span className="text-emerald-400 uppercase tracking-wider">
                              TOTAL FACTURADO
                            </span>
                            <span className="text-emerald-300 text-sm">
                              {formatearDinero(arqueo.totalVentas)}
                            </span>
                          </div>
                          <span className="text-[10px] text-emerald-500/70 font-sans mt-1 block">
                            Suma bruta de cobros en los diferentes medios de pago.
                          </span>
                        </div>
                      </div>

                      {/* COLUMNA 2: SALIDAS Y RETIROS (Columna Roja/Naranja) */}
                      <div className="border border-rose-900/30 bg-[#140809]/50 p-5 flex flex-col justify-between">
                        <div>
                          <div className="flex items-center justify-between pb-3 mb-3 border-b border-rose-900/40">
                            <div className="flex items-center gap-2">
                              <TrendDown size={16} weight="light" className="text-rose-400" />
                              <h3 className="font-heading font-bold text-xs uppercase tracking-wider text-rose-400">
                                SALIDAS DEL TURNO
                              </h3>
                            </div>
                            <span className="text-[10px] font-mono text-rose-500/80 uppercase">
                              RETIROS
                            </span>
                          </div>

                          <div className="space-y-2.5 text-xs font-mono">
                            <div className="flex items-center justify-between py-1 border-b border-[#251012]">
                              <span className="text-[#A1A1AA]">
                                Gastos Operativos (Uber, Almuerzo)
                              </span>
                              <span className="text-rose-400 font-bold">
                                {arqueo.gastosTurno > 0 ? `-${formatearDinero(arqueo.gastosTurno)}` : '$0.00'}
                              </span>
                            </div>

                            <div className="flex items-center justify-between py-1 border-b border-[#251012]">
                              <span className="text-[#A1A1AA]">
                                Retiros de Caja Fuerte / Dueño
                              </span>
                              <span className="text-[#71717A]">
                                $0.00
                              </span>
                            </div>

                            <div className="flex items-center justify-between py-1 border-b border-[#251012]">
                              <span className="text-[#A1A1AA]">
                                Insumos de Mostrador
                              </span>
                              <span className="text-[#71717A]">
                                $0.00
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Total Salidas */}
                        <div className="pt-4 mt-4 border-t border-rose-900/40">
                          <div className="flex items-center justify-between text-xs font-mono font-bold">
                            <span className="text-rose-400 uppercase tracking-wider">
                              TOTAL GASTOS TURNO
                            </span>
                            <span className="text-rose-400 text-sm">
                              {arqueo.gastosTurno > 0 ? `-${formatearDinero(arqueo.gastosTurno)}` : '$0.00'}
                            </span>
                          </div>
                          <span className="text-[10px] text-rose-500/70 font-sans mt-1 block">
                            Dinero en efectivo retirado de la gaveta durante el horario laboral.
                          </span>
                        </div>
                      </div>

                      {/* COLUMNA 3: AUDITORÍA & CONCILIACIÓN DE CAJA (Recuadro Destacado) */}
                      <div className="border border-[#333333] bg-[#0E0E0E] p-5 flex flex-col justify-between">
                        <div>
                          <div className="flex items-center justify-between pb-3 mb-3 border-b border-[#222222]">
                            <div className="flex items-center gap-2">
                              <Vault size={16} weight="light" className="text-[#FAFAFA]" />
                              <h3 className="font-heading font-bold text-xs uppercase tracking-wider text-[#FAFAFA]">
                                BALANCE & CONCILIACIÓN
                              </h3>
                            </div>
                            <span className="text-[10px] font-mono text-[#71717A] uppercase">
                              GAVETA FÍSICA
                            </span>
                          </div>

                          {/* Ecuación de Efectivo Teórico */}
                          <div className="space-y-1.5 text-xs font-mono">
                            <div className="flex items-center justify-between py-0.5 text-[#A1A1AA]">
                              <span>Saldo Inicial (Apertura):</span>
                              <span className="text-[#FAFAFA]">{formatearDinero(arqueo.saldoInicial)}</span>
                            </div>

                            <div className="flex items-center justify-between py-0.5 text-[#A1A1AA]">
                              <span>(+) Ventas en Efectivo:</span>
                              <span className="text-emerald-400">+{formatearDinero(arqueo.totalEfectivo)}</span>
                            </div>

                            <div className="flex items-center justify-between py-0.5 text-[#A1A1AA]">
                              <span>(-) Gastos de Turno:</span>
                              <span className="text-rose-400">
                                {arqueo.gastosTurno > 0 ? `-${formatearDinero(arqueo.gastosTurno)}` : '$0.00'}
                              </span>
                            </div>

                            <div className="flex items-center justify-between py-1.5 border-t border-b border-[#222222] font-bold text-[#FAFAFA]">
                              <span>(=) Efectivo Esperado:</span>
                              <span className="text-amber-300">{formatearDinero(arqueo.efectivoEsperado)}</span>
                            </div>

                            <div className="flex items-center justify-between py-1 text-[#A1A1AA]">
                              <span>Efectivo Real Declarado:</span>
                              <span className="text-[#FAFAFA] font-bold text-sm">
                                {formatearDinero(arqueo.efectivoRealDeclarado)}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Recuadro Destacado: BADGE DE DIFERENCIA */}
                        <div className="mt-4 pt-3">
                          <div
                            className={`p-3.5 border text-center ${
                              esCuadrada
                                ? 'bg-emerald-950/50 border-emerald-500 text-emerald-400'
                                : esFaltante
                                ? 'bg-rose-950/50 border-rose-500 text-rose-400'
                                : 'bg-amber-950/50 border-amber-500 text-amber-400'
                            }`}
                          >
                            <span className="text-[10px] font-mono uppercase tracking-[0.2em] block mb-1">
                              {esCuadrada
                                ? 'AUDITORÍA CONFORME'
                                : esFaltante
                                ? 'ALERTA DE FALTANTE'
                                : 'REGISTRO DE SOBRANTE'}
                            </span>
                            <div className="font-heading font-extrabold text-xl tracking-tight">
                              {esCuadrada && 'CAJA CUADRADA ($0.00)'}
                              {esFaltante && `FALTANTE: ${formatearDinero(arqueo.diferencia)}`}
                              {esSobrante && `SOBRANTE: +${formatearDinero(arqueo.diferencia)}`}
                            </div>
                            <p className="text-[10px] font-sans opacity-80 mt-1">
                              {esCuadrada
                                ? 'El efectivo declarado coincide exactamente con el sistema.'
                                : esFaltante
                                ? 'El efectivo físico es menor al esperado en la gaveta.'
                                : 'El efectivo físico declarado supera al esperado en la gaveta.'}
                            </p>
                          </div>

                          {/* Metadata de Horas */}
                          <div className="mt-3 flex items-center justify-between text-[10px] font-mono text-[#71717A] pt-2 border-t border-[#1A1A1A]">
                            <span>Apertura: {formatearSoloHora(arqueo.fechaApertura)}</span>
                            <span>•</span>
                            <span>Cierre: {formatearSoloHora(arqueo.fechaCierre)}</span>
                            <span>•</span>
                            <span>Operador: {arqueo.operador}</span>
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
