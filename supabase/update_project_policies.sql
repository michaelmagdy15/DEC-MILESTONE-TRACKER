-- Drop the old policy that only allowed SELECT
DROP POLICY IF EXISTS "Engineers can view projects" ON projects;

-- Create a new policy allowing all authenticated users to insert, update, delete, and select projects
CREATE POLICY "All users can do everything on projects"
ON projects
FOR ALL
USING (true)
WITH CHECK (true);
