import React, { useState, useEffect, useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { resolvePathNode } from '../lib/contentEngine';
import { ComponentCard, CardHolder } from '../types';
import { SwipeableFlipCard } from '../components/SwipeableFlipCard';
import { PaginatedSubCardList } from '../components/ui/PaginatedSubCardList';
import { NotFoundView } from '../components/ui/NotFoundView';
import { DashboardPage } from './DashboardPage';

/**
 * Universal dynamic view that resolves and renders any page node in the hierarchy.
 * Invariants:
 * - Each card holder (01-hnc, 02-hnc) is rendered as its own separate Card component.
 * - Each Card component holds its own swipable slides with dedicated slide dots.
 * - If a page has NO cards, NO card deck is rendered.
 * - If a page has child sub-pages, they are listed via PaginatedSubCardList.
 */
export const DynamicPageView: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [deckActiveIndices, setDeckActiveIndices] = useState<Record<string, number>>({});
  const [tick, setTick] = useState(0);

  useEffect(() => {
    const handleUpdate = () => setTick((t) => t + 1);
    window.addEventListener('greendocs:cards-updated', handleUpdate);
    return () => window.removeEventListener('greendocs:cards-updated', handleUpdate);
  }, []);

  // Parse path segments from URL, stripping repository name if present
  const pathSegments = useMemo(() => {
    const rawSegments = location.pathname
      .split('/')
      .filter((seg) => Boolean(seg && seg.trim()) && !['greendocs', 'greenapp'].includes(seg.toLowerCase()));

    return rawSegments.length > 0 &&
      (rawSegments[0].toLowerCase() === 'home' || rawSegments[0].toLowerCase() === 'dashboard')
      ? rawSegments.slice(1)
      : rawSegments;
  }, [location.pathname]);

  // Memoize resolved page node so it does not recreate new references on unneeded renders
  const resolved = useMemo(() => {
    if (pathSegments.length === 0) return null;
    return resolvePathNode(pathSegments);
  }, [pathSegments, tick]);

  const cardHolders = resolved?.node?.cardHolders || [];
  const cards = resolved?.node?.cards || [];

  // Reset indices on route change
  useEffect(() => {
    setDeckActiveIndices({});
  }, [location.pathname]);

  // Sync active card index with URL hash (#card-slug or #order) with strict guard against infinite loops
  useEffect(() => {
    if (!location.hash || cardHolders.length === 0) return;

    const cleanHash = location.hash.replace(/^#/, '').toLowerCase();
    for (const holder of cardHolders) {
      const matchIndex = holder.cards.findIndex(
        (c: ComponentCard) =>
          c.id.toLowerCase() === cleanHash ||
          c.title.toLowerCase().replace(/\s+/g, '-') === cleanHash ||
          c.id.toLowerCase().endsWith(`-${cleanHash}`)
      );
      if (matchIndex !== -1) {
        setDeckActiveIndices((prev) => {
          if (prev[holder.id] === matchIndex) return prev;
          return { ...prev, [holder.id]: matchIndex };
        });
        return;
      }
    }
  }, [location.hash, resolved]);

  // Handle active card change and update URL hash for deep-linking
  const handleDeckIndexChange = (holderId: string, index: number) => {
    setDeckActiveIndices((prev) => {
      if (prev[holderId] === index) return prev;
      return { ...prev, [holderId]: index };
    });
    const holder = cardHolders.find((h: CardHolder) => h.id === holderId);
    if (holder && holder.cards[index]) {
      const cardSlug = holder.cards[index].title.toLowerCase().replace(/\s+/g, '-');
      navigate(`${location.pathname}#${cardSlug}`, { replace: true });
    }
  };

  // If visiting /home with no further segments, render the documentation card list directly
  if (pathSegments.length === 0) {
    return <DashboardPage />;
  }

  // Handle unmatched 404 route
  if (!resolved) {
    return <NotFoundView attemptedPath={location.pathname} />;
  }

  const { node, currentPath } = resolved;
  const hasCardHolders = cardHolders.length > 0;
  const hasCards = cards.length > 0;
  const hasChildren = Boolean(node.children && node.children.length > 0);

  return (
    <div className="w-full max-w-xl mx-auto flex flex-col gap-3 sm:gap-3.5 animate-fadeIn">
      {/* Discrete Card Holders: Each 01-hnc, 02-hnc renders its own independent card deck */}
      {hasCardHolders ? (
        cardHolders.map((holder: CardHolder) => (
          <SwipeableFlipCard
            key={holder.id}
            cards={holder.cards}
            currentIndex={deckActiveIndices[holder.id] || 0}
            onIndexChange={(newIndex) => handleDeckIndexChange(holder.id, newIndex)}
          />
        ))
      ) : hasCards ? (
        <SwipeableFlipCard
          cards={cards}
          currentIndex={deckActiveIndices['default'] || 0}
          onIndexChange={(newIndex) => handleDeckIndexChange('default', newIndex)}
        />
      ) : null}

      {/* Nested Sub-Pages Section: Only rendered if this page has child sub-pages */}
      {hasChildren && node.children && (
        <section className="w-full">
          <PaginatedSubCardList items={node.children} basePath={currentPath} />
        </section>
      )}
    </div>
  );
};
