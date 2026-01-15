-- Fix permissions for approving sellers
-- 1. Check/Fix seller_profiles RLS
ALTER TABLE seller_profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins can insert seller profiles" ON seller_profiles;
DROP POLICY IF EXISTS "Admins can update seller profiles" ON seller_profiles;
DROP POLICY IF EXISTS "Sellers can view own profile" ON seller_profiles;
DROP POLICY IF EXISTS "Sellers can update own profile" ON seller_profiles;

-- Admins can manage all seller profiles
CREATE POLICY "Admins can manage seller profiles"
ON seller_profiles
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role IN ('admin', 'super_admin')
  )
);

-- Individual sellers can view their own profile
CREATE POLICY "Sellers can view own profile"
ON seller_profiles
FOR SELECT
TO authenticated
USING (user_id = auth.uid());

-- Individual sellers can update their own profile
CREATE POLICY "Sellers can update own profile"
ON seller_profiles
FOR UPDATE
TO authenticated
USING (user_id = auth.uid());

-- 2. Ensure Admins can update Profiles (to change role to seller)
DROP POLICY IF EXISTS "Admins can update profiles" ON profiles;

CREATE POLICY "Admins can update profiles"
ON profiles
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role IN ('admin', 'super_admin')
  )
);
