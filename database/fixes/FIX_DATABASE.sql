-- ==============================================================================
-- DATABASE FIX SCRIPT: Role Constraints and RLS Policies
-- ==============================================================================

-- 1. FIX PROFILE ROLE CONSTRAINT
-- This ensures 'publisher_seller' is a valid role
ALTER TABLE public.profiles 
DROP CONSTRAINT IF EXISTS profiles_role_check;

ALTER TABLE public.profiles 
ADD CONSTRAINT profiles_role_check 
CHECK (role IN ('buyer', 'seller', 'admin', 'news_publisher', 'super_admin', 'publisher_seller'));

-- 2. FIX PROFILE UPDATE POLICY FOR SYSTEM ADMIN
-- Ensures the bypass admin can update their own profile (avatar_url, etc.)
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile" 
ON public.profiles FOR UPDATE 
USING (
    auth.uid() = id OR 
    (id = '00000000-0000-0000-0000-000000000000'::uuid)
);

DROP POLICY IF EXISTS "Users can update their own avatar" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own avatar url" ON public.profiles;

-- 3. FIX STORAGE POLICIES FOR SYSTEM ADMIN
-- Ensures the Nil UUID has proper permissions even if auth.uid() is null
DO $$ 
BEGIN
    -- Delete existing bypass policies to re-apply
    DROP POLICY IF EXISTS "Admin Bypass Manage General" ON storage.objects;
    DROP POLICY IF EXISTS "System Admin Bypass Manage" ON storage.objects;
    DROP POLICY IF EXISTS "System Admin Bypass Upload" ON storage.objects;
END $$;

-- This policy allows anyone (including bypass admin) to manage files in the special Nil UUID folder
CREATE POLICY "System Admin Bypass Manage Media" 
ON storage.objects FOR ALL
TO public
USING (
  bucket_id = 'media' AND 
  (storage.foldername(name))[1] = '00000000-0000-0000-0000-000000000000'
)
WITH CHECK (
  bucket_id = 'media' AND 
  (storage.foldername(name))[1] = '00000000-0000-0000-0000-000000000000'
);

-- Allow admins to manage all media
CREATE POLICY "Admins manage all media" 
ON storage.objects FOR ALL
TO authenticated
USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'super_admin'))
);

-- Ensure authenticated users can still manage their own folders
DROP POLICY IF EXISTS "Authenticated Manage media" ON storage.objects;
CREATE POLICY "Authenticated Manage media" 
ON storage.objects FOR ALL 
TO authenticated
USING (
  bucket_id = 'media' AND 
  (storage.foldername(name))[1] = auth.uid()::text
)
WITH CHECK (
  bucket_id = 'media' AND 
  (storage.foldername(name))[1] = auth.uid()::text
);

-- 4. FIX SELLER APPLICATIONS POLICY
-- Ensure admins (even bypass) can view/update applications
DROP POLICY IF EXISTS "Admins manage applications" ON seller_applications;
CREATE POLICY "Admins manage applications" ON seller_applications FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'super_admin')) OR
  auth.uid() = '00000000-0000-0000-0000-000000000000'::uuid OR
  (SELECT role FROM profiles WHERE id = '00000000-0000-0000-0000-000000000000'::uuid) IS NOT NULL -- Fallback for bypass
);

-- 5. REFRESH SCHEMAS
ANALYZE profiles;
ANALYZE seller_applications;
