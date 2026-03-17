create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  order_number text not null,
  order_type text not null default 'on_hand',
  status text not null default 'pending',
  payment_status text not null default 'payment_submitted'
    check (payment_status in ('awaiting_payment', 'payment_submitted', 'payment_verified', 'payment_rejected')),
  product_id text not null,
  product_title text not null,
  product_variant text,
  quantity integer not null check (quantity > 0),
  buyer_name text not null,
  buyer_email text not null,
  buyer_phone text not null,
  buyer_address text not null,
  delivery_country text,
  delivery_province text,
  subtotal numeric(10, 2) not null default 0,
  tax_amount numeric(10, 2) not null default 0,
  delivery_fee numeric(10, 2) not null default 0,
  total_price numeric(10, 2) not null default 0,
  payment_proof text,
  wise_handle text,
  payment_submitted_at timestamptz,
  payment_verified_at timestamptz,
  payment_rejected_at timestamptz,
  paid_at timestamptz,
  payment_notes text,
  confirmed_at timestamptz,
  updated_at timestamptz not null default timezone('utc', now()),
  created_at timestamptz not null default timezone('utc', now())
);

create index if not exists orders_status_created_at_idx
  on public.orders (status, created_at desc);

create index if not exists orders_product_id_idx
  on public.orders (product_id);

create index if not exists orders_order_number_idx
  on public.orders (order_number);

create index if not exists orders_payment_status_created_at_idx
  on public.orders (payment_status, created_at desc);
