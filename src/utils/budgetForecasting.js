/**
 * Budget Forecasting Utility
 * Uses statistical methods for predicting spending and detecting anomalies
 * All calculations are client-side - no external APIs required
 */

/**
 * Get transactions for a specific category from the last N months
 */
const getLast6MonthsData = (transactions, category) => {
  const sixMonthsAgo = new Date();
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

  return transactions
    .filter(t => {
      const transDate = new Date(t.date);
      return (
        t.category === category &&
        t.amount < 0 && // Only expenses
        t.category !== 'Transfer' &&
        transDate >= sixMonthsAgo
      );
    })
    .map(t => Math.abs(t.amount))
    .sort((a, b) => a - b);
};

/**
 * Get monthly aggregated spending for a category
 */
const getMonthlySpending = (transactions, category, months = 6) => {
  const monthsAgo = new Date();
  monthsAgo.setMonth(monthsAgo.getMonth() - months);

  const monthlyData = {};

  transactions
    .filter(t => {
      const transDate = new Date(t.date);
      return (
        t.category === category &&
        t.amount < 0 &&
        t.category !== 'Transfer' &&
        transDate >= monthsAgo
      );
    })
    .forEach(t => {
      const date = new Date(t.date);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;

      if (!monthlyData[monthKey]) {
        monthlyData[monthKey] = 0;
      }
      monthlyData[monthKey] += Math.abs(t.amount);
    });

  return Object.values(monthlyData);
};

/**
 * Calculate average spending
 */
const getAverageSpending = (transactions, category) => {
  const monthlySpending = getMonthlySpending(transactions, category);

  if (monthlySpending.length === 0) return 0;

  return monthlySpending.reduce((sum, val) => sum + val, 0) / monthlySpending.length;
};

/**
 * Calculate standard deviation
 */
const getStdDev = (transactions, category) => {
  const monthlySpending = getMonthlySpending(transactions, category);

  if (monthlySpending.length < 2) return 0;

  const avg = monthlySpending.reduce((sum, val) => sum + val, 0) / monthlySpending.length;
  const squaredDiffs = monthlySpending.map(val => Math.pow(val - avg, 2));
  const variance = squaredDiffs.reduce((sum, val) => sum + val, 0) / monthlySpending.length;

  return Math.sqrt(variance);
};

/**
 * Calculate trend (positive = increasing, negative = decreasing)
 */
const calculateTrend = (data) => {
  if (data.length < 3) return 'stable';

  const recent = data.slice(-3).reduce((a, b) => a + b, 0) / 3;
  const older = data.slice(-6, -3).reduce((a, b) => a + b, 0) / 3;

  const change = recent - older;
  const percentChange = (change / older) * 100;

  if (percentChange > 10) return 'increasing';
  if (percentChange < -10) return 'decreasing';
  return 'stable';
};

/**
 * Calculate confidence level based on data variance
 */
const calculateConfidence = (data) => {
  if (data.length < 3) return 'low';

  const avg = data.reduce((a, b) => a + b, 0) / data.length;
  const stdDev = Math.sqrt(
    data.map(x => Math.pow(x - avg, 2)).reduce((a, b) => a + b, 0) / data.length
  );

  const coefficientOfVariation = (stdDev / avg) * 100;

  if (coefficientOfVariation < 20) return 'high';
  if (coefficientOfVariation < 40) return 'medium';
  return 'low';
};

/**
 * Exponential smoothing for better predictions
 * Alpha: smoothing factor (0-1), higher = more weight on recent data
 */
const exponentialSmoothing = (data, alpha = 0.3) => {
  if (data.length === 0) return 0;

  let forecast = data[0];

  for (let i = 1; i < data.length; i++) {
    forecast = alpha * data[i] + (1 - alpha) * forecast;
  }

  return forecast;
};

/**
 * Get daily spending rate for current month
 */
