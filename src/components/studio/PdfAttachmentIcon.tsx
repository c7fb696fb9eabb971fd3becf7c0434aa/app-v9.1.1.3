import React from 'react';

export interface PdfAttachmentIconProps {
  /** Optional size in pixels (default: 14) */
  size?: number;
  className?: string;
}

/**
 * Custom PDF Attachment Icon component for multi-format document sheets.
 */
export const PdfAttachmentIcon: React.FC<PdfAttachmentIconProps> = React.memo(({
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
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14 2 14 8 20 8" />
      <line x1="16" y1="13" x2="8" y2="13" />
      <line x1="16" y1="17" x2="8" y2="17" />
    </svg>
  );
});

PdfAttachmentIcon.displayName = 'PdfAttachmentIcon';
