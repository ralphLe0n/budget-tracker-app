import React, { useState, useMemo } from 'react';
import { X, CreditCard, AlertCircle } from 'lucide-react';
import { formatCurrency } from '../../utils/formatters';
import { THEME } from '../../config/theme';

const LinkDebtPaymentModal = ({
  transaction,
  debts,
  onLink,
  onClose
}) => {
  const [selectedDebtId, setSelectedDebtId] = useState('');
  const [note, setNote] = useState('');

  // Filter to only show active debts
  const activeDebts = useMemo(() => {
    return debts.filter(d => d.is_active);
  }, [debts]);

  // Calculate payment breakdown for selected debt
  const paymentBreakdown = useMemo(() => {
    if (!selectedDebtId) return null;

    const debt = debts.find(d => d.id === selectedDebtId);
    if (!debt) return null;

    const paymentAmount = Math.abs(transaction.amount);
    const monthlyRate = debt.interest_rate / 100 / 12;
    const interestPaid = debt.current_balance * monthlyRate;
    const principalPaid = paymentAmount - interestPaid;

    return {
      debt,
      interestPaid: Math.max(0, interestPaid),
      principalPaid: Math.max(0, principalPaid),
      totalAmount: paymentAmount
    };
  }, [selectedDebtId, debts, transaction.amount]);

  const handleSubmit = () => {
    if (!selectedDebtId) {
      alert('Proszę wybrać dług');
      return;
    }

    const breakdown = paymentBreakdown;
    if (!breakdown) return;

    onLink(selectedDebtId, {
      payment_date: transaction.date,
      amount_paid: breakdown.totalAmount,
      principal_paid: breakdown.principalPaid,
      interest_paid: breakdown.interestPaid,
      note: note || `Linked from transaction: ${transaction.description}`
    });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl p-6 max-w-lg w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-bold text-gray-800">Połącz z Długiem</h3>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Transaction Details */}
        <div className="mb-6 p-4 bg-gray-50 rounded-lg">
          <p className="text-sm text-gray-600 mb-1">Transakcja:</p>
          <p className="font-medium text-gray-800">{transaction.description}</p>
          <div className="flex justify-between items-center mt-2">
            <span className="text-sm text-gray-600">Kwota:</span>
            <span className="text-lg font-bold" style={{ color: THEME.danger }}>
              {formatCurrency(Math.abs(transaction.amount))}
            </span>
          </div>
          <div className="flex justify-between items-center mt-1">
            <span className="text-sm text-gray-600">Data:</span>
            <span className="text-sm text-gray-800">
              {new Date(transaction.date).toLocaleDateString('pl-PL')}
            </span>
          </div>
        </div>

        {/* Debt Selection */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Wybierz Dług *
          </label>
          {activeDebts.length === 0 ? (
            <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg flex items-start gap-3">
              <AlertCircle size={20} className="text-yellow-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-yellow-800">Brak aktywnych długów</p>
                <p className="text-xs text-yellow-700 mt-1">
                  Dodaj dług w zakładce "Długi" aby móc połączyć go z transakcją
                </p>
              </div>
            </div>
          ) : (
            <select
              value={selectedDebtId}
              onChange={(e) => setSelectedDebtId(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:border-transparent"
            >
              <option value="">Wybierz dług...</option>
              {activeDebts.map((debt) => (
                <option key={debt.id} value={debt.id}>
                  {debt.name} - Saldo: {formatCurrency(debt.current_balance)} - Rata: {formatCurrency(debt.installment_amount)}
                </option>
              ))}
            </select>
          )}
        </div>

        {/* Payment Breakdown Preview */}
        {paymentBreakdown && (
          <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="font-medium text-gray-700 mb-3">Podgląd Podziału Wpłaty:</p>

            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Dług:</span>
                <span className="font-medium text-gray-800">{paymentBreakdown.debt.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Obecne saldo:</span>
                <span className="font-medium">{formatCurrency(paymentBreakdown.debt.current_balance)}</span>
              </div>
              <div className="border-t border-blue-300 my-2"></div>
              <div className="flex justify-between">
                <span className="text-gray-600">Kwota wpłaty:</span>
                <span className="font-bold text-blue-700">{formatCurrency(paymentBreakdown.totalAmount)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600 pl-4">→ Kapitał:</span>
                <span className="font-medium text-green-600">{formatCurrency(paymentBreakdown.principalPaid)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600 pl-4">→ Odsetki:</span>
                <span className="font-medium text-orange-600">{formatCurrency(paymentBreakdown.interestPaid)}</span>
              </div>
              <div className="border-t border-blue-300 my-2"></div>
              <div className="flex justify-between">
                <span className="text-gray-600">Nowe saldo:</span>
                <span className="font-bold text-green-600">
                  {formatCurrency(Math.max(0, paymentBreakdown.debt.current_balance - paymentBreakdown.principalPaid))}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Spłacone raty:</span>
                <span className="font-medium text-gray-800">
                  {paymentBreakdown.debt.paid_installments + 1} / {paymentBreakdown.debt.total_installments}
                </span>
              </div>
            </div>

            {paymentBreakdown.totalAmount < paymentBreakdown.debt.installment_amount * 0.9 && (
              <div className="mt-3 p-2 bg-yellow-50 border border-yellow-300 rounded flex items-start gap-2">
                <AlertCircle size={16} className="text-yellow-600 flex-shrink-0 mt-0.5" />
                <p className="text-xs text-yellow-800">
                  Uwaga: Kwota transakcji jest niższa niż miesięczna rata ({formatCurrency(paymentBreakdown.debt.installment_amount)})
                </p>
              </div>
            )}
          </div>
        )}

        {/* Note */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Notatka (opcjonalnie)
          </label>
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:border-transparent"
            rows="2"
            placeholder="Dodatkowe informacje o wpłacie..."
          />
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3">
          <button
            onClick={handleSubmit}
            disabled={!selectedDebtId || activeDebts.length === 0}
            className="flex-1 text-white py-3 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            style={{
              backgroundColor: selectedDebtId ? THEME.success : THEME.gray
            }}
          >
            <CreditCard className="inline mr-2" size={18} />
            Połącz z Długiem
          </button>
          <button
            onClick={onClose}
            className="px-6 py-3 border-2 rounded-lg font-medium transition-colors"
            style={{ borderColor: THEME.danger, color: THEME.danger }}
          >
            Anuluj
          </button>
        </div>
      </div>
    </div>
  );
};

export default LinkDebtPaymentModal;
