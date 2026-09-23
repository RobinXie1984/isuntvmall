-- Serialized V1 inventory transactions. stock_qty remains on-hand stock;
-- available inventory is on-hand minus ACTIVE holds. No external DB is implied.
begin;
alter table public.orders drop constraint orders_status_check;
alter table public.orders add constraint orders_status_check check(status in ('pending','paid','failed','cancelled','refunded','review'));
alter table public.orders add column checkout_attempt_id uuid unique;
alter table public.orders add column cart_fingerprint text;
alter table public.orders add column reservation_expires_at timestamptz;
alter table public.orders add column checkout_policy jsonb not null default '{}'::jsonb;
alter table public.orders add column review_reason text;
create table public.inventory_reservations (
 order_id uuid not null references public.orders(id) on delete restrict,
 product_id uuid not null references public.products(id) on delete restrict,
 quantity integer not null check(quantity between 1 and 100),
 status text not null default 'active' check(status in ('active','consumed','released')),
 expires_at timestamptz not null,
 release_reason text,
 primary key(order_id,product_id)
);
create index inventory_reservations_active_idx on public.inventory_reservations(product_id) where status='active';
create table public.checkout_events (
 id text primary key,
 event_type text not null,
 payment_intent_id text,
 session_id text,
 order_id uuid references public.orders(id),
 outcome text not null,
 received_at timestamptz not null default clock_timestamp()
);
alter table public.inventory_reservations enable row level security;
alter table public.checkout_events enable row level security;
revoke all on table public.inventory_reservations,public.checkout_events from anon,authenticated;
grant all on table public.inventory_reservations,public.checkout_events to service_role;

create function public.expire_inventory_reservations() returns integer language plpgsql security invoker set search_path='' as $$
declare n integer;
begin
 perform pg_catalog.pg_advisory_xact_lock(73219023);
 update public.inventory_reservations set status='released',release_reason='expired' where status='active' and expires_at<=clock_timestamp();
 get diagnostics n=row_count;
 update public.orders set status='cancelled',review_reason='reservation_expired' where status='pending' and reservation_expires_at<=clock_timestamp();
 return n;
end;$$;

