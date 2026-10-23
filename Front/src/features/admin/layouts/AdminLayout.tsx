import React, { useState, useRef, useEffect } from 'react';
import { Outlet, NavLink, Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import {
  Package,
  Storefront,
  Receipt,
  ChartBar,
  TrendUp,
  Users,
  GearSix,
  Sun,
  Moon,
  SignOut,
  ShieldCheck,
  TestTube,
  ArrowSquareOut,
  List,
  X,
  CaretLeft,
  CaretRight,
  SidebarSimple,
} from '@phosphor-icons/react';
import { useAuthStore } from '../../../stores/useAuthStore';
import { useTenantStore } from '../../../stores/useTenantStore';
import { useThemeStore } from '../../../stores/useThemeStore';

export const AdminLayout: React.FC = () => {
  const { usuario, logout } = useAuthStore();

  const isDev =
    Boolean(usuario?.esOcultoDev) ||
    usuario?.email?.toLowerCase() === 'tomidev@dastik.com' ||
    usuario?.email?.toLowerCase() === 'tomi.empleado@dastik.com' ||
    Boolean(usuario?.nombre?.toLowerCase().includes('tomi (admin dev)'));

  const rolUsuarioLabel = isDev
    ? 'Desarrollador (Dev)'
    : usuario?.rol === 'Admin'
    ? 'Dueño'
    : 'Staff';
  const { isSandboxMode, toggleSandboxMode } = useTenantStore();
  const { theme, toggleTheme } = useThemeStore();
  const location = useLocation();

  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const mobileMenuRef = useRef<HTMLDivElement>(null);

  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState<boolean>(() => {
    try {
      return localStorage.getItem('dastik_admin_sidebar_collapsed') === 'true';
    } catch {
      return false;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem('dastik_admin_sidebar_collapsed', String(isSidebarCollapsed));
    } catch {
      // ignore
    }
  }, [isSidebarCollapsed]);

  // Atajo de teclado Ctrl + B / Meta + B para colapsar o expandir el sidebar
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && (e.key === 'b' || e.key === 'B')) {
        e.preventDefault();
        setIsSidebarCollapsed((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Cerrar menú móvil al hacer click fuera o cambiar de ruta
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (mobileMenuRef.current && !mobileMenuRef.current.contains(e.target as Node)) {
        setIsMobileMenuOpen(false);
      }
    };
    if (isMobileMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isMobileMenuOpen]);

  const navItems = [
    {
      to: '/admin',
      label: 'Dashboard',
      icon: <ChartBar size={18} weight="duotone" />,
      description: 'Métricas & Alertas',
      end: true,
      isActive: (p: string) => p === '/admin' || p === '/admin/' || p === '/admin/dashboard',
    },
    {
      to: '/admin/inventario',
      label: 'Inventario',
      icon: <Package size={18} weight="duotone" />,
      description: 'Stock & Catálogo',
      isActive: (p: string) => p.startsWith('/admin/inventario'),
    },
    {
      to: '/admin/arqueos',
      label: 'Arqueos',
      icon: <Receipt size={18} weight="duotone" />,
      description: 'Cierres de Caja',
      isActive: (p: string) => p.startsWith('/admin/arqueos'),
    },
    {
      to: '/admin/empleados',
      label: 'Empleados',
      icon: <Users size={18} weight="duotone" />,
      description: 'Sueldos & Staff',
      isActive: (p: string) => p.startsWith('/admin/empleados'),
    },
    {
      to: '/admin/metricas',
      label: 'Finanzas',
      icon: <TrendUp size={18} weight="duotone" />,
      description: 'Rentabilidad',
      isActive: (p: string) => p.startsWith('/admin/metricas'),
    },
    {
      to: '/admin/configuracion',
      label: 'Configuración',
      icon: <GearSix size={18} weight="duotone" />,
      description: 'Catálogos & Tema',
      isActive: (p: string) => p.startsWith('/admin/configuracion'),
    },
  ];

  return (
    <div className="min-h-screen bg-canvas text-primary flex flex-col md:flex-row font-sans">
      {/* ======================================================== */}
      {/* 1. Header Móvil (< md) con Brand y Botón de Comando      */}
      {/* ======================================================== */}
      <header className="md:hidden bg-surface border-b border-subtle px-4 py-3 flex items-center justify-between sticky top-0 z-40 shadow-surface">
        <div className="flex items-center gap-2.5">
          <img
            src="/DastikSinFondo.png"
            alt="Dastik"
            className="h-6 w-auto object-contain select-none brightness-50 contrast-125 dark:brightness-110 dark:contrast-100 shrink-0"
          />
          <span className="text-muted font-mono text-xs select-none">/</span>
          <span className="text-xs font-heading font-bold tracking-wider text-secondary uppercase">
            ADMIN
          </span>
          {isSandboxMode && (
            <span className="inline-flex items-center gap-1 border border-amber-500/40 bg-amber-500/10 text-amber-600 dark:text-amber-400 rounded-md px-1.5 py-0.5 text-[9px] font-mono font-bold shrink-0">
              SANDBOX
            </span>
          )}
        </div>

        <div className="flex items-center gap-2" ref={mobileMenuRef}>
          <Link
            to="/"
            className="p-1.5 rounded-lg border border-subtle bg-elevated text-secondary hover:text-amber-500 transition-fast"
            title="Ir a Terminal POS"
          >
            <Storefront size={18} weight="duotone" />
          </Link>

          <button
            type="button"
            onClick={() => setIsMobileMenuOpen((prev) => !prev)}
            className="p-1.5 rounded-lg border border-subtle bg-elevated text-primary transition-fast cursor-pointer active:scale-95"
            aria-label="Abrir navegación"
          >
            <AnimatePresence mode="wait" initial={false}>
              {isMobileMenuOpen ? (
                <motion.div
                  key="m-close"
                  initial={{ rotate: -90, opacity: 0 }}
                  animate={{ rotate: 0, opacity: 1 }}
                  exit={{ rotate: 90, opacity: 0 }}
                  transition={{ duration: 0.12 }}
                >
                  <X size={18} weight="bold" />
                </motion.div>
              ) : (
                <motion.div
                  key="m-open"
                  initial={{ rotate: 90, opacity: 0 }}
                  animate={{ rotate: 0, opacity: 1 }}
                  exit={{ rotate: -90, opacity: 0 }}
                  transition={{ duration: 0.12 }}
                >
                  <List size={18} weight="bold" />
                </motion.div>
              )}
            </AnimatePresence>
          </button>

          {/* Menú Desplegable Móvil con Spring */}
          <AnimatePresence>
            {isMobileMenuOpen && (
              <motion.div
                initial={{ opacity: 0, scale: 0.96, y: -8, filter: 'blur(4px)' }}
                animate={{ opacity: 1, scale: 1, y: 0, filter: 'blur(0px)' }}
                exit={{ opacity: 0, scale: 0.97, y: -6, filter: 'blur(2px)' }}
                transition={{ type: 'spring', stiffness: 420, damping: 30, mass: 0.8 }}
                className="absolute right-4 top-14 w-72 rounded-2xl border border-subtle bg-surface/95 backdrop-blur-md shadow-floating p-3 z-50 space-y-2"
              >
                <div className="text-[10px] font-mono font-bold uppercase tracking-wider text-muted px-2">
                  Navegación Admin
                </div>
                <div className="space-y-1">
                  {navItems.map((item) => {
                    const active = item.isActive(location.pathname);
                    return (
                      <Link
                        key={item.to}
                        to={item.to}
                        onClick={() => setIsMobileMenuOpen(false)}
                        className={`w-full px-3 py-2 rounded-xl flex items-center justify-between text-xs transition-fast ${
                          active
                            ? 'bg-[var(--btn-primary-bg)] text-[var(--btn-primary-text)] font-semibold shadow-xs'
                            : 'text-secondary hover:text-primary hover:bg-elevated font-medium'
                        }`}
                      >
                        <div className="flex items-center gap-2.5">
                          <span>{item.icon}</span>
                          <span>{item.label}</span>
                        </div>
                        <span className="text-[10px] opacity-75">{item.description}</span>
                      </Link>
                    );
                  })}
                </div>

                <div className="border-t border-subtle my-1" />

                <div className="flex items-center justify-between px-2 pt-1">
                  <button
                    type="button"
                    onClick={toggleTheme}
                    className="text-xs font-semibold text-secondary hover:text-primary flex items-center gap-1.5 cursor-pointer"
                  >
                    {theme === 'dark' ? <Sun size={15} /> : <Moon size={15} />}
                    <span>{theme === 'dark' ? 'Modo Claro' : 'Modo Oscuro'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={logout}
                    className="text-xs font-semibold text-red-500 hover:text-red-400 flex items-center gap-1 cursor-pointer"
                  >
                    <SignOut size={15} />
                    <span>Salir</span>
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </header>

      {/* ======================================================== */}
      {/* 2. Sidebar Izquierda Colapsable en Desktop                */}
      {/* ======================================================== */}
      <motion.aside
        initial={false}
        animate={{ width: isSidebarCollapsed ? 72 : 260 }}
        transition={{ type: 'spring', stiffness: 380, damping: 32 }}
        className="hidden md:flex bg-surface border-r border-subtle flex-col md:h-screen md:sticky md:top-0 shrink-0 shadow-surface relative select-none overflow-visible z-30"
      >
        {/* Pestaña flotante de toggle en el borde divisorio */}
        <button
          type="button"
          onClick={() => setIsSidebarCollapsed((prev) => !prev)}
          className="absolute -right-3 top-5 z-40 w-6 h-6 rounded-full border border-subtle bg-surface hover:bg-elevated hover:border-strong text-secondary hover:text-primary shadow-xs flex items-center justify-center cursor-pointer transition-fast active:scale-90"
          title={isSidebarCollapsed ? 'Expandir barra lateral [Ctrl + B]' : 'Colapsar barra lateral [Ctrl + B]'}
          aria-label={isSidebarCollapsed ? 'Expandir barra lateral' : 'Colapsar barra lateral'}
        >
          {isSidebarCollapsed ? (
            <CaretRight size={12} weight="bold" />
          ) : (
            <CaretLeft size={12} weight="bold" />
          )}
        </button>

        {/* Contenedor Interior con overflow-hidden para la animación de resorte */}
        <div className="w-full h-full flex flex-col overflow-hidden">
          {/* Branding limpio */}
          <div className={`border-b border-subtle flex items-center min-h-[57px] ${
            isSidebarCollapsed ? 'px-2 justify-center' : 'px-4 justify-between gap-2'
          }`}>
            {isSidebarCollapsed ? (
              <button
                type="button"
                onClick={() => setIsSidebarCollapsed(false)}
                className="flex items-center justify-center p-1 rounded-lg hover:bg-elevated transition-fast cursor-pointer"
                title="Expandir barra lateral [Ctrl + B]"
              >
                <img
                  src="/DastikSinFondo.png"
                  alt="Dastik"
                  className="h-6 w-auto object-contain select-none brightness-50 contrast-125 dark:brightness-110 dark:contrast-100 hover:scale-110 transition-transform"
                />
              </button>
            ) : (
              <>
                <div className="flex items-center gap-2.5 min-w-0">
                  <img
                    src="/DastikSinFondo.png"
                    alt="Dastik"
                    className="h-6 w-auto object-contain select-none brightness-50 contrast-125 dark:brightness-110 dark:contrast-100 shrink-0"
                  />
                  <span className="text-muted font-mono text-xs select-none">/</span>
                  <span className="text-xs font-heading font-bold tracking-wider text-secondary uppercase truncate">
                    ADMIN
                  </span>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  {isSandboxMode && (
                    <span className="inline-flex items-center border border-amber-500/40 bg-amber-500/10 text-amber-600 dark:text-amber-400 rounded-md px-1.5 py-0.5 text-[9px] font-mono font-bold shrink-0">
                      SANDBOX
                    </span>
                  )}
                  <button
                    type="button"
                    onClick={() => setIsSidebarCollapsed(true)}
                    className="p-1.5 rounded-lg border border-subtle bg-elevated hover:bg-surface text-secondary hover:text-primary transition-fast cursor-pointer"
                    title="Colapsar barra lateral [Ctrl + B]"
                  >
                    <SidebarSimple size={15} weight="regular" />
                  </button>
                </div>
              </>
            )}
          </div>

          {/* Acceso Rápido al Terminal POS */}
          <div className={`border-b border-subtle ${isSidebarCollapsed ? 'p-2 flex justify-center' : 'p-3'}`}>
            <Link
              to="/"
              className={`rounded-lg border border-subtle bg-elevated hover:bg-surface hover:border-strong text-primary flex items-center transition-fast group shadow-surface active:scale-[0.98] ${
                isSidebarCollapsed
                  ? 'w-10 h-10 justify-center'
                  : 'w-full px-3 py-2.5 justify-between text-xs font-sans font-semibold'
              }`}
              title="Ir a Terminal POS"
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <Storefront
                  size={isSidebarCollapsed ? 18 : 16}
                  weight="duotone"
                  className="text-amber-500 group-hover:scale-110 transition-transform shrink-0"
                />
                {!isSidebarCollapsed && <span className="truncate">Terminal POS</span>}
              </div>
              {!isSidebarCollapsed && (
                <ArrowSquareOut
                  size={14}
                  weight="regular"
                  className="text-muted group-hover:text-primary transition-colors shrink-0"
                />
              )}
            </Link>
          </div>

          {/* Navegación Principal con Pastilla Deslizante (layoutId) */}
          <nav className={`flex-1 overflow-y-auto space-y-1 ${isSidebarCollapsed ? 'p-2' : 'p-3'}`}>
            {!isSidebarCollapsed && (
              <div className="text-[11px] font-semibold uppercase tracking-wider text-muted px-3 py-1.5 font-sans">
                Gestión Operativa
              </div>
            )}
            {navItems.map((item) => {
              const active = item.isActive(location.pathname);
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.end}
                  title={`${item.label} · ${item.description}`}
                  className={`relative rounded-lg flex items-center transition-colors duration-150 ${
                    isSidebarCollapsed
                      ? 'w-10 h-10 mx-auto justify-center my-1'
                      : 'w-full px-3 py-2.5 justify-between text-xs'
                  } ${
                    active
                      ? 'text-[var(--btn-primary-text)] font-semibold shadow-xs'
                      : 'text-secondary hover:text-primary hover:bg-elevated/70 font-medium'
                  }`}
                >
                  {active && (
                    <motion.div
                      layoutId="admin-sidebar-active"
                      className="absolute inset-0 bg-[var(--btn-primary-bg)] rounded-lg shadow-xs"
                      transition={{ type: 'spring', stiffness: 500, damping: 35 }}
                    />
                  )}
                  <div className={`relative z-10 flex items-center ${isSidebarCollapsed ? 'justify-center' : 'gap-2.5 min-w-0'}`}>
                    <span className={active ? 'opacity-100' : 'text-muted'}>
                      {item.icon}
                    </span>
                    {!isSidebarCollapsed && <span className="truncate">{item.label}</span>}
                  </div>
                  {!isSidebarCollapsed && (
                    <span
                      className={`relative z-10 text-[10px] font-sans ${
                        active ? 'opacity-75' : 'text-muted'
                      }`}
                    >
                      {item.description}
                    </span>
                  )}
                </NavLink>
              );
            })}
          </nav>

          {/* Controles de Entorno, Tema y Operador */}
          <div className={`border-t border-subtle bg-elevated/40 ${isSidebarCollapsed ? 'p-2 flex flex-col items-center gap-2' : 'p-3 space-y-2'}`}>
            {isSidebarCollapsed ? (
              <>
                {/* Botón Tema en modo colapsado */}
                <button
                  type="button"
                  onClick={toggleTheme}
                  className="w-10 h-10 rounded-lg border border-subtle bg-surface hover:bg-elevated text-secondary hover:text-primary flex items-center justify-center transition-fast cursor-pointer shadow-surface active:scale-95"
                  title={theme === 'dark' ? 'Cambiar a Modo Claro' : 'Cambiar a Modo Oscuro'}
                >
                  {theme === 'dark' ? (
                    <Moon size={16} weight="duotone" className="text-indigo-400" />
                  ) : (
                    <Sun size={16} weight="duotone" className="text-amber-500" />
                  )}
                </button>

                {/* Botón Sandbox en modo colapsado */}
                <button
                  type="button"
                  onClick={toggleSandboxMode}
                  className={`w-10 h-10 rounded-lg border flex items-center justify-center transition-fast cursor-pointer shadow-surface active:scale-95 ${
                    isSandboxMode
                      ? 'border-amber-500/50 bg-amber-500/10 text-amber-500'
                      : 'border-subtle bg-surface hover:bg-elevated text-secondary hover:text-primary'
                  }`}
                  title={`Entorno actual: ${isSandboxMode ? 'Sandbox' : 'Producción'} (Click para alternar)`}
                >
                  <TestTube size={16} weight="duotone" />
                </button>

                {/* Avatar y Salir en modo colapsado */}
                <div
                  className="w-10 h-10 rounded-lg border border-subtle bg-surface flex items-center justify-center text-emerald-500 shadow-surface"
                  title={`${usuario?.nombre || 'Dueño'} · ${rolUsuarioLabel}`}
                >
                  <ShieldCheck size={18} weight="duotone" />
                </div>

                <button
                  type="button"
                  onClick={logout}
                  className="w-10 h-8 rounded-lg border border-subtle hover:border-red-500/50 hover:bg-red-500/10 hover:text-red-500 text-secondary flex items-center justify-center transition-fast cursor-pointer active:scale-95"
                  title="Cerrar sesión"
                >
                  <SignOut size={14} weight="regular" />
                </button>
              </>
            ) : (
              <>
                {/* Toggle Dark / Light Mode Instantáneo */}
                <div className="rounded-lg border border-subtle bg-surface px-3 py-2 flex items-center justify-between text-xs shadow-surface">
                  <div className="flex items-center gap-2">
                    {theme === 'dark' ? (
                      <Moon size={15} weight="duotone" className="text-indigo-400" />
                    ) : (
                      <Sun size={15} weight="duotone" className="text-amber-500" />
                    )}
                    <span className="text-[11px] font-medium text-muted">Tema:</span>
                    <span className="text-xs font-semibold text-primary">
                      {theme === 'dark' ? 'Dark' : 'Light'}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={toggleTheme}
                    className="text-[11px] font-semibold text-secondary hover:text-primary transition-fast cursor-pointer"
                    title={
                      theme === 'dark'
                        ? 'Cambiar a modo claro (Light Mode)'
                        : 'Cambiar a modo oscuro (Dark Mode)'
                    }
                  >
                    {theme === 'dark' ? 'Modo Claro' : 'Modo Oscuro'}
                  </button>
                </div>

                {/* Indicador de Tenant / Base */}
                <div className="rounded-lg border border-subtle bg-surface px-3 py-2 flex items-center justify-between text-xs shadow-surface">
                  <div className="flex items-center gap-2">
                    <TestTube
                      size={15}
                      weight="duotone"
                      className={isSandboxMode ? 'text-amber-500' : 'text-muted'}
                    />
                    <span className="text-[11px] font-medium text-muted">Base:</span>
                    <span
                      className={`text-xs font-semibold ${
                        isSandboxMode ? 'text-amber-600 dark:text-amber-400' : 'text-primary'
                      }`}
                    >
                      {isSandboxMode ? 'Sandbox' : 'Producción'}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={toggleSandboxMode}
                    className="text-[11px] font-semibold text-secondary hover:text-primary transition-fast cursor-pointer"
                  >
                    Cambiar
                  </button>
                </div>

                {/* Datos del Usuario */}
                <div className="rounded-lg border border-subtle bg-surface px-3 py-2 flex items-center justify-between shadow-surface">
                  <div className="flex items-center gap-2 overflow-hidden">
                    <ShieldCheck size={16} weight="duotone" className="text-emerald-500 shrink-0" />
                    <div className="truncate">
                      <div className="text-xs font-semibold text-primary truncate">
                        {usuario?.nombre || 'Dueño'}
                      </div>
                      <div className="text-[11px] text-muted font-sans font-medium">
                        {rolUsuarioLabel}
                      </div>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={logout}
                    className="p-1.5 rounded-md border border-subtle hover:border-red-500/50 hover:bg-red-500/10 hover:text-red-500 text-secondary transition-fast cursor-pointer shrink-0"
                    title="Cerrar sesión"
                  >
                    <SignOut size={14} weight="regular" />
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </motion.aside>

      {/* ======================================================== */}
      {/* 3. Área Principal de Contenido con Transición Suave      */}
      {/* ======================================================== */}
      <main className="flex-1 bg-canvas min-h-screen flex flex-col overflow-y-auto">
        <div
          key={location.pathname}
          className="flex-1 flex flex-col animate-view-fade-in"
        >
          <Outlet />
        </div>
      </main>
    </div>
  );
};
