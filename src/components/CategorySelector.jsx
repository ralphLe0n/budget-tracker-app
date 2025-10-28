import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Plus } from 'lucide-react';
import { THEME } from '../config/theme';

const CategorySelector = ({
  transaction,
  categories,
  onCategoryChange,
  onAddCategory
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [showAddNew, setShowAddNew] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const dropdownRef = useRef(null);

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

  const handleCategorySelect = async (category) => {
    await onCategoryChange(transaction, category);
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
        className="px-2 py-0.5 rounded-full text-xs font-medium hover:opacity-80 transition-opacity cursor-pointer flex items-center gap-1"
        style={{ backgroundColor: THEME.primaryLight, color: THEME.primary }}
        title="Click to change category"
      >
        {transaction.category}
        <ChevronDown size={12} />
      </button>

      {isOpen && (
        <div
          className="absolute z-50 mt-1 bg-white rounded-lg shadow-xl border border-gray-200 py-1 min-w-[200px]"
          style={{ left: 0, top: '100%' }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Category List */}
          <div className="max-h-48 overflow-y-auto">
            {categories.map((category) => (
              <button
                key={category}
                onClick={() => handleCategorySelect(category)}
                className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-100 transition-colors ${
                  transaction.category === category ? 'font-semibold' : ''
                }`}
                style={{
                  backgroundColor: transaction.category === category ? THEME.primaryLight : 'transparent',
                  color: transaction.category === category ? THEME.primary : '#374151'
                }}
              >
                {category}
              </button>
            ))}
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

export default CategorySelector;
