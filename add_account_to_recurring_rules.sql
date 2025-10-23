-- Migration: Add account_id column to recurring_rules table
-- This migration adds support for linking recurring rules to specific accounts

-- Add account_id column to recurring_rules table
ALTER TABLE recurring_rules
ADD COLUMN IF NOT EXISTS account_id UUID REFERENCES accounts(id) ON DELETE CASCADE;

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_recurring_rules_account_id ON recurring_rules(account_id);

-- Note: Existing recurring rules will have NULL account_id
-- You may want to update them manually or via the UI
