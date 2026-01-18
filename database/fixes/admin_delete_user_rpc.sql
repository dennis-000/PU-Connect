-- RPC to allow Admins to Delete Users (Cascading to Auth)
-- This replaces the fragile Edge Function dependency.

CREATE OR REPLACE FUNCTION admin_delete_user(target_user_id UUID, secret_key TEXT DEFAULT NULL)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    requestor_role TEXT;
    is_bypass BOOLEAN := FALSE;
BEGIN
    -- 1. Check for Bypass Key (Matches the one in UserManagement.tsx and other RPCs)
    IF secret_key IS NOT NULL AND secret_key = 'sk_admin_bypass_778899' THEN
        is_bypass := TRUE;
    END IF;

    -- 2. Verify Permissions (if not using secret key)
    IF NOT is_bypass THEN
        SELECT role INTO requestor_role
        FROM public.profiles
        WHERE id = auth.uid();

        IF requestor_role IS NULL OR requestor_role NOT IN ('admin', 'super_admin') THEN
            RETURN jsonb_build_object('success', false, 'error', 'Unauthorized: Only Admins can delete users.');
        END IF;
    END IF;

    -- 3. Perform Deletion
    BEGIN
        -- Cascading Deletes (Manual cleanup to ensure data integrity)
        -- We use dynamic SQL or just straightforward deletes. 
        -- Wrapped in individual blocks or just one big block.
        
        -- Cascading Deletes (Manual cleanup) with safety checks for non-existent tables
        
        -- Core Tables (Expected to exist)
        DELETE FROM public.poll_votes WHERE user_id = target_user_id;
        DELETE FROM public.poll_options WHERE poll_id IN (SELECT id FROM public.polls WHERE created_by = target_user_id);
        DELETE FROM public.polls WHERE created_by = target_user_id;
        DELETE FROM public.support_tickets WHERE user_id = target_user_id;
        DELETE FROM public.activity_logs WHERE user_id = target_user_id;
        DELETE FROM public.notifications WHERE user_id = target_user_id;
        DELETE FROM public.saved_items WHERE user_id = target_user_id;
        DELETE FROM public.messages WHERE sender_id = target_user_id OR receiver_id = target_user_id;
        DELETE FROM public.campus_news WHERE author_id = target_user_id;
        DELETE FROM public.products WHERE seller_id = target_user_id;
        DELETE FROM public.seller_profiles WHERE user_id = target_user_id;
        DELETE FROM public.seller_applications WHERE user_id = target_user_id;
        
        -- Optional Tables (Check recursively or ignore errors)
        BEGIN
            DELETE FROM public.scheduled_sms WHERE created_by = target_user_id;
        EXCEPTION WHEN undefined_table THEN NULL; END;
        
        BEGIN
            DELETE FROM public.internships WHERE user_id = target_user_id;
        EXCEPTION WHEN undefined_table THEN NULL; END;
        
        BEGIN
             DELETE FROM public.advertisements WHERE created_by = target_user_id;
        EXCEPTION WHEN undefined_table THEN NULL; END;
        
        -- Delete Profile (Public)
        DELETE FROM public.profiles WHERE id = target_user_id;
        
        -- Delete Auth User (Protected System Table)
        DELETE FROM auth.users WHERE id = target_user_id;
        
        RETURN jsonb_build_object('success', true, 'message', 'User deleted successfully.');
        
    EXCEPTION WHEN OTHERS THEN
        RETURN jsonb_build_object('success', false, 'error', SQLERRM);
    END;
END;
$$;
