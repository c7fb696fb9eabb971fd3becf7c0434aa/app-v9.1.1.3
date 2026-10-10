import React from 'react';

export interface JsonIconProps {
  size?: number;
  className?: string;
}

/**
  * Custom JSON / Raw Data Inspection Icon component.
  */
export const JsonIcon: React.FC<JsonIconProps> = React.memo(({
  size = 18,
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
    >
      <polyline points="16 18 22 12 16 6" />
      <polyline points="8 6 2 12 8 18" />
    </svg>
  );
});

JsonIcon.displayName = 'JsonIcon';
