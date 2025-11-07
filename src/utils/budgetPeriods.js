/**
 * Budget Period Calculation Utilities
 *
 * These utilities help calculate budget periods based on recurrence frequency
 * and determine if a budget needs to be reset for a new period.
 */

/**
 * Calculate the current period start and end dates based on the budget's recurrence settings
 * @param {Date} periodStartDate - The date when the budget period begins
 * @param {string} frequency - 'daily', 'weekly', 'monthly', or 'yearly'
 * @param {Date} referenceDate - The date to use for calculations (defaults to today)
 * @returns {Object} { periodStart: Date, periodEnd: Date }
 */
export const getCurrentPeriod = (periodStartDate, frequency, referenceDate = new Date()) => {
  const startDate = new Date(periodStartDate);
  const refDate = new Date(referenceDate);

  // Reset time to midnight for accurate date comparisons
  startDate.setHours(0, 0, 0, 0);
  refDate.setHours(0, 0, 0, 0);

  let periodStart, periodEnd;

  switch (frequency) {
    case 'daily':
      // Period is just the current day
      periodStart = new Date(refDate);
      periodEnd = new Date(refDate);
      periodEnd.setDate(periodEnd.getDate() + 1);
      periodEnd.setMilliseconds(-1); // End of day
      break;

    case 'weekly':
      // Calculate weeks since period start
      const daysSinceStart = Math.floor((refDate - startDate) / (1000 * 60 * 60 * 24));
      const weeksSinceStart = Math.floor(daysSinceStart / 7);

      periodStart = new Date(startDate);
      periodStart.setDate(periodStart.getDate() + (weeksSinceStart * 7));

      periodEnd = new Date(periodStart);
      periodEnd.setDate(periodEnd.getDate() + 7);
      periodEnd.setMilliseconds(-1);
      break;

    case 'monthly':
      // Calculate months since period start
      const monthsDiff = (refDate.getFullYear() - startDate.getFullYear()) * 12 +
                        (refDate.getMonth() - startDate.getMonth());

      periodStart = new Date(startDate);
      periodStart.setMonth(periodStart.getMonth() + monthsDiff);

      // If the reference date is before the day of month of period start,
      // we're still in the previous period
      if (refDate.getDate() < startDate.getDate()) {
        periodStart.setMonth(periodStart.getMonth() - 1);
      }

      periodEnd = new Date(periodStart);
      periodEnd.setMonth(periodEnd.getMonth() + 1);
      periodEnd.setMilliseconds(-1);
      break;

    case 'yearly':
      // Calculate years since period start
      let yearsDiff = refDate.getFullYear() - startDate.getFullYear();

      periodStart = new Date(startDate);
      periodStart.setFullYear(startDate.getFullYear() + yearsDiff);

      // If the reference date is before the month/day of period start,
      // we're still in the previous period
      if (refDate < periodStart) {
        periodStart.setFullYear(periodStart.getFullYear() - 1);
      }

      periodEnd = new Date(periodStart);
      periodEnd.setFullYear(periodEnd.getFullYear() + 1);
      periodEnd.setMilliseconds(-1);
      break;

    default:
      // Default to monthly
      periodStart = new Date(refDate.getFullYear(), refDate.getMonth(), 1);
      periodEnd = new Date(refDate.getFullYear(), refDate.getMonth() + 1, 0, 23, 59, 59, 999);
  }

  return { periodStart, periodEnd };
};

/**
 * Check if a budget needs to be reset based on its last reset date
 * @param {Date} lastResetDate - The date when the budget was last reset
 * @param {Date} periodStartDate - The date when the budget period begins
 * @param {string} frequency - 'daily', 'weekly', 'monthly', or 'yearly'
 * @returns {boolean} True if the budget should be reset
 */
export const shouldResetBudget = (lastResetDate, periodStartDate, frequency) => {
  const lastReset = new Date(lastResetDate);
  const { periodStart } = getCurrentPeriod(periodStartDate, frequency);

  // Reset time to midnight for accurate date comparisons
  lastReset.setHours(0, 0, 0, 0);
  periodStart.setHours(0, 0, 0, 0);

  // If the last reset was before the current period start, we need to reset
  return lastReset < periodStart;
};

/**
 * Format the period display text
 * @param {Date} periodStart - Start of the period
 * @param {Date} periodEnd - End of the period
 * @param {string} frequency - 'daily', 'weekly', 'monthly', or 'yearly'
 * @returns {string} Formatted period text
 */
export const formatPeriodText = (periodStart, periodEnd, frequency) => {
  const options = { month: 'short', day: 'numeric' };
  const startStr = periodStart.toLocaleDateString('en-US', options);
  const endStr = periodEnd.toLocaleDateString('en-US', options);

  switch (frequency) {
    case 'daily':
      return `Today (${startStr})`;
    case 'weekly':
      return `${startStr} - ${endStr}`;
    case 'monthly':
      return periodStart.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
    case 'yearly':
      return periodStart.getFullYear().toString();
    default:
      return `${startStr} - ${endStr}`;
  }
};

/**
 * Get the next period start date
 * @param {Date} periodStartDate - The date when the budget period begins
 * @param {string} frequency - 'daily', 'weekly', 'monthly', or 'yearly'
 * @returns {Date} The start date of the next period
 */
export const getNextPeriodStart = (periodStartDate, frequency) => {
  const { periodEnd } = getCurrentPeriod(periodStartDate, frequency);
  const nextStart = new Date(periodEnd);
  nextStart.setMilliseconds(nextStart.getMilliseconds() + 1);
  nextStart.setHours(0, 0, 0, 0);
  return nextStart;
};

/**
 * Get a user-friendly label for the frequency
 * @param {string} frequency - 'daily', 'weekly', 'monthly', or 'yearly'
 * @returns {string} User-friendly label
 */
export const getFrequencyLabel = (frequency) => {
  const labels = {
    daily: 'Daily',
    weekly: 'Weekly',
    monthly: 'Monthly',
    yearly: 'Yearly'
  };
  return labels[frequency] || 'Monthly';
};
