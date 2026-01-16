-- FORCE DELETE USER SCRIPT (Run this in Supabase SQL Editor)
-- This script bypasses constraint issues by deleting all related data first.

DO $$
DECLARE
    target_uid UUID := '996f212b-dd58-4862-aecf-8ccf728398d2';
    target_uid_text TEXT := '996f212b-dd58-4862-aecf-8ccf728398d2';
BEGIN
    -- 1. Delete from tables that might block profile/auth deletion
    DELETE FROM public.poll_votes WHERE user_id = target_uid_text;
    DELETE FROM public.poll_options WHERE poll_id IN (SELECT id FROM public.polls WHERE created_by = target_uid_text);
    DELETE FROM public.polls WHERE created_by = target_uid_text;
    
    DELETE FROM public.support_tickets WHERE user_id = target_uid_text;
    DELETE FROM public.scheduled_sms WHERE created_by = target_uid_text;
    DELETE FROM public.activity_logs WHERE user_id = target_uid_text;
    DELETE FROM public.notifications WHERE user_id = target_uid_text;
    DELETE FROM public.saved_items WHERE user_id = target_uid_text;
    DELETE FROM public.advertisements WHERE created_by = target_uid_text;
    
    DELETE FROM public.messages WHERE sender_id = target_uid_text OR receiver_id = target_uid_text;
    DELETE FROM public.campus_news WHERE author_id = target_uid_text;
    
    DELETE FROM public.seller_profiles WHERE user_id = target_uid_text;
    DELETE FROM public.seller_applications WHERE user_id = target_uid_text;
    DELETE FROM public.products WHERE seller_id = target_uid_text;
    
    -- 2. Delete the profile
    DELETE FROM public.profiles WHERE id = target_uid_text;
    
    -- 3. Delete from Auth (This will effectively remove them from the system)
    DELETE FROM auth.users WHERE id = target_uid;

    RAISE NOTICE 'User % and all related data have been force deleted.', target_uid;
END $$;
