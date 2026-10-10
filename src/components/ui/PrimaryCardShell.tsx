import React from 'react';

export interface PrimaryCardShellProps {
  /** Card children elements (typically SubCard and StraightLineInput) */
  children: React.ReactNode;
  /** Optional custom CSS classes to merge */
  className?: string;
  /** Optional inline styles */
  style?: React.CSSProperties;
}

/**
 * Reusable PrimaryCardShell providing the master obsidian gradient container,
 * 8px rounded corners (`rounded-lg`), subtle white border, and deep ambient shadow.
 */
export const PrimaryCardShell: React.FC<PrimaryCardShellProps> = ({
  children,
  className = '',
  style,
}) => {
  return (
    <div
      style={style}
      className={`w-full min-h-[365px] sm:min-h-[380px] h-[380px] rounded-lg overflow-hidden border border-white/[0.08] bg-[#070a0e]/90 backdrop-blur-md shadow-2xl shadow-black/70 p-3 sm:p-3.5 flex flex-col gap-2.5 sm:gap-3 ${className}`}
    >
      {children}
    </div>
  );
};
