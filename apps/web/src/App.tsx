import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Suspense, lazy } from 'react';
import { useAuthStore } from './stores/authStore';
import { AppLayout } from './components/layout/AppLayout';
import { AuthLayout } from './components/layout/AuthLayout';
import { PageLoader } from './components/ui/PageLoader';

// Lazy loading pour optimiser le bundle
const LoginPage = lazy(() => import('./pages/auth/LoginPage'));
const ForgotPasswordPage = lazy(() => import('./pages/auth/ForgotPasswordPage'));
const ResetPasswordPage = lazy(() => import('./pages/auth/ResetPasswordPage'));
const DashboardPage = lazy(() => import('./pages/dashboard/DashboardPage'));
const PosPage = lazy(() => import('./pages/pos/PosPage'));
const StockPage = lazy(() => import('./pages/stock/StockPage'));
const ProductsPage = lazy(() => import('./pages/stock/ProductsPage'));
const CustomersPage = lazy(() => import('./pages/customers/CustomersPage'));
const CustomerDetailPage = lazy(() => import('./pages/customers/CustomerDetailPage'));
const SuppliersPage = lazy(() => import('./pages/suppliers/SuppliersPage'));
const PurchaseOrdersPage = lazy(() => import('./pages/suppliers/PurchaseOrdersPage'));
const ReportsPage = lazy(() => import('./pages/reports/ReportsPage'));
const ProfilePage = lazy(() => import('./pages/auth/ProfilePage'));

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
              element={<PublicRoute><LoginPage /></PublicRoute>}
            />
            <Route
              path="/mot-de-passe-oublie"
              element={<PublicRoute><ForgotPasswordPage /></PublicRoute>}
            />
            <Route path="/reinitialiser-mot-de-passe" element={<ResetPasswordPage />} />
          </Route>

          {/* Routes protégées */}
          <Route
            element={<PrivateRoute><AppLayout /></PrivateRoute>}
          >
            <Route index element={<Navigate to="/tableau-de-bord" replace />} />
            <Route path="/tableau-de-bord" element={<DashboardPage />} />
            <Route path="/caisse" element={<PosPage />} />
            <Route path="/stocks" element={<StockPage />} />
            <Route path="/stocks/produits" element={<ProductsPage />} />
            <Route path="/clients" element={<CustomersPage />} />
            <Route path="/clients/:id" element={<CustomerDetailPage />} />
            <Route path="/fournisseurs" element={<SuppliersPage />} />
            <Route path="/fournisseurs/commandes" element={<PurchaseOrdersPage />} />
            <Route path="/rapports" element={<ReportsPage />} />
            <Route path="/profil" element={<ProfilePage />} />
          </Route>

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}
