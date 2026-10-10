import React from 'react';

export interface DiagnosticsIconProps {
  /** Optional size in pixels (default: 14) */
  size?: number;
  className?: string;
}

/**
 * Custom high-tech Diagnostics Icon component for live telemetry and tools.
 */
export const DiagnosticsIcon: React.FC<DiagnosticsIconProps> = React.memo(({
  size = 14,
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
      <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
    </svg>
  );
});

DiagnosticsIcon.displayName = 'DiagnosticsIcon';
