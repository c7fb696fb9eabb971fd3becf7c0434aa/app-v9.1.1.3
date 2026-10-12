import type { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../features/auth';
import { APP_ROUTES } from '../../config';

export function ProtectedRoute({ children }: { children: ReactNode }) {
  const { user, isCheckingSession } = useAuth();

  if (isCheckingSession) return null;

  if (!user) {
    return <Navigate to={APP_ROUTES.publicHome} replace />;
  }

  return children;
}
