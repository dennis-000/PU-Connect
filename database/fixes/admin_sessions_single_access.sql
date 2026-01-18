-- ==========================================================
-- ADMIN SESSION ENFORCEMENT - SINGLE ACCESS
-- ==========================================================

-- 1. Create session table
CREATE TABLE IF NOT EXISTS public.admin_active_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_key TEXT UNIQUE NOT NULL, -- e.g. 'system_admin'
    last_heartbeat TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    session_token TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Enable RLS
ALTER TABLE public.admin_active_sessions ENABLE ROW LEVEL SECURITY;

-- 3. Policy: Public read session status (needed for login check)
CREATE POLICY "Allow public read sessions" ON public.admin_active_sessions
    FOR SELECT TO public
    USING (true);

-- 4. RPC to CLAIM a session (Login)
CREATE OR REPLACE FUNCTION sys_claim_admin_session(secret_key TEXT, s_token TEXT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    current_session RECORD;
BEGIN
    -- Verify secret (Uses same secret as subscription features)
    IF secret_key != 'pentvars-sys-admin-x892' THEN
        RAISE EXCEPTION 'Access Denied: Invalid Security Key';
    END IF;

    -- Check for active session (heartbeat in last 3 minutes)
    -- We allow a 3 min grace period for timeouts/network drops
    SELECT * INTO current_session 
    FROM public.admin_active_sessions 
    WHERE session_key = 'system_admin' 
    AND last_heartbeat > (NOW() - INTERVAL '3 minutes')
    LIMIT 1;

    -- IF a session exists AND it's not the same token, deny
    IF current_session.id IS NOT NULL AND current_session.session_token != s_token THEN
        RETURN jsonb_build_object(
            'success', false, 
            'message', 'Another administrator is currently active on this system account. Simultaneous access is forbidden.'
        );
    END IF;

    -- Upsert session
    INSERT INTO public.admin_active_sessions (session_key, session_token, last_heartbeat)
    VALUES ('system_admin', s_token, NOW())
    ON CONFLICT (session_key) 
    DO UPDATE SET 
        session_token = s_token, 
        last_heartbeat = NOW(),
        created_at = NOW();

    RETURN jsonb_build_object('success', true);
END;
$$;


-- 5. RPC to PING a session (Heartbeat)
CREATE OR REPLACE FUNCTION sys_ping_admin_session(secret_key TEXT, s_token TEXT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    updated_rows INTEGER;
BEGIN
    IF secret_key != 'pentvars-sys-admin-x892' THEN
        RAISE EXCEPTION 'Access Denied';
    END IF;

    UPDATE public.admin_active_sessions 
    SET last_heartbeat = NOW()
    WHERE session_key = 'system_admin' AND session_token = s_token;
    
    GET DIAGNOSTICS updated_rows = ROW_COUNT;

    IF updated_rows = 0 THEN
        RETURN jsonb_build_object('success', false, 'message', 'Session invalid or taken over.');
    END IF;

    RETURN jsonb_build_object('success', true);
END;
$$;


-- 6. RPC to RELEASE a session (Logout)
CREATE OR REPLACE FUNCTION sys_release_admin_session(secret_key TEXT, s_token TEXT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    IF secret_key != 'pentvars-sys-admin-x892' THEN
        RAISE EXCEPTION 'Access Denied';
    END IF;

    DELETE FROM public.admin_active_sessions 
    WHERE session_key = 'system_admin' AND session_token = s_token;

    RETURN jsonb_build_object('success', true);
END;
$$;
