import { useCallback, useRef } from 'react';

/**
 * Custom hook for detecting long press (hold) gestures
 *
 * iOS-style long press for entering selection mode
 *
 * @param {Function} onLongPress - Callback when long press is detected
 * @param {Object} options - Configuration options
 * @param {number} options.delay - How long to hold in ms (default: 500)
 * @param {boolean} options.enabled - Whether long press is enabled (default: true)
 * @returns {Object} - Event handlers
 */
export const useLongPress = (
  onLongPress,
  { delay = 500, enabled = true } = {}
) => {
  const timeout = useRef(null);
  const target = useRef(null);

  const start = useCallback(
    (event) => {
      if (!enabled || !onLongPress) return;

      target.current = event.target;

      timeout.current = setTimeout(() => {
        onLongPress(event);
      }, delay);
    },
    [onLongPress, delay, enabled]
  );

  const clear = useCallback(() => {
    if (timeout.current) {
      clearTimeout(timeout.current);
      timeout.current = null;
    }
  }, []);

  return {
    onTouchStart: start,
    onTouchEnd: clear,
    onTouchMove: clear, // Cancel if user starts moving
    onMouseDown: start,
    onMouseUp: clear,
    onMouseLeave: clear,
  };
};

export default useLongPress;
