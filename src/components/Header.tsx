import React, { useState } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { BrandLogo } from './BrandLogo';
import { LeftDrawerNavigation } from './navigation/LeftDrawerNavigation';
import { RightDrawerNavigation } from './navigation/RightDrawerNavigation';
import { LeftNavbarIcon } from './navigation/LeftNavbarIcon';
import { RightNavbarIcon } from './navigation/RightNavbarIcon';

/**
 * Global Navigation Header.
 * Features:
 * - Flanked by dual independent drawer trigger buttons (Left and Right)
 * - Centered BrandLogo linking to home (/home if logged in, / if visitor)
 * - Exact h-14 (56px) height matching drawer header line continuity
 * - Obsidian button styling (size 38px button, 33px icon container)
 * - Zero interference between Left and Right drawers
 */
export const Header: React.FC = React.memo(() => {
  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [isLeftOpen, setIsLeftOpen] = useState(false);
  const [isRightOpen, setIsRightOpen] = useState(false);

  // Secret Dev Trigger References
  const longPressTimerRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);
  const clickCountRef = React.useRef<{ count: number; lastTime: number }>({ count: 0, lastTime: 0 });

  const homeTarget = user ? '/home' : '/';

  // Global secret shortcut Ctrl+Shift+D or Cmd+Shift+D
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && (e.key === 'D' || e.key === 'd')) {
        e.preventDefault();
        navigate('/secret-studio');
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [navigate]);

  // Omit header on popup callback route and on Secret Studio (Independent GUI Management Portal)
  const cleanPath = location.pathname.toLowerCase().replace(/\/+$/, '');
  const isSecretStudio =
    cleanPath === '/secret-studio' ||
    cleanPath === '/dev-studio' ||
    cleanPath.includes('secret-studio') ||
    cleanPath.includes('dev-studio');

  if (location.pathname.includes('/auth/callback') || isSecretStudio) {
    return null;
  }

  const handleOpenLeft = () => {
    setIsRightOpen(false);
    setIsLeftOpen(true);
  };

  const handleOpenRight = () => {
    // Secret 4-click detection within 1.5 seconds
    const now = Date.now();
    if (now - clickCountRef.current.lastTime < 1500) {
      clickCountRef.current.count += 1;
      if (clickCountRef.current.count >= 4) {
        clickCountRef.current.count = 0;
        navigate('/secret-studio');
        return;
      }
    } else {
      clickCountRef.current = { count: 1, lastTime: now };
    }

    setIsLeftOpen(false);
    setIsRightOpen(true);
  };

  const handleRightPressStart = () => {
    longPressTimerRef.current = setTimeout(() => {
      navigate('/secret-studio');
    }, 1200);
  };

  const handleRightPressEnd = () => {
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
  };

  return (
    <>
      <header className="w-full border-b border-white/[0.08] bg-[#070a0e]/90 backdrop-blur-md sticky top-0 z-50">
        <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          {/* Left Navigation Trigger Button (Button 38px, Glyph 33px) */}
          <button
            type="button"
            onClick={handleOpenLeft}
            className="w-[38px] h-[38px] rounded-md border border-white/[0.08] bg-[#070a0e]/90 shadow-sm backdrop-blur-md hover:border-emerald-500/40 hover:bg-[#0c121a]/95 text-slate-300 hover:text-white flex items-center justify-center transition-all duration-200 cursor-pointer group focus:outline-none focus:ring-1 focus:ring-emerald-500/50"
            aria-label="Open left navigation menu"
            title="Open left navigation"
          >
            <div className="w-[33px] h-[33px] flex items-center justify-center">
              <LeftNavbarIcon size={18} />
            </div>
          </button>

          {/* Centered Brand Logo (33px) */}
          <NavLink
            to={homeTarget}
            className="flex items-center justify-center hover:scale-105 transition-transform focus:outline-none focus:ring-1 focus:ring-emerald-500/50 rounded-lg"
            aria-label="Home"
          >
            <BrandLogo size={33} />
          </NavLink>

          {/* Right Navigation Trigger Button (Button 38px, Glyph 33px) with Secret Long-Press / Quad-Click */}
          <button
            type="button"
            onClick={handleOpenRight}
            onMouseDown={handleRightPressStart}
            onMouseUp={handleRightPressEnd}
            onMouseLeave={handleRightPressEnd}
            onTouchStart={handleRightPressStart}
            onTouchEnd={handleRightPressEnd}
            className="w-[38px] h-[38px] rounded-md border border-white/[0.08] bg-[#070a0e]/90 shadow-sm backdrop-blur-md hover:border-emerald-500/40 hover:bg-[#0c121a]/95 text-slate-300 hover:text-white flex items-center justify-center transition-all duration-200 cursor-pointer group focus:outline-none focus:ring-1 focus:ring-emerald-500/50"
            aria-label="Open right navigation menu"
            title="Open right navigation (Secret: Long press or 4-click for Dev Studio)"
          >
            <div className="w-[33px] h-[33px] flex items-center justify-center">
              <RightNavbarIcon size={18} />
            </div>
          </button>
        </div>
      </header>

      {/* Independent Left Drawer Navigation (80% overlay to the right) */}
      <LeftDrawerNavigation
        isOpen={isLeftOpen}
        onClose={() => setIsLeftOpen(false)}
      />

      {/* Independent Right Drawer Navigation (80% overlay to the left, with Auth actions) */}
      <RightDrawerNavigation
        isOpen={isRightOpen}
        onClose={() => setIsRightOpen(false)}
      />
    </>
  );
});
