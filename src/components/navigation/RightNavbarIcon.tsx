import React from 'react';

export interface RightNavbarIconProps {
  /** Optional icon size in pixels (default: 24) */
  size?: number;
  className?: string;
}

/**
 * Dedicated icon component for the Right Navigation Bar trigger.
 * Features 3 full linear horizontal lines with no cuts, maintaining complete independence from the Left icon.
 */
export const RightNavbarIcon: React.FC<RightNavbarIconProps> = React.memo(({
  size = 24,
  className = '',
}) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={`text-zinc-400 group-hover:text-emerald-400 transition-colors ${className}`}
      aria-hidden="true"
    >
      <line x1="3" y1="6" x2="21" y2="6" />
      <line x1="3" y1="12" x2="21" y2="12" />
      <line x1="3" y1="18" x2="21" y2="18" />
    </svg>
  );
});
