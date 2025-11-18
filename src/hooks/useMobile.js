import { useState, useEffect } from 'react';

/**
 * Custom hook to detect mobile devices and screen orientations
 * Critical for implementing mobile-specific UX improvements
 */
export const useMobile = () => {
  const [isMobile, setIsMobile] = useState(false);
  const [isLandscape, setIsLandscape] = useState(false);
  const [screenWidth, setScreenWidth] = useState(typeof window !== 'undefined' ? window.innerWidth : 0);

  useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth;
      setScreenWidth(width);

      // Mobile breakpoint: < 768px (Tailwind md breakpoint)
      setIsMobile(width < 768);

      // Landscape mode: width > height and still mobile size
      setIsLandscape(
        window.innerWidth > window.innerHeight &&
        window.innerWidth < 1024
      );
    };

    // Initial check
    handleResize();

    // Add event listener
    window.addEventListener('resize', handleResize);
    window.addEventListener('orientationchange', handleResize);

    // Cleanup
    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('orientationchange', handleResize);
    };
  }, []);

  return {
    isMobile,
    isLandscape,
    screenWidth,
    // Helper for icon sizes (WCAG 44x44px minimum for touch targets)
    iconSize: isMobile ? 24 : 20,
    // Helper for small icons (still mobile-friendly)
    iconSizeSmall: isMobile ? 20 : 16,
  };
};

/**
 * Get responsive chart height based on device
 */
export const getChartHeight = (isMobile, isLandscape) => {
  if (isLandscape) return 200; // Shorter in landscape
  if (isMobile) return 250; // Optimized for mobile portrait
  return 300; // Desktop
};

/**
 * Get responsive chart configuration
 */
export const getMobileChartConfig = (isMobile) => ({
  // Hide labels on mobile pie charts to reduce clutter
  showPieLabels: !isMobile,
  // Smaller outer radius for mobile pie charts
  pieOuterRadius: isMobile ? 70 : 100,
  // Adjust font sizes
  axisFontSize: isMobile ? 10 : 12,
  // Reduce dot size on line charts
  lineDotRadius: isMobile ? 3 : 4,
  // Stroke width for better visibility on mobile
  lineStrokeWidth: isMobile ? 2 : 2,
});
