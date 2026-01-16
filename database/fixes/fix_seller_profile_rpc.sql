-- Fix the admin_upsert_seller_profile function to handle business_category
CREATE OR REPLACE FUNCTION admin_upsert_seller_profile(
  target_user_id UUID, 
  initial_name TEXT, 
  category TEXT,
  secret_key TEXT
) 
RETURNS VOID 
LANGUAGE plpgsql 
SECURITY DEFINER 
AS $$
DECLARE
  current_system_pass TEXT;
BEGIN
  -- Get the system password from settings
  SELECT system_default_password INTO current_system_pass FROM website_settings LIMIT 1;
  IF current_system_pass IS NULL THEN current_system_pass := 'pukonnect@!'; END IF;

  -- Verify Secret
  IF secret_key != current_system_pass THEN
    RAISE EXCEPTION 'Unauthorized: Invalid System Secret';
  END IF;

  -- Perform Upsert (SECURITY DEFINER bypasses RLS)
  INSERT INTO seller_profiles (user_id, business_name, business_category, created_at)
  VALUES (target_user_id, initial_name, COALESCE(category, 'General'), now())
  ON CONFLICT (user_id) DO UPDATE 
  SET 
    business_name = EXCLUDED.business_name,
    business_category = EXCLUDED.business_category,
    updated_at = now();
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION admin_upsert_seller_profile(UUID, TEXT, TEXT, TEXT) TO anon, authenticated, service_role;

-- Ensure campus_news has sms_sent column
ALTER TABLE campus_news ADD COLUMN IF NOT EXISTS sms_sent BOOLEAN DEFAULT FALSE;

