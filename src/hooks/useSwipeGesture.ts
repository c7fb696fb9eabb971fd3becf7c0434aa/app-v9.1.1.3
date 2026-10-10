import { useState, useRef, useCallback, useEffect } from 'react';
import { DEFAULT_SWIPE_THRESHOLD, DEFAULT_DRAG_RESISTANCE } from '../constants/interaction';

export interface UseSwipeGestureOptions {
  /** Callback fired when swiped left (or ArrowRight key pressed) */
  onSwipeLeft?: () => void;
  /** Callback fired when swiped right (or ArrowLeft key pressed) */
  onSwipeRight?: () => void;
  /** Minimum pixel threshold before triggering a swipe action. Default: 55 */
  threshold?: number;
  /** Maximum pixel drag resistance dampening factor. Default: 0.45 */
  maxDragResistance?: number;
  /** Whether keyboard arrow navigation is enabled. Default: true */
  enableKeyboardNavigation?: boolean;
  /** Whether swipe gestures are enabled. Default: true */
  enabled?: boolean;
}

export interface UseSwipeGestureReturn {
  /** Current horizontal drag offset in pixels */
  dragOffset: number;
  /** Whether the user is actively dragging the element */
  isDragging: boolean;
  /** Ref to attach to the swipable DOM container */
  containerRef: React.RefObject<HTMLDivElement | null>;
  /** Touch and mouse event handlers to bind to the container */
  handlers: {
    onTouchStart: (e: React.TouchEvent) => void;
    onTouchMove: (e: React.TouchEvent) => void;
    onTouchEnd: () => void;
    onTouchCancel: () => void;
    onMouseDown: (e: React.MouseEvent) => void;
    onMouseMove: (e: React.MouseEvent) => void;
    onMouseUp: () => void;
    onMouseLeave: () => void;
  };
  /** Dynamic transform and cursor style object */
  style: React.CSSProperties;
}

/**
 * Custom hook for high-performance, touch- and mouse-driven horizontal swipe gestures.
 * Provides smooth inertia dampening, touch-pan-y isolation, and keyboard accessibility.
 */
export function useSwipeGesture({
  onSwipeLeft,
  onSwipeRight,
  threshold = DEFAULT_SWIPE_THRESHOLD,
  maxDragResistance = DEFAULT_DRAG_RESISTANCE,
  enableKeyboardNavigation = true,
  enabled = true,
}: UseSwipeGestureOptions = {}): UseSwipeGestureReturn {
  const [dragOffset, setDragOffset] = useState<number>(0);
  const [isDragging, setIsDragging] = useState<boolean>(false);

  const containerRef = useRef<HTMLDivElement | null>(null);
  const touchStartX = useRef<number>(0);
  const touchStartY = useRef<number>(0);
  const currentDragOffset = useRef<number>(0);

  const handleDragStart = (clientX: number, clientY: number) => {
    if (!enabled) return;
    touchStartX.current = clientX;
    touchStartY.current = clientY;
    setIsDragging(true);
    currentDragOffset.current = 0;
  };

  const handleDragMove = (clientX: number, clientY: number) => {
    if (!isDragging) return;
    const diffX = clientX - touchStartX.current;
    const diffY = clientY - touchStartY.current;

    // Prioritize horizontal movement and allow natural vertical scrolling
    if (Math.abs(diffX) > Math.abs(diffY)) {
      const resistance = Math.abs(diffX) > 120 ? maxDragResistance : 0.85;
      const computedOffset = diffX * resistance;
      setDragOffset(computedOffset);
      currentDragOffset.current = computedOffset;
    }
  };

  const handleDragEnd = useCallback(() => {
    if (!isDragging) return;
    setIsDragging(false);

    if (currentDragOffset.current < -threshold) {
      onSwipeLeft?.();
    } else if (currentDragOffset.current > threshold) {
      onSwipeRight?.();
    }

    setDragOffset(0);
    currentDragOffset.current = 0;
  }, [isDragging, threshold, onSwipeLeft, onSwipeRight]);

  // Touch Handlers
  const onTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length !== 1) return;
    handleDragStart(e.touches[0].clientX, e.touches[0].clientY);
  };

  const onTouchMove = (e: React.TouchEvent) => {
    if (e.touches.length !== 1) return;
    handleDragMove(e.touches[0].clientX, e.touches[0].clientY);
  };

  // Mouse Handlers
  const onMouseDown = (e: React.MouseEvent) => {
    if (e.button !== 0) return; // Only primary mouse button
    handleDragStart(e.clientX, e.clientY);
  };

  const onMouseMove = (e: React.MouseEvent) => {
    handleDragMove(e.clientX, e.clientY);
  };

  // Keyboard navigation fallback (ArrowLeft / ArrowRight)
  useEffect(() => {
    if (!enableKeyboardNavigation || !enabled) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger swipe if user is typing in an input or textarea
      const target = e.target as HTMLElement | null;
      if (target?.tagName === 'INPUT' || target?.tagName === 'TEXTAREA' || target?.isContentEditable) {
        return;
      }

      if (e.key === 'ArrowRight') {
        onSwipeLeft?.();
      } else if (e.key === 'ArrowLeft') {
        onSwipeRight?.();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [enableKeyboardNavigation, enabled, onSwipeLeft, onSwipeRight]);

  const style: React.CSSProperties = {
    transform: dragOffset !== 0 ? `translateX(${dragOffset}px) rotate(${dragOffset * 0.04}deg)` : undefined,
    transition: isDragging ? 'none' : 'transform 0.35s cubic-bezier(0.16, 1, 0.3, 1)',
    cursor: enabled ? (isDragging ? 'grabbing' : 'grab') : 'default',
  };

  return {
    dragOffset,
    isDragging,
    containerRef,
    handlers: {
      onTouchStart,
      onTouchMove,
      onTouchEnd: handleDragEnd,
      onTouchCancel: handleDragEnd,
      onMouseDown,
      onMouseMove,
      onMouseUp: handleDragEnd,
      onMouseLeave: handleDragEnd,
    },
    style,
  };
}
