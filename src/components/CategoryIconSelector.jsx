import React, { useState, useRef, useEffect } from 'react';
import * as Icons from 'lucide-react';
import { Plus } from 'lucide-react';
import { THEME } from '../config/theme';
import { getCategoryIcon, getCategoryColor } from '../utils/categoryHelpers';

const CategoryIconSelector = ({
  transaction,
  categories,
  onCategoryChange,
  onAddCategory
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [showAddNew, setShowAddNew] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const dropdownRef = useRef(null);

  const categoryIcon = getCategoryIcon(categories, transaction.category);
  const categoryColor = getCategoryColor(categories, transaction.category);
  const CategoryIcon = Icons[categoryIcon] || Icons.Tag;
  const isIncome = transaction.amount > 0;

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
        setShowAddNew(false);
        setNewCategoryName('');
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const handleCategorySelect = async (categoryName) => {
    await onCategoryChange(transaction, categoryName);
    setIsOpen(false);
  };

  const handleAddNewCategory = async () => {
    if (newCategoryName.trim()) {
      await onAddCategory(newCategoryName.trim());
      await onCategoryChange(transaction, newCategoryName.trim());
      setNewCategoryName('');
      setShowAddNew(false);
      setIsOpen(false);
    }
  };

  return (
    <div className="relative inline-block" ref={dropdownRef}>
      <button
        onClick={(e) => {
          e.stopPropagation();
          setIsOpen(!isOpen);
        }}
        className="relative w-12 h-12 rounded-full flex items-center justify-center cursor-pointer transition-all hover:scale-110 hover:shadow-lg"
        style={{ backgroundColor: categoryColor + '20' }}
        title={`Category: ${transaction.category} - Click to change`}
      >
        {/* Category Icon */}
        <CategoryIcon style={{ color: categoryColor }} size={20} />

        {/* Type Indicator Dot */}
        <div
          className="absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-white"
          style={{ backgroundColor: isIncome ? THEME.success : THEME.danger }}
          title={isIncome ? 'Income' : 'Expense'}
        />
      </button>

      {isOpen && (
        <div
          className="absolute z-50 mt-1 bg-white rounded-lg shadow-xl border border-gray-200 py-1 min-w-[200px]"
          style={{ left: 0, top: '100%' }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Category List */}
          <div className="max-h-48 overflow-y-auto">
            {categories.map((category) => {
              const Icon = Icons[category.icon] || Icons.Tag;
              return (
                <button
                  key={category.name}
                  onClick={() => handleCategorySelect(category.name)}
                  className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-100 transition-colors flex items-center gap-3 ${
                    transaction.category === category.name ? 'font-semibold' : ''
                  }`}
                  style={{
                    backgroundColor: transaction.category === category.name ? THEME.primaryLight : 'transparent',
                    color: transaction.category === category.name ? THEME.primary : '#374151'
                  }}
                >
                  <div
                    className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
                    style={{ backgroundColor: category.color + '20' }}
                  >
                    <Icon style={{ color: category.color }} size={16} />
                  </div>
                  {category.name}
                </button>
              );
            })}
          </div>

          {/* Add New Category Section */}
          {!showAddNew ? (
            <button
              onClick={() => setShowAddNew(true)}
              className="w-full text-left px-4 py-2 text-sm border-t border-gray-200 hover:bg-gray-100 transition-colors flex items-center gap-2"
              style={{ color: THEME.primary }}
            >
              <Plus size={14} />
              Add New Category
            </button>
          ) : (
            <div className="border-t border-gray-200 p-2">
              <input
                type="text"
                value={newCategoryName}
                onChange={(e) => setNewCategoryName(e.target.value)}
                placeholder="New category name"
                className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:border-transparent mb-2"
                autoFocus
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    handleAddNewCategory();
                  } else if (e.key === 'Escape') {
                    setShowAddNew(false);
                    setNewCategoryName('');
                  }
                }}
                onClick={(e) => e.stopPropagation()}
              />
              <div className="flex gap-2">
                <button
                  onClick={handleAddNewCategory}
                  disabled={!newCategoryName.trim()}
                  className="flex-1 px-2 py-1 text-xs rounded font-medium text-white disabled:opacity-50 disabled:cursor-not-allowed"
                  style={{ backgroundColor: THEME.primary }}
                >
                  Add
                </button>
                <button
                  onClick={() => {
                    setShowAddNew(false);
                    setNewCategoryName('');
                  }}
                  className="flex-1 px-2 py-1 text-xs rounded font-medium bg-gray-200 hover:bg-gray-300"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default CategoryIconSelector;
