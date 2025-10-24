import { supabase } from '../supabaseClient';

export const generateTransactionsFromRules = async (recurringRules, accounts, budgets, userId) => {
  const today = new Date();
  today.setHours(23, 59, 59, 999); // Set to end of day for comparison
  let transactionsToCreate = [];
  let rulesToUpdate = [];

  console.log('🔍 Generate Now Debug Info:');
  console.log('Total recurring rules:', recurringRules.length);
  console.log('Today (end of day):', today);
  console.log('Recurring rules:', recurringRules);

  for (const rule of recurringRules) {
    console.log('\n📋 Processing rule:', rule.description);
    console.log('  - Active:', rule.active);
    console.log('  - Account ID:', rule.account_id);
    console.log('  - Start Date:', rule.startDate);
    console.log('  - Last Generated:', rule.lastGenerated);
    console.log('  - Frequency:', rule.frequency);

    if (!rule.active) {
      console.log('  ❌ Skipping - rule is not active');
      continue;
    }

    // Determine the next date to generate
    let currentDate;
    if (rule.lastGenerated) {
      // If we've generated before, start from the NEXT occurrence after lastGenerated
      currentDate = new Date(rule.lastGenerated);
      console.log('  - Starting from last generated:', currentDate);
      if (rule.frequency === 'monthly') {
        currentDate.setMonth(currentDate.getMonth() + 1);
        currentDate.setDate(rule.dayOfMonth);
      } else if (rule.frequency === 'weekly') {
        currentDate.setDate(currentDate.getDate() + 7);
      } else if (rule.frequency === 'yearly') {
        currentDate.setFullYear(currentDate.getFullYear() + 1);
      }
      console.log('  - Next occurrence:', currentDate);
    } else {
      // First time generating - start from the start date
      currentDate = new Date(rule.startDate);
      console.log('  - First time generation, starting from:', currentDate);
    }

    console.log('  - Checking condition: currentDate <= today?', currentDate, '<=', today, '=', currentDate <= today);

    // Generate all pending transactions for this rule
    let generatedCount = 0;
    while (currentDate <= today) {
      const transactionDate = currentDate.toISOString().split('T')[0];
      generatedCount++;
      console.log('  ✅ Generating transaction for:', transactionDate);

      transactionsToCreate.push({
        user_id: userId,
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
    console.log('  - Generated', generatedCount, 'transaction(s) for this rule');
  }

  console.log('\n📊 Summary:');
  console.log('Total transactions to create:', transactionsToCreate.length);
  console.log('Transactions:', transactionsToCreate);

  if (transactionsToCreate.length === 0) {
    console.log('❌ No pending transactions to generate');
    return { count: 0, message: 'No pending transactions to generate' };
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

    return {
      count: insertedTransactions.length,
      message: `Successfully generated ${insertedTransactions.length} transaction(s)`
    };
  } catch (error) {
    console.error('Error generating transactions:', error);
    throw error;
  }
};

export const calculateNextOccurrence = (rule) => {
  const today = new Date();
  let nextDate;

  if (rule.lastGenerated) {
    nextDate = new Date(rule.lastGenerated);
    if (rule.frequency === 'monthly') {
      nextDate.setMonth(nextDate.getMonth() + 1);
      nextDate.setDate(rule.dayOfMonth);
    } else if (rule.frequency === 'weekly') {
      nextDate.setDate(nextDate.getDate() + 7);
    } else if (rule.frequency === 'yearly') {
      nextDate.setFullYear(nextDate.getFullYear() + 1);
    }
  } else {
    nextDate = new Date(rule.startDate);
  }

  return nextDate;
};
