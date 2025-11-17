-- Migration: Add Debts Table for Polish Debt Tracking
-- This table manages user debts with Polish financial standards (interest rate and RRSO)

CREATE TABLE IF NOT EXISTS debts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Basic debt information
  name TEXT NOT NULL,
  principal_amount NUMERIC NOT NULL, -- Kwota zadłużenia (original debt amount)
  current_balance NUMERIC NOT NULL, -- Current remaining balance

  -- Polish financial standards
  interest_rate NUMERIC NOT NULL, -- Oprocentowanie nominalne (nominal interest rate per year, e.g., 5.5 for 5.5%)
  rrso NUMERIC NOT NULL, -- RRSO - Rzeczywista Roczna Stopa Oprocentowania (Annual Percentage Rate)

  -- Installment details
  total_installments INTEGER NOT NULL, -- Total number of installments
  paid_installments INTEGER DEFAULT 0, -- Number of installments paid so far
  installment_amount NUMERIC NOT NULL, -- Monthly installment amount

  -- Dates
  start_date DATE NOT NULL, -- When the debt started
  next_payment_date DATE NOT NULL, -- Next payment due date
  end_date DATE, -- Expected final payment date (calculated)

  -- Additional info
  creditor TEXT, -- Bank or lender name (optional)
  description TEXT, -- Additional notes
  account_id UUID REFERENCES accounts(id), -- Which account payments come from

  -- Status
  is_active BOOLEAN DEFAULT true, -- Is this debt still active

  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_debts_user_id ON debts(user_id);
CREATE INDEX IF NOT EXISTS idx_debts_is_active ON debts(is_active);

-- Enable Row Level Security
ALTER TABLE debts ENABLE ROW LEVEL SECURITY;

-- RLS Policies: Users can only access their own debts
CREATE POLICY "Users can view their own debts"
  ON debts FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own debts"
  ON debts FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own debts"
  ON debts FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own debts"
  ON debts FOR DELETE
  USING (auth.uid() = user_id);

-- Table to track individual debt payments
CREATE TABLE IF NOT EXISTS debt_payments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  debt_id UUID NOT NULL REFERENCES debts(id) ON DELETE CASCADE,

  -- Payment details
  payment_date DATE NOT NULL,
  amount_paid NUMERIC NOT NULL,
  principal_paid NUMERIC NOT NULL, -- How much went toward principal
  interest_paid NUMERIC NOT NULL, -- How much went toward interest

  -- Link to transaction (if payment was recorded as a transaction)
  transaction_id UUID REFERENCES transactions(id) ON DELETE SET NULL,

  -- Optional note
  note TEXT,

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_debt_payments_user_id ON debt_payments(user_id);
CREATE INDEX IF NOT EXISTS idx_debt_payments_debt_id ON debt_payments(debt_id);

-- Enable RLS for debt_payments
ALTER TABLE debt_payments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own debt payments"
  ON debt_payments FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own debt payments"
  ON debt_payments FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own debt payments"
  ON debt_payments FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own debt payments"
  ON debt_payments FOR DELETE
  USING (auth.uid() = user_id);

-- Add comments for documentation
COMMENT ON TABLE debts IS 'Stores user debt information with Polish financial standards (interest rate and RRSO)';
COMMENT ON COLUMN debts.rrso IS 'Rzeczywista Roczna Stopa Oprocentowania - Polish APR including all costs';
COMMENT ON COLUMN debts.interest_rate IS 'Nominal interest rate per year (percentage)';
COMMENT ON TABLE debt_payments IS 'Tracks individual debt payment history';
