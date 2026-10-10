import React, { useMemo } from 'react';
import { getContentRegistry } from '../lib/contentEngine';
import { PaginatedSubCardList } from '../components/ui/PaginatedSubCardList';

/**
 * Authenticated Member Workspace (/home).
 * Direct documentation cards without hero banners, avatars, or metrics.
 * Houses all documentation modules (HNPs) and interactive card decks (HNCs).
 */
export const DashboardPage: React.FC = () => {
  const [tick, setTick] = React.useState(0);

  React.useEffect(() => {
    const handleUpdate = () => setTick((t) => t + 1);
    window.addEventListener('greendocs:cards-updated', handleUpdate);
    return () => window.removeEventListener('greendocs:cards-updated', handleUpdate);
  }, []);

  const allPages = useMemo(() => getContentRegistry(), [tick]);

  return (
    <div className="w-full max-w-xl mx-auto flex flex-col gap-3 animate-fadeIn">
      <PaginatedSubCardList items={allPages} />
    </div>
  );
};
