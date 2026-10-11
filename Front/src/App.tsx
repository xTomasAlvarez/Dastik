import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { LoginPage } from './features/auth/pages/LoginPage';
import { DashboardPos } from './features/pos/pages/DashboardPos';
import { CambiarPasswordModal } from './features/auth/components/CambiarPasswordModal';
import { useAuthStore } from './stores/useAuthStore';

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
        <Route
          path="/"
          element={
            <RutaProtegida>
              <DashboardPos />
            </RutaProtegida>
          }
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
