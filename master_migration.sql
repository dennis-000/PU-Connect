-- MASTER MIGRATION SCRIPT
-- This script aggregates all necessary changes:
-- 1. Fixes User IDs to support 'sys_admin_001' (TEXT instead of UUID)
-- 2. Creates missing tables (Support Tickets, Polls, Scheduled SMS)
-- 3. Adds missing columns (business_logo)
-- 4. Updates RLS policies

-- ==============================================
-- 1. UTILITY FUNCTION FOR SAFE AUTH
-- ==============================================
create or replace function auth_uid_text() returns text as $$
  select nullif(current_setting('request.jwt.claim.sub', true), '');
$$ language sql stable;

-- ==============================================
-- 2. CREATE MISSING TABLES
-- ==============================================

-- Support Tickets
create table if not exists support_tickets (
  id uuid default gen_random_uuid() primary key,
  user_id text, -- Changed from UUID
  subject text not null,
  message text not null,
  status text default 'open' check (status in ('open', 'in_progress', 'resolved', 'closed')),
  priority text default 'medium' check (priority in ('low', 'medium', 'high', 'urgent')),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Polls
create table if not exists polls (
  id uuid default gen_random_uuid() primary key,
  question text not null,
  is_active boolean default true,
  created_by text, -- Changed from UUID
  expires_at timestamp with time zone,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Poll Options
create table if not exists poll_options (
  id uuid default gen_random_uuid() primary key,
  poll_id uuid references polls(id) on delete cascade,
  option_text text not null,
  votes_count integer default 0
);

-- Poll Votes (if not exists)
create table if not exists poll_votes (
  id uuid default gen_random_uuid() primary key,
  poll_id uuid references polls(id) on delete cascade,
  option_id uuid references poll_options(id) on delete cascade,
  user_id text,
  created_at timestamp with time zone default timezone('utc'::text, now())
);

-- Scheduled SMS
create table if not exists scheduled_sms (
  id uuid default gen_random_uuid() primary key,
  recipients text[] not null,
  message text not null,
  scheduled_at timestamp with time zone not null,
  status text default 'pending',
  created_by text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- ==============================================
-- 3. FIX UUID COLUMNS IN EXISTING TABLES
-- ==============================================

do $$
begin
    -- Advertisements
    if exists (select 1 from information_schema.columns where table_name = 'advertisements' and column_name = 'created_by' and data_type = 'uuid') then
        alter table advertisements drop constraint if exists advertisements_created_by_fkey;
        alter table advertisements alter column created_by type text;
    end if;

    -- Notifications
    if exists (select 1 from information_schema.columns where table_name = 'notifications' and column_name = 'user_id' and data_type = 'uuid') then
        alter table notifications drop constraint if exists notifications_user_id_fkey;
        alter table notifications alter column user_id type text;
    end if;

    -- Saved Items
    if exists (select 1 from information_schema.columns where table_name = 'saved_items' and column_name = 'user_id' and data_type = 'uuid') then
        alter table saved_items drop constraint if exists saved_items_user_id_fkey;
        alter table saved_items alter column user_id type text;
    end if;

    -- Activity Logs
    if exists (select 1 from information_schema.columns where table_name = 'activity_logs' and column_name = 'user_id' and data_type = 'uuid') then
        alter table activity_logs drop constraint if exists activity_logs_user_id_fkey;
        alter table activity_logs alter column user_id type text;
    end if;
end $$;

-- Enable RLS
alter table support_tickets enable row level security;
alter table polls enable row level security;
alter table poll_options enable row level security;
alter table poll_votes enable row level security;
alter table scheduled_sms enable row level security;

-- ==============================================
-- 4. RLS POLICIES
-- ==============================================

-- Support Tickets Policies
drop policy if exists "Admins can view all tickets" on support_tickets;
create policy "Admins can view all tickets" on support_tickets for select
  using ( exists (select 1 from profiles where id = auth_uid_text() and role in ('admin', 'super_admin')) );

drop policy if exists "Admins can update tickets" on support_tickets;
create policy "Admins can update tickets" on support_tickets for update
  using ( exists (select 1 from profiles where id = auth_uid_text() and role in ('admin', 'super_admin')) );

drop policy if exists "Users can view own tickets" on support_tickets;
create policy "Users can view own tickets" on support_tickets for select
  using ( user_id = auth_uid_text() );

drop policy if exists "Users can insert own tickets" on support_tickets;
create policy "Users can insert own tickets" on support_tickets for insert
  with check ( user_id = auth_uid_text() );


-- Polls Policies
drop policy if exists "Public can view active polls" on polls;
create policy "Public can view active polls" on polls for select using ( true );

drop policy if exists "Admins can manage polls" on polls;
create policy "Admins can manage polls" on polls for all
  using ( exists (select 1 from profiles where id = auth_uid_text() and role in ('admin', 'super_admin')) );

drop policy if exists "Public can view poll options" on poll_options;
create policy "Public can view poll options" on poll_options for select using ( true );

drop policy if exists "Admins can manage options" on poll_options;
create policy "Admins can manage options" on poll_options for all
  using ( exists (select 1 from profiles where id = auth_uid_text() and role in ('admin', 'super_admin')) );

-- Scheduled SMS Policies
drop policy if exists "Admins manage scheduled sms" on scheduled_sms;
create policy "Admins manage scheduled sms" on scheduled_sms for all
  using ( exists (select 1 from profiles where id = auth_uid_text() and role in ('admin', 'super_admin')) );


-- ==============================================
-- 5. ADD MISSING COLUMNS
-- ==============================================

-- Add business_logo to seller_applications
alter table seller_applications add column if not exists business_logo text;

-- Add business_logo to seller_profiles
alter table seller_profiles add column if not exists business_logo text;
