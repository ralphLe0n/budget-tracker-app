import React, { useEffect } from 'react';
import { X } from 'lucide-react';
import { useMobile } from '../../hooks/useMobile';

/**
 * Mobile-optimized modal component
 *
 * Features:
 * - Slides up from bottom on mobile
 * - Full-screen overlay with backdrop
 * - Fixed positioning to avoid scroll issues
 * - Proper keyboard handling
 * - Easy to dismiss (tap overlay or close button)
 *
 * Addresses CRITICAL mobile UX issue: Modal/Dialog Issues on Mobile
 */
const MobileModal = ({
  isOpen,
  onClose,
  title,
  children,
  footer,
  maxHeight = '90vh',
}) => {
  const { isMobile } = useMobile();

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }

    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  // Handle escape key
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center">
      {/* Backdrop Overlay */}
      <div
        className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal Content */}
      <div
        className={`
          relative bg-white shadow-2xl
          ${isMobile ? 'rounded-t-2xl w-full' : 'rounded-xl w-full max-w-lg mx-4'}
          transform transition-all duration-300 ease-out
          ${isOpen ? 'translate-y-0 opacity-100' : 'translate-y-full opacity-0'}
        `}
        style={{ maxHeight }}
      >
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 rounded-t-2xl px-4 sm:px-6 py-4 flex items-center justify-between z-10">
          <h3 className="text-lg sm:text-xl font-bold text-gray-800">{title}</h3>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-gray-100 transition-colors touch-manipulation"
            aria-label="Close modal"
          >
            <X size={24} className="text-gray-600" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="overflow-y-auto px-4 sm:px-6 py-4" style={{ maxHeight: `calc(${maxHeight} - 140px)` }}>
          {children}
        </div>

        {/* Footer (if provided) */}
        {footer && (
          <div className="sticky bottom-0 bg-white border-t border-gray-200 px-4 sm:px-6 py-4 rounded-b-2xl">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
};

export default MobileModal;
