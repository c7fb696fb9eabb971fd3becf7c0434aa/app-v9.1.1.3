import React from 'react';

export interface SelectIconProps {
  /** Optional icon size in pixels (default: 15) */
  size?: number;
  className?: string;
}

/**
 * Dedicated custom Select Icon component for destination and folder tree selection.
 * Features a clean folder hierarchy glyph with an integrated active selection checkmark.
 */
export const SelectIcon: React.FC<SelectIconProps> = React.memo(({
  size = 15,
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
      className={className}
      aria-hidden="true"
    >
      <path d="M4 20h16a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.93a2 2 0 0 1-1.66-.9l-.82-1.2A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13c0 1.1.9 2 2 2Z" />
      <polyline points="9 13 12 16 16 10" />
    </svg>
  );
});

SelectIcon.displayName = 'SelectIcon';
