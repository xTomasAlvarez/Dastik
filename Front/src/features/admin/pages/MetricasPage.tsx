import React, { useState, useEffect } from 'react';
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
      {/* 1. Header Avant-Garde y Barra de Filtros                 */}
      {/* ======================================================== */}
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4 pb-4 border-b border-[#222222]">
        <div>
          <span className="text-[10px] font-mono uppercase tracking-[0.25em] text-[#71717A] block">
            INTELIGENCIA COMERCIAL // FINANZAS REALES & ROTACIÓN
          </span>
          <h1 className="font-heading font-extrabold text-2xl md:text-3xl text-[#FAFAFA] tracking-tight uppercase">
            RENTABILIDAD & VELOCIDAD DE STOCK
          </h1>
        </div>

        {/* Filtros de Período y Unidad de Negocio */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Selector de Período */}
          <div className="flex items-center border border-[#333333] bg-[#0C0C0C] p-0.5">
            {PERIODOS.map((p) => {
              const activo = periodo === p.key;
              return (
                <button
                  key={p.key}
                  type="button"
                  onClick={() => setPeriodo(p.key)}
                  className={`px-3 py-1.5 text-xs font-mono uppercase transition-colors cursor-pointer ${
                    activo
                      ? 'bg-amber-400 text-black font-bold'
                      : 'text-[#A1A1AA] hover:text-[#FAFAFA]'
                  }`}
                  title={p.desc}
                >
                  {p.label}
                </button>
              );
            })}
          </div>

          {/* Selector de Unidad de Negocio */}
          <div className="flex items-center border border-[#333333] bg-[#0C0C0C] p-0.5">
            {UNIDADES_NEGOCIO.map((u) => {
              const activo = unidadNegocioId === u.id;
              return (
                <button
                  key={u.id}
                  type="button"
                  onClick={() => setUnidadNegocioId(u.id)}
                  className={`px-3 py-1.5 text-xs font-mono uppercase transition-colors cursor-pointer ${
                    activo
                      ? 'bg-[#FAFAFA] text-black font-bold'
                      : 'text-[#A1A1AA] hover:text-[#FAFAFA]'
                  }`}
                >
                  {u.label}
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
            className="border-[#333333] text-xs font-mono gap-1.5"
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
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* KPI 1: Ingresos Brutos */}
        <div className="bg-[#090909] border border-[#222222] p-5 flex flex-col justify-between">
          <div className="flex items-center justify-between text-[#71717A] mb-2">
            <span className="text-[10px] font-mono uppercase tracking-widest">
              FACTURACIÓN BRUTA
            </span>
            <CurrencyDollar size={18} className="text-amber-400" />
          </div>
          <div className="space-y-1">
            <span className="text-2xl md:text-3xl font-mono font-bold text-[#FAFAFA] tracking-tight block">
              $ {ingresosBrutos.toLocaleString('es-AR')}
            </span>
            <div className="flex items-center justify-between text-[11px] font-mono text-[#71717A]">
              <span>{cantidadOperaciones} ventas</span>
              <span>Ticket prom: $ {ticketPromedio.toLocaleString('es-AR')}</span>
            </div>
          </div>
        </div>

        {/* KPI 2: Costo de Mercadería Vendida (CMV) */}
        <div className="bg-[#090909] border border-[#222222] p-5 flex flex-col justify-between">
          <div className="flex items-center justify-between text-[#71717A] mb-2">
            <span className="text-[10px] font-mono uppercase tracking-widest">
              COSTO DE MERCADERÍA (CMV)
            </span>
            <Package size={18} className="text-[#A1A1AA]" />
          </div>
          <div className="space-y-1">
            <span className="text-2xl md:text-3xl font-mono font-bold text-[#A1A1AA] tracking-tight block">
              $ {costoMercaderiaVendida.toLocaleString('es-AR')}
            </span>
            <span className="text-[11px] font-mono text-[#71717A] block">
              Costo base real de prendas cobradas
            </span>
          </div>
        </div>

        {/* KPI 3: Ganancia Bruta (Local) */}
        <div className="bg-[#090909] border border-[#222222] p-5 flex flex-col justify-between">
          <div className="flex items-center justify-between text-[#71717A] mb-2">
            <span className="text-[10px] font-mono uppercase tracking-widest">
              GANANCIA BRUTA
            </span>
            <TrendUp size={18} className="text-emerald-400" />
          </div>
          <div className="space-y-1">
            <span className="text-2xl md:text-3xl font-mono font-bold text-emerald-400 tracking-tight block">
              $ {gananciaBruta.toLocaleString('es-AR')}
            </span>
            <span className="text-[11px] font-mono text-[#71717A] block">
              Ventas - Costos de producción
            </span>
          </div>
        </div>

        {/* KPI 4: GANANCIA NETA REAL DE BOLSILLO */}
        <div
          className={`border p-5 flex flex-col justify-between ${
            gananciaNetaReal >= 0
              ? 'bg-[#0A140D] border-emerald-500/50'
              : 'bg-[#180A0A] border-red-500/50'
          }`}
        >
          <div className="flex items-center justify-between text-[#71717A] mb-2">
            <span className="text-[10px] font-mono uppercase tracking-widest text-amber-400 font-bold">
              GANANCIA NETA REAL (BOLSILLO)
            </span>
            <Lightning
              size={18}
              weight="fill"
              className={gananciaNetaReal >= 0 ? 'text-emerald-400' : 'text-red-400'}
            />
          </div>
          <div className="space-y-1">
            <span
              className={`text-2xl md:text-3xl font-mono font-bold tracking-tight block ${
                gananciaNetaReal >= 0 ? 'text-emerald-400' : 'text-red-400'
              }`}
            >
              $ {gananciaNetaReal.toLocaleString('es-AR')}
            </span>
            <div className="flex items-center justify-between text-[11px] font-mono">
              <span className="text-[#A1A1AA]">Margen neto:</span>
              <span
                className={`font-bold ${
                  gananciaNetaReal >= 0 ? 'text-emerald-400' : 'text-red-400'
                }`}
              >
                {margenNetoRealPct.toFixed(1)}%
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ======================================================== */}
      {/* 3. Calculadora Interactiva de Costos Ocultos             */}
      {/* ======================================================== */}
      <div className="bg-[#090909] border border-[#222222] p-5 sm:p-6 space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-[#222222]">
          <div className="flex items-center gap-2">
            <SlidersHorizontal size={18} className="text-amber-400" />
            <h2 className="font-heading font-extrabold text-sm sm:text-base tracking-wider uppercase text-[#FAFAFA]">
              CALCULADORA DE COSTOS OCULTOS (E-COMMERCE & LOCAL)
            </h2>
          </div>
          <span className="text-[10px] font-mono text-[#71717A] uppercase">
            Ajusta los valores para calibrar tu rentabilidad neta real
          </span>
        </div>

        {/* Grilla de Inputs de Costos */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Input 1: Gasto en Ads */}
          <div className="bg-[#0C0C0C] border border-[#222222] p-3 space-y-1">
            <label className="text-[10px] font-mono uppercase text-[#A1A1AA] block">
              Gasto en Publicidad / Ads ($ ARS)
            </label>
            <input
              type="number"
              min="0"
              value={gastoAds}
              onChange={(e) => setGastoAds(parseFloat(e.target.value) || 0)}
              className="w-full bg-[#141414] border border-[#333333] px-3 py-1.5 text-sm font-mono font-bold text-amber-400 outline-none focus:border-amber-400"
            />
            <span className="text-[9px] font-mono text-[#71717A] block">
              Meta Ads + Google Ads (~30 USD/día)
            </span>
          </div>

          {/* Input 2: Envíos Absorbidos */}
          <div className="bg-[#0C0C0C] border border-[#222222] p-3 space-y-1">
            <label className="text-[10px] font-mono uppercase text-[#A1A1AA] block">
              Envíos Absorbidos ($ ARS)
            </label>
            <input
              type="number"
              min="0"
              value={enviosAbsorbidos}
              onChange={(e) => setEnviosAbsorbidos(parseFloat(e.target.value) || 0)}
              className="w-full bg-[#141414] border border-[#333333] px-3 py-1.5 text-sm font-mono font-bold text-amber-400 outline-none focus:border-amber-400"
            />
            <span className="text-[9px] font-mono text-[#71717A] block">
              Costos logísticos bonificados (&gt; $100k)
            </span>
          </div>

          {/* Input 3: Comisión Pasarela Pago (%) */}
          <div className="bg-[#0C0C0C] border border-[#222222] p-3 space-y-1">
            <label className="text-[10px] font-mono uppercase text-[#A1A1AA] block">
              Comisión Pasarela (%)
            </label>
            <input
              type="number"
              min="0"
              max="100"
              step="0.1"
              value={comisionPasarelaPct}
              onChange={(e) => setComisionPasarelaPct(parseFloat(e.target.value) || 0)}
              className="w-full bg-[#141414] border border-[#333333] px-3 py-1.5 text-sm font-mono font-bold text-amber-400 outline-none focus:border-amber-400"
            />
            <span className="text-[9px] font-mono text-[#71717A] block">
              Retención: $ {costoComisionPasarela.toLocaleString('es-AR')} sobre ventas digitales
            </span>
          </div>

          {/* Input 4: Suscripción Mensual Tiendanube / Costos Fijos */}
          <div className="bg-[#0C0C0C] border border-[#222222] p-3 space-y-1">
            <label className="text-[10px] font-mono uppercase text-[#A1A1AA] block">
              Suscripción / Costos Fijos ($ ARS)
            </label>
            <input
              type="number"
              min="0"
              value={suscripcionTiendanube}
              onChange={(e) => setSuscripcionTiendanube(parseFloat(e.target.value) || 0)}
              className="w-full bg-[#141414] border border-[#333333] px-3 py-1.5 text-sm font-mono font-bold text-amber-400 outline-none focus:border-amber-400"
            />
            <span className="text-[9px] font-mono text-[#71717A] block">
              Plan Tiendanube + apps conectadas
            </span>
          </div>
        </div>

        {/* Strip de Fórmula Visual Clara */}
        <div className="p-3.5 bg-[#0C0C0C] border border-[#333333] font-mono text-xs flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2 text-[#A1A1AA]">
            <span className="text-emerald-400 font-bold">
              GANANCIA BRUTA ($ {gananciaBruta.toLocaleString('es-AR')})
            </span>
            <span>-</span>
            <span className="text-amber-400 font-bold" title="Gastos de turnos de caja (Uber, comida, etc.)">
              GASTOS DE CAJA ($ {gastosCaja.toLocaleString('es-AR')})
            </span>
            <span>-</span>
            <span className="text-red-400 font-bold" title="Ads + Envíos + Pasarela + Suscripción">
              COSTOS DIGITALES Y ADS ($ {totalCostosOcultos.toLocaleString('es-AR')})
            </span>
            <span>=</span>
          </div>

          <div
            className={`px-3 py-1 font-bold text-sm border ${
              gananciaNetaReal >= 0
                ? 'bg-emerald-950 text-emerald-400 border-emerald-600'
                : 'bg-red-950 text-red-400 border-red-600'
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
        <div className="lg:col-span-2 bg-[#090909] border border-[#222222] p-5 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-[#222222]">
            <div className="flex items-center gap-2">
              <CreditCard size={18} className="text-amber-400" />
              <h2 className="font-heading font-extrabold text-sm tracking-wider uppercase text-[#FAFAFA]">
                DISTRIBUCIÓN POR MEDIOS DE PAGO
              </h2>
            </div>
            <span className="text-[10px] font-mono text-[#71717A]">
              TOTAL: $ {sumaMediosPago.toLocaleString('es-AR')}
            </span>
          </div>

          <div className="space-y-3.5">
            {/* Efectivo */}
            <div className="space-y-1">
              <div className="flex justify-between text-xs font-mono">
                <span className="flex items-center gap-1.5 text-[#FAFAFA]">
                  <Money size={14} className="text-emerald-400" />
                  EFECTIVO (Gaveta Mostrador)
                </span>
                <span className="font-bold text-[#FAFAFA]">
                  $ {totalEfectivo.toLocaleString('es-AR')}{' '}
                  <span className="text-[#71717A] font-normal">({pctEfectivo.toFixed(1)}%)</span>
                </span>
              </div>
              <div className="w-full h-2 bg-[#1A1A1A]">
                <div
                  className="h-full bg-emerald-500"
                  style={{ width: `${Math.min(pctEfectivo, 100)}%` }}
                />
              </div>
            </div>

            {/* Transferencia */}
            <div className="space-y-1">
              <div className="flex justify-between text-xs font-mono">
                <span className="flex items-center gap-1.5 text-[#FAFAFA]">
                  <Bank size={14} className="text-blue-400" />
                  TRANSFERENCIA (Alias Ale / Gordo)
                </span>
                <span className="font-bold text-[#FAFAFA]">
                  $ {totalTransferencia.toLocaleString('es-AR')}{' '}
                  <span className="text-[#71717A] font-normal">
                    ({pctTransferencia.toFixed(1)}%)
                  </span>
                </span>
              </div>
              <div className="w-full h-2 bg-[#1A1A1A]">
                <div
                  className="h-full bg-blue-500"
                  style={{ width: `${Math.min(pctTransferencia, 100)}%` }}
                />
              </div>
            </div>

            {/* Débito */}
            <div className="space-y-1">
              <div className="flex justify-between text-xs font-mono">
                <span className="flex items-center gap-1.5 text-[#FAFAFA]">
                  <CreditCard size={14} className="text-amber-400" />
                  DÉBITO
                </span>
                <span className="font-bold text-[#FAFAFA]">
                  $ {totalDebito.toLocaleString('es-AR')}{' '}
                  <span className="text-[#71717A] font-normal">({pctDebito.toFixed(1)}%)</span>
                </span>
              </div>
              <div className="w-full h-2 bg-[#1A1A1A]">
                <div
                  className="h-full bg-amber-500"
                  style={{ width: `${Math.min(pctDebito, 100)}%` }}
                />
              </div>
            </div>

            {/* Crédito */}
            <div className="space-y-1">
              <div className="flex justify-between text-xs font-mono">
                <span className="flex items-center gap-1.5 text-[#FAFAFA]">
                  <CreditCard size={14} className="text-purple-400" />
                  CRÉDITO (Cuotas con recargo)
                </span>
                <span className="font-bold text-[#FAFAFA]">
                  $ {totalCredito.toLocaleString('es-AR')}{' '}
                  <span className="text-[#71717A] font-normal">({pctCredito.toFixed(1)}%)</span>
                </span>
              </div>
              <div className="w-full h-2 bg-[#1A1A1A]">
                <div
                  className="h-full bg-purple-500"
                  style={{ width: `${Math.min(pctCredito, 100)}%` }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Facturación por Unidad de Negocio (1 columna) */}
        <div className="bg-[#090909] border border-[#222222] p-5 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-[#222222]">
            <div className="flex items-center gap-2">
              <Tag size={18} className="text-amber-400" />
              <h2 className="font-heading font-extrabold text-sm tracking-wider uppercase text-[#FAFAFA]">
                UNIDAD DE NEGOCIO
              </h2>
            </div>
          </div>

          <div className="space-y-4">
            <div className="p-3 bg-[#0C0C0C] border border-[#222222] space-y-1">
              <span className="text-[10px] font-mono text-[#71717A] uppercase tracking-wider block">
                DASTIK (STREETWEAR)
              </span>
              <span className="text-xl font-mono font-bold text-[#FAFAFA] block">
                $ {(metricas?.ingresosDastik ?? 0).toLocaleString('es-AR')}
              </span>
              <span className="text-[10px] font-mono text-emerald-400">
                Sincronizado con Tiendanube API
              </span>
            </div>

            <div className="p-3 bg-[#0C0C0C] border border-[#222222] space-y-1">
              <span className="text-[10px] font-mono text-[#71717A] uppercase tracking-wider block">
                HIDDEN SNEAKERS
              </span>
              <span className="text-xl font-mono font-bold text-[#FAFAFA] block">
                $ {(metricas?.ingresosHiddenSneakers ?? 0).toLocaleString('es-AR')}
              </span>
              <span className="text-[10px] font-mono text-[#A1A1AA]">
                Inventario local de zapatillas
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ======================================================== */}
      {/* 5. Inteligencia de Stock y Rotación (Tabs / Tablas)     */}
      {/* ======================================================== */}
      <div className="bg-[#090909] border border-[#222222] p-5 sm:p-6 space-y-4">
        {/* Cabecera y Selector de Pestaña */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#222222]">
          <div className="flex items-center gap-2">
            <Package size={18} className="text-amber-400" />
            <h2 className="font-heading font-extrabold text-sm sm:text-base tracking-wider uppercase text-[#FAFAFA]">
              INTELIGENCIA DE CATÁLOGO & VELOCIDAD DE ROTACIÓN
            </h2>
          </div>

          {/* Switch de Pestañas */}
          <div className="flex border border-[#333333] bg-[#0C0C0C] p-0.5">
            <button
              type="button"
              onClick={() => setPestañaStock('alta-rotacion')}
              className={`px-4 py-1.5 text-xs font-mono uppercase transition-colors cursor-pointer flex items-center gap-1.5 ${
                pestañaStock === 'alta-rotacion'
                  ? 'bg-amber-400 text-black font-bold'
                  : 'text-[#A1A1AA] hover:text-[#FAFAFA]'
              }`}
            >
              <Lightning size={14} weight="bold" />
              <span>ALTA ROTACIÓN & REPOSICIÓN ({topMasVendidos.length})</span>
            </button>
            <button
              type="button"
              onClick={() => setPestañaStock('estancados')}
              className={`px-4 py-1.5 text-xs font-mono uppercase transition-colors cursor-pointer flex items-center gap-1.5 ${
                pestañaStock === 'estancados'
                  ? 'bg-amber-400 text-black font-bold'
                  : 'text-[#A1A1AA] hover:text-[#FAFAFA]'
              }`}
            >
              <Hourglass size={14} weight="bold" />
              <span>STOCK INMOVILIZADO ({productosEstancados.length})</span>
            </button>
          </div>
        </div>

        {/* Contenido Pestaña 1: ALTA ROTACIÓN & REPOSICIÓN */}
        {pestañaStock === 'alta-rotacion' && (
          <div className="space-y-3">
            <div className="text-xs font-mono text-[#71717A] flex items-center justify-between">
              <span>TOP PRENDAS MÁS VENDIDAS // CÁLCULO DE VELOCIDAD DIARIA & DEMANDA A 7 DÍAS</span>
              <span className="text-amber-400">PERÍODO: {periodo.toUpperCase()}</span>
            </div>

            {topMasVendidos.length === 0 ? (
              <div className="p-8 text-center text-xs font-mono text-[#71717A] border border-dashed border-[#222222]">
                No hay ventas registradas en el período seleccionado.
              </div>
            ) : (
              <div className="overflow-x-auto border border-[#222222]">
                <table className="w-full text-left text-xs font-mono border-collapse">
                  <thead className="bg-[#0C0C0C] text-[#71717A] border-b border-[#222222]">
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
                  <tbody className="divide-y divide-[#1A1A1A]">
                    {topMasVendidos.map((item) => (
                      <tr key={item.varianteId} className="hover:bg-[#111111] transition-colors">
                        <td className="py-2.5 px-3 font-heading font-bold text-[#FAFAFA] uppercase">
                          {item.productoNombre}
                        </td>
                        <td className="py-2.5 px-3 text-[#A1A1AA]">
                          {item.talle} {item.color ? `/ ${item.color}` : ''}
                        </td>
                        <td className="py-2.5 px-3 text-[#71717A]">
                          {item.unidadNegocio}
                        </td>
                        <td className="py-2.5 px-3 font-bold text-amber-400 text-right">
                          {item.unidadesVendidas} u
                        </td>
                        <td className="py-2.5 px-3 font-bold text-[#FAFAFA] text-right">
                          $ {item.ingresosGenerados.toLocaleString('es-AR')}
                        </td>
                        <td className="py-2.5 px-3 text-right text-emerald-400 font-bold">
                          {item.velocidadDiaria.toFixed(2)} u/día
                        </td>
                        <td className="py-2.5 px-3 text-right font-bold text-[#FAFAFA]">
                          {item.stockActual} u
                        </td>
                        <td className="py-2.5 px-3 text-center">
                          {item.sugerenciaReposicion ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-red-950 text-red-400 border border-red-700 font-bold text-[10px]">
                              <WarningCircle size={12} weight="bold" />
                              REPONER (+{item.cantidadSugerida} u)
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-emerald-950 text-emerald-400 border border-emerald-700 font-bold text-[10px]">
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
          </div>
        )}

        {/* Contenido Pestaña 2: STOCK INMOVILIZADO (SIN ROTACIÓN) */}
        {pestañaStock === 'estancados' && (
          <div className="space-y-3">
            <div className="text-xs font-mono text-[#71717A] flex items-center justify-between">
              <span>
                PRENDAS CON STOCK &gt; 0 Y 0 VENTAS EN EL PERÍODO // CAPITAL INMOVILIZADO TOTAL:{' '}
                <strong className="text-amber-400">
                  $ {totalCapitalInmovilizado.toLocaleString('es-AR')}
                </strong>
              </span>
              <span className="text-red-400">PRIORIDAD DE LIQUIDACIÓN / PROMO</span>
            </div>

            {productosEstancados.length === 0 ? (
              <div className="p-8 text-center text-xs font-mono text-emerald-400 border border-dashed border-[#222222]">
                ¡Excelente rotación! No hay prendas estancadas con stock positivo en este período.
              </div>
            ) : (
              <div className="overflow-x-auto border border-[#222222]">
                <table className="w-full text-left text-xs font-mono border-collapse">
                  <thead className="bg-[#0C0C0C] text-[#71717A] border-b border-[#222222]">
                    <tr>
                      <th className="py-2.5 px-3 uppercase tracking-wider font-semibold">Prenda</th>
                      <th className="py-2.5 px-3 uppercase tracking-wider font-semibold">Talle/Color</th>
                      <th className="py-2.5 px-3 uppercase tracking-wider font-semibold">Unidad</th>
                      <th className="py-2.5 px-3 uppercase tracking-wider font-semibold text-right">Stock Físico</th>
                      <th className="py-2.5 px-3 uppercase tracking-wider font-semibold text-right">Costo Base</th>
                      <th className="py-2.5 px-3 uppercase tracking-wider font-semibold text-right">Precio Venta</th>
                      <th className="py-2.5 px-3 uppercase tracking-wider font-semibold text-right text-red-400">
                        Capital Inmovilizado
                      </th>
                      <th className="py-2.5 px-3 uppercase tracking-wider font-semibold text-center">Acción Sugerida</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#1A1A1A]">
                    {productosEstancados.map((item) => (
                      <tr key={item.varianteId} className="hover:bg-[#111111] transition-colors">
                        <td className="py-2.5 px-3 font-heading font-bold text-[#FAFAFA] uppercase">
                          {item.productoNombre}
                        </td>
                        <td className="py-2.5 px-3 text-[#A1A1AA]">
                          {item.talle} {item.color ? `/ ${item.color}` : ''}
                        </td>
                        <td className="py-2.5 px-3 text-[#71717A]">
                          {item.unidadNegocio}
                        </td>
                        <td className="py-2.5 px-3 font-bold text-[#FAFAFA] text-right">
                          {item.stockFisico} u
                        </td>
                        <td className="py-2.5 px-3 text-[#A1A1AA] text-right">
                          $ {item.costoBase.toLocaleString('es-AR')}
                        </td>
                        <td className="py-2.5 px-3 text-[#FAFAFA] text-right">
                          $ {item.precioVenta.toLocaleString('es-AR')}
                        </td>
                        <td className="py-2.5 px-3 font-bold text-red-400 text-right">
                          $ {item.capitalInmovilizado.toLocaleString('es-AR')}
                        </td>
                        <td className="py-2.5 px-3 text-center">
                          <span className="inline-block px-2 py-0.5 bg-[#1F1400] text-amber-400 border border-amber-600 font-bold text-[10px]">
                            SUGERIR PROMO / FLASH SALE
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
