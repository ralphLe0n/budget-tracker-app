import React from 'react';
import { PlusCircle, Wallet, CreditCard, DollarSign, Trash2, ArrowLeftRight } from 'lucide-react';
import { THEME } from '../../config/theme';
import { formatCurrency } from '../../utils/formatters';

const AccountsTab = ({
  accounts,
  showAddAccount,
  setShowAddAccount,
  newAccount,
  setNewAccount,
  handleAddAccount,
  showTransfer,
  setShowTransfer,
  transfer,
  setTransfer,
  handleTransfer,
  setDeleteConfirm
}) => {
  return (
    <div className="bg-white rounded-2xl shadow-lg p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800">Manage Accounts</h2>
        <div className="flex gap-3">
          <button
            onClick={() => setShowTransfer(!showTransfer)}
            className="flex items-center gap-2 px-4 py-2 rounded-lg transition-colors font-medium text-white"
            style={{ backgroundColor: THEME.success }}
            onMouseOver={(e) => e.currentTarget.style.backgroundColor = THEME.successHover}
            onMouseOut={(e) => e.currentTarget.style.backgroundColor = THEME.success}
            title="Transfer money between accounts"
          >
            <ArrowLeftRight size={20} />
            Transfer
          </button>
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

      {/* Transfer Form */}
      {showTransfer && (
        <div className="rounded-xl p-6 mb-6 border-2" style={{ backgroundColor: '#d1fae5', borderColor: THEME.success }}>
          <h3 className="font-semibold text-gray-800 mb-4">Transfer Between Accounts</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">From Account *</label>
              <select
                value={transfer.fromAccountId}
                onChange={(e) => setTransfer({ ...transfer, fromAccountId: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:border-transparent"
                required
              >
                <option value="">Select source account</option>
                {accounts.map((account) => (
                  <option key={account.id} value={account.id}>
                    {account.name} ({formatCurrency(account.balance)})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">To Account *</label>
              <select
                value={transfer.toAccountId}
                onChange={(e) => setTransfer({ ...transfer, toAccountId: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:border-transparent"
                required
              >
                <option value="">Select destination account</option>
                {accounts.map((account) => (
                  <option key={account.id} value={account.id}>
                    {account.name} ({formatCurrency(account.balance)})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Amount *</label>
              <input
                type="number"
                step="0.01"
                value={transfer.amount}
                onChange={(e) => setTransfer({ ...transfer, amount: e.target.value })}
                placeholder="0.00"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:border-transparent"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Description (Optional)</label>
              <input
                type="text"
                value={transfer.description}
                onChange={(e) => setTransfer({ ...transfer, description: e.target.value })}
                placeholder="Transfer description..."
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:border-transparent"
              />
            </div>
          </div>
          <div className="flex gap-3 mt-4">
            <button
              onClick={handleTransfer}
              className="px-6 py-2 rounded-lg transition-colors font-medium text-white"
              style={{ backgroundColor: THEME.success }}
              onMouseOver={(e) => e.currentTarget.style.backgroundColor = THEME.successHover}
              onMouseOut={(e) => e.currentTarget.style.backgroundColor = THEME.success}
            >
              Transfer Money
            </button>
            <button
              onClick={() => setShowTransfer(false)}
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
                    {formatCurrency(account.balance)}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    Started with: {formatCurrency(account.starting_balance)}
                  </p>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default AccountsTab;
