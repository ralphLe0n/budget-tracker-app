import React, { useState } from 'react';
import { Target, CreditCard } from 'lucide-react';
import { THEME } from '../../config/theme';
import SavingsGoalsTab from './SavingsGoalsTab';
import DebtsTab from './DebtsTab';

const FinancialGoalsTab = ({
  // Savings Goals props
  savingsGoals,
  monthlyIncome,
  onAddGoal,
  onUpdateGoal,
  onDeleteGoal,
  onAddContribution,
  onShowCelebration,
  // Debts props
  debts,
  debtPayments,
  accounts,
  onAddDebt,
  onDeleteDebt,
  onRecordPayment,
  onUpdateDebt
}) => {
  const [activeView, setActiveView] = useState('savings'); // 'savings' or 'debts'

  return (
    <div>
      {/* Tab Switcher */}
      <div className="bg-white rounded-2xl shadow-lg p-2 mb-6">
        <div className="flex gap-2">
          <button
            onClick={() => setActiveView('savings')}
            className={`flex-1 flex items-center justify-center gap-2 px-6 py-3 rounded-lg transition-all font-medium ${
              activeView === 'savings'
                ? 'text-white shadow-md'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
            style={{
              backgroundColor: activeView === 'savings' ? THEME.primary : 'transparent'
            }}
          >
            <Target size={20} />
            <span>Cele Oszczędnościowe</span>
          </button>
          <button
            onClick={() => setActiveView('debts')}
            className={`flex-1 flex items-center justify-center gap-2 px-6 py-3 rounded-lg transition-all font-medium ${
              activeView === 'debts'
                ? 'text-white shadow-md'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
            style={{
              backgroundColor: activeView === 'debts' ? THEME.danger : 'transparent',
              color: activeView === 'debts' ? 'white' : 'inherit'
            }}
          >
            <CreditCard size={20} />
            <span>Spłata Długów</span>
          </button>
        </div>
      </div>

      {/* Content */}
      {activeView === 'savings' ? (
        <SavingsGoalsTab
          savingsGoals={savingsGoals}
          accounts={accounts}
          monthlyIncome={monthlyIncome}
          onAddGoal={onAddGoal}
          onUpdateGoal={onUpdateGoal}
          onDeleteGoal={onDeleteGoal}
          onAddContribution={onAddContribution}
          onShowCelebration={onShowCelebration}
        />
      ) : (
        <DebtsTab
          debts={debts}
          debtPayments={debtPayments}
          accounts={accounts}
          onAddDebt={onAddDebt}
          onDeleteDebt={onDeleteDebt}
          onRecordPayment={onRecordPayment}
          onUpdateDebt={onUpdateDebt}
        />
      )}
    </div>
  );
};

export default FinancialGoalsTab;
