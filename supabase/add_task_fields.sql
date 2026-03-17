-- Add new fields to tasks table
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS duration INTEGER;
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS dependencies UUID[] DEFAULT '{}';
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS progress INTEGER DEFAULT 0 CHECK (progress >= 0 AND progress <= 100);

-- Update the status check constraint to support the 6 new workflows
-- First, drop the old constraint if it exists (assuming it was named tasks_status_check)
-- Note: You might need to adjust the constraint name based on your exact Supabase schema
ALTER TABLE tasks DROP CONSTRAINT IF EXISTS tasks_status_check;

-- Add the new constraint
ALTER TABLE tasks ADD CONSTRAINT tasks_status_check 
CHECK (status IN ('not_started', 'in_progress', 'under_review', 'client_approved', 'authority_approved', 'completed'));

-- Update existing rows to map to the new statuses
UPDATE tasks SET status = 'not_started' WHERE status = 'todo';
UPDATE tasks SET status = 'completed' WHERE status = 'done';
