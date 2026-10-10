import React from 'react';
import { GlobalPathBar, BreadcrumbItem } from './GlobalPathBar';

export type { BreadcrumbItem };

interface BreadcrumbPathProps {
  breadcrumbs?: BreadcrumbItem[];
  className?: string;
}

/**
 * Backwards-compatible alias for GlobalPathBar.
 */
export const BreadcrumbPath: React.FC<BreadcrumbPathProps> = React.memo(({ breadcrumbs, className = '' }) => {
  return <GlobalPathBar breadcrumbs={breadcrumbs} className={className} />;
});

