-- Add icon and color customization to categories
-- This migration enables users to customize category appearance with:
-- 1. Custom icons (from lucide-react icon library)
-- 2. Custom colors (hex color codes)

-- Add icon column (default to 'Tag' for backward compatibility)
ALTER TABLE categories
ADD COLUMN IF NOT EXISTS icon TEXT DEFAULT 'Tag';

-- Add color column (default to blue #3b82f6 for backward compatibility)
ALTER TABLE categories
ADD COLUMN IF NOT EXISTS color TEXT DEFAULT '#3b82f6';

-- Add comments for documentation
COMMENT ON COLUMN categories.icon IS 'Lucide-react icon name for visual identification';
COMMENT ON COLUMN categories.color IS 'Hex color code for category display';

-- Update existing categories to have default values if they are NULL
UPDATE categories
SET icon = 'Tag'
WHERE icon IS NULL;

UPDATE categories
SET color = '#3b82f6'
WHERE color IS NULL;
