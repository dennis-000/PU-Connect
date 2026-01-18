-- RPC for fetching profiles in System Admin Bypass mode
-- Bypasses RLS to allow system administrator to manage users even without a Supabase session

CREATE OR REPLACE FUNCTION admin_get_profiles(
  secret_key TEXT, 
  p_limit INT, 
  p_offset INT,
  p_search TEXT DEFAULT '',
  p_role TEXT DEFAULT 'all'
)
RETURNS SETOF profiles AS $$
DECLARE
  current_system_pass TEXT;
BEGIN
  -- Get the system password
  SELECT system_default_password INTO current_system_pass FROM website_settings LIMIT 1;
  IF current_system_pass IS NULL THEN current_system_pass := 'pukonnect@!'; END IF;

  -- Verify Secret
  IF secret_key != current_system_pass THEN
    RAISE EXCEPTION 'Unauthorized: Invalid System Secret';
  END IF;

  -- Return Query bypasses RLS because it's SECURITY DEFINER
  RETURN QUERY 
  SELECT * FROM profiles 
  WHERE 
    (p_role = 'all' OR role = p_role) AND
    (p_search = '' OR 
     full_name ILIKE '%' || p_search || '%' OR 
     email ILIKE '%' || p_search || '%' OR 
     student_id ILIKE '%' || p_search || '%')
  ORDER BY created_at DESC 
  LIMIT p_limit OFFSET p_offset;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION admin_get_profiles_count(
  secret_key TEXT,
  p_search TEXT DEFAULT '',
  p_role TEXT DEFAULT 'all'
)
RETURNS INT AS $$
DECLARE
  current_system_pass TEXT;
  v_count INT;
BEGIN
  SELECT system_default_password INTO current_system_pass FROM website_settings LIMIT 1;
  IF current_system_pass IS NULL THEN current_system_pass := 'pukonnect@!'; END IF;

  IF secret_key != current_system_pass THEN
    RAISE EXCEPTION 'Unauthorized: Invalid System Secret';
  END IF;

  SELECT count(*) INTO v_count FROM profiles
  WHERE 
    (p_role = 'all' OR role = p_role) AND
    (p_search = '' OR 
     full_name ILIKE '%' || p_search || '%' OR 
     email ILIKE '%' || p_search || '%' OR 
     student_id ILIKE '%' || p_search || '%');
    
  RETURN v_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant access
GRANT EXECUTE ON FUNCTION admin_get_profiles(TEXT, INT, INT, TEXT, TEXT) TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION admin_get_profiles_count(TEXT, TEXT, TEXT) TO anon, authenticated, service_role;
