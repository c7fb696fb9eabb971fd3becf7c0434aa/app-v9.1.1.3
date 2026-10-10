import React from 'react';

export interface BookmarkIconProps {
  size?: number;
  className?: string;
}

/**
  * Custom Bookmark / Favorite Icon component.
  */
export const BookmarkIcon: React.FC<BookmarkIconProps> = React.memo(({
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
      <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
    </svg>
  );
});

BookmarkIcon.displayName = 'BookmarkIcon';
