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
const loadBackendPage = () =>
  import('../pages/BackendPage').then((module) => ({ default: module.BackendPage }));
const LoginPage = lazy(loadLoginPage);
const HomePage = lazy(loadHomePage);
const BackendPage = lazy(loadBackendPage);

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

export function AppRoutes() {
  const { user, isCheckingSession, sessionRestoreError } = useAuth();
  const { pathname } = useLocation();
  const normalizedPathname = pathname.replace(/\/+$/, '') || APP_ROUTES.publicHome;
  const isDocumentationHome =
    normalizedPathname === APP_ROUTES.home ||
    normalizedPathname.startsWith(`${APP_ROUTES.home}/`);
  const mainContentClass = isDocumentationHome ? 'main-content main-content-home' : 'main-content';

  if (normalizedPathname === APP_ROUTES.backend) {
    return (
      <ProtectedRoute>
        <RouteErrorBoundary route="backend">
          <Suspense fallback={null}>
            <BackendPage />
          </Suspense>
        </RouteErrorBoundary>
      </ProtectedRoute>
    );
  }

  if (normalizedPathname === APP_ROUTES.login) {
    return (
      <div className="login-shell">
        <main className="login-main">
          {user ? (
            <Navigate to={APP_ROUTES.home} replace />
          ) : isCheckingSession ? null : (
            <RouteErrorBoundary route="login">
              <Suspense fallback={null}>
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
      <SiteHeader onLoginIntent={prefetchLoginPage} />
      {sessionRestoreError && (
        <p className="status-message status-error" role="alert">
          Could not restore the saved GitHub session. Check your browser storage and connection,
          then refresh to retry.
        </p>
      )}
      <main className={mainContentClass}>
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
            path={`${APP_ROUTES.home}/*`}
            element={
              <ProtectedRoute>
                <RouteErrorBoundary route="home">
                  <Suspense fallback={null}>
                    <HomePage />
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
