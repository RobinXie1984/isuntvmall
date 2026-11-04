-- Variant-aware reservations and payment events. Does not enable sales or publish drafts.
begin;
alter table public.product_variants add constraint product_variants_product_id_id_unique unique(product_id,id);
alter table public.inventory_reservations drop constraint inventory_reservations_pkey;
alter table public.inventory_reservations add column id uuid not null default gen_random_uuid(), add column variant_id uuid references public.product_variants(id), add primary key(id);
alter table public.inventory_reservations add constraint reservation_variant_product_fk foreign key(product_id,variant_id) references public.product_variants(product_id,id);
create unique index inventory_reservations_standard_unique on public.inventory_reservations(order_id,product_id) where variant_id is null;
create unique index inventory_reservations_variant_unique on public.inventory_reservations(order_id,product_id,variant_id) where variant_id is not null;
create index inventory_reservations_variant_active on public.inventory_reservations(variant_id) where status='active' and variant_id is not null;
alter table public.order_items add column variant_id uuid references public.product_variants(id), add column variant_options jsonb not null default '[]'::jsonb, add constraint order_item_variant_product_fk foreign key(product_id,variant_id) references public.product_variants(product_id,id);
create or replace function public.guard_reserved_inventory() returns trigger language plpgsql security invoker set search_path='' as $$
begin
 if new.stock_qty<(select coalesce(sum(quantity),0) from public.inventory_reservations where product_id=new.id and variant_id is null and status='active') then raise exception 'Stock cannot fall below active reservations';end if;
 return new;
end;$$;
create function private.guard_variant_inventory() returns trigger language plpgsql security invoker set search_path='' as $$
begin
 if exists(select 1 from public.inventory_reservations where variant_id=new.id and status='active') and (new.stock_qty is null or new.stock_qty<(select coalesce(sum(quantity),0) from public.inventory_reservations where variant_id=new.id and status='active')) then raise exception 'Stock cannot fall below active reservations';end if;
 return new;
