import React from 'react';
import { PlusCircle, DollarSign, Tag, Edit2, Save, X, Trash2, Calendar, Repeat } from 'lucide-react';
import { formatCurrency } from '../../utils/formatters';
import { getCurrentPeriod, formatPeriodText, getFrequencyLabel } from '../../utils/budgetPeriods';
import { THEME } from '../../config/theme';

const BudgetsTab = ({
  budgets,
  categories,
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
  onDeleteBudget
}) => {
  return (
    <div className="bg-white rounded-2xl shadow-lg p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800">Zarządzanie Budżetami</h2>
        <button
          onClick={() => setShowAddBudget(!showAddBudget)}
          className="flex items-center gap-2 px-4 py-2 rounded-lg transition-colors font-medium text-white"
          style={{ backgroundColor: THEME.primary }}
          onMouseOver={(e) => e.currentTarget.style.backgroundColor = THEME.primaryHover}
          onMouseOut={(e) => e.currentTarget.style.backgroundColor = THEME.primary}
        >
          <PlusCircle size={20} />
          Dodaj Budżet
        </button>
      </div>

      {/* Add Budget Form */}
      {showAddBudget && (
        <div className="rounded-xl p-6 mb-6 border-2" style={{ backgroundColor: THEME.primaryLight, borderColor: THEME.primary }}>
          <h3 className="font-semibold text-gray-800 mb-4">Nowy Budżet</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Kategoria</label>
              <select
                value={newCategoryName}
                onChange={(e) => setNewCategoryName(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:border-transparent"
              >
                <option value="">Wybierz Kategorię</option>
                {categories.filter(cat => !budgets.find(b => b.category === cat)).map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Limit Budżetu</label>
              <input
                type="number"
                step="0.01"
                value={newCategoryLimit}
                onChange={(e) => setNewCategoryLimit(e.target.value)}
                placeholder="500.00"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                <Repeat size={16} />
                Powtarzalność
              </label>
              <select
                value={newRecurrenceFrequency}
                onChange={(e) => setNewRecurrenceFrequency(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:border-transparent"
              >
                <option value="daily">Dzienny</option>
                <option value="weekly">Tygodniowy</option>
                <option value="monthly">Miesięczny</option>
                <option value="yearly">Roczny</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                <Calendar size={16} />
                Data Początku Okresu
              </label>
              <input
                type="date"
                value={newPeriodStartDate}
                onChange={(e) => setNewPeriodStartDate(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:border-transparent"
              />
            </div>
          </div>
          <div className="flex gap-3 mt-4">
            <button
              onClick={onAddBudget}
              className="px-6 py-2 rounded-lg transition-colors font-medium text-white"
              style={{ backgroundColor: THEME.primary }}
              onMouseOver={(e) => e.currentTarget.style.backgroundColor = THEME.primaryHover}
              onMouseOut={(e) => e.currentTarget.style.backgroundColor = THEME.primary}
            >
              Zapisz Budżet
            </button>
            <button
              onClick={() => setShowAddBudget(false)}
              className="bg-gray-200 hover:bg-gray-300 text-gray-700 px-6 py-2 rounded-lg transition-colors font-medium"
            >
              Anuluj
            </button>
          </div>
        </div>
      )}

      {/* Budget List */}
      <div className="space-y-3">
        {budgets.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <DollarSign size={48} className="mx-auto mb-4 opacity-50" />
            <p className="text-lg">Brak budżetów</p>
            <p className="text-sm">Ustaw limity wydatków dla swoich kategorii</p>
          </div>
        ) : (
          budgets.map((budget) => (
            <div
              key={budget.id}
              className="p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors"
            >
              {editingCategory === budget.id ? (
                /* Editing Mode */
                <div>
                  <div className="flex items-start gap-4 mb-4">
                    <div className="w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0" style={{ backgroundColor: THEME.primaryLight }}>
                      <Tag style={{ color: THEME.primary }} size={20} />
                    </div>
                    <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">Nazwa Kategorii</label>
                        <input
                          type="text"
                          value={editingCategoryName}
                          onChange={(e) => setEditingCategoryName(e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2"
                          placeholder="Nazwa kategorii"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">Limit Budżetu</label>
                        <input
                          type="number"
                          step="0.01"
                          value={editingCategoryLimit}
                          onChange={(e) => setEditingCategoryLimit(e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2"
                          placeholder="Limit budżetu"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1 flex items-center gap-1">
                          <Repeat size={14} />
                          Powtarzalność
                        </label>
                        <select
                          value={editingRecurrenceFrequency}
                          onChange={(e) => setEditingRecurrenceFrequency(e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2"
                        >
                          <option value="daily">Dzienny</option>
                          <option value="weekly">Tygodniowy</option>
                          <option value="monthly">Miesięczny</option>
                          <option value="yearly">Roczny</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1 flex items-center gap-1">
                          <Calendar size={14} />
                          Data Początku Okresu
                        </label>
                        <input
                          type="date"
                          value={editingPeriodStartDate}
                          onChange={(e) => setEditingPeriodStartDate(e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2"
                        />
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2 justify-end">
                    <button
                      onClick={() => onSaveEdit(budget.id, editingCategoryName, editingCategoryLimit, editingRecurrenceFrequency, editingPeriodStartDate)}
                      className="flex items-center gap-1 px-4 py-2 rounded-lg transition-colors text-sm font-medium text-white"
                      style={{ backgroundColor: THEME.primary }}
                      onMouseOver={(e) => e.currentTarget.style.backgroundColor = THEME.primaryHover}
                      onMouseOut={(e) => e.currentTarget.style.backgroundColor = THEME.primary}
                    >
                      <Save size={16} />
                      Zapisz
                    </button>
                    <button
                      onClick={onCancelEdit}
                      className="flex items-center gap-1 bg-gray-200 hover:bg-gray-300 text-gray-700 px-4 py-2 rounded-lg transition-colors text-sm font-medium"
                    >
                      <X size={16} />
                      Anuluj
                    </button>
                  </div>
                </div>
              ) : (
                /* View Mode */
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4 flex-1">
                    <div className="w-12 h-12 rounded-full flex items-center justify-center" style={{ backgroundColor: THEME.primaryLight }}>
                      <Tag style={{ color: THEME.primary }} size={20} />
                    </div>
                    <div className="flex-1">
                      <p className="font-semibold text-gray-800 text-lg">{budget.category}</p>
                      <p className="text-sm text-gray-600">
                        {formatCurrency(budget.spent)} wydane z {formatCurrency(budget.limit)} budżetu
                      </p>
                      {budget.recurrenceFrequency && budget.periodStartDate && (
                        <p className="text-xs text-gray-500 mt-1 flex items-center gap-1">
                          <Repeat size={12} />
                          {getFrequencyLabel(budget.recurrenceFrequency)} • {formatPeriodText(
                            getCurrentPeriod(budget.periodStartDate, budget.recurrenceFrequency).periodStart,
                            getCurrentPeriod(budget.periodStartDate, budget.recurrenceFrequency).periodEnd,
                            budget.recurrenceFrequency
                          )}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-xl font-bold text-gray-800">
                      {formatCurrency(budget.limit)}
                    </span>
                    <button
                      onClick={() => onStartEditing(budget)}
                      className="transition-colors p-2"
                      style={{ color: THEME.primary }}
                      onMouseOver={(e) => e.currentTarget.style.color = THEME.primaryHover}
                      onMouseOut={(e) => e.currentTarget.style.color = THEME.primary}
                      title="Edytuj kategorię"
                    >
                      <Edit2 size={18} />
                    </button>
                    <button
                      onClick={() => onDeleteBudget(budget.category)}
                      className="transition-colors p-2"
                      style={{ color: THEME.danger }}
                      onMouseOver={(e) => e.currentTarget.style.color = THEME.dangerHover}
                      onMouseOut={(e) => e.currentTarget.style.color = THEME.danger}
                      title="Usuń kategorię"
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
  );
};

export default BudgetsTab;
