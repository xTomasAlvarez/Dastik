import React, { useState, useRef, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'motion/react';
import {
  Archive,
  ShieldCheck,
  SignOut,
  TestTube,
  ArrowsLeftRight,
  Sun,
  Moon,
  List,
  X,
  User,
  Clock,
  Money,
  CreditCard,
  Check,
  CaretDown,
  Storefront,
  ChartBar,
  Package,
  Receipt,
  Users,
  TrendUp,
  GearSix,
} from '@phosphor-icons/react';
import { Button } from '../../../components/ui/Button';
import { useAuthStore, SANDBOX_ACCOUNTS } from '../../../stores/useAuthStore';
import { useTenantStore } from '../../../stores/useTenantStore';
import { useThemeStore } from '../../../stores/useThemeStore';
import { cajaApi, type TurnoActivoDto } from '../api/cajaApi';

interface PosHeaderProps {
  turnoActivo?: TurnoActivoDto | null;
  onSolicitarCierreTurno?: () => void;
  onSolicitarCambio?: () => void;
}

interface AdminNavShortcut {
  to: string;
  label: string;
  desc: string;
  icon: React.ReactNode;
  isActive: (pathname: string) => boolean;
}

export const PosHeader: React.FC<PosHeaderProps> = ({
  turnoActivo,
  onSolicitarCierreTurno,
  onSolicitarCambio,
}) => {
  const { usuario, logout, fastSwitchSandboxUser } = useAuthStore();
  const { isSandboxMode, toggleSandboxMode } = useTenantStore();
  const { theme, toggleTheme } = useThemeStore();
  const location = useLocation();

  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isTurnoPopoverOpen, setIsTurnoPopoverOpen] = useState(false);

  const menuContainerRef = useRef<HTMLDivElement>(null);
  const turnoPopoverRef = useRef<HTMLDivElement>(null);

  // Consulta del resumen detallado del turno en curso al abrir el popover
  const { data: resumenTurno, isLoading: isLoadingResumen } = useQuery({
    queryKey: ['resumen-turno-header', turnoActivo?.turnoId],
    queryFn: () => (turnoActivo ? cajaApi.obtenerResumenTurno(turnoActivo.turnoId) : null),
    enabled: Boolean(turnoActivo?.turnoId && isTurnoPopoverOpen),
    refetchInterval: isTurnoPopoverOpen ? 10000 : false,
  });

  const formatearDinero = (monto: number) =>
    new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS',
      minimumFractionDigits: 2,
    }).format(monto);

  // Cerrar menús al hacer clic fuera o presionar Escape
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      if (menuContainerRef.current && !menuContainerRef.current.contains(target)) {
        setIsMenuOpen(false);
      }
      if (turnoPopoverRef.current && !turnoPopoverRef.current.contains(target)) {
        setIsTurnoPopoverOpen(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsMenuOpen(false);
        setIsTurnoPopoverOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  const nombreCajero = usuario?.nombre || 'Cajero';
  const isCurrentTomi =
    usuario?.email?.toLowerCase() === 'tomidev@dastik.com' ||
    usuario?.email?.toLowerCase() === 'tomi.empleado@dastik.com' ||
    Boolean(usuario?.esOcultoDev) ||
    Boolean(usuario?.nombre?.toLowerCase().includes('tomi'));

  const rolCajero = isCurrentTomi
    ? 'Desarrollador (Dev)'
    : usuario?.rol === 'Admin'
    ? 'Dueño'
    : 'Staff';

  const visibleSandboxAccounts = SANDBOX_ACCOUNTS.filter(
    (acc) => isCurrentTomi || (acc.id !== 'tomiDev' && !acc.email.toLowerCase().includes('tomi'))
  );
  const nombreTurno = turnoActivo
    ? new Date(turnoActivo.fechaApertura).getHours() < 14
      ? 'Mañana'
      : 'Tarde'
    : 'Cerrada';

  // Lista de accesos directos de administración (exclusivo Admin)
  const adminShortcuts: AdminNavShortcut[] = [
    {
      to: '/',
      label: 'Terminal POS',
      desc: 'Cobros & mostrador',
      icon: <Storefront size={16} weight="duotone" />,
      isActive: (p) => p === '/' || p === '/pos',
    },
    {
      to: '/admin/dashboard',
      label: 'Dashboard',
      desc: 'Métricas & alertas',
      icon: <ChartBar size={16} weight="duotone" />,
      isActive: (p) => p === '/admin' || p === '/admin/' || p === '/admin/dashboard',
    },
    {
      to: '/admin/inventario',
      label: 'Inventario',
      desc: 'Stock & prendas',
      icon: <Package size={16} weight="duotone" />,
      isActive: (p) => p.startsWith('/admin/inventario'),
    },
    {
      to: '/admin/arqueos',
      label: 'Arqueos',
      desc: 'Cierres de caja',
      icon: <Receipt size={16} weight="duotone" />,
      isActive: (p) => p.startsWith('/admin/arqueos'),
    },
    {
      to: '/admin/empleados',
      label: 'Empleados',
      desc: 'Staff & liquidación',
      icon: <Users size={16} weight="duotone" />,
      isActive: (p) => p.startsWith('/admin/empleados'),
    },
    {
      to: '/admin/metricas',
      label: 'Finanzas',
      desc: 'Rentabilidad & margen',
      icon: <TrendUp size={16} weight="duotone" />,
      isActive: (p) => p.startsWith('/admin/metricas'),
    },
    {
      to: '/admin/configuracion',
      label: 'Configuración',
      desc: 'Marcas & categorías',
      icon: <GearSix size={16} weight="duotone" />,
      isActive: (p) => p.startsWith('/admin/configuracion'),
    },
  ];

  return (
    <header className="w-full bg-surface border-b border-subtle px-4 lg:px-5 py-2.5 flex items-center justify-between gap-3 shrink-0 z-30 shadow-surface">
      {/* Brand con Logo Oficial Dastik Sin Fondo */}
      <div className="flex items-center gap-2.5 min-w-0">
        <img
          src="/DastikSinFondo.png"
          alt="Dastik"
          className="h-6 sm:h-7 w-auto object-contain select-none brightness-50 contrast-125 dark:brightness-110 dark:contrast-100 shrink-0"
        />
        <span className="text-muted font-mono text-sm select-none">/</span>
        <span className="text-xs sm:text-sm font-heading font-bold tracking-tight text-secondary truncate">
          HIDDEN SNEAKERS
        </span>
        {isSandboxMode && (
          <span className="hidden md:inline-flex items-center gap-1 border border-amber-500/40 bg-amber-500/10 text-amber-600 dark:text-amber-400 rounded-md px-1.5 py-0.5 text-[10px] font-mono font-bold shrink-0">
            SANDBOX
          </span>
        )}
      </div>

      {/* Controles Operativos Inmediatos de Caja + Menú Hamburguesa */}
      <div className="flex items-center gap-2 shrink-0">
        {/* Badge Operativo Estilizado y Neutro con Popover de Resumen del Turno */}
        <div className="relative" ref={turnoPopoverRef}>
          <button
            type="button"
            onClick={() => setIsTurnoPopoverOpen((prev) => !prev)}
            className="px-3 py-1.5 rounded-lg flex items-center gap-2 text-xs font-sans border border-subtle bg-surface hover:bg-elevated text-primary transition-all cursor-pointer shadow-xs active:scale-[0.98]"
            title="Ver resumen en curso del turno actual de caja"
          >
            <Storefront size={15} weight="duotone" className="text-secondary shrink-0" />
            <span className="font-semibold text-primary truncate max-w-[170px] sm:max-w-none">
              {turnoActivo ? (
                <>
                  <span className="hidden sm:inline">Caja Abierta · </span>
                  <strong>{nombreCajero}</strong> ({rolCajero}) · {nombreTurno}
                </>
              ) : (
                'Caja Cerrada'
              )}
            </span>
            <CaretDown size={11} weight="bold" className="text-muted ml-0.5" />
          </button>

          {/* Mini-Popover de Resumen del Turno en Curso animado con Spring */}
          <AnimatePresence>
            {isTurnoPopoverOpen && (
              <motion.div
                initial={{ opacity: 0, scale: 0.96, y: -8, filter: 'blur(4px)' }}
                animate={{ opacity: 1, scale: 1, y: 0, filter: 'blur(0px)' }}
                exit={{ opacity: 0, scale: 0.97, y: -6, filter: 'blur(2px)' }}
                transition={{ type: 'spring', stiffness: 420, damping: 30, mass: 0.8 }}
                className="absolute right-0 mt-2 w-80 sm:w-96 rounded-2xl border border-subtle bg-surface/95 backdrop-blur-md shadow-floating p-4 z-50 space-y-3.5"
              >
                {/* Cabecera del Popover */}
                <div className="flex items-start justify-between border-b border-subtle pb-2.5">
                  <div>
                    <div className="flex items-center gap-2">
                      <Storefront size={16} weight="duotone" className="text-secondary shrink-0" />
                      <h4 className="font-heading text-xs font-bold uppercase tracking-wider text-primary">
                        {turnoActivo ? 'Resumen de Turno en Curso' : 'Caja Sin Turno Activo'}
                      </h4>
                    </div>
                    <span className="text-[11px] text-muted font-sans mt-0.5 block">
                      {turnoActivo
                        ? `Turno ${nombreTurno} · Mostrador Oficial`
                        : 'Debe abrir turno para operar ventas'}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsTurnoPopoverOpen(false)}
                    className="text-muted hover:text-primary p-1 rounded-md cursor-pointer"
                  >
                    <X size={14} weight="bold" />
                  </button>
                </div>

                {turnoActivo ? (
                  <>
                    {/* Cajero a Cargo y Hora de Apertura */}
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div className="rounded-xl border border-subtle bg-elevated/70 p-2.5">
                        <div className="flex items-center gap-1.5 text-muted text-[10px] uppercase font-mono mb-1">
                          <User size={13} weight="bold" />
                          <span>Cajero a cargo</span>
                        </div>
                        <span className="font-bold text-primary block truncate">
                          {nombreCajero}
                        </span>
                        <span className="text-[10px] font-mono text-muted block">
                          Rol: {rolCajero}
                        </span>
                      </div>

                      <div className="rounded-xl border border-subtle bg-elevated/70 p-2.5">
                        <div className="flex items-center gap-1.5 text-muted text-[10px] uppercase font-mono mb-1">
                          <Clock size={13} weight="bold" />
                          <span>Hora Apertura</span>
                        </div>
                        <span className="font-bold font-mono text-primary block">
                          {new Date(turnoActivo.fechaApertura).toLocaleTimeString('es-AR', {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}{' '}
                          hs
                        </span>
                        <span className="text-[10px] font-mono text-muted block">
                          {new Date(turnoActivo.fechaApertura).toLocaleDateString('es-AR')}
                        </span>
                      </div>
                    </div>

                    {/* Fondo Inicial Declarado */}
                    <div className="flex items-center justify-between rounded-xl border border-subtle bg-elevated/50 px-3 py-2 text-xs">
                      <span className="text-secondary font-medium">Fondo Inicial Declarado</span>
                      <span className="font-mono font-bold text-primary">
                        {formatearDinero(turnoActivo.saldoInicial)}
                      </span>
                    </div>

                    {/* Desglose de Ventas del Turno */}
                    <div className="rounded-xl border border-subtle bg-elevated/40 p-3 space-y-2 text-xs">
                      <div className="flex items-center justify-between text-[11px] font-mono uppercase text-muted tracking-wider border-b border-subtle pb-1">
                        <span>Ventas Acumuladas</span>
                        <span>
                          {isLoadingResumen
                            ? 'Calculando...'
                            : `${resumenTurno?.cantidadOrdenes ?? 0} tickets`}
                        </span>
                      </div>

                      <div className="flex items-center justify-between">
                        <span className="text-secondary flex items-center gap-1.5">
                          <Money size={14} className="text-emerald-500" />
                          Efectivo:
                        </span>
                        <span className="font-mono font-bold text-primary tabular-nums">
                          {formatearDinero(resumenTurno?.totalVentasEfectivo ?? 0)}
                        </span>
                      </div>

                      <div className="flex items-center justify-between">
                        <span className="text-secondary flex items-center gap-1.5">
                          <ArrowsLeftRight size={14} className="text-blue-500" />
                          Transferencia:
                        </span>
                        <span className="font-mono font-bold text-primary tabular-nums">
                          {formatearDinero(resumenTurno?.totalVentasTransferencia ?? 0)}
                        </span>
                      </div>

                      <div className="flex items-center justify-between">
                        <span className="text-secondary flex items-center gap-1.5">
                          <CreditCard size={14} className="text-purple-500" />
                          Tarjetas (Débito/Crédito):
                        </span>
                        <span className="font-mono font-bold text-primary tabular-nums">
                          {formatearDinero(resumenTurno?.totalVentasTarjeta ?? 0)}
                        </span>
                      </div>

                      <div className="pt-2 border-t border-subtle flex items-baseline justify-between font-bold">
                        <span className="text-primary">Total Recaudado</span>
                        <span className="font-mono text-sm text-emerald-600 dark:text-emerald-400 tabular-nums">
                          {formatearDinero(resumenTurno?.totalVentas ?? 0)}
                        </span>
                      </div>
                    </div>

                    {/* Acciones Rápidas */}
                    <div className="flex items-center gap-2 pt-1">
                      {onSolicitarCierreTurno && (
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => {
                            setIsTurnoPopoverOpen(false);
                            onSolicitarCierreTurno();
                          }}
                          className="flex-1 border-amber-500/40 text-amber-600 dark:text-amber-300 text-xs"
                        >
                          <Archive size={14} weight="duotone" />
                          <span>Cerrar Turno (Arqueo)</span>
                        </Button>
                      )}
                    </div>
                  </>
                ) : (
                  <div className="py-4 text-center text-xs text-muted">
                    No hay un turno de caja activo en este momento.
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Botón de Cambio de Prenda */}
        {turnoActivo && onSolicitarCambio && (
          <Button
            variant="secondary"
            size="sm"
            onClick={onSolicitarCambio}
            className="hover:border-amber-500/60"
            title="Registrar cambio de prenda mano a mano o con diferencia"
          >
            <ArrowsLeftRight size={15} weight="bold" className="text-amber-500" />
            <span>Cambio</span>
          </Button>
        )}

        {/* Botón de Cierre de Turno si hay turno activo */}
        {turnoActivo && onSolicitarCierreTurno && (
          <Button
            variant="secondary"
            size="sm"
            onClick={onSolicitarCierreTurno}
            className="border-amber-500/40 hover:border-amber-500 text-amber-600 dark:text-amber-300"
            title="Realizar arqueo y cierre del turno actual"
          >
            <Archive size={15} weight="duotone" />
            <span className="hidden sm:inline">Cerrar Turno</span>
          </Button>
        )}

        {/* Menú Hamburguesa / Centro de Comando Animado */}
        <div className="relative" ref={menuContainerRef}>
          <button
            type="button"
            onClick={() => setIsMenuOpen((prev) => !prev)}
            className={`border rounded-lg p-2 flex items-center justify-center gap-1.5 text-xs font-semibold transition-all cursor-pointer shadow-surface active:scale-[0.97] ${
              isMenuOpen
                ? 'border-strong bg-elevated text-primary'
                : 'border-subtle bg-elevated hover:bg-surface hover:border-strong text-primary'
            }`}
            aria-expanded={isMenuOpen}
            aria-haspopup="menu"
            aria-label="Abrir centro de comando"
            title="Centro de comando, módulos de admin, tema y cuenta"
          >
            <AnimatePresence mode="wait" initial={false}>
              {isMenuOpen ? (
                <motion.div
                  key="close-icon"
                  initial={{ rotate: -90, opacity: 0, scale: 0.8 }}
                  animate={{ rotate: 0, opacity: 1, scale: 1 }}
                  exit={{ rotate: 90, opacity: 0, scale: 0.8 }}
                  transition={{ duration: 0.15, ease: 'easeOut' }}
                >
                  <X size={18} weight="bold" />
                </motion.div>
              ) : (
                <motion.div
                  key="list-icon"
                  initial={{ rotate: 90, opacity: 0, scale: 0.8 }}
                  animate={{ rotate: 0, opacity: 1, scale: 1 }}
                  exit={{ rotate: -90, opacity: 0, scale: 0.8 }}
                  transition={{ duration: 0.15, ease: 'easeOut' }}
                >
                  <List size={18} weight="bold" />
                </motion.div>
              )}
            </AnimatePresence>
          </button>

          {/* Menú Popover Desplegable con Animación Spring y Stagger */}
          <AnimatePresence>
            {isMenuOpen && (
              <motion.div
                role="menu"
                initial={{ opacity: 0, scale: 0.96, y: -8, filter: 'blur(4px)' }}
                animate={{ opacity: 1, scale: 1, y: 0, filter: 'blur(0px)' }}
                exit={{ opacity: 0, scale: 0.97, y: -6, filter: 'blur(2px)' }}
                transition={{ type: 'spring', stiffness: 420, damping: 30, mass: 0.8 }}
                className="absolute right-0 mt-2 w-80 sm:w-96 rounded-2xl border border-subtle bg-surface/95 backdrop-blur-md shadow-floating p-3 z-50 space-y-2.5 overflow-hidden"
              >
                {/* 1. Información del Usuario */}
                <motion.div
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.14 }}
                  className="px-3 py-2.5 rounded-xl bg-elevated/70 border border-subtle flex items-center justify-between gap-2"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <ShieldCheck
                      size={18}
                      weight="duotone"
                      className="text-secondary shrink-0"
                    />
                    <div className="min-w-0">
                      <div className="text-xs font-bold text-primary truncate">
                        {usuario?.nombre || 'Operador'}
                      </div>
                      <div className="text-[11px] text-muted truncate">
                        {usuario?.email || 'Sesión activa'}
                      </div>
                    </div>
                  </div>
                  <span className="text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded-md border border-subtle bg-surface text-secondary shrink-0">
                    {usuario?.rol === 'Admin' ? 'Dueño' : 'Staff'}
                  </span>
                </motion.div>

                {/* 1.b Selector Rápido de Cajero en Sandbox */}
                {isSandboxMode && (
                  <motion.div
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.16 }}
                    className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/30 space-y-1.5"
                  >
                    <span className="text-[10px] font-mono uppercase tracking-wider text-amber-600 dark:text-amber-400 font-bold block">
                      ⚡ Selector Rápido (Sandbox)
                    </span>
                    <div className="grid grid-cols-1 gap-1">
                      {visibleSandboxAccounts.map((acc) => {
                        const isSelected =
                          usuario?.email?.toLowerCase() === acc.email.toLowerCase() ||
                          usuario?.nombre?.toLowerCase() === acc.nombre.toLowerCase();

                        return (
                          <button
                            key={acc.id}
                            type="button"
                            onClick={async () => {
                              setIsMenuOpen(false);
                              await fastSwitchSandboxUser(acc.id);
                            }}
                            className={`w-full px-2.5 py-1.5 rounded-lg flex items-center justify-between text-xs transition-fast cursor-pointer ${
                              isSelected
                                ? 'bg-amber-500/20 text-primary font-bold shadow-xs'
                                : 'hover:bg-amber-500/15 text-secondary hover:text-primary'
                            }`}
                          >
                            <span className="truncate">{acc.label}</span>
                            {isSelected && (
                              <Check size={12} weight="bold" className="text-amber-500 shrink-0" />
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </motion.div>
                )}

                {/* 2. MÓDULOS DE GESTIÓN (ADMIN) - Exclusivo rol Admin (Dueño) */}
                {usuario?.rol === 'Admin' && (
                  <motion.div
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.18 }}
                    className="space-y-1.5 pt-1"
                  >
                    <div className="px-1">
                      <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-muted">
                        Módulos de Gestión (Admin)
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-1.5">
                      {adminShortcuts.map((item) => {
                        const active = item.isActive(location.pathname);
                        return (
                          <Link
                            key={item.to}
                            to={item.to}
                            onClick={() => setIsMenuOpen(false)}
                            className={`p-2 rounded-xl border flex items-center gap-2 text-xs transition-all duration-150 group hover:translate-x-0.5 cursor-pointer ${
                              active
                                ? 'border-amber-500/50 bg-amber-500/15 text-primary font-bold shadow-xs'
                                : 'border-subtle bg-elevated/60 hover:bg-elevated hover:border-strong text-secondary hover:text-primary'
                            }`}
                          >
                            <div
                              className={`p-1.5 rounded-lg border shrink-0 transition-transform group-hover:scale-105 ${
                                active
                                  ? 'border-amber-500/40 bg-amber-500/20 text-amber-500'
                                  : 'border-subtle bg-surface text-secondary group-hover:text-primary'
                              }`}
                            >
                              {item.icon}
                            </div>
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center justify-between gap-1">
                                <span className="truncate leading-tight">{item.label}</span>
                                {active && (
                                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0" />
                                )}
                              </div>
                              <span className="text-[10px] text-muted font-sans block truncate">
                                {item.desc}
                              </span>
                            </div>
                          </Link>
                        );
                      })}
                    </div>
                  </motion.div>
                )}

                <div className="border-t border-subtle my-1" />

                {/* 3. Controles de Sistema (Entorno & Tema) */}
                <motion.div
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.2 }}
                  className="space-y-1"
                >
                  {/* Selector de Entorno */}
                  <button
                    type="button"
                    role="menuitem"
                    onClick={() => {
                      toggleSandboxMode();
                      setIsMenuOpen(false);
                    }}
                    className="w-full px-3 py-2 rounded-xl hover:bg-elevated flex items-center justify-between text-xs font-sans transition-fast cursor-pointer text-left"
                  >
                    <div className="flex items-center gap-2.5">
                      <TestTube
                        size={16}
                        weight="duotone"
                        className={isSandboxMode ? 'text-amber-500' : 'text-secondary'}
                      />
                      <div>
                        <span className="font-semibold text-primary block leading-tight">
                          Entorno de Base de Datos
                        </span>
                        <span className="text-[11px] text-muted">
                          {isSandboxMode ? 'Sandbox (Pruebas)' : 'Producción (Oficial)'}
                        </span>
                      </div>
                    </div>
                    <span
                      className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-md border ${
                        isSandboxMode
                          ? 'border-amber-500/40 bg-amber-500/10 text-amber-600 dark:text-amber-400'
                          : 'border-subtle bg-elevated text-secondary'
                      }`}
                    >
                      {isSandboxMode ? 'SANDBOX' : 'PROD'}
                    </span>
                  </button>

                  {/* Selector de Tema */}
                  <button
                    type="button"
                    role="menuitem"
                    onClick={() => {
                      toggleTheme();
                    }}
                    className="w-full px-3 py-2 rounded-xl hover:bg-elevated flex items-center justify-between text-xs font-sans transition-fast cursor-pointer text-left"
                  >
                    <div className="flex items-center gap-2.5">
                      {theme === 'dark' ? (
                        <Sun size={16} weight="duotone" className="text-amber-400" />
                      ) : (
                        <Moon size={16} weight="duotone" className="text-indigo-500" />
                      )}
                      <div>
                        <span className="font-semibold text-primary block leading-tight">
                          Tema de Interfaz
                        </span>
                        <span className="text-[11px] text-muted">
                          {theme === 'dark' ? 'Modo Oscuro activo' : 'Modo Claro activo'}
                        </span>
                      </div>
                    </div>
                    <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded-md border border-subtle bg-elevated text-secondary">
                      {theme === 'dark' ? 'DARK' : 'LIGHT'}
                    </span>
                  </button>
                </motion.div>

                <div className="border-t border-subtle my-1" />

                {/* 4. Cerrar Sesión */}
                <motion.button
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.22 }}
                  type="button"
                  role="menuitem"
                  onClick={() => {
                    setIsMenuOpen(false);
                    logout();
                  }}
                  className="w-full px-3 py-2 rounded-xl hover:bg-red-500/10 text-red-600 dark:text-red-400 flex items-center justify-between text-xs font-sans font-semibold transition-fast cursor-pointer text-left"
                >
                  <div className="flex items-center gap-2.5">
                    <SignOut size={16} weight="bold" />
                    <span>Cerrar Sesión</span>
                  </div>
                  <span className="text-[10px] font-mono opacity-75">Salir</span>
                </motion.button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </header>
  );
};
