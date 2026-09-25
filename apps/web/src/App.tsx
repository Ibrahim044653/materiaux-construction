import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Suspense, lazy } from 'react';
import { useAuthStore } from './stores/authStore';
import { AppLayout } from './components/layout/AppLayout';
import { AuthLayout } from './components/layout/AuthLayout';
import { PageLoader } from './components/ui/PageLoader';

const LoginPage = lazy(() => import('./pages/auth/LoginPage'));
const ForgotPasswordPage = lazy(() => import('./pages/auth/ForgotPasswordPage'));
const ResetPasswordPage = lazy(() => import('./pages/auth/ResetPasswordPage'));
const DashboardPage = lazy(() => import('./pages/dashboard/DashboardPage'));
const CaissePage = lazy(() => import('./pages/caisse/CaissePage'));
const StockPage = lazy(() => import('./pages/stock/StockPage'));
const ProduitsPage = lazy(() => import('./pages/produits/ProduitsPage'));
const ClientsPage = lazy(() => import('./pages/clients/ClientsPage'));
const FournisseursPage = lazy(() => import('./pages/fournisseurs/FournisseursPage'));
const RapportsPage = lazy(() => import('./pages/rapports/RapportsPage'));
const ProfilePage = lazy(() => import('./pages/auth/ProfilePage'));
const VentesPage = lazy(() => import('./pages/ventes/VentesPage'));

function PrivateRoute({ children }: { children: React.ReactNode }) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  return isAuthenticated ? <>{children}</> : <Navigate to="/connexion" replace />;
}

function PublicRoute({ children }: { children: React.ReactNode }) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  return isAuthenticated ? <Navigate to="/" replace /> : <>{children}</>;
}

export default function App() {
  return (
    <BrowserRouter>
      <Suspense fallback={<PageLoader />}>
        <Routes>
          {/* Routes publiques */}
          <Route element={<AuthLayout />}>
            <Route
              path="/connexion"
              element={
                <PublicRoute>
                  <LoginPage />
                </PublicRoute>
              }
            />
            <Route
              path="/mot-de-passe-oublie"
              element={
                <PublicRoute>
                  <ForgotPasswordPage />
                </PublicRoute>
              }
            />
            <Route path="/reinitialiser-mot-de-passe" element={<ResetPasswordPage />} />
          </Route>

          {/* Routes protégées */}
          <Route
            element={
              <PrivateRoute>
                <AppLayout />
              </PrivateRoute>
            }
          >
            <Route index element={<Navigate to="/tableau-de-bord" replace />} />
            <Route path="/tableau-de-bord" element={<DashboardPage />} />
            <Route path="/caisse" element={<CaissePage />} />
            <Route path="/stock" element={<StockPage />} />
            <Route path="/produits" element={<ProduitsPage />} />
            <Route path="/clients" element={<ClientsPage />} />
            <Route path="/fournisseurs" element={<FournisseursPage />} />
            <Route path="/rapports" element={<RapportsPage />} />
            <Route path="/ventes" element={<VentesPage />} />
            <Route path="/profil" element={<ProfilePage />} />
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}