const getDailySpendingRate = (transactions, category) => {
  const now = new Date();
  const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  const currentMonthSpending = transactions
    .filter(t => {
      const transDate = new Date(t.date);
      return (
        t.category === category &&
        t.amount < 0 &&
        t.category !== 'Transfer' &&
        transDate >= firstDayOfMonth &&
        transDate <= now
      );
    })
    .reduce((sum, t) => sum + Math.abs(t.amount), 0);

  const daysElapsed = now.getDate();

  return daysElapsed > 0 ? currentMonthSpending / daysElapsed : 0;
};

/**
 * Main Budget Forecasting Class
 */
export class BudgetForecaster {
  /**
   * Predict next month's spending by category
   * Uses exponential smoothing with trend adjustment
   */
  static predictCategorySpending(transactions, category) {
    const monthlyData = getMonthlySpending(transactions, category, 6);

    if (monthlyData.length < 2) {
      return {
        forecast: 0,
        confidence: 'low',
        trend: 'insufficient_data',
        recommendation: 'Potrzebujesz więcej danych historycznych aby przewidzieć wydatki'
      };
    }

    // Use exponential smoothing for base forecast
    const forecast = exponentialSmoothing(monthlyData, 0.3);

    // Calculate trend
    const trend = calculateTrend(monthlyData);
    const confidence = calculateConfidence(monthlyData);

    // Adjust forecast based on trend
    let adjustedForecast = forecast;
    if (trend === 'increasing') {
      adjustedForecast = forecast * 1.05; // 5% increase
    } else if (trend === 'decreasing') {
      adjustedForecast = forecast * 0.95; // 5% decrease
    }

    return {
      forecast: Math.round(adjustedForecast),
      confidence,
      trend,
      recommendation: this.getRecommendation(adjustedForecast, category, trend),
      historicalAverage: Math.round(monthlyData.reduce((a, b) => a + b, 0) / monthlyData.length)
    };
  }

  /**
   * Detect spending anomalies (unusually high transactions)
   */
  static detectAnomalies(transactions, limit = 5) {
    const anomalies = [];
    const categories = [...new Set(transactions.map(t => t.category))];

    categories.forEach(category => {
      const avgSpending = getAverageSpending(transactions, category);
      const stdDev = getStdDev(transactions, category);

      if (avgSpending === 0 || stdDev === 0) return;

      // Check recent transactions (last 30 days)
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      transactions
        .filter(t => {
          const transDate = new Date(t.date);
          return (
            t.category === category &&
            t.amount < 0 &&
            transDate >= thirtyDaysAgo
          );
        })
        .forEach(transaction => {
          const amount = Math.abs(transaction.amount);

          // If spending is > 2 standard deviations from mean, it's an anomaly
          if (amount > avgSpending + 2 * stdDev) {
            const percentHigher = Math.round((amount / avgSpending - 1) * 100);
            anomalies.push({
              transaction,
              type: 'unusually_high',
              severity: percentHigher > 100 ? 'high' : 'medium',
              message: `Wydatek z kategorii "${category}" jest o ${percentHigher}% wyższy niż zwykle`
            });
          }
        });
    });

    // Sort by severity and return top N
    return anomalies
      .sort((a, b) => {
        if (a.severity === 'high' && b.severity !== 'high') return -1;
        if (a.severity !== 'high' && b.severity === 'high') return 1;
        return Math.abs(b.transaction.amount) - Math.abs(a.transaction.amount);
      })
      .slice(0, limit);
  }

