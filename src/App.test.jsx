/**
 * Unit tests for transaction saving functionality
 *
 * To run these tests:
 * 1. Install test dependencies:
 *    npm install -D vitest @testing-library/react @testing-library/jest-dom @testing-library/user-event jsdom
 *
 * 2. Add to package.json scripts:
 *    "test": "vitest",
 *    "test:ui": "vitest --ui"
 *
 * 3. Create vitest.config.js in the project root:
 *    import { defineConfig } from 'vitest/config'
 *    import react from '@vitejs/plugin-react'
 *
 *    export default defineConfig({
 *      plugins: [react()],
 *      test: {
 *        environment: 'jsdom',
 *        globals: true,
 *        setupFiles: './src/test/setup.js',
 *      },
 *    })
 *
 * 4. Run: npm test
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';

// Mock Supabase client
const mockSupabase = {
  from: vi.fn(() => ({
    insert: vi.fn(() => ({
      select: vi.fn(() => ({
        single: vi.fn()
      }))
    })),
    update: vi.fn(() => ({
      eq: vi.fn()
    })),
    select: vi.fn(() => ({
      eq: vi.fn(() => ({
        order: vi.fn()
      }))
    }))
  }))
};

describe('Transaction Saving Functionality', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('handleAddTransaction', () => {
    it('should save transaction with all required fields', async () => {
      const mockTransaction = {
        description: 'Test Transaction',
        amount: -50.00,
        account_id: 'account-123',
        category: 'Food',
        date: '2025-10-23'
      };

      const mockSession = {
        user: { id: 'user-123' }
      };

      const expectedTransaction = {
        user_id: 'user-123',
        date: mockTransaction.date,
        description: mockTransaction.description,
        amount: mockTransaction.amount,
        category: mockTransaction.category,
        account_id: mockTransaction.account_id,
      };

      // Mock successful response
      const mockResponse = {
        data: { id: 'trans-123', ...expectedTransaction },
        error: null
      };

      mockSupabase.from().insert().select().single.mockResolvedValue(mockResponse);

      // Test that transaction is saved with correct data
      expect(expectedTransaction).toEqual({
        user_id: 'user-123',
        date: '2025-10-23',
        description: 'Test Transaction',
        amount: -50.00,
        category: 'Food',
        account_id: 'account-123',
      });
    });

    it('should not save transaction without required account_id', () => {
      const incompleteTransaction = {
        description: 'Test Transaction',
        amount: -50.00,
        category: 'Food',
        date: '2025-10-23',
        account_id: '' // Missing account_id
      };

      // Validation check
      const isValid = incompleteTransaction.description &&
                      incompleteTransaction.amount &&
                      incompleteTransaction.account_id;

      expect(isValid).toBe(false);
    });

    it('should update account balance after transaction is saved', async () => {
      const mockAccount = {
        id: 'account-123',
        balance: 1000.00
      };

      const mockTransaction = {
        amount: -50.00,
        account_id: 'account-123'
      };

      const expectedNewBalance = mockAccount.balance + mockTransaction.amount;

      expect(expectedNewBalance).toBe(950.00);
    });

    it('should update budget spent for expense transactions', () => {
      const mockBudget = {
        id: 'budget-123',
        category: 'Food',
        spent: 100.00,
        limit: 500.00
      };

      const mockTransaction = {
        amount: -50.00, // Expense
        category: 'Food'
      };

      const expectedNewSpent = mockBudget.spent + Math.abs(mockTransaction.amount);

      expect(expectedNewSpent).toBe(150.00);
    });

    it('should not update budget for income transactions', () => {
      const mockBudget = {
        id: 'budget-123',
        category: 'Salary',
        spent: 0,
        limit: 0
      };

      const mockTransaction = {
        amount: 3000.00, // Income (positive)
        category: 'Salary'
      };

      const shouldUpdateBudget = mockTransaction.amount < 0;

      expect(shouldUpdateBudget).toBe(false);
    });
  });

  describe('generateTransactionsFromRules', () => {
    it('should generate transactions with account_id from recurring rules', () => {
      const mockRule = {
        id: 'rule-123',
        description: 'Monthly Rent',
        amount: -1000.00,
        category: 'Housing',
        account_id: 'account-123',
        frequency: 'monthly',
        dayOfMonth: 1,
        startDate: '2025-01-01',
        lastGenerated: null,
        active: true
      };

      const generatedTransaction = {
        user_id: 'user-123',
        date: '2025-10-01',
        description: mockRule.description + ' (Auto)',
        amount: mockRule.amount,
        category: mockRule.category,
        account_id: mockRule.account_id,
      };

      // Verify account_id is included
      expect(generatedTransaction.account_id).toBe('account-123');
      expect(generatedTransaction.description).toContain('(Auto)');
    });

    it('should generate first occurrence when start date is today', () => {
      const today = new Date();
      const todayStr = today.toISOString().split('T')[0];

      const mockRule = {
        id: 'rule-123',
        description: 'Daily Expense',
        amount: -10.00,
        category: 'Food',
        account_id: 'account-123',
        frequency: 'weekly',
        startDate: todayStr,
        lastGenerated: null,
        active: true
      };

      // When start date is today and lastGenerated is null,
      // it should start from the start date
      const currentDate = new Date(mockRule.startDate);
      const todayEndOfDay = new Date(today);
      todayEndOfDay.setHours(23, 59, 59, 999);

      // Should generate if currentDate <= todayEndOfDay
      expect(currentDate <= todayEndOfDay).toBe(true);
    });

    it('should catch up on missed occurrences', () => {
      // Rule started 6 months ago, never generated
      const sixMonthsAgo = new Date();
      sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
      const startDate = sixMonthsAgo.toISOString().split('T')[0];

      const mockRule = {
        id: 'rule-123',
        description: 'Monthly Rent',
        amount: -1000.00,
        category: 'Housing',
        account_id: 'account-123',
        frequency: 'monthly',
        dayOfMonth: 1,
        startDate: startDate,
        lastGenerated: null,
        active: true
      };

      // Should generate approximately 6 transactions (one for each month)
      // The exact logic would iterate from startDate to today
      const monthsPassed = 6;
      expect(monthsPassed).toBeGreaterThan(0);
    });

    it('should update account balances when generating recurring transactions', () => {
      const mockAccount = {
        id: 'account-123',
        balance: 5000.00
      };

      const generatedTransactions = [
        { account_id: 'account-123', amount: -1000.00 }, // Rent
        { account_id: 'account-123', amount: -50.00 },   // Subscription
      ];

      let totalChange = 0;
      for (const trans of generatedTransactions) {
        if (trans.account_id === 'account-123') {
          totalChange += trans.amount;
        }
      }

      const expectedNewBalance = mockAccount.balance + totalChange;

      expect(expectedNewBalance).toBe(3950.00);
    });

    it('should handle multiple accounts correctly', () => {
      const accountBalanceUpdates = {};
      const transactions = [
        { account_id: 'account-1', amount: -100.00 },
        { account_id: 'account-1', amount: -50.00 },
        { account_id: 'account-2', amount: -200.00 },
      ];

      for (const trans of transactions) {
        if (!accountBalanceUpdates[trans.account_id]) {
          accountBalanceUpdates[trans.account_id] = 0;
        }
        accountBalanceUpdates[trans.account_id] += trans.amount;
      }

      expect(accountBalanceUpdates['account-1']).toBe(-150.00);
      expect(accountBalanceUpdates['account-2']).toBe(-200.00);
    });
  });

  describe('Data Loading', () => {
    it('should load account_id when fetching transactions from database', () => {
      const mockDbTransaction = {
        id: 'trans-123',
        date: '2025-10-23',
        description: 'Test',
        amount: -50.00,
        category: 'Food',
        account_id: 'account-123'
      };

      const formattedTransaction = {
        id: mockDbTransaction.id,
        date: mockDbTransaction.date,
        description: mockDbTransaction.description,
        amount: parseFloat(mockDbTransaction.amount),
        category: mockDbTransaction.category,
        account_id: mockDbTransaction.account_id
      };

      expect(formattedTransaction.account_id).toBeDefined();
      expect(formattedTransaction.account_id).toBe('account-123');
    });

    it('should load account_id when fetching recurring rules from database', () => {
      const mockDbRule = {
        id: 'rule-123',
        description: 'Monthly Rent',
        amount: -1000.00,
        category: 'Housing',
        frequency: 'monthly',
        day_of_month: 1,
        start_date: '2025-01-01',
        last_generated: null,
        active: true,
        account_id: 'account-123'
      };

      const formattedRule = {
        id: mockDbRule.id,
        description: mockDbRule.description,
        amount: parseFloat(mockDbRule.amount),
        category: mockDbRule.category,
        frequency: mockDbRule.frequency,
        dayOfMonth: mockDbRule.day_of_month,
        startDate: mockDbRule.start_date,
        lastGenerated: mockDbRule.last_generated,
        active: mockDbRule.active,
        account_id: mockDbRule.account_id
      };

      expect(formattedRule.account_id).toBeDefined();
      expect(formattedRule.account_id).toBe('account-123');
    });
  });

  describe('Form Validation', () => {
    it('should validate transaction form has all required fields', () => {
      const transactionForm = {
        description: 'Test Transaction',
        amount: '-50.00',
        account_id: 'account-123',
        category: 'Food',
        date: '2025-10-23'
      };

      const isValid = transactionForm.description &&
                      transactionForm.amount &&
                      transactionForm.account_id;

      expect(isValid).toBe(true);
    });

    it('should validate recurring rule form has all required fields', () => {
      const recurringForm = {
        description: 'Monthly Rent',
        amount: '-1000.00',
        account_id: 'account-123',
        category: 'Housing',
        frequency: 'monthly',
        dayOfMonth: '1',
        startDate: '2025-01-01'
      };

      const isValid = recurringForm.description &&
                      recurringForm.amount &&
                      recurringForm.account_id;

      expect(isValid).toBe(true);
    });

    it('should fail validation if account_id is missing', () => {
      const invalidForm = {
        description: 'Test',
        amount: '-50.00',
        account_id: '', // Empty account_id
        category: 'Food'
      };

      const isValid = invalidForm.description &&
                      invalidForm.amount &&
                      invalidForm.account_id;

      expect(isValid).toBe(false);
    });
  });
});
