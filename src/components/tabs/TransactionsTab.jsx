import React, { useState, useEffect, useMemo } from 'react';
import { TrendingUp, TrendingDown, Trash2, Filter, ChevronDown, ChevronUp, Upload, PlusCircle, Edit2, Check, X, ArrowLeftRight, CreditCard, CheckSquare } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, BarChart, Bar } from 'recharts';
import { THEME } from '../../config/theme';
import { formatCurrency } from '../../utils/formatters';
import CategorySelector from '../CategorySelector';
import CategoryIconSelector from '../CategoryIconSelector';
import { useMobile } from '../../hooks/useMobile';
import SwipeableTransactionCard from '../mobile/SwipeableTransactionCard';
import TransactionEditModal from '../mobile/TransactionEditModal';
import SelectionModeToolbar from '../mobile/SelectionModeToolbar';
import LinkDebtPaymentModal from '../modals/LinkDebtPaymentModal';

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
  spendingByBudgetPeriod,
  setShowCSVImport,
  accounts,
  showAddTransaction,
  setShowAddTransaction,
  newTransaction,
  setNewTransaction,
  handleAddTransaction,
  onUpdateTransaction,
  onConvertToTransfer,
  onBulkUpdate,
  debts = [],
  debtPayments = [],
  onLinkTransactionToDebt
}) => {
  const COLORS = THEME.chartColors;

  // Mobile optimizations
  const { isMobile, iconSize, iconSizeSmall } = useMobile();

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

  // Mobile gesture system state
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [selectedTransactionIds, setSelectedTransactionIds] = useState(new Set());
  const [editingTransaction, setEditingTransaction] = useState(null);
  const [showSwipeHint, setShowSwipeHint] = useState(false);

  // Debt payment linking state
  const [showLinkDebtModal, setShowLinkDebtModal] = useState(false);
  const [linkingTransaction, setLinkingTransaction] = useState(null);

  // Create a map of transaction IDs to debt payment info
  const transactionDebtLinks = useMemo(() => {
    const links = {};
    debtPayments.forEach(payment => {
      if (payment.transaction_id) {
        const debt = debts.find(d => d.id === payment.debt_id);
        if (debt) {
          links[payment.transaction_id] = {
            debt_id: debt.id,
            debt_name: debt.name,
            amount_paid: payment.amount_paid,
            principal_paid: payment.principal_paid,
            interest_paid: payment.interest_paid
          };
        }
      }
    });
    return links;
  }, [debtPayments, debts]);

  // Show swipe hint on first visit (mobile only)
  useEffect(() => {
    if (isMobile && filteredTransactions.length > 0) {
      const hasSeenHint = localStorage.getItem('hasSeenSwipeHint_transactions');
      if (!hasSeenHint) {
        setShowSwipeHint(true);
        setTimeout(() => {
          setShowSwipeHint(false);
          localStorage.setItem('hasSeenSwipeHint_transactions', 'true');
        }, 3000);
      }
    }
  }, [isMobile, filteredTransactions.length]);

  // Mobile gesture handlers
  const handleLongPress = (transactionId) => {
    setIsSelectionMode(true);
    setSelectedTransactionIds(new Set([transactionId]));
  };

  const handleSelectTransaction = (transactionId) => {
    const newSelected = new Set(selectedTransactionIds);
    if (newSelected.has(transactionId)) {
      newSelected.delete(transactionId);
    } else {
      newSelected.add(transactionId);
    }
    setSelectedTransactionIds(newSelected);

    // Exit selection mode if no transactions selected
    if (newSelected.size === 0) {
      setIsSelectionMode(false);
    }
  };

  const handleSelectAll = () => {
    setSelectedTransactionIds(new Set(filteredTransactions.map(t => t.id)));
  };

  const handleDeselectAll = () => {
    setSelectedTransactionIds(new Set());
  };

  const handleCancelSelection = () => {
    setIsSelectionMode(false);
    setSelectedTransactionIds(new Set());
  };

  const handleBulkEditFromToolbar = () => {
    // Use existing bulk edit modal
    setSelectedTransactions(selectedTransactionIds);
    setShowBulkEdit(true);
  };

  const handleEditTransaction = (transaction) => {
    setEditingTransaction(transaction);
  };

  const handleSaveEdit = (transactionId, updates) => {
    onUpdateTransaction(transactionId, updates);
    setEditingTransaction(null);
  };

  const handleDeleteTransaction = (id, description) => {
    setDeleteConfirm({ show: true, type: 'transaction', id, name: description });
  };

  const handleConvertTransaction = (transactionId) => {
    setConvertingTransactionId(transactionId);
    setShowConvertTransfer(true);
  };

  const handleLinkToDebt = (transaction) => {
    setLinkingTransaction(transaction);
    setShowLinkDebtModal(true);
  };

  const handleConfirmLinkToDebt = (debtId, paymentData) => {
    if (linkingTransaction && onLinkTransactionToDebt) {
      onLinkTransactionToDebt(linkingTransaction.id, debtId, paymentData);
    }
    setShowLinkDebtModal(false);
    setLinkingTransaction(null);
  };

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
      <div className="mb-4 sm:mb-6">
        <h1 className="text-xl sm:text-2xl font-bold text-gray-800">Transakcje i Analityka</h1>
        <p className="text-xs sm:text-sm text-gray-500 mt-1">Kompleksowy widok Twoich danych finansowych</p>
      </div>

      {/* Charts Section */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 sm:p-5 mb-4 sm:mb-6">
        <button
          onClick={() => setChartsExpanded(!chartsExpanded)}
          className="w-full flex justify-between items-center mb-3"
        >
          <h2 className="text-base sm:text-xl font-semibold text-gray-800">
            <span className="hidden sm:inline">Wykresy i Trendy</span>
            <span className="sm:hidden">Wykresy</span>
            {hasActiveFilters && <span className="text-xs text-gray-500 ml-2">(Filtrowane)</span>}
          </h2>
          {chartsExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
        </button>

        {chartsExpanded && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Pie Chart */}
            <div>
              <h3 className="text-lg font-semibold text-gray-700 mb-4">Wydatki według Kategorii</h3>
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
                  <p>Brak danych o wydatkach do wyświetlenia</p>
                </div>
              )}
            </div>

            {/* Line Chart */}
            <div>
              <h3 className="text-lg font-semibold text-gray-700 mb-4">Trendy Miesięczne</h3>
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
                      labelFormatter={(label) => `Miesiąc: ${label}`}
                    />
                    <Legend />
                    <Line
                      type="monotone"
                      dataKey="income"
                      stroke={THEME.success}
                      strokeWidth={2}
                      name="Przychód"
                      dot={{ r: 4 }}
                    />
                    <Line
                      type="monotone"
                      dataKey="expenses"
                      stroke={THEME.danger}
                      strokeWidth={2}
                      name="Wydatki"
                      dot={{ r: 4 }}
                    />
                    <Line
                      type="monotone"
                      dataKey="balance"
                      stroke={THEME.primary}
                      strokeWidth={2}
                      name="Saldo"
                      dot={{ r: 4 }}
                    />
                    <Line
                      type="monotone"
                      dataKey="savings"
                      stroke="#10b981"
                      strokeWidth={2}
                      name="Oszczędności"
                      dot={{ r: 4 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-[300px] flex items-center justify-center text-gray-500">
                  <p>Brak danych do wyświetlenia</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Budget vs Actual Section */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 sm:p-5 mb-4 sm:mb-6">
        <button
          onClick={() => setBudgetExpanded(!budgetExpanded)}
          className="w-full flex justify-between items-center mb-3"
        >
          <h2 className="text-base sm:text-xl font-semibold text-gray-800">
            <span className="hidden sm:inline">Budżet vs Rzeczywiste</span>
            <span className="sm:hidden">Budżet</span>
            {hasActiveFilters && <span className="text-xs text-gray-500 ml-2">(Filtrowane)</span>}
          </h2>
          {budgetExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
        </button>

        {budgetExpanded && (
          categorySpendingData.length > 0 ? (
            <ResponsiveContainer width="100%" height={400}>
              <BarChart
                data={budgets
                  .filter(budget => selectedCategories.length === 0 || selectedCategories.includes(budget.category))
                  .map(budget => {
                    const actualSpent = spendingByBudgetPeriod[budget.category] || 0;
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
                <Bar dataKey="spent" stackId="a" fill={THEME.primary} name="Wydane" />
                <Bar dataKey="remaining" stackId="a" fill={THEME.success} name="Pozostało" radius={[0, 8, 8, 0]} />
                <Bar dataKey="overspent" stackId="a" fill={THEME.danger} name="Przekroczenie" radius={[0, 8, 8, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[400px] flex items-center justify-center text-gray-500">
              <p>Brak danych budżetowych do wyświetlenia</p>
            </div>
          )
        )}
      </div>

      {/* Filters Section */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 sm:p-5 mb-4 sm:mb-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 mb-3">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="flex-1 flex justify-between items-center w-full"
          >
            <h3 className="text-base sm:text-lg font-semibold text-gray-800 flex items-center gap-2">
              <Filter size={16} className="sm:w-5 sm:h-5" />
              Filtry
              {hasActiveFilters && (
                <span className="ml-2 px-2 py-0.5 rounded-full text-xs text-white" style={{ backgroundColor: THEME.primary }}>
                  Aktywne
                </span>
              )}
            </h3>
            {showFilters ? <ChevronUp size={18} className="sm:w-5 sm:h-5" /> : <ChevronDown size={18} className="sm:w-5 sm:h-5" />}
          </button>
          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              className="text-xs sm:text-sm font-medium hover:opacity-80 w-full sm:w-auto text-left sm:text-center py-2 sm:py-0"
              style={{ color: THEME.danger }}
            >
              Wyczyść wszystko
            </button>
          )}
        </div>

        {showFilters && (
          <div>
            {/* Quick Date Range Buttons */}
            <div className="mb-4">
              <h4 className="font-semibold text-gray-700 mb-3 text-sm sm:text-base">Szybkie Filtry</h4>
              <div className="grid grid-cols-2 sm:flex sm:flex-wrap gap-2">
                <button
                  onClick={() => {
                    const today = new Date();
                    const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
                    setFilterStartDate(firstDay.toISOString().split('T')[0]);
                    setFilterEndDate(today.toISOString().split('T')[0]);
                  }}
                  className="px-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-xs sm:text-sm font-medium transition-colors"
                >
                  Ten Miesiąc
                </button>
                <button
                  onClick={() => {
                    const today = new Date();
                    const firstDay = new Date(today.getFullYear(), today.getMonth() - 1, 1);
                    const lastDay = new Date(today.getFullYear(), today.getMonth(), 0);
                    setFilterStartDate(firstDay.toISOString().split('T')[0]);
                    setFilterEndDate(lastDay.toISOString().split('T')[0]);
                  }}
                  className="px-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-xs sm:text-sm font-medium transition-colors"
                >
                  Ostatni Miesiąc
                </button>
                <button
                  onClick={() => {
                    const today = new Date();
                    const threeMonthsAgo = new Date(today.getFullYear(), today.getMonth() - 3, today.getDate());
                    setFilterStartDate(threeMonthsAgo.toISOString().split('T')[0]);
                    setFilterEndDate(today.toISOString().split('T')[0]);
                  }}
                  className="px-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-xs sm:text-sm font-medium transition-colors col-span-2 sm:col-span-1"
                >
                  <span className="hidden sm:inline">Ostatnie 3 Miesiące</span>
                  <span className="sm:hidden">3 Miesiące</span>
                </button>
                <button
                  onClick={() => {
                    const today = new Date();
                    const firstDay = new Date(today.getFullYear(), 0, 1);
                    setFilterStartDate(firstDay.toISOString().split('T')[0]);
                    setFilterEndDate(today.toISOString().split('T')[0]);
                  }}
                  className="px-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-xs sm:text-sm font-medium transition-colors col-span-2 sm:col-span-1"
                >
                  Ten Rok
                </button>
              </div>
            </div>

            {/* Date Range Filter */}
            <div className="mb-6">
              <h4 className="font-semibold text-gray-700 mb-3">Zakres Dat</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-2">Data Początkowa</label>
                  <input
                    type="date"
                    value={filterStartDate}
                    onChange={(e) => setFilterStartDate(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-2">Data Końcowa</label>
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
              <h4 className="font-semibold text-gray-700 mb-3">Szukaj według Opisu</h4>
              <input
                type="text"
                value={filterDescription}
                onChange={(e) => setFilterDescription(e.target.value)}
                placeholder="Szukaj transakcji..."
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:border-transparent"
              />
            </div>

            {/* Category Filter */}
            <div>
              <div className="flex justify-between items-center mb-3">
                <h4 className="font-semibold text-gray-700">Kategorie</h4>
                <div className="flex gap-2">
                  <button
                    onClick={() => setSelectedCategories([...categories])}
                    className="text-xs font-medium hover:opacity-80"
                    style={{ color: THEME.primary }}
                  >
                    Zaznacz wszystkie
                  </button>
                  <button
                    onClick={() => setSelectedCategories([])}
                    className="text-xs text-gray-600 hover:text-gray-700 font-medium"
                  >
                    Wyczyść wszystko
                  </button>
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                {categories.map((category) => (
                  <button
                    key={category.name}
                    onClick={() => toggleCategoryFilter(category.name)}
                    style={{
                      backgroundColor: selectedCategories.includes(category.name) ? THEME.primary : '#f3f4f6',
                      color: selectedCategories.includes(category.name) ? 'white' : '#374151'
                    }}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                      selectedCategories.includes(category.name) ? 'shadow-md' : 'hover:bg-gray-200'
                    }`}
                  >
                    {category.name}
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
                Od: {filterStartDate}
              </span>
            )}
            {filterEndDate && (
              <span className="px-3 py-1 rounded-full text-sm" style={{ backgroundColor: THEME.primaryLight, color: THEME.primary }}>
                Do: {filterEndDate}
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
      <div className="bg-white rounded-xl border border-gray-200 p-4 sm:p-5">
        <button
          onClick={() => setTransactionsExpanded(!transactionsExpanded)}
          className="w-full flex justify-between items-center mb-4"
        >
          <h2 className="text-base sm:text-xl font-semibold text-gray-800">
            <span className="hidden sm:inline">Wszystkie Transakcje</span>
            <span className="sm:hidden">Transakcje</span>
            <span className="ml-2 sm:ml-3 text-xs sm:text-sm text-gray-500 font-normal">
              ({filteredTransactions.length})
            </span>
          </h2>
          {transactionsExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
        </button>

        {transactionsExpanded && (
          <>
            {/* Action Buttons */}
            <div className="flex flex-col gap-4 mb-6">
              <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                {selectedTransactions.size > 0 && (
                  <>
                    <span className="text-sm font-medium text-gray-700">
                      {selectedTransactions.size} zaznaczonych
                    </span>
                    <button
                      onClick={() => setShowBulkEdit(true)}
                      className="flex items-center justify-center gap-2 px-4 py-3 rounded-lg transition-colors font-medium border-2 w-full sm:w-auto"
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
                      <span className="hidden sm:inline">Edycja Zbiorcza</span>
                      <span className="sm:hidden">Edytuj</span>
                    </button>
                    <button
                      onClick={() => setSelectedTransactions(new Set())}
                      className="text-sm text-gray-600 hover:text-gray-800 w-full sm:w-auto text-center"
                    >
                      Wyczyść Zaznaczenie
                    </button>
                  </>
                )}
              </div>
              <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 sm:justify-end">
                <button
                  onClick={() => setShowAddTransaction(!showAddTransaction)}
                  className="flex items-center justify-center gap-2 px-4 py-3 rounded-lg transition-colors font-medium text-white w-full sm:w-auto"
                  style={{ backgroundColor: THEME.primary }}
                  onMouseOver={(e) => e.currentTarget.style.backgroundColor = THEME.primaryHover}
                  onMouseOut={(e) => e.currentTarget.style.backgroundColor = THEME.primary}
                >
                  <PlusCircle size={20} />
                  <span className="hidden sm:inline">Dodaj Transakcję</span>
                  <span className="sm:hidden">Dodaj</span>
                </button>
                <button
                  onClick={() => setShowCSVImport(true)}
                  className="flex items-center justify-center gap-2 px-4 py-3 rounded-lg transition-colors font-medium border-2 w-full sm:w-auto"
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
                  <span className="hidden sm:inline">Importuj CSV</span>
                  <span className="sm:hidden">Import</span>
                </button>
              </div>
            </div>

            {/* Add Transaction Form */}
            {showAddTransaction && (
              <div className="rounded-xl p-6 mb-6 border-2" style={{ backgroundColor: THEME.primaryLight, borderColor: THEME.primary }}>
                <h3 className="font-semibold text-gray-800 mb-4">Nowa Transakcja</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Data</label>
                    <input
                      type="date"
                      value={newTransaction.date}
                      onChange={(e) => setNewTransaction({ ...newTransaction, date: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Konto *</label>
                    <select
                      value={newTransaction.account_id}
                      onChange={(e) => setNewTransaction({ ...newTransaction, account_id: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:border-transparent"
                      required
                    >
                      <option value="">Wybierz Konto</option>
                      {accounts.map((account) => (
                        <option key={account.id} value={account.id}>
                          {account.name} ({formatCurrency(account.balance)})
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Kategoria (Opcjonalna)</label>
                    <select
                      value={newTransaction.category}
                      onChange={(e) => setNewTransaction({ ...newTransaction, category: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:border-transparent"
                    >
                      <option value="">Brak Kategorii</option>
                      {categories.map((cat) => (
                        <option key={cat.name} value={cat.name}>
                          {cat.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Opis</label>
                    <input
                      type="text"
                      value={newTransaction.description}
                      onChange={(e) => setNewTransaction({ ...newTransaction, description: e.target.value })}
                      placeholder="Kawiarnia, czynsz, itp."
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Kwota (ujemna dla wydatków)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={newTransaction.amount}
                      onChange={(e) => setNewTransaction({ ...newTransaction, amount: e.target.value })}
                      placeholder="-50.00 lub 3000.00"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:border-transparent"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Komentarz (Opcjonalny)</label>
                    <textarea
                      value={newTransaction.comment || ''}
                      onChange={(e) => setNewTransaction({ ...newTransaction, comment: e.target.value })}
                      placeholder="Dodatkowe notatki lub szczegóły..."
                      rows="2"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:border-transparent resize-none"
                    />
                  </div>
                </div>
                <div className="flex flex-col sm:flex-row gap-3 mt-4">
                  <button
                    onClick={handleAddTransaction}
                    className="w-full sm:w-auto px-6 py-3 rounded-lg transition-colors font-medium text-white"
                    style={{ backgroundColor: THEME.primary }}
                    onMouseOver={(e) => e.currentTarget.style.backgroundColor = THEME.primaryHover}
                    onMouseOut={(e) => e.currentTarget.style.backgroundColor = THEME.primary}
                  >
                    Zapisz Transakcję
                  </button>
                  <button
                    onClick={() => setShowAddTransaction(false)}
                    className="w-full sm:w-auto bg-gray-200 hover:bg-gray-300 text-gray-700 px-6 py-3 rounded-lg transition-colors font-medium"
                  >
                    Anuluj
                  </button>
                </div>
              </div>
            )}
          </>
        )}

        {transactionsExpanded && (
          <>
            {filteredTransactions.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <p className="text-lg">Nie znaleziono transakcji</p>
                <p className="text-sm">Spróbuj dostosować filtry</p>
              </div>
            ) : (
              <>
                {/* Select All Button - Only show on desktop when in selection mode */}
                {!isMobile && selectedTransactions.size > 0 && (
                  <div className="mb-4 flex items-center gap-2 px-2">
                    <input
                      type="checkbox"
                      checked={selectedTransactions.size === filteredTransactions.length && filteredTransactions.length > 0}
                      onChange={toggleSelectAll}
                      className="cursor-pointer w-4 h-4"
                    />
                    <span className="text-sm text-gray-600 font-medium">
                      Zaznacz wszystkie
                    </span>
                  </div>
                )}

                {/* Transaction Cards */}
                <div className="space-y-4">
                  {filteredTransactions.map((transaction, index) => (
                    isMobile ? (
                      // Mobile: Use SwipeableTransactionCard with gestures
                      <SwipeableTransactionCard
                        key={transaction.id}
                        transaction={transaction}
                        categories={categories}
                        onCategoryChange={onCategoryChange}
                        onAddCategory={onAddCategory}
                        onEdit={handleEditTransaction}
                        onDelete={handleDeleteTransaction}
                        onConvertToTransfer={handleConvertTransaction}
                        isSelectionMode={isSelectionMode}
                        isSelected={selectedTransactionIds.has(transaction.id)}
                        onSelect={handleSelectTransaction}
                        onLongPress={handleLongPress}
                        showHint={index === 0 && showSwipeHint}
                        debtPaymentLink={transactionDebtLinks[transaction.id]}
                      />
                    ) : (
                      // Desktop: Use traditional card with checkboxes
                      <div
                        key={transaction.id}
                        className={`group relative rounded-xl transition-all p-4 ${
                          selectedTransactions.has(transaction.id)
                            ? 'bg-blue-50 border-2 border-blue-300 shadow-sm'
                            : 'bg-white hover:bg-gray-50 border border-gray-200 hover:shadow-md'
                        }`}
                      >
                        {/* Desktop Action Buttons - Show on hover */}
                        <div className="absolute top-3 right-3 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                          {editingDescriptionId !== transaction.id && (
                            <>
                              <button
                                onClick={() => toggleSelectTransaction(transaction.id)}
                                className="p-2 hover:bg-green-100 rounded-lg transition-colors"
                                style={{ color: selectedTransactions.has(transaction.id) ? THEME.success : THEME.primary }}
                                title="Zaznacz do edycji"
                              >
                                <CheckSquare size={iconSize} />
                              </button>
                              <button
                                onClick={() => handleStartEditDescription(transaction)}
                                className="p-2 hover:bg-blue-100 rounded-lg transition-colors"
                                style={{ color: THEME.primary }}
                                title="Edytuj opis"
                              >
                                <Edit2 size={iconSize} />
                              </button>
                              {transaction.category !== 'Transfer' && (
                                <button
                                  onClick={() => {
                                    setConvertingTransactionId(transaction.id);
                                    setShowConvertTransfer(true);
                                  }}
                                  className="p-2 hover:bg-blue-100 rounded-lg transition-colors"
                                  style={{ color: THEME.primary }}
                                  title="Konwertuj na Przelew"
                                >
                                  <ArrowLeftRight size={iconSize} />
                                </button>
                              )}
                              {/* Link to Debt button - only for expenses not already linked */}
                              {transaction.amount < 0 &&
                               transaction.category !== 'Transfer' &&
                               !transactionDebtLinks[transaction.id] && (
                                <button
                                  onClick={() => handleLinkToDebt(transaction)}
                                  className="p-2 hover:bg-purple-100 rounded-lg transition-colors"
                                  style={{ color: '#6366f1' }}
                                  title="Połącz z Długiem"
                                >
                                  <CreditCard size={iconSize} />
                                </button>
                              )}
                              <button
                                onClick={() => setDeleteConfirm({ show: true, type: 'transaction', id: transaction.id, name: transaction.description })}
                                className="p-2 hover:bg-red-100 rounded-lg transition-colors"
                                style={{ color: THEME.danger }}
                                title="Usuń transakcję"
                              >
                                <Trash2 size={iconSize} />
                              </button>
                            </>
                          )}
                        </div>

                        {/* Main Content: Checkbox + Icon + Description + Amount */}
                        <div className="flex items-center gap-3 mb-2">
                          {/* Checkbox - Only show when in selection mode */}
                          {selectedTransactions.size > 0 && (
                            <div className="flex-shrink-0">
                              <input
                                type="checkbox"
                                checked={selectedTransactions.has(transaction.id)}
                                onChange={() => toggleSelectTransaction(transaction.id)}
                                className="cursor-pointer w-4 h-4 rounded border-gray-300"
                              />
                            </div>
                          )}

                          {/* Icon */}
                          <div className="flex-shrink-0">
                            <CategoryIconSelector
                              transaction={transaction}
                              categories={categories}
                              onCategoryChange={onCategoryChange}
                              onAddCategory={onAddCategory}
                            />
                          </div>

                          {/* Description with inline editing */}
                          <div className="flex-1 min-w-0">
                            {editingDescriptionId === transaction.id ? (
                              <div className="flex items-center gap-2">
                                <input
                                  type="text"
                                  value={editingDescription}
                                  onChange={(e) => setEditingDescription(e.target.value)}
                                  className="flex-1 px-3 py-1.5 border-2 rounded-lg focus:ring-2 focus:border-transparent text-base"
                                  style={{ borderColor: THEME.primary }}
                                  onKeyDown={(e) => {
                                    if (e.key === 'Enter') handleSaveDescription(transaction.id);
                                    if (e.key === 'Escape') handleCancelEditDescription();
                                  }}
                                  autoFocus
                                />
                                <button
                                  onClick={() => handleSaveDescription(transaction.id)}
                                  className="p-2 bg-green-100 hover:bg-green-200 rounded-lg transition-colors"
                                  title="Zapisz"
                                >
                                  <Check size={iconSize} style={{ color: THEME.success }} />
                                </button>
                                <button
                                  onClick={handleCancelEditDescription}
                                  className="p-2 bg-red-100 hover:bg-red-200 rounded-lg transition-colors"
                                  title="Anuluj"
                                >
                                  <X size={iconSize} style={{ color: THEME.danger }} />
                                </button>
                              </div>
                            ) : (
                              <p className="font-semibold text-gray-800 text-base leading-tight break-words">
                                {transaction.description}
                              </p>
                            )}
                          </div>

                          {/* Amount */}
                          {editingDescriptionId !== transaction.id && (
                            <div className="flex-shrink-0">
                              <span
                                className="text-xl font-bold whitespace-nowrap"
                                style={{ color: transaction.amount > 0 ? THEME.success : THEME.danger }}
                              >
                                {formatCurrency(transaction.amount)}
                              </span>
                            </div>
                          )}
                        </div>

                        {/* Secondary Info: Date + Badges */}
                        {editingDescriptionId !== transaction.id && (
                          <div className={`flex items-center gap-2 ${selectedTransactions.size > 0 ? 'ml-[76px]' : 'ml-12'}`}>
                            <span className="text-xs text-gray-500">
                              Created: {transaction.date}
                            </span>
                            {/* Debt Payment Indicator */}
                            {transactionDebtLinks[transaction.id] && (
                              <>
                                <span className="text-gray-300">•</span>
                                <span
                                  className="text-xs font-medium px-2 py-0.5 rounded-full whitespace-nowrap flex items-center gap-1"
                                  style={{
                                    backgroundColor: '#6366f120',
                                    color: '#6366f1',
                                    border: '1px solid #6366f140',
                                  }}
                                  title={`Połączone z: ${transactionDebtLinks[transaction.id].debt_name}`}
                                >
                                  <CreditCard size={iconSizeSmall} />
                                  <span>{transactionDebtLinks[transaction.id].debt_name}</span>
                                </span>
                              </>
                            )}
                          </div>
                        )}
                      </div>
                    )
                  ))}
                </div>
              </>
            )}
          </>
        )}
      </div>

      {/* Mobile Selection Mode Toolbar */}
      {isMobile && isSelectionMode && (
        <SelectionModeToolbar
          selectedCount={selectedTransactionIds.size}
          totalCount={filteredTransactions.length}
          onSelectAll={handleSelectAll}
          onDeselectAll={handleDeselectAll}
          onBulkEdit={handleBulkEditFromToolbar}
          onCancel={handleCancelSelection}
        />
      )}

      {/* Mobile Transaction Edit Modal */}
      {editingTransaction && (
        <TransactionEditModal
          isOpen={!!editingTransaction}
          onClose={() => setEditingTransaction(null)}
          transaction={editingTransaction}
          categories={categories}
          accounts={accounts}
          onSave={handleSaveEdit}
        />
      )}

      {/* Bulk Edit Modal */}
      {showBulkEdit && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <h3 className="text-xl font-bold text-gray-800 mb-4">
              Edycja Zbiorcza ({selectedTransactions.size > 0 ? selectedTransactions.size : selectedTransactionIds.size} transakcji)
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Kategoria (zostaw puste aby zachować obecną)
                </label>
                <select
                  value={bulkEditData.category}
                  onChange={(e) => setBulkEditData({ ...bulkEditData, category: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:border-transparent"
                >
                  <option value="">Nie zmieniaj</option>
                  {categories.map((cat) => (
                    <option key={cat.name} value={cat.name}>{cat.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Data (zostaw puste aby zachować obecną)
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
                  Opis (zostaw puste aby zachować obecny)
                </label>
                <input
                  type="text"
                  value={bulkEditData.description}
                  onChange={(e) => setBulkEditData({ ...bulkEditData, description: e.target.value })}
                  placeholder="Nowy opis dla wszystkich zaznaczonych"
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
                Aktualizuj Wszystkie
              </button>
              <button
                onClick={() => {
                  setShowBulkEdit(false);
                  setBulkEditData({ category: '', date: '', description: '' });
                  setIsSelectionMode(false);
                  setSelectedTransactionIds(new Set());
                }}
                className="flex-1 px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg font-medium transition-colors"
              >
                Anuluj
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Convert to Transfer Modal */}
      {showConvertTransfer && (() => {
        const convertingTransaction = filteredTransactions.find(t => t.id === convertingTransactionId);
        const sourceAccountId = convertingTransaction?.account_id;
        const availableAccounts = accounts.filter(account => account.id !== sourceAccountId);

        return (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
              <h3 className="text-xl font-bold text-gray-800 mb-4">
                Konwertuj na Przelew
              </h3>
              <p className="text-sm text-gray-600 mb-4">
                Spowoduje to utworzenie powiązanej transakcji na koncie docelowym i oznaczenie obu jako przelewy.
              </p>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Konto Docelowe *
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
                    <option value="">Wybierz konto...</option>
                    {availableAccounts.map((account) => (
                      <option key={account.id} value={account.id}>
                        {account.name} ({account.type})
                      </option>
                    ))}
                  </select>
                  {availableAccounts.length === 0 && (
                    <p className="text-sm text-red-600 mt-2">
                      Brak dostępnych kont docelowych. Musisz mieć co najmniej dwa konta.
                    </p>
                  )}
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
                  Anuluj
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* Link Debt Payment Modal */}
      {showLinkDebtModal && linkingTransaction && (
        <LinkDebtPaymentModal
          transaction={linkingTransaction}
          debts={debts}
          onLink={handleConfirmLinkToDebt}
          onClose={() => {
            setShowLinkDebtModal(false);
            setLinkingTransaction(null);
          }}
        />
      )}
    </>
  );
};

export default TransactionsTab;
