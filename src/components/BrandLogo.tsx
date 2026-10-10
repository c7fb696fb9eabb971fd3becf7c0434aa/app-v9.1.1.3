import React from 'react';

export interface BrandLogoProps {
  /** Optional size in pixels (default: 33) */
  size?: number;
  className?: string;
}

/**
 * Reusable Brand Logo component rendering the signature Emerald Leaf Hexagon glyph.
 * Default size is 33px to match the application's strict design system standards.
 */
export const BrandLogo: React.FC<BrandLogoProps> = React.memo(({
  size = 33,
  className = '',
}) => {
  return (
    <div
      style={{ width: `${size}px`, height: `${size}px` }}
      className={`flex items-center justify-center rounded-lg bg-gradient-to-br from-emerald-400 to-emerald-600 shadow-sm shadow-emerald-500/20 shrink-0 ${className}`}
      aria-label="Green App Brand Logo"
    >
      <svg
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-5 h-5 text-slate-950"
      >
        <path
          d="M12 2L19.5 6.5V15.5L12 20L4.5 15.5V6.5L12 2Z"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <circle cx="12" cy="11" r="3" fill="currentColor" />
      </svg>
    </div>
  );
});
