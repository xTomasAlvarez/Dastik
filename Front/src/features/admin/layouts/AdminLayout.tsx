import React from 'react';
import { Outlet, NavLink, Link } from 'react-router-dom';
import {
  Package,
  Storefront,
  Receipt,
  ChartBar,
  TrendUp,
  Users,
  Gear,
  Sun,
  Moon,
  SignOut,
  ShieldCheck,
  TestTube,
  ArrowSquareOut,
} from '@phosphor-icons/react';
import { useAuthStore } from '../../../stores/useAuthStore';
import { useTenantStore } from '../../../stores/useTenantStore';
import { useThemeStore } from '../../../stores/useThemeStore';

export const AdminLayout: React.FC = () => {
  const { usuario, logout } = useAuthStore();
  const { isSandboxMode, toggleSandboxMode } = useTenantStore();
  const { theme, toggleTheme } = useThemeStore();

  const navItems = [
    {
      to: '/admin',
      label: 'Dashboard',
      icon: <ChartBar size={18} weight="duotone" />,
      description: 'Métricas & Alertas',
      end: true,
    },
    {
      to: '/admin/inventario',
      label: 'Inventario',
      icon: <Package size={18} weight="duotone" />,
      description: 'Stock & Catálogo',
    },
    {
      to: '/admin/arqueos',
      label: 'Arqueos',
      icon: <Receipt size={18} weight="duotone" />,
      description: 'Cierres de Caja',
    },
    {
      to: '/admin/empleados',
      label: 'Empleados',
      icon: <Users size={18} weight="duotone" />,
      description: 'Sueldos & Staff',
    },
    {
      to: '/admin/metricas',
      label: 'Finanzas',
      icon: <TrendUp size={18} weight="duotone" />,
      description: 'Rentabilidad',
    },
    {
      to: '/admin/configuracion',
      label: 'Configuración',
      icon: <Gear size={18} weight="duotone" />,
      description: 'Catálogos & Tema',
    },
  ];

  return (
    <div className="min-h-screen bg-canvas text-primary flex flex-col md:flex-row font-sans">
      {/* Sidebar Izquierda Fija (w-64) */}
      <aside className="w-full md:w-64 bg-surface border-b md:border-b-0 md:border-r border-subtle flex flex-col md:h-screen md:sticky md:top-0 shrink-0 shadow-surface">
        {/* Branding limpio con DastikSinFondo.png */}
        <div className="px-5 py-4 border-b border-subtle flex items-center justify-between gap-2">
          <div className="flex items-center gap-2.5 min-w-0">
            <img
              src="/DastikSinFondo.png"
              alt="Dastik"
              className="h-6 w-auto object-contain select-none brightness-50 contrast-125 dark:brightness-110 dark:contrast-100 shrink-0"
            />
            <span className="text-muted font-mono text-xs select-none">/</span>
            <span className="text-xs font-heading font-bold tracking-wider text-secondary uppercase">
              ADMIN
            </span>
          </div>
          {isSandboxMode && (
            <span className="inline-flex items-center gap-1 border border-amber-500/40 bg-amber-500/10 text-amber-600 dark:text-amber-400 rounded-md px-1.5 py-0.5 text-[10px] font-mono font-bold shrink-0">
              SANDBOX
            </span>
          )}
        </div>

        {/* Acceso Rápido al Terminal POS */}
        <div className="p-3.5 border-b border-subtle">
          <Link
            to="/"
            className="w-full rounded-lg border border-subtle bg-elevated hover:bg-surface hover:border-strong text-primary px-3 py-2.5 flex items-center justify-between text-xs font-sans font-semibold transition-fast group shadow-surface active:scale-[0.98]"
            title="Ir a la terminal de punto de venta"
          >
            <div className="flex items-center gap-2.5">
              <Storefront
                size={16}
                weight="duotone"
                className="text-amber-500 group-hover:scale-110 transition-transform"
              />
              <span>Terminal POS</span>
            </div>
            <ArrowSquareOut
              size={14}
              weight="regular"
              className="text-muted group-hover:text-primary"
            />
          </Link>
        </div>

        {/* Navegación Principal */}
        <nav className="flex-1 p-3.5 space-y-1 overflow-y-auto">
          <div className="text-[11px] font-semibold uppercase tracking-wider text-muted px-3 py-1.5 font-sans">
            Gestión Operativa
          </div>
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                `w-full px-3 py-2.5 rounded-lg flex items-center justify-between text-xs transition-fast ${
                  isActive
                    ? 'bg-[var(--btn-primary-bg)] text-[var(--btn-primary-text)] font-semibold shadow-sm'
                    : 'text-secondary hover:text-primary hover:bg-elevated font-medium'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <div className="flex items-center gap-2.5">
                    <span className={isActive ? 'opacity-100' : 'text-muted'}>
                      {item.icon}
                    </span>
                    <span>{item.label}</span>
                  </div>
                  <span
                    className={`text-[10px] font-sans ${
                      isActive ? 'opacity-75' : 'text-muted'
                    }`}
                  >
                    {item.description}
                  </span>
                </>
              )}
            </NavLink>
          ))}
        </nav>

        {/* Controles de Entorno, Tema y Operador */}
        <div className="p-3.5 border-t border-subtle bg-elevated/40 space-y-2">
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

          {/* Datos del Usuario (Dueño / Empleado) */}
          <div className="rounded-lg border border-subtle bg-surface px-3 py-2 flex items-center justify-between shadow-surface">
            <div className="flex items-center gap-2 overflow-hidden">
              <ShieldCheck size={16} weight="duotone" className="text-emerald-500 shrink-0" />
              <div className="truncate">
                <div className="text-xs font-semibold text-primary truncate">
                  {usuario?.nombre || 'Dueño'}
                </div>
                <div className="text-[11px] text-muted font-sans">
                  {usuario?.rol === 'Admin' ? 'Dueño' : 'Staff'}
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
        </div>
      </aside>

      {/* Área Principal de Contenido */}
      <main className="flex-1 bg-canvas min-h-screen flex flex-col overflow-y-auto">
        <Outlet />
      </main>
    </div>
  );
};
