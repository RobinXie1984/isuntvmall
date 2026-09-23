-- Multi-KOL identity and immutable per-order-line attribution.
-- Preview release: payment creation remains code-gated until reservations pass.
begin;
alter table public.products add column is_demo boolean not null default false;
create table public.kols (
 id uuid primary key default gen_random_uuid(),
 slug text not null unique check(slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
 display_name text not null check(char_length(display_name) between 1 and 120),
 bio text not null default '',
 status text not null default 'active' check(status in ('active','inactive')),
 created_at timestamptz not null default now()
);
alter table public.kols enable row level security;
revoke all on table public.kols from anon, authenticated;
grant all on table public.kols to service_role;
alter table public.live_sessions add column kol_id uuid references public.kols(id) on delete restrict;
alter table public.live_sessions drop constraint live_sessions_platform_check;
alter table public.live_sessions add constraint live_sessions_platform_check check(platform in ('youtube','facebook','instagram','tiktok','external'));
alter table public.live_sessions drop constraint live_sessions_status_check;
alter table public.live_sessions add constraint live_sessions_status_check check(status in ('scheduled','live','ended','preview'));
alter table public.order_items add column live_session_id uuid references public.live_sessions(id) on delete restrict;
alter table public.order_items add column kol_id uuid references public.kols(id) on delete restrict;
alter table public.order_items add constraint order_items_source_pair check((live_session_id is null) = (kol_id is null));
create index live_sessions_kol_idx on public.live_sessions(kol_id);
create index order_items_source_idx on public.order_items(kol_id,live_session_id);

create or replace function public.create_pending_order(p_currency text,p_subtotal_amount integer,p_items jsonb)
returns uuid language plpgsql security invoker set search_path = '' as $$
declare v_order_id uuid;
begin
 -- Check linked attribution against authoritative current room membership.
 if exists (
  select 1 from jsonb_to_recordset(p_items) as i(product_id uuid,live_session_id uuid,kol_id uuid)
  where (i.live_session_id is null) <> (i.kol_id is null) or
   (i.live_session_id is not null and not exists (
    select 1 from public.live_sessions s join public.kols k on k.id=s.kol_id
     join public.live_products lp on lp.live_session_id=s.id
    where s.id=i.live_session_id and k.id=i.kol_id and k.status='active'
     and s.status<>'preview' and lp.product_id=i.product_id
   ))
 ) then raise exception 'Invalid room attribution'; end if;
 insert into public.orders(currency,subtotal_amount) values(lower(p_currency),p_subtotal_amount) returning id into v_order_id;
 insert into public.order_items(order_id,product_id,sku,title,unit_amount,quantity,live_session_id,kol_id)
 select v_order_id,i.product_id,i.sku,i.title,i.unit_amount,i.quantity,i.live_session_id,i.kol_id
 from jsonb_to_recordset(p_items) as i(product_id uuid,sku text,title text,unit_amount integer,quantity integer,live_session_id uuid,kol_id uuid);
 if not exists(select 1 from public.order_items where order_id=v_order_id) then raise exception 'An order requires at least one item'; end if;
 return v_order_id;
end;
$$;
revoke execute on function public.create_pending_order(text,integer,jsonb) from public,anon,authenticated;
grant execute on function public.create_pending_order(text,integer,jsonb) to service_role;
-- One RPC transaction includes every product and image; any constraint error
-- aborts the entire import rather than leaving a partially published catalog.
create or replace function public.import_products_atomic(p_products jsonb)
returns table(id uuid,sku text) language plpgsql security invoker set search_path='' as $$
declare i record; v_id uuid;
begin
 if jsonb_typeof(p_products)<>'array' or jsonb_array_length(p_products) not between 1 and 500 then
  raise exception 'Import requires 1 to 500 products';
 end if;
 for i in select * from jsonb_to_recordset(p_products) as p(sku text,slug text,title text,description text,price_amount integer,currency text,stock_qty integer,category text,status text,featured boolean,image_url text)
 loop
  insert into public.products as p(sku,slug,title,description,price_amount,currency,stock_qty,category,status,featured)
  values(i.sku,i.slug,i.title,coalesce(i.description,''),i.price_amount,i.currency,i.stock_qty,i.category,coalesce(i.status,'draft'),coalesce(i.featured,false))
  on conflict on constraint products_sku_key do update set slug=excluded.slug,title=excluded.title,description=excluded.description,price_amount=excluded.price_amount,currency=excluded.currency,stock_qty=excluded.stock_qty,category=excluded.category,status=excluded.status,featured=excluded.featured
  returning p.id into v_id;
  if i.image_url is not null and i.image_url<>'' then
   insert into public.product_images(product_id,source_url,alt_text,position) values(v_id,i.image_url,i.title,0)
   on conflict(product_id,position) do update set source_url=excluded.source_url,alt_text=excluded.alt_text;
  end if;
  return query select v_id,i.sku;
 end loop;
end;
$$;
revoke execute on function public.import_products_atomic(jsonb) from public,anon,authenticated;
grant execute on function public.import_products_atomic(jsonb) to service_role;
-- Aggregate mixed-room order lines for one SKU. Reservations remain a release gate.
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
  from (select product_id, sum(quantity)::integer as quantity from public.order_items where order_id=v_order_id group by product_id) as item
  where item.product_id = product.id;

  return v_order_id;
end;
$$;

commit;
