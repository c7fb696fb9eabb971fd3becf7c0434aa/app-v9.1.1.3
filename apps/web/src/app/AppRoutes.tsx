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
const LoginPage = lazy(loadLoginPage);
const HomePage = lazy(loadHomePage);

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
  const isDocumentationHome = normalizedPathname === APP_ROUTES.home;
  const mainContentClass = isDocumentationHome ? 'main-content main-content-home' : 'main-content';

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
      <SiteHeader onLoginIntent={prefetchLoginPage} />
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
            path="*"
            element={<Navigate to={user ? APP_ROUTES.home : APP_ROUTES.publicHome} replace />}
          />
        </Routes>
      </main>
    </div>
  );
}
