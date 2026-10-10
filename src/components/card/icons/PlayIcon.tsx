import React from 'react';

export interface PlayIconProps {
  size?: number;
  className?: string;
}

/**
  * Custom Play Icon component for MP3 audio playback.
  */
export const PlayIcon: React.FC<PlayIconProps> = React.memo(({
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
      <polygon points="5 3 19 12 5 21 5 3" />
    </svg>
  );
});

PlayIcon.displayName = 'PlayIcon';