create function public.reserve_checkout(p_attempt uuid,p_fingerprint text,p_lines jsonb,p_policy jsonb)
returns uuid language plpgsql security invoker set search_path='' as $$
declare v_order public.orders; v_id uuid; v_currency text; v_subtotal integer; v_expiry timestamptz; r record;
begin
 perform pg_catalog.pg_advisory_xact_lock(73219023);
 perform public.expire_inventory_reservations();
 select * into v_order from public.orders where checkout_attempt_id=p_attempt for update;
 if found then
  if v_order.cart_fingerprint<>p_fingerprint then raise exception 'CHECKOUT_ATTEMPT_CHANGED'; end if;
  if v_order.status in ('paid','review','refunded') then raise exception 'CHECKOUT_PAYMENT_PENDING';end if;
  if v_order.status<>'pending' then raise exception 'CHECKOUT_ATTEMPT_CLOSED'; end if;
  return v_order.id;
 end if;
 if p_attempt is null or p_fingerprint is null or p_fingerprint !~ '^[a-f0-9]{64}$' or p_lines is null or jsonb_typeof(p_lines)<>'array' or jsonb_array_length(p_lines) not between 1 and 20 then raise exception 'INVALID_CART';end if;
 if exists(select 1 from jsonb_to_recordset(p_lines) as i(product_id uuid,quantity integer,live_session_id uuid,kol_id uuid) where i.product_id is null or i.quantity is null or i.quantity not between 1 and 10 or (i.live_session_id is null)<>(i.kol_id is null)) then raise exception 'INVALID_CART';end if;
 for r in select i.product_id,sum(i.quantity)::integer qty from jsonb_to_recordset(p_lines) as i(product_id uuid,quantity integer) group by i.product_id order by i.product_id loop
  perform 1 from public.products p where p.id=r.product_id and p.status='published' and not p.is_demo and p.price_amount>0 for update;
  if not found then raise exception 'PRODUCT_UNAVAILABLE';end if;
  if r.qty>10 then raise exception 'QUANTITY_LIMIT';end if;
  if (select p.stock_qty-coalesce((select sum(h.quantity) from public.inventory_reservations h where h.product_id=p.id and h.status='active'),0) from public.products p where p.id=r.product_id)<r.qty then raise exception 'OUT_OF_STOCK';end if;
 end loop;
 if exists(select 1 from jsonb_to_recordset(p_lines) as i(product_id uuid,quantity integer,live_session_id uuid,kol_id uuid) where i.live_session_id is not null and not exists(select 1 from public.live_sessions s join public.kols k on k.id=s.kol_id join public.live_products lp on lp.live_session_id=s.id where s.id=i.live_session_id and k.id=i.kol_id and k.status='active' and s.status<>'preview' and lp.product_id=i.product_id)) then raise exception 'INVALID_ATTRIBUTION';end if;
 select min(p.currency),sum(p.price_amount*i.quantity)::integer into v_currency,v_subtotal from jsonb_to_recordset(p_lines) as i(product_id uuid,quantity integer) join public.products p on p.id=i.product_id;
 if (select count(distinct p.currency) from jsonb_to_recordset(p_lines) as i(product_id uuid) join public.products p on p.id=i.product_id)<>1 or v_currency not in ('hkd','usd','sgd','myr','gbp','aud','cad','eur','cny') then raise exception 'UNSUPPORTED_CURRENCY';end if;
 v_expiry=clock_timestamp()+interval '40 minutes';
 insert into public.orders(checkout_attempt_id,cart_fingerprint,currency,subtotal_amount,reservation_expires_at,checkout_policy) values(p_attempt,p_fingerprint,v_currency,v_subtotal,v_expiry,p_policy) returning id into v_id;
 insert into public.order_items(order_id,product_id,sku,title,unit_amount,quantity,live_session_id,kol_id)
 select v_id,p.id,p.sku,p.title,p.price_amount,i.quantity,i.live_session_id,i.kol_id from jsonb_to_recordset(p_lines) as i(product_id uuid,quantity integer,live_session_id uuid,kol_id uuid) join public.products p on p.id=i.product_id;
 insert into public.inventory_reservations(order_id,product_id,quantity,expires_at) select v_id,i.product_id,sum(i.quantity),v_expiry from jsonb_to_recordset(p_lines) as i(product_id uuid,quantity integer) group by i.product_id;
 return v_id;
end;$$;

create function public.attach_reserved_session(p_order_id uuid,p_session_id text) returns void language plpgsql security invoker set search_path='' as $$
declare o public.orders;
begin
 perform pg_catalog.pg_advisory_xact_lock(73219023);
 select * into o from public.orders where id=p_order_id for update;
 if not found or o.status<>'pending' or o.reservation_expires_at<=clock_timestamp() or not exists(select 1 from public.inventory_reservations where order_id=o.id and status='active') then raise exception 'CHECKOUT_ATTEMPT_CLOSED';end if;
 if o.stripe_checkout_session_id is not null and o.stripe_checkout_session_id<>p_session_id then raise exception 'SESSION_CONFLICT';end if;
 update public.orders set stripe_checkout_session_id=p_session_id where id=o.id;
end;$$;

-- Caller may release only after provider expiry, definite creation failure, or
-- before any provider session was created. A cancel-page GET is never proof.
create function public.release_checkout(p_order_id uuid,p_reason text) returns text language plpgsql security invoker set search_path='' as $$
declare o public.orders;
begin
 perform pg_catalog.pg_advisory_xact_lock(73219023);
 if p_reason not in ('provider_expired','creation_failed','creation_window_expired','cancel_confirmed') then raise exception 'INVALID_RELEASE_REASON';end if;
 select * into o from public.orders where id=p_order_id for update;
 if not found then raise exception 'UNKNOWN_ORDER';end if;
 if o.status<>'pending' then return o.status;end if;
 update public.inventory_reservations set status='released',release_reason=p_reason where order_id=o.id and status='active';
 update public.orders set status=case when p_reason='creation_failed' then 'failed' else 'cancelled' end,review_reason=p_reason where id=o.id;
 return 'released';
