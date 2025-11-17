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
    <div className="bg-white rounded-2xl shadow-lg p-4 sm:p-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <h2 className="text-xl sm:text-2xl font-bold text-gray-800">Zarządzanie Kontami</h2>
        <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 w-full sm:w-auto">
          <button
            onClick={() => setShowTransfer(!showTransfer)}
            className="flex items-center justify-center gap-2 px-4 py-3 rounded-lg transition-colors font-medium text-white w-full sm:w-auto"
            style={{ backgroundColor: THEME.success }}
            onMouseOver={(e) => e.currentTarget.style.backgroundColor = THEME.successHover}
            onMouseOut={(e) => e.currentTarget.style.backgroundColor = THEME.success}
            title="Przelej pieniądze między kontami"
          >
            <ArrowLeftRight size={20} />
            Przelew
          </button>
          <button
            onClick={() => setShowAddAccount(!showAddAccount)}
            className="flex items-center justify-center gap-2 px-4 py-3 rounded-lg transition-colors font-medium text-white w-full sm:w-auto"
            style={{ backgroundColor: THEME.primary }}
            onMouseOver={(e) => e.currentTarget.style.backgroundColor = THEME.primaryHover}
            onMouseOut={(e) => e.currentTarget.style.backgroundColor = THEME.primary}
          >
            <PlusCircle size={20} />
            Dodaj Konto
          </button>
        </div>
      </div>

      {/* Add Account Form */}
      {showAddAccount && (
        <div className="rounded-xl p-6 mb-6 border-2" style={{ backgroundColor: THEME.primaryLight, borderColor: THEME.primary }}>
          <h3 className="font-semibold text-gray-800 mb-4">Nowe Konto</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Nazwa Konta</label>
              <input
                type="text"
                value={newAccount.name}
                onChange={(e) => setNewAccount({ ...newAccount, name: e.target.value })}
                placeholder="np. Główny Portfel, Konto Oszczędnościowe"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Typ Konta</label>
              <select
                value={newAccount.type}
                onChange={(e) => setNewAccount({ ...newAccount, type: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:border-transparent"
              >
                <option value="wallet">Portfel</option>
                <option value="current">Konto Bieżące</option>
                <option value="savings">Konto Oszczędnościowe</option>
                <option value="credit">Karta Kredytowa</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Saldo Początkowe</label>
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
          <div className="flex flex-col sm:flex-row gap-3 mt-4">
            <button
              onClick={handleAddAccount}
              className="w-full sm:w-auto px-6 py-3 rounded-lg transition-colors font-medium text-white"
              style={{ backgroundColor: THEME.primary }}
              onMouseOver={(e) => e.currentTarget.style.backgroundColor = THEME.primaryHover}
              onMouseOut={(e) => e.currentTarget.style.backgroundColor = THEME.primary}
            >
              Zapisz Konto
            </button>
            <button
              onClick={() => setShowAddAccount(false)}
              className="w-full sm:w-auto bg-gray-200 hover:bg-gray-300 text-gray-700 px-6 py-3 rounded-lg transition-colors font-medium"
            >
              Anuluj
            </button>
          </div>
        </div>
      )}

      {/* Transfer Form */}
      {showTransfer && (
        <div className="rounded-xl p-6 mb-6 border-2" style={{ backgroundColor: '#d1fae5', borderColor: THEME.success }}>
          <h3 className="font-semibold text-gray-800 mb-4">Przelew między Kontami</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Z Konta *</label>
              <select
                value={transfer.fromAccountId}
                onChange={(e) => setTransfer({ ...transfer, fromAccountId: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:border-transparent"
                required
              >
                <option value="">Wybierz konto źródłowe</option>
                {accounts.map((account) => (
                  <option key={account.id} value={account.id}>
                    {account.name} ({formatCurrency(account.balance)})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Na Konto *</label>
              <select
                value={transfer.toAccountId}
                onChange={(e) => setTransfer({ ...transfer, toAccountId: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:border-transparent"
                required
              >
                <option value="">Wybierz konto docelowe</option>
                {accounts.map((account) => (
                  <option key={account.id} value={account.id}>
                    {account.name} ({formatCurrency(account.balance)})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Kwota *</label>
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
              <label className="block text-sm font-medium text-gray-700 mb-2">Opis (Opcjonalny)</label>
              <input
                type="text"
                value={transfer.description}
                onChange={(e) => setTransfer({ ...transfer, description: e.target.value })}
                placeholder="Opis przelewu..."
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:border-transparent"
              />
            </div>
          </div>
          <div className="flex flex-col sm:flex-row gap-3 mt-4">
            <button
              onClick={handleTransfer}
              className="w-full sm:w-auto px-6 py-3 rounded-lg transition-colors font-medium text-white"
              style={{ backgroundColor: THEME.success }}
              onMouseOver={(e) => e.currentTarget.style.backgroundColor = THEME.successHover}
              onMouseOut={(e) => e.currentTarget.style.backgroundColor = THEME.success}
            >
              Przelej Pieniądze
            </button>
            <button
              onClick={() => setShowTransfer(false)}
              className="w-full sm:w-auto bg-gray-200 hover:bg-gray-300 text-gray-700 px-6 py-3 rounded-lg transition-colors font-medium"
            >
              Anuluj
            </button>
          </div>
        </div>
      )}

      {/* Account List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {accounts.length === 0 ? (
          <div className="col-span-full text-center py-12 text-gray-500">
            <Wallet size={48} className="mx-auto mb-4 opacity-50" />
            <p className="text-lg">Brak kont</p>
            <p className="text-sm">Utwórz konta aby śledzić swoje pieniądze</p>
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
                    title="Usuń konto"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
                <h3 className="text-lg font-bold text-gray-800 mb-1">{account.name}</h3>
                <p className="text-xs text-gray-600 mb-3 capitalize">{account.type}</p>
                <div className="border-t border-blue-200 pt-3">
                  <p className="text-xs text-gray-600 mb-1">Aktualne Saldo</p>
                  <p className="text-2xl font-bold" style={{ color: account.balance >= 0 ? THEME.success : THEME.danger }}>
                    {formatCurrency(account.balance)}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    Saldo początkowe: {formatCurrency(account.starting_balance)}
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
