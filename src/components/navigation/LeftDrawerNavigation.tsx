import React, { useEffect } from 'react';
import { BrandLogo } from '../BrandLogo';

export interface LeftDrawerNavigationProps {
  /** Whether the left drawer is currently open */
  isOpen: boolean;
  /** Callback fired to close the left drawer */
  onClose: () => void;
}

/**
 * Left Drawer Navigation Bar.
 * - Slides from the left edge covering 80% of the viewport width towards the right
 * - Distinct, decoupled codebase with zero shared UI elements other than BrandLogo
 * - Header height h-14 with bottom divider line aligned with the global header
 * - Embedded green dot-matrix background and ambient emerald atmosphere
 * - Empty content and footer areas as confirmed by the user
 */
export const LeftDrawerNavigation: React.FC<LeftDrawerNavigationProps> = ({
  isOpen,
  onClose,
}) => {
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
    <div className="fixed inset-0 z-50 overflow-hidden select-none" role="dialog" aria-modal="true" aria-label="Left Navigation Menu">
      {/* 80% Backdrop Overlay to the Right */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity duration-300 animate-fadeIn"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Left Drawer Container: 80% of viewport width */}
      <div className="fixed inset-y-0 left-0 w-[80vw] max-w-md bg-[#070a0e] border-r border-white/[0.08] shadow-2xl flex flex-col z-10 overflow-hidden transform transition-transform duration-300 ease-out">
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
          {/* Brand Logo (33px) */}
          <div className="flex items-center gap-3">
            <BrandLogo size={33} />
          </div>

          {/* Close 'X' Button (Button 38px, Logo/Icon 33px container, Obsidian Button Style) */}
          <button
            type="button"
            onClick={onClose}
            className="w-[38px] h-[38px] rounded-md border border-white/[0.08] bg-[#070a0e]/90 shadow-sm backdrop-blur-md hover:border-emerald-500/40 hover:bg-[#0c121a]/95 text-slate-300 hover:text-white flex items-center justify-center transition-all duration-200 cursor-pointer group focus:outline-none focus:ring-1 focus:ring-emerald-500/50"
            aria-label="Close left navigation menu"
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
        </div>

        {/* 2. Zone: Calculated Content Area (Middle, Flexible, Empty as confirmed) */}
        <div className="relative z-10 flex-1 overflow-y-auto p-4 sm:p-5 flex flex-col justify-center items-center text-center">
          {/* Empty content zone ready for future left navigation features */}
        </div>

        {/* 3. Zone: Footer (Split with top divider, Empty as confirmed) */}
        <div className="relative z-10 min-h-[56px] shrink-0 border-t border-white/[0.08] bg-[#070a0e]/90 backdrop-blur-md px-4 sm:px-5 flex items-center">
          {/* Empty footer zone ready for future left tools */}
        </div>
      </div>
    </div>
  );
};
