import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClientProvider } from '@tanstack/react-query';
import { LoginPage } from './features/auth/pages/LoginPage';
import { DashboardPos } from './features/pos/pages/DashboardPos';
import { AdminLayout } from './features/admin/layouts/AdminLayout';
import { DashboardPage } from './features/admin/pages/DashboardPage';
import { InventarioPage } from './features/admin/pages/InventarioPage';
import { ArqueosPage } from './features/admin/pages/ArqueosPage';
import { EmpleadosPage } from './features/admin/pages/EmpleadosPage';
import { MetricasPage } from './features/admin/pages/MetricasPage';
import { ConfiguracionPage } from './features/admin/pages/ConfiguracionPage';
import { CambiarPasswordModal } from './features/auth/components/CambiarPasswordModal';
import { useAuthStore } from './stores/useAuthStore';
import { useThemeStore } from './stores/useThemeStore';
import { queryClient } from './lib/react-query/queryClient';

// Componente para proteger rutas privadas
const RutaProtegida: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, debeCambiarPassword } = useAuthStore();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // Si está autenticado pero debe cambiar la contraseña, mostramos el modal bloqueante
  if (debeCambiarPassword) {
    return (
      <>
        {children}
        <CambiarPasswordModal isOpen={true} />
      </>
    );
  }

  return <>{children}</>;
};

// Componente para proteger rutas exclusivas del Dueño/Admin
const AdminRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, debeCambiarPassword, usuario } = useAuthStore();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (debeCambiarPassword) {
    return (
      <>
        {children}
        <CambiarPasswordModal isOpen={true} />
      </>
    );
  }

  // Si el usuario no es Admin (es Empleado/Cajero), se redirige inmediatamente a la terminal POS
  if (usuario?.rol !== 'Admin') {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
};

export function App() {
  const { isAuthenticated, debeCambiarPassword } = useAuthStore();
  // Inicializa el tema persistido en document.documentElement (.dark / .light)
  useThemeStore();

  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          <Route
            path="/login"
            element={
              isAuthenticated && !debeCambiarPassword ? (
                <Navigate to="/" replace />
              ) : (
                <LoginPage />
              )
            }
          />

          {/* Terminal POS (Caja de mostrador) */}
          <Route
            path="/"
            element={
              <RutaProtegida>
                <DashboardPos />
              </RutaProtegida>
            }
          />
          <Route
            path="/pos"
            element={
              <RutaProtegida>
                <DashboardPos />
              </RutaProtegida>
            }
          />

          {/* Panel de Administración (Back-Office) - Exclusivo Admin */}
          <Route
            path="/admin"
            element={
              <AdminRoute>
                <AdminLayout />
              </AdminRoute>
            }
          >
            <Route index element={<DashboardPage />} />
            <Route path="dashboard" element={<DashboardPage />} />
            <Route path="inventario" element={<InventarioPage />} />
            <Route path="arqueos" element={<ArqueosPage />} />
            <Route path="empleados" element={<EmpleadosPage />} />
            <Route path="metricas" element={<MetricasPage />} />
            <Route path="configuracion" element={<ConfiguracionPage />} />
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  );
}

export default App;
