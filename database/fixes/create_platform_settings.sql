-- Create platform_settings table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.platform_settings (
    key TEXT PRIMARY KEY,
    value JSONB NOT NULL,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.platform_settings ENABLE ROW LEVEL SECURITY;

-- Allow read access to everyone (public settings)
CREATE POLICY "Allow public read access" ON public.platform_settings
    FOR SELECT TO public
    USING (true);

-- Allow full access to admins/super_admins
CREATE POLICY "Allow admin full access" ON public.platform_settings
    FOR ALL TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role IN ('admin', 'super_admin')
        )
    );

-- Insert default settings
INSERT INTO public.platform_settings (key, value, description)
VALUES 
    ('subscriptions_enabled', 'true'::jsonb, 'Check if seller subscriptions are enforced globally')
ON CONFLICT (key) DO NOTHING;
