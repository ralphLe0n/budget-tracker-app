-- Create category_rules table for auto-categorization
CREATE TABLE IF NOT EXISTS category_rules (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  category TEXT NOT NULL,
  pattern TEXT NOT NULL,
  is_regex BOOLEAN DEFAULT false,
  case_sensitive BOOLEAN DEFAULT false,
  priority INTEGER DEFAULT 999,
  enabled BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add index for faster queries
CREATE INDEX IF NOT EXISTS idx_category_rules_user_id ON category_rules(user_id);
CREATE INDEX IF NOT EXISTS idx_category_rules_category ON category_rules(category);
CREATE INDEX IF NOT EXISTS idx_category_rules_priority ON category_rules(priority);

-- Enable Row Level Security
ALTER TABLE category_rules ENABLE ROW LEVEL SECURITY;

-- Create policy for users to manage their own rules
CREATE POLICY "Users can view their own category rules"
  ON category_rules FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own category rules"
  ON category_rules FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own category rules"
  ON category_rules FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own category rules"
  ON category_rules FOR DELETE
  USING (auth.uid() = user_id);

-- Add trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_category_rules_updated_at
  BEFORE UPDATE ON category_rules
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
