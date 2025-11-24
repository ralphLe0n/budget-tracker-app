import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { PlusCircle, TrendingUp, TrendingDown, DollarSign, Calendar, Trash2, Tag, Edit2, Save, X, Filter, LogOut, LayoutDashboard, Repeat, Wallet, CreditCard, ArrowLeftRight, Menu } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, BarChart, Bar } from 'recharts';
import { supabase } from './supabaseClient';
import { THEME } from './config/theme';
import { formatCurrency } from './utils/formatters';
import { shouldResetBudget, getCurrentPeriod } from './utils/budgetPeriods';
import { getCategoryNames } from './utils/categoryHelpers';
import Sidebar from './components/layout/Sidebar';
import ConfirmationDialog from './components/ui/ConfirmationDialog';
import LoadingOverlay from './components/ui/LoadingOverlay';
import ErrorDisplay from './components/ui/ErrorDisplay';
import * as dataService from './services/dataService';
import * as recurringService from './services/recurringService';
import { categorizeDescription } from './services/categorizationService';
import DashboardTab from './components/tabs/DashboardTab';
import TransactionsTab from './components/tabs/TransactionsTab';
import CategoriesTab from './components/tabs/CategoriesTab';
import BudgetsTab from './components/tabs/BudgetsTab';
import AccountsTab from './components/tabs/AccountsTab';
import RecurringTab from './components/tabs/RecurringTab';
import DebtsTab from './components/tabs/DebtsTab';
import SavingsGoalsTab from './components/tabs/SavingsGoalsTab';
import AnalyticsTab from './components/tabs/AnalyticsTab';
import BudgetsCategoriesTab from './components/tabs/BudgetsCategoriesTab';
import FinancialGoalsTab from './components/tabs/FinancialGoalsTab';
import CSVImport from './components/CSVImport';

