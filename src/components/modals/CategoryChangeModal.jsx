import React, { useState } from 'react';
import * as Icons from 'lucide-react';
import { Plus, X } from 'lucide-react';
import { THEME } from '../../config/theme';

const CategoryChangeModal = ({
  isOpen,
  onClose,
  transaction,
  categories,
  onCategoryChange,
  onAddCategory
}) => {
  const [showAddNew, setShowAddNew] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');

  if (!isOpen) return null;

  const handleCategorySelect = async (categoryName) => {
    await onCategoryChange(transaction, categoryName);
    onClose();
  };

  const handleAddNewCategory = async () => {
    if (newCategoryName.trim()) {
      await onAddCategory(newCategoryName.trim());
      await onCategoryChange(transaction, newCategoryName.trim());
      setNewCategoryName('');
      setShowAddNew(false);
      onClose();
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[80vh] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h3 className="text-xl font-bold text-gray-800">Change Category</h3>
            <p className="text-sm text-gray-500 mt-1">{transaction.description}</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            title="Close"
          >
            <X size={24} className="text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(80vh-140px)]">
          {!showAddNew ? (
            <>
              {/* Category Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-4">
                {categories.map((category) => {
                  const Icon = Icons[category.icon] || Icons.Tag;
                  const isSelected = transaction.category === category.name;

                  return (
                    <button
                      key={category.name}
                      onClick={() => handleCategorySelect(category.name)}
                      className={`flex flex-col items-center gap-3 p-4 rounded-xl transition-all ${
                        isSelected
                          ? 'shadow-lg scale-105'
                          : 'hover:shadow-md hover:scale-102'
                      }`}
                      style={{
                        backgroundColor: isSelected ? THEME.primaryLight : '#f9fafb',
                        border: isSelected ? `2px solid ${THEME.primary}` : '2px solid transparent'
                      }}
                    >
                      <div
                        className="w-14 h-14 rounded-full flex items-center justify-center"
                        style={{ backgroundColor: category.color + '20' }}
                      >
                        <Icon style={{ color: category.color }} size={28} />
                      </div>
                      <span
                        className={`text-sm font-medium text-center ${
                          isSelected ? 'font-bold' : ''
                        }`}
                        style={{ color: isSelected ? THEME.primary : '#374151' }}
                      >
                        {category.name}
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* Add New Category Button */}
              <button
                onClick={() => setShowAddNew(true)}
                className="w-full flex items-center justify-center gap-2 p-4 rounded-xl border-2 border-dashed border-gray-300 hover:border-gray-400 hover:bg-gray-50 transition-all"
              >
                <Plus size={20} style={{ color: THEME.primary }} />
                <span className="font-medium" style={{ color: THEME.primary }}>
                  Add New Category
                </span>
              </button>
            </>
          ) : (
            /* Add New Category Form */
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Category Name
                </label>
                <input
                  type="text"
                  value={newCategoryName}
                  onChange={(e) => setNewCategoryName(e.target.value)}
                  placeholder="Enter category name..."
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:border-transparent text-base"
                  style={{ focusRingColor: THEME.primary }}
                  autoFocus
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      handleAddNewCategory();
                    }
                  }}
                />
              </div>
              <div className="flex gap-3">
                <button
                  onClick={handleAddNewCategory}
                  disabled={!newCategoryName.trim()}
                  className="flex-1 px-6 py-3 rounded-lg font-medium text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  style={{ backgroundColor: THEME.primary }}
                >
                  Add Category
                </button>
                <button
                  onClick={() => {
                    setShowAddNew(false);
                    setNewCategoryName('');
                  }}
                  className="flex-1 px-6 py-3 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg font-medium transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CategoryChangeModal;