end;$$;
create trigger variants_lock_inventory before update on public.product_variants for each statement execute function public.lock_inventory_edits();
create trigger variants_guard_inventory before update of stock_qty on public.product_variants for each row execute function private.guard_variant_inventory();
revoke all on function private.guard_variant_inventory() from public,anon,authenticated;
grant execute on function private.guard_variant_inventory() to service_role;
create or replace function public.reserve_checkout(p_attempt uuid,p_fingerprint text,p_lines jsonb,p_policy jsonb,p_client_hash text)
returns uuid language plpgsql security invoker set search_path='' as $$
declare v_order public.orders; v_id uuid; v_currency text; v_subtotal integer; v_expiry timestamptz; r record; v_admission private.checkout_admission_policy; v_recent bigint; v_client_active bigint; v_store_active bigint;
begin
 perform pg_catalog.pg_advisory_xact_lock(73219023);
 perform public.expire_inventory_reservations();
 if p_client_hash is null or p_client_hash !~ '^[a-f0-9]{64}$' then raise exception 'INVALID_CLIENT_HASH'; end if;
 select * into v_order from public.orders where checkout_attempt_id=p_attempt for update;
 if found then
  if v_order.cart_fingerprint is distinct from p_fingerprint then raise exception 'CHECKOUT_ATTEMPT_CHANGED'; end if;
  if v_order.status in ('paid','review','refunded') then raise exception 'CHECKOUT_PAYMENT_PENDING';end if;
  if v_order.status<>'pending' then raise exception 'CHECKOUT_ATTEMPT_CLOSED'; end if;
  if not exists(select 1 from private.checkout_admissions where order_id=v_order.id and client_hash=p_client_hash) then raise exception 'CHECKOUT_CLIENT_CHANGED'; end if;
  return v_order.id;
 end if;
 -- This lock is shared with every reservation, expiration and inventory edit.
 -- Read limits, evaluate capacity and insert the eventual charge in one transaction.
 select * into v_admission from private.checkout_admission_policy where singleton for update;
 if not found or not v_admission.enabled then raise exception 'CHECKOUT_ADMISSION_DISABLED'; end if;
 select count(*) into v_recent from private.checkout_admissions where client_hash=p_client_hash and admitted_at>clock_timestamp()-interval '15 minutes';
 if v_recent>=v_admission.max_recent_attempts then raise exception 'CHECKOUT_CLIENT_RATE_LIMIT'; end if;
 select count(*) into v_client_active from private.checkout_admissions a join public.orders o on o.id=a.order_id
 where a.client_hash=p_client_hash and o.status in ('pending','review') and exists(select 1 from public.inventory_reservations h where h.order_id=o.id and h.status='active' and h.expires_at>clock_timestamp());
 if v_client_active>=v_admission.max_client_active then raise exception 'CHECKOUT_CLIENT_ACTIVE_LIMIT'; end if;
 select count(distinct h.order_id) into v_store_active from public.inventory_reservations h join public.orders o on o.id=h.order_id
 where h.status='active' and h.expires_at>clock_timestamp() and o.status in ('pending','review');
 if v_store_active>=v_admission.max_store_active then raise exception 'CHECKOUT_STORE_ACTIVE_LIMIT'; end if;
 if p_attempt is null or p_fingerprint is null or p_fingerprint !~ '^[a-f0-9]{64}$' or p_lines is null or jsonb_typeof(p_lines)<>'array' or jsonb_array_length(p_lines) not between 1 and 20 then raise exception 'INVALID_CART';end if;
 if exists(select 1 from jsonb_to_recordset(p_lines) as i(product_id uuid,variant_id uuid,quantity integer,live_session_id uuid,kol_id uuid) where i.product_id is null or i.quantity is null or i.quantity not between 1 and 10 or (i.live_session_id is null)<>(i.kol_id is null)) then raise exception 'INVALID_CART';end if;
 for r in select i.product_id,i.variant_id,sum(i.quantity)::integer qty from jsonb_to_recordset(p_lines) as i(product_id uuid,variant_id uuid,quantity integer) group by i.product_id,i.variant_id order by i.product_id,i.variant_id nulls first loop
  perform 1 from public.products p where p.id=r.product_id and p.status='published' and not p.is_demo and p.price_amount>0 for update;
  if not found then raise exception 'PRODUCT_UNAVAILABLE';end if;
  if r.qty>10 then raise exception 'QUANTITY_LIMIT';end if;
  if r.variant_id is null then
   if exists(select 1 from public.product_variants v where v.product_id=r.product_id) then raise exception 'VARIANT_REQUIRED';end if;
   if (select p.stock_qty-coalesce((select sum(h.quantity) from public.inventory_reservations h where h.product_id=p.id and h.variant_id is null and h.status='active'),0) from public.products p where p.id=r.product_id)<r.qty then raise exception 'OUT_OF_STOCK';end if;
  else
   perform 1 from public.product_variants v where v.id=r.variant_id and v.product_id=r.product_id and v.active and not v.price_is_placeholder and v.stock_qty is not null and v.price_amount>0 for update;
   if not found then raise exception 'PRODUCT_UNAVAILABLE';end if;
   if (select v.stock_qty-coalesce((select sum(h.quantity) from public.inventory_reservations h where h.variant_id=v.id and h.status='active'),0) from public.product_variants v where v.id=r.variant_id)<r.qty then raise exception 'OUT_OF_STOCK';end if;
  end if;
 end loop;
 if exists(select 1 from jsonb_to_recordset(p_lines) as i(product_id uuid,quantity integer,live_session_id uuid,kol_id uuid) where i.live_session_id is not null and not exists(select 1 from public.live_sessions s join public.kols k on k.id=s.kol_id join public.live_products lp on lp.live_session_id=s.id where s.id=i.live_session_id and k.id=i.kol_id and k.status='active' and s.is_public and s.status in ('scheduled','live','ended') and lp.product_id=i.product_id)) then raise exception 'INVALID_ATTRIBUTION';end if;
 select min(p.currency),sum(coalesce(v.price_amount,p.price_amount)*i.quantity)::integer into v_currency,v_subtotal from jsonb_to_recordset(p_lines) as i(product_id uuid,variant_id uuid,quantity integer) join public.products p on p.id=i.product_id left join public.product_variants v on v.id=i.variant_id and v.product_id=p.id;
 if (select count(distinct p.currency) from jsonb_to_recordset(p_lines) as i(product_id uuid) join public.products p on p.id=i.product_id)<>1 or v_currency not in ('hkd','usd','sgd','myr','gbp','aud','cad','eur','cny') then raise exception 'UNSUPPORTED_CURRENCY';end if;
 v_expiry=clock_timestamp()+interval '40 minutes';
 insert into public.orders(checkout_attempt_id,cart_fingerprint,currency,subtotal_amount,reservation_expires_at,checkout_policy) values(p_attempt,p_fingerprint,v_currency,v_subtotal,v_expiry,p_policy) returning id into v_id;
 insert into public.order_items(order_id,product_id,variant_id,variant_options,sku,title,unit_amount,quantity,live_session_id,kol_id)
 select v_id,p.id,v.id,coalesce(v.option_values,'[]'::jsonb),coalesce(nullif(v.sku,''),p.sku),left(p.title||coalesce((select ' · '||string_agg(coalesce(opt->>'name','')||': '||coalesce(opt->>'value',''),' · ' order by ord) from jsonb_array_elements(v.option_values) with ordinality as x(opt,ord)),''),1000),coalesce(v.price_amount,p.price_amount),i.quantity,i.live_session_id,i.kol_id from jsonb_to_recordset(p_lines) as i(product_id uuid,variant_id uuid,quantity integer,live_session_id uuid,kol_id uuid) join public.products p on p.id=i.product_id left join public.product_variants v on v.id=i.variant_id and v.product_id=p.id;
 insert into public.inventory_reservations(order_id,product_id,variant_id,quantity,expires_at) select v_id,i.product_id,i.variant_id,sum(i.quantity),v_expiry from jsonb_to_recordset(p_lines) as i(product_id uuid,variant_id uuid,quantity integer) group by i.product_id,i.variant_id;
 insert into private.checkout_admissions(order_id,client_hash) values(v_id,p_client_hash);
 return v_id;
