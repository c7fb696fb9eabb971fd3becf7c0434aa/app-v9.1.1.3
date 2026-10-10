import React from 'react';

export interface VideoIconProps {
  size?: number;
  className?: string;
}

/**
  * Custom Video Icon component.
  */
export const VideoIcon: React.FC<VideoIconProps> = React.memo(({
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
      className={`text-slate-400 group-hover:text-emerald-400 transition-colors ${className}`}
      aria-hidden="true"
    >
      <rect x="2" y="6" width="14" height="12" rx="2" />
      <path d="M22 8l-6 4 6 4V8z" />
    </svg>
  );
});
