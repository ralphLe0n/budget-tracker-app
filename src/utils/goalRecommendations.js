/**
 * Savings Goal Recommendations and Prioritization
 * Provides intelligent recommendations for goal allocation and prioritization
 */

/**
 * Calculate days remaining until goal target date
 */
export const getDaysRemaining = (targetDate) => {
  const today = new Date();
  const target = new Date(targetDate);
  const diffTime = target - today;
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
};

/**
 * Calculate required monthly contribution to reach goal
 */
export const calculateRequiredMonthlyContribution = (goal) => {
  const remaining = goal.target_amount - (goal.current_amount || 0);
  if (remaining <= 0) return 0;

  const daysRemaining = getDaysRemaining(goal.target_date);
  if (daysRemaining <= 0) return remaining; // Overdue

  const monthsRemaining = daysRemaining / 30;
  return monthsRemaining > 0 ? remaining / monthsRemaining : remaining;
};

/**
 * Calculate progress percentage
 */
export const calculateProgress = (goal) => {
  if (goal.target_amount <= 0) return 0;
  return Math.min(100, (goal.current_amount / goal.target_amount) * 100);
};

/**
 * Get goal status
 */
export const getGoalStatus = (goal) => {
  const progress = calculateProgress(goal);
  const daysRemaining = getDaysRemaining(goal.target_date);

  if (goal.is_completed) return 'completed';
  if (progress >= 100) return 'achieved';
  if (daysRemaining < 0) return 'overdue';
  if (daysRemaining <= 30) return 'urgent';
  if (progress >= 75) return 'on-track';
  if (progress >= 50) return 'good';
  return 'behind';
};

/**
 * Prioritize goals based on multiple factors
 * Returns goals sorted by priority score (highest first)
 */
export const prioritizeGoals = (goals, monthlyIncome = 0) => {
  const scoredGoals = goals.map(goal => {
    let score = 0;

    // Factor 1: User-defined priority (0-10, weight: 30%)
    score += (goal.priority || 5) * 3;

    // Factor 2: Urgency based on deadline (weight: 30%)
    const daysRemaining = getDaysRemaining(goal.target_date);
    if (daysRemaining < 0) {
      score += 30; // Overdue gets highest urgency
    } else if (daysRemaining <= 30) {
      score += 25; // Within a month
    } else if (daysRemaining <= 90) {
      score += 20; // Within 3 months
    } else if (daysRemaining <= 180) {
      score += 15; // Within 6 months
    } else if (daysRemaining <= 365) {
      score += 10; // Within a year
    } else {
      score += 5; // More than a year
    }

    // Factor 3: Progress (weight: 20%)
    const progress = calculateProgress(goal);
    if (progress >= 75) {
      score += 20; // Close to completion
    } else if (progress >= 50) {
      score += 15;
    } else if (progress >= 25) {
      score += 10;
    } else {
      score += 5;
    }

    // Factor 4: Category importance (weight: 20%)
    const categoryPriority = {
      'Emergency Fund': 20,
      'Fundusz awaryjny': 20,
      'Debt Payoff': 18,
      'Spłata długu': 18,
      'Education': 16,
      'Edukacja': 16,
      'House': 15,
      'Dom': 15,
      'Car': 14,
      'Samochód': 14,
      'Retirement': 13,
      'Emerytura': 13,
      'Wedding': 12,
      'Ślub': 12,
      'Vacation': 10,
      'Wakacje': 10,
      'Other': 8,
      'Inne': 8
    };
    score += categoryPriority[goal.category] || 10;

    return { ...goal, priorityScore: score };
  });

  return scoredGoals.sort((a, b) => b.priorityScore - a.priorityScore);
};

/**
 * Get recommendations for a specific goal
 */
