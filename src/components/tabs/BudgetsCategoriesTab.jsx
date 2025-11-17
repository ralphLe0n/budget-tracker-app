import React, { useState } from 'react';
import { DollarSign, Tag } from 'lucide-react';
import { THEME } from '../../config/theme';
import BudgetsTab from './BudgetsTab';
import CategoriesTab from './CategoriesTab';

const BudgetsCategoriesTab = ({
  // Budgets props
  budgets,
  showAddBudget,
  setShowAddBudget,
  newCategoryName,
  setNewCategoryName,
  newCategoryLimit,
  setNewCategoryLimit,
  newRecurrenceFrequency,
  setNewRecurrenceFrequency,
  newPeriodStartDate,
  setNewPeriodStartDate,
  editingCategory,
  editingCategoryName,
  setEditingCategoryName,
  editingCategoryLimit,
  setEditingCategoryLimit,
  editingRecurrenceFrequency,
  setEditingRecurrenceFrequency,
  editingPeriodStartDate,
  setEditingPeriodStartDate,
  onAddBudget,
  onStartEditing,
  onSaveEdit,
  onCancelEdit,
  onDeleteBudget,
  // Categories props
  categories,
  transactions,
  showAddCategory,
  setShowAddCategory,
  newCategoryIcon,
  setNewCategoryIcon,
  newCategoryColor,
  setNewCategoryColor,
  addBudgetWithCategory,
  setAddBudgetWithCategory,
  onAddCategory,
  onDeleteCategory,
  onRenameCategory,
  onUpdateCustomization,
  categoryRules,
  onAddRule,
  onUpdateRule,
  onDeleteRule
}) => {
  const [activeView, setActiveView] = useState('budgets'); // 'budgets' or 'categories'

  return (
    <div>
      {/* Tab Switcher */}
      <div className="bg-white rounded-2xl shadow-lg p-2 mb-6">
        <div className="flex gap-2">
          <button
            onClick={() => setActiveView('budgets')}
            className={`flex-1 flex items-center justify-center gap-2 px-6 py-3 rounded-lg transition-all font-medium ${
              activeView === 'budgets'
                ? 'text-white shadow-md'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
            style={{
              backgroundColor: activeView === 'budgets' ? THEME.primary : 'transparent'
            }}
          >
            <DollarSign size={20} />
            <span>Budżety</span>
          </button>
          <button
            onClick={() => setActiveView('categories')}
            className={`flex-1 flex items-center justify-center gap-2 px-6 py-3 rounded-lg transition-all font-medium ${
              activeView === 'categories'
                ? 'text-white shadow-md'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
            style={{
              backgroundColor: activeView === 'categories' ? THEME.primary : 'transparent'
            }}
          >
            <Tag size={20} />
            <span>Kategorie</span>
          </button>
        </div>
      </div>

      {/* Content */}
      {activeView === 'budgets' ? (
        <BudgetsTab
          budgets={budgets}
          categories={categories}
          showAddBudget={showAddBudget}
          setShowAddBudget={setShowAddBudget}
          newCategoryName={newCategoryName}
          setNewCategoryName={setNewCategoryName}
          newCategoryLimit={newCategoryLimit}
          setNewCategoryLimit={setNewCategoryLimit}
          newRecurrenceFrequency={newRecurrenceFrequency}
          setNewRecurrenceFrequency={setNewRecurrenceFrequency}
          newPeriodStartDate={newPeriodStartDate}
          setNewPeriodStartDate={setNewPeriodStartDate}
          editingCategory={editingCategory}
          editingCategoryName={editingCategoryName}
          setEditingCategoryName={setEditingCategoryName}
          editingCategoryLimit={editingCategoryLimit}
          setEditingCategoryLimit={setEditingCategoryLimit}
          editingRecurrenceFrequency={editingRecurrenceFrequency}
          setEditingRecurrenceFrequency={setEditingRecurrenceFrequency}
          editingPeriodStartDate={editingPeriodStartDate}
          setEditingPeriodStartDate={setEditingPeriodStartDate}
          onAddBudget={onAddBudget}
          onStartEditing={onStartEditing}
          onSaveEdit={onSaveEdit}
          onCancelEdit={onCancelEdit}
          onDeleteBudget={onDeleteBudget}
        />
      ) : (
        <CategoriesTab
          categories={categories}
          transactions={transactions}
          showAddCategory={showAddCategory}
          setShowAddCategory={setShowAddCategory}
          newCategoryName={newCategoryName}
          setNewCategoryName={setNewCategoryName}
          newCategoryIcon={newCategoryIcon}
          setNewCategoryIcon={setNewCategoryIcon}
          newCategoryColor={newCategoryColor}
          setNewCategoryColor={setNewCategoryColor}
          addBudgetWithCategory={addBudgetWithCategory}
          setAddBudgetWithCategory={setAddBudgetWithCategory}
          newCategoryLimit={newCategoryLimit}
          setNewCategoryLimit={setNewCategoryLimit}
          onAddCategory={onAddCategory}
          onDeleteCategory={onDeleteCategory}
          onRenameCategory={onRenameCategory}
          onUpdateCustomization={onUpdateCustomization}
          categoryRules={categoryRules}
          onAddRule={onAddRule}
          onUpdateRule={onUpdateRule}
          onDeleteRule={onDeleteRule}
        />
      )}
    </div>
  );
};

export default BudgetsCategoriesTab;
