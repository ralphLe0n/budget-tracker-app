-- Add recurrency fields to budgets table
-- This migration enables recurring budget periods with:
-- 1. Recurrence frequency (daily, weekly, monthly, yearly)
-- 2. Period start date to track when budget periods begin
-- 3. Last reset date to track when the budget was last renewed

-- Create recurrence_frequency enum
DO $$ BEGIN
    CREATE TYPE recurrence_frequency AS ENUM ('daily', 'weekly', 'monthly', 'yearly');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Add recurrence_frequency column (default to 'monthly' for backward compatibility)
ALTER TABLE budgets
ADD COLUMN IF NOT EXISTS recurrence_frequency recurrence_frequency DEFAULT 'monthly';

-- Add period_start_date column (defaults to first day of current month)
ALTER TABLE budgets
ADD COLUMN IF NOT EXISTS period_start_date DATE DEFAULT DATE_TRUNC('month', CURRENT_DATE);

-- Add last_reset_date to track when budget was last renewed
ALTER TABLE budgets
ADD COLUMN IF NOT EXISTS last_reset_date DATE DEFAULT CURRENT_DATE;

-- Create index on period_start_date for efficient period calculations
CREATE INDEX IF NOT EXISTS idx_budgets_period_start ON budgets(period_start_date);

-- Add comments for documentation
COMMENT ON COLUMN budgets.recurrence_frequency IS 'How often the budget period repeats (daily, weekly, monthly, yearly)';
COMMENT ON COLUMN budgets.period_start_date IS 'The date when the budget period begins';
COMMENT ON COLUMN budgets.last_reset_date IS 'The date when the budget spent amount was last reset';

-- Update existing budgets to have proper period_start_date (first day of current month)
UPDATE budgets
SET period_start_date = DATE_TRUNC('month', CURRENT_DATE)
WHERE period_start_date IS NULL;
