import React from 'react';
import { PlusCircle, TrendingUp, TrendingDown, DollarSign, Wallet, Calendar, Trash2, Filter } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, BarChart, Bar } from 'recharts';
import { THEME } from '../../config/theme';
import { formatCurrency } from '../../utils/formatters';

const DashboardTab = ({
  totalIncome,
  totalExpenses,
  totalAccountBalance,
  totalSavings,
  accounts,
  savingsAccounts,
  hasActiveFilters,
  filteredTransactions,
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
  budgets,
  spendingByCategory,
  categorySpendingData,
  monthlyData,
  showAddTransaction,
  setShowAddTransaction,
  newTransaction,
  setNewTransaction,
  handleAddTransaction,
  setDeleteConfirm
}) => {
  const COLORS = THEME.chartColors;

  return (
    <>
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="bg-white rounded-2xl shadow-lg p-6" style={{ borderLeft: `4px solid ${THEME.success}` }}>
          <div className="flex items-center justify-between mb-2">
            <span className="text-gray-600 text-sm font-medium">
              Total Income {hasActiveFilters && <span className="text-xs">(Filtered)</span>}
            </span>
            <TrendingUp style={{ color: THEME.success }} size={24} />
          </div>
          <p className="text-3xl font-bold text-gray-800">{formatCurrency(totalIncome)}</p>
          {hasActiveFilters && (
            <p className="text-xs text-gray-500 mt-1">
              {filteredTransactions.filter(t => t.amount > 0).length} transaction(s)
            </p>
          )}
        </div>

        <div className="bg-white rounded-2xl shadow-lg p-6" style={{ borderLeft: `4px solid ${THEME.danger}` }}>
          <div className="flex items-center justify-between mb-2">
            <span className="text-gray-600 text-sm font-medium">
              Total Expenses {hasActiveFilters && <span className="text-xs">(Filtered)</span>}
            </span>
            <TrendingDown style={{ color: THEME.danger }} size={24} />
          </div>
          <p className="text-3xl font-bold text-gray-800">{formatCurrency(totalExpenses)}</p>
          {hasActiveFilters && (
            <p className="text-xs text-gray-500 mt-1">
              {filteredTransactions.filter(t => t.amount < 0).length} transaction(s)
            </p>
          )}
        </div>

        <div className="bg-white rounded-2xl shadow-lg p-6" style={{ borderLeft: `4px solid ${THEME.primary}` }}>
          <div className="flex items-center justify-between mb-2">
            <span className="text-gray-600 text-sm font-medium">
              Account Balance
            </span>
            <Wallet style={{ color: THEME.primary }} size={24} />
          </div>
          <p className="text-3xl font-bold" style={{ color: totalAccountBalance >= 0 ? THEME.success : THEME.danger }}>
            {formatCurrency(totalAccountBalance)}
          </p>
          <p className="text-xs text-gray-500 mt-1">
            {accounts.filter(a => a.type !== 'savings').length} account(s)
          </p>
        </div>

        <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl shadow-lg p-6 border-2 border-green-200">
          <div className="flex items-center justify-between mb-2">
            <span className="text-gray-700 text-sm font-medium">
              Total Savings
            </span>
            <DollarSign style={{ color: THEME.success }} size={24} />
          </div>
          <p className="text-3xl font-bold" style={{ color: THEME.success }}>
            {formatCurrency(totalSavings)}
          </p>
          <p className="text-xs text-gray-600 mt-1">
            {savingsAccounts.length} savings account(s)
          </p>
        </div>
      </div>

      {/* Savings Accounts Detail Widget */}
      {savingsAccounts.length > 0 && (
        <div className="bg-gradient-to-br from-green-50 to-emerald-100 rounded-2xl shadow-lg p-6 mb-8 border border-green-200">
          <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
            <DollarSign style={{ color: THEME.success }} size={24} />
            Savings Accounts
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {savingsAccounts.map((account) => (
              <div key={account.id} className="bg-white rounded-xl p-4 shadow-sm">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-semibold text-gray-800">{account.name}</h4>
                  <Wallet style={{ color: THEME.success }} size={20} />
                </div>
                <p className="text-2xl font-bold mb-1" style={{ color: THEME.success }}>
                  {formatCurrency(account.balance)}
                </p>
                <p className="text-xs text-gray-500">
                  Started with {formatCurrency(account.starting_balance)}
                </p>
                <div className="mt-2 pt-2 border-t border-gray-200">
                  <p className="text-xs text-gray-600">
                    Growth: <span className="font-semibold" style={{ color: account.balance >= account.starting_balance ? THEME.success : THEME.danger }}>
                      {formatCurrency(account.balance - account.starting_balance)}
                    </span>
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Filters Section */}
      <div className="bg-white rounded-2xl shadow-lg p-6 mb-8">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
            <Filter size={20} />
            Filters
            {hasActiveFilters && (
              <span className="ml-2 px-2 py-0.5 rounded-full text-xs text-white" style={{ backgroundColor: THEME.primary }}>
                Active
              </span>
            )}
          </h3>
          <div className="flex gap-2">
            {hasActiveFilters && (
              <button
                onClick={clearFilters}
                className="text-sm font-medium hover:opacity-80"
                style={{ color: THEME.danger }}
              >
                Clear All Filters
              </button>
            )}
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="font-medium text-sm hover:opacity-80"
              style={{ color: THEME.primary }}
            >
              {showFilters ? 'Hide Filters' : 'Show Filters'}
            </button>
          </div>
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

      {/* Budget Categories */}
      <div className="bg-white rounded-2xl shadow-lg p-6 mb-8">
        <h2 className="text-2xl font-bold text-gray-800 mb-6">
          Budget Overview {hasActiveFilters && <span className="text-sm text-gray-500">(Filtered)</span>}
        </h2>
        <div className="space-y-4">
          {budgets
            .filter(budget => selectedCategories.length === 0 || selectedCategories.includes(budget.category))
            .map((budget) => {
            const actualSpent = spendingByCategory[budget.category] || 0;

            const percentage = (actualSpent / budget.limit) * 100;
            const isOverBudget = percentage > 100;
            return (
              <div key={budget.category}>
                <div className="flex justify-between items-center mb-2">
                  <span className="font-semibold text-gray-700">{budget.category}</span>
                  <span className="text-sm" style={{ color: isOverBudget ? THEME.danger : '#6b7280' }}>
                    {formatCurrency(actualSpent)} / {formatCurrency(budget.limit)}
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-300"
                    style={{
                      width: `${Math.min(percentage, 100)}%`,
                      backgroundColor: isOverBudget ? THEME.danger : percentage > 80 ? THEME.warning : THEME.success
                    }}
                  ></div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Pie Chart */}
        <div className="bg-white rounded-2xl shadow-lg p-6">
          <h3 className="text-xl font-bold text-gray-800 mb-4">
            Spending by Category {hasActiveFilters && <span className="text-sm text-gray-500">(Filtered)</span>}
          </h3>
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
        <div className="bg-white rounded-2xl shadow-lg p-6">
          <h3 className="text-xl font-bold text-gray-800 mb-4">
            Monthly Trends {hasActiveFilters && <span className="text-sm text-gray-500">(Filtered)</span>}
          </h3>
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
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[300px] flex items-center justify-center text-gray-500">
              <p>No data to display</p>
            </div>
          )}
        </div>
      </div>

      {/* Budget vs Actual Chart */}
      <div className="bg-white rounded-2xl shadow-lg p-6 mb-8">
        <h3 className="text-xl font-bold text-gray-800 mb-4">
          Budget vs Actual Spending {hasActiveFilters && <span className="text-sm text-gray-500">(Filtered)</span>}
        </h3>
        {categorySpendingData.length > 0 ? (
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
        )}
      </div>

      {/* Transactions */}
      <div className="bg-white rounded-2xl shadow-lg p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-800">Recent Transactions</h2>
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

        {/* Transaction List */}
        <div className="space-y-3">
          {filteredTransactions.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <p className="text-lg">No transactions found</p>
              <p className="text-sm">Try adjusting your filters or add a new transaction</p>
            </div>
          ) : (
            filteredTransactions.map((transaction) => (
            <div
              key={transaction.id}
              className="flex items-center justify-between p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors"
            >
              <div className="flex items-center gap-4 flex-1">
                <div
                  className="w-12 h-12 rounded-full flex items-center justify-center"
                  style={{ backgroundColor: transaction.amount > 0 ? THEME.successLight : THEME.dangerLight }}
                >
                  {transaction.amount > 0 ? (
                    <TrendingUp style={{ color: THEME.success }} size={20} />
                  ) : (
                    <TrendingDown style={{ color: THEME.danger }} size={20} />
                  )}
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-gray-800">{transaction.description}</p>
                  <div className="flex gap-4 text-sm text-gray-600 mt-1">
                    <span className="flex items-center gap-1">
                      <Calendar size={14} />
                      {transaction.date}
                    </span>
                    <span className="px-2 py-0.5 rounded-full text-xs font-medium" style={{ backgroundColor: THEME.primaryLight, color: THEME.primary }}>
                      {transaction.category}
                    </span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <span
                  className="text-xl font-bold"
                  style={{ color: transaction.amount > 0 ? THEME.success : THEME.danger }}
                >
                  {formatCurrency(transaction.amount)}
                </span>
                <button
                  onClick={() => setDeleteConfirm({ show: true, type: 'transaction', id: transaction.id, name: transaction.description })}
                  className="transition-colors p-2"
                  style={{ color: THEME.danger }}
                  onMouseOver={(e) => e.currentTarget.style.color = THEME.dangerHover}
                  onMouseOut={(e) => e.currentTarget.style.color = THEME.danger}
                >
                  <Trash2 size={18} />
                </button>
              </div>
            </div>
          )))}
        </div>
      </div>
    </>
  );
};

export default DashboardTab;
