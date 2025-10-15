import React, { useState } from 'react';
import { PlusCircle, TrendingUp, TrendingDown, DollarSign, Calendar, Trash2, Tag, Edit2, Save, X, Filter } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, BarChart, Bar } from 'recharts';

const BudgetApp = () => {
  // ========================================
  // CENTRALIZED THEME - Change colors here to update entire app!
  // ========================================
  const THEME = {
    primary: '#3b82f6',        // Blue - primary buttons, tabs, balance
    primaryHover: '#2563eb',   // Darker blue for hover
    primaryLight: '#dbeafe',   // Light blue for backgrounds
    success: '#10b981',        // Green - income, success, remaining budget
    successHover: '#059669',   // Darker green for hover
    successLight: '#d1fae5',   // Light green for backgrounds
    danger: '#ef4444',         // Red - expenses, over budget, delete
    dangerHover: '#dc2626',    // Darker red for hover
    dangerLight: '#fee2e2',    // Light red for backgrounds
    warning: '#f59e0b',        // Orange - warnings, 80% budget
    warningHover: '#d97706',   // Darker orange for hover
    info: '#8b5cf6',           // Purple - info, accents
    // Chart colors array
    chartColors: ['#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#14b8a6', '#f97316']
  };

  const [activeTab, setActiveTab] = useState('dashboard');
  
  // Mock data
  const [transactions, setTransactions] = useState([
    { id: 1, date: '2025-10-14', description: 'Grocery Store', amount: -85.50, category: 'Food' },
    { id: 2, date: '2025-10-13', description: 'Salary', amount: 3000, category: 'Income' },
    { id: 3, date: '2025-10-12', description: 'Gas Station', amount: -45.00, category: 'Transportation' },
    { id: 4, date: '2025-10-10', description: 'Netflix', amount: -15.99, category: 'Entertainment' },
    { id: 5, date: '2025-10-08', description: 'Restaurant', amount: -67.30, category: 'Food' },
  ]);

  const [budgets, setBudgets] = useState([
    { id: 1, category: 'Food', limit: 400, spent: 152.80 },
    { id: 2, category: 'Transportation', limit: 200, spent: 45.00 },
    { id: 3, category: 'Entertainment', limit: 100, spent: 15.99 },
    { id: 4, category: 'Shopping', limit: 300, spent: 0 },
  ]);

  const [recurringRules, setRecurringRules] = useState([
    { 
      id: 1, 
      description: 'Monthly Salary', 
      amount: 3000, 
      category: 'Income', 
      frequency: 'monthly',
      dayOfMonth: 1,
      startDate: '2025-01-01',
      lastGenerated: '2025-10-01',
      active: true
    },
    { 
      id: 2, 
      description: 'Netflix Subscription', 
      amount: -15.99, 
      category: 'Entertainment', 
      frequency: 'monthly',
      dayOfMonth: 10,
      startDate: '2025-01-10',
      lastGenerated: '2025-10-10',
      active: true
    },
  ]);

  const [categories, setCategories] = useState(['Food', 'Transportation', 'Entertainment', 'Shopping', 'Income', 'Other']);
  
  const [showAddTransaction, setShowAddTransaction] = useState(false);
  const [showAddCategory, setShowAddCategory] = useState(false);
  const [showAddRecurring, setShowAddRecurring] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [editingCategoryName, setEditingCategoryName] = useState('');
  const [editingCategoryLimit, setEditingCategoryLimit] = useState('');
  const [newCategoryName, setNewCategoryName] = useState('');
  const [newCategoryLimit, setNewCategoryLimit] = useState('');
  
  const [newTransaction, setNewTransaction] = useState({
    date: new Date().toISOString().split('T')[0],
    description: '',
    amount: '',
    category: 'Food',
  });

  const [newRecurring, setNewRecurring] = useState({
    description: '',
    amount: '',
    category: 'Food',
    frequency: 'monthly',
    dayOfMonth: 1,
    startDate: new Date().toISOString().split('T')[0],
  });

  // Filter state
  const [showFilters, setShowFilters] = useState(false);
  const [filterStartDate, setFilterStartDate] = useState('');
  const [filterEndDate, setFilterEndDate] = useState('');
  const [selectedCategories, setSelectedCategories] = useState([]);

  // Filter functions
  const toggleCategoryFilter = (category) => {
    if (selectedCategories.includes(category)) {
      setSelectedCategories(selectedCategories.filter(c => c !== category));
    } else {
      setSelectedCategories([...selectedCategories, category]);
    }
  };

  const clearFilters = () => {
    setFilterStartDate('');
    setFilterEndDate('');
    setSelectedCategories([]);
  };

  const hasActiveFilters = filterStartDate || filterEndDate || selectedCategories.length > 0;

  // Apply filters to transactions
  const filteredTransactions = transactions.filter(t => {
    if (filterStartDate && t.date < filterStartDate) return false;
    if (filterEndDate && t.date > filterEndDate) return false;
    if (selectedCategories.length > 0 && !selectedCategories.includes(t.category)) return false;
    return true;
  });

  const totalIncome = filteredTransactions
    .filter(t => t.amount > 0)
    .reduce((sum, t) => sum + t.amount, 0);

  const totalExpenses = filteredTransactions
    .filter(t => t.amount < 0)
    .reduce((sum, t) => sum + Math.abs(t.amount), 0);

  const balance = totalIncome - totalExpenses;

  // Chart data preparation
  const COLORS = THEME.chartColors;

  const categorySpendingData = categories
    .map(category => {
      const spent = filteredTransactions
        .filter(t => t.category === category && t.amount < 0)
        .reduce((sum, t) => sum + Math.abs(t.amount), 0);
      return { name: category, value: spent };
    })
    .filter(item => item.value > 0)
    .sort((a, b) => b.value - a.value);

  const getMonthlyData = () => {
    const monthlyMap = {};
    
    filteredTransactions.forEach(t => {
      const month = t.date.substring(0, 7);
      if (!monthlyMap[month]) {
        monthlyMap[month] = { month, income: 0, expenses: 0 };
      }
      if (t.amount > 0) {
        monthlyMap[month].income += t.amount;
      } else {
        monthlyMap[month].expenses += Math.abs(t.amount);
      }
    });

    return Object.values(monthlyMap)
      .sort((a, b) => a.month.localeCompare(b.month))
      .map(item => ({
        ...item,
        balance: item.income - item.expenses
      }));
  };

  const monthlyData = getMonthlyData();

  const handleAddTransaction = () => {
    if (newTransaction.description && newTransaction.amount) {
      const transaction = {
        id: Date.now(),
        date: newTransaction.date,
        description: newTransaction.description,
        amount: parseFloat(newTransaction.amount),
        category: newTransaction.category,
      };
      
      setTransactions([transaction, ...transactions]);
      
      if (transaction.amount < 0) {
        setBudgets(budgets.map(b => 
          b.category === transaction.category 
            ? { ...b, spent: b.spent + Math.abs(transaction.amount) }
            : b
        ));
      }
      
      setNewTransaction({
        date: new Date().toISOString().split('T')[0],
        description: '',
        amount: '',
        category: 'Food',
      });
      setShowAddTransaction(false);
    }
  };

  const handleDeleteTransaction = (id) => {
    const transaction = transactions.find(t => t.id === id);
    
    if (transaction.amount < 0) {
      setBudgets(budgets.map(b => 
        b.category === transaction.category 
          ? { ...b, spent: Math.max(0, b.spent - Math.abs(transaction.amount)) }
          : b
      ));
    }
    
    setTransactions(transactions.filter(t => t.id !== id));
  };

  const handleAddCategory = () => {
    if (newCategoryName && newCategoryLimit) {
      const newBudget = {
        id: Date.now(),
        category: newCategoryName,
        limit: parseFloat(newCategoryLimit),
        spent: 0
      };
      setBudgets([...budgets, newBudget]);
      setCategories([...categories, newCategoryName]);
      setNewCategoryName('');
      setNewCategoryLimit('');
      setShowAddCategory(false);
    }
  };

  const handleUpdateCategory = (id, newName, newLimit) => {
    const oldBudget = budgets.find(b => b.id === id);
    const oldName = oldBudget.category;
    
    setBudgets(budgets.map(b => 
      b.id === id ? { ...b, category: newName, limit: parseFloat(newLimit) } : b
    ));
    
    setCategories(categories.map(c => c === oldName ? newName : c));
    
    if (oldName !== newName) {
      setTransactions(transactions.map(t => 
        t.category === oldName ? { ...t, category: newName } : t
      ));
    }
    
    setEditingCategory(null);
    setEditingCategoryName('');
    setEditingCategoryLimit('');
  };

  const startEditingCategory = (budget) => {
    setEditingCategory(budget.id);
    setEditingCategoryName(budget.category);
    setEditingCategoryLimit(budget.limit.toString());
  };

  const cancelEditingCategory = () => {
    setEditingCategory(null);
    setEditingCategoryName('');
    setEditingCategoryLimit('');
  };

  const handleDeleteCategory = (categoryName) => {
    const hasTransactions = transactions.some(t => t.category === categoryName);
    if (hasTransactions) {
      alert('Cannot delete category with existing transactions. Please reassign or delete those transactions first.');
      return;
    }
    
    setBudgets(budgets.filter(b => b.category !== categoryName));
    setCategories(categories.filter(c => c !== categoryName));
  };

  // Recurring transaction functions
  const calculateNextOccurrence = (rule) => {
    const today = new Date();
    const lastGen = rule.lastGenerated ? new Date(rule.lastGenerated) : new Date(rule.startDate);
    
    if (rule.frequency === 'monthly') {
      const nextDate = new Date(lastGen);
      nextDate.setMonth(nextDate.getMonth() + 1);
      nextDate.setDate(rule.dayOfMonth);
      return nextDate.toISOString().split('T')[0];
    } else if (rule.frequency === 'weekly') {
      const nextDate = new Date(lastGen);
      nextDate.setDate(nextDate.getDate() + 7);
      return nextDate.toISOString().split('T')[0];
    } else if (rule.frequency === 'yearly') {
      const nextDate = new Date(lastGen);
      nextDate.setFullYear(nextDate.getFullYear() + 1);
      return nextDate.toISOString().split('T')[0];
    }
    return null;
  };

  const generateTransactionsFromRules = () => {
    const today = new Date();
    let newTransactions = [];
    let updatedRules = [...recurringRules];

    recurringRules.forEach((rule, index) => {
      if (!rule.active) return;

      const nextOccurrence = new Date(calculateNextOccurrence(rule));
      const lastGen = rule.lastGenerated ? new Date(rule.lastGenerated) : new Date(rule.startDate);
      
      let currentDate = new Date(lastGen);
      
      while (currentDate < today) {
        if (rule.frequency === 'monthly') {
          currentDate.setMonth(currentDate.getMonth() + 1);
          currentDate.setDate(rule.dayOfMonth);
        } else if (rule.frequency === 'weekly') {
          currentDate.setDate(currentDate.getDate() + 7);
        } else if (rule.frequency === 'yearly') {
          currentDate.setFullYear(currentDate.getFullYear() + 1);
        }

        if (currentDate <= today) {
          const newTransaction = {
            id: Date.now() + Math.random(),
            date: currentDate.toISOString().split('T')[0],
            description: rule.description + ' (Auto)',
            amount: rule.amount,
            category: rule.category,
          };
          newTransactions.push(newTransaction);
          updatedRules[index] = { ...rule, lastGenerated: newTransaction.date };
        }
      }
    });

    if (newTransactions.length > 0) {
      setTransactions([...newTransactions, ...transactions]);
      setRecurringRules(updatedRules);
      
      newTransactions.forEach(t => {
        if (t.amount < 0) {
          setBudgets(budgets.map(b => 
            b.category === t.category 
              ? { ...b, spent: b.spent + Math.abs(t.amount) }
              : b
          ));
        }
      });
    }
  };

  const handleAddRecurring = () => {
    if (newRecurring.description && newRecurring.amount) {
      const rule = {
        id: Date.now(),
        description: newRecurring.description,
        amount: parseFloat(newRecurring.amount),
        category: newRecurring.category,
        frequency: newRecurring.frequency,
        dayOfMonth: parseInt(newRecurring.dayOfMonth),
        startDate: newRecurring.startDate,
        lastGenerated: null,
        active: true,
      };
      setRecurringRules([...recurringRules, rule]);
      setNewRecurring({
        description: '',
        amount: '',
        category: 'Food',
        frequency: 'monthly',
        dayOfMonth: 1,
        startDate: new Date().toISOString().split('T')[0],
      });
      setShowAddRecurring(false);
    }
  };

  const handleToggleRecurring = (id) => {
    setRecurringRules(recurringRules.map(r => 
      r.id === id ? { ...r, active: !r.active } : r
    ));
  };

  const handleDeleteRecurring = (id) => {
    setRecurringRules(recurringRules.filter(r => r.id !== id));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="max-w-7xl mx-auto p-4 md:p-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-2">Budget Tracker</h1>
          <p className="text-gray-600">Manage your finances with ease</p>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-2xl shadow-lg mb-8 p-2">
          <div className="flex gap-2">
            <button
              onClick={() => setActiveTab('dashboard')}
              style={{
                backgroundColor: activeTab === 'dashboard' ? THEME.primary : 'transparent',
                color: activeTab === 'dashboard' ? 'white' : '#4b5563'
              }}
              className={`flex-1 py-3 px-6 rounded-xl font-semibold transition-all ${
                activeTab === 'dashboard' ? 'shadow-md' : 'hover:bg-gray-100'
              }`}
            >
              Dashboard
            </button>
            <button
              onClick={() => setActiveTab('categories')}
              style={{
                backgroundColor: activeTab === 'categories' ? THEME.primary : 'transparent',
                color: activeTab === 'categories' ? 'white' : '#4b5563'
              }}
              className={`flex-1 py-3 px-6 rounded-xl font-semibold transition-all flex items-center justify-center gap-2 ${
                activeTab === 'categories' ? 'shadow-md' : 'hover:bg-gray-100'
              }`}
            >
              <Tag size={20} />
              Categories
            </button>
            <button
              onClick={() => setActiveTab('recurring')}
              style={{
                backgroundColor: activeTab === 'recurring' ? THEME.primary : 'transparent',
                color: activeTab === 'recurring' ? 'white' : '#4b5563'
              }}
              className={`flex-1 py-3 px-6 rounded-xl font-semibold transition-all flex items-center justify-center gap-2 ${
                activeTab === 'recurring' ? 'shadow-md' : 'hover:bg-gray-100'
              }`}
            >
              <Calendar size={20} />
              Recurring
            </button>
          </div>
        </div>

        {activeTab === 'dashboard' ? (
          <>
            {/* Summary Cards */}
            <div className="flex gap-3 mb-8 overflow-x-auto pb-2">
              <div className="bg-white rounded-2xl shadow-lg p-6 min-w-[280px] flex-1" style={{ borderLeft: `4px solid ${THEME.success}` }}>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-gray-600 text-sm font-medium">
                    Total Income {hasActiveFilters && <span className="text-xs">(Filtered)</span>}
                  </span>
                  <TrendingUp style={{ color: THEME.success }} size={24} />
                </div>
                <p className="text-3xl font-bold text-gray-800">${totalIncome.toFixed(2)}</p>
                {hasActiveFilters && (
                  <p className="text-xs text-gray-500 mt-1">
                    {filteredTransactions.filter(t => t.amount > 0).length} transaction(s)
                  </p>
                )}
              </div>

              <div className="bg-white rounded-2xl shadow-lg p-6 min-w-[280px] flex-1" style={{ borderLeft: `4px solid ${THEME.danger}` }}>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-gray-600 text-sm font-medium">
                    Total Expenses {hasActiveFilters && <span className="text-xs">(Filtered)</span>}
                  </span>
                  <TrendingDown style={{ color: THEME.danger }} size={24} />
                </div>
                <p className="text-3xl font-bold text-gray-800">${totalExpenses.toFixed(2)}</p>
                {hasActiveFilters && (
                  <p className="text-xs text-gray-500 mt-1">
                    {filteredTransactions.filter(t => t.amount < 0).length} transaction(s)
                  </p>
                )}
              </div>

              <div className="bg-white rounded-2xl shadow-lg p-6 min-w-[280px] flex-1" style={{ borderLeft: `4px solid ${THEME.primary}` }}>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-gray-600 text-sm font-medium">
                    Balance {hasActiveFilters && <span className="text-xs">(Filtered)</span>}
                  </span>
                  <DollarSign style={{ color: THEME.primary }} size={24} />
                </div>
                <p className="text-3xl font-bold" style={{ color: balance >= 0 ? THEME.success : THEME.danger }}>
                  ${balance.toFixed(2)}
                </p>
                {hasActiveFilters && (
                  <p className="text-xs text-gray-500 mt-1">
                    {filteredTransactions.length} total transaction(s)
                  </p>
                )}
              </div>
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
                  const actualSpent = filteredTransactions
                    .filter(t => t.category === budget.category && t.amount < 0)
                    .reduce((sum, t) => sum + Math.abs(t.amount), 0);
                  
                  const percentage = (actualSpent / budget.limit) * 100;
                  const isOverBudget = percentage > 100;
                  return (
                    <div key={budget.category}>
                      <div className="flex justify-between items-center mb-2">
                        <span className="font-semibold text-gray-700">{budget.category}</span>
                        <span className="text-sm" style={{ color: isOverBudget ? THEME.danger : '#6b7280' }}>
                          ${actualSpent.toFixed(2)} / ${budget.limit.toFixed(2)}
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
                        <Tooltip formatter={(value) => `$${value.toFixed(2)}`} />
                      </PieChart>
                    </ResponsiveContainer>
                    <div className="mt-4 grid grid-cols-2 gap-2">
                      {categorySpendingData.map((item, index) => (
                        <div key={item.name} className="flex items-center gap-2">
                          <div 
                            className="w-3 h-3 rounded-full" 
                            style={{ backgroundColor: COLORS[index % COLORS.length] }}
                          ></div>
                          <span className="text-sm text-gray-700">{item.name}: ${item.value.toFixed(2)}</span>
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
                        formatter={(value) => `$${value.toFixed(2)}`}
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
                        const actualSpent = filteredTransactions
                          .filter(t => t.category === budget.category && t.amount < 0)
                          .reduce((sum, t) => sum + Math.abs(t.amount), 0);
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
                    <Tooltip formatter={(value) => `$${value.toFixed(2)}`} />
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
                      <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
                      <select
                        value={newTransaction.category}
                        onChange={(e) => setNewTransaction({ ...newTransaction, category: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:border-transparent"
                      >
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
                        {transaction.amount > 0 ? '+' : ''}${transaction.amount.toFixed(2)}
                      </span>
                      <button
                        onClick={() => handleDeleteTransaction(transaction.id)}
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
        ) : activeTab === 'categories' ? (
          /* Category Management Tab */
          <div className="bg-white rounded-2xl shadow-lg p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-gray-800">Manage Categories</h2>
              <button
                onClick={() => setShowAddCategory(!showAddCategory)}
                className="flex items-center gap-2 px-4 py-2 rounded-lg transition-colors font-medium text-white"
                style={{ backgroundColor: THEME.primary }}
                onMouseOver={(e) => e.currentTarget.style.backgroundColor = THEME.primaryHover}
                onMouseOut={(e) => e.currentTarget.style.backgroundColor = THEME.primary}
              >
                <PlusCircle size={20} />
                Add Category
              </button>
            </div>

            {/* Add Category Form */}
            {showAddCategory && (
              <div className="rounded-xl p-6 mb-6 border-2" style={{ backgroundColor: THEME.primaryLight, borderColor: THEME.primary }}>
                <h3 className="font-semibold text-gray-800 mb-4">New Category</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Category Name</label>
                    <input
                      type="text"
                      value={newCategoryName}
                      onChange={(e) => setNewCategoryName(e.target.value)}
                      placeholder="e.g., Healthcare, Utilities"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Monthly Budget Limit</label>
                    <input
                      type="number"
                      step="0.01"
                      value={newCategoryLimit}
                      onChange={(e) => setNewCategoryLimit(e.target.value)}
                      placeholder="500.00"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:border-transparent"
                    />
                  </div>
                </div>
                <div className="flex gap-3 mt-4">
                  <button
                    onClick={handleAddCategory}
                    className="px-6 py-2 rounded-lg transition-colors font-medium text-white"
                    style={{ backgroundColor: THEME.primary }}
                    onMouseOver={(e) => e.currentTarget.style.backgroundColor = THEME.primaryHover}
                    onMouseOut={(e) => e.currentTarget.style.backgroundColor = THEME.primary}
                  >
                    Save Category
                  </button>
                  <button
                    onClick={() => setShowAddCategory(false)}
                    className="bg-gray-200 hover:bg-gray-300 text-gray-700 px-6 py-2 rounded-lg transition-colors font-medium"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}

            {/* Category List */}
            <div className="space-y-3">
              {budgets.map((budget) => (
                <div
                  key={budget.id}
                  className="p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors"
                >
                  {editingCategory === budget.id ? (
                    /* Editing Mode */
                    <div>
                      <div className="flex items-center gap-4 mb-4">
                        <div className="w-12 h-12 rounded-full flex items-center justify-center" style={{ backgroundColor: THEME.primaryLight }}>
                          <Tag style={{ color: THEME.primary }} size={20} />
                        </div>
                        <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-3">
                          <div>
                            <label className="block text-xs font-medium text-gray-600 mb-1">Category Name</label>
                            <input
                              type="text"
                              value={editingCategoryName}
                              onChange={(e) => setEditingCategoryName(e.target.value)}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2"
                              placeholder="Category name"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-gray-600 mb-1">Budget Limit</label>
                            <input
                              type="number"
                              step="0.01"
                              value={editingCategoryLimit}
                              onChange={(e) => setEditingCategoryLimit(e.target.value)}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2"
                              placeholder="Budget limit"
                            />
                          </div>
                        </div>
                      </div>
                      <div className="flex gap-2 justify-end">
                        <button
                          onClick={() => handleUpdateCategory(budget.id, editingCategoryName, editingCategoryLimit)}
                          className="flex items-center gap-1 px-4 py-2 rounded-lg transition-colors text-sm font-medium text-white"
                          style={{ backgroundColor: THEME.primary }}
                          onMouseOver={(e) => e.currentTarget.style.backgroundColor = THEME.primaryHover}
                          onMouseOut={(e) => e.currentTarget.style.backgroundColor = THEME.primary}
                        >
                          <Save size={16} />
                          Save
                        </button>
                        <button
                          onClick={cancelEditingCategory}
                          className="flex items-center gap-1 bg-gray-200 hover:bg-gray-300 text-gray-700 px-4 py-2 rounded-lg transition-colors text-sm font-medium"
                        >
                          <X size={16} />
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    /* View Mode */
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4 flex-1">
                        <div className="w-12 h-12 rounded-full flex items-center justify-center" style={{ backgroundColor: THEME.primaryLight }}>
                          <Tag style={{ color: THEME.primary }} size={20} />
                        </div>
                        <div className="flex-1">
                          <p className="font-semibold text-gray-800 text-lg">{budget.category}</p>
                          <p className="text-sm text-gray-600">
                            ${budget.spent.toFixed(2)} spent of ${budget.limit.toFixed(2)} budget
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-xl font-bold text-gray-800">
                          ${budget.limit.toFixed(2)}
                        </span>
                        <button
                          onClick={() => startEditingCategory(budget)}
                          className="transition-colors p-2"
                          style={{ color: THEME.primary }}
                          onMouseOver={(e) => e.currentTarget.style.color = THEME.primaryHover}
                          onMouseOut={(e) => e.currentTarget.style.color = THEME.primary}
                          title="Edit category"
                        >
                          <Edit2 size={18} />
                        </button>
                        <button
                          onClick={() => handleDeleteCategory(budget.category)}
                          className="transition-colors p-2"
                          style={{ color: THEME.danger }}
                          onMouseOver={(e) => e.currentTarget.style.color = THEME.dangerHover}
                          onMouseOut={(e) => e.currentTarget.style.color = THEME.danger}
                          title="Delete category"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        ) : (
          /* Recurring Transactions Tab */
          <div className="bg-white rounded-2xl shadow-lg p-6">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h2 className="text-2xl font-bold text-gray-800">Recurring Transactions</h2>
                <p className="text-gray-600 text-sm mt-1">Set up automatic recurring transactions</p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={generateTransactionsFromRules}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg transition-colors font-medium text-white"
                  style={{ backgroundColor: THEME.success }}
                  onMouseOver={(e) => e.currentTarget.style.backgroundColor = THEME.successHover}
                  onMouseOut={(e) => e.currentTarget.style.backgroundColor = THEME.success}
                  title="Generate all pending transactions from active rules"
                >
                  <Calendar size={20} />
                  Generate Now
                </button>
                <button
                  onClick={() => setShowAddRecurring(!showAddRecurring)}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg transition-colors font-medium text-white"
                  style={{ backgroundColor: THEME.primary }}
                  onMouseOver={(e) => e.currentTarget.style.backgroundColor = THEME.primaryHover}
                  onMouseOut={(e) => e.currentTarget.style.backgroundColor = THEME.primary}
                >
                  <PlusCircle size={20} />
                  Add Rule
                </button>
              </div>
            </div>

            {/* Info Box */}
            <div className="rounded-lg p-4 mb-6" style={{ backgroundColor: THEME.primaryLight, borderColor: THEME.primary, border: '1px solid' }}>
              <p className="text-sm text-gray-700">
                <strong>💡 How it works:</strong> Create rules for recurring income or expenses (salary, subscriptions, rent, etc.). 
                Click <strong>"Generate Now"</strong> to create all pending transactions based on your active rules. 
                The app tracks the last generated date to avoid duplicates.
              </p>
            </div>

            {/* Add Recurring Rule Form */}
            {showAddRecurring && (
              <div className="rounded-xl p-6 mb-6 border-2" style={{ backgroundColor: THEME.primaryLight, borderColor: THEME.primary }}>
                <h3 className="font-semibold text-gray-800 mb-4">New Recurring Rule</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                    <input
                      type="text"
                      value={newRecurring.description}
                      onChange={(e) => setNewRecurring({ ...newRecurring, description: e.target.value })}
                      placeholder="Monthly rent, salary, etc."
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
                    <select
                      value={newRecurring.category}
                      onChange={(e) => setNewRecurring({ ...newRecurring, category: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:border-transparent"
                    >
                      {categories.map((cat) => (
                        <option key={cat} value={cat}>
                          {cat}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Amount (negative for expenses)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={newRecurring.amount}
                      onChange={(e) => setNewRecurring({ ...newRecurring, amount: e.target.value })}
                      placeholder="-50.00 or 3000.00"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Frequency</label>
                    <select
                      value={newRecurring.frequency}
                      onChange={(e) => setNewRecurring({ ...newRecurring, frequency: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:border-transparent"
                    >
                      <option value="weekly">Weekly</option>
                      <option value="monthly">Monthly</option>
                      <option value="yearly">Yearly</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {newRecurring.frequency === 'monthly' || newRecurring.frequency === 'yearly' ? 'Day of Month' : 'Start Date'}
                    </label>
                    {newRecurring.frequency === 'monthly' || newRecurring.frequency === 'yearly' ? (
                      <input
                        type="number"
                        min="1"
                        max="31"
                        value={newRecurring.dayOfMonth}
                        onChange={(e) => setNewRecurring({ ...newRecurring, dayOfMonth: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:border-transparent"
                      />
                    ) : (
                      <input
                        type="date"
                        value={newRecurring.startDate}
                        onChange={(e) => setNewRecurring({ ...newRecurring, startDate: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:border-transparent"
                      />
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Start Date</label>
                    <input
                      type="date"
                      value={newRecurring.startDate}
                      onChange={(e) => setNewRecurring({ ...newRecurring, startDate: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:border-transparent"
                    />
                  </div>
                </div>
                <div className="flex gap-3 mt-4">
                  <button
                    onClick={handleAddRecurring}
                    className="px-6 py-2 rounded-lg transition-colors font-medium text-white"
                    style={{ backgroundColor: THEME.primary }}
                    onMouseOver={(e) => e.currentTarget.style.backgroundColor = THEME.primaryHover}
                    onMouseOut={(e) => e.currentTarget.style.backgroundColor = THEME.primary}
                  >
                    Save Rule
                  </button>
                  <button
                    onClick={() => setShowAddRecurring(false)}
                    className="bg-gray-200 hover:bg-gray-300 text-gray-700 px-6 py-2 rounded-lg transition-colors font-medium"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}

            {/* Recurring Rules List */}
            <div className="space-y-3">
              {recurringRules.map((rule) => (
                <div
                  key={rule.id}
                  className={`p-4 rounded-xl transition-colors ${
                    rule.active ? 'bg-gray-50 hover:bg-gray-100' : 'bg-gray-200 opacity-60'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4 flex-1">
                      <div
                        className="w-12 h-12 rounded-full flex items-center justify-center"
                        style={{ backgroundColor: rule.amount > 0 ? THEME.successLight : THEME.dangerLight }}
                      >
                        <Calendar style={{ color: rule.amount > 0 ? THEME.success : THEME.danger }} size={20} />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-3">
                          <p className="font-semibold text-gray-800 text-lg">{rule.description}</p>
                          {!rule.active && (
                            <span className="px-2 py-0.5 bg-gray-400 text-white rounded-full text-xs font-medium">
                              Paused
                            </span>
                          )}
                        </div>
                        <div className="flex gap-4 text-sm text-gray-600 mt-1">
                          <span className="px-2 py-0.5 rounded-full text-xs font-medium" style={{ backgroundColor: THEME.primaryLight, color: THEME.primary }}>
                            {rule.category}
                          </span>
                          <span className="capitalize">{rule.frequency}</span>
                          {rule.frequency !== 'weekly' && <span>Day {rule.dayOfMonth}</span>}
                          <span>Next: {calculateNextOccurrence(rule)}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span
                        className="text-xl font-bold"
                        style={{ color: rule.amount > 0 ? THEME.success : THEME.danger }}
                      >
                        {rule.amount > 0 ? '+' : ''}${rule.amount.toFixed(2)}
                      </span>
                      <button
                        onClick={() => handleToggleRecurring(rule.id)}
                        className="px-3 py-1 rounded-lg text-sm font-medium transition-colors"
                        style={{
                          backgroundColor: rule.active ? '#fef3c7' : THEME.successLight,
                          color: rule.active ? '#92400e' : THEME.success
                        }}
                      >
                        {rule.active ? 'Pause' : 'Resume'}
                      </button>
                      <button
                        onClick={() => handleDeleteRecurring(rule.id)}
                        className="transition-colors p-2"
                        style={{ color: THEME.danger }}
                        onMouseOver={(e) => e.currentTarget.style.color = THEME.dangerHover}
                        onMouseOut={(e) => e.currentTarget.style.color = THEME.danger}
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {recurringRules.length === 0 && (
              <div className="text-center py-12 text-gray-500">
                <Calendar size={48} className="mx-auto mb-4 opacity-50" />
                <p className="text-lg">No recurring rules yet</p>
                <p className="text-sm">Create a rule to automatically generate transactions</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default BudgetApp;
