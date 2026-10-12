import React from 'react';
import { Outlet, NavLink, Link } from 'react-router-dom';
import {
  Package,
  Storefront,
  Receipt,
  ChartBar,
  SignOut,
  ShieldCheck,
  TestTube,
  ArrowSquareOut
} from '@phosphor-icons/react';
import { useAuthStore } from '../../../stores/useAuthStore';
import { useTenantStore } from '../../../stores/useTenantStore';

export const AdminLayout: React.FC = () => {
  const { usuario, logout } = useAuthStore();
  const { isSandboxMode, toggleSandboxMode } = useTenantStore();

  const navItems = [
    {
      to: '/admin/inventario',
      label: 'Inventario',
      icon: <Package size={18} weight="light" />,
      description: 'Stock & Catálogo'
    },
    {
      to: '/admin/arqueos',
      label: 'Arqueos',
      icon: <Receipt size={18} weight="light" />,
      description: 'Cierres de Caja'
    },
    {
      to: '/admin/metricas',
      label: 'Métricas',
      icon: <ChartBar size={18} weight="light" />,
      description: 'Reportes & Ventas'
    }
  ];

  return (
    <div className="min-h-screen bg-[#000000] text-[#FAFAFA] flex flex-col md:flex-row font-sans selection:bg-[#FAFAFA] selection:text-[#000000]">
      {/* Sidebar Izquierda Fija (w-64, border derecho #333333) */}
      <aside className="w-full md:w-64 bg-[#090909] border-b md:border-b-0 md:border-r border-[#333333] flex flex-col md:h-screen md:sticky md:top-0 shrink-0">
        {/* Branding Avant-Garde */}
        <div className="p-6 border-b border-[#333333]">
          <div className="flex items-center gap-3">
            <div className="border border-[#333333] bg-[#111111] p-2 text-[#FAFAFA] shrink-0">
              <Storefront size={20} weight="light" />
            </div>
            <div>
              <h1 className="text-base font-heading font-extrabold tracking-tight text-[#FAFAFA]">
                DASTIK <span className="text-[#71717A] font-normal">//</span> ADMIN
              </h1>
              <span className="text-[9px] uppercase tracking-[0.25em] text-[#71717A] font-sans block">
                BACK-OFFICE & CONTROL
              </span>
            </div>
          </div>
        </div>

        {/* Acceso Rápido al Terminal POS */}
        <div className="p-4 border-b border-[#222222]">
          <Link
            to="/"
            className="w-full border border-[#333333] bg-[#111111] hover:bg-[#1A1A1A] hover:border-[#555555] text-[#FAFAFA] px-3 py-2.5 flex items-center justify-between text-xs font-heading font-semibold uppercase tracking-wider transition-fast group"
            title="Ir a la terminal de punto de venta"
          >
            <div className="flex items-center gap-2.5">
              <Storefront size={16} weight="light" className="text-amber-400 group-hover:scale-110 transition-transform" />
              <span>TERMINAL POS</span>
            </div>
            <ArrowSquareOut size={14} weight="light" className="text-[#71717A] group-hover:text-[#FAFAFA]" />
          </Link>
        </div>

        {/* Navegación Principal */}
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          <div className="text-[10px] uppercase tracking-widest text-[#71717A] px-3 py-2 font-sans font-semibold">
            GESTIÓN OPERATIVA
          </div>
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `w-full px-3 py-3 flex items-center justify-between text-xs transition-fast ${
                  isActive
                    ? 'bg-[#FAFAFA] text-[#000000] font-heading font-bold shadow-none'
                    : 'text-[#A1A1AA] hover:text-[#FAFAFA] hover:bg-[#111111] font-sans border border-transparent'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <div className="flex items-center gap-3">
                    <span className={isActive ? 'text-[#000000]' : 'text-[#71717A]'}>
                      {item.icon}
                    </span>
                    <span className="uppercase tracking-wider">{item.label}</span>
                  </div>
                  <span
                    className={`text-[9px] tracking-widest uppercase font-mono ${
                      isActive ? 'text-[#000000]/60' : 'text-[#555555]'
                    }`}
                  >
                    {item.description}
                  </span>
                </>
              )}
            </NavLink>
          ))}
        </nav>

        {/* Controles de Entorno y Operador */}
        <div className="p-4 border-t border-[#333333] bg-[#0A0A0A] space-y-3">
          {/* Indicador de Tenant / Base */}
          <div className="border border-[#222222] bg-[#111111] px-3 py-2 flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <TestTube size={15} weight="light" className={isSandboxMode ? 'text-amber-400' : 'text-[#71717A]'} />
              <span className="text-[9px] uppercase tracking-widest text-[#71717A]">BASE:</span>
              <span className={`text-[11px] font-heading font-semibold tracking-wider ${isSandboxMode ? 'text-amber-400' : 'text-[#FAFAFA]'}`}>
                {isSandboxMode ? 'SANDBOX' : 'PROD'}
              </span>
            </div>
            <button
              type="button"
              onClick={toggleSandboxMode}
              className="text-[9px] uppercase font-sans tracking-widest text-[#71717A] hover:text-[#FAFAFA] transition-fast cursor-pointer"
            >
              Cambiar
            </button>
          </div>

          {/* Datos del Operador */}
          <div className="border border-[#222222] bg-[#111111] px-3 py-2 flex items-center justify-between">
            <div className="flex items-center gap-2 overflow-hidden">
              <ShieldCheck size={16} weight="light" className="text-green-400 shrink-0" />
              <div className="truncate">
                <div className="text-xs font-heading font-medium text-[#FAFAFA] truncate">
                  {usuario?.nombre || 'Administrador'}
                </div>
                <div className="text-[9px] text-[#71717A] uppercase tracking-widest font-mono">
                  {usuario?.rol || 'Admin'}
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={logout}
              className="p-1.5 border border-[#333333] hover:border-red-500 hover:text-red-400 text-[#71717A] transition-fast cursor-pointer shrink-0"
              title="Cerrar sesión"
            >
              <SignOut size={14} weight="light" />
            </button>
          </div>
        </div>
      </aside>

      {/* Área Principal de Contenido */}
      <main className="flex-1 bg-[#000000] min-h-screen flex flex-col overflow-y-auto">
        <Outlet />
      </main>
    </div>
  );
};
