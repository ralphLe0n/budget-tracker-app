import { supabase } from '../supabaseClient';

// Load all data from Supabase
export const loadAllData = async (userId) => {
  const results = {
    transactions: [],
    budgets: [],
    categories: [],
    recurringRules: [],
    accounts: [],
    categoryRules: [],
    debts: [],
    debtPayments: []
  };

  try {
    // Load transactions
    const { data: transactionsData, error: transError } = await supabase
      .from('transactions')
      .select('*')
      .eq('user_id', userId)
      .order('date', { ascending: false });

    if (transError) throw transError;
    if (transactionsData) {
      results.transactions = transactionsData.map(t => ({
        id: t.id,
        date: t.date,
        description: t.description,
        amount: parseFloat(t.amount),
        category: t.category,
        account_id: t.account_id,
        transfer_id: t.transfer_id || null,
        transfer_type: t.transfer_type || null,
        comment: t.comment || ''
      }));
    }

    // Load budgets
    const { data: budgetsData, error: budgetError } = await supabase
      .from('budgets')
      .select('*')
      .eq('user_id', userId);

    if (budgetError) throw budgetError;
    if (budgetsData) {
      results.budgets = budgetsData.map(b => ({
        id: b.id,
        category: b.category,
        limit: parseFloat(b.limit_amount),
        spent: parseFloat(b.spent),
        recurrenceFrequency: b.recurrence_frequency || 'monthly',
        periodStartDate: b.period_start_date || new Date().toISOString().split('T')[0],
        lastResetDate: b.last_reset_date || new Date().toISOString().split('T')[0]
      }));
    }

    // Load categories
    const { data: categoriesData, error: catError } = await supabase
      .from('categories')
      .select('*')
      .eq('user_id', userId);

    if (catError) throw catError;
    if (categoriesData) {
      results.categories = categoriesData.map(c => ({
        name: c.name,
        icon: c.icon || 'Tag',
        color: c.color || '#3b82f6'
      }));
    }

    // Load recurring rules
    const { data: recurringData, error: recurError } = await supabase
      .from('recurring_rules')
      .select('*')
      .eq('user_id', userId);

    if (recurError) throw recurError;
    if (recurringData) {
      results.recurringRules = recurringData.map(r => ({
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
    }

    // Load accounts
    const { data: accountsData, error: accountsError } = await supabase
      .from('accounts')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: true });

    if (accountsError) throw accountsError;
    if (accountsData) {
      results.accounts = accountsData.map(a => ({
        id: a.id,
        name: a.name,
        type: a.type,
        balance: parseFloat(a.balance),
        starting_balance: parseFloat(a.starting_balance)
      }));
    }

    // Load category rules
    const { data: rulesData, error: rulesError } = await supabase
      .from('category_rules')
      .select('*')
      .eq('user_id', userId)
      .order('priority', { ascending: true });

    if (rulesError) {
      // Don't throw error if table doesn't exist yet (migration not run)
      if (rulesError.code !== '42P01') {
        throw rulesError;
      }
    }
    if (rulesData) {
      results.categoryRules = rulesData;
    }

    // Load debts
    const debtsData = await loadDebts(userId);
    results.debts = debtsData;

    // Load debt payments
    const debtPaymentsData = await loadDebtPayments(userId);
    results.debtPayments = debtPaymentsData;

    return results;
  } catch (error) {
    console.error('Error loading data:', error);
    throw error;
  }
};

// Transaction operations
export const addTransaction = async (transaction, userId) => {
  const { data, error} = await supabase
    .from('transactions')
    .insert([{
      user_id: userId,
      date: transaction.date,
      description: transaction.description,
      amount: transaction.amount,
      category: transaction.category,
      account_id: transaction.account_id,
      transfer_id: transaction.transfer_id || null,
      transfer_type: transaction.transfer_type || null,
      comment: transaction.comment || null
    }])
    .select();

  if (error) throw error;
  return data[0];
};

export const deleteTransaction = async (id) => {
  const { error } = await supabase
    .from('transactions')
    .delete()
    .eq('id', id);

  if (error) throw error;
};

export const updateTransaction = async (id, updates) => {
  const { data, error } = await supabase
    .from('transactions')
    .update(updates)
    .eq('id', id)
    .select();

  if (error) throw error;
  return data[0];
};

export const bulkUpdateTransactions = async (ids, updates) => {
  const { data, error } = await supabase
    .from('transactions')
    .update(updates)
    .in('id', ids)
    .select();

  if (error) throw error;
  return data;
};

// Category operations
export const addCategory = async (name, userId, icon = 'Tag', color = '#3b82f6') => {
  const { data, error } = await supabase
    .from('categories')
    .insert([{ name, user_id: userId, icon, color }])
    .select();

  if (error) throw error;
  return data[0];
};

export const updateCategory = async (oldName, newName, userId) => {
  const { error } = await supabase
    .from('categories')
    .update({ name: newName })
    .eq('name', oldName)
    .eq('user_id', userId);

  if (error) throw error;
};

export const updateCategoryCustomization = async (name, userId, icon, color) => {
  const { error } = await supabase
    .from('categories')
    .update({ icon, color })
    .eq('name', name)
    .eq('user_id', userId);

  if (error) throw error;
};

export const deleteCategory = async (name, userId) => {
  const { error } = await supabase
    .from('categories')
    .delete()
    .eq('name', name)
    .eq('user_id', userId);

  if (error) throw error;
};

// Budget operations
export const addBudget = async (budget, userId) => {
  const { data, error } = await supabase
    .from('budgets')
    .insert([{
      user_id: userId,
      category: budget.category,
      limit_amount: budget.limit,
      spent: 0
    }])
    .select();

  if (error) throw error;
  return data[0];
};

export const updateBudget = async (budgetId, spent) => {
  const { error } = await supabase
    .from('budgets')
    .update({ spent })
    .eq('id', budgetId);

  if (error) throw error;
};

export const deleteBudget = async (id) => {
  const { error } = await supabase
    .from('budgets')
    .delete()
    .eq('id', id);

  if (error) throw error;
};

// Account operations
export const addAccount = async (account, userId) => {
  const { data, error } = await supabase
    .from('accounts')
    .insert([{
      user_id: userId,
      name: account.name,
      type: account.type,
      balance: account.balance,
      starting_balance: account.balance
    }])
    .select();

  if (error) throw error;
  return data[0];
};

export const updateAccountBalance = async (accountId, newBalance) => {
  const { error } = await supabase
    .from('accounts')
    .update({ balance: newBalance })
    .eq('id', accountId);

  if (error) throw error;
};

export const deleteAccount = async (id) => {
  const { error } = await supabase
    .from('accounts')
    .delete()
    .eq('id', id);

  if (error) throw error;
};

// Recurring rule operations
export const addRecurringRule = async (rule, userId) => {
  const { data, error } = await supabase
    .from('recurring_rules')
    .insert([{
      user_id: userId,
      description: rule.description,
      amount: rule.amount,
      category: rule.category,
      frequency: rule.frequency,
      day_of_month: rule.dayOfMonth,
      start_date: rule.startDate,
      last_generated: null,
      active: true,
      account_id: rule.account_id
    }])
    .select();

  if (error) throw error;
  return data[0];
};

export const updateRecurringRule = async (ruleId, updates) => {
  const dbUpdates = {};
  if (updates.lastGenerated !== undefined) dbUpdates.last_generated = updates.lastGenerated;
  if (updates.active !== undefined) dbUpdates.active = updates.active;

  const { error } = await supabase
    .from('recurring_rules')
    .update(dbUpdates)
    .eq('id', ruleId);

  if (error) throw error;
};

export const deleteRecurringRule = async (id) => {
  const { error } = await supabase
    .from('recurring_rules')
    .delete()
    .eq('id', id);

  if (error) throw error;
};

// Category rule operations
export const addCategoryRule = async (rule, userId) => {
  const { data, error } = await supabase
    .from('category_rules')
    .insert([{
      user_id: userId,
      category: rule.category,
      pattern: rule.pattern,
      is_regex: rule.is_regex,
      case_sensitive: rule.case_sensitive,
      priority: rule.priority,
      enabled: rule.enabled
    }])
    .select();

  if (error) throw error;
  return data[0];
};

export const updateCategoryRule = async (ruleId, updates) => {
  const { error } = await supabase
    .from('category_rules')
    .update(updates)
    .eq('id', ruleId);

  if (error) throw error;
};

export const deleteCategoryRule = async (id) => {
  const { error } = await supabase
    .from('category_rules')
    .delete()
    .eq('id', id);

  if (error) throw error;
};

// Debt operations
export const loadDebts = async (userId) => {
  const { data, error } = await supabase
    .from('debts')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) {
    // Don't throw error if table doesn't exist yet (migration not run)
    if (error.code !== '42P01') {
      throw error;
    }
    return [];
  }

  return data || [];
};

