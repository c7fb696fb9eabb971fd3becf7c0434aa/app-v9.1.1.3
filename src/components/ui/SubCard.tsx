import React from 'react';

export interface SubCardProps {
  /** Optional custom content rendered inside the sub-card */
  children?: React.ReactNode;
  /** Optional sequential step number (e.g. "01", "12") for structured display */
  stepNumber?: string;
  /** Primary title text for structured display */
  title?: string;
  /** Optional software version badge (e.g. "v4.10.0") */
  version?: string;
  /** Optional category or domain tag */
  category?: string;
  /** Optional custom CSS classes */
  className?: string;
  /** Click handler with event isolation */
  onClick?: (e: React.MouseEvent<HTMLDivElement>) => void;
  /** Role for accessibility */
  role?: string;
  /** Aria label for screen readers */
  ariaLabel?: string;
}

/**
 * Reusable SubCard primitive.
 * Supports two ergonomic modes:
 * 1. Structured Mode: Pass `stepNumber`, `title`, and optional `version`/`category` for instant, standardized list item rendering.
 * 2. Unstructured Mode: Pass custom `children` for custom layout composition.
 */
export const SubCard: React.FC<SubCardProps> = React.memo(({
  children,
  stepNumber,
  title,
  version,
  category,
  className = '',
  onClick,
  role = onClick ? 'button' : undefined,
  ariaLabel,
}) => {
  const isInteractive = Boolean(onClick);

  // If structured props (title or stepNumber) are provided without custom children
  if (!children && (title || stepNumber)) {
    const computedAriaLabel = ariaLabel || (title ? `Navigate to ${title}` : undefined);

    return (
      <div
        onClick={onClick}
        role={role}
        aria-label={computedAriaLabel}
        className={`h-10 shrink-0 w-full px-3.5 sm:px-4 flex items-center justify-between rounded-md border border-white/[0.08] bg-[#070a0e]/90 shadow-lg shadow-black/50 backdrop-blur-md relative overflow-hidden select-none transition-all duration-200 group ${
          isInteractive ? 'cursor-pointer hover:border-emerald-500/40 hover:bg-[#0c121a]/95' : ''
        } ${className}`}
      >
        {/* Left Side: Chevron, Step Index, Title, Version */}
        <div className="flex items-center gap-2.5 min-w-0">
          <span className="font-mono text-xs select-none font-bold text-zinc-400 group-hover:text-emerald-400 transition-colors">
            &gt;
          </span>
          {stepNumber && (
            <span className="font-mono text-[11px] text-emerald-400/90 font-semibold shrink-0">
              {stepNumber}
            </span>
          )}
          {title && (
            <span className="text-xs sm:text-[13px] text-slate-200 font-mono font-medium truncate group-hover:text-white transition-colors">
              {title}
            </span>
          )}
          {version && (
            <span className="text-[11px] font-mono text-slate-500 hidden sm:inline">
              {version}
            </span>
          )}
        </div>

        {/* Right Side: Category, Hover Arrow */}
        <div className="flex items-center gap-2 shrink-0">
          {category && (
            <span className="text-[10px] sm:text-[11px] font-mono text-slate-400 group-hover:text-slate-300 transition-colors truncate max-w-[140px] sm:max-w-none">
              {category}
            </span>
          )}
          {isInteractive && (
            <span className="text-[11px] font-mono text-emerald-400 opacity-0 group-hover:opacity-100 transition-opacity">
              &rarr;
            </span>
          )}
        </div>
      </div>
    );
  }

  // Fallback to custom children layout
  return (
    <div
      onClick={onClick}
      role={role}
      aria-label={ariaLabel}
      className={`rounded-md border border-white/[0.08] bg-[#070a0e]/90 shadow-lg shadow-black/50 backdrop-blur-md relative overflow-hidden ${className}`}
    >
      {children}
    </div>
  );
});