end;$$;

create or replace function public.process_checkout_event(p_event_id text,p_type text,p_order_id uuid,p_session_id text,p_facts jsonb)
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
 if o.status='refunded' then v_status='refunded';
 elsif o.stripe_checkout_session_id is distinct from p_session_id and o.stripe_checkout_session_id is not null then reason='session_mismatch';
 elsif o.status in ('refunded','review') then reason=coalesce(o.review_reason,'terminal_order');
 elsif p_type='checkout.session.expired' then
  if o.status='pending' then perform public.release_checkout(o.id,'provider_expired');end if;
  v_status='expired';
 elsif p_type='checkout.session.async_payment_failed' then
  -- A delayed failure must never downgrade a payment already confirmed.
  if o.status='paid' then v_status='paid';
  elsif o.status='pending' then
   update public.inventory_reservations set status='released',release_reason='payment_failed' where order_id=o.id and status='active';
   update public.orders set status='failed',review_reason='payment_failed' where id=o.id;
   v_status='failed';
  else v_status=o.status;end if;
 elsif p_type in ('checkout.session.completed','checkout.session.async_payment_succeeded') then
  if p_facts->>'payment_status' is distinct from 'paid' then v_status='unpaid';

  elsif exists(select 1 from public.checkout_events where payment_intent_id=p_facts->>'payment_intent_id' and outcome='review') then reason='refund_or_dispute_requires_manual_reconciliation';
  elsif nullif(p_facts->>'payment_intent_id','') is null then reason='missing_payment_intent';
  elsif o.status='paid' and o.stripe_payment_intent_id is distinct from p_facts->>'payment_intent_id' then reason='payment_intent_mismatch';
  elsif o.status='paid' then v_status='paid';
  elsif o.status<>'pending' or o.reservation_expires_at is null or o.reservation_expires_at<=clock_timestamp() then reason='late_paid_or_released';
  elsif not exists(select 1 from public.inventory_reservations where order_id=o.id) or exists(select 1 from public.inventory_reservations where order_id=o.id and (status<>'active' or expires_at<=clock_timestamp())) then reason='missing_active_reservation';
  else
   subtotal=(p_facts->>'amount_subtotal')::integer;total=(p_facts->>'amount_total')::integer;shipping=(p_facts->>'amount_shipping')::integer;tax=(p_facts->>'amount_tax')::integer;discount=(p_facts->>'amount_discount')::integer;
   if subtotal is null or total is null or shipping is null or tax is null or discount is null or subtotal<>o.subtotal_amount or shipping<0 or tax<0 or discount<>0 or total<>subtotal+shipping+tax or p_facts->>'currency' is distinct from o.currency then reason='amount_or_currency_mismatch';
   elsif exists(select 1 from public.inventory_reservations h join public.products p on p.id=h.product_id left join public.product_variants v on v.id=h.variant_id and v.product_id=h.product_id where h.order_id=o.id and ((h.variant_id is null and p.stock_qty<h.quantity) or (h.variant_id is not null and (v.id is null or v.stock_qty is null or v.stock_qty<h.quantity)))) then reason='inventory_invariant_broken';
   else
    update public.inventory_reservations set status='consumed' where order_id=o.id and status='active';
    update public.products p set stock_qty=p.stock_qty-h.quantity from public.inventory_reservations h where h.order_id=o.id and h.product_id=p.id and h.variant_id is null;
    update public.product_variants v set stock_qty=v.stock_qty-h.quantity from public.inventory_reservations h where h.order_id=o.id and h.variant_id=v.id;
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
commit;
