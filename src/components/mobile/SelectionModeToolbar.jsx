import React from 'react';
import { Check, X, Edit2 } from 'lucide-react';
import { THEME } from '../../config/theme';

/**
 * Floating toolbar for iOS-style selection mode
 *
 * Appears at bottom of screen when in selection mode
 * Provides: Select All, Bulk Edit, Cancel actions
 */
const SelectionModeToolbar = ({
  selectedCount = 0,
  totalCount = 0,
  onSelectAll,
  onDeselectAll,
  onBulkEdit,
  onCancel,
}) => {
  const allSelected = selectedCount === totalCount && totalCount > 0;

  return (
    <div
      className="fixed bottom-0 left-0 right-0 bg-white border-t-2 shadow-2xl z-50 safe-bottom animate-slide-up"
      style={{ borderColor: THEME.primary }}
    >
      <div className="max-w-4xl mx-auto px-4 py-4">
        {/* Selection Counter */}
        <div className="text-center mb-3">
          <p className="text-sm font-medium text-gray-700">
            {selectedCount === 0 ? (
              'Wybierz transakcje'
            ) : (
              <span style={{ color: THEME.primary }}>
                Wybrano: {selectedCount} z {totalCount}
              </span>
            )}
          </p>
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-3 gap-2">
          {/* Select/Deselect All */}
          <button
            onClick={allSelected ? onDeselectAll : onSelectAll}
            className="flex flex-col items-center justify-center gap-1 py-3 rounded-xl transition-colors touch-manipulation"
            style={{
              backgroundColor: allSelected ? THEME.primaryLight : 'white',
              border: `2px solid ${THEME.primary}`,
              color: THEME.primary,
            }}
          >
            <Check size={20} />
            <span className="text-xs font-medium">
              {allSelected ? 'Odznacz' : 'Zaznacz'}<br />wszystko
            </span>
          </button>

          {/* Bulk Edit */}
          <button
            onClick={onBulkEdit}
            disabled={selectedCount === 0}
            className="flex flex-col items-center justify-center gap-1 py-3 rounded-xl transition-colors touch-manipulation disabled:opacity-40 disabled:cursor-not-allowed"
            style={{
              backgroundColor: selectedCount > 0 ? THEME.primary : '#ccc',
              color: 'white',
            }}
          >
            <Edit2 size={20} />
            <span className="text-xs font-medium">
              Edytuj<br />zbiorczo
            </span>
          </button>

          {/* Cancel */}
          <button
            onClick={onCancel}
            className="flex flex-col items-center justify-center gap-1 py-3 rounded-xl transition-colors touch-manipulation"
            style={{
              backgroundColor: 'white',
              border: '2px solid #6b7280',
              color: '#6b7280',
            }}
          >
            <X size={20} />
            <span className="text-xs font-medium">
              Anuluj
            </span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default SelectionModeToolbar;