  /**
   * Predict when budget will be exceeded
   */
  static predictBudgetOverrun(transactions, budget, categories) {
    const now = new Date();
    const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
    const daysRemaining = daysInMonth - now.getDate();

    if (daysRemaining <= 0) {
      return { willExceed: false };
    }

    // Get current spending for this budget period
    const currentSpending = this.getCurrentPeriodSpending(transactions, budget, categories);

    // Calculate daily spending rate
    const dailyRate = getDailySpendingRate(transactions, budget.category);

    // Project total spending for the month
    const projectedSpending = currentSpending + (dailyRate * daysRemaining);

    if (projectedSpending > budget.limit) {
      const daysUntilOverrun = Math.floor((budget.limit - currentSpending) / dailyRate);
      const exceedDate = new Date();
      exceedDate.setDate(exceedDate.getDate() + daysUntilOverrun);

      const recommendedDailySpending = (budget.limit - currentSpending) / daysRemaining;

      return {
        willExceed: true,
        daysUntilOverrun: Math.max(0, daysUntilOverrun),
        exceedDate: exceedDate.toISOString().split('T')[0],
        projectedAmount: Math.round(projectedSpending),
        projectedOverage: Math.round(projectedSpending - budget.limit),
        currentSpending: Math.round(currentSpending),
        recommendedDailySpending: Math.round(recommendedDailySpending),
        recommendation: daysUntilOverrun > 0
          ? `W obecnym tempie przekroczysz budżet za ${daysUntilOverrun} dni. Ogranicz dzienne wydatki do ${Math.round(recommendedDailySpending)} PLN`
          : `Budżet został już przekroczony! Łączne wydatki: ${Math.round(projectedSpending)} PLN`
      };
    }

    return {
      willExceed: false,
      projectedAmount: Math.round(projectedSpending),
      remainingBudget: Math.round(budget.limit - projectedSpending),
      currentSpending: Math.round(currentSpending),
      recommendation: `Na dobrej drodze! Pozostały budżet: ${Math.round(budget.limit - projectedSpending)} PLN`
    };
  }

  /**
   * Get current period spending based on budget period
   */
  static getCurrentPeriodSpending(transactions, budget, categories) {
    const now = new Date();
    let startDate;

    switch (budget.period) {
      case 'weekly':
        startDate = new Date(now);
        startDate.setDate(now.getDate() - now.getDay()); // Start of week
        break;
      case 'monthly':
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        break;
      case 'yearly':
        startDate = new Date(now.getFullYear(), 0, 1);
        break;
      default:
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
    }

    const category = categories.find(c => c.name === budget.category);

    return transactions
      .filter(t => {
        const transDate = new Date(t.date);
        const matchesCategory = t.category === budget.category;
        const isExpense = t.amount < 0;
        const isNotTransfer = t.category !== 'Transfer';
        const isInPeriod = transDate >= startDate && transDate <= now;

        return matchesCategory && isExpense && isNotTransfer && isInPeriod;
      })
      .reduce((sum, t) => sum + Math.abs(t.amount), 0);
  }

  /**
   * Get personalized recommendation
   */
  static getRecommendation(forecast, category, trend) {
    if (trend === 'increasing') {
      return `Wydatki na "${category}" rosną. Prognoza: ${Math.round(forecast)} PLN w następnym miesiącu`;
    } else if (trend === 'decreasing') {
      return `Świetnie! Wydatki na "${category}" maleją. Prognoza: ${Math.round(forecast)} PLN`;
    } else {
      return `Wydatki na "${category}" są stabilne. Prognoza: ${Math.round(forecast)} PLN`;
    }
  }

  /**
   * Get spending insights for all categories
   */
  static getSpendingInsights(transactions, budgets, categories) {
    const insights = {
      predictions: [],
      anomalies: [],
      budgetWarnings: []
    };

    // Get predictions for ALL categories with data (not just top 5)
    const allCategories = [...new Set(transactions.map(t => t.category))]
      .filter(cat => cat && cat !== 'Transfer');

    allCategories.forEach(category => {
      const prediction = this.predictCategorySpending(transactions, category);
      // Include all predictions, even with insufficient data (UI will handle display)
      insights.predictions.push({
        category,
        ...prediction
      });
    });

    // Get anomalies
    insights.anomalies = this.detectAnomalies(transactions, 3);

    // Check budget warnings
    budgets.forEach(budget => {
      const overrun = this.predictBudgetOverrun(transactions, budget, categories);
      if (overrun.willExceed) {
        insights.budgetWarnings.push({
          budget: budget.category,
          ...overrun
        });
      }
    });

    return insights;
  }
}

export default BudgetForecaster;
