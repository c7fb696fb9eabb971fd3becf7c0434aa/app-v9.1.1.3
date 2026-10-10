import React from 'react';
import { formatStepNumber } from '../../constants/pagination';

export interface PaginationBarProps {
  /** The current active page (1-indexed) */
  currentPage: number;
  /** Total number of available pages */
  totalPages: number;
  /** Callback invoked when page is selected */
  onPageChange: (page: number) => void;
  /** Optional extra classes */
  className?: string;
}

/**
 * Universal, lightweight pagination bar styled with the exact aesthetic of the obsidian SubCards:
 * - Fixed h-10 height
 * - Centered, compact width
 * - Translucent obsidian glassmorphic container
 * - Monospace two-digit page numbers ('01', '02'...)
 * - Emerald active badge and subtle hover states
 */
export const PaginationBar: React.FC<PaginationBarProps> = React.memo(({
  currentPage,
  totalPages,
  onPageChange,
  className = '',
}) => {
  // Only render when there are more than 10 items (more than 1 page)
  if (totalPages <= 1) {
    return null;
  }

  const pages = Array.from({ length: totalPages }, (_, i) => i + 1);

  return (
    <nav
      aria-label="Pagination Navigation"
      className={`h-10 w-fit mx-auto px-2 flex items-center gap-1.5 rounded-md border border-white/[0.08] bg-[#070a0e]/90 shadow-lg shadow-black/50 backdrop-blur-md select-none mt-2 ${className}`}
    >
      {/* Previous Page Arrow */}
      <button
        type="button"
        onClick={() => currentPage > 1 && onPageChange(currentPage - 1)}
        disabled={currentPage <= 1}
        aria-label="Previous page"
        className={`h-7 px-2.5 flex items-center justify-center font-mono text-xs rounded transition-all duration-150 ${
          currentPage > 1
            ? 'text-zinc-400 hover:text-emerald-400 hover:bg-emerald-500/10 active:scale-95 cursor-pointer'
            : 'text-zinc-600 cursor-not-allowed opacity-50'
        }`}
      >
        &lt;
      </button>

      {/* Two-digit page numbers */}
      <div className="flex items-center gap-1">
        {pages.map((p) => {
          const isActive = p === currentPage;
          const formatted = formatStepNumber(p);

          return (
            <button
              key={p}
              type="button"
              onClick={() => onPageChange(p)}
              aria-current={isActive ? 'page' : undefined}
              aria-label={`Page ${p}`}
              className={`h-7 px-2.5 flex items-center justify-center font-mono text-xs rounded transition-all duration-150 ${
                isActive
                  ? 'font-semibold text-emerald-400 bg-emerald-500/15 border border-emerald-500/30 shadow-sm shadow-emerald-950/40 cursor-default'
                  : 'text-zinc-400 hover:text-slate-200 hover:bg-white/5 border border-transparent cursor-pointer'
              }`}
            >
              {formatted}
            </button>
          );
        })}
      </div>

      {/* Next Page Arrow */}
      <button
        type="button"
        onClick={() => currentPage < totalPages && onPageChange(currentPage + 1)}
        disabled={currentPage >= totalPages}
        aria-label="Next page"
        className={`h-7 px-2.5 flex items-center justify-center font-mono text-xs rounded transition-all duration-150 ${
          currentPage < totalPages
            ? 'text-zinc-400 hover:text-emerald-400 hover:bg-emerald-500/10 active:scale-95 cursor-pointer'
            : 'text-zinc-600 cursor-not-allowed opacity-50'
        }`}
      >
        &gt;
      </button>
    </nav>
  );
});
