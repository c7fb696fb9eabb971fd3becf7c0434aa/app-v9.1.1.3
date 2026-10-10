import React from 'react';

export interface TerminalIconProps {
  size?: number;
  className?: string;
}

/**
  * Custom Terminal / CLI Simulator Icon component.
  */
export const TerminalIcon: React.FC<TerminalIconProps> = React.memo(({
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
      <polyline points="4 17 10 11 4 5" />
      <line x1="12" y1="19" x2="20" y2="19" />
    </svg>
  );
});

TerminalIcon.displayName = 'TerminalIcon';
