/**
 * Analytics Calculations Utility
 * Provides advanced financial calculations for the Enhanced Analytics Dashboard
 */

/**
 * Calculate net worth (Total Assets - Total Liabilities)
 */
export const calculateNetWorth = (accounts, debts) => {
  const totalAssets = accounts.reduce((sum, account) => sum + account.balance, 0);
  const totalLiabilities = debts
    .filter(debt => debt.is_active)
    .reduce((sum, debt) => sum + parseFloat(debt.current_balance || 0), 0);

  return totalAssets - totalLiabilities;
};

/**
 * Calculate savings rate as percentage of income
 */
export const calculateSavingsRate = (totalIncome, totalExpenses) => {
  if (totalIncome <= 0) return 0;
  const savings = totalIncome + totalExpenses; // expenses are negative
  return (savings / totalIncome) * 100;
};

/**
 * Calculate debt-to-income ratio
 */
export const calculateDebtToIncomeRatio = (monthlyDebtPayments, monthlyIncome) => {
  if (monthlyIncome <= 0) return 0;
  return (monthlyDebtPayments / monthlyIncome) * 100;
};

/**
 * Calculate budget adherence score (0-100)
 * Based on how well the user is staying within budget limits
 */
export const calculateBudgetAdherenceScore = (budgets) => {
  if (!budgets || budgets.length === 0) return 100;

  let totalScore = 0;
  let validBudgets = 0;

  budgets.forEach(budget => {
    if (budget.limit > 0) {
      const adherence = Math.max(0, 100 - ((budget.spent / budget.limit) * 100 - 100));
      totalScore += Math.min(100, adherence);
      validBudgets++;
    }
  });

  return validBudgets > 0 ? Math.round(totalScore / validBudgets) : 100;
};

/**
 * Calculate financial health score (0-100)
 * Composite score based on multiple factors
 */
export const calculateFinancialHealthScore = (metrics) => {
  const {
    savingsRate,
    debtToIncomeRatio,
    budgetAdherenceScore,
    hasEmergencyFund,
    netWorth
  } = metrics;

  let score = 0;
  let weights = 0;

  // Savings rate (25% weight): 20%+ is excellent, 10-20% is good, <10% is poor
  if (savingsRate >= 20) {
    score += 25;
  } else if (savingsRate >= 10) {
    score += 15;
  } else if (savingsRate > 0) {
    score += 10;
  }
  weights += 25;

  // Debt-to-income ratio (25% weight): <20% is excellent, 20-35% is good, >35% is poor
  if (debtToIncomeRatio < 20) {
    score += 25;
  } else if (debtToIncomeRatio < 35) {
    score += 15;
  } else if (debtToIncomeRatio < 50) {
    score += 10;
  }
  weights += 25;

  // Budget adherence (20% weight)
  score += (budgetAdherenceScore * 0.2);
  weights += 20;

  // Emergency fund (15% weight)
  if (hasEmergencyFund) {
    score += 15;
  }
  weights += 15;

  // Positive net worth (15% weight)
  if (netWorth > 0) {
    score += 15;
  } else if (netWorth > -10000) {
    score += 5;
  }
  weights += 15;

  return Math.round((score / weights) * 100);
};

/**
 * Get monthly data for a specific metric
 */
export const getMonthlyData = (transactions, metric = 'all') => {
  const monthlyData = {};

  transactions.forEach(transaction => {
    const date = new Date(transaction.date);
    const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;

    if (!monthlyData[monthKey]) {
      monthlyData[monthKey] = {
        income: 0,
        expenses: 0,
        net: 0,
        month: monthKey
      };
    }

    if (transaction.amount > 0) {
      monthlyData[monthKey].income += transaction.amount;
    } else {
      monthlyData[monthKey].expenses += Math.abs(transaction.amount);
    }
    monthlyData[monthKey].net = monthlyData[monthKey].income - monthlyData[monthKey].expenses;
  });

  return Object.values(monthlyData).sort((a, b) => a.month.localeCompare(b.month));
};

/**
 * Calculate year-over-year comparison
 */
export const calculateYoYComparison = (transactions, currentYear = new Date().getFullYear()) => {
  const currentYearData = { income: 0, expenses: 0, net: 0 };
  const previousYearData = { income: 0, expenses: 0, net: 0 };

  transactions.forEach(transaction => {
    const year = new Date(transaction.date).getFullYear();

    if (year === currentYear) {
      if (transaction.amount > 0) {
        currentYearData.income += transaction.amount;
      } else {
        currentYearData.expenses += Math.abs(transaction.amount);
      }
    } else if (year === currentYear - 1) {
      if (transaction.amount > 0) {
        previousYearData.income += transaction.amount;
      } else {
        previousYearData.expenses += Math.abs(transaction.amount);
      }
    }
  });

  currentYearData.net = currentYearData.income - currentYearData.expenses;
  previousYearData.net = previousYearData.income - previousYearData.expenses;

  const incomeChange = previousYearData.income > 0
    ? ((currentYearData.income - previousYearData.income) / previousYearData.income) * 100
    : 0;
  const expensesChange = previousYearData.expenses > 0
    ? ((currentYearData.expenses - previousYearData.expenses) / previousYearData.expenses) * 100
    : 0;

  return {
    current: currentYearData,
    previous: previousYearData,
    incomeChange,
    expensesChange
  };
};

/**
 * Get spending patterns by category
 */
