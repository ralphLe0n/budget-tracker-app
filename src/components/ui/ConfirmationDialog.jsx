import React from 'react';
import { THEME } from '../../config/theme';

const ConfirmationDialog = ({
  show,
  type,
  name,
  onConfirm,
  onCancel,
  isLoading
}) => {
  if (!show) return null;

  const getMessage = () => {
    switch (type) {
      case 'transaction':
        return 'This action cannot be undone.';
      case 'category':
        return 'This will also delete the associated budget.';
      case 'category-only':
        return 'This category will be removed.';
      case 'account':
        return 'This account and its balance information will be deleted.';
      case 'recurring':
        return 'This will stop future automatic transactions.';
      default:
        return '';
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6">
        <h3 className="text-xl font-bold text-gray-800 mb-4">Confirm Delete</h3>
        <p className="text-gray-600 mb-6">
          Are you sure you want to delete {type} "{name}"?
          {getMessage() && ` ${getMessage()}`}
        </p>
        <div className="flex gap-3 justify-end">
          <button
            onClick={onCancel}
            className="px-4 py-2 rounded-lg bg-gray-200 hover:bg-gray-300 text-gray-700 font-medium transition-colors"
            disabled={isLoading}
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="px-4 py-2 rounded-lg font-medium text-white transition-colors disabled:opacity-50"
            style={{ backgroundColor: THEME.danger }}
            onMouseOver={(e) => !isLoading && (e.currentTarget.style.backgroundColor = THEME.dangerHover)}
            onMouseOut={(e) => e.currentTarget.style.backgroundColor = THEME.danger}
            disabled={isLoading}
          >
            {isLoading ? 'Deleting...' : 'Delete'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmationDialog;
