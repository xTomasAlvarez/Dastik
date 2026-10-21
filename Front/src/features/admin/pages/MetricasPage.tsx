import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useQuery } from '@tanstack/react-query';
import {
  TrendUp,
  CurrencyDollar,
  Package,
  ArrowClockwise,
  WarningCircle,
  CheckCircle,
  Lightning,
  Hourglass,
  Tag,
  CreditCard,
  Money,
  Bank,
  SlidersHorizontal,
} from '@phosphor-icons/react';
import { metricasApi } from '../api/metricasApi';
import { Button } from '../../../components/ui/Button';

type PeriodoFiltro = 'hoy' | 'semana' | 'mes' | 'temporada';

const PERIODOS: { key: PeriodoFiltro; label: string; desc: string }[] = [
  { key: 'hoy', label: 'HOY', desc: 'Jornada Actual' },
  { key: 'semana', label: '7 DÍAS', desc: 'Última Semana' },
  { key: 'mes', label: '30 DÍAS (MES)', desc: 'Último Mes' },
  { key: 'temporada', label: '90 DÍAS (TEMPORADA)', desc: 'Trimestre' },
];

const UNIDADES_NEGOCIO = [
  { id: 0, label: 'TODAS' },
  { id: 1, label: 'DASTIK' },
  { id: 2, label: 'HIDDEN SNEAKERS' },
];

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

