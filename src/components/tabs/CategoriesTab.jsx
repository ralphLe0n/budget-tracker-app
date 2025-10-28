import React, { useState } from 'react';
import { PlusCircle, Tag, Trash2, Edit2, Save, X } from 'lucide-react';
import { THEME } from '../../config/theme';
import CategoryRulesManager from '../CategoryRulesManager';

const CategoriesTab = ({
  categories,
  transactions,
  showAddCategory,
  setShowAddCategory,
  newCategoryName,
  setNewCategoryName,
  addBudgetWithCategory,
  setAddBudgetWithCategory,
  newCategoryLimit,
  setNewCategoryLimit,
  onAddCategory,
  onDeleteCategory,
  categoryRules,
  onAddRule,
  onUpdateRule,
  onDeleteRule,
  onRenameCategory
}) => {
  const [editingCategory, setEditingCategory] = useState(null);
  const [editedCategoryName, setEditedCategoryName] = useState('');

  const handleStartEdit = (category) => {
    setEditingCategory(category);
    setEditedCategoryName(category);
  };

  const handleCancelEdit = () => {
    setEditingCategory(null);
    setEditedCategoryName('');
  };

  const handleSaveEdit = () => {
    if (editedCategoryName.trim() && editedCategoryName !== editingCategory) {
      onRenameCategory(editingCategory, editedCategoryName.trim());
    }
    handleCancelEdit();
  };
  return (
    <div className="space-y-8">
      {/* Categories Section */}
      <div className="bg-white rounded-2xl shadow-lg p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800">Manage Categories</h2>
        <button
          onClick={() => setShowAddCategory(!showAddCategory)}
          className="flex items-center gap-2 px-4 py-2 rounded-lg transition-colors font-medium text-white"
          style={{ backgroundColor: THEME.primary }}
          onMouseOver={(e) => e.currentTarget.style.backgroundColor = THEME.primaryHover}
          onMouseOut={(e) => e.currentTarget.style.backgroundColor = THEME.primary}
        >
          <PlusCircle size={20} />
          Add Category
        </button>
      </div>

      {/* Add Category Form */}
      {showAddCategory && (
        <div className="rounded-xl p-6 mb-6 border-2" style={{ backgroundColor: THEME.primaryLight, borderColor: THEME.primary }}>
          <h3 className="font-semibold text-gray-800 mb-4">New Category</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Category Name</label>
              <input
                type="text"
                value={newCategoryName}
                onChange={(e) => setNewCategoryName(e.target.value)}
                placeholder="e.g., Healthcare, Utilities, Groceries"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:border-transparent"
              />
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="addBudgetCheckbox"
                checked={addBudgetWithCategory}
                onChange={(e) => setAddBudgetWithCategory(e.target.checked)}
                className="w-4 h-4 rounded border-gray-300"
                style={{ accentColor: THEME.primary }}
              />
              <label htmlFor="addBudgetCheckbox" className="text-sm font-medium text-gray-700 cursor-pointer">
                Also create a budget for this category
              </label>
            </div>

            {addBudgetWithCategory && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Monthly Budget Limit</label>
                <input
                  type="number"
                  step="0.01"
                  value={newCategoryLimit}
                  onChange={(e) => setNewCategoryLimit(e.target.value)}
                  placeholder="500.00"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:border-transparent"
                />
              </div>
            )}
          </div>
          <div className="flex gap-3 mt-4">
            <button
              onClick={onAddCategory}
              className="px-6 py-2 rounded-lg transition-colors font-medium text-white"
              style={{ backgroundColor: THEME.primary }}
              onMouseOver={(e) => e.currentTarget.style.backgroundColor = THEME.primaryHover}
              onMouseOut={(e) => e.currentTarget.style.backgroundColor = THEME.primary}
            >
              Save Category
            </button>
            <button
              onClick={() => {
                setShowAddCategory(false);
                setAddBudgetWithCategory(false);
                setNewCategoryLimit('');
              }}
              className="bg-gray-200 hover:bg-gray-300 text-gray-700 px-6 py-2 rounded-lg transition-colors font-medium"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Category List */}
      <div className="space-y-3">
        {categories.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <Tag size={48} className="mx-auto mb-4 opacity-50" />
            <p className="text-lg">No categories yet</p>
            <p className="text-sm">Create categories to organize your transactions</p>
          </div>
        ) : (
          categories.map((category) => (
            <div
              key={category}
              className="p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors"
            >
              {editingCategory === category ? (
                // Edit mode
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full flex items-center justify-center" style={{ backgroundColor: THEME.primaryLight }}>
                    <Tag style={{ color: THEME.primary }} size={20} />
                  </div>
                  <input
                    type="text"
                    value={editedCategoryName}
                    onChange={(e) => setEditedCategoryName(e.target.value)}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:border-transparent"
                    autoFocus
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') handleSaveEdit();
                      if (e.key === 'Escape') handleCancelEdit();
                    }}
                  />
                  <button
                    onClick={handleSaveEdit}
                    className="p-2 rounded-lg transition-colors"
                    style={{ color: THEME.success }}
                    title="Save changes"
                  >
                    <Save size={18} />
                  </button>
                  <button
                    onClick={handleCancelEdit}
                    className="p-2 rounded-lg transition-colors text-gray-600"
                    title="Cancel"
                  >
                    <X size={18} />
                  </button>
                </div>
              ) : (
                // View mode
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full flex items-center justify-center" style={{ backgroundColor: THEME.primaryLight }}>
                      <Tag style={{ color: THEME.primary }} size={20} />
                    </div>
                    <div>
                      <p className="font-semibold text-gray-800 text-lg">{category}</p>
                      <p className="text-sm text-gray-600">
                        {transactions.filter(t => t.category === category).length} transaction(s)
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleStartEdit(category)}
                      className="transition-colors p-2"
                      style={{ color: THEME.primary }}
                      onMouseOver={(e) => e.currentTarget.style.color = THEME.primaryHover}
                      onMouseOut={(e) => e.currentTarget.style.color = THEME.primary}
                      title="Rename category"
                    >
                      <Edit2 size={18} />
                    </button>
                    <button
                      onClick={() => onDeleteCategory(category)}
                      className="transition-colors p-2"
                      style={{ color: THEME.danger }}
                      onMouseOver={(e) => e.currentTarget.style.color = THEME.dangerHover}
                      onMouseOut={(e) => e.currentTarget.style.color = THEME.danger}
                      title="Delete category"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))
        )}
      </div>
      </div>

      {/* Auto-Categorization Rules Section */}
      <div className="bg-white rounded-2xl shadow-lg p-6">
        <CategoryRulesManager
          rules={categoryRules || []}
          categories={categories}
          onAddRule={onAddRule}
          onUpdateRule={onUpdateRule}
          onDeleteRule={onDeleteRule}
        />
      </div>
    </div>
  );
};

export default CategoriesTab;
