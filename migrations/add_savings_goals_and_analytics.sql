-- Migration: Add Savings Goals and Enhanced Analytics
-- This migration adds tables for savings goals tracking and analytics data

-- ============================================================================
-- SAVINGS GOALS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS savings_goals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Goal information
  name TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL, -- Emergency Fund, Vacation, Car, House, Education, Wedding, etc.

  -- Financial details
  target_amount NUMERIC NOT NULL,
  current_amount NUMERIC DEFAULT 0,

  -- Dates
  start_date DATE NOT NULL DEFAULT CURRENT_DATE,
  target_date DATE NOT NULL,
  completed_date DATE, -- Set when goal is reached

  -- Configuration
  priority INTEGER DEFAULT 5, -- 1-10, higher = more important
  auto_allocate BOOLEAN DEFAULT false, -- Automatically allocate from income
  allocation_percentage NUMERIC DEFAULT 0, -- Percentage of income to allocate (0-100)

  -- Linked account for savings
  account_id UUID REFERENCES accounts(id),

  -- Status
  is_active BOOLEAN DEFAULT true,
  is_completed BOOLEAN DEFAULT false,

  -- Milestones tracking
  milestone_25_reached BOOLEAN DEFAULT false,
  milestone_50_reached BOOLEAN DEFAULT false,
  milestone_75_reached BOOLEAN DEFAULT false,
  milestone_100_reached BOOLEAN DEFAULT false,

  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_savings_goals_user_id ON savings_goals(user_id);
CREATE INDEX IF NOT EXISTS idx_savings_goals_is_active ON savings_goals(is_active);
CREATE INDEX IF NOT EXISTS idx_savings_goals_category ON savings_goals(category);
CREATE INDEX IF NOT EXISTS idx_savings_goals_target_date ON savings_goals(target_date);

-- Enable Row Level Security
ALTER TABLE savings_goals ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own savings goals"
  ON savings_goals FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own savings goals"
  ON savings_goals FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own savings goals"
  ON savings_goals FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own savings goals"
  ON savings_goals FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================================================
-- SAVINGS GOAL CONTRIBUTIONS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS savings_goal_contributions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  goal_id UUID NOT NULL REFERENCES savings_goals(id) ON DELETE CASCADE,

  -- Contribution details
  amount NUMERIC NOT NULL,
  contribution_date DATE NOT NULL DEFAULT CURRENT_DATE,

  -- Link to transaction (if contribution was from a transaction)
  transaction_id UUID REFERENCES transactions(id) ON DELETE SET NULL,

  -- Type of contribution
  contribution_type TEXT DEFAULT 'manual', -- manual, automatic, income_allocation

  -- Note
  note TEXT,

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_goal_contributions_user_id ON savings_goal_contributions(user_id);
CREATE INDEX IF NOT EXISTS idx_goal_contributions_goal_id ON savings_goal_contributions(goal_id);
CREATE INDEX IF NOT EXISTS idx_goal_contributions_date ON savings_goal_contributions(contribution_date);

-- Enable RLS
ALTER TABLE savings_goal_contributions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own contributions"
  ON savings_goal_contributions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own contributions"
  ON savings_goal_contributions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own contributions"
  ON savings_goal_contributions FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own contributions"
  ON savings_goal_contributions FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================================================
-- ANALYTICS SNAPSHOTS TABLE (for historical tracking)
-- ============================================================================
CREATE TABLE IF NOT EXISTS analytics_snapshots (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Snapshot date
  snapshot_date DATE NOT NULL,

  -- Financial metrics
  total_income NUMERIC DEFAULT 0,
  total_expenses NUMERIC DEFAULT 0,
  net_worth NUMERIC DEFAULT 0, -- Total account balances - total debts
  total_assets NUMERIC DEFAULT 0, -- Sum of all account balances
  total_liabilities NUMERIC DEFAULT 0, -- Sum of all debt balances
  savings_rate NUMERIC DEFAULT 0, -- Percentage of income saved

  -- Budget metrics
  budget_adherence_score NUMERIC DEFAULT 0, -- 0-100 score
  categories_over_budget INTEGER DEFAULT 0,
  total_categories_tracked INTEGER DEFAULT 0,

  -- Debt metrics
  debt_to_income_ratio NUMERIC DEFAULT 0, -- Percentage
  total_debt_payments NUMERIC DEFAULT 0,

  -- Savings goals metrics
  active_goals_count INTEGER DEFAULT 0,
  total_saved_towards_goals NUMERIC DEFAULT 0,

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_analytics_snapshots_user_id ON analytics_snapshots(user_id);
CREATE INDEX IF NOT EXISTS idx_analytics_snapshots_date ON analytics_snapshots(snapshot_date);
CREATE UNIQUE INDEX IF NOT EXISTS idx_analytics_snapshots_user_date
  ON analytics_snapshots(user_id, snapshot_date);

-- Enable RLS
ALTER TABLE analytics_snapshots ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own analytics snapshots"
  ON analytics_snapshots FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own analytics snapshots"
  ON analytics_snapshots FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own analytics snapshots"
  ON analytics_snapshots FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own analytics snapshots"
  ON analytics_snapshots FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================================================
-- COMMENTS FOR DOCUMENTATION
-- ============================================================================
COMMENT ON TABLE savings_goals IS 'Stores user savings goals with target amounts, dates, and tracking';
COMMENT ON COLUMN savings_goals.priority IS 'Priority level 1-10, higher means more important for recommendations';
COMMENT ON COLUMN savings_goals.auto_allocate IS 'Whether to automatically allocate income to this goal';
COMMENT ON COLUMN savings_goals.allocation_percentage IS 'Percentage of income to allocate (0-100)';

COMMENT ON TABLE savings_goal_contributions IS 'Tracks individual contributions to savings goals';
COMMENT ON COLUMN savings_goal_contributions.contribution_type IS 'Type: manual, automatic, or income_allocation';

COMMENT ON TABLE analytics_snapshots IS 'Historical financial metrics for trend analysis and reporting';
COMMENT ON COLUMN analytics_snapshots.net_worth IS 'Total assets minus total liabilities';
COMMENT ON COLUMN analytics_snapshots.savings_rate IS 'Percentage of income that was saved';
COMMENT ON COLUMN analytics_snapshots.budget_adherence_score IS 'Score 0-100 based on staying within budget limits';