const BudgetApp = ({ session }) => {
  // ========================================
  // STATE DECLARATIONS
  // ========================================
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const [transactions, setTransactions] = useState([]);
  const [budgets, setBudgets] = useState([]);
  const [recurringRules, setRecurringRules] = useState([]);
  const [categories, setCategories] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [categoryRules, setCategoryRules] = useState([]);
  const [debts, setDebts] = useState([]);
  const [debtPayments, setDebtPayments] = useState([]);
  const [savingsGoals, setSavingsGoals] = useState([]);
  const [goalContributions, setGoalContributions] = useState([]);
  const [celebrationMessage, setCelebrationMessage] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const [showAddTransaction, setShowAddTransaction] = useState(false);
  const [showAddCategory, setShowAddCategory] = useState(false);
  const [showAddRecurring, setShowAddRecurring] = useState(false);
  const [showAddAccount, setShowAddAccount] = useState(false);
  const [showAddBudget, setShowAddBudget] = useState(false);
  const [showCSVImport, setShowCSVImport] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [editingCategoryName, setEditingCategoryName] = useState('');
  const [editingCategoryLimit, setEditingCategoryLimit] = useState('');
  const [editingRecurrenceFrequency, setEditingRecurrenceFrequency] = useState('monthly');
  const [editingPeriodStartDate, setEditingPeriodStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [newCategoryLimit, setNewCategoryLimit] = useState('');
  const [newCategoryIcon, setNewCategoryIcon] = useState('Tag');
  const [newCategoryColor, setNewCategoryColor] = useState('#3b82f6');
  const [newRecurrenceFrequency, setNewRecurrenceFrequency] = useState('monthly');
  const [newPeriodStartDate, setNewPeriodStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [addBudgetWithCategory, setAddBudgetWithCategory] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState({ show: false, type: null, id: null, name: '' });
  const [editingRecurring, setEditingRecurring] = useState(null);
  const [editingRecurringData, setEditingRecurringData] = useState({
    description: '',
    amount: '',
    category: '',
    frequency: 'monthly',
    dayOfMonth: 1,
    startDate: '',
    account_id: '',
  });
  
  const [newTransaction, setNewTransaction] = useState({
    date: new Date().toISOString().split('T')[0],
    description: '',
    amount: '',
    category: '',
    account_id: '',
    comment: '',
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
    category: '',
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

  // ========================================
  // EFFECTS
  // ========================================

  // Load data from Supabase on mount
  useEffect(() => {
    loadDataFromSupabase();
  }, []);

  // Update newRecurring category when categories are loaded
  useEffect(() => {
    if (categories.length > 0 && !newRecurring.category) {
      setNewRecurring(prev => ({
        ...prev,
        category: categories[0].name
      }));
    }
  }, [categories, newRecurring.category]);

  // ========================================
  // FUNCTIONS
  // ========================================

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
      setCategoryRules(data.categoryRules);
      setDebts(data.debts);
      setDebtPayments(data.debtPayments);
      setSavingsGoals(data.savingsGoals);
      setGoalContributions(data.goalContributions);

      // Check and reset budgets if needed
      await checkAndResetBudgets(data.budgets);
    } catch (error) {
      console.error('Error loading data:', error);
      setError('Failed to load data from database: ' + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  // Check if any budgets need to be reset based on their recurrence period
  const checkAndResetBudgets = async (budgetsToCheck) => {
    const budgetsNeedingReset = budgetsToCheck.filter(budget => {
      if (!budget.recurrenceFrequency || !budget.periodStartDate || !budget.lastResetDate) {
        return false;
      }
      return shouldResetBudget(budget.lastResetDate, budget.periodStartDate, budget.recurrenceFrequency);
    });

    if (budgetsNeedingReset.length > 0) {
      try {
        const today = new Date().toISOString().split('T')[0];

        // Reset each budget
        for (const budget of budgetsNeedingReset) {
          await supabase
            .from('budgets')
            .update({
              spent: 0,
              last_reset_date: today
            })
            .eq('id', budget.id);
        }

        // Update local state
        setBudgets(prevBudgets =>
          prevBudgets.map(b => {
            if (budgetsNeedingReset.find(br => br.id === b.id)) {
              return { ...b, spent: 0, lastResetDate: today };
            }
            return b;
          })
        );

        console.log(`Reset ${budgetsNeedingReset.length} budget(s) for new period`);
      } catch (error) {
        console.error('Error resetting budgets:', error);
      }
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
      .filter(t => t.amount > 0 && t.category !== 'Transfer')
      .reduce((sum, t) => sum + t.amount, 0);
  }, [filteredTransactions]);

  const totalExpenses = useMemo(() => {
    return filteredTransactions
      .filter(t => t.amount < 0 && t.category !== 'Transfer')
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
      if (t.amount < 0 && t.category !== 'Transfer') {
        acc[t.category] = (acc[t.category] || 0) + Math.abs(t.amount);
      }
      return acc;
    }, {});
  }, [filteredTransactions]);

  // Calculate spending per budget based on each budget's current period
  const spendingByBudgetPeriod = useMemo(() => {
    const periodSpending = {};

    budgets.forEach(budget => {
      // Get the current period for this budget
      if (budget.recurrenceFrequency && budget.periodStartDate) {
        const { periodStart, periodEnd } = getCurrentPeriod(
          budget.periodStartDate,
          budget.recurrenceFrequency
        );

        // Calculate spending within this period
        const spending = transactions
          .filter(t => {
            const transactionDate = new Date(t.date);
            return (
              t.category === budget.category &&
              t.amount < 0 &&
              transactionDate >= periodStart &&
              transactionDate <= periodEnd
            );
          })
          .reduce((sum, t) => sum + Math.abs(t.amount), 0);

        periodSpending[budget.category] = spending;
      } else {
        // Fallback to all spending if no period defined
        periodSpending[budget.category] = spendingByCategory[budget.category] || 0;
      }
    });

    return periodSpending;
  }, [budgets, transactions, spendingByCategory]);

  const categorySpendingData = useMemo(() => {
    return categories
      .map(category => ({
        name: category.name,
        value: spendingByCategory[category.name] || 0
      }))
      .filter(item => item.value > 0)
      .sort((a, b) => b.value - a.value);
  }, [categories, spendingByCategory]);

  const monthlyData = useMemo(() => {
    const monthlyMap = {};

    filteredTransactions.forEach(t => {
      const month = t.date.substring(0, 7);
      if (!monthlyMap[month]) {
        monthlyMap[month] = { month, income: 0, expenses: 0, savings: 0 };
      }

      if (t.category === 'Transfer') {
        // Track transfers to savings accounts as savings contributions
        // Only count deposits (positive amounts) to savings to avoid double counting
        const toAccount = accounts.find(a => a.id === t.account_id);
        if (toAccount && toAccount.type === 'savings' && t.amount > 0 && t.transfer_type === 'deposit') {
          monthlyMap[month].savings += t.amount;
        }
        return; // Skip transfer from income/expense calculations
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
  }, [filteredTransactions, accounts]);

  const handleAddTransaction = async () => {
    if (newTransaction.description && newTransaction.amount && newTransaction.account_id) {
      // Auto-categorize if no category is selected
      let category = newTransaction.category;
      if (!category || category === '') {
        const autoCategory = categorizeDescription(newTransaction.description, categoryRules);
        category = autoCategory || (parseFloat(newTransaction.amount) > 0 ? 'Income' : 'Other');
      }

      const transaction = {
        user_id: session.user.id,
        date: newTransaction.date,
        description: newTransaction.description,
        amount: parseFloat(newTransaction.amount),
        category: category,
        account_id: newTransaction.account_id,
        comment: newTransaction.comment || null,
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
          account_id: data.account_id,
          comment: data.comment || '',
          transfer_id: data.transfer_id || null,
          transfer_type: data.transfer_type || null
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
          comment: '',
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

  const handleUpdateTransaction = async (transactionId, updates) => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('transactions')
        .update(updates)
        .eq('id', transactionId)
        .select()
        .single();

      if (error) throw error;

      // Update local state
      setTransactions(transactions.map(t =>
        t.id === transactionId ? { ...t, ...updates } : t
      ));
    } catch (error) {
      console.error('Error updating transaction:', error);
      alert('Failed to update transaction: ' + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleBulkUpdate = async (transactionIds, updates) => {
    try {
      setIsLoading(true);
      const { error } = await supabase
        .from('transactions')
        .update(updates)
        .in('id', transactionIds);

      if (error) throw error;

      // Update local state
      setTransactions(transactions.map(t =>
        transactionIds.includes(t.id) ? { ...t, ...updates } : t
      ));

      alert(`Successfully updated ${transactionIds.length} transaction(s)`);
    } catch (error) {
      console.error('Error bulk updating transactions:', error);
      alert('Failed to update transactions: ' + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleConvertToTransfer = async (transactionId, destinationAccountId) => {
    try {
      setIsLoading(true);

      const originalTransaction = transactions.find(t => t.id === transactionId);
      if (!originalTransaction) {
        throw new Error('Transaction not found');
      }

      const fromAccount = accounts.find(a => a.id === originalTransaction.account_id);
      const toAccount = accounts.find(a => a.id === destinationAccountId);

      if (!fromAccount || !toAccount) {
        throw new Error('Invalid account selection. Please ensure both accounts exist.');
      }

      if (fromAccount.id === toAccount.id) {
        throw new Error('Cannot transfer to the same account. Please select a different destination account.');
      }

      // Generate a unique transfer ID (UUID)
      const transferId = crypto.randomUUID();

      // Determine transfer types based on amount direction
      const isWithdrawal = originalTransaction.amount < 0;
      const sourceTransferType = isWithdrawal ? 'withdrawal' : 'deposit';
      const destTransferType = isWithdrawal ? 'deposit' : 'withdrawal';

      // Update the original transaction
      const { error: updateError } = await supabase
        .from('transactions')
        .update({
          category: 'Transfer',
          transfer_id: transferId,
          transfer_type: sourceTransferType,
          description: `Transfer: ${fromAccount.name} → ${toAccount.name}`
        })
        .eq('id', transactionId);

      if (updateError) throw updateError;

      // Create the counterpart transaction
      const counterpartTransaction = {
        user_id: session.user.id,
        date: originalTransaction.date,
        description: `Transfer: ${fromAccount.name} → ${toAccount.name}`,
        amount: -originalTransaction.amount, // Opposite amount
        category: 'Transfer',
        account_id: destinationAccountId,
        transfer_id: transferId,
        transfer_type: destTransferType,
        comment: originalTransaction.comment
      };

      const { data: newTrans, error: insertError } = await supabase
        .from('transactions')
        .insert([counterpartTransaction])
        .select()
        .single();

      if (insertError) throw insertError;

      // Update account balances
      const balanceChange = -originalTransaction.amount;
      await supabase
        .from('accounts')
        .update({ balance: toAccount.balance + balanceChange })
        .eq('id', destinationAccountId);

      // Reload data to ensure consistency
      await loadDataFromSupabase();

      alert('Transaction successfully converted to transfer');
    } catch (error) {
      console.error('Error converting to transfer:', error);
      alert('Failed to convert to transfer: ' + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCSVImport = async (importedTransactions) => {
    try {
      setIsLoading(true);

      // Add user_id to each transaction
      const transactionsWithUserId = importedTransactions.map(t => ({
        ...t,
        user_id: session.user.id
      }));

      // Bulk insert into Supabase
      const { data, error } = await supabase
        .from('transactions')
        .insert(transactionsWithUserId)
        .select();

      if (error) throw error;

      // Calculate account balance changes
      const accountBalanceChanges = {};
      data.forEach(trans => {
        if (!accountBalanceChanges[trans.account_id]) {
          accountBalanceChanges[trans.account_id] = 0;
        }
        accountBalanceChanges[trans.account_id] += parseFloat(trans.amount);
      });

      // Update account balances
      for (const [accountId, balanceChange] of Object.entries(accountBalanceChanges)) {
        const account = accounts.find(a => a.id === accountId);
        if (account) {
          const newBalance = account.balance + balanceChange;
          await supabase
            .from('accounts')
            .update({ balance: newBalance })
            .eq('id', accountId);

          setAccounts(prev => prev.map(a =>
            a.id === accountId ? { ...a, balance: newBalance } : a
          ));
        }
      }

      // Calculate budget spent changes
      const budgetSpentChanges = {};
      data.forEach(trans => {
        if (parseFloat(trans.amount) < 0 && trans.category) {
          if (!budgetSpentChanges[trans.category]) {
            budgetSpentChanges[trans.category] = 0;
          }
          budgetSpentChanges[trans.category] += Math.abs(parseFloat(trans.amount));
        }
      });

      // Update budget spent amounts
      for (const [category, spentIncrease] of Object.entries(budgetSpentChanges)) {
        const budget = budgets.find(b => b.category === category);
        if (budget) {
          const newSpent = budget.spent + spentIncrease;
          await supabase
            .from('budgets')
            .update({ spent: newSpent })
            .eq('id', budget.id);

          setBudgets(prev => prev.map(b =>
            b.id === budget.id ? { ...b, spent: newSpent } : b
          ));
        }
      }

      // Add to local state
      const newTransactions = data.map(d => ({
        id: d.id,
        date: d.date,
        description: d.description,
        amount: parseFloat(d.amount),
        category: d.category,
        account_id: d.account_id
      }));

      setTransactions(prev => [...newTransactions, ...prev]);
      setShowCSVImport(false);

      alert(`Successfully imported ${data.length} transactions!`);
    } catch (error) {
      console.error('Error importing transactions:', error);
      alert('Failed to import transactions: ' + error.message);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteTransaction = async (id) => {
    const transaction = transactions.find(t => t.id === id);

    try {
      setIsLoading(true);

      // Check if transaction is linked to a debt payment
      const debtPaymentLink = await dataService.checkTransactionDebtLink(id);

      if (debtPaymentLink) {
        // Confirm deletion with warning about debt payment
        const confirmMessage = `Ta transakcja jest połączona z długiem "${debtPaymentLink.debts.name}".\n\nUsunięcie tej transakcji również usunie wpłatę z długu i cofnie saldo długu.\n\nCzy na pewno chcesz kontynuować?`;

        if (!window.confirm(confirmMessage)) {
          setIsLoading(false);
          return;
        }

        // Delete debt payment and reverse debt balance
        await dataService.deleteDebtPayment(debtPaymentLink.id);
        setDebtPayments(debtPayments.filter(p => p.id !== debtPaymentLink.id));

        // Update debt: reverse the payment
        const debt = debts.find(d => d.id === debtPaymentLink.debt_id);
        if (debt) {
          const newBalance = debt.current_balance + debtPaymentLink.principal_paid;
          const newPaidInstallments = Math.max(0, debt.paid_installments - 1);

          // Calculate previous payment date
          const calculatePreviousPaymentDate = (startDate, paidInstallments) => {
            const date = new Date(startDate);
            date.setMonth(date.getMonth() + paidInstallments);
            return date.toISOString().split('T')[0];
          };

          const debtUpdate = {
            current_balance: newBalance,
            paid_installments: newPaidInstallments,
            next_payment_date: calculatePreviousPaymentDate(debt.start_date, newPaidInstallments),
            is_active: true // Reactivate if it was paid off
          };

          const updatedDebt = await dataService.updateDebt(debt.id, debtUpdate);
          setDebts(debts.map(d => d.id === debt.id ? updatedDebt : d));
        }
      }

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
          .insert([{
            user_id: session.user.id,
            name: newCategoryName,
            icon: newCategoryIcon,
            color: newCategoryColor
          }]);

        if (catError) throw catError;

        setCategories([...categories, {
          name: newCategoryName,
          icon: newCategoryIcon,
          color: newCategoryColor
        }]);

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
        setNewCategoryIcon('Tag');
        setNewCategoryColor('#3b82f6');
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
            spent: 0,
            recurrence_frequency: newRecurrenceFrequency,
            period_start_date: newPeriodStartDate,
            last_reset_date: new Date().toISOString().split('T')[0]
          }])
          .select()
          .single();

        if (budgetError) throw budgetError;

        const newBudget = {
          id: budgetData.id,
          category: newCategoryName,
          limit: parseFloat(newCategoryLimit),
          spent: 0,
          recurrenceFrequency: newRecurrenceFrequency,
          periodStartDate: newPeriodStartDate,
          lastResetDate: new Date().toISOString().split('T')[0]
        };

        setBudgets([...budgets, newBudget]);
        setNewCategoryName('');
        setNewCategoryLimit('');
        setNewRecurrenceFrequency('monthly');
        setNewPeriodStartDate(new Date().toISOString().split('T')[0]);
        setShowAddBudget(false);
      } catch (error) {
        console.error('Error adding budget:', error);
        alert('Failed to add budget: ' + error.message);
      } finally {
        setIsLoading(false);
      }
    }
  };

  const handleUpdateCategory = async (id, newName, newLimit, newFrequency, newStartDate) => {
  const oldBudget = budgets.find(b => b.id === id);
  const oldName = oldBudget.category;

  try {
    // Update budget
    const { error: budgetError } = await supabase
      .from('budgets')
      .update({
        category: newName,
        limit_amount: parseFloat(newLimit),
        recurrence_frequency: newFrequency,
        period_start_date: newStartDate
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
      setCategories(categories.map(c => c.name === oldName ? { ...c, name: newName } : c));
    }

    setBudgets(budgets.map(b =>
      b.id === id ? {
        ...b,
        category: newName,
        limit: parseFloat(newLimit),
        recurrenceFrequency: newFrequency,
        periodStartDate: newStartDate
      } : b
    ));

    setEditingCategory(null);
    setEditingCategoryName('');
    setEditingCategoryLimit('');
    setEditingRecurrenceFrequency('monthly');
    setEditingPeriodStartDate(new Date().toISOString().split('T')[0]);
  } catch (error) {
    console.error('Error updating category:', error);
    alert('Failed to update category');
  }
};

  const startEditingCategory = (budget) => {
    setEditingCategory(budget.id);
    setEditingCategoryName(budget.category);
    setEditingCategoryLimit(budget.limit.toString());
    setEditingRecurrenceFrequency(budget.recurrenceFrequency || 'monthly');
    setEditingPeriodStartDate(budget.periodStartDate || new Date().toISOString().split('T')[0]);
  };

  const handleRenameCategory = async (oldName, newName) => {
    if (!newName || oldName === newName) return;

    try {
      setIsLoading(true);

      // Check if new name already exists
      if (categories.some(c => c.name === newName)) {
        setError('A category with this name already exists');
        return;
      }

      // Update category in categories table
      const { error: catError } = await supabase
        .from('categories')
        .update({ name: newName })
        .eq('name', oldName)
        .eq('user_id', session.user.id);

      if (catError) throw catError;

      // Update transactions with this category
      const { error: transError } = await supabase
        .from('transactions')
        .update({ category: newName })
        .eq('category', oldName)
        .eq('user_id', session.user.id);

      if (transError) throw transError;

      // Update budgets with this category
      const { error: budgetError } = await supabase
        .from('budgets')
        .update({ category: newName })
        .eq('category', oldName)
        .eq('user_id', session.user.id);

      if (budgetError) throw budgetError;

      // Update category rules with this category
      const { error: rulesError } = await supabase
        .from('category_rules')
        .update({ category: newName })
        .eq('category', oldName)
        .eq('user_id', session.user.id);

      if (rulesError) throw rulesError;

      // Update local state
      setCategories(categories.map(c => c.name === oldName ? { ...c, name: newName } : c));
      setTransactions(transactions.map(t =>
        t.category === oldName ? { ...t, category: newName } : t
      ));
      setBudgets(budgets.map(b =>
        b.category === oldName ? { ...b, category: newName } : b
      ));
      setCategoryRules(categoryRules.map(r =>
        r.category === oldName ? { ...r, category: newName } : r
      ));
    } catch (error) {
      console.error('Error renaming category:', error);
      setError('Failed to rename category: ' + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateCategoryCustomization = async (categoryName, icon, color) => {
    try {
      setIsLoading(true);

      // Update category customization in database
      await dataService.updateCategoryCustomization(categoryName, session.user.id, icon, color);

      // Update local state
      setCategories(categories.map(c =>
        c.name === categoryName ? { ...c, icon, color } : c
      ));
    } catch (error) {
      console.error('Error updating category customization:', error);
      setError('Failed to update category customization: ' + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const cancelEditingCategory = () => {
    setEditingCategory(null);
    setEditingCategoryName('');
    setEditingCategoryLimit('');
    setEditingRecurrenceFrequency('monthly');
    setEditingPeriodStartDate(new Date().toISOString().split('T')[0]);
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
      setCategories(categories.filter(c => c.name !== categoryName));
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

      setCategories(categories.filter(c => c.name !== categoryName));
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
        category: categories.length > 0 ? categories[0] : '',
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

  const handleStartEditRecurring = (rule) => {
    setEditingRecurring(rule.id);
    setEditingRecurringData({
      description: rule.description,
      amount: rule.amount.toString(),
      category: rule.category,
      frequency: rule.frequency,
      dayOfMonth: rule.dayOfMonth,
      startDate: rule.startDate,
      account_id: rule.account_id,
    });
  };

  const handleCancelEditRecurring = () => {
    setEditingRecurring(null);
    setEditingRecurringData({
      description: '',
      amount: '',
      category: '',
      frequency: 'monthly',
      dayOfMonth: 1,
      startDate: '',
      account_id: '',
    });
  };

  const handleSaveEditRecurring = async () => {
    if (editingRecurringData.description && editingRecurringData.amount && editingRecurringData.account_id) {
      try {
        setIsLoading(true);
        const updatedRule = {
          description: editingRecurringData.description,
          amount: parseFloat(editingRecurringData.amount),
          category: editingRecurringData.category,
          frequency: editingRecurringData.frequency,
          day_of_month: parseInt(editingRecurringData.dayOfMonth),
          start_date: editingRecurringData.startDate,
          account_id: editingRecurringData.account_id,
        };

        const { error } = await supabase
          .from('recurring_rules')
          .update(updatedRule)
          .eq('id', editingRecurring)
          .eq('user_id', session.user.id);

        if (error) throw error;

        // Update local state
        setRecurringRules(recurringRules.map(r =>
          r.id === editingRecurring
            ? {
                ...r,
                description: editingRecurringData.description,
                amount: parseFloat(editingRecurringData.amount),
                category: editingRecurringData.category,
                frequency: editingRecurringData.frequency,
                dayOfMonth: parseInt(editingRecurringData.dayOfMonth),
                startDate: editingRecurringData.startDate,
                account_id: editingRecurringData.account_id,
              }
            : r
        ));

        handleCancelEditRecurring();
      } catch (error) {
        console.error('Error updating recurring rule:', error);
        alert('Failed to update recurring rule: ' + error.message);
      } finally {
        setIsLoading(false);
      }
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

      // Generate a unique transfer ID to link the transactions
      const transferId = crypto.randomUUID();

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
        transfer_id: transferId,
        transfer_type: 'withdrawal',
      };

      // Deposit transaction
      const depositTransaction = {
        user_id: session.user.id,
        date: transactionDate,
        description: description,
        amount: amount,
        category: 'Transfer',
        account_id: transfer.toAccountId,
        transfer_id: transferId,
        transfer_type: 'deposit',
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

  // Category rule handlers
  const handleAddCategoryRule = async (ruleData) => {
    try {
      setIsLoading(true);
      const data = await dataService.addCategoryRule(ruleData, session.user.id);
      setCategoryRules([...categoryRules, data]);
    } catch (error) {
      console.error('Error adding category rule:', error);
      alert('Failed to add category rule: ' + error.message);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateCategoryRule = async (ruleId, updates) => {
    try {
      setIsLoading(true);
      await dataService.updateCategoryRule(ruleId, updates);
      setCategoryRules(categoryRules.map(r =>
        r.id === ruleId ? { ...r, ...updates } : r
      ));
    } catch (error) {
      console.error('Error updating category rule:', error);
      alert('Failed to update category rule: ' + error.message);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteCategoryRule = async (ruleId) => {
    try {
      setIsLoading(true);
      await dataService.deleteCategoryRule(ruleId);
      setCategoryRules(categoryRules.filter(r => r.id !== ruleId));
    } catch (error) {
      console.error('Error deleting category rule:', error);
      alert('Failed to delete category rule: ' + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  // Debt handlers
  const handleAddDebt = async (debtData) => {
    try {
      setIsLoading(true);
      const data = await dataService.addDebt(debtData, session.user.id);
      setDebts([...debts, data]);
    } catch (error) {
      console.error('Error adding debt:', error);
      alert('Failed to add debt: ' + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteDebt = async (debtId) => {
    try {
      setIsLoading(true);
      await dataService.deleteDebt(debtId);
      setDebts(debts.filter(d => d.id !== debtId));
      // Also remove associated payments
      setDebtPayments(debtPayments.filter(p => p.debt_id !== debtId));
    } catch (error) {
      console.error('Error deleting debt:', error);
      alert('Failed to delete debt: ' + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRecordPayment = async (payment, debtId, debtUpdate, transactionInfo = null) => {
    try {
      setIsLoading(true);

      let transactionId = null;

      // Optionally create transaction if requested
      if (transactionInfo && transactionInfo.createTransaction) {
        const transactionData = {
          date: payment.payment_date,
          description: transactionInfo.description,
          amount: -payment.amount_paid, // Negative for expense
          category: transactionInfo.category,
          account_id: transactionInfo.account_id,
          comment: payment.note || ''
        };

        // Add transaction
        const newTransaction = await dataService.addTransaction(transactionData, session.user.id);
        transactionId = newTransaction.id;

        // Add to local state
        setTransactions([newTransaction, ...transactions]);

        // Update account balance
        const account = accounts.find(a => a.id === transactionInfo.account_id);
        if (account) {
          const newBalance = account.balance + transactionData.amount;
          await dataService.updateAccountBalance(account.id, newBalance);
          setAccounts(accounts.map(a =>
            a.id === account.id ? { ...a, balance: newBalance } : a
          ));
        }
      }

      // Add payment record with optional transaction link
      const paymentWithTransaction = {
        ...payment,
        transaction_id: transactionId
      };
      const paymentData = await dataService.addDebtPayment(paymentWithTransaction, session.user.id);
      setDebtPayments([...debtPayments, paymentData]);

      // Update debt
      const updatedDebt = await dataService.updateDebt(debtId, debtUpdate);
      setDebts(debts.map(d => d.id === debtId ? updatedDebt : d));

    } catch (error) {
      console.error('Error recording payment:', error);
      alert('Failed to record payment: ' + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateDebt = async (debtId, updates) => {
    try {
      setIsLoading(true);
      const updatedDebt = await dataService.updateDebt(debtId, updates);
      setDebts(debts.map(d => d.id === debtId ? updatedDebt : d));
    } catch (error) {
      console.error('Error updating debt:', error);
      alert('Failed to update debt: ' + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLinkTransactionToDebt = async (transactionId, debtId, paymentData) => {
    try {
      setIsLoading(true);

      // Get the debt
      const debt = debts.find(d => d.id === debtId);
      if (!debt) {
        alert('Debt not found');
        return;
      }

      // Create debt payment record with transaction link
      const payment = {
        debt_id: debtId,
        payment_date: paymentData.payment_date,
        amount_paid: paymentData.amount_paid,
        principal_paid: paymentData.principal_paid,
        interest_paid: paymentData.interest_paid,
        transaction_id: transactionId,
        note: paymentData.note
      };

      const paymentRecord = await dataService.addDebtPayment(payment, session.user.id);
      setDebtPayments([...debtPayments, paymentRecord]);

      // Update debt
      const newBalance = Math.max(0, debt.current_balance - paymentData.principal_paid);
      const newPaidInstallments = debt.paid_installments + 1;
      const isFullyPaid = newBalance <= 0.01;

      // Calculate next payment date
      const calculateNextPaymentDate = (startDate, paidInstallments) => {
        const date = new Date(startDate);
        date.setMonth(date.getMonth() + paidInstallments + 1);
        return date.toISOString().split('T')[0];
      };

      const debtUpdate = {
        current_balance: newBalance,
        paid_installments: newPaidInstallments,
        next_payment_date: isFullyPaid ? debt.next_payment_date : calculateNextPaymentDate(debt.start_date, newPaidInstallments),
        is_active: !isFullyPaid
      };

      const updatedDebt = await dataService.updateDebt(debtId, debtUpdate);
      setDebts(debts.map(d => d.id === debtId ? updatedDebt : d));

      alert('Transakcja została pomyślnie połączona z długiem!');
    } catch (error) {
      console.error('Error linking transaction to debt:', error);
      alert('Failed to link transaction to debt: ' + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  // Savings Goals handlers
  const handleAddSavingsGoal = async (goalData) => {
    try {
      setIsLoading(true);
      const data = await dataService.addSavingsGoal(goalData, session.user.id);
      setSavingsGoals([...savingsGoals, data]);
    } catch (error) {
      console.error('Error adding savings goal:', error);
      alert('Failed to add savings goal: ' + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateSavingsGoal = async (goalId, updates) => {
    try {
      setIsLoading(true);
      const updatedGoal = await dataService.updateSavingsGoal(goalId, updates);
      setSavingsGoals(savingsGoals.map(g => g.id === goalId ? updatedGoal : g));
    } catch (error) {
      console.error('Error updating savings goal:', error);
      alert('Failed to update savings goal: ' + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteSavingsGoal = async (goalId) => {
    try {
      setIsLoading(true);
      await dataService.deleteSavingsGoal(goalId);
      setSavingsGoals(savingsGoals.filter(g => g.id !== goalId));
      // Also remove associated contributions
      setGoalContributions(goalContributions.filter(c => c.goal_id !== goalId));
    } catch (error) {
      console.error('Error deleting savings goal:', error);
      alert('Failed to delete savings goal: ' + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddGoalContribution = async (contributionData) => {
    try {
      setIsLoading(true);
      const data = await dataService.addGoalContribution(contributionData, session.user.id);
      setGoalContributions([...goalContributions, data]);
    } catch (error) {
      console.error('Error adding goal contribution:', error);
      alert('Failed to add contribution: ' + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleShowCelebration = (milestone) => {
    setCelebrationMessage(milestone);
    // Auto-dismiss after 5 seconds
    setTimeout(() => {
      setCelebrationMessage(null);
    }, 5000);
  };

  // Calculate monthly income for analytics
  const monthlyIncome = useMemo(() => {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const recentTransactions = transactions.filter(t => new Date(t.date) >= thirtyDaysAgo);
    return recentTransactions.reduce((sum, t) => sum + (t.amount > 0 ? t.amount : 0), 0);
  }, [transactions]);

  // Category change handler
  const handleCategoryChange = async (transaction, newCategory) => {
    if (!transaction || !newCategory) return;

    try {
      setIsLoading(true);

      // Get the old category for budget adjustment
      const oldCategory = transaction.category;

      // Update in Supabase
      const { error } = await supabase
        .from('transactions')
        .update({ category: newCategory })
        .eq('id', transaction.id);

      if (error) throw error;

      // Update local state
      setTransactions(transactions.map(t =>
        t.id === transaction.id ? { ...t, category: newCategory } : t
      ));

      // Update budget spent amounts if the transaction is an expense
      if (transaction.amount < 0) {
        // Remove from old budget
        if (oldCategory) {
          const oldBudget = budgets.find(b => b.category === oldCategory);
          if (oldBudget) {
            const newSpent = Math.max(0, oldBudget.spent - Math.abs(transaction.amount));
            await supabase
              .from('budgets')
              .update({ spent: newSpent })
              .eq('id', oldBudget.id);

            setBudgets(budgets.map(b =>
              b.id === oldBudget.id ? { ...b, spent: newSpent } : b
            ));
          }
        }

        // Add to new budget
        const newBudget = budgets.find(b => b.category === newCategory);
        if (newBudget) {
          const newSpent = newBudget.spent + Math.abs(transaction.amount);
          await supabase
            .from('budgets')
            .update({ spent: newSpent })
            .eq('id', newBudget.id);

          setBudgets(budgets.map(b =>
            b.id === newBudget.id ? { ...b, spent: newSpent } : b
          ));
        }
      }
    } catch (error) {
      console.error('Error changing category:', error);
      setError('Failed to change category: ' + error.message);
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
        isMobileMenuOpen={isMobileMenuOpen}
        setIsMobileMenuOpen={setIsMobileMenuOpen}
      />

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-y-auto">
        {/* Mobile Header with Hamburger Menu */}
        <div className="md:hidden bg-white shadow-md p-4 flex items-center justify-between sticky top-0 z-30">
          <button
            onClick={() => setIsMobileMenuOpen(true)}
            className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
            aria-label="Open menu"
          >
            <Menu size={24} className="text-gray-800" />
          </button>
          <h1 className="text-lg font-bold text-gray-800">Budget Tracker</h1>
          <div className="w-10"></div> {/* Spacer for centering */}
        </div>

        <div className="flex-1 p-4 md:p-8">
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
            spendingByBudgetPeriod={spendingByBudgetPeriod}
            categorySpendingData={categorySpendingData}
            monthlyData={monthlyData}
            showAddTransaction={showAddTransaction}
            setShowAddTransaction={setShowAddTransaction}
            newTransaction={newTransaction}
            setNewTransaction={setNewTransaction}
            handleAddTransaction={handleAddTransaction}
            setDeleteConfirm={setDeleteConfirm}
            setShowCSVImport={setShowCSVImport}
            setActiveTab={setActiveTab}
            onCategoryChange={handleCategoryChange}
            onAddCategory={handleAddCategory}
            onUpdateTransaction={handleUpdateTransaction}
            onConvertToTransfer={handleConvertToTransfer}
            onBulkUpdate={handleBulkUpdate}
            debts={debts}
            debtPayments={debtPayments}
            onLinkTransactionToDebt={handleLinkTransactionToDebt}
          />
        )}

        {activeTab === 'transactions' && (
          <TransactionsTab
            filteredTransactions={filteredTransactions}
            hasActiveFilters={hasActiveFilters}
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
            setDeleteConfirm={setDeleteConfirm}
            onCategoryChange={handleCategoryChange}
            onAddCategory={handleAddCategory}
            categorySpendingData={categorySpendingData}
            monthlyData={monthlyData}
            budgets={budgets}
            spendingByCategory={spendingByCategory}
            spendingByBudgetPeriod={spendingByBudgetPeriod}
            setShowCSVImport={setShowCSVImport}
            accounts={accounts}
            showAddTransaction={showAddTransaction}
            setShowAddTransaction={setShowAddTransaction}
            newTransaction={newTransaction}
            setNewTransaction={setNewTransaction}
            handleAddTransaction={handleAddTransaction}
            onUpdateTransaction={handleUpdateTransaction}
            onConvertToTransfer={handleConvertToTransfer}
            onBulkUpdate={handleBulkUpdate}
            debts={debts}
            debtPayments={debtPayments}
            onLinkTransactionToDebt={handleLinkTransactionToDebt}
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
            newCategoryIcon={newCategoryIcon}
            setNewCategoryIcon={setNewCategoryIcon}
            newCategoryColor={newCategoryColor}
            setNewCategoryColor={setNewCategoryColor}
            addBudgetWithCategory={addBudgetWithCategory}
            setAddBudgetWithCategory={setAddBudgetWithCategory}
            newCategoryLimit={newCategoryLimit}
            setNewCategoryLimit={setNewCategoryLimit}
            onAddCategory={handleAddCategory}
            onDeleteCategory={(category) => setDeleteConfirm({ show: true, type: 'category-only', id: category, name: category })}
            onRenameCategory={handleRenameCategory}
            onUpdateCustomization={handleUpdateCategoryCustomization}
            categoryRules={categoryRules}
            onAddRule={handleAddCategoryRule}
            onUpdateRule={handleUpdateCategoryRule}
            onDeleteRule={handleDeleteCategoryRule}
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
            newRecurrenceFrequency={newRecurrenceFrequency}
            setNewRecurrenceFrequency={setNewRecurrenceFrequency}
            newPeriodStartDate={newPeriodStartDate}
            setNewPeriodStartDate={setNewPeriodStartDate}
            editingCategory={editingCategory}
            editingCategoryName={editingCategoryName}
            setEditingCategoryName={setEditingCategoryName}
            editingCategoryLimit={editingCategoryLimit}
            setEditingCategoryLimit={setEditingCategoryLimit}
            editingRecurrenceFrequency={editingRecurrenceFrequency}
            setEditingRecurrenceFrequency={setEditingRecurrenceFrequency}
            editingPeriodStartDate={editingPeriodStartDate}
            setEditingPeriodStartDate={setEditingPeriodStartDate}
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
            editingRecurring={editingRecurring}
            editingRecurringData={editingRecurringData}
            setEditingRecurringData={setEditingRecurringData}
            handleStartEditRecurring={handleStartEditRecurring}
            handleCancelEditRecurring={handleCancelEditRecurring}
            handleSaveEditRecurring={handleSaveEditRecurring}
          />
        )}

        {activeTab === 'debts' && (
          <DebtsTab
            debts={debts}
            debtPayments={debtPayments}
            accounts={accounts}
            onAddDebt={handleAddDebt}
            onDeleteDebt={handleDeleteDebt}
            onRecordPayment={handleRecordPayment}
            onUpdateDebt={handleUpdateDebt}
          />
        )}

        {activeTab === 'savings-goals' && (
          <SavingsGoalsTab
            savingsGoals={savingsGoals}
            accounts={accounts}
            monthlyIncome={monthlyIncome}
            onAddGoal={handleAddSavingsGoal}
            onUpdateGoal={handleUpdateSavingsGoal}
            onDeleteGoal={handleDeleteSavingsGoal}
            onAddContribution={handleAddGoalContribution}
            onShowCelebration={handleShowCelebration}
          />
        )}

        {activeTab === 'analytics' && (
          <AnalyticsTab
            transactions={transactions}
            budgets={budgets}
            accounts={accounts}
            debts={debts}
            savingsGoals={savingsGoals}
          />
        )}

        {/* Combined Tabs - UX Audit Improvements */}
        {activeTab === 'budgets-categories' && (
          <BudgetsCategoriesTab
            budgets={budgets}
            categories={categories}
            showAddBudget={showAddBudget}
            setShowAddBudget={setShowAddBudget}
            newCategoryName={newCategoryName}
            setNewCategoryName={setNewCategoryName}
            newCategoryLimit={newCategoryLimit}
            setNewCategoryLimit={setNewCategoryLimit}
            newRecurrenceFrequency={newRecurrenceFrequency}
            setNewRecurrenceFrequency={setNewRecurrenceFrequency}
            newPeriodStartDate={newPeriodStartDate}
            setNewPeriodStartDate={setNewPeriodStartDate}
            editingCategory={editingCategory}
            editingCategoryName={editingCategoryName}
            setEditingCategoryName={setEditingCategoryName}
            editingCategoryLimit={editingCategoryLimit}
            setEditingCategoryLimit={setEditingCategoryLimit}
            editingRecurrenceFrequency={editingRecurrenceFrequency}
            setEditingRecurrenceFrequency={setEditingRecurrenceFrequency}
            editingPeriodStartDate={editingPeriodStartDate}
            setEditingPeriodStartDate={setEditingPeriodStartDate}
            onAddBudget={handleAddBudget}
            onStartEditing={startEditingCategory}
            onSaveEdit={handleUpdateCategory}
            onCancelEdit={cancelEditingCategory}
            onDeleteBudget={(category) => setDeleteConfirm({ show: true, type: 'category', id: category, name: category })}
            showAddCategory={showAddCategory}
            setShowAddCategory={setShowAddCategory}
            newCategoryIcon={newCategoryIcon}
            setNewCategoryIcon={setNewCategoryIcon}
            newCategoryColor={newCategoryColor}
            setNewCategoryColor={setNewCategoryColor}
            addBudgetWithCategory={addBudgetWithCategory}
            setAddBudgetWithCategory={setAddBudgetWithCategory}
            onAddCategory={handleAddCategory}
            onDeleteCategory={(category) => setDeleteConfirm({ show: true, type: 'category-only', id: category, name: category })}
            onRenameCategory={handleRenameCategory}
            onUpdateCustomization={handleUpdateCategoryCustomization}
            categoryRules={categoryRules}
            onAddRule={handleAddCategoryRule}
            onUpdateRule={handleUpdateCategoryRule}
            onDeleteRule={handleDeleteCategoryRule}
            transactions={transactions}
          />
        )}

        {activeTab === 'financial-goals' && (
          <FinancialGoalsTab
            savingsGoals={savingsGoals}
            accounts={accounts}
            monthlyIncome={monthlyIncome}
            onAddGoal={handleAddSavingsGoal}
            onUpdateGoal={handleUpdateSavingsGoal}
            onDeleteGoal={handleDeleteSavingsGoal}
            onAddContribution={handleAddGoalContribution}
            onShowCelebration={handleShowCelebration}
            debts={debts}
            debtPayments={debtPayments}
            onAddDebt={handleAddDebt}
            onDeleteDebt={handleDeleteDebt}
            onRecordPayment={handleRecordPayment}
            onUpdateDebt={handleUpdateDebt}
          />
        )}

        {/* CSV Import Modal */}
        {showCSVImport && (
          <CSVImport
            accounts={accounts}
            categories={categories}
            categoryRules={categoryRules}
            existingTransactions={transactions}
            onImport={handleCSVImport}
            onClose={() => setShowCSVImport(false)}
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

        {/* Celebration Message */}
        {celebrationMessage && (
          <div className="fixed inset-0 flex items-center justify-center z-50 pointer-events-none">
            <div className="bg-gradient-to-r from-green-500 to-blue-500 text-white px-8 py-6 rounded-2xl shadow-2xl transform scale-110 animate-bounce pointer-events-auto">
              <div className="text-3xl font-bold text-center mb-2">
                {celebrationMessage.message}
              </div>
              <div className="text-center text-sm opacity-90">
                Milestone: {celebrationMessage.percentage}%
              </div>
            </div>
          </div>
        )}
        </div>
      </div>
    </div>
  );
};

const AppWrapper = ({ session }) => {
  return <BudgetApp session={session} />;
};

export default AppWrapper;
