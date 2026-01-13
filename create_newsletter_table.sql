-- Create Newsletter Subscriptions Table
CREATE TABLE public.newsletter_subscriptions (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS
ALTER TABLE public.newsletter_subscriptions ENABLE ROW LEVEL SECURITY;

-- Policies
-- 1. Public can insert (subscribe)
CREATE POLICY "Public can subscribe to newsletter"
ON public.newsletter_subscriptions FOR INSERT
WITH CHECK (true);

-- 2. Admins can view all
CREATE POLICY "Admins can view newsletter subscriptions"
ON public.newsletter_subscriptions FOR SELECT
USING (public.is_admin());

-- 3. Admins can delete
CREATE POLICY "Admins can delete newsletter subscriptions"
ON public.newsletter_subscriptions FOR DELETE
USING (public.is_admin());
