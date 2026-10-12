import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClientProvider } from '@tanstack/react-query';
import { LoginPage } from './features/auth/pages/LoginPage';
import { DashboardPos } from './features/pos/pages/DashboardPos';
import { AdminLayout } from './features/admin/layouts/AdminLayout';
import { DashboardPage } from './features/admin/pages/DashboardPage';
import { InventarioPage } from './features/admin/pages/InventarioPage';
import { CambiarPasswordModal } from './features/auth/components/CambiarPasswordModal';
import { useAuthStore } from './stores/useAuthStore';
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

export function App() {
  const { isAuthenticated, debeCambiarPassword } = useAuthStore();

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

          {/* Panel de Administración (Back-Office) */}
          <Route
            path="/admin"
            element={
              <RutaProtegida>
                <AdminLayout />
              </RutaProtegida>
            }
          >
            <Route index element={<DashboardPage />} />
            <Route path="dashboard" element={<DashboardPage />} />
            <Route path="inventario" element={<InventarioPage />} />
            <Route path="arqueos" element={<Navigate to="/admin" replace />} />
            <Route path="metricas" element={<DashboardPage />} />
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  );
}

export default App;
