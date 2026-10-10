import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { BrandLogo } from '../BrandLogo';
import { useAuth } from '../../context/AuthContext';

export interface RightDrawerNavigationProps {
  /** Whether the right drawer is currently open */
  isOpen: boolean;
  /** Callback fired to close the right drawer */
  onClose: () => void;
  /** Optional callback for Sign Up action */
  onSignUp?: () => void;
  /** Optional callback for Log In action */
  onLogIn?: () => void;
}

/**
 * Right Drawer Navigation Bar.
 * - Slides from the right edge covering 80% of the viewport width towards the left
 * - Distinct, decoupled codebase with zero shared UI elements other than BrandLogo
 * - Header height h-14 with bottom divider line aligned with the global header
 * - Embedded green dot-matrix background and ambient emerald atmosphere
 * - Calculated middle content area
 * - Dedicated Footer with Signup and Login buttons strictly isolated to the right navbar
 */
export const RightDrawerNavigation: React.FC<RightDrawerNavigationProps> = ({
  isOpen,
  onClose,
  onSignUp,
  onLogIn,
}) => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  // Close on physical Escape key press
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Lock document body scrolling when drawer is open
  useEffect(() => {
    if (isOpen) {
      const prevOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = prevOverflow;
      };
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden select-none" role="dialog" aria-modal="true" aria-label="Right Navigation Menu">
      {/* 80% Backdrop Overlay to the Left */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity duration-300 animate-fadeIn"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Right Drawer Container: 80% of viewport width */}
      <div className="fixed inset-y-0 right-0 w-[80vw] max-w-md bg-[#070a0e] border-l border-white/[0.08] shadow-2xl flex flex-col z-10 overflow-hidden transform transition-transform duration-300 ease-out">
        {/* Replicated Dot Matrix & Emerald Atmosphere Background */}
        <div className="absolute inset-0 pointer-events-none z-0 overflow-hidden" aria-hidden="true">
          <div
            className="absolute inset-0 opacity-40"
            style={{
              backgroundImage: 'radial-gradient(rgba(16, 185, 129, 0.38) 1.2px, transparent 1.2px)',
              backgroundSize: '24px 24px',
              maskImage: 'radial-gradient(ellipse 90% 70% at 50% 35%, black 45%, transparent 95%)',
              WebkitMaskImage: 'radial-gradient(ellipse 90% 70% at 50% 35%, black 45%, transparent 95%)',
            }}
          />
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-[280px] bg-gradient-to-b from-emerald-500/10 via-emerald-500/3 to-transparent blur-3xl pointer-events-none" />
        </div>

        {/* 1. Zone: Header (h-14, matching main header line with bottom divider) */}
        <div className="relative z-10 flex h-14 shrink-0 items-center justify-between px-4 sm:px-5 border-b border-white/[0.08] bg-[#070a0e]/90 backdrop-blur-md">
          {/* Close 'X' Button (Button 38px, Logo/Icon 33px container, Obsidian Button Style) */}
          <button
            type="button"
            onClick={onClose}
            className="w-[38px] h-[38px] rounded-md border border-white/[0.08] bg-[#070a0e]/90 shadow-sm backdrop-blur-md hover:border-emerald-500/40 hover:bg-[#0c121a]/95 text-slate-300 hover:text-white flex items-center justify-center transition-all duration-200 cursor-pointer group focus:outline-none focus:ring-1 focus:ring-emerald-500/50"
            aria-label="Close right navigation menu"
            title="Close menu (Escape)"
          >
            <div className="w-[33px] h-[33px] flex items-center justify-center">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="w-4 h-4 text-zinc-400 group-hover:text-emerald-400 transition-colors"
              >
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </div>
          </button>

          {/* Brand Logo (33px) */}
          <div className="flex items-center gap-3">
            <BrandLogo size={33} />
          </div>
        </div>

        {/* 2. Zone: Calculated Content Area (Middle, Flexible) */}
        <div className="relative z-10 flex-1 overflow-y-auto p-4 sm:p-5 flex flex-col justify-center items-center text-center">
          {user ? (
            <div className="flex flex-col items-center gap-3 w-full p-4 rounded-lg border border-white/[0.08] bg-[#0c121a]/80 shadow-md">
              <img
                src={user.avatar_url}
                alt={user.login}
                className="w-14 h-14 rounded-full border-2 border-emerald-500/50 shadow-md shadow-emerald-500/20"
              />
              <div className="flex flex-col">
                <span className="text-sm font-semibold text-white font-sans">{user.name}</span>
                <span className="text-xs text-emerald-400 font-mono">@{user.login}</span>
              </div>
              <span className="text-[10px] font-mono text-emerald-300 bg-emerald-500/15 border border-emerald-500/30 px-2 py-0.5 rounded-full mt-1">
                Connected via GitHub
              </span>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-2 max-w-xs text-center">
              <span className="text-xs font-mono text-slate-400">
                Sign in to customize your documentation workspace and manage card decks.
              </span>
            </div>
          )}
        </div>

        {/* 3. Zone: Footer with Signup and Login Buttons (Exclusively on Right Navbar) */}
        <div className="relative z-10 shrink-0 border-t border-white/[0.08] bg-[#070a0e]/95 backdrop-blur-md p-4 sm:p-5 flex flex-col gap-2.5">
          {user ? (
            <>
              <button
                type="button"
                onClick={() => {
                  onClose();
                  navigate('/home');
                }}
                className="w-full h-10 rounded-md border border-emerald-500/40 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 font-mono text-xs sm:text-[13px] font-semibold flex items-center justify-center gap-2 transition-all duration-200 cursor-pointer shadow-sm focus:outline-none focus:ring-1 focus:ring-emerald-500/50"
              >
                <span>Documentation Home</span>
                <span>&rarr;</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  onClose();
                  navigate('/secret-studio');
                }}
                className="w-full h-9 rounded-md border border-white/[0.08] bg-[#0c121a] hover:border-emerald-500/40 text-slate-300 hover:text-emerald-300 font-mono text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
              >
                <span>Card Studio & Backend GUI</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  logout();
                  onClose();
                  navigate('/');
                }}
                className="w-full h-10 rounded-md border border-red-500/30 bg-[#070a0e]/90 hover:border-red-500/50 hover:bg-red-950/20 text-red-300 font-mono text-xs sm:text-[13px] font-medium flex items-center justify-center transition-all duration-200 cursor-pointer focus:outline-none"
              >
                Log Out
              </button>
            </>
          ) : (
            <>
              {/* Sign Up Button: Navigates to /signup */}
              <button
                type="button"
                onClick={() => {
                  onClose();
                  if (onSignUp) onSignUp();
                  else navigate('/signup');
                }}
                className="w-full h-10 rounded-md border border-emerald-500/40 bg-[#070a0e]/90 hover:border-emerald-400 hover:bg-[#0c121a]/95 text-emerald-400 hover:text-emerald-300 font-mono text-xs sm:text-[13px] font-semibold tracking-wide flex items-center justify-center transition-all duration-200 cursor-pointer focus:outline-none focus:ring-1 focus:ring-emerald-500/50"
              >
                Sign Up
              </button>

              {/* Log In Button: Navigates to /login */}
              <button
                type="button"
                onClick={() => {
                  onClose();
                  if (onLogIn) onLogIn();
                  else navigate('/login');
                }}
                className="w-full h-10 rounded-md border border-white/[0.08] bg-[#070a0e]/90 hover:border-emerald-500/40 hover:bg-[#0c121a]/95 text-slate-200 hover:text-white font-mono text-xs sm:text-[13px] font-medium tracking-wide shadow-sm flex items-center justify-center transition-all duration-200 cursor-pointer focus:outline-none focus:ring-1 focus:ring-emerald-500/50"
              >
                Log In
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
