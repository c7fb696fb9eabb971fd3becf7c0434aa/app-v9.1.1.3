import React from 'react';

export interface IconProps {
  size?: number;
  className?: string;
}

/** Dedicated SVG Folder Icon */
export const TreeFolderIcon: React.FC<IconProps & { isOpen?: boolean }> = React.memo(({ size = 14, className = '', isOpen = false }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.8"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    {isOpen ? (
      <>
        <path d="M4 20h16a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.93a2 2 0 0 1-1.66-.9l-.82-1.2A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13c0 1.1.9 2 2 2Z" />
        <path d="M2 10h20" strokeWidth="1.5" />
      </>
    ) : (
      <path d="M20 20a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.9a2 2 0 0 1-1.69-.9L9.6 3.9A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2Z" />
    )}
  </svg>
));

/** Dedicated SVG Expand/Collapse Chevron Icon */
export const TreeChevronIcon: React.FC<IconProps & { isExpanded?: boolean }> = React.memo(({ size = 11, className = '', isExpanded = false }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.5"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={`transition-transform duration-150 ${isExpanded ? 'rotate-90' : ''} ${className}`}
  >
    <polyline points="9 18 15 12 9 6" />
  </svg>
));

/** Dedicated SVG Document / Component Card Icon */
export const TreeCardIcon: React.FC<IconProps> = React.memo(({ size = 13, className = '' }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.8"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <rect width="18" height="18" x="3" y="3" rx="2.5" />
    <path d="M7 8h10" />
    <path d="M7 12h10" />
    <path d="M7 16h5" />
  </svg>
));

/** Dedicated "Create Card" Action Icon: Document outline with plus symbol */
export const TreeAddCardIcon: React.FC<IconProps> = React.memo(({ size = 12, className = '' }) => (
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
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
    <polyline points="14 2 14 8 20 8" />
    <line x1="12" y1="18" x2="12" y2="12" />
    <line x1="9" y1="15" x2="15" y2="15" />
  </svg>
));

/** Dedicated "Create Sub Card / Sub Page" Action Icon: Hierarchy branch with sub-node and plus */
export const TreeAddSubIcon: React.FC<IconProps> = React.memo(({ size = 12, className = '' }) => (
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
    {/* Parent node */}
    <rect x="3" y="3" width="7" height="6" rx="1.5" />
    {/* Branch line */}
    <path d="M6.5 9v9a1 1 0 0 0 1 1H12" />
    {/* Child node with plus */}
    <rect x="12" y="14" width="9" height="8" rx="1.5" />
    <line x1="16.5" y1="16" x2="16.5" y2="20" strokeWidth="1.8" />
    <line x1="14.5" y1="18" x2="18.5" y2="18" strokeWidth="1.8" />
  </svg>
));

/** Dedicated "Move Up" Action Icon: Ascending arrow with level shelf */
export const TreeArrowUpIcon: React.FC<IconProps> = React.memo(({ size = 11, className = '' }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.4"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <line x1="12" y1="20" x2="12" y2="5" />
    <polyline points="6 11 12 5 18 11" />
  </svg>
));

/** Dedicated "Move Down" Action Icon: Descending arrow with level shelf */
export const TreeArrowDownIcon: React.FC<IconProps> = React.memo(({ size = 11, className = '' }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.4"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <line x1="12" y1="4" x2="12" y2="19" />
    <polyline points="18 13 12 19 6 13" />
  </svg>
));

/** Dedicated "Rename / Edit" Action Icon: Precision pencil & editing nib */
export const TreeEditIcon: React.FC<IconProps> = React.memo(({ size = 11, className = '' }) => (
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
    <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
    <path d="m15 5 4 4" />
  </svg>
));

/** Dedicated "Delete" Action Icon: Precision waste canister with lid and handle */
export const TreeTrashIcon: React.FC<IconProps> = React.memo(({ size = 11, className = '' }) => (
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
    <path d="M3 6h18" />
    <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
    <path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
    <line x1="10" y1="11" x2="10" y2="17" />
    <line x1="14" y1="11" x2="14" y2="17" />
  </svg>
));

/** Dedicated "Plus" Action Icon */
export const TreePlusIcon: React.FC<IconProps> = React.memo(({ size = 11, className = '' }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.5"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <line x1="12" y1="5" x2="12" y2="19" />
    <line x1="5" y1="12" x2="19" y2="12" />
  </svg>
));

/** Dedicated "Close / Cross" Icon */
export const TreeCloseIcon: React.FC<IconProps> = React.memo(({ size = 11, className = '' }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <line x1="18" y1="6" x2="6" y2="18" />
    <line x1="6" y1="6" x2="18" y2="18" />
  </svg>
));

/** Dedicated Leaf / Endpoint Node Bullet */
export const TreeNodeBulletIcon: React.FC<IconProps> = React.memo(({ size = 6, className = '' }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 8 8"
    fill="currentColor"
    className={className}
  >
    <circle cx="4" cy="4" r="2.5" />
  </svg>
));
