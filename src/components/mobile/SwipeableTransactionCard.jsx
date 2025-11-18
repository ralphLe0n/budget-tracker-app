import React, { useState, useEffect } from 'react';
import { Edit2, ArrowLeftRight, Trash2, Calendar } from 'lucide-react';
import { THEME } from '../../config/theme';
import { formatCurrency } from '../../utils/formatters';
import { useMobile } from '../../hooks/useMobile';
import { useSwipeGesture } from '../../hooks/useSwipeGesture';
import { useLongPress } from '../../hooks/useLongPress';
import CategoryIconSelector from '../CategoryIconSelector';

/**
 * Swipeable Transaction Card with mobile gestures
 *
 * Features:
 * - Swipe right (→): Reveals Edit + Convert actions on LEFT
 * - Swipe left (←): Reveals Delete action on RIGHT
 * - Long press: Enters selection mode
 * - Desktop: Shows traditional action buttons
 */
const SwipeableTransactionCard = ({
  transaction,
  categories,
  onCategoryChange,
  onAddCategory,
  onEdit,
  onDelete,
  onConvertToTransfer,
  // Selection mode props
  isSelectionMode = false,
  isSelected = false,
  onSelect,
  onLongPress,
  // Hint animation
  showHint = false,
}) => {
  const { isMobile, iconSize, iconSizeSmall } = useMobile();
  const [showEditModal, setShowEditModal] = useState(false);

  // Swipe gesture (disabled in selection mode)
  const {
    swipeOffset,
    swipeDirection,
    isSwiped,
    handlers: swipeHandlers,
    resetSwipe,
  } = useSwipeGesture({
    threshold: 50,
    enabled: isMobile && !isSelectionMode,
  });

  // Long press gesture (only on mobile)
  const longPressHandlers = useLongPress(
    () => {
      if (onLongPress && isMobile && !isSelectionMode) {
        onLongPress(transaction.id);
      }
    },
    {
      delay: 500,
      enabled: isMobile && !isSelectionMode,
    }
  );

  // Hint animation effect
  useEffect(() => {
    if (showHint && !isSelectionMode) {
      // Auto-swipe hint animation
      const timer = setTimeout(() => {
        resetSwipe();
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [showHint, isSelectionMode, resetSwipe]);

  // Handle action clicks
  const handleEdit = () => {
    resetSwipe();
    onEdit(transaction);
  };

  const handleDelete = () => {
    resetSwipe();
    onDelete(transaction.id, transaction.description);
  };

  const handleConvert = () => {
    resetSwipe();
    if (onConvertToTransfer) {
      onConvertToTransfer(transaction.id);
    }
  };

  // Combine touch handlers
  const combinedTouchHandlers = isMobile && !isSelectionMode
    ? {
        ...swipeHandlers,
        onTouchStart: (e) => {
          swipeHandlers.onTouchStart(e);
          longPressHandlers.onTouchStart(e);
        },
        onTouchEnd: (e) => {
          swipeHandlers.onTouchEnd(e);
          longPressHandlers.onTouchEnd(e);
        },
        onTouchMove: (e) => {
          swipeHandlers.onTouchMove(e);
          longPressHandlers.onTouchMove(e);
        },
      }
    : {};

  return (
    <div className="relative overflow-hidden">
      {/* Left Actions (Swipe Right → to reveal) */}
      {isMobile && !isSelectionMode && (
        <div
          className="absolute left-0 top-0 bottom-0 flex items-center gap-2 pl-2"
          style={{
            transform: `translateX(${Math.min(Math.max(swipeOffset - 80, -80), 0)}px)`,
            transition: isSwiped ? 'none' : 'transform 0.3s ease-out',
          }}
        >
          {/* Edit Button */}
          <button
            onClick={handleEdit}
            className="h-full px-4 rounded-lg flex items-center justify-center touch-manipulation"
            style={{ backgroundColor: THEME.primary }}
          >
            <Edit2 size={iconSize} color="white" />
          </button>

          {/* Convert to Transfer Button (only if not already a transfer) */}
          {transaction.category !== 'Transfer' && (
            <button
              onClick={handleConvert}
              className="h-full px-4 rounded-lg flex items-center justify-center touch-manipulation"
              style={{ backgroundColor: THEME.warning }}
            >
              <ArrowLeftRight size={iconSize} color="white" />
            </button>
          )}
        </div>
      )}

      {/* Right Actions (Swipe Left ← to reveal) */}
      {isMobile && !isSelectionMode && (
        <div
          className="absolute right-0 top-0 bottom-0 flex items-center pr-2"
          style={{
            transform: `translateX(${Math.max(Math.min(swipeOffset + 80, 80), 0)}px)`,
            transition: isSwiped ? 'none' : 'transform 0.3s ease-out',
          }}
        >
          {/* Delete Button */}
          <button
            onClick={handleDelete}
            className="h-full px-6 rounded-lg flex items-center justify-center touch-manipulation"
            style={{ backgroundColor: THEME.danger }}
          >
            <Trash2 size={iconSize} color="white" />
          </button>
        </div>
      )}

      {/* Main Card Content */}
      <div
        className={`relative bg-gray-50 rounded-xl transition-colors p-4 pb-3 ${
          isSelected ? 'bg-blue-50 border-2 border-blue-300' : 'hover:bg-gray-100 border-2 border-transparent'
        } ${showHint ? 'animate-swipe-hint' : ''}`}
        style={{
          transform: isMobile && !isSelectionMode ? `translateX(${swipeOffset}px)` : 'none',
          transition: isSwiped ? 'none' : 'transform 0.3s ease-out',
        }}
        {...combinedTouchHandlers}
      >
        {/* Selection Mode Checkbox (Mobile Only) */}
        {isMobile && isSelectionMode && (
          <div className="absolute left-3 top-1/2 -translate-y-1/2 z-10">
            <input
              type="checkbox"
              checked={isSelected}
              onChange={() => onSelect(transaction.id)}
              className="w-6 h-6 cursor-pointer touch-manipulation"
            />
          </div>
        )}

        {/* Desktop Action Buttons (Visible on desktop only) */}
        {!isMobile && (
          <div className="absolute top-2 right-2 md:top-3 md:right-3 flex gap-1 z-10">
            <button
              onClick={handleEdit}
              className="transition-colors p-2 hover:bg-blue-100 rounded-lg touch-manipulation"
              style={{ color: THEME.primary }}
              title="Edytuj"
            >
              <Edit2 size={iconSize} />
            </button>
            {transaction.category !== 'Transfer' && (
              <button
                onClick={handleConvert}
                className="transition-colors p-2 hover:bg-yellow-100 rounded-lg touch-manipulation"
                style={{ color: THEME.warning }}
                title="Konwertuj na Przelew"
              >
                <ArrowLeftRight size={iconSize} />
              </button>
            )}
            <button
              onClick={handleDelete}
              className="transition-colors p-2 hover:bg-red-100 rounded-lg touch-manipulation"
              style={{ color: THEME.danger }}
              title="Usuń"
            >
              <Trash2 size={iconSize} />
            </button>
          </div>
        )}

        {/* Row 1: Icon + Description */}
        <div
          className={`flex items-start gap-2 md:gap-3 mb-3 ${
            isSelectionMode ? 'pl-10' : 'pr-14 md:pr-24'
          }`}
        >
          <div className="flex-shrink-0 pt-1">
            <CategoryIconSelector
              transaction={transaction}
              categories={categories}
              onCategoryChange={onCategoryChange}
              onAddCategory={onAddCategory}
            />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-gray-800 text-sm md:text-base leading-tight break-words">
              {transaction.description}
            </p>
          </div>
        </div>

        {/* Row 2: Amount */}
        <div className={`mb-2 ${isSelectionMode ? 'pl-10' : 'pr-14 md:pr-24'}`}>
          <span
            className="text-2xl md:text-xl font-bold block"
            style={{ color: transaction.amount > 0 ? THEME.success : THEME.danger }}
          >
            {formatCurrency(transaction.amount)}
          </span>
        </div>

        {/* Row 3: Date and Category Badge */}
        <div className={`flex items-center gap-2 md:gap-3 flex-wrap ${isSelectionMode ? 'pl-10' : 'pr-14 md:pr-24'}`}>
          <span className="flex items-center gap-1 text-xs text-gray-600">
            <Calendar size={iconSizeSmall} />
            <span>{transaction.date}</span>
          </span>
          <span
            className="text-xs font-medium px-2 py-1 rounded-full whitespace-nowrap"
            style={{
              backgroundColor: transaction.amount > 0 ? THEME.successLight : THEME.dangerLight,
              color: transaction.amount > 0 ? THEME.success : THEME.danger,
            }}
          >
            {transaction.amount > 0 ? 'Przychód' : 'Wydatek'}
          </span>
        </div>
      </div>
    </div>
  );
};

export default SwipeableTransactionCard;
