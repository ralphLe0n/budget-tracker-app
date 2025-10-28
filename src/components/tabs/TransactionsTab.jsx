import React from 'react';
import { TrendingUp, TrendingDown, Calendar, Trash2, Filter } from 'lucide-react';
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
  onAddCategory
}) => {
  return (
    <>
      {/* Page Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800">All Transactions</h1>
        <p className="text-gray-600 mt-2">View and manage all your transactions</p>
      </div>

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

      {/* Transactions List */}
      <div className="bg-white rounded-2xl shadow-lg p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-800">
            All Transactions
            <span className="ml-3 text-sm text-gray-500 font-normal">
              ({filteredTransactions.length} total)
            </span>
          </h2>
        </div>

        {/* Transaction List */}
        <div className="space-y-3">
          {filteredTransactions.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <p className="text-lg">No transactions found</p>
              <p className="text-sm">Try adjusting your filters</p>
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
                    <div className="flex gap-4 text-sm text-gray-600 mt-1 items-center">
                      <span className="flex items-center gap-1">
                        <Calendar size={14} />
                        {transaction.date}
                      </span>
                      <CategorySelector
                        transaction={transaction}
                        categories={categories}
                        onCategoryChange={onCategoryChange}
                        onAddCategory={onAddCategory}
                      />
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
            ))
          )}
        </div>
      </div>
    </>
  );
};

export default TransactionsTab;
