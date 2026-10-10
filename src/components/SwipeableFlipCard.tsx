import React, { useState, useCallback } from 'react';
import { SwipeableCardDeckProps } from '../types';
import { useSwipeGesture } from '../hooks/useSwipeGesture';
import { ContentCard } from './ContentCard';
import { DEFAULT_SWIPE_THRESHOLD } from '../constants/interaction';

/**
 * Production-ready sliding card deck with touch swipe, mouse drag,
 * keyboard arrow navigation, and fully encapsulated slide indicator dots.
 */
export const SwipeableFlipCard: React.FC<SwipeableCardDeckProps> = ({
  cards,
  currentIndex,
  onIndexChange,
  className = '',
}) => {
  const [inputText, setInputText] = useState<string>('');

  const handleNext = useCallback(() => {
    onIndexChange(currentIndex < cards.length - 1 ? currentIndex + 1 : 0);
  }, [currentIndex, cards.length, onIndexChange]);

  const handlePrev = useCallback(() => {
    onIndexChange(currentIndex > 0 ? currentIndex - 1 : cards.length - 1);
  }, [currentIndex, cards.length, onIndexChange]);

  const { containerRef, handlers, style } = useSwipeGesture({
    onSwipeLeft: handleNext,
    onSwipeRight: handlePrev,
    threshold: DEFAULT_SWIPE_THRESHOLD,
    enabled: cards.length > 1,
  });

  if (!cards || cards.length === 0) {
    return null;
  }

  const currentCard = cards[currentIndex] || cards[0];

  return (
    <div className={`w-full select-none flex flex-col gap-2 sm:gap-2.5 ${className}`}>
      <div className="relative w-full">
        <div
          ref={containerRef}
          {...handlers}
          style={style}
          className="w-full relative touch-pan-y"
          role="region"
          aria-roledescription="carousel slide"
          aria-label={`Card ${currentIndex + 1} of ${cards.length}: ${currentCard.title}`}
        >
          <ContentCard
            card={currentCard}
            inputValue={inputText}
            onInputChange={setInputText}
          />
        </div>
      </div>

      {/* Encapsulated Slide Indicator Dots (rendered when deck contains > 1 card) */}
      {cards.length > 1 && (
        <nav
          aria-label="Card slide pagination"
          className="flex items-center justify-center gap-1.5 pt-0.5"
        >
          {cards.map((card, idx) => (
            <button
              key={`${card.id}-${idx}`}
              type="button"
              onClick={() => onIndexChange(idx)}
              aria-label={`Jump to card ${idx + 1}: ${card.title}`}
              aria-current={currentIndex === idx ? 'true' : undefined}
              className={`h-1.5 rounded-full transition-all duration-200 cursor-pointer ${
                currentIndex === idx
                  ? 'w-6 bg-emerald-400'
                  : 'w-1.5 bg-white/20 hover:bg-white/40'
              }`}
            />
          ))}
        </nav>
      )}
    </div>
  );
};