end;$$;

-- A verified webhook supplies only normalized provider facts. Events are
-- idempotent and completion is accepted only with an intact, unexpired hold.
create function public.process_checkout_event(p_event_id text,p_type text,p_order_id uuid,p_session_id text,p_facts jsonb)
returns text language plpgsql security invoker set search_path='' as $$
declare o public.orders; prior text; reason text; subtotal integer; total integer; shipping integer; tax integer; discount integer; v_status text;
begin
 perform pg_catalog.pg_advisory_xact_lock(73219023);
 select outcome into prior from public.checkout_events where id=p_event_id;
 if found then return prior;end if;
 select * into o from public.orders where id=p_order_id for update;
 if not found then
  -- Do not acknowledge or deduplicate an event whose order is unavailable.
  -- The provider must be able to retry after recovery.
  raise exception 'UNKNOWN_ORDER';
 end if;
 if nullif(p_session_id,'') is null then raise exception 'INVALID_SESSION';end if;
 if o.stripe_checkout_session_id is distinct from p_session_id and o.stripe_checkout_session_id is not null then reason='session_mismatch';
 elsif o.status in ('refunded','review') then reason=coalesce(o.review_reason,'terminal_order');
 elsif p_type='checkout.session.expired' then
  if o.status='pending' then perform public.release_checkout(o.id,'provider_expired');end if;
  v_status='expired';
 elsif p_type='checkout.session.async_payment_failed' then
  -- Delayed methods are not enabled in V1. Keep unexpected lifecycle manual.
  reason='unexpected_async_payment';
 elsif p_type in ('checkout.session.completed','checkout.session.async_payment_succeeded') then
  if p_facts->>'payment_status' is distinct from 'paid' then v_status='unpaid';
  elsif p_type='checkout.session.async_payment_succeeded' then reason='unexpected_async_payment';
  elsif exists(select 1 from public.checkout_events where payment_intent_id=p_facts->>'payment_intent_id' and outcome='review') then reason='refund_or_dispute_requires_manual_reconciliation';
  elsif nullif(p_facts->>'payment_intent_id','') is null then reason='missing_payment_intent';
  elsif o.status='paid' and o.stripe_payment_intent_id is distinct from p_facts->>'payment_intent_id' then reason='payment_intent_mismatch';
  elsif o.status='paid' then v_status='paid';
  elsif o.status<>'pending' or o.reservation_expires_at is null or o.reservation_expires_at<=clock_timestamp() then reason='late_paid_or_released';
  elsif not exists(select 1 from public.inventory_reservations where order_id=o.id) or exists(select 1 from public.inventory_reservations where order_id=o.id and (status<>'active' or expires_at<=clock_timestamp())) then reason='missing_active_reservation';
  else
   subtotal=(p_facts->>'amount_subtotal')::integer;total=(p_facts->>'amount_total')::integer;shipping=(p_facts->>'amount_shipping')::integer;tax=(p_facts->>'amount_tax')::integer;discount=(p_facts->>'amount_discount')::integer;
   if subtotal is null or total is null or shipping is null or tax is null or discount is null or subtotal<>o.subtotal_amount or shipping<0 or tax<0 or discount<>0 or total<>subtotal+shipping+tax or p_facts->>'currency' is distinct from o.currency then reason='amount_or_currency_mismatch';
   elsif exists(select 1 from public.inventory_reservations h join public.products p on p.id=h.product_id where h.order_id=o.id and p.stock_qty<h.quantity) then reason='inventory_invariant_broken';
   else
    update public.inventory_reservations set status='consumed' where order_id=o.id and status='active';
    update public.products p set stock_qty=p.stock_qty-h.quantity from public.inventory_reservations h where h.order_id=o.id and h.product_id=p.id;
    update public.orders set stripe_checkout_session_id=p_session_id,stripe_payment_intent_id=p_facts->>'payment_intent_id',status='paid',shipping_amount=shipping,tax_amount=tax,total_amount=total,paid_at=clock_timestamp(),customer_email=p_facts->>'customer_email',customer_name=p_facts->>'customer_name',shipping_address=p_facts->'shipping_address' where id=o.id;
    v_status='paid';
   end if;
  end if;
 else reason='unsupported_payment_event';
 end if;
 if reason is not null then
  update public.inventory_reservations set status='released',release_reason='manual_review' where order_id=o.id and status='active';
  update public.orders set status='review',review_reason=reason,stripe_payment_intent_id=coalesce(stripe_payment_intent_id,p_facts->>'payment_intent_id'),stripe_checkout_session_id=coalesce(stripe_checkout_session_id,p_session_id) where id=o.id;
  v_status='review';
 end if;
 insert into public.checkout_events(id,event_type,session_id,payment_intent_id,order_id,outcome) values(p_event_id,p_type,p_session_id,p_facts->>'payment_intent_id',o.id,v_status);
 return v_status;
