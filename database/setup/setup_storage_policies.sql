-- ==============================================================================
-- STORAGE SETUP FOR MEDIA (PROFILE IMAGES, PRODUCTS, ETC)
-- ==============================================================================

-- 1. Ensure the 'media' bucket exists and is public
INSERT INTO storage.buckets (id, name, public) 
VALUES ('media', 'media', true)
ON CONFLICT (id) DO NOTHING;

-- 2. Remove existing policies to avoid conflicts during re-run
DROP POLICY IF EXISTS "Public Read Access" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated Upload" ON storage.objects;
DROP POLICY IF EXISTS "Users Update Own Files" ON storage.objects;
DROP POLICY IF EXISTS "Users Delete Own Files" ON storage.objects;
DROP POLICY IF EXISTS "System Admin Bypass Upload" ON storage.objects;

-- 3. Policy: Public Read Access
CREATE POLICY "Public Read Access" 
ON storage.objects FOR SELECT 
USING (bucket_id = 'media');

-- 4. Policy: Authenticated users can upload to their own folder
-- Path format: {user_id}/{folder}/{filename}
CREATE POLICY "Authenticated Upload" 
ON storage.objects FOR INSERT 
TO authenticated
WITH CHECK (
  bucket_id = 'media' AND 
  (storage.foldername(name))[1] = auth.uid()::text
);

-- 5. Policy: Users can update their own files
CREATE POLICY "Users Update Own Files" 
ON storage.objects FOR UPDATE 
TO authenticated
USING (
  bucket_id = 'media' AND 
  (storage.foldername(name))[1] = auth.uid()::text
);

-- 6. Policy: Users can delete their own files
CREATE POLICY "Users Delete Own Files" 
ON storage.objects FOR DELETE 
TO authenticated
USING (
  bucket_id = 'media' AND 
  (storage.foldername(name))[1] = auth.uid()::text
);

-- 7. Policy: System Admin Bypass (UUID: 00000000-0000-0000-0000-000000000000)
-- This allows the bypass admin to upload and manage files in their folder
CREATE POLICY "System Admin Bypass Manage" 
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

-- 8. Ensure Profiles table allows avatar updates
-- Note: 'public' role is used for some operations, but 'authenticated' is preferred.
CREATE POLICY "Users can update their own avatar url" 
ON public.profiles FOR UPDATE 
USING (auth.uid() = id OR id = '00000000-0000-0000-0000-000000000000')
WITH CHECK (auth.uid() = id OR id = '00000000-0000-0000-0000-000000000000');
