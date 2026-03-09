-- 1. Add order_index and google_drive_link to projects table
ALTER TABLE projects ADD COLUMN IF NOT EXISTS order_index INTEGER DEFAULT 0;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS google_drive_link TEXT;

-- 2. Create project_phases table
CREATE TABLE IF NOT EXISTS project_phases (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    order_index INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. Enable RLS on project_phases
ALTER TABLE project_phases ENABLE ROW LEVEL SECURITY;

-- 4. Create policies for project_phases
CREATE POLICY "Enable read access for all users" ON project_phases FOR SELECT USING (true);
CREATE POLICY "Enable insert access for all users" ON project_phases FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable update access for all users" ON project_phases FOR UPDATE USING (true);
CREATE POLICY "Enable delete access for all users" ON project_phases FOR DELETE USING (true);

-- 5. Insert default phases if empty
INSERT INTO project_phases (name, order_index)
SELECT 'Planning', 0
WHERE NOT EXISTS (SELECT 1 FROM project_phases);

INSERT INTO project_phases (name, order_index)
SELECT 'Design', 1
WHERE NOT EXISTS (SELECT 1 FROM project_phases WHERE name = 'Design');

INSERT INTO project_phases (name, order_index)
SELECT 'Construction', 2
WHERE NOT EXISTS (SELECT 1 FROM project_phases WHERE name = 'Construction');

INSERT INTO project_phases (name, order_index)
SELECT 'Post-Construction', 3
WHERE NOT EXISTS (SELECT 1 FROM project_phases WHERE name = 'Post-Construction');

INSERT INTO project_phases (name, order_index)
SELECT 'Completed', 4
WHERE NOT EXISTS (SELECT 1 FROM project_phases WHERE name = 'Completed');
