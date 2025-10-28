import React, { useState } from 'react';
import { TrendingUp, TrendingDown, Calendar, Trash2, Filter, ChevronDown, ChevronUp, Upload, PlusCircle, Edit2, Check, X, ArrowLeftRight } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, BarChart, Bar } from 'recharts';
import { THEME } from '../../config/theme';
import { formatCurrency } from '../../utils/formatters';
import CategorySelector from '../CategorySelector';

const TransactionsTab = ({
  filteredTransactions,
  hasActiveFilters,
  showFilters,
  setShowFilters,
  clearFilters,
  filterStartDate,
  setFilterStartDate,
  filterEndDate,
  setFilterEndDate,
  filterDescription,
  setFilterDescription,
  selectedCategories,
  setSelectedCategories,
  categories,
  toggleCategoryFilter,
  setDeleteConfirm,
  onCategoryChange,
  onAddCategory,
  categorySpendingData,
  monthlyData,
  budgets,
  spendingByCategory,
  setShowCSVImport,
  accounts,
  showAddTransaction,
  setShowAddTransaction,
  newTransaction,
  setNewTransaction,
  handleAddTransaction,
  onUpdateTransaction,
  onConvertToTransfer,
  onBulkUpdate
}) => {
  const COLORS = THEME.chartColors;
  const [chartsExpanded, setChartsExpanded] = useState(true);
  const [budgetExpanded, setBudgetExpanded] = useState(true);
  const [transactionsExpanded, setTransactionsExpanded] = useState(true);
  const [editingDescriptionId, setEditingDescriptionId] = useState(null);
  const [editingDescription, setEditingDescription] = useState('');
  const [selectedTransactions, setSelectedTransactions] = useState(new Set());
  const [showBulkEdit, setShowBulkEdit] = useState(false);
  const [showConvertTransfer, setShowConvertTransfer] = useState(false);
  const [convertingTransactionId, setConvertingTransactionId] = useState(null);
  const [bulkEditData, setBulkEditData] = useState({ category: '', date: '', description: '' });

  const handleStartEditDescription = (transaction) => {
    setEditingDescriptionId(transaction.id);
    setEditingDescription(transaction.description);
  };

  const handleSaveDescription = async (transactionId) => {
    if (editingDescription.trim()) {
      await onUpdateTransaction(transactionId, { description: editingDescription });
      setEditingDescriptionId(null);
      setEditingDescription('');
    }
  };

  const handleCancelEditDescription = () => {
    setEditingDescriptionId(null);
    setEditingDescription('');
  };

  const toggleSelectTransaction = (id) => {
    const newSelected = new Set(selectedTransactions);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedTransactions(newSelected);
  };

  const toggleSelectAll = () => {
    if (selectedTransactions.size === filteredTransactions.length) {
      setSelectedTransactions(new Set());
    } else {
      setSelectedTransactions(new Set(filteredTransactions.map(t => t.id)));
    }
  };

  const handleBulkEditSubmit = async () => {
    const updates = {};
    if (bulkEditData.category) updates.category = bulkEditData.category;
    if (bulkEditData.date) updates.date = bulkEditData.date;
    if (bulkEditData.description) updates.description = bulkEditData.description;

    if (Object.keys(updates).length > 0) {
      await onBulkUpdate(Array.from(selectedTransactions), updates);
      setSelectedTransactions(new Set());
      setShowBulkEdit(false);
      setBulkEditData({ category: '', date: '', description: '' });
    }
  };

  return (
    <>
      {/* Page Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800">Transactions & Analytics</h1>
        <p className="text-gray-600 mt-2">Comprehensive view of your financial data</p>
      </div>

      {/* Charts Section */}
      <div className="bg-white rounded-2xl shadow-lg p-6 mb-8">
        <button
          onClick={() => setChartsExpanded(!chartsExpanded)}
          className="w-full flex justify-between items-center mb-4"
        >
          <h2 className="text-2xl font-bold text-gray-800">
            Charts & Trends {hasActiveFilters && <span className="text-sm text-gray-500">(Filtered)</span>}
          </h2>
          {chartsExpanded ? <ChevronUp size={24} /> : <ChevronDown size={24} />}
        </button>

        {chartsExpanded && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Pie Chart */}
            <div>
              <h3 className="text-lg font-semibold text-gray-700 mb-4">Spending by Category</h3>
              {categorySpendingData.length > 0 ? (
                <div>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={categorySpendingData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                        outerRadius={100}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {categorySpendingData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value) => formatCurrency(value)} />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="mt-4 grid grid-cols-2 gap-2">
                    {categorySpendingData.map((item, index) => (
                      <div key={item.name} className="flex items-center gap-2">
                        <div
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: COLORS[index % COLORS.length] }}
                        ></div>
                        <span className="text-sm text-gray-700">{item.name}: {formatCurrency(item.value)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="h-[300px] flex items-center justify-center text-gray-500">
                  <p>No expense data to display</p>
                </div>
              )}
            </div>

            {/* Line Chart */}
            <div>
              <h3 className="text-lg font-semibold text-gray-700 mb-4">Monthly Trends</h3>
              {monthlyData.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={monthlyData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis
                      dataKey="month"
                      tick={{ fontSize: 12 }}
                      angle={-45}
                      textAnchor="end"
                      height={60}
                    />
                    <YAxis tick={{ fontSize: 12 }} />
                    <Tooltip
                      formatter={(value) => formatCurrency(value)}
                      labelFormatter={(label) => `Month: ${label}`}
                    />
                    <Legend />
                    <Line
                      type="monotone"
                      dataKey="income"
                      stroke={THEME.success}
                      strokeWidth={2}
                      name="Income"
                      dot={{ r: 4 }}
                    />
                    <Line
                      type="monotone"
                      dataKey="expenses"
                      stroke={THEME.danger}
                      strokeWidth={2}
                      name="Expenses"
                      dot={{ r: 4 }}
                    />
                    <Line
                      type="monotone"
                      dataKey="balance"
                      stroke={THEME.primary}
                      strokeWidth={2}
                      name="Balance"
                      dot={{ r: 4 }}
                    />
                    <Line
                      type="monotone"
                      dataKey="savings"
                      stroke="#10b981"
                      strokeWidth={2}
                      name="Savings"
                      dot={{ r: 4 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-[300px] flex items-center justify-center text-gray-500">
                  <p>No data to display</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Budget vs Actual Section */}
      <div className="bg-white rounded-2xl shadow-lg p-6 mb-8">
        <button
          onClick={() => setBudgetExpanded(!budgetExpanded)}
          className="w-full flex justify-between items-center mb-4"
        >
          <h2 className="text-2xl font-bold text-gray-800">
            Budget vs Actual {hasActiveFilters && <span className="text-sm text-gray-500">(Filtered)</span>}
          </h2>
          {budgetExpanded ? <ChevronUp size={24} /> : <ChevronDown size={24} />}
        </button>

        {budgetExpanded && (
          categorySpendingData.length > 0 ? (
            <ResponsiveContainer width="100%" height={400}>
              <BarChart
                data={budgets
                  .filter(budget => selectedCategories.length === 0 || selectedCategories.includes(budget.category))
                  .map(budget => {
                    const actualSpent = spendingByCategory[budget.category] || 0;
                    const remaining = budget.limit - actualSpent;
                    return {
                      category: budget.category,
                      spent: actualSpent,
                      remaining: remaining > 0 ? remaining : 0,
                      overspent: remaining < 0 ? Math.abs(remaining) : 0
                    };
                  })}
                layout="vertical"
                barSize={30}
                barGap={8}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" />
                <YAxis dataKey="category" type="category" width={100} />
                <Tooltip formatter={(value) => formatCurrency(value)} />
                <Legend />
                <Bar dataKey="spent" stackId="a" fill={THEME.primary} name="Spent" />
                <Bar dataKey="remaining" stackId="a" fill={THEME.success} name="Remaining" radius={[0, 8, 8, 0]} />
                <Bar dataKey="overspent" stackId="a" fill={THEME.danger} name="Over Budget" radius={[0, 8, 8, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[400px] flex items-center justify-center text-gray-500">
              <p>No budget data to display</p>
            </div>
          )
        )}
      </div>

      {/* Filters Section */}
      <div className="bg-white rounded-2xl shadow-lg p-6 mb-8">
        <div className="flex justify-between items-center mb-4">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="flex-1 flex justify-between items-center"
          >
            <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
              <Filter size={20} />
              Filters
              {hasActiveFilters && (
                <span className="ml-2 px-2 py-0.5 rounded-full text-xs text-white" style={{ backgroundColor: THEME.primary }}>
                  Active
                </span>
              )}
            </h3>
            {showFilters ? <ChevronUp size={24} /> : <ChevronDown size={24} />}
          </button>
          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              className="ml-4 text-sm font-medium hover:opacity-80"
              style={{ color: THEME.danger }}
            >
              Clear All
            </button>
          )}
        </div>

        {showFilters && (
          <div>
            {/* Quick Date Range Buttons */}
            <div className="mb-4">
              <h4 className="font-semibold text-gray-700 mb-3">Quick Filters</h4>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => {
                    const today = new Date();
                    const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
                    setFilterStartDate(firstDay.toISOString().split('T')[0]);
                    setFilterEndDate(today.toISOString().split('T')[0]);
                  }}
                  className="px-3 py-1 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-sm font-medium transition-colors"
                >
                  This Month
                </button>
                <button
                  onClick={() => {
                    const today = new Date();
                    const firstDay = new Date(today.getFullYear(), today.getMonth() - 1, 1);
                    const lastDay = new Date(today.getFullYear(), today.getMonth(), 0);
                    setFilterStartDate(firstDay.toISOString().split('T')[0]);
                    setFilterEndDate(lastDay.toISOString().split('T')[0]);
                  }}
                  className="px-3 py-1 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-sm font-medium transition-colors"
                >
                  Last Month
                </button>
                <button
                  onClick={() => {
                    const today = new Date();
                    const threeMonthsAgo = new Date(today.getFullYear(), today.getMonth() - 3, today.getDate());
                    setFilterStartDate(threeMonthsAgo.toISOString().split('T')[0]);
                    setFilterEndDate(today.toISOString().split('T')[0]);
                  }}
                  className="px-3 py-1 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-sm font-medium transition-colors"
                >
                  Last 3 Months
                </button>
                <button
                  onClick={() => {
                    const today = new Date();
                    const firstDay = new Date(today.getFullYear(), 0, 1);
                    setFilterStartDate(firstDay.toISOString().split('T')[0]);
                    setFilterEndDate(today.toISOString().split('T')[0]);
                  }}
                  className="px-3 py-1 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-sm font-medium transition-colors"
                >
                  This Year
                </button>
              </div>
            </div>

            {/* Date Range Filter */}
            <div className="mb-6">
              <h4 className="font-semibold text-gray-700 mb-3">Date Range</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-2">Start Date</label>
                  <input
                    type="date"
                    value={filterStartDate}
                    onChange={(e) => setFilterStartDate(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-2">End Date</label>
                  <input
                    type="date"
                    value={filterEndDate}
                    onChange={(e) => setFilterEndDate(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:border-transparent"
                  />
                </div>
              </div>
            </div>

            {/* Description Filter */}
            <div className="mb-6">
              <h4 className="font-semibold text-gray-700 mb-3">Search by Description</h4>
              <input
                type="text"
                value={filterDescription}
                onChange={(e) => setFilterDescription(e.target.value)}
                placeholder="Search transactions..."
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:border-transparent"
              />
            </div>

            {/* Category Filter */}
            <div>
              <div className="flex justify-between items-center mb-3">
                <h4 className="font-semibold text-gray-700">Categories</h4>
                <div className="flex gap-2">
                  <button
                    onClick={() => setSelectedCategories([...categories])}
                    className="text-xs font-medium hover:opacity-80"
                    style={{ color: THEME.primary }}
                  >
                    Select All
                  </button>
                  <button
                    onClick={() => setSelectedCategories([])}
                    className="text-xs text-gray-600 hover:text-gray-700 font-medium"
                  >
                    Clear All
                  </button>
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                {categories.map((category) => (
                  <button
                    key={category}
                    onClick={() => toggleCategoryFilter(category)}
                    style={{
                      backgroundColor: selectedCategories.includes(category) ? THEME.primary : '#f3f4f6',
                      color: selectedCategories.includes(category) ? 'white' : '#374151'
                    }}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                      selectedCategories.includes(category) ? 'shadow-md' : 'hover:bg-gray-200'
                    }`}
                  >
                    {category}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Active Filters Display */}
        {hasActiveFilters && !showFilters && (
          <div className="mt-4 flex flex-wrap gap-2">
            {filterStartDate && (
              <span className="px-3 py-1 rounded-full text-sm" style={{ backgroundColor: THEME.primaryLight, color: THEME.primary }}>
                From: {filterStartDate}
              </span>
            )}
            {filterEndDate && (
              <span className="px-3 py-1 rounded-full text-sm" style={{ backgroundColor: THEME.primaryLight, color: THEME.primary }}>
                To: {filterEndDate}
              </span>
            )}
            {selectedCategories.map((cat) => (
              <span key={cat} className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-sm">
                {cat}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Transactions List */}
      <div className="bg-white rounded-2xl shadow-lg p-6">
        <button
          onClick={() => setTransactionsExpanded(!transactionsExpanded)}
          className="w-full flex justify-between items-center mb-4"
        >
          <h2 className="text-2xl font-bold text-gray-800">
            All Transactions
            <span className="ml-3 text-sm text-gray-500 font-normal">
              ({filteredTransactions.length} total)
            </span>
          </h2>
          {transactionsExpanded ? <ChevronUp size={24} /> : <ChevronDown size={24} />}
        </button>

        {transactionsExpanded && (
          <>
            {/* Action Buttons */}
            <div className="flex justify-between items-center mb-6">
              <div className="flex items-center gap-3">
                {selectedTransactions.size > 0 && (
                  <>
                    <span className="text-sm font-medium text-gray-700">
                      {selectedTransactions.size} selected
                    </span>
                    <button
                      onClick={() => setShowBulkEdit(true)}
                      className="flex items-center gap-2 px-4 py-2 rounded-lg transition-colors font-medium border-2"
                      style={{ borderColor: THEME.primary, color: THEME.primary }}
                      onMouseOver={(e) => {
                        e.currentTarget.style.backgroundColor = THEME.primary;
                        e.currentTarget.style.color = 'white';
                      }}
                      onMouseOut={(e) => {
                        e.currentTarget.style.backgroundColor = 'transparent';
                        e.currentTarget.style.color = THEME.primary;
                      }}
                    >
                      <Edit2 size={18} />
                      Bulk Edit
                    </button>
                    <button
                      onClick={() => setSelectedTransactions(new Set())}
                      className="text-sm text-gray-600 hover:text-gray-800"
                    >
                      Clear Selection
                    </button>
                  </>
                )}
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowAddTransaction(!showAddTransaction)}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg transition-colors font-medium text-white"
                  style={{ backgroundColor: THEME.primary }}
                  onMouseOver={(e) => e.currentTarget.style.backgroundColor = THEME.primaryHover}
                  onMouseOut={(e) => e.currentTarget.style.backgroundColor = THEME.primary}
                >
                  <PlusCircle size={20} />
                  Add Transaction
                </button>
                <button
                  onClick={() => setShowCSVImport(true)}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg transition-colors font-medium border-2"
                  style={{ borderColor: THEME.primary, color: THEME.primary }}
                  onMouseOver={(e) => {
                    e.currentTarget.style.backgroundColor = THEME.primary;
                    e.currentTarget.style.color = 'white';
                  }}
                  onMouseOut={(e) => {
                    e.currentTarget.style.backgroundColor = 'transparent';
                    e.currentTarget.style.color = THEME.primary;
                  }}
                >
                  <Upload size={20} />
                  Import CSV
                </button>
              </div>
            </div>

            {/* Add Transaction Form */}
            {showAddTransaction && (
              <div className="rounded-xl p-6 mb-6 border-2" style={{ backgroundColor: THEME.primaryLight, borderColor: THEME.primary }}>
                <h3 className="font-semibold text-gray-800 mb-4">New Transaction</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Date</label>
                    <input
                      type="date"
                      value={newTransaction.date}
                      onChange={(e) => setNewTransaction({ ...newTransaction, date: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Account *</label>
                    <select
                      value={newTransaction.account_id}
                      onChange={(e) => setNewTransaction({ ...newTransaction, account_id: e.target.value })}
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
                    <label className="block text-sm font-medium text-gray-700 mb-2">Category (Optional)</label>
                    <select
                      value={newTransaction.category}
                      onChange={(e) => setNewTransaction({ ...newTransaction, category: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:border-transparent"
                    >
                      <option value="">No Category</option>
                      {categories.map((cat) => (
                        <option key={cat} value={cat}>
                          {cat}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                    <input
                      type="text"
                      value={newTransaction.description}
                      onChange={(e) => setNewTransaction({ ...newTransaction, description: e.target.value })}
                      placeholder="Coffee shop, rent, etc."
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Amount (negative for expenses)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={newTransaction.amount}
                      onChange={(e) => setNewTransaction({ ...newTransaction, amount: e.target.value })}
                      placeholder="-50.00 or 3000.00"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:border-transparent"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Comment (Optional)</label>
                    <textarea
                      value={newTransaction.comment || ''}
                      onChange={(e) => setNewTransaction({ ...newTransaction, comment: e.target.value })}
                      placeholder="Additional notes or details..."
                      rows="2"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:border-transparent resize-none"
                    />
                  </div>
                </div>
                <div className="flex gap-3 mt-4">
                  <button
                    onClick={handleAddTransaction}
                    className="px-6 py-2 rounded-lg transition-colors font-medium text-white"
                    style={{ backgroundColor: THEME.primary }}
                    onMouseOver={(e) => e.currentTarget.style.backgroundColor = THEME.primaryHover}
                    onMouseOut={(e) => e.currentTarget.style.backgroundColor = THEME.primary}
                  >
                    Save Transaction
                  </button>
                  <button
                    onClick={() => setShowAddTransaction(false)}
                    className="bg-gray-200 hover:bg-gray-300 text-gray-700 px-6 py-2 rounded-lg transition-colors font-medium"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </>
        )}

        {transactionsExpanded && (
          <div className="overflow-x-auto">
            {filteredTransactions.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <p className="text-lg">No transactions found</p>
                <p className="text-sm">Try adjusting your filters</p>
              </div>
            ) : (
              <table className="w-full border-collapse">
                <thead>
                  <tr className="border-b-2 border-gray-300">
                    <th className="px-3 py-2 text-center text-xs font-semibold text-gray-700 uppercase tracking-wider bg-gray-50">
                      <input
                        type="checkbox"
                        checked={selectedTransactions.size === filteredTransactions.length && filteredTransactions.length > 0}
                        onChange={toggleSelectAll}
                        className="cursor-pointer"
                      />
                    </th>
                    <th className="px-3 py-2 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider bg-gray-50">Type</th>
                    <th className="px-3 py-2 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider bg-gray-50">Description</th>
                    <th className="px-3 py-2 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider bg-gray-50">Date</th>
                    <th className="px-3 py-2 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider bg-gray-50">Category</th>
                    <th className="px-3 py-2 text-right text-xs font-semibold text-gray-700 uppercase tracking-wider bg-gray-50">Amount</th>
                    <th className="px-3 py-2 text-center text-xs font-semibold text-gray-700 uppercase tracking-wider bg-gray-50">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredTransactions.map((transaction, index) => (
                    <tr
                      key={transaction.id}
                      className={`border-b border-gray-200 hover:bg-blue-50 transition-colors ${
                        index % 2 === 0 ? 'bg-white' : 'bg-gray-50'
                      }`}
                    >
                      <td className="px-3 py-2 text-center">
                        <input
                          type="checkbox"
                          checked={selectedTransactions.has(transaction.id)}
                          onChange={() => toggleSelectTransaction(transaction.id)}
                          className="cursor-pointer"
                        />
                      </td>
                      <td className="px-3 py-2">
                        <div className="flex items-center justify-center w-8 h-8 rounded-full" style={{ backgroundColor: transaction.amount > 0 ? THEME.successLight : THEME.dangerLight }}>
                          {transaction.amount > 0 ? (
                            <TrendingUp style={{ color: THEME.success }} size={16} />
                          ) : (
                            <TrendingDown style={{ color: THEME.danger }} size={16} />
                          )}
                        </div>
                      </td>
                      <td className="px-3 py-2 text-sm text-gray-800 font-medium">
                        {editingDescriptionId === transaction.id ? (
                          <div className="flex items-center gap-2">
                            <input
                              type="text"
                              value={editingDescription}
                              onChange={(e) => setEditingDescription(e.target.value)}
                              className="flex-1 px-2 py-1 border border-gray-300 rounded focus:ring-2 focus:border-transparent"
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') handleSaveDescription(transaction.id);
                                if (e.key === 'Escape') handleCancelEditDescription();
                              }}
                              autoFocus
                            />
                            <button
                              onClick={() => handleSaveDescription(transaction.id)}
                              className="p-1 hover:bg-green-100 rounded"
                              title="Save"
                            >
                              <Check size={16} style={{ color: THEME.success }} />
                            </button>
                            <button
                              onClick={handleCancelEditDescription}
                              className="p-1 hover:bg-red-100 rounded"
                              title="Cancel"
                            >
                              <X size={16} style={{ color: THEME.danger }} />
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2 group">
                            <span>{transaction.description}</span>
                            <button
                              onClick={() => handleStartEditDescription(transaction)}
                              className="opacity-0 group-hover:opacity-100 p-1 hover:bg-gray-200 rounded transition-opacity"
                              title="Edit description"
                            >
                              <Edit2 size={14} className="text-gray-500" />
                            </button>
                          </div>
                        )}
                      </td>
                      <td className="px-3 py-2 text-sm text-gray-600 whitespace-nowrap">
                        <span className="flex items-center gap-1">
                          <Calendar size={14} />
                          {transaction.date}
                        </span>
                      </td>
                      <td className="px-3 py-2 text-sm">
                        <CategorySelector
                          transaction={transaction}
                          categories={categories}
                          onCategoryChange={onCategoryChange}
                          onAddCategory={onAddCategory}
                        />
                      </td>
                      <td className="px-3 py-2 text-sm font-semibold text-right whitespace-nowrap" style={{ color: transaction.amount > 0 ? THEME.success : THEME.danger }}>
                        {formatCurrency(transaction.amount)}
                      </td>
                      <td className="px-3 py-2">
                        <div className="flex items-center justify-center gap-1">
                          {transaction.category !== 'Transfer' && (
                            <button
                              onClick={() => {
                                setConvertingTransactionId(transaction.id);
                                setShowConvertTransfer(true);
                              }}
                              className="inline-flex items-center justify-center w-8 h-8 rounded-lg transition-all hover:bg-blue-100"
                              style={{ color: THEME.primary }}
                              title="Convert to Transfer"
                            >
                              <ArrowLeftRight size={16} />
                            </button>
                          )}
                          <button
                            onClick={() => setDeleteConfirm({ show: true, type: 'transaction', id: transaction.id, name: transaction.description })}
                            className="inline-flex items-center justify-center w-8 h-8 rounded-lg transition-all hover:bg-red-100"
                            style={{ color: THEME.danger }}
                            title="Delete transaction"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}
      </div>

      {/* Bulk Edit Modal */}
      {showBulkEdit && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <h3 className="text-xl font-bold text-gray-800 mb-4">
              Bulk Edit ({selectedTransactions.size} transactions)
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Category (leave empty to keep current)
                </label>
                <select
                  value={bulkEditData.category}
                  onChange={(e) => setBulkEditData({ ...bulkEditData, category: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:border-transparent"
                >
                  <option value="">Don't change</option>
                  {categories.map((cat) => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Date (leave empty to keep current)
                </label>
                <input
                  type="date"
                  value={bulkEditData.date}
                  onChange={(e) => setBulkEditData({ ...bulkEditData, date: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description (leave empty to keep current)
                </label>
                <input
                  type="text"
                  value={bulkEditData.description}
                  onChange={(e) => setBulkEditData({ ...bulkEditData, description: e.target.value })}
                  placeholder="New description for all selected"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:border-transparent"
                />
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button
                onClick={handleBulkEditSubmit}
                className="flex-1 px-4 py-2 rounded-lg text-white font-medium transition-colors"
                style={{ backgroundColor: THEME.primary }}
                onMouseOver={(e) => e.currentTarget.style.backgroundColor = THEME.primaryHover}
                onMouseOut={(e) => e.currentTarget.style.backgroundColor = THEME.primary}
              >
                Update All
              </button>
              <button
                onClick={() => {
                  setShowBulkEdit(false);
                  setBulkEditData({ category: '', date: '', description: '' });
                }}
                className="flex-1 px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg font-medium transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Convert to Transfer Modal */}
      {showConvertTransfer && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <h3 className="text-xl font-bold text-gray-800 mb-4">
              Convert to Transfer
            </h3>
            <p className="text-sm text-gray-600 mb-4">
              This will create a linked transaction in the destination account and mark both as transfers.
            </p>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Destination Account *
                </label>
                <select
                  onChange={(e) => {
                    if (e.target.value) {
                      onConvertToTransfer(convertingTransactionId, e.target.value);
                      setShowConvertTransfer(false);
                      setConvertingTransactionId(null);
                    }
                  }}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:border-transparent"
                  defaultValue=""
                >
                  <option value="">Select account...</option>
                  {accounts.map((account) => (
                    <option key={account.id} value={account.id}>
                      {account.name} ({account.type})
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => {
                  setShowConvertTransfer(false);
                  setConvertingTransactionId(null);
                }}
                className="flex-1 px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg font-medium transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default TransactionsTab;
