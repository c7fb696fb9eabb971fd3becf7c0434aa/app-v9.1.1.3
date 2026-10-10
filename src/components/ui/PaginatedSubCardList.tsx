import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PageNode } from '../../types';
import { SubCard } from './SubCard';
import { PaginationBar } from './PaginationBar';
import { ITEMS_PER_PAGE, formatStepNumber } from '../../constants/pagination';

export interface PaginatedSubCardListProps {
  /** Array of page nodes to render */
  items: PageNode[];
  /** Optional base path prefix for navigation (e.g. "/opencv") */
  basePath?: string;
  /** Optional custom container CSS classes */
  className?: string;
}

/**
 * Higher-order list component that encapsulates 10-item windowed pagination,
 * sequential index calculations, SubCard rendering, and navigation routing.
 * Ensures 100% DRY compliance across all directory and topic views.
 */
export const PaginatedSubCardList: React.FC<PaginatedSubCardListProps> = ({
  items,
  basePath = '',
  className = '',
}) => {
  const navigate = useNavigate();
  const [currentPage, setCurrentPage] = useState<number>(1);

  const totalPages = Math.ceil(items.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const visibleItems = items.slice(startIndex, startIndex + ITEMS_PER_PAGE);

  const cleanBasePath = basePath ? (basePath.startsWith('/') ? basePath : `/${basePath}`) : '';

  return (
    <div className={`w-full flex flex-col gap-2.5 sm:gap-3 ${className}`}>
      {visibleItems.map((node, index) => {
        const targetPath = node.urlPath || (cleanBasePath ? `${cleanBasePath}/${node.slug}` : `/${node.slug}`);
        const step = formatStepNumber(node.order !== undefined ? node.order : startIndex + index + 1);

        return (
          <SubCard
            key={node.id}
            onClick={() => navigate(targetPath)}
            stepNumber={step}
            title={node.title}
            version={node.version}
            category={node.category}
          />
        );
      })}

      {/* Reusable Pagination Bar rendered automatically when items > 10 */}
      <PaginationBar
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={setCurrentPage}
      />
    </div>
  );
};
