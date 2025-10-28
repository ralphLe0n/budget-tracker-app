import { supabase } from '../supabaseClient';

// Load all data from Supabase
export const loadAllData = async (userId) => {
  const results = {
    transactions: [],
    budgets: [],
    categories: [],
    recurringRules: [],
    accounts: [],
    categoryRules: []
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
        account_id: t.account_id
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
        spent: parseFloat(b.spent)
      }));
    }

    // Load categories
    const { data: categoriesData, error: catError } = await supabase
      .from('categories')
      .select('*')
      .eq('user_id', userId);

    if (catError) throw catError;
    if (categoriesData) {
      results.categories = categoriesData.map(c => c.name);
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

    return results;
  } catch (error) {
    console.error('Error loading data:', error);
    throw error;
  }
};

// Transaction operations
export const addTransaction = async (transaction, userId) => {
  const { data, error } = await supabase
    .from('transactions')
    .insert([{
      user_id: userId,
      date: transaction.date,
      description: transaction.description,
      amount: transaction.amount,
      category: transaction.category,
      account_id: transaction.account_id
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

// Category operations
export const addCategory = async (name, userId) => {
  const { data, error } = await supabase
    .from('categories')
    .insert([{ name, user_id: userId }])
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
