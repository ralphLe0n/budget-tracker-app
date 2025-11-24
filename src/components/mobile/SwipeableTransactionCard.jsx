import React, { useState, useEffect } from 'react';
import { Edit2, ArrowLeftRight, Trash2, Calendar, CreditCard } from 'lucide-react';
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
  // Debt payment link info
  debtPaymentLink = null, // { debt_id, debt_name, amount_paid, principal_paid, interest_paid }
}) => {
  const { isMobile, iconSize, iconSizeSmall } = useMobile();
  const [showEditModal, setShowEditModal] = useState(false);

  // Calculate dynamic widths for action buttons
  const leftActionsWidth = transaction.category !== 'Transfer' ? 160 : 88; // Two buttons or one
  const rightActionsWidth = 100;

  // Swipe gesture (disabled in selection mode)
  const {
    swipeOffset,
    swipeDirection,
    isSwiped,
    handlers: swipeHandlers,
    resetSwipe,
  } = useSwipeGesture({
    threshold: 80,
    leftSnapPosition: leftActionsWidth,
    rightSnapPosition: rightActionsWidth,
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
      // onConvertToTransfer will show a modal to select destination account
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
            transform: `translateX(${Math.min(Math.max(swipeOffset - leftActionsWidth, -leftActionsWidth), 0)}px)`,
            transition: isSwiped ? 'none' : 'transform 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)',
            pointerEvents: swipeOffset > 70 ? 'auto' : 'none', // Only clickable when revealed
            zIndex: 0,
          }}
        >
          {/* Edit Button */}
          <button
            onClick={handleEdit}
            className="px-4 rounded-lg flex items-center justify-center touch-manipulation active:scale-95"
            style={{
              backgroundColor: THEME.primary,
              height: '100%',
              minHeight: '60px',
              minWidth: '60px'
            }}
          >
            <Edit2 size={iconSize} color="white" />
          </button>

          {/* Convert to Transfer Button (only if not already a transfer) */}
          {transaction.category !== 'Transfer' && (
            <button
              onClick={handleConvert}
              className="px-4 rounded-lg flex items-center justify-center touch-manipulation active:scale-95"
              style={{
                backgroundColor: THEME.warning,
                height: '100%',
                minHeight: '60px',
                minWidth: '60px'
              }}
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
            transform: `translateX(${Math.max(Math.min(swipeOffset + rightActionsWidth, rightActionsWidth), 0)}px)`,
            transition: isSwiped ? 'none' : 'transform 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)',
            pointerEvents: swipeOffset < -70 ? 'auto' : 'none', // Only clickable when revealed
            zIndex: 0,
          }}
        >
          {/* Delete Button */}
          <button
            onClick={handleDelete}
            className="px-6 rounded-lg flex items-center justify-center touch-manipulation active:scale-95"
            style={{
              backgroundColor: THEME.danger,
              height: '100%',
              minHeight: '60px',
              minWidth: '80px'
            }}
          >
            <Trash2 size={iconSize} color="white" />
          </button>
        </div>
      )}

      {/* Main Card Content - Scaled to 358px width (from 392px) */}
      <div
        className={`relative bg-gray-50 transition-colors ${
          isSelected ? 'bg-blue-50 border-2 border-blue-300' : 'hover:bg-gray-100 border-2 border-transparent'
        } ${showHint ? 'animate-swipe-hint' : ''}`}
        style={{
          width: '358px',
          height: '132px',
          borderRadius: '12px',
          marginBottom: '16px',
          boxShadow: '0px 1px 3px rgba(0, 0, 0, 0.1)',
          transform: isMobile && !isSelectionMode ? `translateX(${swipeOffset}px)` : 'none',
          transition: isSwiped ? 'none' : 'transform 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)',
          zIndex: 10,
          position: 'relative',
        }}
        {...combinedTouchHandlers}
      >
        {/* Selection Mode Checkbox (Mobile Only) */}
        {isMobile && isSelectionMode && (
          <div className="absolute left-3 top-1/2 -translate-y-1/2 z-20">
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
          <div className="absolute top-2 right-2 md:top-3 md:right-3 flex gap-1 z-20">
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

        {/* Transaction Name - Scaled from 18x16x268x105 */}
        <div
          className="absolute font-semibold text-gray-800 truncate"
          style={{
            left: '16px',
            top: '15px',
            right: '245px',
            bottom: '96px',
            fontSize: '16px',
          }}
        >
          {transaction.description}
        </div>

        {/* Date - Scaled from 309x20x20x109 */}
        <div
          className="absolute text-gray-600 text-right"
          style={{
            left: '282px',
            top: '18px',
            right: '18px',
            bottom: '100px',
            fontSize: '12px',
          }}
        >
          {transaction.date}
        </div>

        {/* Commentary - Scaled from 18x52x110x53 */}
        <div
          className="absolute text-gray-600 overflow-hidden"
          style={{
            left: '16px',
            top: '47px',
            right: '100px',
            bottom: '48px',
            fontSize: '14px',
            lineHeight: '20px',
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
          }}
        >
          {/* Commentary text - could be additional transaction info */}
          {transaction.notes || ''}
        </div>

        {/* Categories Card - Scaled from 18x108x325x13 */}
        <div
          className="absolute"
          style={{
            left: '16px',
            top: '99px',
            right: '297px',
            bottom: '12px',
          }}
        >
          {transaction.category && (
            <span
              className="inline-block font-medium whitespace-nowrap bg-gray-300 text-gray-700 px-3 py-1 rounded-full text-xs"
            >
              {transaction.category}
            </span>
          )}
        </div>

        {/* Amount - Scaled from 256x108x20x13 */}
        <div
          className="absolute font-bold text-right"
          style={{
            left: '234px',
            top: '99px',
            right: '18px',
            bottom: '12px',
            fontSize: '16px',
            color: transaction.amount > 0 ? THEME.success : THEME.danger,
          }}
        >
          {formatCurrency(transaction.amount)}
        </div>
      </div>
    </div>
  );
};

export default SwipeableTransactionCard;
