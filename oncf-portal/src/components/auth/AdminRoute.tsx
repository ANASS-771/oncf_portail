import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

export default function AdminRoute() {
  const { isLoggedIn, isAdmin } = useAuth();
  if (!isLoggedIn || !isAdmin) return <Navigate to="/" replace />;
  return <Outlet />;
}