end;$$;

create function public.flag_payment_review(p_event_id text,p_type text,p_payment_intent text) returns text language plpgsql security invoker set search_path='' as $$
declare o record;
begin
 perform pg_catalog.pg_advisory_xact_lock(73219023);
 if exists(select 1 from public.checkout_events where id=p_event_id) then return 'review';end if;
 for o in select id from public.orders where stripe_payment_intent_id=p_payment_intent loop
  update public.orders set status='review',review_reason='refund_or_dispute_requires_manual_reconciliation' where id=o.id;
  update public.inventory_reservations set status='released',release_reason='manual_review' where order_id=o.id and status='active';
 end loop;
 insert into public.checkout_events(id,event_type,payment_intent_id,outcome) values(p_event_id,p_type,p_payment_intent,'review');
 return 'review';
end;$$;

-- Serialize stock edits with checkout transactions, then refuse values below
-- active holds. This protects batch imports and manual admin stock updates.
create function public.lock_inventory_edits() returns trigger language plpgsql security invoker set search_path='' as $$
begin perform pg_catalog.pg_advisory_xact_lock(73219023);return null;end;$$;
create trigger products_lock_inventory before update on public.products for each statement execute function public.lock_inventory_edits();
create function public.guard_reserved_inventory() returns trigger language plpgsql security invoker set search_path='' as $$
begin
 if new.stock_qty<(select coalesce(sum(quantity),0) from public.inventory_reservations where product_id=new.id and status='active') then raise exception 'Stock cannot fall below active reservations';end if;
 return new;
end;$$;
create trigger products_guard_inventory before update of stock_qty on public.products for each row execute function public.guard_reserved_inventory();

-- Retire the legacy paths that have no reservation or amount checks.
revoke execute on function public.create_pending_order(text,integer,jsonb) from service_role;
revoke execute on function public.fulfill_order(text,text,text,text,jsonb,integer,integer,integer,integer) from service_role;
revoke execute on function public.expire_inventory_reservations(),public.reserve_checkout(uuid,text,jsonb,jsonb),public.attach_reserved_session(uuid,text),public.release_checkout(uuid,text),public.process_checkout_event(text,text,uuid,text,jsonb),public.flag_payment_review(text,text,text),public.lock_inventory_edits(),public.guard_reserved_inventory() from public,anon,authenticated;
grant execute on function public.expire_inventory_reservations(),public.reserve_checkout(uuid,text,jsonb,jsonb),public.attach_reserved_session(uuid,text),public.release_checkout(uuid,text),public.process_checkout_event(text,text,uuid,text,jsonb),public.flag_payment_review(text,text,text),public.lock_inventory_edits(),public.guard_reserved_inventory() to service_role;
commit;
