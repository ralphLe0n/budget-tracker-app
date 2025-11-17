import React, { useState, useMemo } from 'react';
import {
  PlusCircle, Target, Calendar, DollarSign, TrendingUp, Edit2, Save, X,
  Trash2, CheckCircle, AlertTriangle, Star, Sparkles, Shield, Plane,
  Car, Home, GraduationCap, Heart, Landmark, CreditCard, Laptop, HeartPulse
} from 'lucide-react';
import { formatCurrency } from '../../utils/formatters';
import { THEME } from '../../config/theme';
import {
  calculateProgress,
  calculateRequiredMonthlyContribution,
  getGoalStatus,
  getDaysRemaining,
  prioritizeGoals,
  getGoalRecommendations,
  getGoalCategories,
  checkMilestones
} from '../../utils/goalRecommendations';

const SavingsGoalsTab = ({
  savingsGoals = [],
  accounts = [],
  monthlyIncome = 0,
  onAddGoal,
  onUpdateGoal,
  onDeleteGoal,
  onAddContribution,
  onShowCelebration
}) => {
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingGoalId, setEditingGoalId] = useState(null);
  const [showContributionForm, setShowContributionForm] = useState(null);

  // Form state for new goal
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category: 'Inne',
    target_amount: '',
    target_date: '',
    priority: 5,
    auto_allocate: false,
    allocation_percentage: 0,
    account_id: ''
  });

  // Contribution form state
  const [contributionAmount, setContributionAmount] = useState('');
  const [contributionNote, setContributionNote] = useState('');

  // Get category icon
  const getCategoryIcon = (category) => {
    const iconMap = {
      'Fundusz awaryjny': Shield,
      'Wakacje': Plane,
      'Samochód': Car,
      'Dom': Home,
      'Edukacja': GraduationCap,
      'Ślub': Heart,
      'Emerytura': Landmark,
      'Spłata długu': CreditCard,
      'Elektronika': Laptop,
      'Zdrowie': HeartPulse,
      'Inne': Target
    };
    return iconMap[category] || Target;
  };

  // Get status color
  const getStatusColor = (status) => {
    switch (status) {
      case 'completed':
      case 'achieved':
        return THEME.success;
      case 'on-track':
      case 'good':
        return THEME.primary;
      case 'urgent':
        return THEME.warning;
      case 'overdue':
      case 'behind':
        return THEME.danger;
      default:
        return THEME.primary;
    }
  };

  // Get status label
  const getStatusLabel = (status) => {
    switch (status) {
      case 'completed': return 'Zakończony';
      case 'achieved': return 'Osiągnięty';
      case 'on-track': return 'Na dobrej drodze';
      case 'good': return 'Dobry postęp';
      case 'urgent': return 'Pilny';
      case 'overdue': return 'Po terminie';
      case 'behind': return 'Opóźniony';
      default: return 'Aktywny';
    }
  };

  // Prioritized goals
  const prioritizedGoals = useMemo(() => {
    return prioritizeGoals(
      savingsGoals.filter(g => g.is_active && !g.is_completed),
      monthlyIncome
    );
  }, [savingsGoals, monthlyIncome]);

  // Handle add goal
  const handleAddGoal = () => {
    if (!formData.name || !formData.target_amount || !formData.target_date) {
      alert('Proszę wypełnić wszystkie wymagane pola');
      return;
    }

    onAddGoal({
      ...formData,
      target_amount: parseFloat(formData.target_amount),
      allocation_percentage: parseFloat(formData.allocation_percentage || 0),
      priority: parseInt(formData.priority)
    });

    // Reset form
    setFormData({
      name: '',
      description: '',
      category: 'Inne',
      target_amount: '',
      target_date: '',
      priority: 5,
      auto_allocate: false,
      allocation_percentage: 0,
      account_id: ''
    });
    setShowAddForm(false);
  };

  // Handle add contribution
  const handleAddContribution = (goalId) => {
    if (!contributionAmount || parseFloat(contributionAmount) <= 0) {
      alert('Proszę wprowadzić prawidłową kwotę');
      return;
    }

    const goal = savingsGoals.find(g => g.id === goalId);
    const amount = parseFloat(contributionAmount);
    const newCurrentAmount = parseFloat(goal.current_amount || 0) + amount;

    // Update goal
    onUpdateGoal(goalId, { current_amount: newCurrentAmount });

    // Add contribution record
    onAddContribution({
      goal_id: goalId,
      amount: amount,
      contribution_type: 'manual',
      note: contributionNote
    });

    // Check milestones
    const milestones = checkMilestones({
      ...goal,
      current_amount: newCurrentAmount
    });

    if (milestones.length > 0) {
      onShowCelebration?.(milestones[milestones.length - 1]);
    }

    // Update milestone flags if needed
    const progress = (newCurrentAmount / goal.target_amount) * 100;
    const updates = {};
    if (progress >= 25 && !goal.milestone_25_reached) updates.milestone_25_reached = true;
    if (progress >= 50 && !goal.milestone_50_reached) updates.milestone_50_reached = true;
    if (progress >= 75 && !goal.milestone_75_reached) updates.milestone_75_reached = true;
    if (progress >= 100 && !goal.milestone_100_reached) {
      updates.milestone_100_reached = true;
      updates.is_completed = true;
      updates.completed_date = new Date().toISOString().split('T')[0];
    }

    if (Object.keys(updates).length > 0) {
      onUpdateGoal(goalId, updates);
    }

    // Reset form
    setContributionAmount('');
    setContributionNote('');
    setShowContributionForm(null);
  };

  return (
    <div className="bg-white rounded-2xl shadow-lg p-4 sm:p-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-gray-800">Cele Oszczędnościowe</h2>
          <p className="text-sm text-gray-600 mt-1">
            {prioritizedGoals.length} aktywnych celów
          </p>
        </div>
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="flex items-center justify-center gap-2 px-4 py-3 rounded-lg transition-colors font-medium text-white w-full sm:w-auto"
          style={{ backgroundColor: THEME.primary }}
          onMouseOver={(e) => e.currentTarget.style.backgroundColor = THEME.primaryHover}
          onMouseOut={(e) => e.currentTarget.style.backgroundColor = THEME.primary}
        >
          <PlusCircle size={20} />
          Dodaj Cel
        </button>
      </div>

      {/* Add Goal Form */}
      {showAddForm && (
        <div className="rounded-xl p-6 mb-6 border-2" style={{ backgroundColor: THEME.primaryLight, borderColor: THEME.primary }}>
          <h3 className="font-semibold text-gray-800 mb-4">Nowy Cel Oszczędnościowy</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nazwa celu *
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="np. Wakacje w Hiszpanii"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Kategoria *
              </label>
              <select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:border-transparent"
              >
                {getGoalCategories().map((cat) => (
                  <option key={cat.value} value={cat.value}>
                    {cat.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Kwota docelowa (PLN) *
              </label>
              <input
                type="number"
                step="0.01"
                value={formData.target_amount}
                onChange={(e) => setFormData({ ...formData, target_amount: e.target.value })}
                placeholder="5000.00"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Data docelowa *
              </label>
              <input
                type="date"
                value={formData.target_date}
                onChange={(e) => setFormData({ ...formData, target_date: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Priorytet (1-10)
              </label>
              <input
                type="number"
                min="1"
                max="10"
                value={formData.priority}
                onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Konto oszczędnościowe
              </label>
              <select
                value={formData.account_id}
                onChange={(e) => setFormData({ ...formData, account_id: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:border-transparent"
              >
                <option value="">Wybierz konto (opcjonalne)</option>
                {accounts.map((account) => (
                  <option key={account.id} value={account.id}>
                    {account.name} ({formatCurrency(account.balance)})
                  </option>
                ))}
              </select>
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Opis (opcjonalnie)
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Dodatkowe informacje o celu..."
                rows="2"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:border-transparent"
              />
            </div>
            <div className="md:col-span-2">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.auto_allocate}
                  onChange={(e) => setFormData({ ...formData, auto_allocate: e.target.checked })}
                  className="w-4 h-4 rounded"
                />
                <span className="text-sm font-medium text-gray-700">
                  Automatyczna alokacja z dochodów
                </span>
              </label>
              {formData.auto_allocate && (
                <div className="mt-2">
                  <label className="block text-sm text-gray-600 mb-1">
                    Procent dochodu (%)
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    step="0.5"
                    value={formData.allocation_percentage}
                    onChange={(e) => setFormData({ ...formData, allocation_percentage: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:border-transparent"
                  />
                </div>
              )}
            </div>
          </div>
          <div className="flex flex-col sm:flex-row gap-3 mt-4">
            <button
              onClick={handleAddGoal}
              className="w-full sm:w-auto px-6 py-3 rounded-lg transition-colors font-medium text-white"
              style={{ backgroundColor: THEME.primary }}
              onMouseOver={(e) => e.currentTarget.style.backgroundColor = THEME.primaryHover}
              onMouseOut={(e) => e.currentTarget.style.backgroundColor = THEME.primary}
            >
              Zapisz Cel
            </button>
            <button
              onClick={() => setShowAddForm(false)}
              className="w-full sm:w-auto bg-gray-200 hover:bg-gray-300 text-gray-700 px-6 py-3 rounded-lg transition-colors font-medium"
            >
              Anuluj
            </button>
          </div>
        </div>
      )}

      {/* Goals List */}
      <div className="space-y-4">
        {prioritizedGoals.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <Target size={48} className="mx-auto mb-4 opacity-50" />
            <p className="text-lg">Brak aktywnych celów oszczędnościowych</p>
            <p className="text-sm">Dodaj swój pierwszy cel, aby rozpocząć oszczędzanie!</p>
          </div>
        ) : (
          prioritizedGoals.map((goal) => {
            const progress = calculateProgress(goal);
            const status = getGoalStatus(goal);
            const statusColor = getStatusColor(status);
            const daysRemaining = getDaysRemaining(goal.target_date);
            const requiredMonthly = calculateRequiredMonthlyContribution(goal);
            const recommendations = getGoalRecommendations(goal, monthlyIncome);
            const IconComponent = getCategoryIcon(goal.category);

            return (
              <div
                key={goal.id}
                className="p-6 bg-gradient-to-r from-gray-50 to-white rounded-xl border-2 border-gray-200 hover:border-gray-300 transition-all"
              >
                {/* Header */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-start gap-4">
                    <div
                      className="w-14 h-14 rounded-full flex items-center justify-center flex-shrink-0"
                      style={{ backgroundColor: statusColor + '20' }}
                    >
                      <IconComponent style={{ color: statusColor }} size={24} />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-gray-800">{goal.name}</h3>
                      {goal.description && (
                        <p className="text-sm text-gray-600 mt-1">{goal.description}</p>
                      )}
                      <div className="flex items-center gap-3 mt-2 flex-wrap">
                        <span
                          className="text-xs px-3 py-1 rounded-full font-medium"
                          style={{ backgroundColor: statusColor + '20', color: statusColor }}
                        >
                          {getStatusLabel(status)}
                        </span>
                        <span className="text-xs text-gray-600">
                          Priorytet: {goal.priority}/10
                        </span>
                        {goal.auto_allocate && (
                          <span className="text-xs px-3 py-1 rounded-full bg-blue-100 text-blue-700">
                            Auto {goal.allocation_percentage}%
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setEditingGoalId(goal.id)}
                      className="p-2 text-gray-600 hover:text-blue-600 transition-colors"
                    >
                      <Edit2 size={18} />
                    </button>
                    <button
                      onClick={() => {
                        if (window.confirm('Czy na pewno chcesz usunąć ten cel?')) {
                          onDeleteGoal(goal.id);
                        }
                      }}
                      className="p-2 text-gray-600 hover:text-red-600 transition-colors"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="mb-4">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-medium text-gray-700">
                      {formatCurrency(goal.current_amount || 0)} / {formatCurrency(goal.target_amount)}
                    </span>
                    <span className="text-sm font-bold" style={{ color: statusColor }}>
                      {Math.round(progress)}%
                    </span>
                  </div>
                  <div className="w-full h-4 bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className="h-full transition-all duration-500 rounded-full"
                      style={{
                        width: `${Math.min(100, progress)}%`,
                        backgroundColor: statusColor
                      }}
                    />
                  </div>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-4">
                  <div className="bg-white p-3 rounded-lg border border-gray-200">
                    <div className="flex items-center gap-2 text-gray-600 text-xs mb-1">
                      <Calendar size={14} />
                      Dni pozostało
                    </div>
                    <div className="text-lg font-bold text-gray-800">
                      {daysRemaining > 0 ? daysRemaining : 0}
                    </div>
                  </div>
                  <div className="bg-white p-3 rounded-lg border border-gray-200">
                    <div className="flex items-center gap-2 text-gray-600 text-xs mb-1">
                      <TrendingUp size={14} />
                      Wymagane/mies.
                    </div>
                    <div className="text-lg font-bold text-gray-800">
                      {formatCurrency(requiredMonthly)}
                    </div>
                  </div>
                  <div className="bg-white p-3 rounded-lg border border-gray-200 col-span-2 sm:col-span-1">
                    <div className="flex items-center gap-2 text-gray-600 text-xs mb-1">
                      <Target size={14} />
                      Do uzbierania
                    </div>
                    <div className="text-lg font-bold text-gray-800">
                      {formatCurrency(Math.max(0, goal.target_amount - (goal.current_amount || 0)))}
                    </div>
                  </div>
                </div>

                {/* Recommendations */}
                {recommendations.length > 0 && (
                  <div className="space-y-2 mb-4">
                    {recommendations.map((rec, idx) => (
                      <div
                        key={idx}
                        className={`p-3 rounded-lg border-l-4 ${
                          rec.type === 'urgent' ? 'bg-red-50 border-red-500' :
                          rec.type === 'warning' ? 'bg-yellow-50 border-yellow-500' :
                          rec.type === 'success' ? 'bg-green-50 border-green-500' :
                          'bg-blue-50 border-blue-500'
                        }`}
                      >
                        <p className="text-sm font-medium text-gray-800">{rec.message}</p>
                        <p className="text-xs text-gray-600 mt-1">{rec.suggestion}</p>
                      </div>
                    ))}
                  </div>
                )}

                {/* Actions */}
                <div className="flex gap-2">
                  {showContributionForm === goal.id ? (
                    <div className="flex-1 flex gap-2">
                      <input
                        type="number"
                        step="0.01"
                        value={contributionAmount}
                        onChange={(e) => setContributionAmount(e.target.value)}
                        placeholder="Kwota"
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:border-transparent"
                      />
                      <button
                        onClick={() => handleAddContribution(goal.id)}
                        className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors"
                      >
                        <Save size={18} />
                      </button>
                      <button
                        onClick={() => {
                          setShowContributionForm(null);
                          setContributionAmount('');
                        }}
                        className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg transition-colors"
                      >
                        <X size={18} />
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setShowContributionForm(goal.id)}
                      className="flex items-center gap-2 px-4 py-2 rounded-lg transition-colors font-medium text-white"
                      style={{ backgroundColor: THEME.success }}
                    >
                      <DollarSign size={18} />
                      Dodaj wpłatę
                    </button>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Completed Goals */}
      {savingsGoals.filter(g => g.is_completed).length > 0 && (
        <div className="mt-8">
          <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
            <CheckCircle size={20} className="text-green-600" />
            Ukończone cele ({savingsGoals.filter(g => g.is_completed).length})
          </h3>
          <div className="space-y-2">
            {savingsGoals.filter(g => g.is_completed).map((goal) => (
              <div
                key={goal.id}
                className="p-4 bg-green-50 border-2 border-green-200 rounded-lg flex items-center justify-between"
              >
                <div className="flex items-center gap-3">
                  <Sparkles size={20} className="text-green-600" />
                  <div>
                    <div className="font-medium text-gray-800">{goal.name}</div>
                    <div className="text-sm text-gray-600">
                      {formatCurrency(goal.target_amount)} - Ukończono {goal.completed_date}
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => {
                    if (window.confirm('Czy na pewno chcesz usunąć ten cel?')) {
                      onDeleteGoal(goal.id);
                    }
                  }}
                  className="p-2 text-gray-600 hover:text-red-600 transition-colors"
                >
                  <Trash2 size={18} />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default SavingsGoalsTab;
