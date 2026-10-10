import React from 'react';

export interface VideoAttachmentIconProps {
  /** Optional size in pixels (default: 14) */
  size?: number;
  className?: string;
}

/**
 * Custom Video Attachment Icon component for multi-format walkthrough videos.
 */
export const VideoAttachmentIcon: React.FC<VideoAttachmentIconProps> = React.memo(({
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
      <polygon points="23 7 16 12 23 17 23 7" />
      <rect x="1" y="5" width="15" height="14" rx="2" ry="2" />
    </svg>
  );
});

VideoAttachmentIcon.displayName = 'VideoAttachmentIcon';
