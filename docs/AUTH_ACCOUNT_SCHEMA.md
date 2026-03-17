# Customer Login + Registration Schema Proposal

_Date: 2026-03-17_
_Branch: `feature/user-auth-schema`_

## Goal

Add customer login and registration so each user can:

- own a persistent account
- view their past and current orders
- reuse saved profile details during checkout
- keep future on-hand and pre-order purchases tied to one identity

## Recommended Supabase Model

Use Supabase Auth as the identity layer and keep storefront customer data in app-owned tables.

### Identity source

- `auth.users`
  - managed by Supabase Auth
  - primary identity record for login, registration, email verification, password reset

### App-owned tables

#### `public.customer_profiles`

One row per authenticated customer.

Suggested columns:

- `id uuid primary key references auth.users(id) on delete cascade`
- `email text not null unique`
- `full_name text`
- `phone text`
- `avatar_url text`
- `marketing_opt_in boolean not null default false`
- `is_guest boolean not null default false`
- `last_login_at timestamptz`
- `created_at timestamptz not null default timezone('utc', now())`
- `updated_at timestamptz not null default timezone('utc', now())`

Purpose:

- owner-facing customer identity
- profile header for account page
- stable foreign key target for orders

#### `public.customer_addresses`

Allow one customer to save multiple shipping/billing addresses.

Suggested columns:

- `id uuid primary key default gen_random_uuid()`
- `customer_id uuid not null references public.customer_profiles(id) on delete cascade`
- `label text`
- `recipient_name text not null`
- `phone text`
- `line_1 text not null`
- `line_2 text`
- `city text not null`
- `province_region text`
- `postal_code text`
- `country_code text not null`
- `country_name text not null`
- `is_default_shipping boolean not null default false`
- `is_default_billing boolean not null default false`
- `created_at timestamptz not null default timezone('utc', now())`
- `updated_at timestamptz not null default timezone('utc', now())`

Purpose:

- clean saved checkout info
- future support for multiple destinations per user

#### `public.orders`

Keep the current table, but extend it instead of replacing it.

Current table already stores the order snapshot well. That is good and should remain.

Add these columns:

- `customer_id uuid references public.customer_profiles(id) on delete set null`
- `customer_email text`
- `account_order boolean not null default false`
- `shipping_address_id uuid references public.customer_addresses(id) on delete set null`
- `billing_address_id uuid references public.customer_addresses(id) on delete set null`
- `payment_status text not null default 'payment_submitted'`
- `payment_submitted_at timestamptz`
- `payment_verified_at timestamptz`
- `payment_rejected_at timestamptz`
- `paid_at timestamptz`
- `payment_notes text`
- `fulfillment_status text not null default 'unfulfilled'`
- `cancelled_at timestamptz`
- `updated_at timestamptz not null default timezone('utc', now())`

Purpose:

- links order to logged-in user
- preserves existing buyer snapshot columns for audit/history
- supports guest orders during transition

Important:

- keep `buyer_name`, `buyer_email`, `buyer_phone`, `buyer_address`
- these are order snapshots and should not be removed
- customer profile data can change later, but historical orders must stay exact

## Relationship Design

- `auth.users.id` -> `customer_profiles.id`
- `customer_profiles.id` -> many `customer_addresses.customer_id`
- `customer_profiles.id` -> many `orders.customer_id`
- `customer_addresses.id` -> optional `orders.shipping_address_id`
- `customer_addresses.id` -> optional `orders.billing_address_id`

## MVP Recommendation

For the first release, only require:

- Supabase Auth login/register
- `customer_profiles`
- nullable `orders.customer_id`
- nullable `orders.customer_email`
- `account_order`
- account page showing customer-owned orders

This gives fast value without overbuilding.

## Nice-To-Have Later

- `customer_addresses`
- social login
- email verification gate before ordering
- wishlist table
- saved payment preference metadata
- order event log table
- customer notes / fraud review flags for admin

## Migration Strategy

### Step 1

Create `customer_profiles`.

### Step 2

Add nullable account-link columns to `orders`.

### Step 3

Keep guest checkout working during rollout.

Behavior:

- logged-out buyer -> order is created with snapshot fields only, `customer_id = null`
- logged-in buyer -> order is created with snapshot fields plus `customer_id`

### Step 4

Backfill when safe:

- for future users, link by authenticated session directly
- for past guest orders, do not auto-merge aggressively
- only backfill old orders if owner explicitly trusts email-based linking

Safe backfill option:

- when a user registers and verifies email, older orders with matching `buyer_email` can be linked to that `customer_id`
- do this only with a deliberate script or admin-reviewed job

## RLS / Policy Direction

### `customer_profiles`

- user can `select` own row
- user can `update` own row
- user can `insert` own row at signup flow if not auto-created by trigger
- admin/service role can view all

### `customer_addresses`

- user can manage only rows where `customer_id = auth.uid()`
- admin/service role can view all

### `orders`

- customer can `select` only orders where `customer_id = auth.uid()`
- public guest inserts should be reconsidered during login rollout
- safest path:
  - authenticated users insert their own account orders
  - service role or secure server path handles guest orders if guest checkout remains

Important risk:

The current storefront inserts directly into `public.orders` from the client. Once accounts are introduced, RLS must be tightened carefully so public writes do not accidentally expose all orders.

## Payment Verification Workflow

Recommended `payment_status` values:

- `awaiting_payment`
- `payment_submitted`
- `payment_verified`
- `payment_rejected`

Admin meaning:

- `awaiting_payment`: customer has not finished payment yet
- `payment_submitted`: customer says payment was sent and needs review
- `payment_verified`: owner has confirmed payment and can treat the order as paid
- `payment_rejected`: proof was invalid, missing, or needs the customer to retry

## Why This Design Fits Current Cloud Nine Cards Flow

- preserves the current admin-confirmed stock deduction workflow
- does not break existing guest-style order data
- adds account ownership without losing historical buyer snapshots
- supports both on-hand and future pre-order account history

## Recommended Next Build Order

1. Add schema changes
2. Add signup/login UI
3. Auto-create `customer_profiles` on signup
4. Add account page with order history
5. Attach logged-in orders to `customer_id`
6. Decide later whether guest checkout stays or becomes optional
