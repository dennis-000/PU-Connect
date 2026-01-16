-- Create SMS Topups Table
CREATE TABLE IF NOT EXISTS public.sms_topups (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    amount DECIMAL(10,2) NOT NULL,
    units INTEGER NOT NULL,
    payment_reference TEXT UNIQUE NOT NULL,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'success', 'failed')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS
ALTER TABLE public.sms_topups ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Admins can view all SMS topups" ON public.sms_topups
    FOR SELECT TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role IN ('admin', 'super_admin')
        )
    );

CREATE POLICY "Users can create their own topups" ON public.sms_topups
    FOR INSERT TO authenticated
    WITH CHECK (auth.uid() = user_id);
