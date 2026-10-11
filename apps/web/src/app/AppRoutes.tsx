import { lazy, Suspense } from 'react';
import { Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { PublicHomePage } from '../pages/PublicHomePage';
import { ProtectedRoute } from './ProtectedRoute';
import { SiteHeader } from '../features/navigation';
import { APP_ROUTES } from '../../config';
import { RouteErrorBoundary } from './RouteErrorBoundary';
import { reportClientEvent } from '../lib/observability';
import { useAuth } from '../features/auth';

const loadLoginPage = () =>
  import('../pages/LoginPage').then((module) => ({ default: module.LoginPage }));
const loadHomePage = () =>
  import('../pages/HomePage').then((module) => ({ default: module.HomePage }));
const loadStudioPage = () =>
  import('../pages/StudioPage').then((module) => ({ default: module.StudioPage }));
const LoginPage = lazy(loadLoginPage);
const HomePage = lazy(loadHomePage);
const StudioPage = lazy(loadStudioPage);

function canPrefetch(): boolean {
  if (typeof navigator === 'undefined' || !navigator.onLine) return false;
  const connection = (
    navigator as Navigator & {
      connection?: { effectiveType?: string; saveData?: boolean };
    }
  ).connection;
  if (connection?.saveData || connection?.effectiveType === 'slow-2g') return false;
  return !(
    typeof window.matchMedia === 'function' &&
    window.matchMedia('(prefers-reduced-data: reduce)').matches
  );
}

function prefetchLoginPage() {
  if (!canPrefetch()) return;
  void loadLoginPage().catch(() => reportClientEvent('route_chunk_failure', 'login'));
}

function LoadingRoute() {
  return (
    <p className="status-message" role="status" aria-live="polite">
      Loading section…
    </p>
  );
}

export function AppRoutes() {
  const { user } = useAuth();
  const { pathname } = useLocation();
  const normalizedPathname = pathname.replace(/\/+$/, '') || APP_ROUTES.publicHome;
  const isStudioWorkspace = normalizedPathname === APP_ROUTES.studioBase;

  if (normalizedPathname === APP_ROUTES.login) {
    return (
      <div className="login-shell">
        <main className="login-main">
          {user ? (
            <Navigate to={APP_ROUTES.home} replace />
          ) : (
            <RouteErrorBoundary route="login">
              <Suspense fallback={<LoadingRoute />}>
                <LoginPage />
              </Suspense>
            </RouteErrorBoundary>
          )}
        </main>
      </div>
    );
  }

  return (
    <div className="app-shell">
      {!isStudioWorkspace && <SiteHeader onLoginIntent={prefetchLoginPage} />}
      <main className="main-content">
        <Routes>
          <Route
            path={APP_ROUTES.publicHome}
            element={
              user ? (
                <Navigate to={APP_ROUTES.home} replace />
              ) : (
                <RouteErrorBoundary route="public-home">
                  <PublicHomePage />
                </RouteErrorBoundary>
              )
            }
          />
          <Route
            path={APP_ROUTES.home}
            element={
              <ProtectedRoute>
                <RouteErrorBoundary route="home">
                  <Suspense fallback={<LoadingRoute />}>
                    <HomePage />
                  </Suspense>
                </RouteErrorBoundary>
              </ProtectedRoute>
            }
          />
          <Route
            path={APP_ROUTES.studio}
            element={
              <ProtectedRoute>
                <RouteErrorBoundary route="studio">
                  <Suspense fallback={<LoadingRoute />}>
                    <StudioPage />
                  </Suspense>
                </RouteErrorBoundary>
              </ProtectedRoute>
            }
          />
          <Route
            path="*"
            element={<Navigate to={user ? APP_ROUTES.home : APP_ROUTES.publicHome} replace />}
          />
        </Routes>
      </main>
    </div>
  );
}
