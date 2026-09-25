import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

export default function AgentRoute() {
  const { isLoggedIn, userRole, isAdmin } = useAuth();
  if (!isLoggedIn || (userRole !== 'agent' && !isAdmin)) return <Navigate to="/" replace />;
  return <Outlet />;
}
