import React, { useState, useMemo } from 'react';
import {
  TrendingUp, TrendingDown, Activity, Calendar, DollarSign, Target,
  PieChart, BarChart3, AlertCircle, CheckCircle, Info, ArrowUpRight, ArrowDownRight
} from 'lucide-react';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { formatCurrency } from '../../utils/formatters';
import { THEME } from '../../config/theme';
import {
  calculateNetWorth,
  calculateSavingsRate,
  calculateDebtToIncomeRatio,
  calculateBudgetAdherenceScore,
  calculateFinancialHealthScore,
  getMonthlyData,
  calculateYoYComparison,
  getSpendingPatterns,
  getSpendingTrends,
  compareDateRanges
} from '../../utils/analyticsCalculations';

const AnalyticsTab = ({
  transactions = [],
  budgets = [],
  accounts = [],
  debts = [],
  savingsGoals = []
}) => {
  const [comparisonMode, setComparisonMode] = useState('yoy'); // 'yoy' or 'custom'
  const [customRange1, setCustomRange1] = useState({
    start: new Date(new Date().setMonth(new Date().getMonth() - 1)).toISOString().split('T')[0],
    end: new Date().toISOString().split('T')[0]
  });
  const [customRange2, setCustomRange2] = useState({
    start: new Date(new Date().setMonth(new Date().getMonth() - 2)).toISOString().split('T')[0],
    end: new Date(new Date().setMonth(new Date().getMonth() - 1)).toISOString().split('T')[0]
  });

  // Calculate metrics
  const netWorth = useMemo(() => calculateNetWorth(accounts, debts), [accounts, debts]);

  const totalAssets = useMemo(() =>
    accounts.reduce((sum, acc) => sum + acc.balance, 0),
    [accounts]
  );

  const totalLiabilities = useMemo(() =>
    debts.filter(d => d.is_active).reduce((sum, d) => sum + parseFloat(d.current_balance || 0), 0),
    [debts]
  );

  // Calculate monthly income/expenses for last 30 days
  const last30Days = useMemo(() => {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    return transactions.filter(t => new Date(t.date) >= thirtyDaysAgo);
  }, [transactions]);

  const monthlyMetrics = useMemo(() => {
    let income = 0;
    let expenses = 0;
    last30Days.forEach(t => {
      if (t.amount > 0) income += t.amount;
      else expenses += Math.abs(t.amount);
    });
    return { income, expenses };
  }, [last30Days]);

  const savingsRate = useMemo(() =>
    calculateSavingsRate(monthlyMetrics.income, -monthlyMetrics.expenses),
    [monthlyMetrics]
  );

  const monthlyDebtPayments = useMemo(() =>
    debts.filter(d => d.is_active).reduce((sum, d) => sum + parseFloat(d.installment_amount || 0), 0),
    [debts]
  );

  const debtToIncomeRatio = useMemo(() =>
    calculateDebtToIncomeRatio(monthlyDebtPayments, monthlyMetrics.income),
    [monthlyDebtPayments, monthlyMetrics.income]
  );

  const budgetAdherenceScore = useMemo(() =>
    calculateBudgetAdherenceScore(budgets),
    [budgets]
  );

  const hasEmergencyFund = useMemo(() =>
    savingsGoals.some(g =>
      (g.category === 'Fundusz awaryjny' || g.category === 'Emergency Fund') &&
      g.is_active &&
      parseFloat(g.current_amount || 0) >= monthlyMetrics.expenses * 3
    ),
    [savingsGoals, monthlyMetrics.expenses]
  );

  const financialHealthScore = useMemo(() =>
    calculateFinancialHealthScore({
      savingsRate,
      debtToIncomeRatio,
      budgetAdherenceScore,
      hasEmergencyFund,
      netWorth
    }),
    [savingsRate, debtToIncomeRatio, budgetAdherenceScore, hasEmergencyFund, netWorth]
  );

  // Monthly data for charts
  const monthlyData = useMemo(() => getMonthlyData(transactions), [transactions]);

  // Year-over-year comparison
  const yoyComparison = useMemo(() => calculateYoYComparison(transactions), [transactions]);

  // Spending patterns
  const spendingPatterns = useMemo(() => getSpendingPatterns(transactions), [transactions]);

  // Spending trends
  const spendingTrends = useMemo(() => getSpendingTrends(transactions, 3), [transactions]);

  // Custom date range comparison
  const customComparison = useMemo(() =>
    compareDateRanges(transactions, customRange1, customRange2),
    [transactions, customRange1, customRange2]
  );

  // Get health score color
  const getHealthScoreColor = (score) => {
    if (score >= 80) return THEME.success;
    if (score >= 60) return THEME.primary;
    if (score >= 40) return THEME.warning;
    return THEME.danger;
  };

  // Get health score label
  const getHealthScoreLabel = (score) => {
    if (score >= 80) return 'Doskonałe';
    if (score >= 60) return 'Dobre';
    if (score >= 40) return 'Przeciętne';
    return 'Wymaga uwagi';
  };

  // Format chart data for net worth over time
  const netWorthChartData = useMemo(() => {
    return monthlyData.map(month => ({
      month: month.month,
      'Wartość netto': month.net
    }));
  }, [monthlyData]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-2xl shadow-lg p-4 sm:p-6">
        <h2 className="text-xl sm:text-2xl font-bold text-gray-800 mb-2">Zaawansowana Analityka</h2>
        <p className="text-sm text-gray-600">
          Szczegółowy przegląd Twojego zdrowia finansowego i trendów
        </p>
      </div>

      {/* Financial Health Score */}
      <div className="bg-white rounded-2xl shadow-lg p-6">
        <div className="flex items-center gap-3 mb-6">
          <Activity size={24} style={{ color: THEME.primary }} />
          <h3 className="text-lg font-bold text-gray-800">Wskaźnik Zdrowia Finansowego</h3>
        </div>

        <div className="flex flex-col items-center mb-6">
          <div className="relative w-48 h-48">
            <svg className="transform -rotate-90 w-48 h-48">
              <circle
                cx="96"
                cy="96"
                r="80"
                stroke="#e5e7eb"
                strokeWidth="12"
                fill="none"
              />
              <circle
                cx="96"
                cy="96"
                r="80"
                stroke={getHealthScoreColor(financialHealthScore)}
                strokeWidth="12"
                fill="none"
                strokeDasharray={`${(financialHealthScore / 100) * 502.4} 502.4`}
                strokeLinecap="round"
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <div className="text-5xl font-bold" style={{ color: getHealthScoreColor(financialHealthScore) }}>
                {financialHealthScore}
              </div>
              <div className="text-sm text-gray-600 mt-1">
                {getHealthScoreLabel(financialHealthScore)}
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-4 bg-gray-50 rounded-lg">
            <div className="text-xs text-gray-600 mb-1">Stopa oszczędności</div>
            <div className="text-2xl font-bold text-gray-800">{savingsRate.toFixed(1)}%</div>
            <div className="text-xs mt-1" style={{ color: savingsRate >= 20 ? THEME.success : THEME.warning }}>
              {savingsRate >= 20 ? 'Doskonałe!' : savingsRate >= 10 ? 'Dobre' : 'Wymaga poprawy'}
            </div>
          </div>
          <div className="p-4 bg-gray-50 rounded-lg">
            <div className="text-xs text-gray-600 mb-1">Wskaźnik zadłużenia</div>
            <div className="text-2xl font-bold text-gray-800">{debtToIncomeRatio.toFixed(1)}%</div>
            <div className="text-xs mt-1" style={{ color: debtToIncomeRatio < 20 ? THEME.success : THEME.warning }}>
              {debtToIncomeRatio < 20 ? 'Doskonałe!' : debtToIncomeRatio < 35 ? 'Dobre' : 'Wysokie'}
            </div>
          </div>
          <div className="p-4 bg-gray-50 rounded-lg">
            <div className="text-xs text-gray-600 mb-1">Przestrzeganie budżetu</div>
            <div className="text-2xl font-bold text-gray-800">{budgetAdherenceScore}%</div>
            <div className="text-xs mt-1" style={{ color: budgetAdherenceScore >= 80 ? THEME.success : THEME.warning }}>
              {budgetAdherenceScore >= 80 ? 'Świetnie!' : 'Można lepiej'}
            </div>
          </div>
          <div className="p-4 bg-gray-50 rounded-lg">
            <div className="text-xs text-gray-600 mb-1">Fundusz awaryjny</div>
            <div className="text-2xl font-bold text-gray-800">{hasEmergencyFund ? 'Tak' : 'Nie'}</div>
            <div className="text-xs mt-1" style={{ color: hasEmergencyFund ? THEME.success : THEME.danger }}>
              {hasEmergencyFund ? 'Świetnie!' : 'Zalecane'}
            </div>
          </div>
        </div>
      </div>

      {/* Net Worth Tracking */}
      <div className="bg-white rounded-2xl shadow-lg p-6">
        <div className="flex items-center gap-3 mb-6">
          <TrendingUp size={24} style={{ color: THEME.primary }} />
          <h3 className="text-lg font-bold text-gray-800">Wartość Netto</h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
          <div className="p-4 bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg border-2 border-blue-200">
            <div className="text-xs text-blue-700 mb-1">Aktywa</div>
            <div className="text-2xl font-bold text-blue-900">{formatCurrency(totalAssets)}</div>
          </div>
          <div className="p-4 bg-gradient-to-br from-red-50 to-red-100 rounded-lg border-2 border-red-200">
            <div className="text-xs text-red-700 mb-1">Pasywa</div>
            <div className="text-2xl font-bold text-red-900">{formatCurrency(totalLiabilities)}</div>
          </div>
          <div className="p-4 bg-gradient-to-br from-green-50 to-green-100 rounded-lg border-2 border-green-200">
            <div className="text-xs text-green-700 mb-1">Wartość netto</div>
            <div className="text-2xl font-bold text-green-900">{formatCurrency(netWorth)}</div>
          </div>
        </div>

        {monthlyData.length > 0 && (
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={netWorthChartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip
                formatter={(value) => formatCurrency(value)}
                contentStyle={{ backgroundColor: 'white', border: '1px solid #ccc', borderRadius: '8px' }}
              />
              <Legend />
              <Line
                type="monotone"
                dataKey="Wartość netto"
                stroke={THEME.primary}
                strokeWidth={3}
                dot={{ fill: THEME.primary, r: 4 }}
              />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Year-over-Year Comparison */}
      <div className="bg-white rounded-2xl shadow-lg p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <BarChart3 size={24} style={{ color: THEME.primary }} />
            <h3 className="text-lg font-bold text-gray-800">
              {comparisonMode === 'yoy' ? 'Porównanie rok do roku' : 'Porównanie niestandardowych zakresów'}
            </h3>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setComparisonMode('yoy')}
              className={`px-4 py-2 rounded-lg transition-colors ${
                comparisonMode === 'yoy'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              Rok do roku
            </button>
            <button
              onClick={() => setComparisonMode('custom')}
              className={`px-4 py-2 rounded-lg transition-colors ${
                comparisonMode === 'custom'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              Niestandardowe
            </button>
          </div>
        </div>

        {comparisonMode === 'custom' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
            <div className="p-4 bg-gray-50 rounded-lg">
              <label className="block text-sm font-medium text-gray-700 mb-2">Okres 1</label>
              <div className="flex gap-2">
                <input
                  type="date"
                  value={customRange1.start}
                  onChange={(e) => setCustomRange1({ ...customRange1, start: e.target.value })}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg"
                />
                <input
                  type="date"
                  value={customRange1.end}
                  onChange={(e) => setCustomRange1({ ...customRange1, end: e.target.value })}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg"
                />
              </div>
            </div>
            <div className="p-4 bg-gray-50 rounded-lg">
              <label className="block text-sm font-medium text-gray-700 mb-2">Okres 2</label>
              <div className="flex gap-2">
                <input
                  type="date"
                  value={customRange2.start}
                  onChange={(e) => setCustomRange2({ ...customRange2, start: e.target.value })}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg"
                />
                <input
                  type="date"
                  value={customRange2.end}
                  onChange={(e) => setCustomRange2({ ...customRange2, end: e.target.value })}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg"
                />
              </div>
            </div>
          </div>
        )}

        {comparisonMode === 'yoy' ? (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-4 bg-gray-50 rounded-lg">
              <div className="text-xs text-gray-600 mb-2">Przychody</div>
              <div className="text-xl font-bold text-gray-800">
                {formatCurrency(yoyComparison.current.income)}
              </div>
              <div className="flex items-center gap-1 mt-2">
                {yoyComparison.incomeChange >= 0 ? (
                  <ArrowUpRight size={16} className="text-green-600" />
                ) : (
                  <ArrowDownRight size={16} className="text-red-600" />
                )}
                <span
                  className={`text-sm font-medium ${
                    yoyComparison.incomeChange >= 0 ? 'text-green-600' : 'text-red-600'
                  }`}
                >
                  {Math.abs(yoyComparison.incomeChange).toFixed(1)}% vs. poprzedni rok
                </span>
              </div>
            </div>
            <div className="p-4 bg-gray-50 rounded-lg">
              <div className="text-xs text-gray-600 mb-2">Wydatki</div>
              <div className="text-xl font-bold text-gray-800">
                {formatCurrency(yoyComparison.current.expenses)}
              </div>
              <div className="flex items-center gap-1 mt-2">
                {yoyComparison.expensesChange >= 0 ? (
                  <ArrowUpRight size={16} className="text-red-600" />
                ) : (
                  <ArrowDownRight size={16} className="text-green-600" />
                )}
                <span
                  className={`text-sm font-medium ${
                    yoyComparison.expensesChange >= 0 ? 'text-red-600' : 'text-green-600'
                  }`}
                >
                  {Math.abs(yoyComparison.expensesChange).toFixed(1)}% vs. poprzedni rok
                </span>
              </div>
            </div>
            <div className="p-4 bg-gray-50 rounded-lg">
              <div className="text-xs text-gray-600 mb-2">Oszczędności netto</div>
              <div className="text-xl font-bold text-gray-800">
                {formatCurrency(yoyComparison.current.net)}
              </div>
              <div className="text-xs text-gray-600 mt-2">
                Poprzedni rok: {formatCurrency(yoyComparison.previous.net)}
              </div>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-4 bg-gray-50 rounded-lg">
              <div className="text-xs text-gray-600 mb-2">Przychody</div>
              <div className="text-xl font-bold text-gray-800">
                {formatCurrency(customComparison.range1.income)}
              </div>
              <div className="flex items-center gap-1 mt-2">
                {customComparison.incomeChange >= 0 ? (
                  <ArrowUpRight size={16} className="text-green-600" />
                ) : (
                  <ArrowDownRight size={16} className="text-red-600" />
                )}
                <span
                  className={`text-sm font-medium ${
                    customComparison.incomeChange >= 0 ? 'text-green-600' : 'text-red-600'
                  }`}
                >
                  {Math.abs(customComparison.incomeChange).toFixed(1)}% vs. Okres 2
                </span>
              </div>
            </div>
            <div className="p-4 bg-gray-50 rounded-lg">
              <div className="text-xs text-gray-600 mb-2">Wydatki</div>
              <div className="text-xl font-bold text-gray-800">
                {formatCurrency(customComparison.range1.expenses)}
              </div>
              <div className="flex items-center gap-1 mt-2">
                {customComparison.expensesChange >= 0 ? (
                  <ArrowUpRight size={16} className="text-red-600" />
                ) : (
                  <ArrowDownRight size={16} className="text-green-600" />
                )}
                <span
                  className={`text-sm font-medium ${
                    customComparison.expensesChange >= 0 ? 'text-red-600' : 'text-green-600'
                  }`}
                >
                  {Math.abs(customComparison.expensesChange).toFixed(1)}% vs. Okres 2
                </span>
              </div>
            </div>
            <div className="p-4 bg-gray-50 rounded-lg">
              <div className="text-xs text-gray-600 mb-2">Oszczędności netto</div>
              <div className="text-xl font-bold text-gray-800">
                {formatCurrency(customComparison.range1.net)}
              </div>
              <div className="text-xs text-gray-600 mt-2">
                Okres 2: {formatCurrency(customComparison.range2.net)}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Spending Patterns and Trends */}
      <div className="bg-white rounded-2xl shadow-lg p-6">
        <div className="flex items-center gap-3 mb-6">
          <PieChart size={24} style={{ color: THEME.primary }} />
          <h3 className="text-lg font-bold text-gray-800">Wzorce i trendy wydatków</h3>
        </div>

        <div className="mb-6 p-4 rounded-lg" style={{ backgroundColor: THEME.primaryLight }}>
          <div className="flex items-center gap-2 mb-2">
            {spendingTrends.trend === 'increasing' ? (
              <TrendingUp className="text-red-600" size={20} />
            ) : spendingTrends.trend === 'decreasing' ? (
              <TrendingDown className="text-green-600" size={20} />
            ) : (
              <Activity className="text-blue-600" size={20} />
            )}
            <span className="font-medium text-gray-800">
              Trend wydatków:{' '}
              {spendingTrends.trend === 'increasing'
                ? 'Rosnący'
                : spendingTrends.trend === 'decreasing'
                ? 'Malejący'
                : 'Stabilny'}
            </span>
          </div>
          <p className="text-sm text-gray-600">
            Zmiana w ostatnich 3 miesiącach: {spendingTrends.change > 0 ? '+' : ''}
            {spendingTrends.change}%
          </p>
        </div>

        <div className="space-y-3">
          <h4 className="font-medium text-gray-800 mb-3">Wydatki według kategorii</h4>
          {Object.entries(spendingPatterns)
            .sort((a, b) => b[1].total - a[1].total)
            .slice(0, 5)
            .map(([category, data]) => (
              <div key={category} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex-1">
                  <div className="font-medium text-gray-800">{category}</div>
                  <div className="text-xs text-gray-600">
                    {data.count} transakcji • Średnia: {formatCurrency(data.average)}
                  </div>
                </div>
                <div className="text-lg font-bold text-gray-800">{formatCurrency(data.total)}</div>
              </div>
            ))}
        </div>
      </div>

      {/* Monthly Trends Chart */}
      {monthlyData.length > 0 && (
        <div className="bg-white rounded-2xl shadow-lg p-6">
          <div className="flex items-center gap-3 mb-6">
            <BarChart3 size={24} style={{ color: THEME.primary }} />
            <h3 className="text-lg font-bold text-gray-800">Trendy miesięczne</h3>
          </div>

          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={monthlyData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip
                formatter={(value) => formatCurrency(value)}
                contentStyle={{ backgroundColor: 'white', border: '1px solid #ccc', borderRadius: '8px' }}
              />
              <Legend />
              <Bar dataKey="income" name="Przychody" fill={THEME.success} />
              <Bar dataKey="expenses" name="Wydatki" fill={THEME.danger} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
};

export default AnalyticsTab;
