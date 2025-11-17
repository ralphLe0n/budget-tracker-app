import React, { useState, useMemo } from 'react';
import { PlusCircle, CreditCard, DollarSign, TrendingUp, Calendar, Trash2, Edit2, Save, X, CheckCircle, AlertCircle, Receipt } from 'lucide-react';
import { formatCurrency } from '../../utils/formatters';
import { THEME } from '../../config/theme';

const DebtsTab = ({
  debts,
  debtPayments,
  accounts,
  onAddDebt,
  onDeleteDebt,
  onRecordPayment,
  onUpdateDebt
}) => {
  const [showAddDebt, setShowAddDebt] = useState(false);
  const [editingDebtId, setEditingDebtId] = useState(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedDebtForPayment, setSelectedDebtForPayment] = useState(null);
  const [calculationMode, setCalculationMode] = useState('from_rate'); // 'from_rate' or 'from_installment'

  // New debt form state
  const [newDebt, setNewDebt] = useState({
    name: '',
    principal_amount: '',
    interest_rate: '',
    rrso: '',
    installment_amount: '', // For reverse calculation
    total_installments: '',
    start_date: new Date().toISOString().split('T')[0],
    creditor: '',
    description: '',
    account_id: ''
  });

  // Payment form state
  const [paymentForm, setPaymentForm] = useState({
    payment_date: new Date().toISOString().split('T')[0],
    amount_paid: '',
    note: ''
  });

  // Calculate installment amount using Polish amortization (annuity method)
  const calculateInstallment = (principal, annualRate, months) => {
    if (!principal || !months) return 0;

    // Handle zero or undefined interest rate
    if (annualRate === null || annualRate === undefined || annualRate === '') {
      return 0;
    }

    const monthlyRate = annualRate / 100 / 12;

    if (monthlyRate === 0) {
      return principal / months;
    }

    // Annuity formula: M = P * [r(1+r)^n] / [(1+r)^n - 1]
    const installment = principal * (monthlyRate * Math.pow(1 + monthlyRate, months)) /
                       (Math.pow(1 + monthlyRate, months) - 1);

    return installment;
  };

  // Calculate interest rate from installment amount using Newton-Raphson method
  const calculateInterestRate = (principal, installment, months) => {
    if (!principal || !installment || !months) return 0;

    // Check if it's a 0% loan (installment = principal/months)
    const simpleInstallment = principal / months;
    if (Math.abs(installment - simpleInstallment) < 0.01) {
      return 0;
    }

    // Check if installment is too small (would result in negative or impossible rate)
    if (installment <= simpleInstallment * 0.99) {
      return 0; // Impossible - installment too small
    }

    // Newton-Raphson method to solve for monthly rate
    // We're solving: installment = principal * [r(1+r)^n] / [(1+r)^n - 1]

    let monthlyRate = 0.005; // Initial guess: 0.5% per month (6% annual)
    const maxIterations = 100;
    const tolerance = 0.0001;

    for (let i = 0; i < maxIterations; i++) {
      if (monthlyRate <= 0) {
        monthlyRate = 0.001; // Prevent negative or zero rates
      }

      const onePlusR = 1 + monthlyRate;
      const onePlusRn = Math.pow(onePlusR, months);

      // Current installment with this rate
      const f = principal * (monthlyRate * onePlusRn) / (onePlusRn - 1) - installment;

      // Derivative of the function
      const df = principal * (
        (onePlusRn * (onePlusRn - 1) - monthlyRate * months * onePlusRn * (onePlusRn - 1) / onePlusR - monthlyRate * onePlusRn) /
        Math.pow(onePlusRn - 1, 2)
      );

      if (Math.abs(df) < 0.0000001) break; // Avoid division by very small numbers

      const newRate = monthlyRate - f / df;

      if (Math.abs(newRate - monthlyRate) < tolerance) {
        monthlyRate = newRate;
        break;
      }

      monthlyRate = newRate;
    }

    // Convert monthly rate to annual percentage
    const annualRate = monthlyRate * 12 * 100;

    // Sanity check: rate should be between 0% and 100%
    if (annualRate < 0 || annualRate > 100) {
      return 0;
    }

    return annualRate;
  };

  // Calculate next payment date
  const calculateNextPaymentDate = (startDate, paidInstallments) => {
    const date = new Date(startDate);
    date.setMonth(date.getMonth() + paidInstallments + 1);
    return date.toISOString().split('T')[0];
  };

  // Calculate end date
  const calculateEndDate = (startDate, totalInstallments) => {
    const date = new Date(startDate);
    date.setMonth(date.getMonth() + totalInstallments);
    return date.toISOString().split('T')[0];
  };

  // Calculate breakdown of payment (principal vs interest)
  const calculatePaymentBreakdown = (debt, paymentAmount) => {
    const monthlyRate = debt.interest_rate / 100 / 12;
    const interestPaid = debt.current_balance * monthlyRate;
    const principalPaid = paymentAmount - interestPaid;

    return {
      interestPaid: Math.max(0, interestPaid),
      principalPaid: Math.max(0, principalPaid)
    };
  };

  const handleAddDebt = async () => {
    let interestRate, rrso, installmentAmount;

    if (calculationMode === 'from_rate') {
      // Standard mode: calculate installment from rate
      if (!newDebt.name || !newDebt.principal_amount || newDebt.interest_rate === '' ||
          newDebt.rrso === '' || !newDebt.total_installments || !newDebt.start_date) {
        alert('Proszę wypełnić wszystkie wymagane pola (nazwę, kwotę, oprocentowanie, RRSO, liczbę rat i datę rozpoczęcia)');
        return;
      }

      const principal = parseFloat(newDebt.principal_amount);
      const installments = parseInt(newDebt.total_installments);
      interestRate = parseFloat(newDebt.interest_rate);
      rrso = parseFloat(newDebt.rrso);

      installmentAmount = calculateInstallment(principal, interestRate, installments);
    } else {
      // Reverse mode: calculate rate from installment
      if (!newDebt.name || !newDebt.principal_amount || !newDebt.installment_amount ||
          !newDebt.total_installments || !newDebt.start_date) {
        alert('Proszę wypełnić wszystkie wymagane pola (nazwę, kwotę, kwotę raty, liczbę rat i datę rozpoczęcia)');
        return;
      }

      const principal = parseFloat(newDebt.principal_amount);
      const installments = parseInt(newDebt.total_installments);
      installmentAmount = parseFloat(newDebt.installment_amount);

      // Calculate interest rate from installment
      interestRate = calculateInterestRate(principal, installmentAmount, installments);

      // Estimate RRSO as interest rate + 0.5% (typical margin for fees)
      // In reality, RRSO includes all costs, but this is a reasonable approximation
      rrso = interestRate + 0.5;
    }

    const principal = parseFloat(newDebt.principal_amount);
    const installments = parseInt(newDebt.total_installments);
    const endDate = calculateEndDate(newDebt.start_date, installments);
    const nextPaymentDate = calculateNextPaymentDate(newDebt.start_date, 0);

    const debtData = {
      ...newDebt,
      principal_amount: principal,
      current_balance: principal,
      interest_rate: interestRate,
      rrso: rrso,
      total_installments: installments,
      paid_installments: 0,
      installment_amount: installmentAmount,
      end_date: endDate,
      next_payment_date: nextPaymentDate,
      is_active: true
    };

    await onAddDebt(debtData);

    // Reset form
    setNewDebt({
      name: '',
      principal_amount: '',
      interest_rate: '',
      rrso: '',
      installment_amount: '',
      total_installments: '',
      start_date: new Date().toISOString().split('T')[0],
      creditor: '',
      description: '',
      account_id: ''
    });
    setShowAddDebt(false);
  };

  const handleRecordPayment = async () => {
    if (!paymentForm.amount_paid || !selectedDebtForPayment) {
      alert('Proszę wprowadzić kwotę wpłaty');
      return;
    }

    const debt = debts.find(d => d.id === selectedDebtForPayment);
    if (!debt) return;

    const amountPaid = parseFloat(paymentForm.amount_paid);
    const breakdown = calculatePaymentBreakdown(debt, amountPaid);

    const payment = {
      debt_id: debt.id,
      payment_date: paymentForm.payment_date,
      amount_paid: amountPaid,
      principal_paid: breakdown.principalPaid,
      interest_paid: breakdown.interestPaid,
      note: paymentForm.note
    };

    // Update debt balance and paid installments
    const newBalance = Math.max(0, debt.current_balance - breakdown.principalPaid);
    const newPaidInstallments = debt.paid_installments + 1;
    const isFullyPaid = newBalance <= 0.01;

    const debtUpdate = {
      current_balance: newBalance,
      paid_installments: newPaidInstallments,
      next_payment_date: isFullyPaid ? debt.next_payment_date : calculateNextPaymentDate(debt.start_date, newPaidInstallments),
      is_active: !isFullyPaid
    };

    await onRecordPayment(payment, debt.id, debtUpdate);

    // Reset payment form
    setPaymentForm({
      payment_date: new Date().toISOString().split('T')[0],
      amount_paid: '',
      note: ''
    });
    setShowPaymentModal(false);
    setSelectedDebtForPayment(null);
  };

  const openPaymentModal = (debtId) => {
    const debt = debts.find(d => d.id === debtId);
    if (debt) {
      setSelectedDebtForPayment(debtId);
      setPaymentForm({
        payment_date: new Date().toISOString().split('T')[0],
        amount_paid: debt.installment_amount.toFixed(2),
        note: ''
      });
      setShowPaymentModal(true);
    }
  };

  // Calculate summary statistics
  const summary = useMemo(() => {
    const activeDebts = debts.filter(d => d.is_active);
    const totalDebt = activeDebts.reduce((sum, d) => sum + parseFloat(d.current_balance), 0);
    const totalOriginal = activeDebts.reduce((sum, d) => sum + parseFloat(d.principal_amount), 0);
    const totalPaid = totalOriginal - totalDebt;
    const monthlyPayment = activeDebts.reduce((sum, d) => sum + parseFloat(d.installment_amount), 0);

    return {
      activeDebtsCount: activeDebts.length,
      totalDebt,
      totalPaid,
      monthlyPayment
    };
  }, [debts]);

  return (
    <div className="bg-white rounded-2xl shadow-lg p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800">Zarządzanie Długami</h2>
        <button
          onClick={() => setShowAddDebt(!showAddDebt)}
          className="flex items-center gap-2 px-4 py-2 rounded-lg transition-colors font-medium text-white"
          style={{ backgroundColor: THEME.primary }}
          onMouseOver={(e) => e.currentTarget.style.backgroundColor = THEME.primaryHover}
          onMouseOut={(e) => e.currentTarget.style.backgroundColor = THEME.primary}
        >
          <PlusCircle size={20} />
          Dodaj Dług
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="rounded-xl p-4 border-2" style={{ borderColor: THEME.danger, backgroundColor: `${THEME.danger}10` }}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Aktywne Długi</p>
              <p className="text-2xl font-bold" style={{ color: THEME.danger }}>{summary.activeDebtsCount}</p>
            </div>
            <CreditCard size={32} style={{ color: THEME.danger }} />
          </div>
        </div>

        <div className="rounded-xl p-4 border-2" style={{ borderColor: THEME.warning, backgroundColor: `${THEME.warning}10` }}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Całkowity Dług</p>
              <p className="text-2xl font-bold" style={{ color: THEME.warning }}>{formatCurrency(summary.totalDebt)}</p>
            </div>
            <DollarSign size={32} style={{ color: THEME.warning }} />
          </div>
        </div>

        <div className="rounded-xl p-4 border-2" style={{ borderColor: THEME.success, backgroundColor: `${THEME.success}10` }}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Już Spłacone</p>
              <p className="text-2xl font-bold" style={{ color: THEME.success }}>{formatCurrency(summary.totalPaid)}</p>
            </div>
            <CheckCircle size={32} style={{ color: THEME.success }} />
          </div>
        </div>

        <div className="rounded-xl p-4 border-2" style={{ borderColor: THEME.info, backgroundColor: `${THEME.info}10` }}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Miesięczna Rata</p>
              <p className="text-2xl font-bold" style={{ color: THEME.info }}>{formatCurrency(summary.monthlyPayment)}</p>
            </div>
            <Calendar size={32} style={{ color: THEME.info }} />
          </div>
        </div>
      </div>

      {/* Add Debt Form */}
      {showAddDebt && (
        <div className="rounded-xl p-6 mb-6 border-2" style={{ backgroundColor: THEME.primaryLight, borderColor: THEME.primary }}>
          <h3 className="font-semibold text-gray-800 mb-4">Nowy Dług</h3>

          {/* Calculation Mode Selector */}
          <div className="mb-6 p-4 bg-white rounded-lg border border-gray-300">
            <label className="block text-sm font-medium text-gray-700 mb-3">Tryb Kalkulacji</label>
            <div className="flex gap-4">
              <label className="flex items-center cursor-pointer">
                <input
                  type="radio"
                  name="calculationMode"
                  value="from_rate"
                  checked={calculationMode === 'from_rate'}
                  onChange={(e) => setCalculationMode(e.target.value)}
                  className="mr-2"
                />
                <span className="text-sm">
                  Znam oprocentowanie → oblicz ratę
                </span>
              </label>
              <label className="flex items-center cursor-pointer">
                <input
                  type="radio"
                  name="calculationMode"
                  value="from_installment"
                  checked={calculationMode === 'from_installment'}
                  onChange={(e) => setCalculationMode(e.target.value)}
                  className="mr-2"
                />
                <span className="text-sm">
                  Znam ratę → oblicz oprocentowanie
                </span>
              </label>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Nazwa Długu *</label>
              <input
                type="text"
                value={newDebt.name}
                onChange={(e) => setNewDebt({ ...newDebt, name: e.target.value })}
                placeholder="np. Kredyt hipoteczny"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Kwota Zadłużenia (PLN) *</label>
              <input
                type="number"
                step="0.01"
                value={newDebt.principal_amount}
                onChange={(e) => setNewDebt({ ...newDebt, principal_amount: e.target.value })}
                placeholder="100000.00"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:border-transparent"
              />
            </div>

            {calculationMode === 'from_rate' ? (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Oprocentowanie Nominalne (%) *</label>
                  <input
                    type="number"
                    step="0.01"
                    value={newDebt.interest_rate}
                    onChange={(e) => setNewDebt({ ...newDebt, interest_rate: e.target.value })}
                    placeholder="5.50"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">RRSO (%) *</label>
                  <input
                    type="number"
                    step="0.01"
                    value={newDebt.rrso}
                    onChange={(e) => setNewDebt({ ...newDebt, rrso: e.target.value })}
                    placeholder="5.75"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:border-transparent"
                  />
                  <p className="text-xs text-gray-500 mt-1">Rzeczywista Roczna Stopa Oprocentowania</p>
                </div>
              </>
            ) : (
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">Miesięczna Rata (PLN) *</label>
                <input
                  type="number"
                  step="0.01"
                  value={newDebt.installment_amount}
                  onChange={(e) => setNewDebt({ ...newDebt, installment_amount: e.target.value })}
                  placeholder="2000.00"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:border-transparent"
                />
                <p className="text-xs text-gray-500 mt-1">Podaj znaną kwotę miesięcznej raty - oprocentowanie i RRSO zostaną obliczone automatycznie</p>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Liczba Rat *</label>
              <input
                type="number"
                value={newDebt.total_installments}
                onChange={(e) => setNewDebt({ ...newDebt, total_installments: e.target.value })}
                placeholder="240"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Data Rozpoczęcia *</label>
              <input
                type="date"
                value={newDebt.start_date}
                onChange={(e) => setNewDebt({ ...newDebt, start_date: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Wierzyciel (Bank/Pożyczkodawca)</label>
              <input
                type="text"
                value={newDebt.creditor}
                onChange={(e) => setNewDebt({ ...newDebt, creditor: e.target.value })}
                placeholder="np. PKO BP"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Konto Płatności</label>
              <select
                value={newDebt.account_id}
                onChange={(e) => setNewDebt({ ...newDebt, account_id: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:border-transparent"
              >
                <option value="">Wybierz konto (opcjonalne)</option>
                {accounts.map((account) => (
                  <option key={account.id} value={account.id}>
                    {account.name} ({formatCurrency(account.balance)})
                  </option>
                ))}
              </select>
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">Opis</label>
              <textarea
                value={newDebt.description}
                onChange={(e) => setNewDebt({ ...newDebt, description: e.target.value })}
                placeholder="Dodatkowe informacje o długu..."
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:border-transparent"
                rows="2"
              />
            </div>
          </div>

          {/* Preview based on calculation mode */}
          {calculationMode === 'from_rate' && newDebt.principal_amount && newDebt.interest_rate && newDebt.total_installments && (
            <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-sm font-medium text-gray-700">
                Szacowana miesięczna rata: {' '}
                <span className="text-xl font-bold text-blue-600">
                  {formatCurrency(calculateInstallment(
                    parseFloat(newDebt.principal_amount),
                    parseFloat(newDebt.interest_rate),
                    parseInt(newDebt.total_installments)
                  ))}
                </span>
              </p>
            </div>
          )}

          {calculationMode === 'from_installment' && newDebt.principal_amount && newDebt.installment_amount && newDebt.total_installments && (
            <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-gray-700">Obliczone oprocentowanie nominalne:</p>
                  <p className="text-xl font-bold text-green-600">
                    {calculateInterestRate(
                      parseFloat(newDebt.principal_amount),
                      parseFloat(newDebt.installment_amount),
                      parseInt(newDebt.total_installments)
                    ).toFixed(2)}%
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-700">Szacowane RRSO:</p>
                  <p className="text-xl font-bold text-green-600">
                    {(calculateInterestRate(
                      parseFloat(newDebt.principal_amount),
                      parseFloat(newDebt.installment_amount),
                      parseInt(newDebt.total_installments)
                    ) + 0.5).toFixed(2)}%
                  </p>
                </div>
              </div>
              <p className="text-xs text-gray-600 mt-2">
                * RRSO jest szacowane jako oprocentowanie nominalne + 0.5% marży na opłaty
              </p>
            </div>
          )}

          <div className="flex gap-3 mt-4">
            <button
              onClick={handleAddDebt}
              className="flex-1 text-white py-2 rounded-lg font-medium transition-colors"
              style={{ backgroundColor: THEME.success }}
              onMouseOver={(e) => e.currentTarget.style.backgroundColor = THEME.successHover}
              onMouseOut={(e) => e.currentTarget.style.backgroundColor = THEME.success}
            >
              <Save className="inline mr-2" size={18} />
              Zapisz Dług
            </button>
            <button
              onClick={() => setShowAddDebt(false)}
              className="px-6 py-2 border-2 rounded-lg font-medium transition-colors"
              style={{ borderColor: THEME.danger, color: THEME.danger }}
            >
              <X className="inline mr-2" size={18} />
              Anuluj
            </button>
          </div>
        </div>
      )}

      {/* Debts List */}
      <div className="space-y-4">
        {debts.length === 0 ? (
          <div className="text-center py-12">
            <CreditCard size={64} className="mx-auto mb-4 text-gray-300" />
            <p className="text-gray-500 text-lg">Brak długów do wyświetlenia</p>
            <p className="text-gray-400 text-sm mt-2">Kliknij "Dodaj Dług" aby dodać pierwszy dług</p>
          </div>
        ) : (
          debts.map((debt) => {
            const progressPercent = ((debt.paid_installments / debt.total_installments) * 100).toFixed(1);
            const remainingInstallments = debt.total_installments - debt.paid_installments;

            return (
              <div
                key={debt.id}
                className="border-2 rounded-xl p-5 transition-shadow hover:shadow-lg"
                style={{
                  borderColor: debt.is_active ? THEME.danger : THEME.success,
                  backgroundColor: debt.is_active ? '#fff' : `${THEME.success}05`
                }}
              >
                <div className="flex justify-between items-start mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <h3 className="text-xl font-bold text-gray-800">{debt.name}</h3>
                      {!debt.is_active && (
                        <span className="px-3 py-1 rounded-full text-xs font-medium text-white" style={{ backgroundColor: THEME.success }}>
                          Spłacony
                        </span>
                      )}
                    </div>
                    {debt.creditor && (
                      <p className="text-sm text-gray-600 mt-1">Wierzyciel: {debt.creditor}</p>
                    )}
                    {debt.description && (
                      <p className="text-sm text-gray-500 mt-1">{debt.description}</p>
                    )}
                  </div>
                  <div className="flex gap-2">
                    {debt.is_active && (
                      <button
                        onClick={() => openPaymentModal(debt.id)}
                        className="p-2 rounded-lg transition-colors text-white"
                        style={{ backgroundColor: THEME.success }}
                        title="Zarejestruj wpłatę"
                      >
                        <Receipt size={18} />
                      </button>
                    )}
                    <button
                      onClick={() => onDeleteDebt(debt.id)}
                      className="p-2 rounded-lg transition-colors"
                      style={{ backgroundColor: `${THEME.danger}20`, color: THEME.danger }}
                      title="Usuń dług"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                  <div>
                    <p className="text-xs text-gray-600">Kwota Początkowa</p>
                    <p className="text-lg font-bold text-gray-800">{formatCurrency(debt.principal_amount)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-600">Pozostało do Spłaty</p>
                    <p className="text-lg font-bold" style={{ color: THEME.danger }}>{formatCurrency(debt.current_balance)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-600">Miesięczna Rata</p>
                    <p className="text-lg font-bold text-gray-800">{formatCurrency(debt.installment_amount)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-600">Następna Wpłata</p>
                    <p className="text-sm font-medium text-gray-800">
                      {debt.is_active ? new Date(debt.next_payment_date).toLocaleDateString('pl-PL') : '—'}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-4 text-sm">
                  <div>
                    <p className="text-xs text-gray-600">Oprocentowanie</p>
                    <p className="font-medium text-gray-800">{debt.interest_rate}%</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-600">RRSO</p>
                    <p className="font-medium text-gray-800">{debt.rrso}%</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-600">Rat Pozostało</p>
                    <p className="font-medium text-gray-800">{remainingInstallments} / {debt.total_installments}</p>
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="mb-2">
                  <div className="flex justify-between items-center mb-1">
                    <p className="text-sm font-medium text-gray-700">Postęp Spłaty</p>
                    <p className="text-sm font-bold" style={{ color: THEME.success }}>{progressPercent}%</p>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-3">
                    <div
                      className="h-3 rounded-full transition-all duration-300"
                      style={{
                        width: `${progressPercent}%`,
                        backgroundColor: debt.is_active ? THEME.success : THEME.successHover
                      }}
                    />
                  </div>
                </div>

                <div className="text-xs text-gray-500 mt-2">
                  Data rozpoczęcia: {new Date(debt.start_date).toLocaleDateString('pl-PL')} |
                  Planowane zakończenie: {new Date(debt.end_date).toLocaleDateString('pl-PL')}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Payment Modal */}
      {showPaymentModal && selectedDebtForPayment && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full mx-4">
            <h3 className="text-xl font-bold text-gray-800 mb-4">Zarejestruj Wpłatę</h3>

            {(() => {
              const debt = debts.find(d => d.id === selectedDebtForPayment);
              if (!debt) return null;

              const amountPaid = parseFloat(paymentForm.amount_paid) || 0;
              const breakdown = calculatePaymentBreakdown(debt, amountPaid);

              return (
                <>
                  <div className="mb-4 p-4 bg-gray-50 rounded-lg">
                    <p className="font-medium text-gray-800">{debt.name}</p>
                    <p className="text-sm text-gray-600">Saldo: {formatCurrency(debt.current_balance)}</p>
                    <p className="text-sm text-gray-600">Rata: {formatCurrency(debt.installment_amount)}</p>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Data Wpłaty</label>
                      <input
                        type="date"
                        value={paymentForm.payment_date}
                        onChange={(e) => setPaymentForm({ ...paymentForm, payment_date: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:border-transparent"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Kwota Wpłaty (PLN)</label>
                      <input
                        type="number"
                        step="0.01"
                        value={paymentForm.amount_paid}
                        onChange={(e) => setPaymentForm({ ...paymentForm, amount_paid: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:border-transparent"
                      />
                    </div>

                    {amountPaid > 0 && (
                      <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg text-sm">
                        <p className="font-medium text-gray-700 mb-2">Podział wpłaty:</p>
                        <div className="flex justify-between mb-1">
                          <span className="text-gray-600">Kapitał:</span>
                          <span className="font-medium">{formatCurrency(breakdown.principalPaid)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Odsetki:</span>
                          <span className="font-medium">{formatCurrency(breakdown.interestPaid)}</span>
                        </div>
                      </div>
                    )}

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Notatka (opcjonalnie)</label>
                      <textarea
                        value={paymentForm.note}
                        onChange={(e) => setPaymentForm({ ...paymentForm, note: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:border-transparent"
                        rows="2"
                        placeholder="Dodatkowe informacje o wpłacie..."
                      />
                    </div>
                  </div>

                  <div className="flex gap-3 mt-6">
                    <button
                      onClick={handleRecordPayment}
                      className="flex-1 text-white py-2 rounded-lg font-medium transition-colors"
                      style={{ backgroundColor: THEME.success }}
                    >
                      Zapisz Wpłatę
                    </button>
                    <button
                      onClick={() => {
                        setShowPaymentModal(false);
                        setSelectedDebtForPayment(null);
                      }}
                      className="px-6 py-2 border-2 rounded-lg font-medium"
                      style={{ borderColor: THEME.danger, color: THEME.danger }}
                    >
                      Anuluj
                    </button>
                  </div>
                </>
              );
            })()}
          </div>
        </div>
      )}
    </div>
  );
};

export default DebtsTab;
