import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

export default function ProtectedRoute() {
  // Token lives in an HttpOnly cookie (unreadable from JS).
  // We rely on the isLoggedIn flag set at login, plus the 401 interceptor
  // in api/client.ts to clear session and redirect when the cookie expires.
  const { isLoggedIn, clearAuth } = useAuth();
  if (!isLoggedIn) {
    clearAuth();
    return <Navigate to="/" replace />;
  }
  return <Outlet />;
}
