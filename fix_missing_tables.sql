-- SUPPORT TICKETS TABLE
create table if not exists support_tickets (
  id uuid default gen_random_uuid() primary key,
  user_id text references profiles(id) on delete cascade,
  subject text not null,
  message text not null,
  status text default 'open' check (status in ('open', 'in_progress', 'resolved', 'closed')),
  priority text default 'medium' check (priority in ('low', 'medium', 'high', 'urgent')),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table support_tickets enable row level security;

create policy "Admins can view all tickets"
  on support_tickets for select
  using ( exists (select 1 from profiles where id = auth_uid_text() and role in ('admin', 'super_admin')) );

create policy "Admins can update tickets"
  on support_tickets for update
  using ( exists (select 1 from profiles where id = auth_uid_text() and role in ('admin', 'super_admin')) );

create policy "Users can view own tickets"
  on support_tickets for select
  using ( user_id = auth_uid_text() );

create policy "Users can insert own tickets"
  on support_tickets for insert
  with check ( user_id = auth_uid_text() );


-- POLLS TABLES
create table if not exists polls (
  id uuid default gen_random_uuid() primary key,
  question text not null,
  is_active boolean default true,
  created_by text references profiles(id),
  expires_at timestamp with time zone,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

create table if not exists poll_options (
  id uuid default gen_random_uuid() primary key,
  poll_id uuid references polls(id) on delete cascade,
  option_text text not null,
  votes_count integer default 0
);

alter table polls enable row level security;
alter table poll_options enable row level security;

-- Polls are public to view, admin to manage
create policy "Public can view active polls"
  on polls for select
  using ( true );

create policy "Admins can manage polls"
  on polls for all
  using ( exists (select 1 from profiles where id = auth_uid_text() and role in ('admin', 'super_admin')) );

create policy "Public can view poll options"
  on poll_options for select
  using ( true );

-- SCHEDULED SMS TABLE
create table if not exists scheduled_sms (
  id uuid default gen_random_uuid() primary key,
  recipients text[] not null,
  message text not null,
  scheduled_at timestamp with time zone not null,
  status text default 'pending',
  created_by text references profiles(id),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table scheduled_sms enable row level security;

create policy "Admins manage scheduled sms"
  on scheduled_sms for all
  using ( exists (select 1 from profiles where id = auth_uid_text() and role in ('admin', 'super_admin')) );

-- Ensure business_logo exists (redundancy check)
alter table seller_applications add column if not exists business_logo text;
alter table seller_profiles add column if not exists business_logo text;