export const addDebt = async (debt, userId) => {
  const { data, error } = await supabase
    .from('debts')
    .insert([{
      user_id: userId,
      name: debt.name,
      principal_amount: debt.principal_amount,
      current_balance: debt.current_balance,
      interest_rate: debt.interest_rate,
      rrso: debt.rrso,
      total_installments: debt.total_installments,
      paid_installments: debt.paid_installments || 0,
      installment_amount: debt.installment_amount,
      start_date: debt.start_date,
      next_payment_date: debt.next_payment_date,
      end_date: debt.end_date,
      creditor: debt.creditor || null,
      description: debt.description || null,
      account_id: debt.account_id || null,
      is_active: debt.is_active !== undefined ? debt.is_active : true
    }])
    .select();

  if (error) throw error;
  return data[0];
};

export const updateDebt = async (debtId, updates) => {
  const { data, error } = await supabase
    .from('debts')
    .update(updates)
    .eq('id', debtId)
    .select();

  if (error) throw error;
  return data[0];
};

export const deleteDebt = async (id) => {
  const { error } = await supabase
    .from('debts')
    .delete()
    .eq('id', id);

  if (error) throw error;
};

// Debt payment operations
export const loadDebtPayments = async (userId) => {
  const { data, error } = await supabase
    .from('debt_payments')
    .select('*')
    .eq('user_id', userId)
    .order('payment_date', { ascending: false });

  if (error) {
    // Don't throw error if table doesn't exist yet
    if (error.code !== '42P01') {
      throw error;
    }
    return [];
  }

  return data || [];
};

export const addDebtPayment = async (payment, userId) => {
  const { data, error } = await supabase
    .from('debt_payments')
    .insert([{
      user_id: userId,
      debt_id: payment.debt_id,
      payment_date: payment.payment_date,
      amount_paid: payment.amount_paid,
      principal_paid: payment.principal_paid,
      interest_paid: payment.interest_paid,
      transaction_id: payment.transaction_id || null,
      note: payment.note || null
    }])
    .select();

  if (error) throw error;
  return data[0];
};

export const deleteDebtPayment = async (id) => {
  const { error } = await supabase
    .from('debt_payments')
    .delete()
    .eq('id', id);

  if (error) throw error;
};
