import React, { useState, useEffect } from 'react';
import MobileModal from '../ui/MobileModal';
import { AmountInput, DateInput, SelectInput, TextInput } from '../ui/MobileInput';
import { THEME } from '../../config/theme';
import { formatCurrency } from '../../utils/formatters';

/**
 * Mobile-optimized transaction edit modal
 *
 * Provides easy editing of transaction details
 */
const TransactionEditModal = ({
  isOpen,
  onClose,
  transaction,
  categories,
  accounts,
  onSave,
}) => {
  const [formData, setFormData] = useState({
    date: '',
    account_id: '',
    category: '',
    description: '',
    amount: '',
  });

  // Initialize form data when modal opens
  useEffect(() => {
    if (isOpen && transaction) {
      setFormData({
        date: transaction.date || '',
        account_id: transaction.account_id || '',
        category: transaction.category || '',
        description: transaction.description || '',
        amount: Math.abs(transaction.amount).toString(),
      });
    }
  }, [isOpen, transaction]);

  const handleSubmit = () => {
    // Convert amount to negative if it was originally an expense
    const finalAmount = transaction.amount < 0
      ? -Math.abs(parseFloat(formData.amount))
      : Math.abs(parseFloat(formData.amount));

    onSave(transaction.id, {
      date: formData.date,
      account_id: formData.account_id,
      category: formData.category,
      description: formData.description,
      amount: finalAmount,
    });

    onClose();
  };

  const isValid = formData.date && formData.account_id && formData.description && formData.amount;

  if (!transaction) return null;

  return (
    <MobileModal
      isOpen={isOpen}
      onClose={onClose}
      title="Edytuj Transakcję"
      footer={
        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 px-6 py-3 rounded-lg transition-colors font-medium bg-gray-200 hover:bg-gray-300 text-gray-700"
          >
            Anuluj
          </button>
          <button
            onClick={handleSubmit}
            disabled={!isValid}
            className="flex-1 px-6 py-3 rounded-lg transition-colors font-medium text-white disabled:opacity-50 disabled:cursor-not-allowed"
            style={{
              backgroundColor: isValid ? THEME.primary : '#ccc',
            }}
          >
            Zapisz
          </button>
        </div>
      }
    >
      <div className="space-y-4">
        {/* Transaction Type Indicator */}
        <div className="p-3 rounded-lg" style={{
          backgroundColor: transaction.amount > 0 ? THEME.successLight : THEME.dangerLight,
        }}>
          <p className="text-sm font-medium" style={{
            color: transaction.amount > 0 ? THEME.success : THEME.danger,
          }}>
            {transaction.amount > 0 ? 'Przychód' : 'Wydatek'}
          </p>
        </div>

        {/* Date */}
        <DateInput
          label="Data"
          value={formData.date}
          onChange={(e) => setFormData({ ...formData, date: e.target.value })}
          required
        />

        {/* Account */}
        <SelectInput
          label="Konto"
          value={formData.account_id}
          onChange={(e) => setFormData({ ...formData, account_id: e.target.value })}
          options={accounts.map((account) => ({
            value: account.id,
            label: `${account.name} (${formatCurrency(account.balance)})`,
          }))}
          placeholder="Wybierz Konto"
          required
        />

        {/* Category */}
        <SelectInput
          label="Kategoria"
          value={formData.category}
          onChange={(e) => setFormData({ ...formData, category: e.target.value })}
          options={categories.map((cat) => ({
            value: cat.name,
            label: cat.name,
          }))}
          placeholder="Wybierz Kategorię"
        />

        {/* Description */}
        <TextInput
          label="Opis"
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          placeholder="np. Zakupy spożywcze"
          required
        />

        {/* Amount */}
        <AmountInput
          label="Kwota"
          value={formData.amount}
          onChange={(e) => {
            // Allow only numbers and decimal point
            const value = e.target.value.replace(/[^0-9.]/g, '');
            setFormData({ ...formData, amount: value });
          }}
          placeholder="0.00"
          required
        />
      </div>
    </MobileModal>
  );
};

export default TransactionEditModal;