export const MetricasPage: React.FC = () => {
  // Filtros
  const [periodo, setPeriodo] = useState<PeriodoFiltro>('mes');
  const [unidadNegocioId, setUnidadNegocioId] = useState<number>(0);
  const [pestañaStock, setPestañaStock] = useState<'alta-rotacion' | 'estancados'>('alta-rotacion');

  // Costos ocultos del E-commerce & Local (persistidos en localStorage)
  const [gastoAds, setGastoAds] = useState<number>(() => {
    const saved = localStorage.getItem('dastik_metricas_gasto_ads');
    return saved !== null ? parseFloat(saved) : 1050000;
  });

  const [enviosAbsorbidos, setEnviosAbsorbidos] = useState<number>(() => {
    const saved = localStorage.getItem('dastik_metricas_envios');
    return saved !== null ? parseFloat(saved) : 60000;
  });

  const [comisionPasarelaPct, setComisionPasarelaPct] = useState<number>(() => {
    const saved = localStorage.getItem('dastik_metricas_comision_pasarela');
    return saved !== null ? parseFloat(saved) : 4.5;
  });

  const [suscripcionTiendanube, setSuscripcionTiendanube] = useState<number>(() => {
    const saved = localStorage.getItem('dastik_metricas_suscripcion_tiendanube');
    return saved !== null ? parseFloat(saved) : 35000;
  });

  // Guardar en localStorage ante cambios
  useEffect(() => {
    localStorage.setItem('dastik_metricas_gasto_ads', gastoAds.toString());
  }, [gastoAds]);

  useEffect(() => {
    localStorage.setItem('dastik_metricas_envios', enviosAbsorbidos.toString());
  }, [enviosAbsorbidos]);

  useEffect(() => {
    localStorage.setItem('dastik_metricas_comision_pasarela', comisionPasarelaPct.toString());
  }, [comisionPasarelaPct]);

  useEffect(() => {
    localStorage.setItem('dastik_metricas_suscripcion_tiendanube', suscripcionTiendanube.toString());
  }, [suscripcionTiendanube]);

  // Consulta de Métricas Avanzadas
  const {
    data: metricas,
    isLoading,
    isRefetching,
    refetch,
  } = useQuery({
    queryKey: ['admin-metricas-avanzadas', periodo, unidadNegocioId],
    queryFn: () => metricasApi.obtenerMetricasAvanzadas(periodo, unidadNegocioId),
    refetchInterval: 60000,
  });

  // Cálculos Financieros
  const ingresosBrutos = metricas?.ingresosBrutos ?? 0;
  const costoMercaderiaVendida = metricas?.costoMercaderiaVendida ?? 0;
  const gananciaBruta = metricas?.gananciaBruta ?? 0;
  const gastosCaja = metricas?.gastosCajaRegistrados ?? 0;
  const cantidadOperaciones = metricas?.cantidadOperaciones ?? 0;
  const ticketPromedio = metricas?.ticketPromedio ?? 0;

  // Medios de Pago
  const totalEfectivo = metricas?.totalEfectivo ?? 0;
  const totalTransferencia = metricas?.totalTransferencia ?? 0;
  const totalDebito = metricas?.totalDebito ?? 0;
  const totalCredito = metricas?.totalCredito ?? 0;
  const sumaMediosPago = totalEfectivo + totalTransferencia + totalDebito + totalCredito;

  const pctEfectivo = sumaMediosPago > 0 ? (totalEfectivo / sumaMediosPago) * 100 : 0;
  const pctTransferencia = sumaMediosPago > 0 ? (totalTransferencia / sumaMediosPago) * 100 : 0;
  const pctDebito = sumaMediosPago > 0 ? (totalDebito / sumaMediosPago) * 100 : 0;
  const pctCredito = sumaMediosPago > 0 ? (totalCredito / sumaMediosPago) * 100 : 0;

  // Ventas digitales sujetas a comisión
  const totalDigitales = totalTransferencia + totalDebito + totalCredito;
  const costoComisionPasarela = Math.round(totalDigitales * (comisionPasarelaPct / 100));

  // Costos totales digitales, fijos y pauta
  const totalCostosOcultos = gastoAds + enviosAbsorbidos + costoComisionPasarela + suscripcionTiendanube;

  // GANANCIA NETA REAL DE BOLSILLO
  const gananciaNetaReal = gananciaBruta - gastosCaja - totalCostosOcultos;
  const margenNetoRealPct = ingresosBrutos > 0 ? (gananciaNetaReal / ingresosBrutos) * 100 : 0;

  // Listas de catálogo
  const topMasVendidos = metricas?.topMasVendidos ?? [];
  const productosEstancados = metricas?.productosEstancados ?? [];

  const totalCapitalInmovilizado = productosEstancados.reduce(
    (acc, p) => acc + p.capitalInmovilizado,
    0
  );

  return (
    <div className="p-4 sm:p-6 md:p-8 space-y-6 max-w-7xl mx-auto">
      {/* ======================================================== */}
      {/* 1. Header y Barra de Filtros                             */}
      {/* ======================================================== */}
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4 pb-5 border-b border-subtle">
        <div>
          <span className="text-[11px] font-mono uppercase tracking-[0.2em] text-muted block">
            INTELIGENCIA COMERCIAL // FINANZAS REALES & ROTACIÓN
          </span>
          <h1 className="font-heading font-bold text-2xl md:text-3xl text-primary tracking-tight mt-0.5">
            RENTABILIDAD & VELOCIDAD DE STOCK
          </h1>
        </div>

        {/* Filtros de Período y Unidad de Negocio */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Selector de Período */}
          <div className="flex items-center border border-subtle bg-elevated rounded-lg p-1 gap-0.5 relative">
            {PERIODOS.map((p) => {
              const activo = periodo === p.key;
              return (
                <button
                  key={p.key}
                  type="button"
                  onClick={() => setPeriodo(p.key)}
                  className={`relative px-3 py-1.5 rounded-md text-xs font-mono uppercase transition-colors cursor-pointer ${
                    activo
                      ? 'text-zinc-950 font-bold'
                      : 'text-secondary hover:text-primary'
                  }`}
                  title={p.desc}
                >
                  {activo && (
                    <motion.div
                      layoutId="metricas-periodo-pill"
                      className="absolute inset-0 bg-amber-400 rounded-md shadow-surface"
                      transition={{ type: 'spring', stiffness: 500, damping: 35 }}
                    />
                  )}
                  <span className="relative z-10">{p.label}</span>
                </button>
              );
            })}
          </div>

          {/* Selector de Unidad de Negocio */}
          <div className="flex items-center border border-subtle bg-elevated rounded-lg p-1 gap-0.5 relative">
            {UNIDADES_NEGOCIO.map((u) => {
              const activo = unidadNegocioId === u.id;
              return (
                <button
                  key={u.id}
                  type="button"
                  onClick={() => setUnidadNegocioId(u.id)}
                  className={`relative px-3 py-1.5 rounded-md text-xs font-mono uppercase transition-colors cursor-pointer ${
                    activo
                      ? 'text-primary font-bold'
                      : 'text-secondary hover:text-primary'
                  }`}
                >
                  {activo && (
                    <motion.div
                      layoutId="metricas-unidad-pill"
                      className="absolute inset-0 bg-surface rounded-md shadow-surface border border-subtle"
                      transition={{ type: 'spring', stiffness: 500, damping: 35 }}
                    />
                  )}
                  <span className="relative z-10">{u.label}</span>
                </button>
              );
            })}
          </div>

          {/* Botón Refrescar */}
          <Button
            variant="secondary"
            size="sm"
            onClick={() => refetch()}
            disabled={isLoading || isRefetching}
            className="text-xs font-mono gap-1.5"
            title="Refrescar métricas ahora"
          >
            <ArrowClockwise
              size={14}
              className={isLoading || isRefetching ? 'animate-spin' : ''}
            />
            <span>ACTUALIZAR</span>
          </Button>
        </div>
      </div>

      {/* ======================================================== */}
      {/* 2. KPIs Financieros Principales                          */}
      {/* ======================================================== */}
      <motion.div variants={containerVariants} initial="hidden" animate="visible" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* KPI 1: Ingresos Brutos */}
        <motion.div variants={itemVariants} className="bg-surface border border-subtle rounded-xl shadow-surface p-5 flex flex-col justify-between">
          <div className="flex items-center justify-between text-muted mb-2">
            <span className="text-[11px] font-mono uppercase tracking-widest">
              FACTURACIÓN BRUTA
            </span>
            <CurrencyDollar size={18} className="text-amber-500 dark:text-amber-400" />
          </div>
          <div className="space-y-1">
            <span className="text-2xl md:text-3xl font-mono font-bold text-primary tracking-tight block tabular-nums">
              $ {ingresosBrutos.toLocaleString('es-AR')}
            </span>
            <div className="flex items-center justify-between text-[11px] font-mono text-muted">
              <span>{cantidadOperaciones} ventas</span>
              <span className="tabular-nums">Ticket prom: $ {ticketPromedio.toLocaleString('es-AR')}</span>
            </div>
          </div>
        </motion.div>

        {/* KPI 2: Costo de Mercadería Vendida (CMV) */}
        <motion.div variants={itemVariants} className="bg-surface border border-subtle rounded-xl shadow-surface p-5 flex flex-col justify-between">
          <div className="flex items-center justify-between text-muted mb-2">
            <span className="text-[11px] font-mono uppercase tracking-widest">
              COSTO DE MERCADERÍA (CMV)
            </span>
            <Package size={18} className="text-secondary" />
          </div>
          <div className="space-y-1">
            <span className="text-2xl md:text-3xl font-mono font-bold text-secondary tracking-tight block tabular-nums">
              $ {costoMercaderiaVendida.toLocaleString('es-AR')}
            </span>
            <span className="text-[11px] font-mono text-muted block">
              Costo base real de prendas cobradas
            </span>
          </div>
        </motion.div>

        {/* KPI 3: Ganancia Bruta (Local) */}
        <motion.div variants={itemVariants} className="bg-surface border border-subtle rounded-xl shadow-surface p-5 flex flex-col justify-between">
          <div className="flex items-center justify-between text-muted mb-2">
            <span className="text-[11px] font-mono uppercase tracking-widest">
              GANANCIA BRUTA
            </span>
            <TrendUp size={18} className="text-emerald-600 dark:text-emerald-400" />
          </div>
          <div className="space-y-1">
            <span className="text-2xl md:text-3xl font-mono font-bold text-emerald-600 dark:text-emerald-400 tracking-tight block tabular-nums">
              $ {gananciaBruta.toLocaleString('es-AR')}
            </span>
            <span className="text-[11px] font-mono text-muted block">
              Ventas - Costos de producción
            </span>
          </div>
        </motion.div>

        {/* KPI 4: GANANCIA NETA REAL DE BOLSILLO */}
        <motion.div
          variants={itemVariants}
          className={`border rounded-xl shadow-surface p-5 flex flex-col justify-between ${
            gananciaNetaReal >= 0
              ? 'bg-emerald-500/10 border-emerald-500/30'
              : 'bg-red-500/10 border-red-500/30'
          }`}
        >
          <div className="flex items-center justify-between text-muted mb-2">
            <span className="text-[11px] font-mono uppercase tracking-widest text-amber-600 dark:text-amber-400 font-bold">
              GANANCIA NETA REAL (BOLSILLO)
            </span>
            <Lightning
              size={18}
              weight="fill"
              className={gananciaNetaReal >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}
            />
          </div>
          <div className="space-y-1">
            <span
              className={`text-2xl md:text-3xl font-mono font-bold tracking-tight block tabular-nums ${
                gananciaNetaReal >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'
              }`}
            >
              $ {gananciaNetaReal.toLocaleString('es-AR')}
            </span>
            <div className="flex items-center justify-between text-[11px] font-mono">
              <span className="text-secondary">Margen neto:</span>
              <span
                className={`font-bold tabular-nums ${
                  gananciaNetaReal >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'
                }`}
              >
                {margenNetoRealPct.toFixed(1)}%
              </span>
            </div>
          </div>
        </motion.div>
      </motion.div>

      {/* ======================================================== */}
      {/* 3. Calculadora Interactiva de Costos Ocultos             */}
      {/* ======================================================== */}
      <div className="bg-surface border border-subtle rounded-xl shadow-surface p-5 sm:p-6 space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-subtle">
          <div className="flex items-center gap-2">
            <SlidersHorizontal size={18} className="text-amber-500 dark:text-amber-400" />
            <h2 className="font-heading font-bold text-sm sm:text-base tracking-tight uppercase text-primary">
              CALCULADORA DE COSTOS OCULTOS (E-COMMERCE & LOCAL)
            </h2>
          </div>
          <span className="text-[11px] font-mono text-muted uppercase">
            Ajusta los valores para calibrar tu rentabilidad neta real
          </span>
        </div>

        {/* Grilla de Inputs de Costos */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Input 1: Gasto en Ads */}
          <div className="bg-elevated border border-subtle rounded-lg p-3.5 space-y-1.5">
            <label className="text-[10px] font-mono uppercase text-secondary block">
              Gasto en Publicidad / Ads ($ ARS)
            </label>
            <input
              type="number"
              min="0"
              value={gastoAds}
              onChange={(e) => setGastoAds(parseFloat(e.target.value) || 0)}
              className="w-full bg-surface border border-subtle rounded-lg px-3 py-1.5 text-sm font-mono font-bold text-amber-600 dark:text-amber-400 outline-none focus:border-strong transition-colors tabular-nums"
            />
            <span className="text-[10px] font-mono text-muted block">
              Meta Ads + Google Ads (~30 USD/día)
            </span>
          </div>

          {/* Input 2: Envíos Absorbidos */}
          <div className="bg-elevated border border-subtle rounded-lg p-3.5 space-y-1.5">
            <label className="text-[10px] font-mono uppercase text-secondary block">
              Envíos Absorbidos ($ ARS)
            </label>
            <input
              type="number"
              min="0"
              value={enviosAbsorbidos}
              onChange={(e) => setEnviosAbsorbidos(parseFloat(e.target.value) || 0)}
              className="w-full bg-surface border border-subtle rounded-lg px-3 py-1.5 text-sm font-mono font-bold text-amber-600 dark:text-amber-400 outline-none focus:border-strong transition-colors tabular-nums"
            />
            <span className="text-[10px] font-mono text-muted block">
              Costos logísticos bonificados (&gt; $100k)
            </span>
          </div>

          {/* Input 3: Comisión Pasarela Pago (%) */}
          <div className="bg-elevated border border-subtle rounded-lg p-3.5 space-y-1.5">
            <label className="text-[10px] font-mono uppercase text-secondary block">
              Comisión Pasarela (%)
            </label>
            <input
              type="number"
              min="0"
              max="100"
              step="0.1"
              value={comisionPasarelaPct}
              onChange={(e) => setComisionPasarelaPct(parseFloat(e.target.value) || 0)}
              className="w-full bg-surface border border-subtle rounded-lg px-3 py-1.5 text-sm font-mono font-bold text-amber-600 dark:text-amber-400 outline-none focus:border-strong transition-colors tabular-nums"
            />
            <span className="text-[10px] font-mono text-muted block tabular-nums">
              Retención: $ {costoComisionPasarela.toLocaleString('es-AR')} sobre ventas digitales
            </span>
          </div>

          {/* Input 4: Suscripción Mensual Tiendanube / Costos Fijos */}
          <div className="bg-elevated border border-subtle rounded-lg p-3.5 space-y-1.5">
            <label className="text-[10px] font-mono uppercase text-secondary block">
              Suscripción / Costos Fijos ($ ARS)
            </label>
            <input
              type="number"
              min="0"
              value={suscripcionTiendanube}
              onChange={(e) => setSuscripcionTiendanube(parseFloat(e.target.value) || 0)}
              className="w-full bg-surface border border-subtle rounded-lg px-3 py-1.5 text-sm font-mono font-bold text-amber-600 dark:text-amber-400 outline-none focus:border-strong transition-colors tabular-nums"
            />
            <span className="text-[10px] font-mono text-muted block">
              Plan Tiendanube + apps conectadas
            </span>
          </div>
        </div>

        {/* Strip de Fórmula Visual Clara */}
        <div className="p-3.5 bg-elevated border border-subtle rounded-lg font-mono text-xs flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2 text-secondary tabular-nums">
            <span className="text-emerald-600 dark:text-emerald-400 font-bold">
              GANANCIA BRUTA ($ {gananciaBruta.toLocaleString('es-AR')})
            </span>
            <span>-</span>
            <span className="text-amber-600 dark:text-amber-400 font-bold" title="Gastos de turnos de caja (Uber, comida, etc.)">
              GASTOS DE CAJA ($ {gastosCaja.toLocaleString('es-AR')})
            </span>
            <span>-</span>
            <span className="text-red-600 dark:text-red-400 font-bold" title="Ads + Envíos + Pasarela + Suscripción">
              COSTOS DIGITALES Y ADS ($ {totalCostosOcultos.toLocaleString('es-AR')})
            </span>
            <span>=</span>
          </div>

          <div
            className={`px-3 py-1.5 rounded-md font-bold text-sm border tabular-nums ${
              gananciaNetaReal >= 0
                ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30'
                : 'bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/30'
            }`}
          >
            GANANCIA NETA REAL: $ {gananciaNetaReal.toLocaleString('es-AR')}
          </div>
        </div>
      </div>

      {/* ======================================================== */}
      {/* 4. Medios de Pago & Comparativa por Unidad de Negocio     */}
      {/* ======================================================== */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Desglose por Medio de Pago (2 columnas en desktop) */}
        <div className="lg:col-span-2 bg-surface border border-subtle rounded-xl shadow-surface p-5 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-subtle">
            <div className="flex items-center gap-2">
              <CreditCard size={18} className="text-amber-500 dark:text-amber-400" />
              <h2 className="font-heading font-bold text-sm tracking-tight uppercase text-primary">
                DISTRIBUCIÓN POR MEDIOS DE PAGO
              </h2>
            </div>
            <span className="text-[11px] font-mono text-muted tabular-nums">
              TOTAL: $ {sumaMediosPago.toLocaleString('es-AR')}
            </span>
          </div>

          <div className="space-y-3.5">
            {/* Efectivo */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs font-mono">
                <span className="flex items-center gap-1.5 text-primary">
                  <Money size={14} className="text-emerald-600 dark:text-emerald-400" />
                  EFECTIVO (Gaveta Mostrador)
                </span>
                <span className="font-bold text-primary tabular-nums">
                  $ {totalEfectivo.toLocaleString('es-AR')}{' '}
                  <span className="text-muted font-normal">({pctEfectivo.toFixed(1)}%)</span>
                </span>
              </div>
              <div className="w-full h-2 bg-elevated rounded-full overflow-hidden">
                <div
                  className="h-full bg-emerald-500 rounded-full"
                  style={{ width: `${Math.min(pctEfectivo, 100)}%` }}
                />
              </div>
            </div>

            {/* Transferencia */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs font-mono">
                <span className="flex items-center gap-1.5 text-primary">
                  <Bank size={14} className="text-blue-600 dark:text-blue-400" />
                  TRANSFERENCIA (Alias Ale / Gordo)
                </span>
                <span className="font-bold text-primary tabular-nums">
                  $ {totalTransferencia.toLocaleString('es-AR')}{' '}
                  <span className="text-muted font-normal">
                    ({pctTransferencia.toFixed(1)}%)
                  </span>
                </span>
              </div>
              <div className="w-full h-2 bg-elevated rounded-full overflow-hidden">
                <div
                  className="h-full bg-blue-500 rounded-full"
                  style={{ width: `${Math.min(pctTransferencia, 100)}%` }}
                />
              </div>
            </div>

            {/* Débito */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs font-mono">
                <span className="flex items-center gap-1.5 text-primary">
                  <CreditCard size={14} className="text-amber-500 dark:text-amber-400" />
                  DÉBITO
                </span>
                <span className="font-bold text-primary tabular-nums">
                  $ {totalDebito.toLocaleString('es-AR')}{' '}
                  <span className="text-muted font-normal">({pctDebito.toFixed(1)}%)</span>
                </span>
              </div>
              <div className="w-full h-2 bg-elevated rounded-full overflow-hidden">
                <div
                  className="h-full bg-amber-500 rounded-full"
                  style={{ width: `${Math.min(pctDebito, 100)}%` }}
                />
              </div>
            </div>

            {/* Crédito */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs font-mono">
                <span className="flex items-center gap-1.5 text-primary">
                  <CreditCard size={14} className="text-purple-600 dark:text-purple-400" />
                  CRÉDITO (Cuotas con recargo)
                </span>
                <span className="font-bold text-primary tabular-nums">
                  $ {totalCredito.toLocaleString('es-AR')}{' '}
                  <span className="text-muted font-normal">({pctCredito.toFixed(1)}%)</span>
                </span>
              </div>
              <div className="w-full h-2 bg-elevated rounded-full overflow-hidden">
                <div
                  className="h-full bg-purple-500 rounded-full"
                  style={{ width: `${Math.min(pctCredito, 100)}%` }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Facturación por Unidad de Negocio (1 columna) */}
        <div className="bg-surface border border-subtle rounded-xl shadow-surface p-5 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-subtle">
            <div className="flex items-center gap-2">
              <Tag size={18} className="text-amber-500 dark:text-amber-400" />
              <h2 className="font-heading font-bold text-sm tracking-tight uppercase text-primary">
                UNIDAD DE NEGOCIO
              </h2>
            </div>
          </div>

          <div className="space-y-4">
            <div className="p-3.5 bg-elevated border border-subtle rounded-lg space-y-1">
              <span className="text-[10px] font-mono text-muted uppercase tracking-wider block">
                DASTIK (STREETWEAR)
              </span>
              <span className="text-xl font-mono font-bold text-primary block tabular-nums">
                $ {(metricas?.ingresosDastik ?? 0).toLocaleString('es-AR')}
              </span>
              <span className="text-[10px] font-mono text-emerald-600 dark:text-emerald-400">
                Sincronizado con Tiendanube API
              </span>
            </div>

            <div className="p-3.5 bg-elevated border border-subtle rounded-lg space-y-1">
              <span className="text-[10px] font-mono text-muted uppercase tracking-wider block">
                HIDDEN SNEAKERS
              </span>
              <span className="text-xl font-mono font-bold text-primary block tabular-nums">
                $ {(metricas?.ingresosHiddenSneakers ?? 0).toLocaleString('es-AR')}
              </span>
              <span className="text-[10px] font-mono text-secondary">
                Inventario local de zapatillas
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ======================================================== */}
      {/* 5. Inteligencia de Stock y Rotación (Tabs / Tablas)     */}
      {/* ======================================================== */}
      <div className="bg-surface border border-subtle rounded-xl shadow-surface p-5 sm:p-6 space-y-4">
        {/* Cabecera y Selector de Pestaña */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-subtle">
          <div className="flex items-center gap-2">
            <Package size={18} className="text-amber-500 dark:text-amber-400" />
            <h2 className="font-heading font-bold text-sm sm:text-base tracking-tight uppercase text-primary">
              INTELIGENCIA DE CATÁLOGO & VELOCIDAD DE ROTACIÓN
            </h2>
          </div>

          {/* Switch de Pestañas */}
          <div className="flex border border-subtle bg-elevated rounded-lg p-1 gap-1 relative">
            <button
              type="button"
              onClick={() => setPestañaStock('alta-rotacion')}
              className={`relative px-4 py-1.5 rounded-md text-xs font-mono uppercase transition-colors cursor-pointer flex items-center gap-1.5 ${
                pestañaStock === 'alta-rotacion'
                  ? 'text-zinc-950 font-bold'
                  : 'text-secondary hover:text-primary'
              }`}
            >
              {pestañaStock === 'alta-rotacion' && (
                <motion.div
                  layoutId="metricas-stock-tab-pill"
                  className="absolute inset-0 bg-amber-400 rounded-md shadow-surface"
                  transition={{ type: 'spring', stiffness: 500, damping: 35 }}
                />
              )}
              <span className="relative z-10 flex items-center gap-1.5">
                <Lightning size={14} weight="bold" />
                <span>ALTA ROTACIÓN & REPOSICIÓN ({topMasVendidos.length})</span>
              </span>
            </button>
            <button
              type="button"
              onClick={() => setPestañaStock('estancados')}
              className={`relative px-4 py-1.5 rounded-md text-xs font-mono uppercase transition-colors cursor-pointer flex items-center gap-1.5 ${
                pestañaStock === 'estancados'
                  ? 'text-zinc-950 font-bold'
                  : 'text-secondary hover:text-primary'
              }`}
            >
              {pestañaStock === 'estancados' && (
                <motion.div
                  layoutId="metricas-stock-tab-pill"
                  className="absolute inset-0 bg-amber-400 rounded-md shadow-surface"
                  transition={{ type: 'spring', stiffness: 500, damping: 35 }}
                />
              )}
              <span className="relative z-10 flex items-center gap-1.5">
                <Hourglass size={14} weight="bold" />
                <span>STOCK INMOVILIZADO ({productosEstancados.length})</span>
              </span>
            </button>
          </div>
        </div>

        <AnimatePresence mode="wait">
          {pestañaStock === 'alta-rotacion' ? (
            <motion.div
              key="alta-rotacion"
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.15 }}
              className="space-y-3"
            >
              <div className="text-xs font-mono text-muted flex items-center justify-between">
                <span>TOP PRENDAS MÁS VENDIDAS // CÁLCULO DE VELOCIDAD DIARIA & DEMANDA A 7 DÍAS</span>
                <span className="text-amber-600 dark:text-amber-400 font-bold">PERÍODO: {periodo.toUpperCase()}</span>
              </div>

            {topMasVendidos.length === 0 ? (
              <div className="p-8 text-center text-xs font-mono text-muted border border-dashed border-subtle rounded-lg">
                No hay ventas registradas en el período seleccionado.
              </div>
            ) : (
              <div className="overflow-x-auto border border-subtle rounded-lg">
                <table className="w-full text-left text-xs font-mono border-collapse">
                  <thead className="bg-elevated text-secondary border-b border-subtle">
                    <tr>
                      <th className="py-2.5 px-3 uppercase tracking-wider font-semibold">Prenda</th>
                      <th className="py-2.5 px-3 uppercase tracking-wider font-semibold">Talle/Color</th>
                      <th className="py-2.5 px-3 uppercase tracking-wider font-semibold">Unidad</th>
                      <th className="py-2.5 px-3 uppercase tracking-wider font-semibold text-right">Vendidas</th>
                      <th className="py-2.5 px-3 uppercase tracking-wider font-semibold text-right">Facturado</th>
                      <th className="py-2.5 px-3 uppercase tracking-wider font-semibold text-right">Velocidad</th>
                      <th className="py-2.5 px-3 uppercase tracking-wider font-semibold text-right">Stock Actual</th>
                      <th className="py-2.5 px-3 uppercase tracking-wider font-semibold text-center">Estado de Stock</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-subtle">
                    {topMasVendidos.map((item) => (
                      <tr key={item.varianteId} className="hover:bg-elevated/60 transition-colors">
                        <td className="py-2.5 px-3 font-heading font-bold text-primary uppercase">
                          {item.productoNombre}
                        </td>
                        <td className="py-2.5 px-3 text-secondary">
                          {item.talle} {item.color ? `/ ${item.color}` : ''}
                        </td>
                        <td className="py-2.5 px-3 text-muted">
                          {item.unidadNegocio}
                        </td>
                        <td className="py-2.5 px-3 font-bold text-amber-600 dark:text-amber-400 text-right tabular-nums">
                          {item.unidadesVendidas} u
                        </td>
                        <td className="py-2.5 px-3 font-bold text-primary text-right tabular-nums">
                          $ {item.ingresosGenerados.toLocaleString('es-AR')}
                        </td>
                        <td className="py-2.5 px-3 text-right text-emerald-600 dark:text-emerald-400 font-bold tabular-nums">
                          {item.velocidadDiaria.toFixed(2)} u/día
                        </td>
                        <td className="py-2.5 px-3 text-right font-bold text-primary tabular-nums">
                          {item.stockActual} u
                        </td>
                        <td className="py-2.5 px-3 text-center">
                          {item.sugerenciaReposicion ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/30 font-bold text-[10px]">
                              <WarningCircle size={12} weight="bold" />
                              REPONER (+{item.cantidadSugerida} u)
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 font-bold text-[10px]">
                              <CheckCircle size={12} weight="bold" />
                              STOCK CUBIERTO
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            </motion.div>
          ) : (
            <motion.div
              key="estancados"
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.15 }}
              className="space-y-3"
            >
            <div className="text-xs font-mono text-muted flex items-center justify-between">
              <span>
                PRENDAS CON STOCK &gt; 0 Y 0 VENTAS EN EL PERÍODO // CAPITAL INMOVILIZADO TOTAL:{' '}
                <strong className="text-amber-600 dark:text-amber-400 tabular-nums">
                  $ {totalCapitalInmovilizado.toLocaleString('es-AR')}
                </strong>
              </span>
              <span className="text-red-600 dark:text-red-400 font-bold">PRIORIDAD DE LIQUIDACIÓN / PROMO</span>
            </div>

            {productosEstancados.length === 0 ? (
              <div className="p-8 text-center text-xs font-mono text-emerald-600 dark:text-emerald-400 border border-dashed border-subtle rounded-lg">
                ¡Excelente rotación! No hay prendas estancadas con stock positivo en este período.
              </div>
            ) : (
              <div className="overflow-x-auto border border-subtle rounded-lg">
                <table className="w-full text-left text-xs font-mono border-collapse">
                  <thead className="bg-elevated text-secondary border-b border-subtle">
                    <tr>
                      <th className="py-2.5 px-3 uppercase tracking-wider font-semibold">Prenda</th>
                      <th className="py-2.5 px-3 uppercase tracking-wider font-semibold">Talle/Color</th>
                      <th className="py-2.5 px-3 uppercase tracking-wider font-semibold">Unidad</th>
                      <th className="py-2.5 px-3 uppercase tracking-wider font-semibold text-right">Stock Físico</th>
                      <th className="py-2.5 px-3 uppercase tracking-wider font-semibold text-right">Costo Base</th>
                      <th className="py-2.5 px-3 uppercase tracking-wider font-semibold text-right">Precio Venta</th>
                      <th className="py-2.5 px-3 uppercase tracking-wider font-semibold text-right text-red-600 dark:text-red-400">
                        Capital Inmovilizado
                      </th>
                      <th className="py-2.5 px-3 uppercase tracking-wider font-semibold text-center">Acción Sugerida</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-subtle">
                    {productosEstancados.map((item) => (
                      <tr key={item.varianteId} className="hover:bg-elevated/60 transition-colors">
                        <td className="py-2.5 px-3 font-heading font-bold text-primary uppercase">
                          {item.productoNombre}
                        </td>
                        <td className="py-2.5 px-3 text-secondary">
                          {item.talle} {item.color ? `/ ${item.color}` : ''}
                        </td>
                        <td className="py-2.5 px-3 text-muted">
                          {item.unidadNegocio}
                        </td>
                        <td className="py-2.5 px-3 font-bold text-primary text-right tabular-nums">
                          {item.stockFisico} u
                        </td>
                        <td className="py-2.5 px-3 text-secondary text-right tabular-nums">
                          $ {item.costoBase.toLocaleString('es-AR')}
                        </td>
                        <td className="py-2.5 px-3 text-primary text-right tabular-nums">
                          $ {item.precioVenta.toLocaleString('es-AR')}
                        </td>
                        <td className="py-2.5 px-3 font-bold text-red-600 dark:text-red-400 text-right tabular-nums">
                          $ {item.capitalInmovilizado.toLocaleString('es-AR')}
                        </td>
                        <td className="py-2.5 px-3 text-center">
                          <span className="inline-block px-2 py-0.5 rounded-md bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/30 font-bold text-[10px]">
                            SUGERIR PROMO / FLASH SALE
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};
