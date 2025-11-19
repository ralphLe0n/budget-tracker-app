import { useState, useRef, useCallback } from 'react';

/**
 * Custom hook for detecting swipe gestures on mobile
 *
 * Returns swipe state and handlers for touch events
 *
 * @param {Object} options - Configuration options
 * @param {number} options.threshold - Minimum distance in px to register as swipe (default: 80)
 * @param {number} options.leftSnapPosition - Snap position for right swipe (default: 80)
 * @param {number} options.rightSnapPosition - Snap position for left swipe (default: 80)
 * @param {boolean} options.enabled - Whether gestures are enabled (default: true)
 * @returns {Object} - Swipe state and event handlers
 */
export const useSwipeGesture = ({ threshold = 80, leftSnapPosition = 80, rightSnapPosition = 80, enabled = true } = {}) => {
  const [swipeOffset, setSwipeOffset] = useState(0); // Current swipe offset in pixels
  const [swipeDirection, setSwipeDirection] = useState(null); // 'left' or 'right'
  const touchStartX = useRef(0);
  const touchStartY = useRef(0);
  const currentX = useRef(0);
  const isSwiping = useRef(false);
  const hasMovedVertically = useRef(false);
  const touchStartTime = useRef(0);
  const lastTouchX = useRef(0);
  const lastTouchTime = useRef(0);

  const handleTouchStart = useCallback((e) => {
    if (!enabled) return;

    const touch = e.touches[0];
    touchStartX.current = touch.clientX;
    touchStartY.current = touch.clientY;
    currentX.current = touch.clientX;
    lastTouchX.current = touch.clientX;
    touchStartTime.current = Date.now();
    lastTouchTime.current = Date.now();
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

      // Update velocity tracking
      currentX.current = touch.clientX;
      lastTouchX.current = touch.clientX;
      lastTouchTime.current = Date.now();

      // Apply resistance/damping for more "weight" (0.6 = 60% of finger movement)
      // This makes it feel less sensitive and more substantial
      const dampingFactor = 0.6;
      const dampedOffset = deltaX * dampingFactor;

      setSwipeOffset(dampedOffset);

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
    const touchDuration = Date.now() - touchStartTime.current;

    // Calculate velocity (pixels per millisecond)
    const velocity = touchDuration > 0 ? Math.abs(deltaX) / touchDuration : 0;

    // Fast swipe threshold (pixels per ms) - a quick flick can trigger with less distance
    const fastSwipeVelocity = 0.5;
    const isFastSwipe = velocity > fastSwipeVelocity;

    // Adjust threshold based on velocity (fast swipes need less distance)
    const effectiveThreshold = isFastSwipe ? threshold * 0.6 : threshold;

    // If swiped past threshold or fast swipe, snap to action position
    if (Math.abs(deltaX) > effectiveThreshold && isSwiping.current) {
      // Snap to custom positions based on direction
      if (deltaX > 0) {
        setSwipeOffset(leftSnapPosition); // Right swipe (actions on left)
        setSwipeDirection('right');
      } else {
        setSwipeOffset(-rightSnapPosition); // Left swipe (actions on right)
        setSwipeDirection('left');
      }
    } else {
      // Reset if didn't swipe far enough
      resetSwipe();
    }

    isSwiping.current = false;
    hasMovedVertically.current = false;
  }, [enabled, threshold, leftSnapPosition, rightSnapPosition]);

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
