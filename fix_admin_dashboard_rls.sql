-- Comprehensive RLS fix for Admin Dashboard
-- Run this to ensure admins have full access to manage roles and applications

-- Helper function if not exists
CREATE OR REPLACE FUNCTION public.auth_uid_text()
RETURNS TEXT AS $$
  SELECT COALESCE(auth.uid()::text, '');
$$ LANGUAGE sql STABLE;

-- Ensure is_admin helper exists and is correct
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = public.auth_uid_text()
    AND (role = 'admin' OR role = 'super_admin')
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 1. FIX PROFILES RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins can manage all profiles" ON public.profiles;
CREATE POLICY "Admins can manage all profiles" ON public.profiles
  FOR ALL TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON public.profiles;
CREATE POLICY "Public profiles are viewable by everyone" ON public.profiles
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE USING (id = public.auth_uid_text());


-- 2. FIX SELLER APPLICATIONS RLS
ALTER TABLE public.seller_applications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins can manage all applications" ON public.seller_applications;
CREATE POLICY "Admins can manage all applications" ON public.seller_applications
  FOR ALL TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "Users can view own applications" ON public.seller_applications;
CREATE POLICY "Users can view own applications" ON public.seller_applications
  FOR SELECT USING (user_id = public.auth_uid_text());

DROP POLICY IF EXISTS "Users can insert own applications" ON public.seller_applications;
CREATE POLICY "Users can insert own applications" ON public.seller_applications
  FOR INSERT WITH CHECK (user_id = public.auth_uid_text());

-- 3. FIX SELLER PROFILES RLS
ALTER TABLE public.seller_profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins can manage all seller profiles" ON public.seller_profiles;
CREATE POLICY "Admins can manage all seller profiles" ON public.seller_profiles
  FOR ALL TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "Seller profiles are viewable by everyone" ON public.seller_profiles;
CREATE POLICY "Seller profiles are viewable by everyone" ON public.seller_profiles
  FOR SELECT USING (true);
