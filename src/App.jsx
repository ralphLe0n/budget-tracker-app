import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { PlusCircle, TrendingUp, TrendingDown, DollarSign, Calendar, Trash2, Tag, Edit2, Save, X, Filter, LogOut, LayoutDashboard, Repeat, Wallet, CreditCard, ArrowLeftRight } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, BarChart, Bar } from 'recharts';
import { supabase } from './supabaseClient';
import { THEME } from './config/theme';
import { formatCurrency } from './utils/formatters';
import Sidebar from './components/layout/Sidebar';
import ConfirmationDialog from './components/ui/ConfirmationDialog';
import LoadingOverlay from './components/ui/LoadingOverlay';
import ErrorDisplay from './components/ui/ErrorDisplay';
import * as dataService from './services/dataService';
import * as recurringService from './services/recurringService';
import DashboardTab from './components/tabs/DashboardTab';
import CategoriesTab from './components/tabs/CategoriesTab';
import BudgetsTab from './components/tabs/BudgetsTab';
import AccountsTab from './components/tabs/AccountsTab';
import RecurringTab from './components/tabs/RecurringTab';

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
      const data = await dataService.loadAllData(session.user.id);
      setTransactions(data.transactions);
      setBudgets(data.budgets);
      setCategories(data.categories);
      setRecurringRules(data.recurringRules);
      setAccounts(data.accounts);
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
  const [addBudgetWithCategory, setAddBudgetWithCategory] = useState(false);
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

  const [showTransfer, setShowTransfer] = useState(false);
  const [transfer, setTransfer] = useState({
    fromAccountId: '',
    toAccountId: '',
    amount: '',
    description: '',
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
  const [filterDescription, setFilterDescription] = useState('');

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
    setFilterDescription('');
  };

  const hasActiveFilters = filterStartDate || filterEndDate || selectedCategories.length > 0 || filterDescription;

  // Apply filters to transactions (optimized with useMemo)
  const filteredTransactions = useMemo(() => {
    return transactions.filter(t => {
      if (filterStartDate && t.date < filterStartDate) return false;
      if (filterEndDate && t.date > filterEndDate) return false;
      if (selectedCategories.length > 0 && !selectedCategories.includes(t.category)) return false;
      if (filterDescription && !t.description.toLowerCase().includes(filterDescription.toLowerCase())) return false;
      return true;
    });
  }, [transactions, filterStartDate, filterEndDate, selectedCategories, filterDescription]);

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

  // Calculate total account balances
  const totalAccountBalance = useMemo(() => {
    return accounts
      .filter(a => a.type !== 'savings')
      .reduce((sum, account) => sum + account.balance, 0);
  }, [accounts]);

  const totalSavings = useMemo(() => {
    return accounts
      .filter(a => a.type === 'savings')
      .reduce((sum, account) => sum + account.balance, 0);
  }, [accounts]);

  const savingsAccounts = useMemo(() => {
    return accounts.filter(a => a.type === 'savings');
  }, [accounts]);

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

        // Optionally add budget if checkbox is checked and limit is provided
        if (addBudgetWithCategory && newCategoryLimit) {
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
        }

        setNewCategoryName('');
        setNewCategoryLimit('');
        setAddBudgetWithCategory(false);
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
    try {
      const result = await recurringService.generateTransactionsFromRules(
        recurringRules,
        accounts,
        budgets,
        session.user.id
      );
      await loadDataFromSupabase();
      alert(result.message);
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

  const handleTransfer = async () => {
    if (!transfer.fromAccountId || !transfer.toAccountId || !transfer.amount) {
      alert('Please fill in all required fields');
      return;
    }

    if (transfer.fromAccountId === transfer.toAccountId) {
      alert('Cannot transfer to the same account');
      return;
    }

    const amount = parseFloat(transfer.amount);
    if (amount <= 0) {
      alert('Transfer amount must be greater than zero');
      return;
    }

    try {
      setIsLoading(true);

      const fromAccount = accounts.find(a => a.id === transfer.fromAccountId);
      const toAccount = accounts.find(a => a.id === transfer.toAccountId);

      if (!fromAccount || !toAccount) {
        throw new Error('Invalid account selection');
      }

      // Create two transactions: withdrawal from source, deposit to destination
      const description = transfer.description || `Transfer: ${fromAccount.name} → ${toAccount.name}`;
      const transactionDate = new Date().toISOString().split('T')[0];

      // Withdrawal transaction
      const withdrawalTransaction = {
        user_id: session.user.id,
        date: transactionDate,
        description: description,
        amount: -amount,
        category: 'Transfer',
        account_id: transfer.fromAccountId,
      };

      // Deposit transaction
      const depositTransaction = {
        user_id: session.user.id,
        date: transactionDate,
        description: description,
        amount: amount,
        category: 'Transfer',
        account_id: transfer.toAccountId,
      };

      // Insert both transactions
      const { error: transError } = await supabase
        .from('transactions')
        .insert([withdrawalTransaction, depositTransaction]);

      if (transError) throw transError;

      // Update account balances
      const newFromBalance = fromAccount.balance - amount;
      const newToBalance = toAccount.balance + amount;

      await supabase
        .from('accounts')
        .update({ balance: newFromBalance })
        .eq('id', fromAccount.id);

      await supabase
        .from('accounts')
        .update({ balance: newToBalance })
        .eq('id', toAccount.id);

      // Update local state
      setAccounts(accounts.map(a => {
        if (a.id === fromAccount.id) return { ...a, balance: newFromBalance };
        if (a.id === toAccount.id) return { ...a, balance: newToBalance };
        return a;
      }));

      // Reload transactions to show the new ones
      await loadDataFromSupabase();

      // Reset form
      setTransfer({
        fromAccountId: '',
        toAccountId: '',
        amount: '',
        description: '',
      });
      setShowTransfer(false);
      alert('Transfer completed successfully');
    } catch (error) {
      console.error('Error processing transfer:', error);
      alert('Failed to process transfer: ' + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  // Helper function to handle delete confirmation
  const handleDeleteConfirm = () => {
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
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex">
      {/* Left Sidebar */}
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onSignOut={handleSignOut}
      />

      {/* Main Content */}
      <div className="flex-1 p-4 md:p-8 overflow-y-auto">
        {activeTab === 'dashboard' && (
          <DashboardTab
            totalIncome={totalIncome}
            totalExpenses={totalExpenses}
            totalAccountBalance={totalAccountBalance}
            totalSavings={totalSavings}
            accounts={accounts}
            savingsAccounts={savingsAccounts}
            hasActiveFilters={hasActiveFilters}
            filteredTransactions={filteredTransactions}
            showFilters={showFilters}
            setShowFilters={setShowFilters}
            clearFilters={clearFilters}
            filterStartDate={filterStartDate}
            setFilterStartDate={setFilterStartDate}
            filterEndDate={filterEndDate}
            setFilterEndDate={setFilterEndDate}
            filterDescription={filterDescription}
            setFilterDescription={setFilterDescription}
            selectedCategories={selectedCategories}
            setSelectedCategories={setSelectedCategories}
            categories={categories}
            toggleCategoryFilter={toggleCategoryFilter}
            budgets={budgets}
            spendingByCategory={spendingByCategory}
            categorySpendingData={categorySpendingData}
            monthlyData={monthlyData}
            showAddTransaction={showAddTransaction}
            setShowAddTransaction={setShowAddTransaction}
            newTransaction={newTransaction}
            setNewTransaction={setNewTransaction}
            handleAddTransaction={handleAddTransaction}
            setDeleteConfirm={setDeleteConfirm}
          />
        )}

        {activeTab === 'categories' && (
          <CategoriesTab
            categories={categories}
            transactions={transactions}
            showAddCategory={showAddCategory}
            setShowAddCategory={setShowAddCategory}
            newCategoryName={newCategoryName}
            setNewCategoryName={setNewCategoryName}
            addBudgetWithCategory={addBudgetWithCategory}
            setAddBudgetWithCategory={setAddBudgetWithCategory}
            newCategoryLimit={newCategoryLimit}
            setNewCategoryLimit={setNewCategoryLimit}
            onAddCategory={handleAddCategory}
            onDeleteCategory={(category) => setDeleteConfirm({ show: true, type: 'category-only', id: category, name: category })}
          />
        )}

        {activeTab === 'budgets' && (
          <BudgetsTab
            budgets={budgets}
            categories={categories}
            showAddBudget={showAddBudget}
            setShowAddBudget={setShowAddBudget}
            newCategoryName={newCategoryName}
            setNewCategoryName={setNewCategoryName}
            newCategoryLimit={newCategoryLimit}
            setNewCategoryLimit={setNewCategoryLimit}
            editingCategory={editingCategory}
            editingCategoryName={editingCategoryName}
            setEditingCategoryName={setEditingCategoryName}
            editingCategoryLimit={editingCategoryLimit}
            setEditingCategoryLimit={setEditingCategoryLimit}
            onAddBudget={handleAddBudget}
            onStartEditing={startEditingCategory}
            onSaveEdit={handleUpdateCategory}
            onCancelEdit={cancelEditingCategory}
            onDeleteBudget={(category) => setDeleteConfirm({ show: true, type: 'category', id: category, name: category })}
          />
        )}

        {activeTab === 'accounts' && (
          <AccountsTab
            accounts={accounts}
            showAddAccount={showAddAccount}
            setShowAddAccount={setShowAddAccount}
            newAccount={newAccount}
            setNewAccount={setNewAccount}
            handleAddAccount={handleAddAccount}
            showTransfer={showTransfer}
            setShowTransfer={setShowTransfer}
            transfer={transfer}
            setTransfer={setTransfer}
            handleTransfer={handleTransfer}
            setDeleteConfirm={setDeleteConfirm}
          />
        )}

        {activeTab === 'recurring' && (
          <RecurringTab
            recurringRules={recurringRules}
            accounts={accounts}
            categories={categories}
            showAddRecurring={showAddRecurring}
            setShowAddRecurring={setShowAddRecurring}
            newRecurring={newRecurring}
            setNewRecurring={setNewRecurring}
            handleAddRecurring={handleAddRecurring}
            handleToggleRecurring={handleToggleRecurring}
            calculateNextOccurrence={calculateNextOccurrence}
            generateTransactionsFromRules={generateTransactionsFromRules}
            setDeleteConfirm={setDeleteConfirm}
          />
        )}

        {/* Confirmation Dialog */}
        <ConfirmationDialog
          show={deleteConfirm.show}
          type={deleteConfirm.type}
          name={deleteConfirm.name}
          onConfirm={handleDeleteConfirm}
          onCancel={() => setDeleteConfirm({ show: false, type: null, id: null, name: '' })}
          isLoading={isLoading}
        />

        {/* Loading Overlay */}
        <LoadingOverlay isLoading={isLoading} />

        {/* Error Display */}
        <ErrorDisplay error={error} onDismiss={() => setError(null)} />
      </div>
    </div>
  );
};

const AppWrapper = ({ session }) => {
  return <BudgetApp session={session} />;
};

export default AppWrapper;
