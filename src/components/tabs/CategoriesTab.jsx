import React, { useState } from 'react';
import * as Icons from 'lucide-react';
import { THEME } from '../../config/theme';
import CategoryRulesManager from '../CategoryRulesManager';
import IconPicker from '../pickers/IconPicker';
import ColorPicker from '../pickers/ColorPicker';

const CategoriesTab = ({
  categories,
  transactions,
  showAddCategory,
  setShowAddCategory,
  newCategoryName,
  setNewCategoryName,
  newCategoryIcon,
  setNewCategoryIcon,
  newCategoryColor,
  setNewCategoryColor,
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
  onRenameCategory,
  onUpdateCustomization
}) => {
  const [editingCategory, setEditingCategory] = useState(null);
  const [editedCategoryName, setEditedCategoryName] = useState('');
  const [editedCategoryIcon, setEditedCategoryIcon] = useState('Tag');
  const [editedCategoryColor, setEditedCategoryColor] = useState('#3b82f6');

  const handleStartEdit = (category) => {
    setEditingCategory(category.name);
    setEditedCategoryName(category.name);
    setEditedCategoryIcon(category.icon);
    setEditedCategoryColor(category.color);
  };

  const handleCancelEdit = () => {
    setEditingCategory(null);
    setEditedCategoryName('');
    setEditedCategoryIcon('Tag');
    setEditedCategoryColor('#3b82f6');
  };

  const handleSaveEdit = () => {
    const hasNameChanged = editedCategoryName.trim() && editedCategoryName !== editingCategory;
    const hasCustomizationChanged = editedCategoryIcon !== categories.find(c => c.name === editingCategory)?.icon ||
                                     editedCategoryColor !== categories.find(c => c.name === editingCategory)?.color;

    if (hasNameChanged) {
      onRenameCategory(editingCategory, editedCategoryName.trim());
    }

    if (hasCustomizationChanged) {
      onUpdateCustomization(editingCategory, editedCategoryIcon, editedCategoryColor);
    }

    handleCancelEdit();
  };
  return (
    <div className="space-y-8">
      {/* Categories Section */}
      <div className="bg-white rounded-2xl shadow-lg p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800">Zarządzanie Kategoriami</h2>
        <button
          onClick={() => setShowAddCategory(!showAddCategory)}
          className="flex items-center gap-2 px-4 py-2 rounded-lg transition-colors font-medium text-white"
          style={{ backgroundColor: THEME.primary }}
          onMouseOver={(e) => e.currentTarget.style.backgroundColor = THEME.primaryHover}
          onMouseOut={(e) => e.currentTarget.style.backgroundColor = THEME.primary}
        >
          <Icons.PlusCircle size={20} />
          Dodaj Kategorię
        </button>
      </div>

      {/* Add Category Form */}
      {showAddCategory && (
        <div className="rounded-xl p-6 mb-6 border-2" style={{ backgroundColor: THEME.primaryLight, borderColor: THEME.primary }}>
          <h3 className="font-semibold text-gray-800 mb-4">Nowa Kategoria</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Nazwa Kategorii</label>
              <input
                type="text"
                value={newCategoryName}
                onChange={(e) => setNewCategoryName(e.target.value)}
                placeholder="np. Zdrowie, Media, Zakupy spożywcze"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:border-transparent"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <IconPicker
                selected={newCategoryIcon}
                onSelect={setNewCategoryIcon}
                color={newCategoryColor}
              />
              <ColorPicker
                selected={newCategoryColor}
                onSelect={setNewCategoryColor}
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
                Utwórz również budżet dla tej kategorii
              </label>
            </div>

            {addBudgetWithCategory && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Miesięczny Limit Budżetu</label>
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
              Zapisz Kategorię
            </button>
            <button
              onClick={() => {
                setShowAddCategory(false);
                setAddBudgetWithCategory(false);
                setNewCategoryLimit('');
              }}
              className="bg-gray-200 hover:bg-gray-300 text-gray-700 px-6 py-2 rounded-lg transition-colors font-medium"
            >
              Anuluj
            </button>
          </div>
        </div>
      )}

      {/* Category List */}
      <div className="space-y-3">
        {categories.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <Icons.Tag size={48} className="mx-auto mb-4 opacity-50" />
            <p className="text-lg">Brak kategorii</p>
            <p className="text-sm">Utwórz kategorie aby uporządkować swoje transakcje</p>
          </div>
        ) : (
          categories.map((category) => {
            const CategoryIcon = Icons[category.icon] || Icons.Tag;
            return (
            <div
              key={category.name}
              className="p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors"
            >
              {editingCategory === category.name ? (
                // Edit mode
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Nazwa Kategorii</label>
                    <input
                      type="text"
                      value={editedCategoryName}
                      onChange={(e) => setEditedCategoryName(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:border-transparent"
                      autoFocus
                      onKeyPress={(e) => {
                        if (e.key === 'Enter') handleSaveEdit();
                        if (e.key === 'Escape') handleCancelEdit();
                      }}
                    />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <IconPicker
                      selected={editedCategoryIcon}
                      onSelect={setEditedCategoryIcon}
                      color={editedCategoryColor}
                    />
                    <ColorPicker
                      selected={editedCategoryColor}
                      onSelect={setEditedCategoryColor}
                    />
                  </div>
                  <div className="flex gap-2 justify-end">
                    <button
                      onClick={handleSaveEdit}
                      className="flex items-center gap-2 px-4 py-2 rounded-lg transition-colors text-white"
                      style={{ backgroundColor: THEME.success }}
                      title="Zapisz zmiany"
                    >
                      <Icons.Save size={18} />
                      Zapisz
                    </button>
                    <button
                      onClick={handleCancelEdit}
                      className="flex items-center gap-2 px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded-lg transition-colors text-gray-700"
                      title="Anuluj"
                    >
                      <Icons.X size={18} />
                      Anuluj
                    </button>
                  </div>
                </div>
              ) : (
                // View mode
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full flex items-center justify-center" style={{ backgroundColor: category.color + '20' }}>
                      <CategoryIcon style={{ color: category.color }} size={20} />
                    </div>
                    <div>
                      <p className="font-semibold text-gray-800 text-lg">{category.name}</p>
                      <p className="text-sm text-gray-600">
                        {transactions.filter(t => t.category === category.name).length} transakcji
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
                      title="Edytuj kategorię"
                    >
                      <Icons.Edit2 size={18} />
                    </button>
                    <button
                      onClick={() => onDeleteCategory(category.name)}
                      className="transition-colors p-2"
                      style={{ color: THEME.danger }}
                      onMouseOver={(e) => e.currentTarget.style.color = THEME.dangerHover}
                      onMouseOut={(e) => e.currentTarget.style.color = THEME.danger}
                      title="Usuń kategorię"
                    >
                      <Icons.Trash2 size={18} />
                    </button>
                  </div>
                </div>
              )}
            </div>
            );
          })
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
