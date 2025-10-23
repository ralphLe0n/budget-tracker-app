import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { PlusCircle, TrendingUp, TrendingDown, DollarSign, Calendar, Trash2, Tag, Edit2, Save, X, Filter, LogOut, LayoutDashboard, Repeat, Wallet, CreditCard } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, BarChart, Bar } from 'recharts';
import { supabase } from './supabaseClient';

const BudgetApp = ({ session }) => {
  // ========================================
  // LOAD DATA FROM SUPABASE ON MOUNT
  // ========================================
  useEffect(() => {
    loadDataFromSupabase();
  }, []);

  const loadDataFromSupabase = async () => {
    setIsLoading(true);
    setError(null);
    try {
      // Load transactions
      const { data: transactionsData, error: transError } = await supabase
        .from('transactions')
        .select('*')
        .eq('user_id', session.user.id)
        .order('date', { ascending: false });

      if (transError) throw transError;
      if (transactionsData) {
        const formattedTransactions = transactionsData.map(t => ({
          id: t.id,
          date: t.date,
          description: t.description,
          amount: parseFloat(t.amount),
          category: t.category,
          account_id: t.account_id
        }));
        setTransactions(formattedTransactions);
      }

      // Load budgets
      const { data: budgetsData, error: budgetError } = await supabase
        .from('budgets')
        .select('*')
        .eq('user_id', session.user.id);

      if (budgetError) throw budgetError;
      if (budgetsData) {
        const formattedBudgets = budgetsData.map(b => ({
          id: b.id,
          category: b.category,
          limit: parseFloat(b.limit_amount),
          spent: parseFloat(b.spent)
        }));
        setBudgets(formattedBudgets);
      }

      // Load categories
      const { data: categoriesData, error: catError } = await supabase
        .from('categories')
        .select('*')
        .eq('user_id', session.user.id);

      if (catError) throw catError;
      if (categoriesData) {
        const categoryNames = categoriesData.map(c => c.name);
        setCategories(categoryNames);
      }

      // Load recurring rules
      const { data: recurringData, error: recurError } = await supabase
        .from('recurring_rules')
        .select('*')
        .eq('user_id', session.user.id);

      if (recurError) throw recurError;
      if (recurringData) {
        const formattedRules = recurringData.map(r => ({
          id: r.id,
          description: r.description,
          amount: parseFloat(r.amount),
          category: r.category,
          frequency: r.frequency,
          dayOfMonth: r.day_of_month,
          startDate: r.start_date,
          lastGenerated: r.last_generated,
          active: r.active,
          account_id: r.account_id
        }));
        setRecurringRules(formattedRules);
      }

      // Load accounts
      const { data: accountsData, error: accountsError } = await supabase
        .from('accounts')
        .select('*')
        .eq('user_id', session.user.id)
        .order('created_at', { ascending: true });

      if (accountsError) throw accountsError;
      if (accountsData) {
        const formattedAccounts = accountsData.map(a => ({
          id: a.id,
          name: a.name,
          type: a.type,
          balance: parseFloat(a.balance),
          starting_balance: parseFloat(a.starting_balance)
        }));
        setAccounts(formattedAccounts);
      }

    } catch (error) {
      console.error('Error loading data:', error);
      setError('Failed to load data from database: ' + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  // Logout handler
  const handleSignOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
    } catch (error) {
      console.error('Error signing out:', error);
      alert('Failed to sign out: ' + error.message);
    }
  };

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

  const [transactions, setTransactions] = useState([]);
  const [budgets, setBudgets] = useState([]);
  const [recurringRules, setRecurringRules] = useState([]);
  const [categories, setCategories] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const [showAddTransaction, setShowAddTransaction] = useState(false);
  const [showAddCategory, setShowAddCategory] = useState(false);
  const [showAddRecurring, setShowAddRecurring] = useState(false);
  const [showAddAccount, setShowAddAccount] = useState(false);
  const [showAddBudget, setShowAddBudget] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [editingCategoryName, setEditingCategoryName] = useState('');
  const [editingCategoryLimit, setEditingCategoryLimit] = useState('');
  const [newCategoryName, setNewCategoryName] = useState('');
  const [newCategoryLimit, setNewCategoryLimit] = useState('');
  const [deleteConfirm, setDeleteConfirm] = useState({ show: false, type: null, id: null, name: '' });
  
  const [newTransaction, setNewTransaction] = useState({
    date: new Date().toISOString().split('T')[0],
    description: '',
    amount: '',
    category: '',
    account_id: '',
  });

  const [newAccount, setNewAccount] = useState({
    name: '',
    type: 'wallet',
    starting_balance: '',
  });

  const [newRecurring, setNewRecurring] = useState({
    description: '',
    amount: '',
    category: 'Food',
    frequency: 'monthly',
    dayOfMonth: 1,
    startDate: new Date().toISOString().split('T')[0],
    account_id: '',
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

  // Apply filters to transactions (optimized with useMemo)
  const filteredTransactions = useMemo(() => {
    return transactions.filter(t => {
      if (filterStartDate && t.date < filterStartDate) return false;
      if (filterEndDate && t.date > filterEndDate) return false;
      if (selectedCategories.length > 0 && !selectedCategories.includes(t.category)) return false;
      return true;
    });
  }, [transactions, filterStartDate, filterEndDate, selectedCategories]);

  const totalIncome = useMemo(() => {
    return filteredTransactions
      .filter(t => t.amount > 0)
      .reduce((sum, t) => sum + t.amount, 0);
  }, [filteredTransactions]);

  const totalExpenses = useMemo(() => {
    return filteredTransactions
      .filter(t => t.amount < 0)
      .reduce((sum, t) => sum + Math.abs(t.amount), 0);
  }, [filteredTransactions]);

  const balance = useMemo(() => totalIncome - totalExpenses, [totalIncome, totalExpenses]);

  // Chart data preparation
  const COLORS = THEME.chartColors;

  // Pre-calculate spending by category for performance (used in multiple places)
  const spendingByCategory = useMemo(() => {
    return filteredTransactions.reduce((acc, t) => {
      if (t.amount < 0) {
        acc[t.category] = (acc[t.category] || 0) + Math.abs(t.amount);
      }
      return acc;
    }, {});
  }, [filteredTransactions]);

  const categorySpendingData = useMemo(() => {
    return categories
      .map(category => ({
        name: category,
        value: spendingByCategory[category] || 0
      }))
      .filter(item => item.value > 0)
      .sort((a, b) => b.value - a.value);
  }, [categories, spendingByCategory]);

  const monthlyData = useMemo(() => {
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
  }, [filteredTransactions]);

  const handleAddTransaction = async () => {
    if (newTransaction.description && newTransaction.amount && newTransaction.account_id) {
      const transaction = {
        user_id: session.user.id,
        date: newTransaction.date,
        description: newTransaction.description,
        amount: parseFloat(newTransaction.amount),
        category: newTransaction.category,
        account_id: newTransaction.account_id,
      };

      try {
        setIsLoading(true);
        // Insert into Supabase
        const { data, error } = await supabase
          .from('transactions')
          .insert([transaction])
          .select()
          .single();

        if (error) throw error;

        // Add to local state
        const newTrans = {
          id: data.id,
          date: data.date,
          description: data.description,
          amount: parseFloat(data.amount),
          category: data.category,
          account_id: data.account_id
        };
        setTransactions([newTrans, ...transactions]);

        // Update account balance
        const account = accounts.find(a => a.id === newTrans.account_id);
        if (account) {
          const newBalance = account.balance + newTrans.amount;
          await supabase
            .from('accounts')
            .update({ balance: newBalance })
            .eq('id', account.id);

          setAccounts(accounts.map(a =>
            a.id === account.id ? { ...a, balance: newBalance } : a
          ));
        }

        // Update budget spent if expense and category exists
        if (newTrans.amount < 0 && newTrans.category) {
          const budget = budgets.find(b => b.category === newTrans.category);
          if (budget) {
            const newSpent = budget.spent + Math.abs(newTrans.amount);
            await supabase
              .from('budgets')
              .update({ spent: newSpent })
              .eq('id', budget.id);

            setBudgets(budgets.map(b =>
              b.id === budget.id ? { ...b, spent: newSpent } : b
            ));
          }
        }

        setNewTransaction({
          date: new Date().toISOString().split('T')[0],
          description: '',
          amount: '',
          category: '',
          account_id: '',
        });
        setShowAddTransaction(false);
      } catch (error) {
        console.error('Error adding transaction:', error);
        alert('Failed to add transaction: ' + error.message);
      } finally {
        setIsLoading(false);
      }
    }
  };

  const handleDeleteTransaction = async (id) => {
    const transaction = transactions.find(t => t.id === id);

    try {
      setIsLoading(true);
      // Delete from Supabase
      const { error } = await supabase
        .from('transactions')
        .delete()
        .eq('id', id)
        .eq('user_id', session.user.id);

      if (error) throw error;

      // Update account balance (reverse the transaction)
      const account = accounts.find(a => a.id === transaction.account_id);
      if (account) {
        const newBalance = account.balance - transaction.amount;
        await supabase
          .from('accounts')
          .update({ balance: newBalance })
          .eq('id', account.id);

        setAccounts(accounts.map(a =>
          a.id === account.id ? { ...a, balance: newBalance } : a
        ));
      }

      // Update budget spent if expense and has category
      if (transaction.amount < 0 && transaction.category) {
        const budget = budgets.find(b => b.category === transaction.category);
        if (budget) {
          const newSpent = Math.max(0, budget.spent - Math.abs(transaction.amount));
          await supabase
            .from('budgets')
            .update({ spent: newSpent })
            .eq('id', budget.id);

          setBudgets(budgets.map(b =>
            b.id === budget.id ? { ...b, spent: newSpent } : b
          ));
        }
      }

      // Remove from local state
      setTransactions(transactions.filter(t => t.id !== id));
      setDeleteConfirm({ show: false, type: null, id: null, name: '' });
    } catch (error) {
      console.error('Error deleting transaction:', error);
      alert('Failed to delete transaction: ' + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddCategory = async () => {
    if (newCategoryName) {
      try {
        setIsLoading(true);
        // Add category to categories table
        const { error: catError } = await supabase
          .from('categories')
          .insert([{ user_id: session.user.id, name: newCategoryName }]);

        if (catError) throw catError;

        setCategories([...categories, newCategoryName]);
        setNewCategoryName('');
        setShowAddCategory(false);
      } catch (error) {
        console.error('Error adding category:', error);
        alert('Failed to add category: ' + error.message);
      } finally {
        setIsLoading(false);
      }
    }
  };

  const handleAddBudget = async () => {
    if (newCategoryName && newCategoryLimit) {
      try {
        setIsLoading(true);
        // Add budget
        const { data: budgetData, error: budgetError } = await supabase
          .from('budgets')
          .insert([{
            user_id: session.user.id,
            category: newCategoryName,
            limit_amount: parseFloat(newCategoryLimit),
            spent: 0
          }])
          .select()
          .single();

        if (budgetError) throw budgetError;

        const newBudget = {
          id: budgetData.id,
          category: newCategoryName,
          limit: parseFloat(newCategoryLimit),
          spent: 0
        };

        setBudgets([...budgets, newBudget]);
        setNewCategoryName('');
        setNewCategoryLimit('');
        setShowAddBudget(false);
      } catch (error) {
        console.error('Error adding budget:', error);
        alert('Failed to add budget: ' + error.message);
      } finally {
        setIsLoading(false);
      }
    }
  };

  const handleUpdateCategory = async (id, newName, newLimit) => {
  const oldBudget = budgets.find(b => b.id === id);
  const oldName = oldBudget.category;
  
  try {
    // Update budget
    const { error: budgetError } = await supabase
      .from('budgets')
      .update({ 
        category: newName, 
        limit_amount: parseFloat(newLimit) 
      })
      .eq('id', id);

    if (budgetError) throw budgetError;

    // If name changed, update category and transactions
    if (oldName !== newName) {
      await supabase
        .from('categories')
        .update({ name: newName })
        .eq('name', oldName)
        .eq('user_id', session.user.id);

      await supabase
        .from('transactions')
        .update({ category: newName })
        .eq('category', oldName)
        .eq('user_id', session.user.id);

      setTransactions(transactions.map(t => 
        t.category === oldName ? { ...t, category: newName } : t
      ));
      setCategories(categories.map(c => c === oldName ? newName : c));
    }
    
    setBudgets(budgets.map(b => 
      b.id === id ? { ...b, category: newName, limit: parseFloat(newLimit) } : b
    ));
    
    setEditingCategory(null);
    setEditingCategoryName('');
    setEditingCategoryLimit('');
  } catch (error) {
    console.error('Error updating category:', error);
    alert('Failed to update category');
  }
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

  const handleDeleteCategory = async (categoryName) => {
    const hasTransactions = transactions.some(t => t.category === categoryName);
    if (hasTransactions) {
      alert('Cannot delete category with existing transactions. Please reassign or delete those transactions first.');
      return;
    }

    try {
      setIsLoading(true);
      // Delete budget
      await supabase
        .from('budgets')
        .delete()
        .eq('category', categoryName)
        .eq('user_id', session.user.id);

      // Delete category
      await supabase
        .from('categories')
        .delete()
        .eq('name', categoryName)
        .eq('user_id', session.user.id);

      setBudgets(budgets.filter(b => b.category !== categoryName));
      setCategories(categories.filter(c => c !== categoryName));
      setDeleteConfirm({ show: false, type: null, id: null, name: '' });
    } catch (error) {
      console.error('Error deleting category:', error);
      alert('Failed to delete category: ' + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteCategoryOnly = async (categoryName) => {
    const hasTransactions = transactions.some(t => t.category === categoryName);
    if (hasTransactions) {
      alert('Cannot delete category with existing transactions. Please reassign or delete those transactions first.');
      return;
    }

    try {
      setIsLoading(true);
      // Delete category
      await supabase
        .from('categories')
        .delete()
        .eq('name', categoryName)
        .eq('user_id', session.user.id);

      setCategories(categories.filter(c => c !== categoryName));
      setDeleteConfirm({ show: false, type: null, id: null, name: '' });
    } catch (error) {
      console.error('Error deleting category:', error);
      alert('Failed to delete category: ' + error.message);
    } finally {
      setIsLoading(false);
    }
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

  const generateTransactionsFromRules = async () => {
    const today = new Date();
    today.setHours(23, 59, 59, 999); // Set to end of day for comparison
    let transactionsToCreate = [];
    let rulesToUpdate = [];

    for (const rule of recurringRules) {
      if (!rule.active) continue;

      // Determine the next date to generate
      let currentDate;
      if (rule.lastGenerated) {
        // If we've generated before, start from the NEXT occurrence after lastGenerated
        currentDate = new Date(rule.lastGenerated);
        if (rule.frequency === 'monthly') {
          currentDate.setMonth(currentDate.getMonth() + 1);
          currentDate.setDate(rule.dayOfMonth);
        } else if (rule.frequency === 'weekly') {
          currentDate.setDate(currentDate.getDate() + 7);
        } else if (rule.frequency === 'yearly') {
          currentDate.setFullYear(currentDate.getFullYear() + 1);
        }
      } else {
        // First time generating - start from the start date
        currentDate = new Date(rule.startDate);
      }

      // Generate all pending transactions for this rule
      while (currentDate <= today) {
        const transactionDate = currentDate.toISOString().split('T')[0];
        transactionsToCreate.push({
          user_id: session.user.id,
          date: transactionDate,
          description: rule.description + ' (Auto)',
          amount: rule.amount,
          category: rule.category,
          account_id: rule.account_id,
        });

        // Update this rule's last generated date
        rulesToUpdate.push({
          id: rule.id,
          lastGenerated: transactionDate
        });

        // Move to next occurrence
        if (rule.frequency === 'monthly') {
          currentDate.setMonth(currentDate.getMonth() + 1);
          currentDate.setDate(rule.dayOfMonth);
        } else if (rule.frequency === 'weekly') {
          currentDate.setDate(currentDate.getDate() + 7);
        } else if (rule.frequency === 'yearly') {
          currentDate.setFullYear(currentDate.getFullYear() + 1);
        }
      }
    }

    if (transactionsToCreate.length === 0) {
      alert('No pending transactions to generate');
      return;
    }

    try {
      // Insert all transactions at once
      const { data: insertedTransactions, error: transError } = await supabase
        .from('transactions')
        .insert(transactionsToCreate)
        .select();

      if (transError) throw transError;

      // Update all recurring rules with new last_generated dates
      for (const ruleUpdate of rulesToUpdate) {
        await supabase
          .from('recurring_rules')
          .update({ last_generated: ruleUpdate.lastGenerated })
          .eq('id', ruleUpdate.id);
      }

      // Update account balances
      const accountBalanceUpdates = {};
      for (const trans of insertedTransactions) {
        if (!accountBalanceUpdates[trans.account_id]) {
          accountBalanceUpdates[trans.account_id] = 0;
        }
        accountBalanceUpdates[trans.account_id] += trans.amount;
      }

      for (const [accountId, amountChange] of Object.entries(accountBalanceUpdates)) {
        const account = accounts.find(a => a.id === accountId);
        if (account) {
          const newBalance = account.balance + amountChange;
          await supabase
            .from('accounts')
            .update({ balance: newBalance })
            .eq('id', accountId);
        }
      }

      // Update budgets for expenses
      for (const trans of insertedTransactions) {
        if (trans.amount < 0) {
          const budget = budgets.find(b => b.category === trans.category);
          if (budget) {
            const newSpent = budget.spent + Math.abs(trans.amount);
            await supabase
              .from('budgets')
              .update({ spent: newSpent })
              .eq('id', budget.id);
          }
        }
      }

      // Reload all data to sync state
      await loadDataFromSupabase();

      alert(`Successfully generated ${insertedTransactions.length} transaction(s)`);
    } catch (error) {
      console.error('Error generating transactions:', error);
      alert('Failed to generate recurring transactions: ' + error.message);
    }
  };

  const handleAddRecurring = async () => {
  if (newRecurring.description && newRecurring.amount && newRecurring.account_id) {
    const rule = {
      user_id: session.user.id,
      description: newRecurring.description,
      amount: parseFloat(newRecurring.amount),
      category: newRecurring.category,
      frequency: newRecurring.frequency,
      day_of_month: parseInt(newRecurring.dayOfMonth),
      start_date: newRecurring.startDate,
      last_generated: null,
      active: true,
      account_id: newRecurring.account_id,
    };

    try {
      const { data, error } = await supabase
        .from('recurring_rules')
        .insert([rule])
        .select()
        .single();

      if (error) throw error;

      const formattedRule = {
        id: data.id,
        description: data.description,
        amount: parseFloat(data.amount),
        category: data.category,
        frequency: data.frequency,
        dayOfMonth: data.day_of_month,
        startDate: data.start_date,
        lastGenerated: data.last_generated,
        active: data.active,
        account_id: data.account_id
      };

      setRecurringRules([...recurringRules, formattedRule]);
      setNewRecurring({
        description: '',
        amount: '',
        category: 'Food',
        frequency: 'monthly',
        dayOfMonth: 1,
        startDate: new Date().toISOString().split('T')[0],
        account_id: '',
      });
      setShowAddRecurring(false);
    } catch (error) {
      console.error('Error adding recurring rule:', error);
      alert('Failed to add recurring rule');
    }
  }
};

  const handleToggleRecurring = async (id) => {
  const rule = recurringRules.find(r => r.id === id);
  
  try {
    const { error } = await supabase
      .from('recurring_rules')
      .update({ active: !rule.active })
      .eq('id', id);

    if (error) throw error;

    setRecurringRules(recurringRules.map(r => 
      r.id === id ? { ...r, active: !r.active } : r
    ));
  } catch (error) {
    console.error('Error toggling recurring rule:', error);
    alert('Failed to toggle recurring rule');
  }
};

  const handleDeleteRecurring = async (id) => {
    try {
      setIsLoading(true);
      const { error } = await supabase
        .from('recurring_rules')
        .delete()
        .eq('id', id)
        .eq('user_id', session.user.id);

      if (error) throw error;

      setRecurringRules(recurringRules.filter(r => r.id !== id));
      setDeleteConfirm({ show: false, type: null, id: null, name: '' });
    } catch (error) {
      console.error('Error deleting recurring rule:', error);
      alert('Failed to delete recurring rule: ' + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  // Account handlers
  const handleAddAccount = async () => {
    if (newAccount.name && newAccount.starting_balance !== '') {
      try {
        setIsLoading(true);
        const { data, error } = await supabase
          .from('accounts')
          .insert([{
            user_id: session.user.id,
            name: newAccount.name,
            type: newAccount.type,
            balance: parseFloat(newAccount.starting_balance),
            starting_balance: parseFloat(newAccount.starting_balance)
          }])
          .select()
          .single();

        if (error) throw error;

        const formattedAccount = {
          id: data.id,
          name: data.name,
          type: data.type,
          balance: parseFloat(data.balance),
          starting_balance: parseFloat(data.starting_balance)
        };

        setAccounts([...accounts, formattedAccount]);
        setNewAccount({ name: '', type: 'wallet', starting_balance: '' });
        setShowAddAccount(false);
      } catch (error) {
        console.error('Error adding account:', error);
        alert('Failed to add account: ' + error.message);
      } finally {
        setIsLoading(false);
      }
    }
  };

  const handleDeleteAccount = async (id) => {
    const hasTransactions = transactions.some(t => t.account_id === id);
    if (hasTransactions) {
      alert('Cannot delete account with existing transactions. Please delete or reassign those transactions first.');
      return;
    }

    try {
      setIsLoading(true);
      const { error } = await supabase
        .from('accounts')
        .delete()
        .eq('id', id)
        .eq('user_id', session.user.id);

      if (error) throw error;

      setAccounts(accounts.filter(a => a.id !== id));
      setDeleteConfirm({ show: false, type: null, id: null, name: '' });
    } catch (error) {
      console.error('Error deleting account:', error);
      alert('Failed to delete account: ' + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex">
      {/* Left Sidebar */}
      <div className="w-64 bg-white shadow-2xl flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-gray-200">
          <h1 className="text-2xl font-bold text-gray-800">Budget Tracker</h1>
          <p className="text-xs text-gray-500 mt-1">Manage your finances</p>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4">
          <button
            onClick={() => setActiveTab('dashboard')}
            style={{
              backgroundColor: activeTab === 'dashboard' ? THEME.primaryLight : 'transparent',
              color: activeTab === 'dashboard' ? THEME.primary : '#4b5563'
            }}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg font-medium transition-all mb-2 ${
              activeTab === 'dashboard' ? 'shadow-sm' : 'hover:bg-gray-100'
            }`}
          >
            <LayoutDashboard size={20} />
            Dashboard
          </button>
          <button
            onClick={() => setActiveTab('accounts')}
            style={{
              backgroundColor: activeTab === 'accounts' ? THEME.primaryLight : 'transparent',
              color: activeTab === 'accounts' ? THEME.primary : '#4b5563'
            }}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg font-medium transition-all mb-2 ${
              activeTab === 'accounts' ? 'shadow-sm' : 'hover:bg-gray-100'
            }`}
          >
            <Wallet size={20} />
            Accounts
          </button>
          <button
            onClick={() => setActiveTab('categories')}
            style={{
              backgroundColor: activeTab === 'categories' ? THEME.primaryLight : 'transparent',
              color: activeTab === 'categories' ? THEME.primary : '#4b5563'
            }}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg font-medium transition-all mb-2 ${
              activeTab === 'categories' ? 'shadow-sm' : 'hover:bg-gray-100'
            }`}
          >
            <Tag size={20} />
            Categories
          </button>
          <button
            onClick={() => setActiveTab('budgets')}
            style={{
              backgroundColor: activeTab === 'budgets' ? THEME.primaryLight : 'transparent',
              color: activeTab === 'budgets' ? THEME.primary : '#4b5563'
            }}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg font-medium transition-all mb-2 ${
              activeTab === 'budgets' ? 'shadow-sm' : 'hover:bg-gray-100'
            }`}
          >
            <DollarSign size={20} />
            Budgets
          </button>
          <button
            onClick={() => setActiveTab('recurring')}
            style={{
              backgroundColor: activeTab === 'recurring' ? THEME.primaryLight : 'transparent',
              color: activeTab === 'recurring' ? THEME.primary : '#4b5563'
            }}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg font-medium transition-all mb-2 ${
              activeTab === 'recurring' ? 'shadow-sm' : 'hover:bg-gray-100'
            }`}
          >
            <Repeat size={20} />
            Recurring
          </button>
        </nav>

        {/* Logout Button */}
        <div className="p-4 border-t border-gray-200">
          <button
            onClick={handleSignOut}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors font-medium text-gray-700 hover:bg-gray-100"
          >
            <LogOut size={20} />
            Logout
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 p-4 md:p-8 overflow-y-auto">
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
                  const actualSpent = spendingByCategory[budget.category] || 0;

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
                        const actualSpent = spendingByCategory[budget.category] || 0;
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
                      <label className="block text-sm font-medium text-gray-700 mb-2">Account *</label>
                      <select
                        value={newTransaction.account_id}
                        onChange={(e) => setNewTransaction({ ...newTransaction, account_id: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:border-transparent"
                        required
                      >
                        <option value="">Select Account</option>
                        {accounts.map((account) => (
                          <option key={account.id} value={account.id}>
                            {account.name} (${account.balance.toFixed(2)})
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Category (Optional)</label>
                      <select
                        value={newTransaction.category}
                        onChange={(e) => setNewTransaction({ ...newTransaction, category: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:border-transparent"
                      >
                        <option value="">No Category</option>
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
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Category Name</label>
                  <input
                    type="text"
                    value={newCategoryName}
                    onChange={(e) => setNewCategoryName(e.target.value)}
                    placeholder="e.g., Healthcare, Utilities, Groceries"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:border-transparent"
                  />
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
              {categories.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  <Tag size={48} className="mx-auto mb-4 opacity-50" />
                  <p className="text-lg">No categories yet</p>
                  <p className="text-sm">Create categories to organize your transactions</p>
                </div>
              ) : (
                categories.map((category) => (
                  <div
                    key={category}
                    className="p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors flex items-center justify-between"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-full flex items-center justify-center" style={{ backgroundColor: THEME.primaryLight }}>
                        <Tag style={{ color: THEME.primary }} size={20} />
                      </div>
                      <div>
                        <p className="font-semibold text-gray-800 text-lg">{category}</p>
                        <p className="text-sm text-gray-600">
                          {transactions.filter(t => t.category === category).length} transaction(s)
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => setDeleteConfirm({ show: true, type: 'category-only', id: category, name: category })}
                      className="transition-colors p-2"
                      style={{ color: THEME.danger }}
                      onMouseOver={(e) => e.currentTarget.style.color = THEME.dangerHover}
                      onMouseOut={(e) => e.currentTarget.style.color = THEME.danger}
                      title="Delete category"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        ) : activeTab === 'budgets' ? (
          /* Budgets Management Tab */
          <div className="bg-white rounded-2xl shadow-lg p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-gray-800">Manage Budgets</h2>
              <button
                onClick={() => setShowAddBudget(!showAddBudget)}
                className="flex items-center gap-2 px-4 py-2 rounded-lg transition-colors font-medium text-white"
                style={{ backgroundColor: THEME.primary }}
                onMouseOver={(e) => e.currentTarget.style.backgroundColor = THEME.primaryHover}
                onMouseOut={(e) => e.currentTarget.style.backgroundColor = THEME.primary}
              >
                <PlusCircle size={20} />
                Add Budget
              </button>
            </div>

            {/* Add Budget Form */}
            {showAddBudget && (
              <div className="rounded-xl p-6 mb-6 border-2" style={{ backgroundColor: THEME.primaryLight, borderColor: THEME.primary }}>
                <h3 className="font-semibold text-gray-800 mb-4">New Budget</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
                    <select
                      value={newCategoryName}
                      onChange={(e) => setNewCategoryName(e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:border-transparent"
                    >
                      <option value="">Select Category</option>
                      {categories.filter(cat => !budgets.find(b => b.category === cat)).map((cat) => (
                        <option key={cat} value={cat}>
                          {cat}
                        </option>
                      ))}
                    </select>
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
                    onClick={handleAddBudget}
                    className="px-6 py-2 rounded-lg transition-colors font-medium text-white"
                    style={{ backgroundColor: THEME.primary }}
                    onMouseOver={(e) => e.currentTarget.style.backgroundColor = THEME.primaryHover}
                    onMouseOut={(e) => e.currentTarget.style.backgroundColor = THEME.primary}
                  >
                    Save Budget
                  </button>
                  <button
                    onClick={() => setShowAddBudget(false)}
                    className="bg-gray-200 hover:bg-gray-300 text-gray-700 px-6 py-2 rounded-lg transition-colors font-medium"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}

            {/* Budget List */}
            <div className="space-y-3">
              {budgets.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  <DollarSign size={48} className="mx-auto mb-4 opacity-50" />
                  <p className="text-lg">No budgets yet</p>
                  <p className="text-sm">Set spending limits for your categories</p>
                </div>
              ) : (
                budgets.map((budget) => (
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
                          onClick={() => setDeleteConfirm({ show: true, type: 'category', id: budget.category, name: budget.category })}
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
                ))
              )}
            </div>
          </div>
        ) : activeTab === 'accounts' ? (
          /* Accounts Management Tab */
          <div className="bg-white rounded-2xl shadow-lg p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-gray-800">Manage Accounts</h2>
              <button
                onClick={() => setShowAddAccount(!showAddAccount)}
                className="flex items-center gap-2 px-4 py-2 rounded-lg transition-colors font-medium text-white"
                style={{ backgroundColor: THEME.primary }}
                onMouseOver={(e) => e.currentTarget.style.backgroundColor = THEME.primaryHover}
                onMouseOut={(e) => e.currentTarget.style.backgroundColor = THEME.primary}
              >
                <PlusCircle size={20} />
                Add Account
              </button>
            </div>

            {/* Add Account Form */}
            {showAddAccount && (
              <div className="rounded-xl p-6 mb-6 border-2" style={{ backgroundColor: THEME.primaryLight, borderColor: THEME.primary }}>
                <h3 className="font-semibold text-gray-800 mb-4">New Account</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Account Name</label>
                    <input
                      type="text"
                      value={newAccount.name}
                      onChange={(e) => setNewAccount({ ...newAccount, name: e.target.value })}
                      placeholder="e.g., Main Wallet, Savings Account"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Account Type</label>
                    <select
                      value={newAccount.type}
                      onChange={(e) => setNewAccount({ ...newAccount, type: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:border-transparent"
                    >
                      <option value="wallet">Wallet</option>
                      <option value="current">Current Account</option>
                      <option value="savings">Savings Account</option>
                      <option value="credit">Credit Card</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Starting Balance</label>
                    <input
                      type="number"
                      step="0.01"
                      value={newAccount.starting_balance}
                      onChange={(e) => setNewAccount({ ...newAccount, starting_balance: e.target.value })}
                      placeholder="1000.00"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:border-transparent"
                    />
                  </div>
                </div>
                <div className="flex gap-3 mt-4">
                  <button
                    onClick={handleAddAccount}
                    className="px-6 py-2 rounded-lg transition-colors font-medium text-white"
                    style={{ backgroundColor: THEME.primary }}
                    onMouseOver={(e) => e.currentTarget.style.backgroundColor = THEME.primaryHover}
                    onMouseOut={(e) => e.currentTarget.style.backgroundColor = THEME.primary}
                  >
                    Save Account
                  </button>
                  <button
                    onClick={() => setShowAddAccount(false)}
                    className="bg-gray-200 hover:bg-gray-300 text-gray-700 px-6 py-2 rounded-lg transition-colors font-medium"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}

            {/* Account List */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {accounts.length === 0 ? (
                <div className="col-span-full text-center py-12 text-gray-500">
                  <Wallet size={48} className="mx-auto mb-4 opacity-50" />
                  <p className="text-lg">No accounts yet</p>
                  <p className="text-sm">Create accounts to track your money</p>
                </div>
              ) : (
                accounts.map((account) => {
                  const accountIcon = account.type === 'wallet' ? Wallet : account.type === 'credit' ? CreditCard : DollarSign;
                  const IconComponent = accountIcon;

                  return (
                    <div
                      key={account.id}
                      className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-6 shadow-md hover:shadow-lg transition-shadow border border-blue-100"
                    >
                      <div className="flex items-center justify-between mb-4">
                        <div className="w-12 h-12 rounded-full flex items-center justify-center" style={{ backgroundColor: THEME.primary }}>
                          <IconComponent style={{ color: 'white' }} size={24} />
                        </div>
                        <button
                          onClick={() => setDeleteConfirm({ show: true, type: 'account', id: account.id, name: account.name })}
                          className="transition-colors p-2"
                          style={{ color: THEME.danger }}
                          onMouseOver={(e) => e.currentTarget.style.color = THEME.dangerHover}
                          onMouseOut={(e) => e.currentTarget.style.color = THEME.danger}
                          title="Delete account"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                      <h3 className="text-lg font-bold text-gray-800 mb-1">{account.name}</h3>
                      <p className="text-xs text-gray-600 mb-3 capitalize">{account.type}</p>
                      <div className="border-t border-blue-200 pt-3">
                        <p className="text-xs text-gray-600 mb-1">Current Balance</p>
                        <p className="text-2xl font-bold" style={{ color: account.balance >= 0 ? THEME.success : THEME.danger }}>
                          ${account.balance.toFixed(2)}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          Started with: ${account.starting_balance.toFixed(2)}
                        </p>
                      </div>
                    </div>
                  );
                })
              )}
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
                    <label className="block text-sm font-medium text-gray-700 mb-2">Account *</label>
                    <select
                      value={newRecurring.account_id}
                      onChange={(e) => setNewRecurring({ ...newRecurring, account_id: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:border-transparent"
                      required
                    >
                      <option value="">Select Account</option>
                      {accounts.map((account) => (
                        <option key={account.id} value={account.id}>
                          {account.name} (${account.balance.toFixed(2)})
                        </option>
                      ))}
                    </select>
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
                        onClick={() => setDeleteConfirm({ show: true, type: 'recurring', id: rule.id, name: rule.description })}
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

        {/* Confirmation Dialog */}
        {deleteConfirm.show && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6">
              <h3 className="text-xl font-bold text-gray-800 mb-4">Confirm Delete</h3>
              <p className="text-gray-600 mb-6">
                Are you sure you want to delete {deleteConfirm.type} "{deleteConfirm.name}"?
                {deleteConfirm.type === 'transaction' && ' This action cannot be undone.'}
                {deleteConfirm.type === 'category' && ' This will also delete the associated budget.'}
                {deleteConfirm.type === 'category-only' && ' This category will be removed.'}
                {deleteConfirm.type === 'account' && ' This account and its balance information will be deleted.'}
                {deleteConfirm.type === 'recurring' && ' This will stop future automatic transactions.'}
              </p>
              <div className="flex gap-3 justify-end">
                <button
                  onClick={() => setDeleteConfirm({ show: false, type: null, id: null, name: '' })}
                  className="px-4 py-2 rounded-lg bg-gray-200 hover:bg-gray-300 text-gray-700 font-medium transition-colors"
                  disabled={isLoading}
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    if (deleteConfirm.type === 'transaction') {
                      handleDeleteTransaction(deleteConfirm.id);
                    } else if (deleteConfirm.type === 'category') {
                      handleDeleteCategory(deleteConfirm.id);
                    } else if (deleteConfirm.type === 'category-only') {
                      handleDeleteCategoryOnly(deleteConfirm.id);
                    } else if (deleteConfirm.type === 'account') {
                      handleDeleteAccount(deleteConfirm.id);
                    } else if (deleteConfirm.type === 'recurring') {
                      handleDeleteRecurring(deleteConfirm.id);
                    }
                  }}
                  className="px-4 py-2 rounded-lg font-medium text-white transition-colors disabled:opacity-50"
                  style={{ backgroundColor: THEME.danger }}
                  onMouseOver={(e) => !isLoading && (e.currentTarget.style.backgroundColor = THEME.dangerHover)}
                  onMouseOut={(e) => e.currentTarget.style.backgroundColor = THEME.danger}
                  disabled={isLoading}
                >
                  {isLoading ? 'Deleting...' : 'Delete'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Loading Overlay */}
        {isLoading && (
          <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-40">
            <div className="bg-white rounded-2xl shadow-2xl p-6">
              <div className="flex items-center gap-3">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2" style={{ borderColor: THEME.primary }}></div>
                <span className="text-gray-700 font-medium">Loading...</span>
              </div>
            </div>
          </div>
        )}

        {/* Error Display */}
        {error && (
          <div className="fixed bottom-4 right-4 bg-red-100 border-2 border-red-500 text-red-700 px-6 py-4 rounded-lg shadow-lg max-w-md z-50">
            <div className="flex items-start gap-3">
              <span className="font-bold">Error:</span>
              <div className="flex-1">
                <p>{error}</p>
                <button
                  onClick={() => setError(null)}
                  className="mt-2 text-sm underline hover:no-underline"
                >
                  Dismiss
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

const AppWrapper = ({ session }) => {
  return <BudgetApp session={session} />;
};

export default AppWrapper;
