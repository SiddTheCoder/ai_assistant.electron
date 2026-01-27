import { useRef, useCallback, type ReactNode } from 'react';
import type { SwipeDirection } from '../types';

interface SwipeContainerProps {
  children: ReactNode;
  activeIndex: number;
  totalItems: number;
  onSwipe: (direction: SwipeDirection) => void;
  className?: string;
}

const SWIPE_THRESHOLD = 50;
const MIN_SWIPE_DISTANCE = 10; // Minimum movement to count as swipe attempt

export function SwipeContainer({
  children,
  activeIndex,
  totalItems,
  onSwipe,
  className = '',
}: SwipeContainerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const isDragging = useRef(false);
  const startX = useRef(0);
  const currentX = useRef(0);
  const hasMoved = useRef(false);

  // Touch handlers
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    startX.current = e.touches[0].clientX;
    currentX.current = e.touches[0].clientX;
    isDragging.current = true;
    hasMoved.current = false;
  }, []);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (!isDragging.current) return;
    currentX.current = e.touches[0].clientX;
    
    if (Math.abs(currentX.current - startX.current) > MIN_SWIPE_DISTANCE) {
      hasMoved.current = true;
    }
  }, []);

  const handleTouchEnd = useCallback(() => {
    if (!isDragging.current || !hasMoved.current) {
      isDragging.current = false;
      return;
    }

    const diff = startX.current - currentX.current;

    if (Math.abs(diff) > SWIPE_THRESHOLD) {
      if (diff > 0 && activeIndex < totalItems - 1) {
        onSwipe('left');
      } else if (diff < 0 && activeIndex > 0) {
        onSwipe('right');
      }
    }

    isDragging.current = false;
    hasMoved.current = false;
  }, [activeIndex, totalItems, onSwipe]);

  // Wheel handler for 2-finger trackpad swipe
  const handleWheel = useCallback((e: React.WheelEvent) => {
    // Horizontal scroll (trackpad 2-finger swipe)
    if (Math.abs(e.deltaX) > Math.abs(e.deltaY) && Math.abs(e.deltaX) > 30) {
      e.preventDefault();
      if (e.deltaX > 0 && activeIndex < totalItems - 1) {
        onSwipe('left');
      } else if (e.deltaX < 0 && activeIndex > 0) {
        onSwipe('right');
      }
    }
  }, [activeIndex, totalItems, onSwipe]);

  return (
    <div
      ref={containerRef}
      className={`relative overflow-hidden ${className}`}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onWheel={handleWheel}
    >
      <div
        className="flex transition-transform duration-300 ease-out h-full"
        style={{ transform: `translateX(-${activeIndex * 100}%)` }}
      >
        {children}
      </div>
    </div>
  );
}
