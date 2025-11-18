import { useState, useRef, useCallback } from 'react';

/**
 * Custom hook for detecting swipe gestures on mobile
 *
 * Returns swipe state and handlers for touch events
 *
 * @param {Object} options - Configuration options
 * @param {number} options.threshold - Minimum distance in px to register as swipe (default: 50)
 * @param {boolean} options.enabled - Whether gestures are enabled (default: true)
 * @returns {Object} - Swipe state and event handlers
 */
export const useSwipeGesture = ({ threshold = 50, enabled = true } = {}) => {
  const [swipeOffset, setSwipeOffset] = useState(0); // Current swipe offset in pixels
  const [swipeDirection, setSwipeDirection] = useState(null); // 'left' or 'right'
  const touchStartX = useRef(0);
  const touchStartY = useRef(0);
  const currentX = useRef(0);
  const isSwiping = useRef(false);
  const hasMovedVertically = useRef(false);

  const handleTouchStart = useCallback((e) => {
    if (!enabled) return;

    const touch = e.touches[0];
    touchStartX.current = touch.clientX;
    touchStartY.current = touch.clientY;
    currentX.current = touch.clientX;
    isSwiping.current = false;
    hasMovedVertically.current = false;
  }, [enabled]);

  const handleTouchMove = useCallback((e) => {
    if (!enabled) return;

    const touch = e.touches[0];
    const deltaX = touch.clientX - touchStartX.current;
    const deltaY = Math.abs(touch.clientY - touchStartY.current);

    // Detect if user is scrolling vertically
    if (!isSwiping.current && deltaY > 10) {
      hasMovedVertically.current = true;
      return;
    }

    // If already scrolling, don't swipe
    if (hasMovedVertically.current) return;

    // Start swiping if horizontal movement is significant
    if (Math.abs(deltaX) > 10) {
      isSwiping.current = true;

      // Prevent vertical scroll while swiping
      e.preventDefault();

      currentX.current = touch.clientX;
      setSwipeOffset(deltaX);

      // Determine direction
      if (deltaX > 0) {
        setSwipeDirection('right');
      } else if (deltaX < 0) {
        setSwipeDirection('left');
      }
    }
  }, [enabled]);

  const handleTouchEnd = useCallback((e) => {
    if (!enabled) return;

    const deltaX = currentX.current - touchStartX.current;

    // If swiped past threshold, snap to action position
    if (Math.abs(deltaX) > threshold && isSwiping.current) {
      // Snap to 80px (action button width)
      if (deltaX > 0) {
        setSwipeOffset(80); // Right swipe (actions on left)
        setSwipeDirection('right');
      } else {
        setSwipeOffset(-80); // Left swipe (actions on right)
        setSwipeDirection('left');
      }
    } else {
      // Reset if didn't swipe far enough
      resetSwipe();
    }

    isSwiping.current = false;
    hasMovedVertically.current = false;
  }, [enabled, threshold]);

  const resetSwipe = useCallback(() => {
    setSwipeOffset(0);
    setSwipeDirection(null);
    isSwiping.current = false;
  }, []);

  return {
    swipeOffset,
    swipeDirection,
    isSwiped: Math.abs(swipeOffset) > threshold,
    handlers: {
      onTouchStart: handleTouchStart,
      onTouchMove: handleTouchMove,
      onTouchEnd: handleTouchEnd,
    },
    resetSwipe,
  };
};

export default useSwipeGesture;
