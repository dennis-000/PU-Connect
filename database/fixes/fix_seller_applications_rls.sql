-- Fix RLS policies for seller_applications table
-- This allows admins to view all seller applications

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Admins can view all seller applications" ON seller_applications;
DROP POLICY IF EXISTS "Admins can update seller applications" ON seller_applications;
DROP POLICY IF EXISTS "Users can view their own seller applications" ON seller_applications;
DROP POLICY IF EXISTS "Users can insert their own seller applications" ON seller_applications;

-- Enable RLS on seller_applications
ALTER TABLE seller_applications ENABLE ROW LEVEL SECURITY;

-- Policy 1: Admins can view ALL seller applications
CREATE POLICY "Admins can view all seller applications"
ON seller_applications
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role IN ('admin', 'super_admin')
  )
);

-- Policy 2: Admins can update ALL seller applications
CREATE POLICY "Admins can update seller applications"
ON seller_applications
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role IN ('admin', 'super_admin')
  )
);

-- Policy 3: Users can view their OWN seller applications
CREATE POLICY "Users can view own seller applications"
ON seller_applications
FOR SELECT
TO authenticated
USING (user_id = auth.uid());

-- Policy 4: Users can insert their OWN seller applications
CREATE POLICY "Users can insert own seller applications"
ON seller_applications
FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());

-- Policy 5: Users can update their OWN seller applications (only if pending)
CREATE POLICY "Users can update own pending applications"
ON seller_applications
FOR UPDATE
TO authenticated
USING (user_id = auth.uid() AND status = 'pending')
WITH CHECK (user_id = auth.uid() AND status = 'pending');

-- Verify the policies
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
FROM pg_policies
WHERE tablename = 'seller_applications';
