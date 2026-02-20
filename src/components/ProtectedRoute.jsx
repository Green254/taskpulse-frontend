import { Navigate, Outlet } from 'react-router-dom';
import useHasRole from '../hooks/useHasRole';
import { useAuth } from '../contexts/AuthContext';

export default function ProtectedRoute({ role }) {
  const { token, user } = useAuth();
  const isAuthorized = useHasRole(role);

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  if (role && !user) {
    return <div className="min-h-screen grid place-items-center bg-slate-100 text-slate-600">Loading...</div>;
  }

  if (!role) {
    return <Outlet />;
  }

  return isAuthorized ? <Outlet /> : <Navigate to="/unauthorized" replace />;
}
