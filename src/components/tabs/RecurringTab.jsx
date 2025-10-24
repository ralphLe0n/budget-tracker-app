import React from 'react';
import { PlusCircle, Calendar, Trash2, Edit2, Save, X } from 'lucide-react';
import { THEME } from '../../config/theme';
import { formatCurrency } from '../../utils/formatters';

const RecurringTab = ({
  recurringRules,
  accounts,
  categories,
  showAddRecurring,
  setShowAddRecurring,
  newRecurring,
  setNewRecurring,
  handleAddRecurring,
  handleToggleRecurring,
  calculateNextOccurrence,
  generateTransactionsFromRules,
  setDeleteConfirm,
  editingRecurring,
  editingRecurringData,
  setEditingRecurringData,
  handleStartEditRecurring,
  handleCancelEditRecurring,
  handleSaveEditRecurring
}) => {
  return (
    <div className="bg-white rounded-2xl shadow-lg p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Recurring Transactions</h2>
          <p className="text-gray-600 text-sm mt-1">Set up automatic recurring transactions</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={generateTransactionsFromRules}
            className="flex items-center gap-2 px-4 py-2 rounded-lg transition-colors font-medium text-white"
            style={{ backgroundColor: THEME.success }}
            onMouseOver={(e) => e.currentTarget.style.backgroundColor = THEME.successHover}
            onMouseOut={(e) => e.currentTarget.style.backgroundColor = THEME.success}
            title="Generate all pending transactions from active rules"
          >
            <Calendar size={20} />
            Generate Now
          </button>
          <button
            onClick={() => setShowAddRecurring(!showAddRecurring)}
            className="flex items-center gap-2 px-4 py-2 rounded-lg transition-colors font-medium text-white"
            style={{ backgroundColor: THEME.primary }}
            onMouseOver={(e) => e.currentTarget.style.backgroundColor = THEME.primaryHover}
            onMouseOut={(e) => e.currentTarget.style.backgroundColor = THEME.primary}
          >
            <PlusCircle size={20} />
            Add Rule
          </button>
        </div>
      </div>

      {/* Info Box */}
      <div className="rounded-lg p-4 mb-6" style={{ backgroundColor: THEME.primaryLight, borderColor: THEME.primary, border: '1px solid' }}>
        <p className="text-sm text-gray-700">
          <strong>💡 How it works:</strong> Create rules for recurring income or expenses (salary, subscriptions, rent, etc.).
          Click <strong>"Generate Now"</strong> to create all pending transactions based on your active rules.
          The app tracks the last generated date to avoid duplicates.
        </p>
      </div>

      {/* Add Recurring Rule Form */}
      {showAddRecurring && (
        <div className="rounded-xl p-6 mb-6 border-2" style={{ backgroundColor: THEME.primaryLight, borderColor: THEME.primary }}>
          <h3 className="font-semibold text-gray-800 mb-4">New Recurring Rule</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
              <input
                type="text"
                value={newRecurring.description}
                onChange={(e) => setNewRecurring({ ...newRecurring, description: e.target.value })}
                placeholder="Monthly rent, salary, etc."
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Account *</label>
              <select
                value={newRecurring.account_id}
                onChange={(e) => setNewRecurring({ ...newRecurring, account_id: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:border-transparent"
                required
              >
                <option value="">Select Account</option>
                {accounts.map((account) => (
                  <option key={account.id} value={account.id}>
                    {account.name} ({formatCurrency(account.balance)})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
              <select
                value={newRecurring.category}
                onChange={(e) => setNewRecurring({ ...newRecurring, category: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:border-transparent"
              >
                {categories.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Amount (negative for expenses)
              </label>
              <input
                type="number"
                step="0.01"
                value={newRecurring.amount}
                onChange={(e) => setNewRecurring({ ...newRecurring, amount: e.target.value })}
                placeholder="-50.00 or 3000.00"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Frequency</label>
              <select
                value={newRecurring.frequency}
                onChange={(e) => setNewRecurring({ ...newRecurring, frequency: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:border-transparent"
              >
                <option value="weekly">Weekly</option>
                <option value="monthly">Monthly</option>
                <option value="yearly">Yearly</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {newRecurring.frequency === 'monthly' || newRecurring.frequency === 'yearly' ? 'Day of Month' : 'Start Date'}
              </label>
              {newRecurring.frequency === 'monthly' || newRecurring.frequency === 'yearly' ? (
                <input
                  type="number"
                  min="1"
                  max="31"
                  value={newRecurring.dayOfMonth}
                  onChange={(e) => setNewRecurring({ ...newRecurring, dayOfMonth: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:border-transparent"
                />
              ) : (
                <input
                  type="date"
                  value={newRecurring.startDate}
                  onChange={(e) => setNewRecurring({ ...newRecurring, startDate: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:border-transparent"
                />
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Start Date</label>
              <input
                type="date"
                value={newRecurring.startDate}
                onChange={(e) => setNewRecurring({ ...newRecurring, startDate: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:border-transparent"
              />
            </div>
          </div>
          <div className="flex gap-3 mt-4">
            <button
              onClick={handleAddRecurring}
              className="px-6 py-2 rounded-lg transition-colors font-medium text-white"
              style={{ backgroundColor: THEME.primary }}
              onMouseOver={(e) => e.currentTarget.style.backgroundColor = THEME.primaryHover}
              onMouseOut={(e) => e.currentTarget.style.backgroundColor = THEME.primary}
            >
              Save Rule
            </button>
            <button
              onClick={() => setShowAddRecurring(false)}
              className="bg-gray-200 hover:bg-gray-300 text-gray-700 px-6 py-2 rounded-lg transition-colors font-medium"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Recurring Rules List */}
      <div className="space-y-3">
        {recurringRules.map((rule) => (
          <div
            key={rule.id}
            className={`rounded-xl transition-colors ${
              editingRecurring === rule.id ? 'border-2 p-4' : `p-4 ${rule.active ? 'bg-gray-50 hover:bg-gray-100' : 'bg-gray-200 opacity-60'}`
            }`}
            style={editingRecurring === rule.id ? { backgroundColor: THEME.primaryLight, borderColor: THEME.primary } : {}}
          >
            {editingRecurring === rule.id ? (
              /* Edit Form */
              <div>
                <h3 className="font-semibold text-gray-800 mb-4">Edit Recurring Rule</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                    <input
                      type="text"
                      value={editingRecurringData.description}
                      onChange={(e) => setEditingRecurringData({ ...editingRecurringData, description: e.target.value })}
                      placeholder="Monthly rent, salary, etc."
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Account *</label>
                    <select
                      value={editingRecurringData.account_id}
                      onChange={(e) => setEditingRecurringData({ ...editingRecurringData, account_id: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:border-transparent"
                      required
                    >
                      <option value="">Select Account</option>
                      {accounts.map((account) => (
                        <option key={account.id} value={account.id}>
                          {account.name} ({formatCurrency(account.balance)})
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
                    <select
                      value={editingRecurringData.category}
                      onChange={(e) => setEditingRecurringData({ ...editingRecurringData, category: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:border-transparent"
                    >
                      {categories.map((cat) => (
                        <option key={cat} value={cat}>
                          {cat}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Amount (negative for expenses)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={editingRecurringData.amount}
                      onChange={(e) => setEditingRecurringData({ ...editingRecurringData, amount: e.target.value })}
                      placeholder="-50.00 or 3000.00"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Frequency</label>
                    <select
                      value={editingRecurringData.frequency}
                      onChange={(e) => setEditingRecurringData({ ...editingRecurringData, frequency: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:border-transparent"
                    >
                      <option value="weekly">Weekly</option>
                      <option value="monthly">Monthly</option>
                      <option value="yearly">Yearly</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {editingRecurringData.frequency === 'monthly' || editingRecurringData.frequency === 'yearly' ? 'Day of Month' : 'Start Date'}
                    </label>
                    {editingRecurringData.frequency === 'monthly' || editingRecurringData.frequency === 'yearly' ? (
                      <input
                        type="number"
                        min="1"
                        max="31"
                        value={editingRecurringData.dayOfMonth}
                        onChange={(e) => setEditingRecurringData({ ...editingRecurringData, dayOfMonth: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:border-transparent"
                      />
                    ) : (
                      <input
                        type="date"
                        value={editingRecurringData.startDate}
                        onChange={(e) => setEditingRecurringData({ ...editingRecurringData, startDate: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:border-transparent"
                      />
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Start Date</label>
                    <input
                      type="date"
                      value={editingRecurringData.startDate}
                      onChange={(e) => setEditingRecurringData({ ...editingRecurringData, startDate: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:border-transparent"
                    />
                  </div>
                </div>
                <div className="flex gap-3 mt-4">
                  <button
                    onClick={handleSaveEditRecurring}
                    className="flex items-center gap-2 px-6 py-2 rounded-lg transition-colors font-medium text-white"
                    style={{ backgroundColor: THEME.success }}
                    onMouseOver={(e) => e.currentTarget.style.backgroundColor = THEME.successHover}
                    onMouseOut={(e) => e.currentTarget.style.backgroundColor = THEME.success}
                  >
                    <Save size={18} />
                    Save Changes
                  </button>
                  <button
                    onClick={handleCancelEditRecurring}
                    className="flex items-center gap-2 bg-gray-200 hover:bg-gray-300 text-gray-700 px-6 py-2 rounded-lg transition-colors font-medium"
                  >
                    <X size={18} />
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              /* Display Mode */
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4 flex-1">
                  <div
                    className="w-12 h-12 rounded-full flex items-center justify-center"
                    style={{ backgroundColor: rule.amount > 0 ? THEME.successLight : THEME.dangerLight }}
                  >
                    <Calendar style={{ color: rule.amount > 0 ? THEME.success : THEME.danger }} size={20} />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <p className="font-semibold text-gray-800 text-lg">{rule.description}</p>
                      {!rule.active && (
                        <span className="px-2 py-0.5 bg-gray-400 text-white rounded-full text-xs font-medium">
                          Paused
                        </span>
                      )}
                    </div>
                    <div className="flex gap-4 text-sm text-gray-600 mt-1">
                      <span className="px-2 py-0.5 rounded-full text-xs font-medium" style={{ backgroundColor: THEME.primaryLight, color: THEME.primary }}>
                        {rule.category}
                      </span>
                      <span className="capitalize">{rule.frequency}</span>
                      {rule.frequency !== 'weekly' && <span>Day {rule.dayOfMonth}</span>}
                      <span>Next: {calculateNextOccurrence(rule)}</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span
                    className="text-xl font-bold"
                    style={{ color: rule.amount > 0 ? THEME.success : THEME.danger }}
                  >
                    {formatCurrency(rule.amount)}
                  </span>
                  <button
                    onClick={() => handleStartEditRecurring(rule)}
                    className="transition-colors p-2"
                    style={{ color: THEME.primary }}
                    onMouseOver={(e) => e.currentTarget.style.color = THEME.primaryHover}
                    onMouseOut={(e) => e.currentTarget.style.color = THEME.primary}
                    title="Edit"
                  >
                    <Edit2 size={18} />
                  </button>
                  <button
                    onClick={() => handleToggleRecurring(rule.id)}
                    className="px-3 py-1 rounded-lg text-sm font-medium transition-colors"
                    style={{
                      backgroundColor: rule.active ? '#fef3c7' : THEME.successLight,
                      color: rule.active ? '#92400e' : THEME.success
                    }}
                  >
                    {rule.active ? 'Pause' : 'Resume'}
                  </button>
                  <button
                    onClick={() => setDeleteConfirm({ show: true, type: 'recurring', id: rule.id, name: rule.description })}
                    className="transition-colors p-2"
                    style={{ color: THEME.danger }}
                    onMouseOver={(e) => e.currentTarget.style.color = THEME.dangerHover}
                    onMouseOut={(e) => e.currentTarget.style.color = THEME.danger}
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {recurringRules.length === 0 && (
        <div className="text-center py-12 text-gray-500">
          <Calendar size={48} className="mx-auto mb-4 opacity-50" />
          <p className="text-lg">No recurring rules yet</p>
          <p className="text-sm">Create a rule to automatically generate transactions</p>
        </div>
      )}
    </div>
  );
};

export default RecurringTab;
