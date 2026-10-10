import React from 'react';
import { HashRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { Header } from './components/Header';
import { GlobalPathBar } from './components/GlobalPathBar';
import { DotMatrixBackground } from './components/ui/DotMatrixBackground';
import { HomePage } from './pages/HomePage';
import { DashboardPage } from './pages/DashboardPage';
import { DynamicPageView } from './pages/DynamicPageView';
import { SecretStudioPage } from './pages/SecretStudioPage';
import { DeploymentsPage } from './pages/DeploymentsPage';
import { LoginPage } from './pages/LoginPage';
import { SignupPage } from './pages/SignupPage';
import { OAuthCallbackPage } from './pages/OAuthCallbackPage';
import { ProtectedRoute } from './components/auth/ProtectedRoute';
import { AuthProvider, useAuth } from './context/AuthContext';

function AppContent() {
  const { user } = useAuth();
  const location = useLocation();
  const cleanPath = location.pathname.toLowerCase().replace(/\/+$/, '');
  const isAuthRoute =
    cleanPath === '/login' ||
    cleanPath === '/signup' ||
    cleanPath.includes('/auth/callback');

  // Clean public landing page is strictly at root '/' or ''
  const isPublicRoot = cleanPath === '' || cleanPath === '/';

  // Secret Studio and Deployments are Independent GUI Management Portals with zero interference from consumer navigation
  const isSecretStudioRoute =
    cleanPath === '/secret-studio' ||
    cleanPath === '/dev-studio' ||
    cleanPath === '/deployments' ||
    cleanPath.startsWith('/secret-studio') ||
    cleanPath.startsWith('/dev-studio') ||
    cleanPath.startsWith('/deployments');

  return (
    <div className="min-h-screen bg-[#070a0e] text-slate-200 antialiased flex flex-col relative overflow-x-hidden selection:bg-emerald-500/30 selection:text-emerald-300">
      {/* Reusable Obsidian Dot Matrix & Ambient Glow Background */}
      <DotMatrixBackground />

      {/* Global Header & Path Bar (Omitted on auth routes, public landing, and Secret Studio/Deployments Independent Portals) */}
      {!isAuthRoute && !isSecretStudioRoute && <Header />}
      {!isAuthRoute && !isPublicRoot && !isSecretStudioRoute && <GlobalPathBar />}

      {/* Main Viewport Content */}
      <main
        className={`relative z-10 flex-1 flex flex-col items-center w-full ${
          isAuthRoute
            ? 'p-4 justify-center'
            : isSecretStudioRoute
            ? 'px-4 py-4 sm:px-6 sm:py-6 lg:px-8 lg:py-8'
            : 'px-4 pt-4 sm:px-6 sm:pt-6 lg:px-8 lg:pt-8 pb-16'
        }`}
      >
        <Routes>
          {/* Public Authentication Pages */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/signup" element={<SignupPage />} />
          <Route path="/auth/callback" element={<OAuthCallbackPage />} />

          {/* Clean Public Homepage: Authenticated users stay in /home, visitors see clean landing */}
          <Route
            path="/"
            element={user ? <Navigate to="/home" replace /> : <HomePage />}
          />

          {/* Legacy /dashboard routes redirected directly to /home */}
          <Route path="/dashboard" element={<Navigate to="/home" replace />} />
          <Route path="/dashboard/*" element={<Navigate to="/home" replace />} />

          {/* Protected Documentation Workspace at /home (Direct Cards Deck) */}
          <Route
            path="/home"
            element={
              <ProtectedRoute>
                <DashboardPage />
              </ProtectedRoute>
            }
          />

          {/* Secret Developer Studio GUI Portal (/secret-studio & /dev-studio) */}
          <Route
            path="/secret-studio"
            element={
              <ProtectedRoute>
                <SecretStudioPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/dev-studio"
            element={
              <ProtectedRoute>
                <SecretStudioPage />
              </ProtectedRoute>
            }
          />

          {/* Independent Deployments Portal Page */}
          <Route
            path="/deployments"
            element={
              <ProtectedRoute>
                <DeploymentsPage />
              </ProtectedRoute>
            }
          />

          {/* Protected Dynamic Documentation Hierarchy rooted at /home/* (e.g. /home/opencv) */}
          <Route
            path="/home/*"
            element={
              <ProtectedRoute>
                <DynamicPageView />
              </ProtectedRoute>
            }
          />

          {/* Dynamic Catch-All Route */}
          <Route
            path="/*"
            element={
              <ProtectedRoute>
                <DynamicPageView />
              </ProtectedRoute>
            }
          />
        </Routes>
      </main>
    </div>
  );
}

/**
 * Main Application Routing Architecture:
 * - HashRouter: Foolproof static hosting on GitHub Pages (https://<user>.github.io/greenapp/#/)
 * - Eliminates 404s on browser refreshes and deep link navigation without requiring server-side rewrite rules
 * - / : Minimal clean public landing page for visitors (Logo, Navbars)
 * - /login & /signup : Dedicated clean Vercel-style authentication pages styled in obsidian aesthetic
 * - /auth/callback : Lightweight popup handshake listener
 * - /home : Authenticated documentation workspace with direct module card decks (zero hero/metric clutter)
 * - /home/* : Protected dynamic hierarchical page router supporting arbitrary nesting (/home/opencv, etc.)
 */
export default function App() {
  return (
    <HashRouter>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </HashRouter>
  );
}
