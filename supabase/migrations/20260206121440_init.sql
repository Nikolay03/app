create extension if not exists "pgcrypto";

create table if not exists public.views (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid(),
  grid_key text not null,
  name text not null,
  column_state jsonb,
  sort_model jsonb,
  filter_model jsonb,
  created_at timestamptz not null default now()
);

create index if not exists views_user_id_idx on public.views (user_id);
create index if not exists views_grid_key_idx on public.views (grid_key);

alter table public.views enable row level security;

create policy "views_select_own"
  on public.views
  for select
  using (auth.uid() = user_id);

create policy "views_insert_own"
  on public.views
  for insert
  with check (auth.uid() = user_id);

create policy "views_update_own"
  on public.views
  for update
  using (auth.uid() = user_id);

create policy "views_delete_own"
  on public.views
  for delete
  using (auth.uid() = user_id);

create table if not exists public.invoices (
  invoice_id text primary key,
  customer_name text not null,
  customer_email text not null,
  invoice_date date not null,
  due_date date not null,
  amount numeric not null,
  tax numeric not null,
  total numeric not null,
  status text not null check (status in ('draft','sent','paid','overdue','cancelled')),
  payment_method text,
  notes text
);

create table if not exists public.orders (
  order_id text primary key,
  customer_name text not null,
  customer_phone text not null,
  order_date date not null,
  shipping_address text not null,
  items_count integer not null,
  subtotal numeric not null,
  shipping_cost numeric not null,
  discount numeric not null,
  total numeric not null,
  status text not null check (status in ('pending','confirmed','processing','delivered')),
  tracking_number text,
  estimated_delivery date
);
