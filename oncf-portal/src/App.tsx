import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import AppLayout from './components/layout/AppLayout';
import ProtectedRoute from './components/auth/ProtectedRoute';
import AdminRoute from './components/auth/AdminRoute';
import AgentRoute from './components/auth/AgentRoute';
import LoginPage from './pages/Login/LoginPage';
import { AppFeedbackProvider } from './components/ui/AppFeedback';
import ErrorBoundary from './components/ui/ErrorBoundary';
import { AuthProvider } from './contexts/AuthContext';
import PageSpinner from './components/ui/PageSpinner';

const ChangePasswordPage      = lazy(() => import('./pages/Login/ChangePasswordPage'));
const DashboardPage           = lazy(() => import('./pages/Dashboard/DashboardPage'));
const StockPage               = lazy(() => import('./pages/Stock/StockPage'));
const ConteneurPage           = lazy(() => import('./pages/Conteneur/ConteneurPage'));
const SortiesPage             = lazy(() => import('./pages/Sorties/SortiesPage'));
const AlertesPage             = lazy(() => import('./pages/Alertes/AlertesPage'));
const SearchPage              = lazy(() => import('./pages/Search/SearchPage'));
const ProfilePage             = lazy(() => import('./pages/Profile/ProfilePage'));
const ReclamationsPage        = lazy(() => import('./pages/Reclamations/ReclamationsPage'));
const FacturesPage            = lazy(() => import('./pages/Factures/FacturesPage'));
const FactureDetailPage       = lazy(() => import('./pages/Factures/FactureDetailPage'));
const SimulateurPage          = lazy(() => import('./pages/Simulateur/SimulateurPage'));
const SimulateurHdPage        = lazy(() => import('./pages/Simulateur/SimulateurHdPage'));
const AdminPage               = lazy(() => import('./pages/Admin/AdminPage'));
const AdminUsersPage          = lazy(() => import('./pages/Admin/AdminUsersPage'));
const AdminClientsPage        = lazy(() => import('./pages/Admin/AdminClientsPage'));
const AdminReclamationsPage   = lazy(() => import('./pages/Admin/AdminReclamationsPage'));
const AgentReclamationsPage   = lazy(() => import('./pages/Agent/AgentReclamationsPage'));

export default function App() {
  return (
    <ErrorBoundary>
    <AuthProvider>
    <AppFeedbackProvider>
      <BrowserRouter>
        <Suspense fallback={<PageSpinner />}>
          <Routes>
            <Route path="/" element={<LoginPage />} />

            <Route element={<ProtectedRoute />}>
              <Route path="/change-password" element={<ChangePasswordPage />} />
              <Route element={<AppLayout />}>
                <Route path="/dashboard"          element={<DashboardPage />} />
                <Route path="/profile"            element={<ProfilePage />} />
                <Route path="/stock"              element={<StockPage />} />
                <Route path="/conteneurs/:numero" element={<ConteneurPage />} />
                <Route path="/sorties"            element={<SortiesPage />} />
                <Route path="/alertes"            element={<AlertesPage />} />
                <Route path="/reclamations"       element={<ReclamationsPage />} />
                <Route path="/search"             element={<SearchPage />} />
                <Route path="/factures"           element={<FacturesPage />} />
                <Route path="/factures/:id"       element={<FactureDetailPage />} />
                <Route path="/simulateur"         element={<SimulateurPage />} />
                <Route path="/simulateur-hd"      element={<SimulateurHdPage />} />

                <Route element={<AdminRoute />}>
                  <Route path="/admin"                   element={<AdminPage />} />
                  <Route path="/admin/users"             element={<AdminUsersPage />} />
                  <Route path="/admin/clients"           element={<AdminClientsPage />} />
                  <Route path="/admin/reclamations"      element={<AdminReclamationsPage />} />
                </Route>

                <Route element={<AgentRoute />}>
                  <Route path="/agent/reclamations" element={<AgentReclamationsPage />} />
                </Route>
              </Route>
            </Route>

            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Suspense>
      </BrowserRouter>
    </AppFeedbackProvider>
    </AuthProvider>
    </ErrorBoundary>
  );
}
