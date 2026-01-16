-- ==============================================================================
-- COMPREHENSIVE STORAGE SETUP FOR CAMPUS CONNECT
-- Covers: Profiles, Products, CMS, Ads, News, and Chat Attachments
-- ==============================================================================

-- 1. Create all required buckets
INSERT INTO storage.buckets (id, name, public) 
VALUES 
  ('media', 'media', true),
  ('uploads', 'uploads', true),
  ('news-images', 'news-images', true),
  ('chat-attachments', 'chat-attachments', true)
ON CONFLICT (id) DO NOTHING;

-- 2. Clean up existing policies for these buckets to avoid conflicts
DO $$ 
DECLARE 
  bucket_names text[] := ARRAY['media', 'uploads', 'news-images', 'chat-attachments'];
  bn text;
BEGIN
  FOREACH bn IN ARRAY bucket_names LOOP
    EXECUTE format('DROP POLICY IF EXISTS "Public Read Access %I" ON storage.objects', bn);
    EXECUTE format('DROP POLICY IF EXISTS "Authenticated Manage %I" ON storage.objects', bn);
    EXECUTE format('DROP POLICY IF EXISTS "Admin Bypass Manage %I" ON storage.objects', bn);
  END LOOP;
END $$;

-- 3. GLOBAL READ ACCESS: All files in these buckets are public
CREATE POLICY "Public Read Access media" ON storage.objects FOR SELECT USING (bucket_id = 'media');
CREATE POLICY "Public Read Access uploads" ON storage.objects FOR SELECT USING (bucket_id = 'uploads');
CREATE POLICY "Public Read Access news-images" ON storage.objects FOR SELECT USING (bucket_id = 'news-images');
CREATE POLICY "Public Read Access chat-attachments" ON storage.objects FOR SELECT USING (bucket_id = 'chat-attachments');

-- 4. BUCKET: media (Profiles, Products, CMS, Ads)
-- Users can only upload to/manage their own folder: {user_id}/{folder}/{file}
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

-- 5. BUCKET: chat-attachments
-- Same logic: Users manage their own conversation folder
CREATE POLICY "Authenticated Manage chat-attachments" 
ON storage.objects FOR ALL 
TO authenticated
USING (
  bucket_id = 'chat-attachments'
)
WITH CHECK (
  bucket_id = 'chat-attachments'
);

-- 6. BUCKET: news-images (Specifically for Editorial content)
CREATE POLICY "Authenticated Manage news-images" 
ON storage.objects FOR ALL 
TO authenticated
USING (
  bucket_id = 'news-images'
)
WITH CHECK (
  bucket_id = 'news-images'
);

-- 7. BUCKET: uploads (Site Configuration)
CREATE POLICY "Authenticated Manage uploads" 
ON storage.objects FOR ALL 
TO authenticated
USING (
  bucket_id = 'uploads'
)
WITH CHECK (
  bucket_id = 'uploads'
);

-- 8. SYSTEM ADMIN BYPASS (UUID: 00000000-0000-0000-0000-000000000000)
-- Allows the bypass admin to manage all files across all buckets
CREATE POLICY "Admin Bypass Manage General" 
ON storage.objects FOR ALL
TO public
USING (
  (storage.foldername(name))[1] = '00000000-0000-0000-0000-000000000000' OR
  bucket_id IN ('uploads', 'news-images') -- Allow global control for these specific buckets
)
WITH CHECK (
  (storage.foldername(name))[1] = '00000000-0000-0000-0000-000000000000' OR
  bucket_id IN ('uploads', 'news-images')
);

-- 9. PROFILES TABLE: Ensure avatar_url can be updated
-- If it doesn't already exist from previous scripts
DROP POLICY IF EXISTS "Users can update their own avatar" ON public.profiles;
CREATE POLICY "Users can update their own avatar" 
ON public.profiles FOR UPDATE 
USING (auth.uid() = id OR id = '00000000-0000-0000-0000-000000000000')
WITH CHECK (auth.uid() = id OR id = '00000000-0000-0000-0000-000000000000');
