-- SunTV Mall MVP: six commerce tables, locked behind the server-side secret key.
-- Public storefront reads are performed by Next.js server components. Browsers do
-- not receive elevated Supabase credentials and cannot write to these tables.

create table public.products (
  id uuid primary key default gen_random_uuid(),
  sku text not null unique check (char_length(sku) between 1 and 80),
  slug text not null unique check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  title text not null check (char_length(title) between 1 and 180),
  description text not null default '',
  price_amount integer not null check (price_amount >= 0),
  currency text not null default 'usd' check (currency ~ '^[a-z]{3}$'),
  stock_qty integer not null default 0 check (stock_qty >= 0),
  category text not null default 'General',
  status text not null default 'draft' check (status in ('draft', 'published', 'archived')),
  featured boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.product_images (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  source_url text not null check (char_length(source_url) between 1 and 2048),
  storage_path text,
  alt_text text not null default '',
  position integer not null default 0 check (position >= 0),
  created_at timestamptz not null default now(),
  unique (product_id, position)
);

create table public.live_sessions (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  title text not null check (char_length(title) between 1 and 180),
  description text not null default '',
  host_name text not null default 'SunTV',
  platform text not null check (platform in ('youtube', 'facebook', 'tiktok', 'external')),
  external_url text not null check (external_url ~ '^https://'),
  embed_id text,
  status text not null default 'scheduled' check (status in ('scheduled', 'live', 'ended')),
  starts_at timestamptz not null,
  ends_at timestamptz,
  poster_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (ends_at is null or ends_at >= starts_at)
);

create table public.live_products (
  live_session_id uuid not null references public.live_sessions(id) on delete cascade,
  product_id uuid not null references public.products(id) on delete cascade,
  position integer not null default 0 check (position >= 0),
  primary key (live_session_id, product_id),
  unique (live_session_id, position)
);

create table public.orders (
  id uuid primary key default gen_random_uuid(),
  stripe_checkout_session_id text unique,
  stripe_payment_intent_id text,
  status text not null default 'pending' check (status in ('pending', 'paid', 'failed', 'cancelled', 'refunded')),
  currency text not null check (currency ~ '^[a-z]{3}$'),
  subtotal_amount integer not null check (subtotal_amount >= 0),
  shipping_amount integer check (shipping_amount is null or shipping_amount >= 0),
  tax_amount integer check (tax_amount is null or tax_amount >= 0),
  total_amount integer check (total_amount is null or total_amount >= 0),
  customer_email text,
  customer_name text,
  shipping_address jsonb,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  paid_at timestamptz
);

create table public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  product_id uuid references public.products(id) on delete set null,
  sku text not null,
  title text not null,
  unit_amount integer not null check (unit_amount >= 0),
  quantity integer not null check (quantity between 1 and 100),
  line_total integer generated always as (unit_amount * quantity) stored,
  created_at timestamptz not null default now()
);

create index products_storefront_idx on public.products (status, featured desc, created_at desc);
create index product_images_product_idx on public.product_images (product_id, position);
create index live_sessions_storefront_idx on public.live_sessions (status, starts_at);
create index orders_created_idx on public.orders (created_at desc);
create index order_items_order_idx on public.order_items (order_id);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger products_set_updated_at
before update on public.products
for each row execute function public.set_updated_at();

create trigger live_sessions_set_updated_at
before update on public.live_sessions
for each row execute function public.set_updated_at();

create trigger orders_set_updated_at
before update on public.orders
for each row execute function public.set_updated_at();

-- Create an order and immutable item snapshots in one transaction. The function
-- runs with the caller's service-role permissions and never grants privilege.
create or replace function public.create_pending_order(
  p_currency text,
  p_subtotal_amount integer,
  p_items jsonb
)
returns uuid
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_order_id uuid;
begin
  insert into public.orders (currency, subtotal_amount)
  values (lower(p_currency), p_subtotal_amount)
  returning id into v_order_id;

  insert into public.order_items (order_id, product_id, sku, title, unit_amount, quantity)
  select
    v_order_id,
    item.product_id,
    item.sku,
    item.title,
    item.unit_amount,
    item.quantity
  from jsonb_to_recordset(p_items) as item(
    product_id uuid,
    sku text,
    title text,
    unit_amount integer,
    quantity integer
  );

  if not exists (select 1 from public.order_items where order_id = v_order_id) then
    raise exception 'An order requires at least one item';
  end if;

  return v_order_id;
end;
$$;

-- Idempotently marks a Checkout Session paid and decrements inventory once.
create or replace function public.fulfill_order(
  p_stripe_session_id text,
  p_payment_intent_id text,
  p_customer_email text,
  p_customer_name text,
  p_shipping_address jsonb,
  p_amount_subtotal integer,
  p_amount_shipping integer,
  p_amount_tax integer,
  p_amount_total integer
)
returns uuid
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_order_id uuid;
  v_status text;
begin
  select id, status
    into v_order_id, v_status
  from public.orders
  where stripe_checkout_session_id = p_stripe_session_id
  for update;

  if v_order_id is null then
    raise exception 'No order for Checkout Session %', p_stripe_session_id;
  end if;

  if v_status = 'paid' then
    return v_order_id;
  end if;

  update public.orders
  set
    stripe_payment_intent_id = p_payment_intent_id,
    status = 'paid',
    customer_email = p_customer_email,
    customer_name = p_customer_name,
    shipping_address = p_shipping_address,
    subtotal_amount = coalesce(p_amount_subtotal, subtotal_amount),
    shipping_amount = p_amount_shipping,
    tax_amount = p_amount_tax,
    total_amount = p_amount_total,
    paid_at = now()
  where id = v_order_id;

  update public.products as product
  set stock_qty = greatest(0, product.stock_qty - item.quantity)
  from public.order_items as item
  where item.order_id = v_order_id
    and item.product_id = product.id;

  return v_order_id;
end;
$$;

alter table public.products enable row level security;
alter table public.product_images enable row level security;
alter table public.live_sessions enable row level security;
alter table public.live_products enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;

-- Explicit grants are required for projects whose Data API is opt-in. The web
-- application uses only its server-side secret/service-role key.
revoke all on table public.products from anon, authenticated;
revoke all on table public.product_images from anon, authenticated;
revoke all on table public.live_sessions from anon, authenticated;
revoke all on table public.live_products from anon, authenticated;
revoke all on table public.orders from anon, authenticated;
revoke all on table public.order_items from anon, authenticated;
grant all on table public.products to service_role;
grant all on table public.product_images to service_role;
grant all on table public.live_sessions to service_role;
grant all on table public.live_products to service_role;
grant all on table public.orders to service_role;
grant all on table public.order_items to service_role;

revoke execute on function public.set_updated_at() from public, anon, authenticated;
revoke execute on function public.create_pending_order(text, integer, jsonb) from public, anon, authenticated;
revoke execute on function public.fulfill_order(text, text, text, text, jsonb, integer, integer, integer, integer) from public, anon, authenticated;
grant execute on function public.create_pending_order(text, integer, jsonb) to service_role;
grant execute on function public.fulfill_order(text, text, text, text, jsonb, integer, integer, integer, integer) to service_role;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'product-images',
  'product-images',
  true,
  8388608,
  array['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;
