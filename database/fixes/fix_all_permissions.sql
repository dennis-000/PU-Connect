-- FIX 1: Seller Profile Permissions (Fixed for "Policy Already Exists")
ALTER TABLE seller_profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins can manage seller profiles" ON seller_profiles;
DROP POLICY IF EXISTS "Sellers can view own profile" ON seller_profiles;
DROP POLICY IF EXISTS "Sellers can update own profile" ON seller_profiles;
DROP POLICY IF EXISTS "Admins can insert seller profiles" ON seller_profiles;
DROP POLICY IF EXISTS "Admins can update seller profiles" ON seller_profiles;

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

-- FIX 2: Profile Permissions (For changing roles)
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

-- FIX 3: Product Permissions (Allow Admins to see & manage ALL products)
ALTER TABLE products ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins can manage all products" ON products;
DROP POLICY IF EXISTS "Anyone can view active products" ON products;
DROP POLICY IF EXISTS "Sellers can manage own products" ON products;

-- 1. Admins have FULL access (ALL)
CREATE POLICY "Admins can manage all products"
ON products
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role IN ('admin', 'super_admin')
  )
);

-- 2. Public/Users can view ACTIVE products
CREATE POLICY "Anyone can view active products"
ON products
FOR SELECT
USING (is_active = true);

-- 3. Sellers can manage their OWN products
CREATE POLICY "Sellers can manage own products"
ON products
FOR ALL
TO authenticated
USING (seller_id = auth.uid());
