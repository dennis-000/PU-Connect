-- Create the internships table
create table if not exists public.internships (
  id uuid default gen_random_uuid() primary key,
  title text not null,
  company text not null,
  location text not null,
  type text not null, -- 'Full-time', 'Part-time', 'Internship'
  source text not null, -- 'LinkedIn', 'Abroad', 'Direct'
  description text,
  url text not null,
  logo_url text,
  posted_at timestamptz default now(),
  created_at timestamptz default now(),
  is_active boolean default true
);

-- Enable RLS
alter table public.internships enable row level security;

-- Policy: Everyone can read active internships
create policy "Allow public read access"
  on public.internships for select
  using (is_active = true);

-- Policy: Only admins can insert/update/delete (assuming role-based logic exists, otherwise authenticated for now)
-- Using a simple check for 'authenticated' users for now to allow adding via backend/Edge Functions easily.
-- For production, this should be stricter.
create policy "Allow authenticated insert/update"
  on public.internships for all
  using (auth.role() = 'authenticated')
  with check (auth.role() = 'authenticated');
