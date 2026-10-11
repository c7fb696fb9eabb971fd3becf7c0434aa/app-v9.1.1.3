import type { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../features/auth';
import { APP_ROUTES } from '../../config';

export function ProtectedRoute({ children }: { children: ReactNode }) {
  const { user, isCheckingSession } = useAuth();
  const location = useLocation();

  if (isCheckingSession) {
    return (
      <p className="status-message" role="status">
        Checking GitHub session...
      </p>
    );
  }

  if (!user) {
    return <Navigate to={APP_ROUTES.login} state={{ from: location.pathname }} replace />;
  }

  return children;
}
