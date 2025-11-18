import React, { useMemo, useState, useEffect } from 'react';
import { PlusCircle, TrendingUp, TrendingDown, DollarSign, Wallet, Calendar, Trash2, Upload, AlertTriangle, Activity, Target, Settings, ChevronDown, ChevronUp } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, BarChart, Bar } from 'recharts';
import { THEME } from '../../config/theme';
import { formatCurrency } from '../../utils/formatters';
import CategorySelector from '../CategorySelector';
import CategoryIconSelector from '../CategoryIconSelector';
import { BudgetForecaster } from '../../utils/budgetForecasting';
import { useMobile } from '../../hooks/useMobile';
import MobileModal from '../ui/MobileModal';
import { AmountInput, DateInput, SelectInput, TextInput } from '../ui/MobileInput';

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
  spendingByBudgetPeriod,
  categorySpendingData,
  monthlyData,
  showAddTransaction,
  setShowAddTransaction,
  newTransaction,
  setNewTransaction,
  handleAddTransaction,
  setDeleteConfirm,
  setShowCSVImport,
  setActiveTab,
  onCategoryChange,
  onAddCategory
}) => {
  const COLORS = THEME.chartColors;

  // Mobile optimizations
  const { isMobile, iconSize, iconSizeSmall } = useMobile();

  // Show only last 5 transactions on dashboard (UX audit recommendation)
  const displayedTransactions = filteredTransactions.slice(0, 5);
  const hasMoreTransactions = filteredTransactions.length > 5;

  // Prediction settings state
  const [showPredictionSettings, setShowPredictionSettings] = useState(false);
  const [selectedPredictionCategories, setSelectedPredictionCategories] = useState([]);

  // Load prediction preferences from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('predictionCategories');
    if (saved) {
      try {
        setSelectedPredictionCategories(JSON.parse(saved));
      } catch (e) {
        console.error('Failed to load prediction preferences:', e);
      }
    }
  }, []);

  // Save prediction preferences to localStorage
  useEffect(() => {
    if (selectedPredictionCategories.length > 0) {
      localStorage.setItem('predictionCategories', JSON.stringify(selectedPredictionCategories));
    }
  }, [selectedPredictionCategories]);

  // Get all categories with spending, sorted by amount
  const categoriesWithSpending = useMemo(() => {
    const spending = {};
    filteredTransactions.forEach(t => {
      if (t.category && t.category !== 'Transfer' && t.amount < 0) {
        spending[t.category] = (spending[t.category] || 0) + Math.abs(t.amount);
      }
    });

    return Object.entries(spending)
      .sort((a, b) => b[1] - a[1])
      .map(([category, amount]) => ({ category, amount }));
  }, [filteredTransactions]);

  // Get AI forecasting insights
  const insights = useMemo(() => {
    return BudgetForecaster.getSpendingInsights(filteredTransactions, budgets, categories);
  }, [filteredTransactions, budgets, categories]);

  // Filter predictions based on user selection
  const displayedPredictions = useMemo(() => {
    // Always filter out predictions with insufficient data
    const validPredictions = insights.predictions.filter(p =>
      p.trend !== 'insufficient_data' &&
      p.forecast > 0 &&
      p.historicalAverage !== undefined
    );

    if (selectedPredictionCategories.length === 0) {
      // If no categories selected, show top 5 by spending
      const topCategories = categoriesWithSpending.slice(0, 5).map(c => c.category);
      return validPredictions.filter(p => topCategories.includes(p.category));
    }
    // Show only selected categories
    return validPredictions.filter(p => selectedPredictionCategories.includes(p.category));
  }, [insights.predictions, selectedPredictionCategories, categoriesWithSpending]);

  // Toggle category selection
  const togglePredictionCategory = (category) => {
    setSelectedPredictionCategories(prev => {
      if (prev.includes(category)) {
        return prev.filter(c => c !== category);
      } else {
        return [...prev, category];
      }
    });
  };

  // Select all categories
  const selectAllPredictionCategories = () => {
    setSelectedPredictionCategories(categoriesWithSpending.map(c => c.category));
  };

  // Clear all selections
  const clearPredictionCategories = () => {
    setSelectedPredictionCategories([]);
  };

  return (
    <>
      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="bg-white rounded-2xl shadow-lg p-4 sm:p-6" style={{ borderLeft: `4px solid ${THEME.success}` }}>
          <div className="flex items-center justify-between mb-2">
            <span className="text-gray-600 text-sm font-medium">
              Całkowity Przychód {hasActiveFilters && <span className="text-xs">(Filtrowane)</span>}
            </span>
            <TrendingUp style={{ color: THEME.success }} size={iconSize} />
          </div>
          <p className="text-2xl sm:text-3xl font-bold text-gray-800">{formatCurrency(totalIncome)}</p>
          {hasActiveFilters && (
            <p className="text-xs text-gray-500 mt-1">
              {filteredTransactions.filter(t => t.amount > 0 && t.category !== 'Transfer').length} transakcj(e/i)
            </p>
          )}
        </div>

        <div className="bg-white rounded-2xl shadow-lg p-4 sm:p-6" style={{ borderLeft: `4px solid ${THEME.danger}` }}>
          <div className="flex items-center justify-between mb-2">
            <span className="text-gray-600 text-sm font-medium">
              Całkowite Wydatki {hasActiveFilters && <span className="text-xs">(Filtrowane)</span>}
            </span>
            <TrendingDown style={{ color: THEME.danger }} size={iconSize} />
          </div>
          <p className="text-2xl sm:text-3xl font-bold text-gray-800">{formatCurrency(totalExpenses)}</p>
          {hasActiveFilters && (
            <p className="text-xs text-gray-500 mt-1">
              {filteredTransactions.filter(t => t.amount < 0 && t.category !== 'Transfer').length} transakcj(e/i)
            </p>
          )}
        </div>

        <div className="bg-white rounded-2xl shadow-lg p-4 sm:p-6" style={{ borderLeft: `4px solid ${THEME.primary}` }}>
          <div className="flex items-center justify-between mb-2">
            <span className="text-gray-600 text-sm font-medium">
              Saldo Konta
            </span>
            <Wallet style={{ color: THEME.primary }} size={iconSize} />
          </div>
          <p className="text-2xl sm:text-3xl font-bold" style={{ color: totalAccountBalance >= 0 ? THEME.success : THEME.danger }}>
            {formatCurrency(totalAccountBalance)}
          </p>
          <p className="text-xs text-gray-500 mt-1">
            {accounts.filter(a => a.type !== 'savings').length} kont(o/a)
          </p>
        </div>

        <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl shadow-lg p-4 sm:p-6 border-2 border-green-200">
          <div className="flex items-center justify-between mb-2">
            <span className="text-gray-700 text-sm font-medium">
              Całkowite Oszczędności
            </span>
            <DollarSign style={{ color: THEME.success }} size={iconSize} />
          </div>
          <p className="text-2xl sm:text-3xl font-bold" style={{ color: THEME.success }}>
            {formatCurrency(totalSavings)}
          </p>
          <p className="text-xs text-gray-600 mt-1">
            {savingsAccounts.length} kont(o/a) oszczędnościow(ych/e)
          </p>
        </div>
      </div>

      {/* Budget Warnings - Top 2 Only (UX audit recommendation) */}
      {insights.budgetWarnings.length > 0 && (
        <div className="bg-gradient-to-br from-red-50 to-orange-50 rounded-2xl shadow-lg p-4 sm:p-6 mb-8 border-2 border-red-200">
          <div className="flex items-center gap-3 mb-4">
            <AlertTriangle style={{ color: THEME.danger }} size={28} />
            <h3 className="text-lg sm:text-xl font-bold text-gray-800">Ostrzeżenia Budżetowe</h3>
            {insights.budgetWarnings.length > 2 && (
              <span className="text-xs bg-red-100 text-red-700 px-2 py-1 rounded-full font-medium">
                +{insights.budgetWarnings.length - 2} więcej
              </span>
            )}
          </div>
          <div className="space-y-3">
            {insights.budgetWarnings.slice(0, 2).map((warning, index) => (
              <div key={index} className="bg-white rounded-xl p-4 border-l-4" style={{ borderColor: THEME.danger }}>
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div className="flex-1">
                    <p className="font-semibold text-gray-800 text-base">{warning.budget}</p>
                    <p className="text-sm text-gray-600 mt-1">{warning.recommendation}</p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-xl font-bold" style={{ color: THEME.danger }}>
                      {formatCurrency(warning.projectedAmount)}
                    </p>
                    <p className="text-xs text-gray-500">przewidywane</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mt-3 text-xs">
                  <div className="bg-gray-50 rounded p-2">
                    <p className="text-gray-600">Obecne wydatki</p>
                    <p className="font-bold text-gray-800">{formatCurrency(warning.currentSpending)}</p>
                  </div>
                  <div className="bg-gray-50 rounded p-2">
                    <p className="text-gray-600">Przekroczenie</p>
                    <p className="font-bold" style={{ color: THEME.danger }}>
                      {formatCurrency(warning.projectedOverage)}
                    </p>
                  </div>
                  {warning.daysUntilOverrun > 0 && (
                    <div className="bg-gray-50 rounded p-2">
                      <p className="text-gray-600">Dni do przekroczenia</p>
                      <p className="font-bold text-gray-800">{warning.daysUntilOverrun}</p>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
          {insights.budgetWarnings.length > 2 && (
            <div className="mt-4 text-center">
              <button
                onClick={() => setActiveTab('analytics')}
                className="text-sm font-medium px-4 py-2 rounded-lg hover:bg-red-100 transition-colors"
                style={{ color: THEME.danger }}
              >
                Zobacz wszystkie ostrzeżenia →
              </button>
            </div>
          )}
        </div>
      )}

      {/* NOTE: Prediction Settings, AI Forecasts, and Anomaly Detection moved to Analytics tab per UX audit */}

      {/* Prediction Settings - HIDDEN (Moved to Analytics) */}
      {false && categoriesWithSpending.length > 0 && (
        <div className="bg-white rounded-2xl shadow-lg p-4 sm:p-6 mb-8">
          <button
            onClick={() => setShowPredictionSettings(!showPredictionSettings)}
            className="w-full flex justify-between items-center mb-2"
          >
            <div className="flex items-center gap-3">
              <Settings style={{ color: THEME.primary }} size={24} />
              <h3 className="text-lg sm:text-xl font-bold text-gray-800">Ustawienia Prognoz</h3>
              {selectedPredictionCategories.length > 0 && (
                <span className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded-full font-medium">
                  {selectedPredictionCategories.length} wybran(ych/e)
                </span>
              )}
            </div>
            {showPredictionSettings ? <ChevronUp size={24} /> : <ChevronDown size={24} />}
          </button>

          {showPredictionSettings && (
            <div className="mt-4">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-4">
                <p className="text-sm text-gray-600">
                  Wybierz kategorie, dla których chcesz widzieć prognozy wydatków
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={selectAllPredictionCategories}
                    className="text-xs font-medium px-3 py-1.5 rounded-lg hover:bg-gray-100 transition-colors"
                    style={{ color: THEME.primary }}
                  >
                    Zaznacz wszystkie
                  </button>
                  <button
                    onClick={clearPredictionCategories}
                    className="text-xs font-medium px-3 py-1.5 rounded-lg hover:bg-gray-100 text-gray-600 transition-colors"
                  >
                    Wyczyść
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {categoriesWithSpending.map(({ category, amount }) => {
                  const prediction = insights.predictions.find(p => p.category === category);
                  const hasEnoughData = prediction && prediction.confidence !== 'insufficient_data';
                  const isSelected = selectedPredictionCategories.includes(category);

                  return (
                    <button
                      key={category}
                      onClick={() => hasEnoughData && togglePredictionCategory(category)}
                      disabled={!hasEnoughData}
                      className={`flex items-center justify-between p-3 rounded-lg border-2 transition-all ${
                        !hasEnoughData
                          ? 'bg-gray-50 border-gray-200 opacity-50 cursor-not-allowed'
                          : isSelected
                          ? 'bg-purple-50 border-purple-400 shadow-md'
                          : 'bg-white border-gray-200 hover:border-purple-300 hover:bg-purple-50'
                      }`}
                    >
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          disabled={!hasEnoughData}
                          onChange={() => {}}
                          className="cursor-pointer flex-shrink-0"
                        />
                        <div className="flex-1 min-w-0 text-left">
                          <p className="font-semibold text-gray-800 text-sm truncate">{category}</p>
                          <p className="text-xs text-gray-500">
                            {hasEnoughData ? formatCurrency(amount) : 'Brak danych'}
                          </p>
                        </div>
                      </div>
                      {hasEnoughData && prediction && (
                        <div className="text-right flex-shrink-0 ml-2">
                          <p className="text-xs font-bold text-purple-600">
                            {formatCurrency(prediction.forecast)}
                          </p>
                          <p className="text-xs text-gray-500">prognoza</p>
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>

              {selectedPredictionCategories.length === 0 && (
                <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <p className="text-sm text-blue-700">
                    💡 <strong>Wskazówka:</strong> Nie wybrano żadnych kategorii. Domyślnie wyświetlane są top 5 kategorii według wydatków.
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* AI Spending Forecasts - HIDDEN (Moved to Analytics) */}
      {false && displayedPredictions.length > 0 && (
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <Activity style={{ color: THEME.primary }} size={24} />
            <h3 className="text-lg sm:text-xl font-bold text-gray-800">Prognoza Wydatków AI</h3>
            <span className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded-full font-medium">
              {selectedPredictionCategories.length > 0
                ? `${displayedPredictions.length} wybran(ych/e)`
                : 'Top 5 kategorii'}
            </span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {displayedPredictions.map((prediction, index) => {
              const trendIcon = prediction.trend === 'increasing' ? '📈' : prediction.trend === 'decreasing' ? '📉' : '➡️';
              const trendColor = prediction.trend === 'increasing' ? THEME.danger : prediction.trend === 'decreasing' ? THEME.success : THEME.primary;

              return (
                <div
                  key={index}
                  className="bg-gradient-to-br from-purple-50 to-indigo-50 rounded-2xl shadow-lg p-4 sm:p-6 border-2 border-purple-200"
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-700">{prediction.category}</span>
                    <Target style={{ color: THEME.primary }} size={20} />
                  </div>
                  <p className="text-2xl sm:text-3xl font-bold text-purple-600 mb-1">
                    {formatCurrency(prediction.forecast)}
                  </p>
                  <div className="flex items-center gap-2 text-xs text-gray-600 mb-3">
                    <span className="text-lg">{trendIcon}</span>
                    <span style={{ color: trendColor }} className="font-medium">
                      {prediction.trend === 'increasing' ? 'Wzrost' : prediction.trend === 'decreasing' ? 'Spadek' : 'Stabilne'}
                    </span>
                    <span>•</span>
                    <span className={`font-medium ${
                      prediction.confidence === 'high' ? 'text-green-600' :
                      prediction.confidence === 'medium' ? 'text-yellow-600' : 'text-gray-500'
                    }`}>
                      {prediction.confidence === 'high' ? 'Wysoka pewność' :
                       prediction.confidence === 'medium' ? 'Średnia pewność' : 'Niska pewność'}
                    </span>
                  </div>
                  <p className="text-xs text-gray-600">
                    Średnia historyczna: {formatCurrency(prediction.historicalAverage)}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Anomaly Detection - HIDDEN (Moved to Analytics) */}
      {false && insights.anomalies.length > 0 && (
        <div className="bg-gradient-to-br from-yellow-50 to-amber-50 rounded-2xl shadow-lg p-4 sm:p-6 mb-8 border-2 border-yellow-300">
          <div className="flex items-center gap-3 mb-4">
            <AlertTriangle style={{ color: THEME.warning }} size={24} />
            <h3 className="text-lg sm:text-xl font-bold text-gray-800">Nietypowe Wydatki</h3>
            <span className="text-xs bg-yellow-200 text-yellow-800 px-2 py-1 rounded-full font-medium">
              Ostatnie 30 dni
            </span>
          </div>
          <div className="space-y-3">
            {insights.anomalies.map((anomaly, index) => (
              <div key={index} className="bg-white rounded-xl p-4 border-l-4" style={{ borderColor: THEME.warning }}>
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1">
                    <p className="font-semibold text-gray-800">{anomaly.transaction.description}</p>
                    <p className="text-sm text-gray-600 mt-1">{anomaly.message}</p>
                    <p className="text-xs text-gray-500 mt-1">
                      {anomaly.transaction.date} • {anomaly.transaction.category}
                    </p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-lg font-bold" style={{ color: THEME.danger }}>
                      {formatCurrency(anomaly.transaction.amount)}
                    </p>
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      anomaly.severity === 'high' ? 'bg-red-100 text-red-700' : 'bg-orange-100 text-orange-700'
                    }`}>
                      {anomaly.severity === 'high' ? 'Wysoka' : 'Średnia'}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Transactions */}
      <div className="bg-white rounded-2xl shadow-lg p-4 sm:p-6 mb-8">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <h2 className="text-xl sm:text-2xl font-bold text-gray-800">Ostatnie Transakcje</h2>
          <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
            <button
              onClick={() => setShowCSVImport(true)}
              className="flex items-center justify-center gap-2 px-4 py-3 rounded-lg transition-colors font-medium border-2 w-full sm:w-auto touch-manipulation"
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
              <Upload size={iconSize} />
              <span className="hidden sm:inline">Importuj CSV</span>
              <span className="sm:hidden">Import</span>
            </button>
            <button
              onClick={() => setShowAddTransaction(!showAddTransaction)}
              className="flex items-center justify-center gap-2 px-4 py-3 rounded-lg transition-colors font-medium text-white w-full sm:w-auto touch-manipulation"
              style={{ backgroundColor: THEME.primary }}
              onMouseOver={(e) => e.currentTarget.style.backgroundColor = THEME.primaryHover}
              onMouseOut={(e) => e.currentTarget.style.backgroundColor = THEME.primary}
            >
              <PlusCircle size={iconSize} />
              <span className="hidden sm:inline">Dodaj Transakcję</span>
              <span className="sm:hidden">Dodaj</span>
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
                  <option value="">Bez Kategorii</option>
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

        {/* Transaction List */}
        <div className="space-y-3">
          {filteredTransactions.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <p className="text-lg">Nie znaleziono transakcji</p>
              <p className="text-sm">Spróbuj dostosować filtry lub dodaj nową transakcję</p>
            </div>
          ) : (
            <>
              {displayedTransactions.map((transaction) => (
                <div
                  key={transaction.id}
                  className="relative bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors p-4 pb-3"
                >
                  {/* Delete Button - Absolute positioned in top-right */}
                  <button
                    onClick={() => setDeleteConfirm({ show: true, type: 'transaction', id: transaction.id, name: transaction.description })}
                    className="absolute top-2 right-2 md:top-3 md:right-3 transition-colors p-2 hover:bg-red-100 rounded-lg touch-manipulation z-10"
                    style={{ color: THEME.danger }}
                    onMouseOver={(e) => e.currentTarget.style.color = THEME.dangerHover}
                    onMouseOut={(e) => e.currentTarget.style.color = THEME.danger}
                  >
                    <Trash2 size={iconSize} />
                  </button>

                  {/* Row 1: Icon + Description (with space for delete button) */}
                  <div className="flex items-start gap-2 md:gap-3 mb-3 pr-14 md:pr-16">
                    <div className="flex-shrink-0 pt-1">
                      <CategoryIconSelector
                        transaction={transaction}
                        categories={categories}
                        onCategoryChange={onCategoryChange}
                        onAddCategory={onAddCategory}
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-gray-800 text-sm md:text-base leading-tight break-words">
                        {transaction.description}
                      </p>
                    </div>
                  </div>

                  {/* Row 2: Amount (large, prominent, with clearance for button) */}
                  <div className="mb-2 pr-14 md:pr-16">
                    <span
                      className="text-2xl md:text-xl font-bold block"
                      style={{ color: transaction.amount > 0 ? THEME.success : THEME.danger }}
                    >
                      {formatCurrency(transaction.amount)}
                    </span>
                  </div>

                  {/* Row 3: Date and Category Badge */}
                  <div className="flex items-center gap-2 md:gap-3 flex-wrap pr-14 md:pr-16">
                    <span className="flex items-center gap-1 text-xs text-gray-600">
                      <Calendar size={iconSizeSmall} />
                      <span>{transaction.date}</span>
                    </span>
                    <span className="text-xs font-medium px-2 py-1 rounded-full whitespace-nowrap" style={{
                      backgroundColor: transaction.amount > 0 ? THEME.successLight : THEME.dangerLight,
                      color: transaction.amount > 0 ? THEME.success : THEME.danger
                    }}>
                      {transaction.amount > 0 ? 'Przychód' : 'Wydatek'}
                    </span>
                  </div>
                </div>
              ))}

              {/* Show More Button */}
              {hasMoreTransactions && (
                <div className="text-center pt-4">
                  <button
                    onClick={() => setActiveTab('transactions')}
                    className="w-full sm:w-auto px-6 py-3 rounded-lg transition-colors font-medium"
                    style={{
                      backgroundColor: THEME.primaryLight,
                      color: THEME.primary,
                      border: `2px solid ${THEME.primary}`
                    }}
                    onMouseOver={(e) => {
                      e.currentTarget.style.backgroundColor = THEME.primary;
                      e.currentTarget.style.color = 'white';
                    }}
                    onMouseOut={(e) => {
                      e.currentTarget.style.backgroundColor = THEME.primaryLight;
                      e.currentTarget.style.color = THEME.primary;
                    }}
                  >
                    <span className="hidden sm:inline">Pokaż Więcej Transakcji ({filteredTransactions.length - 10} więcej)</span>
                    <span className="sm:hidden">Więcej ({filteredTransactions.length - 10})</span>
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Budget Categories */}
      <div className="bg-white rounded-2xl shadow-lg p-4 sm:p-6">
        <h2 className="text-xl sm:text-2xl font-bold text-gray-800 mb-6">
          Przegląd Budżetu {hasActiveFilters && <span className="text-sm text-gray-500">(Filtrowane)</span>}
        </h2>
        <div className="space-y-4">
          {budgets
            .filter(budget => selectedCategories.length === 0 || selectedCategories.includes(budget.category))
            .map((budget) => {
            const actualSpent = spendingByBudgetPeriod[budget.category] || 0;

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
    </>
  );
};

export default DashboardTab;