export const getSpendingPatterns = (transactions) => {
  const patterns = {};

  transactions.forEach(transaction => {
    if (transaction.amount < 0) { // Only expenses
      const category = transaction.category || 'Uncategorized';
      if (!patterns[category]) {
        patterns[category] = {
          total: 0,
          count: 0,
          average: 0
        };
      }
      patterns[category].total += Math.abs(transaction.amount);
      patterns[category].count += 1;
    }
  });

  // Calculate averages
  Object.keys(patterns).forEach(category => {
    patterns[category].average = patterns[category].total / patterns[category].count;
  });

  return patterns;
};

/**
 * Get spending trends (increasing, decreasing, stable)
 */
export const getSpendingTrends = (transactions, months = 3) => {
  const monthlyData = getMonthlyData(transactions);

  if (monthlyData.length < 2) {
    return { trend: 'stable', change: 0 };
  }

  // Get last N months
  const recentMonths = monthlyData.slice(-months);

  if (recentMonths.length < 2) {
    return { trend: 'stable', change: 0 };
  }

  // Calculate average of first half vs second half
  const midpoint = Math.floor(recentMonths.length / 2);
  const firstHalf = recentMonths.slice(0, midpoint);
  const secondHalf = recentMonths.slice(midpoint);

  const firstHalfAvg = firstHalf.reduce((sum, m) => sum + m.expenses, 0) / firstHalf.length;
  const secondHalfAvg = secondHalf.reduce((sum, m) => sum + m.expenses, 0) / secondHalf.length;

  const change = firstHalfAvg > 0 ? ((secondHalfAvg - firstHalfAvg) / firstHalfAvg) * 100 : 0;

  let trend = 'stable';
  if (change > 10) {
    trend = 'increasing';
  } else if (change < -10) {
    trend = 'decreasing';
  }

  return { trend, change: Math.round(change) };
};

/**
 * Compare two date ranges
 */
export const compareDateRanges = (transactions, range1, range2) => {
  const filterByRange = (range) => {
    return transactions.filter(t => {
      const date = new Date(t.date);
      return date >= new Date(range.start) && date <= new Date(range.end);
    });
  };

  const calculateMetrics = (filteredTransactions) => {
    let income = 0;
    let expenses = 0;
    filteredTransactions.forEach(t => {
      if (t.amount > 0) income += t.amount;
      else expenses += Math.abs(t.amount);
    });
    return { income, expenses, net: income - expenses };
  };

  const range1Data = calculateMetrics(filterByRange(range1));
  const range2Data = calculateMetrics(filterByRange(range2));

  const incomeChange = range2Data.income > 0
    ? ((range1Data.income - range2Data.income) / range2Data.income) * 100
    : 0;
  const expensesChange = range2Data.expenses > 0
    ? ((range1Data.expenses - range2Data.expenses) / range2Data.expenses) * 100
    : 0;

  return {
    range1: range1Data,
    range2: range2Data,
    incomeChange,
    expensesChange
  };
};

/**
 * Generate analytics snapshot for a specific date
 */
export const generateAnalyticsSnapshot = (date, data) => {
  const { transactions, budgets, accounts, debts, savingsGoals } = data;

  // Calculate period (last 30 days from snapshot date)
  const snapshotDate = new Date(date);
  const periodStart = new Date(snapshotDate);
  periodStart.setDate(periodStart.getDate() - 30);

  const periodTransactions = transactions.filter(t => {
    const tDate = new Date(t.date);
    return tDate >= periodStart && tDate <= snapshotDate;
  });

  let totalIncome = 0;
  let totalExpenses = 0;
  periodTransactions.forEach(t => {
    if (t.amount > 0) totalIncome += t.amount;
    else totalExpenses += Math.abs(t.amount);
  });

  const netWorth = calculateNetWorth(accounts, debts);
  const totalAssets = accounts.reduce((sum, a) => sum + a.balance, 0);
  const totalLiabilities = debts
    .filter(d => d.is_active)
    .reduce((sum, d) => sum + parseFloat(d.current_balance || 0), 0);

  const savingsRate = calculateSavingsRate(totalIncome, -totalExpenses);
  const budgetAdherenceScore = calculateBudgetAdherenceScore(budgets);

  const categoriesOverBudget = budgets.filter(b => b.spent > b.limit).length;
  const totalCategoriesTracked = budgets.length;

  // Calculate monthly debt payments
  const monthlyDebtPayments = debts
    .filter(d => d.is_active)
    .reduce((sum, d) => sum + parseFloat(d.installment_amount || 0), 0);

  const monthlyIncome = totalIncome; // Last 30 days
  const debtToIncomeRatio = calculateDebtToIncomeRatio(monthlyDebtPayments, monthlyIncome);

  const activeGoalsCount = savingsGoals.filter(g => g.is_active && !g.is_completed).length;
  const totalSavedTowardsGoals = savingsGoals
    .filter(g => g.is_active)
    .reduce((sum, g) => sum + parseFloat(g.current_amount || 0), 0);

  return {
    snapshot_date: date,
    total_income: totalIncome,
    total_expenses: totalExpenses,
    net_worth: netWorth,
    total_assets: totalAssets,
    total_liabilities: totalLiabilities,
    savings_rate: savingsRate,
    budget_adherence_score: budgetAdherenceScore,
    categories_over_budget: categoriesOverBudget,
    total_categories_tracked: totalCategoriesTracked,
    debt_to_income_ratio: debtToIncomeRatio,
    total_debt_payments: monthlyDebtPayments,
    active_goals_count: activeGoalsCount,
    total_saved_towards_goals: totalSavedTowardsGoals
  };
};
