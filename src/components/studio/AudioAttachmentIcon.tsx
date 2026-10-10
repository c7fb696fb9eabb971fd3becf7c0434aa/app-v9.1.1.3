import React from 'react';

export interface AudioAttachmentIconProps {
  /** Optional size in pixels (default: 14) */
  size?: number;
  className?: string;
}

/**
 * Custom Audio Attachment Icon component for multi-format audio tracks.
 */
export const AudioAttachmentIcon: React.FC<AudioAttachmentIconProps> = React.memo(({
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
      <path d="M9 18V5l12-2v13" />
      <circle cx="6" cy="18" r="3" />
      <circle cx="18" cy="16" r="3" />
    </svg>
  );
});

AudioAttachmentIcon.displayName = 'AudioAttachmentIcon';
