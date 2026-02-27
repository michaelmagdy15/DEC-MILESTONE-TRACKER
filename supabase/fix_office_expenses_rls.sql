-- Drop existing specific policies
DROP POLICY IF EXISTS "Admins can view all office expenses" ON public.office_expenses;
DROP POLICY IF EXISTS "Admins can insert office expenses" ON public.office_expenses;
DROP POLICY IF EXISTS "Admins can update office expenses" ON public.office_expenses;
DROP POLICY IF EXISTS "Admins can delete office expenses" ON public.office_expenses;

-- Drop the comprehensive one if it was already created during previous attempts
DROP POLICY IF EXISTS "Admins can do everything on office_expenses" ON public.office_expenses;

-- Create a single comprehensive admin policy bypassing the is_admin() function
CREATE POLICY "Admins can do everything on office_expenses"
ON public.office_expenses FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.engineers
    WHERE engineers.id = auth.uid() AND engineers.role = 'admin'
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.engineers
    WHERE engineers.id = auth.uid() AND engineers.role = 'admin'
  )
);
