import React, { useEffect, useRef, useState, useMemo } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { resolvePathNode, humanizeSlug } from '../lib/contentEngine';

export interface BreadcrumbItem {
  label: string;
  path: string;
}

interface GlobalPathBarProps {
  /** Optional custom breadcrumbs override */
  breadcrumbs?: BreadcrumbItem[];
  className?: string;
}

/**
 * Permanent GitHub-style Path Bar & Navigation Grid.
 * Features:
 * - Centered "Home" text when at root level with zero other pages open
 * - Horizontal single-line "tunnel" mode for nested documentation pages
 * - Automatic auto-scroll to the active terminal crumb so it is always presented
 * - Fluid bidirectional touch sliding (finger swipe) and mouse drag
 * - Pinned Back button with physical 'Escape' key listener
 * - Strict h-10 fixed geometric rhythm that never wraps or shifts layout
 */
export const GlobalPathBar: React.FC<GlobalPathBarProps> = React.memo(({
  breadcrumbs: customBreadcrumbs,
  className = '',
}) => {
  const location = useLocation();
  const navigate = useNavigate();

  const tunnelRef = useRef<HTMLDivElement>(null);
  const isDragging = useRef(false);
  const startX = useRef(0);
  const scrollLeftStart = useRef(0);
  const draggedDistance = useRef(0);
  const [isScrolled, setIsScrolled] = useState(false);

  // Resolve breadcrumbs dynamically if not explicitly provided
  const breadcrumbs: BreadcrumbItem[] = useMemo(() => {
    if (customBreadcrumbs && customBreadcrumbs.length > 0) {
      return customBreadcrumbs;
    }

    // Parse path segments, ignoring sub-directory repository name if present
    const rawSegments = location.pathname
      .split('/')
      .filter((seg) => Boolean(seg && seg.trim()) && !['greendocs', 'greenapp'].includes(seg.toLowerCase()));

    // Zero-Footprint Secret Studio: Never expose secret studio in path breadcrumbs
    if (
      rawSegments.some((seg) =>
        ['secret-studio', 'dev-studio', 'secretstudio', 'devstudio'].includes(seg.toLowerCase())
      )
    ) {
      return [{ label: 'Home', path: '/home' }];
    }

    // Root workspace: /home or /dashboard or empty
    if (
      rawSegments.length === 0 ||
      (rawSegments.length === 1 &&
        (rawSegments[0].toLowerCase() === 'home' || rawSegments[0].toLowerCase() === 'dashboard'))
    ) {
      return [{ label: 'Home', path: '/home' }];
    }

    const segmentsWithoutHome =
      rawSegments[0]?.toLowerCase() === 'home' || rawSegments[0]?.toLowerCase() === 'dashboard'
        ? rawSegments.slice(1)
        : rawSegments;

    const resolved = resolvePathNode(segmentsWithoutHome);
    if (resolved && resolved.breadcrumbs.length > 0) {
      return resolved.breadcrumbs;
    }

    // Fallback path segment accumulation rooted at /home
    const accum: BreadcrumbItem[] = [{ label: 'Home', path: '/home' }];
    let current = '/home';
    for (const seg of segmentsWithoutHome) {
      current += `/${seg}`;
      accum.push({ label: humanizeSlug(seg), path: current });
    }
    return accum;
  }, [customBreadcrumbs, location.pathname]);

  const isRoot = breadcrumbs.length <= 1;
  const parentCrumb = breadcrumbs.length > 1 ? breadcrumbs[breadcrumbs.length - 2] : null;

  // Auto-scroll tunnel to the right to present the active leaf page
  useEffect(() => {
    if (isRoot) return;

    const el = tunnelRef.current;
    if (el) {
      // Delay slightly for render layout measurement
      const frameId = requestAnimationFrame(() => {
        el.scrollTo({
          left: el.scrollWidth,
          behavior: 'smooth',
        });
        setIsScrolled((prev) => {
          const next = el.scrollLeft > 6;
          return prev !== next ? next : prev;
        });
      });
      return () => cancelAnimationFrame(frameId);
    }
  }, [location.pathname, breadcrumbs.length, isRoot]);

  // Monitor scroll offset to adjust left tunnel fade mask
  useEffect(() => {
    const el = tunnelRef.current;
    if (!el || isRoot) return;

    const handleScroll = () => {
      setIsScrolled((prev) => {
        const next = el.scrollLeft > 6;
        return prev !== next ? next : prev;
      });
    };

    el.addEventListener('scroll', handleScroll, { passive: true });
    return () => el.removeEventListener('scroll', handleScroll);
  }, [isRoot]);

  // Listen for Escape key to navigate up one level
  useEffect(() => {
    if (!parentCrumb) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA')) {
        return;
      }

      if (e.key === 'Escape') {
        e.preventDefault();
        navigate(parentCrumb.path);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [parentCrumb, navigate]);

  // Mouse Drag Handlers for Desktop Tunnel Navigation
  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!tunnelRef.current) return;
    isDragging.current = true;
    startX.current = e.pageX - tunnelRef.current.offsetLeft;
    scrollLeftStart.current = tunnelRef.current.scrollLeft;
    draggedDistance.current = 0;
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isDragging.current || !tunnelRef.current) return;
    e.preventDefault();
    const x = e.pageX - tunnelRef.current.offsetLeft;
    const walk = (x - startX.current) * 1.5;
    draggedDistance.current = Math.abs(x - startX.current);
    tunnelRef.current.scrollLeft = scrollLeftStart.current - walk;
  };

  const handleMouseUp = () => {
    isDragging.current = false;
  };

  const handleMouseLeave = () => {
    isDragging.current = false;
  };

  // Do not render path bar on the OAuth callback popup route, clean public root ('/' or ''),
  // or Secret Studio / Dev Studio routes (Secret Studio is an Independent GUI Management Portal)
  const cleanPath = location.pathname.toLowerCase().replace(/\/+$/, '');
  const isPublicRoot = cleanPath === '' || cleanPath === '/';
  const isSecretStudio =
    cleanPath === '/secret-studio' ||
    cleanPath === '/dev-studio' ||
    cleanPath.includes('secret-studio') ||
    cleanPath.includes('dev-studio');

  if (location.pathname.includes('/auth/callback') || isPublicRoot || isSecretStudio) {
    return null;
  }

  return (
    <div
      className={`w-full border-b border-white/[0.08] bg-[#070a0e]/90 shadow-sm shadow-black/40 backdrop-blur-md sticky top-14 z-40 transition-colors py-2 px-4 sm:px-6 ${className}`}
    >
      {isRoot ? (
        /* Root / Homepage Variant: Centered "Home" text with geometric elegance */
        <div className="mx-auto flex h-10 w-full max-w-xl items-center justify-center px-3.5 sm:px-4 rounded-md border border-white/[0.08] bg-[#070a0e]/90 shadow-lg shadow-black/50 backdrop-blur-md relative overflow-hidden select-none transition-all duration-200">
          <span
            className="text-emerald-400 font-medium font-mono text-xs tracking-wider"
            aria-current="page"
          >
            Home
          </span>
        </div>
      ) : (
        /* Nested Documentation Pages: Single-Line Tunnel with Pinned Back Button */
        <div className="mx-auto flex h-10 w-full max-w-xl items-center justify-between px-3.5 sm:px-4 rounded-md border border-white/[0.08] bg-[#070a0e]/90 shadow-lg shadow-black/50 backdrop-blur-md relative overflow-hidden select-none transition-all duration-200">
          {/* Tunnel Container: Horizontal Touch Panning & Momentum Sliding */}
          <div
            ref={tunnelRef}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseLeave}
            className="min-w-0 flex-1 overflow-x-auto overflow-y-hidden select-none flex items-center scrollbar-none [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden touch-pan-x cursor-grab active:cursor-grabbing pr-2"
            style={{
              WebkitOverflowScrolling: 'touch',
              maskImage: isScrolled
                ? 'linear-gradient(to right, transparent 0%, black 24px, black 100%)'
                : undefined,
              WebkitMaskImage: isScrolled
                ? 'linear-gradient(to right, transparent 0%, black 24px, black 100%)'
                : undefined,
            }}
          >
            <nav aria-label="Breadcrumb navigation" className="flex items-center whitespace-nowrap">
              <ol className="flex items-center gap-1.5 flex-nowrap text-xs font-mono">
                {breadcrumbs.map((crumb, idx) => {
                  const isLast = idx === breadcrumbs.length - 1;

                  return (
                    <li key={crumb.path} className="flex items-center gap-1.5 shrink-0 whitespace-nowrap">
                      {idx > 0 && (
                        <span className="text-slate-600 font-sans select-none" aria-hidden="true">
                          /
                        </span>
                      )}
                      {isLast ? (
                        <span
                          className="text-emerald-400 font-medium whitespace-nowrap"
                          aria-current="page"
                          title={crumb.label}
                        >
                          {crumb.label}
                        </span>
                      ) : (
                        <Link
                          to={crumb.path}
                          className="text-slate-300 hover:text-white transition-colors focus:outline-none focus:text-emerald-400 whitespace-nowrap"
                          title={crumb.label}
                          onClick={(e) => {
                            if (draggedDistance.current > 6) {
                              e.preventDefault();
                            }
                          }}
                        >
                          {crumb.label}
                        </Link>
                      )}
                    </li>
                  );
                })}
              </ol>
            </nav>
          </div>

          {/* Pinned Back Button on the right */}
          {parentCrumb && (
            <div className="shrink-0 pl-2">
              <Link
                to={parentCrumb.path}
                className="h-7 px-2.5 sm:px-3 rounded-md border border-white/[0.08] bg-[#070a0e]/90 shadow-sm backdrop-blur-md hover:border-emerald-500/40 hover:bg-[#070d16] inline-flex items-center gap-1.5 transition-all duration-200 shrink-0 group select-none"
                title="Go back (Escape)"
                aria-label="Go back to parent page"
              >
                <span className="font-mono text-xs text-zinc-400 group-hover:text-emerald-400 transition-colors">
                  &larr;
                </span>
                <span className="font-mono text-[11px] font-medium text-slate-300 group-hover:text-white transition-colors">
                  Back
                </span>
              </Link>
            </div>
          )}
        </div>
      )}
    </div>
  );
});
