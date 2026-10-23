import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  TrendUp,
  CurrencyDollar,
  Package,
  ArrowClockwise,
  Lightning,
  Hourglass,
  Tag,
  CreditCard,
  Money,
  Bank,
  SlidersHorizontal,
  Receipt,
  Trash,
  PlusCircle,
  Coins,
  X,
} from '@phosphor-icons/react';
import { metricasApi } from '../api/metricasApi';
import { finanzasApi, type RegistrarGastoRequest } from '../api/finanzasApi';
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

const CATEGORIAS_GASTO = [
  'General',
  'Mercadería / Insumos',
  'Pauta Publicitaria (Ads)',
  'Servicios & Alquiler',
  'Viáticos & Almuerzo',
  'Limpieza & Mantenimiento',
  'Otros',
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
  const queryClient = useQueryClient();

  // Filtros
  const [periodo, setPeriodo] = useState<PeriodoFiltro>('mes');
  const [unidadNegocioId, setUnidadNegocioId] = useState<number>(0);
  const [pestañaStock, setPestañaStock] = useState<'alta-rotacion' | 'estancados'>('alta-rotacion');

  // Formulario de Nuevo Gasto
  const [descGasto, setDescGasto] = useState('');
  const [montoGasto, setMontoGasto] = useState<string>('');
  const [monedaGasto, setMonedaGasto] = useState<'ARS' | 'USD'>('ARS');
  const [tipoDolarGasto, setTipoDolarGasto] = useState<'Blue' | 'Oficial'>('Blue');
  const [categoriaGasto, setCategoriaGasto] = useState('General');
  const [errorGasto, setErrorGasto] = useState<string | null>(null);

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

  // Consulta de Cotización Dólar en Vivo
  const { data: cotizacionDolar } = useQuery({
    queryKey: ['finanzas-cotizacion-dolar'],
    queryFn: finanzasApi.obtenerCotizacionDolar,
    refetchInterval: 1000 * 60 * 5, // Cada 5 minutos
  });

  // Consulta de Gastos
  const { data: dataGastos } = useQuery({
    queryKey: ['finanzas-gastos'],
    queryFn: () => finanzasApi.obtenerGastos(),
  });

  // Mutación: Registrar Gasto
  const registrarGastoMutation = useMutation({
    mutationFn: (data: RegistrarGastoRequest) => finanzasApi.registrarGasto(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['finanzas-gastos'] });
      queryClient.invalidateQueries({ queryKey: ['admin-metricas-avanzadas'] });
      setDescGasto('');
      setMontoGasto('');
      setErrorGasto(null);
    },
    onError: () => {
      setErrorGasto('No se pudo registrar el gasto. Verifica los datos.');
    },
  });

  // Mutación: Eliminar Gasto
  const eliminarGastoMutation = useMutation({
    mutationFn: (id: number) => finanzasApi.eliminarGasto(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['finanzas-gastos'] });
      queryClient.invalidateQueries({ queryKey: ['admin-metricas-avanzadas'] });
    },
  });

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
  const totalGastosLedger = dataGastos?.totalArs ?? 0;
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

  // GANANCIA NETA REAL DE BOLSILLO (descontando gastos de caja y egresos multidivisa registrados)
  const gananciaNetaReal = gananciaBruta - gastosCaja - totalCostosOcultos - totalGastosLedger;
  const margenNetoRealPct = ingresosBrutos > 0 ? (gananciaNetaReal / ingresosBrutos) * 100 : 0;

  // Listas de catálogo
  const topMasVendidos = metricas?.topMasVendidos ?? [];
  const productosEstancados = metricas?.productosEstancados ?? [];

  const totalCapitalInmovilizado = productosEstancados.reduce(
    (acc, p) => acc + p.capitalInmovilizado,
    0
  );

  // Cotización seleccionada para cálculo del gasto USD en tiempo real
  const cotizacionAplicadaVenta =
    tipoDolarGasto === 'Oficial'
      ? (cotizacionDolar?.oficial.venta ?? 1090)
      : (cotizacionDolar?.blue.venta ?? 1240);

  const montoNum = parseFloat(montoGasto) || 0;
  const montoEstimadoArs = monedaGasto === 'USD' ? Math.round(montoNum * cotizacionAplicadaVenta) : montoNum;

  const handleCrearGastoSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorGasto(null);

    if (!descGasto.trim()) {
      setErrorGasto('Ingresa una descripción para el egreso.');
      return;
    }

    if (montoNum <= 0) {
      setErrorGasto('El importe debe ser mayor a 0.');
      return;
    }

    registrarGastoMutation.mutate({
      descripcion: descGasto.trim(),
      monto: montoNum,
      moneda: monedaGasto,
      tipoDolar: monedaGasto === 'USD' ? tipoDolarGasto : undefined,
      tipoCambioAplicado: monedaGasto === 'USD' ? cotizacionAplicadaVenta : undefined,
      categoria: categoriaGasto,
    });
  };

  return (
    <div className="p-6 md:p-8 space-y-6 max-w-[1600px] mx-auto w-full">
      {/* ======================================================== */}
      {/* 1. Header y Barra de Filtros                             */}
      {/* ======================================================== */}
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4 pb-5 border-b border-subtle">
        <div>
          <div className="flex items-center gap-2 text-[11px] font-mono uppercase tracking-[0.2em] text-muted mb-1">
            <span>INTELIGENCIA COMERCIAL</span>
            <span>//</span>
            <span className="text-primary font-bold">FINANZAS &amp; DIVISAS</span>
          </div>
          <h1 className="font-heading font-bold text-2xl md:text-3xl text-primary tracking-tight mt-0.5">
            RENTABILIDAD &amp; VELOCIDAD DE STOCK
          </h1>
        </div>

        {/* Ticker de Cotización Dólar en Vivo */}
        {cotizacionDolar && (
          <div className="flex flex-wrap items-center gap-3 border border-subtle bg-surface rounded-xl px-3.5 py-2 text-xs font-mono shadow-surface">
            <div className="flex items-center gap-1.5">
              <span className={`w-2 h-2 rounded-full ${cotizacionDolar.esFallback ? 'bg-amber-500' : 'bg-emerald-500 animate-pulse'}`} />
              <span className="text-[10px] uppercase font-bold text-primary">
                {cotizacionDolar.esFallback ? 'DÓLAR (ESTIMADO)' : 'DÓLAR EN VIVO'}
              </span>
            </div>
            <div className="h-3 w-px bg-subtle" />
            <div className="flex items-center gap-1">
              <span className="text-muted text-[10px]">BLUE:</span>
              <strong className="text-emerald-600 dark:text-emerald-400 font-bold tabular-nums">
                ${cotizacionDolar.blue.venta.toLocaleString('es-AR')}
              </strong>
              <span className="text-[10px] text-muted tabular-nums">
                / ${cotizacionDolar.blue.compra.toLocaleString('es-AR')}
              </span>
            </div>
            <div className="h-3 w-px bg-subtle" />
            <div className="flex items-center gap-1">
              <span className="text-muted text-[10px]">OFICIAL:</span>
              <strong className="text-primary font-bold tabular-nums">
                ${cotizacionDolar.oficial.venta.toLocaleString('es-AR')}
              </strong>
            </div>
          </div>
        )}

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
      {/* 3. Gestor de Gastos Operativos Multidivisa (ARS / USD)   */}
      {/* ======================================================== */}
      <div className="bg-surface border border-subtle rounded-xl shadow-surface p-5 sm:p-6 space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-subtle">
          <div className="flex items-center gap-2">
            <Receipt size={19} weight="duotone" className="text-amber-500 dark:text-amber-400" />
            <div>
              <h2 className="font-heading font-bold text-sm sm:text-base tracking-tight uppercase text-primary">
                EGRESOS &amp; GASTOS OPERATIVOS (MULTIDIVISA ARS / USD)
              </h2>
              <span className="text-[11px] font-mono text-muted">
                Registra compras de mercadería o insumos en pesos o dólares con conversión automática en vivo.
              </span>
            </div>
          </div>
          <div className="text-right">
            <span className="text-[10px] font-mono uppercase text-muted block">TOTAL GASTOS REGISTRADOS:</span>
            <span className="text-base font-mono font-bold text-red-600 dark:text-red-400 tabular-nums">
              $ {totalGastosLedger.toLocaleString('es-AR')}
            </span>
          </div>
        </div>

        {errorGasto && (
          <div className="border border-red-500/30 bg-red-500/10 rounded-xl p-3 text-red-600 dark:text-red-400 text-xs font-sans flex items-center justify-between">
            <span>{errorGasto}</span>
            <button onClick={() => setErrorGasto(null)} className="p-0.5 cursor-pointer">
              <X size={14} weight="bold" />
            </button>
          </div>
        )}

        {/* Formulario de Carga */}
        <form onSubmit={handleCrearGastoSubmit} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3 p-4 bg-elevated/40 border border-subtle rounded-xl items-end">
          {/* Switch de Divisa */}
          <div className="lg:col-span-1 space-y-1">
            <label className="text-[10px] font-mono uppercase text-muted font-bold block">DIVISA</label>
            <div className="flex border border-subtle rounded-lg bg-surface p-0.5">
              <button
                type="button"
                onClick={() => setMonedaGasto('ARS')}
                className={`flex-1 py-1 text-xs font-mono font-bold rounded transition-colors cursor-pointer ${
                  monedaGasto === 'ARS' ? 'bg-amber-400 text-zinc-950' : 'text-muted hover:text-primary'
                }`}
              >
                ARS ($)
              </button>
              <button
                type="button"
                onClick={() => setMonedaGasto('USD')}
                className={`flex-1 py-1 text-xs font-mono font-bold rounded transition-colors cursor-pointer ${
                  monedaGasto === 'USD' ? 'bg-emerald-500 text-white' : 'text-muted hover:text-primary'
                }`}
              >
                USD (U$S)
              </button>
            </div>
          </div>

          {/* Importe */}
          <div className="lg:col-span-1 space-y-1">
            <label className="text-[10px] font-mono uppercase text-muted font-bold block">
              {monedaGasto === 'USD' ? 'IMPORTE (U$S)' : 'IMPORTE ($ ARS)'}
            </label>
            <input
              type="number"
              step="any"
              min="0"
              placeholder={monedaGasto === 'USD' ? 'Ej: 50' : 'Ej: 15000'}
              value={montoGasto}
              onChange={(e) => setMontoGasto(e.target.value)}
              className="w-full bg-surface border border-subtle focus:border-strong rounded-lg text-primary text-xs font-mono tabular-nums px-3 py-2 outline-none"
              required
            />
          </div>

          {/* Si es USD: Tipo de Dólar */}
          {monedaGasto === 'USD' ? (
            <div className="lg:col-span-1 space-y-1">
              <label className="text-[10px] font-mono uppercase text-muted font-bold block">TIPO CAMBIO</label>
              <select
                value={tipoDolarGasto}
                onChange={(e) => setTipoDolarGasto(e.target.value as 'Blue' | 'Oficial')}
                className="w-full bg-surface border border-subtle focus:border-strong rounded-lg text-primary text-xs font-mono px-2.5 py-2 outline-none"
              >
                <option value="Blue">Blue (${cotizacionDolar?.blue.venta ?? 1240})</option>
                <option value="Oficial">Oficial (${cotizacionDolar?.oficial.venta ?? 1090})</option>
              </select>
            </div>
          ) : (
            <div className="lg:col-span-1 space-y-1">
              <label className="text-[10px] font-mono uppercase text-muted font-bold block">CATEGORÍA</label>
              <select
                value={categoriaGasto}
                onChange={(e) => setCategoriaGasto(e.target.value)}
                className="w-full bg-surface border border-subtle focus:border-strong rounded-lg text-primary text-xs font-mono px-2.5 py-2 outline-none"
              >
                {CATEGORIAS_GASTO.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
          )}

          {/* Descripción */}
          <div className={monedaGasto === 'USD' ? 'lg:col-span-2 space-y-1' : 'lg:col-span-2 space-y-1'}>
            <label className="text-[10px] font-mono uppercase text-muted font-bold block">DESCRIPCIÓN DEL GASTO</label>
            <input
              type="text"
              placeholder="Ej: Pago de flete, bolsas kraft o café"
              value={descGasto}
              onChange={(e) => setDescGasto(e.target.value)}
              className="w-full bg-surface border border-subtle focus:border-strong rounded-lg text-primary text-xs font-mono px-3 py-2 outline-none"
              required
            />
          </div>

          {/* Botón Guardar */}
          <div className="lg:col-span-1">
            <Button
              type="submit"
              variant="primary"
              size="sm"
              className="w-full justify-center text-xs py-2"
              disabled={registrarGastoMutation.isPending}
            >
              <PlusCircle size={15} weight="bold" />
              <span>{registrarGastoMutation.isPending ? 'Guardando...' : 'Registrar'}</span>
            </Button>
          </div>
        </form>

        {/* Resumen de Conversión en Tiempo Real si es USD */}
        {monedaGasto === 'USD' && montoNum > 0 && (
          <div className="border border-emerald-500/30 bg-emerald-500/10 rounded-xl p-3 flex items-center justify-between text-xs font-mono">
            <span className="text-secondary flex items-center gap-1.5">
              <Coins size={16} weight="duotone" className="text-emerald-500" />
              <span>CONVERSIÓN EN VIVO A PESOS:</span>
            </span>
            <span className="font-bold text-emerald-600 dark:text-emerald-400 tabular-nums">
              U$S {montoNum.toLocaleString('es-AR')} × ${cotizacionAplicadaVenta.toLocaleString('es-AR')} ({tipoDolarGasto}) ={' '}
              <strong className="text-base text-primary">${montoEstimadoArs.toLocaleString('es-AR')} ARS</strong>
            </span>
          </div>
        )}

        {/* Tabla de Gastos Recientes */}
        {dataGastos && dataGastos.gastos.length > 0 ? (
          <div className="overflow-x-auto border border-subtle rounded-xl">
            <table className="w-full text-left text-xs font-mono border-collapse">
              <thead className="bg-elevated text-secondary border-b border-subtle">
                <tr>
                  <th className="py-2.5 px-3 uppercase tracking-wider font-semibold">Descripción</th>
                  <th className="py-2.5 px-3 uppercase tracking-wider font-semibold">Categoría</th>
                  <th className="py-2.5 px-3 uppercase tracking-wider font-semibold">Moneda Original</th>
                  <th className="py-2.5 px-3 uppercase tracking-wider font-semibold">Tipo Cambio</th>
                  <th className="py-2.5 px-3 uppercase tracking-wider font-semibold text-right">Total en Pesos</th>
                  <th className="py-2.5 px-3 uppercase tracking-wider font-semibold text-center">Acción</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-subtle">
                {dataGastos.gastos.map((gasto) => (
                  <tr key={gasto.id} className="hover:bg-elevated/50 transition-colors">
                    <td className="py-2.5 px-3 font-medium text-primary">
                      {gasto.descripcion}
                    </td>
                    <td className="py-2.5 px-3 text-secondary">
                      <span className="px-2 py-0.5 rounded border border-subtle bg-elevated text-[10px]">
                        {gasto.categoria}
                      </span>
                    </td>
                    <td className="py-2.5 px-3">
                      {gasto.moneda === 'USD' ? (
                        <span className="font-bold text-emerald-600 dark:text-emerald-400">
                          U$S {gasto.montoMonedaOriginal.toLocaleString('es-AR')}
                        </span>
                      ) : (
                        <span className="text-secondary">
                          $ {gasto.montoMonedaOriginal.toLocaleString('es-AR')} ARS
                        </span>
                      )}
                    </td>
                    <td className="py-2.5 px-3 text-muted">
                      {gasto.tipoCambioAplicado ? `$ ${gasto.tipoCambioAplicado.toLocaleString('es-AR')} (${gasto.tipoDolar ?? 'Blue'})` : '—'}
                    </td>
                    <td className="py-2.5 px-3 text-right font-bold text-primary tabular-nums">
                      $ {gasto.monto.toLocaleString('es-AR')}
                    </td>
                    <td className="py-2.5 px-3 text-center">
                      <button
                        type="button"
                        onClick={() => eliminarGastoMutation.mutate(gasto.id)}
                        disabled={eliminarGastoMutation.isPending}
                        className="text-muted hover:text-red-500 p-1 rounded transition-colors cursor-pointer"
                        title="Eliminar gasto"
                      >
                        <Trash size={14} weight="bold" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-4 text-center text-xs font-mono text-muted border border-dashed border-subtle rounded-xl">
            No hay gastos registrados en el sistema. Registra egresos para descontarlos de la ganancia neta.
          </div>
        )}
      </div>

      {/* ======================================================== */}
      {/* 4. Calculadora Interactiva de Costos Ocultos             */}
      {/* ======================================================== */}
      <div className="bg-surface border border-subtle rounded-xl shadow-surface p-5 sm:p-6 space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-subtle">
          <div className="flex items-center gap-2">
            <SlidersHorizontal size={18} className="text-amber-500 dark:text-amber-400" />
            <h2 className="font-heading font-bold text-sm sm:text-base tracking-tight uppercase text-primary">
              CALCULADORA DE COSTOS OCULTOS (E-COMMERCE &amp; LOCAL)
            </h2>
          </div>
          <span className="text-[11px] font-mono text-muted uppercase">
            Ajusta los valores para calibrar tu rentabilidad neta real
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs font-mono">
          {/* Pauta Publicitaria (Ads) */}
          <div className="space-y-1.5 p-3.5 bg-elevated border border-subtle rounded-lg">
            <label className="text-secondary font-semibold uppercase block">
              PAUTA META &amp; GOOGLE ADS ($)
            </label>
            <input
              type="number"
              step="10000"
              value={gastoAds}
              onChange={(e) => setGastoAds(parseFloat(e.target.value) || 0)}
              className="w-full bg-surface border border-subtle focus:border-strong rounded-md p-2 text-primary font-bold tabular-nums outline-none"
            />
            <span className="text-[10px] text-muted block">Inversión publicitaria mensual</span>
          </div>

          {/* Envíos Gratis Absorbidos */}
          <div className="space-y-1.5 p-3.5 bg-elevated border border-subtle rounded-lg">
            <label className="text-secondary font-semibold uppercase block">
              ENVÍOS ABSORBIDOS ($)
            </label>
            <input
              type="number"
              step="5000"
              value={enviosAbsorbidos}
              onChange={(e) => setEnviosAbsorbidos(parseFloat(e.target.value) || 0)}
              className="w-full bg-surface border border-subtle focus:border-strong rounded-md p-2 text-primary font-bold tabular-nums outline-none"
            />
            <span className="text-[10px] text-muted block">Costo logístico asumido por la marca</span>
          </div>

          {/* Comisión Pasarela (%) */}
          <div className="space-y-1.5 p-3.5 bg-elevated border border-subtle rounded-lg">
            <div className="flex justify-between items-center">
              <label className="text-secondary font-semibold uppercase">
                PASARELA / GATEWAY (%)
              </label>
              <span className="text-muted font-bold">{comisionPasarelaPct}%</span>
            </div>
            <input
              type="number"
              step="0.5"
              min="0"
              max="20"
              value={comisionPasarelaPct}
              onChange={(e) => setComisionPasarelaPct(parseFloat(e.target.value) || 0)}
              className="w-full bg-surface border border-subtle focus:border-strong rounded-md p-2 text-primary font-bold tabular-nums outline-none"
            />
            <span className="text-[10px] text-muted block">
              Equivale a $ {costoComisionPasarela.toLocaleString('es-AR')} en ventas digitales
            </span>
          </div>

          {/* Suscripción Tiendanube */}
          <div className="space-y-1.5 p-3.5 bg-elevated border border-subtle rounded-lg">
            <label className="text-secondary font-semibold uppercase block">
              TIENDANUBE PLAN MENSUAL ($)
            </label>
            <input
              type="number"
              step="5000"
              value={suscripcionTiendanube}
              onChange={(e) => setSuscripcionTiendanube(parseFloat(e.target.value) || 0)}
              className="w-full bg-surface border border-subtle focus:border-strong rounded-md p-2 text-primary font-bold tabular-nums outline-none"
            />
            <span className="text-[10px] text-muted block">Costo mensual de infraestructura SaaS</span>
          </div>
        </div>

        {/* Resumen de Descuentos */}
        <div className="p-3.5 bg-elevated/60 border border-subtle rounded-lg flex flex-wrap items-center justify-between text-xs font-mono text-secondary gap-3">
          <div className="flex items-center gap-2">
            <span className="text-muted">Total Costos Ocultos Estimados:</span>
            <span className="font-bold text-red-600 dark:text-red-400 tabular-nums">
              - $ {totalCostosOcultos.toLocaleString('es-AR')}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-muted">Gastos de Caja Físicos:</span>
            <span className="font-bold text-red-600 dark:text-red-400 tabular-nums">
              - $ {gastosCaja.toLocaleString('es-AR')}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-muted">Egresos Multidivisa Registrados:</span>
            <span className="font-bold text-red-600 dark:text-red-400 tabular-nums">
              - $ {totalGastosLedger.toLocaleString('es-AR')}
            </span>
          </div>
        </div>
      </div>

      {/* ======================================================== */}
      {/* 5. Desglose de Medios de Pago & Unidad de Negocio        */}
      {/* ======================================================== */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Medios de Pago (2 columnas) */}
        <div className="lg:col-span-2 bg-surface border border-subtle rounded-xl shadow-surface p-5 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-subtle">
            <div className="flex items-center gap-2">
              <Money size={18} className="text-amber-500 dark:text-amber-400" />
              <h2 className="font-heading font-bold text-sm tracking-tight uppercase text-primary">
                DISTRIBUCIÓN POR MEDIOS DE PAGO
              </h2>
            </div>
            <span className="text-xs font-mono text-muted">Total: $ {sumaMediosPago.toLocaleString('es-AR')}</span>
          </div>

          <div className="space-y-4">
            {/* Efectivo */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs font-mono">
                <span className="flex items-center gap-1.5 text-primary">
                  <Money size={14} className="text-emerald-600 dark:text-emerald-400" />
                  EFECTIVO (Caja física)
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
                  TRANSFERENCIA (Alias Ale / Facundo)
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
                  <CreditCard size={14} className="text-indigo-600 dark:text-indigo-400" />
                  DÉBITO
                </span>
                <span className="font-bold text-primary tabular-nums">
                  $ {totalDebito.toLocaleString('es-AR')}{' '}
                  <span className="text-muted font-normal">({pctDebito.toFixed(1)}%)</span>
                </span>
              </div>
              <div className="w-full h-2 bg-elevated rounded-full overflow-hidden">
                <div
                  className="h-full bg-indigo-500 rounded-full"
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
      {/* 6. Inteligencia de Stock y Rotación (Tabs / Tablas)     */}
      {/* ======================================================== */}
      <div className="bg-surface border border-subtle rounded-xl shadow-surface p-5 sm:p-6 space-y-4">
        {/* Cabecera y Selector de Pestaña */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-subtle">
          <div className="flex items-center gap-2">
            <Package size={18} className="text-amber-500 dark:text-amber-400" />
            <h2 className="font-heading font-bold text-sm sm:text-base tracking-tight uppercase text-primary">
              INTELIGENCIA DE CATÁLOGO &amp; VELOCIDAD DE ROTACIÓN
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
                <span>ALTA ROTACIÓN &amp; REPOSICIÓN ({topMasVendidos.length})</span>
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
                <span>STOCK ESTANCADO ({productosEstancados.length})</span>
              </span>
            </button>
          </div>
        </div>

        {/* Contenido de la Pestaña Activa */}
        <AnimatePresence mode="wait">
          {pestañaStock === 'alta-rotacion' && (
            <motion.div
              key="alta-rotacion"
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.15 }}
              className="space-y-3"
            >
              <div className="text-xs font-mono text-muted flex items-center justify-between">
                <span>PRENDAS MÁS VENDIDAS DEL PERÍODO // RANKING POR UNIDADES</span>
                <span className="text-emerald-600 dark:text-emerald-400 font-bold">ALTA VELOCIDAD DE VENTA</span>
              </div>

              {topMasVendidos.length === 0 ? (
                <div className="p-8 text-center text-xs font-mono text-muted border border-dashed border-subtle rounded-lg">
                  No se registraron ventas en el período seleccionado.
                </div>
              ) : (
                <div className="overflow-x-auto border border-subtle rounded-lg">
                  <table className="w-full text-left text-xs font-mono border-collapse">
                    <thead className="bg-elevated text-secondary border-b border-subtle">
                      <tr>
                        <th className="py-2.5 px-3 uppercase tracking-wider font-semibold">Prenda</th>
                        <th className="py-2.5 px-3 uppercase tracking-wider font-semibold">Talle/Color</th>
                        <th className="py-2.5 px-3 uppercase tracking-wider font-semibold">Unidad</th>
                        <th className="py-2.5 px-3 uppercase tracking-wider font-semibold text-right">Vendidos</th>
                        <th className="py-2.5 px-3 uppercase tracking-wider font-semibold text-right">Stock Actual</th>
                        <th className="py-2.5 px-3 uppercase tracking-wider font-semibold text-right">Facturación</th>
                        <th className="py-2.5 px-3 uppercase tracking-wider font-semibold text-center">Estado Reposición</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-subtle">
                      {topMasVendidos.map((item) => {
                        const critico = item.stockActual <= 2;
                        return (
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
                            <td className="py-2.5 px-3 font-bold text-emerald-600 dark:text-emerald-400 text-right tabular-nums">
                              {item.unidadesVendidas} u
                            </td>
                            <td className="py-2.5 px-3 font-bold text-primary text-right tabular-nums">
                              {item.stockActual} u
                            </td>
                            <td className="py-2.5 px-3 text-right tabular-nums font-bold text-primary">
                              $ {item.ingresosGenerados.toLocaleString('es-AR')}
                            </td>
                            <td className="py-2.5 px-3 text-center">
                              {critico ? (
                                <span className="inline-block px-2 py-0.5 rounded-md bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/30 font-bold text-[10px]">
                                  STOCK CRÍTICO (&le; 2) // REPONER
                                </span>
                              ) : (
                                <span className="inline-block px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 text-[10px]">
                                  STOCK SALUDABLE
                                </span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </motion.div>
          )}

          {pestañaStock === 'estancados' && (
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
