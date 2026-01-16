-- Create support_tickets table if it doesn't exist
CREATE TABLE IF NOT EXISTS support_tickets (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  subject TEXT NOT NULL,
  message TEXT NOT NULL,
  status TEXT DEFAULT 'open', -- open, in_progress, closed
  priority TEXT DEFAULT 'medium', -- low, medium, high
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE support_tickets ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "Users can insert own tickets" ON support_tickets;
DROP POLICY IF EXISTS "Users can view own tickets" ON support_tickets;
DROP POLICY IF EXISTS "Admins can view all tickets" ON support_tickets;
DROP POLICY IF EXISTS "Admins can update tickets" ON support_tickets;
DROP POLICY IF EXISTS "Admins can delete tickets" ON support_tickets;
DROP POLICY IF EXISTS "Users create tickets" ON support_tickets;
DROP POLICY IF EXISTS "Users view own tickets" ON support_tickets;
DROP POLICY IF EXISTS "Admins manage tickets" ON support_tickets;

-- 1. Allow authenticated users to insert tickets
CREATE POLICY "Users can insert own tickets"
ON support_tickets
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- 2. Allow users to view their own tickets
CREATE POLICY "Users can view own tickets"
ON support_tickets
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- 3. Allow Admins to view ALL tickets
CREATE POLICY "Admins can view all tickets"
ON support_tickets
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role IN ('admin', 'super_admin')
  )
);

-- 4. Allow Admins to update tickets
CREATE POLICY "Admins can update tickets"
ON support_tickets
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role IN ('admin', 'super_admin')
  )
);

-- 5. Allow Admins to delete tickets
CREATE POLICY "Admins can delete tickets"
ON support_tickets
FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role IN ('admin', 'super_admin')
  )
);