export const getGoalRecommendations = (goal, monthlyIncome = 0) => {
  const recommendations = [];
  const progress = calculateProgress(goal);
  const daysRemaining = getDaysRemaining(goal.target_date);
  const monthsRemaining = daysRemaining / 30;
  const requiredMonthly = calculateRequiredMonthlyContribution(goal);

  // Check if goal is achievable
  if (monthlyIncome > 0 && requiredMonthly > monthlyIncome * 0.5) {
    recommendations.push({
      type: 'warning',
      message: 'Ten cel może być trudny do osiągnięcia - wymaga >50% miesięcznego dochodu',
      suggestion: 'Rozważ przedłużenie terminu lub zmniejszenie kwoty docelowej'
    });
  }

  // Deadline recommendations
  if (daysRemaining < 0) {
    recommendations.push({
      type: 'urgent',
      message: 'Termin realizacji celu już minął',
      suggestion: 'Ustaw nową datę docelową lub zakończ cel'
    });
  } else if (daysRemaining <= 30 && progress < 80) {
    recommendations.push({
      type: 'urgent',
      message: 'Mniej niż miesiąc do osiągnięcia celu, a postęp wynosi tylko ' + Math.round(progress) + '%',
      suggestion: `Zwiększ miesięczne wpłaty do ${requiredMonthly.toFixed(2)} PLN`
    });
  }

  // Progress recommendations
  if (progress < 25 && monthsRemaining < 6) {
    recommendations.push({
      type: 'warning',
      message: 'Niski postęp z niewielką ilością czasu pozostałego',
      suggestion: 'Rozważ zwiększenie priorytetów alokacji lub przedłuż termin'
    });
  }

  // Auto-allocation recommendations
  if (!goal.auto_allocate && goal.priority >= 7) {
    recommendations.push({
      type: 'info',
      message: 'Wysoki priorytet, ale brak automatycznej alokacji',
      suggestion: 'Włącz automatyczną alokację dla konsekwentnego oszczędzania'
    });
  }

  // Success path
  if (progress >= 50 && monthsRemaining > 3 && requiredMonthly < monthlyIncome * 0.2) {
    recommendations.push({
      type: 'success',
      message: 'Jesteś na dobrej drodze do osiągnięcia tego celu!',
      suggestion: 'Kontynuuj obecne tempo oszczędzania'
    });
  }

  // Emergency fund specific
  if (goal.category === 'Emergency Fund' || goal.category === 'Fundusz awaryjny') {
    const recommendedAmount = monthlyIncome * 6; // 6 months of expenses
    if (goal.target_amount < recommendedAmount * 0.5) {
      recommendations.push({
        type: 'info',
        message: 'Eksperci zalecają fundusz awaryjny równy 3-6 miesięcznym wydatkom',
        suggestion: `Rozważ zwiększenie docelowej kwoty do ${recommendedAmount.toFixed(2)} PLN`
      });
    }
  }

  return recommendations;
};

/**
 * Calculate optimal allocation for auto-allocation goals
 */
export const calculateOptimalAllocation = (goals, monthlyIncome) => {
  const activeAutoAllocateGoals = goals.filter(g =>
    g.is_active && !g.is_completed && g.auto_allocate
  );

  if (activeAutoAllocateGoals.length === 0) return [];

  // Prioritize goals
  const prioritizedGoals = prioritizeGoals(activeAutoAllocateGoals, monthlyIncome);

  // Calculate total requested allocation percentage
  const totalRequestedPercentage = prioritizedGoals.reduce(
    (sum, g) => sum + (g.allocation_percentage || 0),
    0
  );

  // If total requested is reasonable (<= 50%), use as-is
  if (totalRequestedPercentage <= 50) {
    return prioritizedGoals.map(g => ({
      goal_id: g.id,
      goal_name: g.name,
      allocation_percentage: g.allocation_percentage,
      allocation_amount: (monthlyIncome * g.allocation_percentage) / 100
    }));
  }

  // Otherwise, allocate based on priority scores
  const totalScore = prioritizedGoals.reduce((sum, g) => sum + g.priorityScore, 0);
  const maxAllocationPercentage = 50; // Max 50% of income to goals

  return prioritizedGoals.map(g => {
    const optimalPercentage = (g.priorityScore / totalScore) * maxAllocationPercentage;
    return {
      goal_id: g.id,
      goal_name: g.name,
      allocation_percentage: Math.round(optimalPercentage * 10) / 10,
      allocation_amount: (monthlyIncome * optimalPercentage) / 100,
      priority_score: g.priorityScore
    };
  });
};

/**
 * Check if a milestone has been reached
 */
export const checkMilestones = (goal) => {
  const progress = calculateProgress(goal);
  const milestones = [];

  if (progress >= 25 && !goal.milestone_25_reached) {
    milestones.push({ percentage: 25, message: 'Gratulacje! Osiągnąłeś 25% celu!' });
  }
  if (progress >= 50 && !goal.milestone_50_reached) {
    milestones.push({ percentage: 50, message: 'Świetna robota! Jesteś w połowie drogi!' });
  }
  if (progress >= 75 && !goal.milestone_75_reached) {
    milestones.push({ percentage: 75, message: 'Niesamowite! 75% wykonane!' });
  }
  if (progress >= 100 && !goal.milestone_100_reached) {
    milestones.push({ percentage: 100, message: '🎉 Cel osiągnięty! Gratulacje!' });
  }

  return milestones;
};

/**
 * Get goal category options (Polish)
 */
export const getGoalCategories = () => [
  { value: 'Fundusz awaryjny', label: 'Fundusz awaryjny', icon: 'Shield' },
  { value: 'Wakacje', label: 'Wakacje', icon: 'Plane' },
  { value: 'Samochód', label: 'Samochód', icon: 'Car' },
  { value: 'Dom', label: 'Dom', icon: 'Home' },
  { value: 'Edukacja', label: 'Edukacja', icon: 'GraduationCap' },
  { value: 'Ślub', label: 'Ślub', icon: 'Heart' },
  { value: 'Emerytura', label: 'Emerytura', icon: 'Landmark' },
  { value: 'Spłata długu', label: 'Spłata długu', icon: 'CreditCard' },
  { value: 'Elektronika', label: 'Elektronika', icon: 'Laptop' },
  { value: 'Zdrowie', label: 'Zdrowie', icon: 'HeartPulse' },
  { value: 'Inne', label: 'Inne', icon: 'Target' }
];
