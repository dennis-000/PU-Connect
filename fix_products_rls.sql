-- FIX: PRODUCTS RLS POLICIES
-- This script fixes the "new row violates row-level security policy" error for products.

-- 1. Ensure safe auth function exists
create or replace function auth_uid_text() returns text as $$
  select nullif(current_setting('request.jwt.claim.sub', true), '');
$$ language sql stable;

-- 2. Make sure RLS is on
alter table products enable row level security;

-- 3. Drop existing restrictive policies
drop policy if exists "Sellers can insert products" on products;
drop policy if exists "Sellers can update own products" on products;
drop policy if exists "Public can view active products" on products;
drop policy if exists "Admins manage all products" on products;
-- Drop potentially named old policies
drop policy if exists "Enable insert for authenticated users only" on products;
drop policy if exists "Enable read access for all users" on products;

-- 4. Create new permissive policies

-- Allow ANY authenticated user to insert a product if they assign it to themselves
create policy "Sellers can insert products"
on products for insert
with check (
  -- The seller_id must match the currently logged in user's ID
  seller_id = auth_uid_text()
  -- OR the user is an admin acting on behalf of someone else
  OR exists (select 1 from profiles where id = auth_uid_text() and role in ('admin', 'super_admin'))
);

-- Allow sellers to update their own products
create policy "Sellers can update own products"
on products for update
using (
  seller_id = auth_uid_text()
  OR exists (select 1 from profiles where id = auth_uid_text() and role in ('admin', 'super_admin'))
);

-- Allow sellers to delete their own products
create policy "Sellers can delete own products"
on products for delete
using (
  seller_id = auth_uid_text()
  OR exists (select 1 from profiles where id = auth_uid_text() and role in ('admin', 'super_admin'))
);

-- Allow everyone to view active products
create policy "Public can view active products"
on products for select
using (
  -- Public can see active products
  is_active = true
  -- Sellers/Admins can see their own even if inactive
  OR seller_id = auth_uid_text() 
  OR exists (select 1 from profiles where id = auth_uid_text() and role in ('admin', 'super_admin'))
);
