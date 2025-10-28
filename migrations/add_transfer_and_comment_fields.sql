-- Add transfer_id, transfer_type, and comment fields to transactions table
-- This migration enhances transaction tracking with:
-- 1. Proper transfer linking (transfer_id)
-- 2. Transfer type identification (withdrawal/deposit)
-- 3. Optional comments for additional context

-- Add transfer_id to link paired transfer transactions
ALTER TABLE transactions
ADD COLUMN IF NOT EXISTS transfer_id UUID;

-- Add transfer_type enum to identify withdrawal vs deposit
DO $$ BEGIN
    CREATE TYPE transfer_type AS ENUM ('withdrawal', 'deposit');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

ALTER TABLE transactions
ADD COLUMN IF NOT EXISTS transfer_type transfer_type;

-- Add comment field for additional transaction notes
ALTER TABLE transactions
ADD COLUMN IF NOT EXISTS comment TEXT;

-- Create index on transfer_id for efficient lookups
CREATE INDEX IF NOT EXISTS idx_transactions_transfer_id ON transactions(transfer_id);

-- Add comment with migration info
COMMENT ON COLUMN transactions.transfer_id IS 'Links paired transfer transactions together';
COMMENT ON COLUMN transactions.transfer_type IS 'Indicates if transaction is a withdrawal or deposit in a transfer';
COMMENT ON COLUMN transactions.comment IS 'Optional user comment/note for the transaction';
