-- RPC for updating platform settings (Global Subscriptions) - Bypass Friendly
CREATE OR REPLACE FUNCTION sys_update_platform_setting(secret_key TEXT, setting_key TEXT, setting_value JSONB)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  IF secret_key = 'pentvars-sys-admin-x892' THEN
    INSERT INTO public.platform_settings (key, value)
    VALUES (setting_key, setting_value)
    ON CONFLICT (key) DO UPDATE SET value = setting_value, updated_at = NOW();
    
    RETURN jsonb_build_object('success', true);
  ELSE
    RAISE EXCEPTION 'Access Denied: Invalid Security Key';
  END IF;
END;
$$;

-- RPC for suspending/updating seller metrics - Bypass Friendly
CREATE OR REPLACE FUNCTION sys_manage_seller_subscription(secret_key TEXT, target_user_id UUID, new_status TEXT, start_date TIMESTAMP WITH TIME ZONE DEFAULT NULL, end_date TIMESTAMP WITH TIME ZONE DEFAULT NULL)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  IF secret_key = 'pentvars-sys-admin-x892' THEN
    UPDATE public.seller_profiles
    SET 
        subscription_status = new_status,
        subscription_start_date = COALESCE(start_date, subscription_start_date),
        subscription_end_date = COALESCE(end_date, subscription_end_date),
        updated_at = NOW()
    WHERE user_id = target_user_id;
    
    RETURN jsonb_build_object('success', true);
  ELSE
    RAISE EXCEPTION 'Access Denied: Invalid Security Key';
  END IF;
END;
$$;
