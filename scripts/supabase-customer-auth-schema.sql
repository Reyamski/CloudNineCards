-- Customer auth/account schema draft for Cloud Nine Cards
-- Date: 2026-03-17
-- Goal: tie future orders to authenticated customer accounts without breaking
-- the current guest-style order workflow.

create table if not exists public.customer_profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null unique,
  full_name text,
  phone text,
  avatar_url text,
  marketing_opt_in boolean not null default false,
  is_guest boolean not null default false,
  last_login_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.customer_addresses (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid not null references public.customer_profiles(id) on delete cascade,
  label text,
  recipient_name text not null,
  phone text,
  line_1 text not null,
  line_2 text,
  city text not null,
  province_region text,
  postal_code text,
  country_code text not null,
  country_name text not null,
  is_default_shipping boolean not null default false,
  is_default_billing boolean not null default false,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

alter table public.orders
  add column if not exists customer_id uuid references public.customer_profiles(id) on delete set null,
  add column if not exists customer_email text,
  add column if not exists account_order boolean not null default false,
  add column if not exists shipping_address_id uuid references public.customer_addresses(id) on delete set null,
  add column if not exists billing_address_id uuid references public.customer_addresses(id) on delete set null,
  add column if not exists payment_status text not null default 'payment_submitted',
  add column if not exists fulfillment_status text not null default 'unfulfilled',
  add column if not exists payment_submitted_at timestamptz,
  add column if not exists payment_verified_at timestamptz,
  add column if not exists payment_rejected_at timestamptz,
  add column if not exists paid_at timestamptz,
  add column if not exists payment_notes text,
  add column if not exists cancelled_at timestamptz,
  add column if not exists updated_at timestamptz not null default timezone('utc', now());

alter table public.orders
  drop constraint if exists orders_payment_status_check;

alter table public.orders
  add constraint orders_payment_status_check
    check (payment_status in ('awaiting_payment', 'payment_submitted', 'payment_verified', 'payment_rejected'));

create index if not exists customer_profiles_email_idx
  on public.customer_profiles (email);

create index if not exists customer_addresses_customer_id_idx
  on public.customer_addresses (customer_id);

create index if not exists orders_customer_id_created_at_idx
  on public.orders (customer_id, created_at desc);

create index if not exists orders_customer_email_idx
  on public.orders (customer_email);

create index if not exists orders_payment_status_idx
  on public.orders (payment_status);

create index if not exists orders_fulfillment_status_idx
  on public.orders (fulfillment_status);

-- Optional future helper:
-- Backfill account-link email for historical orders without attaching a customer yet.
update public.orders
set customer_email = buyer_email
where customer_email is null;
