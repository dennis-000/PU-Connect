-- ==========================================================
-- DEFINITIVE PLATFORM SETTINGS & SUBSCRIPTION FIX
-- ==========================================================

-- 1. Create platform_settings table
CREATE TABLE IF NOT EXISTS public.platform_settings (
    key TEXT PRIMARY KEY,
    value JSONB NOT NULL,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Enable RLS
ALTER TABLE public.platform_settings ENABLE ROW LEVEL SECURITY;

-- 3. Policies for platform_settings
DROP POLICY IF EXISTS "Allow public read access" ON public.platform_settings;
CREATE POLICY "Allow public read access" ON public.platform_settings
    FOR SELECT TO public
    USING (true);

DROP POLICY IF EXISTS "Allow admin full access" ON public.platform_settings;
CREATE POLICY "Allow admin full access" ON public.platform_settings
    FOR ALL TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role IN ('admin', 'super_admin')
        )
    );

-- 4. Insert default settings
INSERT INTO public.platform_settings (key, value, description)
VALUES 
    ('subscriptions_enabled', 'true'::jsonb, 'Check if seller subscriptions are enforced globally')
ON CONFLICT (key) DO NOTHING;


-- 5. RPC for updating platform settings (Global Subscriptions) - Bypass Friendly
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


-- 6. RPC for suspending/updating seller metrics - Bypass Friendly
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
