-- COMPREHENSIVE ADMIN PERMISSIONS FIX
-- This script ensures that users with 'admin' or 'super_admin' roles have full access to all data.

-- 1. Profiles Table
DROP POLICY IF EXISTS "Admins can manage all profiles" ON public.profiles;
CREATE POLICY "Admins can manage all profiles" ON public.profiles
    FOR ALL TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles p
            WHERE p.id = auth.uid()
            AND p.role IN ('admin', 'super_admin')
        )
    );

-- 2. Seller Applications
DROP POLICY IF EXISTS "Admins can manage seller applications" ON public.seller_applications;
CREATE POLICY "Admins can manage seller applications" ON public.seller_applications
    FOR ALL TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles p
            WHERE p.id = auth.uid()
            AND p.role IN ('admin', 'super_admin')
        )
    );

-- 3. Activity Logs
DROP POLICY IF EXISTS "Admins can manage activity logs" ON public.activity_logs;
CREATE POLICY "Admins can manage activity logs" ON public.activity_logs
    FOR ALL TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles p
            WHERE p.id = auth.uid()
            AND p.role IN ('admin', 'super_admin')
        )
    );

-- 4. Support Tickets
DROP POLICY IF EXISTS "Admins can manage support tickets" ON public.support_tickets;
CREATE POLICY "Admins can manage support tickets" ON public.support_tickets
    FOR ALL TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles p
            WHERE p.id = auth.uid()
            AND p.role IN ('admin', 'super_admin', 'support_agent')
        )
    );

-- 5. Scheduled SMS
DROP POLICY IF EXISTS "Admins manage scheduled sms" ON public.scheduled_sms;
CREATE POLICY "Admins manage scheduled sms" ON public.scheduled_sms
    FOR ALL TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles p
            WHERE p.id = auth.uid()
            AND p.role IN ('admin', 'super_admin')
        )
    );

-- 6. SMS Topups
DROP POLICY IF EXISTS "Admins manage sms topups" ON public.sms_topups;
CREATE POLICY "Admins manage sms topups" ON public.sms_topups
    FOR ALL TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles p
            WHERE p.id = auth.uid()
            AND p.role IN ('admin', 'super_admin')
        )
    );

-- 7. Marketplace Products (Admins can moderate)
DROP POLICY IF EXISTS "Admins can manage all products" ON public.products;
CREATE POLICY "Admins can manage all products" ON public.products
    FOR ALL TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles p
            WHERE p.id = auth.uid()
            AND p.role IN ('admin', 'super_admin')
        )
    );

-- 8. Subscription Payments
DROP POLICY IF EXISTS "Admins can view all payments" ON public.subscription_payments;
CREATE POLICY "Admins can view all payments" ON public.subscription_payments
    FOR ALL TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles p
            WHERE p.id = auth.uid()
            AND p.role IN ('admin', 'super_admin')
        )
    );

-- 9. Seller Profiles
DROP POLICY IF EXISTS "Admins can manage seller profiles" ON public.seller_profiles;
CREATE POLICY "Admins can manage seller profiles" ON public.seller_profiles
    FOR ALL TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles p
            WHERE p.id = auth.uid()
            AND p.role IN ('admin', 'super_admin')
        )
    );

-- 10. Polls system
DROP POLICY IF EXISTS "Admins manage polls" ON public.polls;
CREATE POLICY "Admins manage polls" ON public.polls
    FOR ALL TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles p
            WHERE p.id = auth.uid()
            AND p.role IN ('admin', 'super_admin')
        )
    );

DROP POLICY IF EXISTS "Admins manage options" ON public.poll_options;
CREATE POLICY "Admins manage options" ON public.poll_options
    FOR ALL TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles p
            WHERE p.id = auth.uid()
            AND p.role IN ('admin', 'super_admin')
        )
    );

-- Grant usage on schemas just in case
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO authenticated;
