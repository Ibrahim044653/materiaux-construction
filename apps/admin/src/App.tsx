import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Suspense, lazy } from 'react';
import { useAdminStore } from './stores/adminStore';
import { AdminLayout } from './components/AdminLayout';

const LoginPage = lazy(() => import('./pages/LoginPage'));
const DashboardPage = lazy(() => import('./pages/DashboardPage'));
const TenantsPage = lazy(() => import('./pages/TenantsPage'));
const UsersPage = lazy(() => import('./pages/UsersPage'));
const AuditLogsPage = lazy(() => import('./pages/AuditLogsPage'));
const SettingsPage = lazy(() => import('./pages/SettingsPage'));

function PrivateRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, user } = useAdminStore();
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (user?.role !== 'SUPER_ADMIN') return <Navigate to="/login" replace />;
  return <>{children}</>;
}

function Loader() {
  return (
    <div className="min-h-screen bg-admin-900 flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-primary-600 border-t-transparent rounded-full animate-spin" />
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <Suspense fallback={<Loader />}>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route
            element={
              <PrivateRoute>
                <AdminLayout />
              </PrivateRoute>
            }
          >
            <Route index element={<Navigate to="/dashboard" replace />} />
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/tenants" element={<TenantsPage />} />
            <Route path="/users" element={<UsersPage />} />
            <Route path="/audit-logs" element={<AuditLogsPage />} />
            <Route path="/settings" element={<SettingsPage />} />
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}
