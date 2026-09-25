-- Checkout admission stays disabled until the owner explicitly configures it.
-- The HTTP layer verifies Turnstile and derives this opaque hash; raw IP is never stored.
begin;
create table private.checkout_admission_policy (
 singleton boolean primary key default true check(singleton),
 enabled boolean not null default false,
 max_recent_attempts integer not null default 5 check(max_recent_attempts between 1 and 100),
 max_client_active integer not null default 2 check(max_client_active between 1 and 20),
 max_store_active integer not null default 100 check(max_store_active between 1 and 10000),
 updated_by uuid references auth.users(id), updated_at timestamptz not null default now(),
 check(max_client_active<=max_store_active)
);
insert into private.checkout_admission_policy(singleton) values(true);
create table private.checkout_admissions (
 order_id uuid primary key references public.orders(id) on delete restrict,
 client_hash text not null check(client_hash ~ '^[a-f0-9]{64}$'),
 admitted_at timestamptz not null default clock_timestamp()
);
create index checkout_admissions_client_window_idx on private.checkout_admissions(client_hash,admitted_at desc);
create table private.checkout_admission_policy_audit (
 id bigint generated always as identity primary key, actor_id uuid not null references auth.users(id),
 before_policy jsonb not null, after_policy jsonb not null, created_at timestamptz not null default now()
);
alter table private.checkout_admission_policy enable row level security;
alter table private.checkout_admissions enable row level security;
alter table private.checkout_admission_policy_audit enable row level security;
revoke all on private.checkout_admission_policy,private.checkout_admissions,private.checkout_admission_policy_audit from public,anon,authenticated;
grant select,update on private.checkout_admission_policy to service_role;
grant select,insert on private.checkout_admissions,private.checkout_admission_policy_audit to service_role;
grant usage,select on sequence private.checkout_admission_policy_audit_id_seq to service_role;

create function public.checkout_admission_policy_get(p_actor uuid) returns jsonb
language plpgsql security invoker set search_path='' as $$
declare r text; p private.checkout_admission_policy;
begin
 select role into r from public.staff_members where user_id=p_actor and active for share;
 if r is distinct from 'super_admin' then raise exception 'STAFF_FORBIDDEN'; end if;
 select * into p from private.checkout_admission_policy where singleton;
 if not found then raise exception 'CHECKOUT_ADMISSION_DISABLED'; end if;
 return jsonb_build_object('enabled',p.enabled,'max_recent_attempts',p.max_recent_attempts,'max_client_active',p.max_client_active,'max_store_active',p.max_store_active,'window_seconds',900,'reservation_seconds',2400,'updated_at',p.updated_at);
end;$$;
create function public.checkout_admission_policy_set(p_actor uuid,p_enabled boolean,p_max_recent integer,p_max_client_active integer,p_max_store_active integer) returns jsonb
language plpgsql security invoker set search_path='' as $$
declare r text; previous jsonb; result jsonb;
begin
 perform pg_catalog.pg_advisory_xact_lock(73219023);
 select role into r from public.staff_members where user_id=p_actor and active for share;
 if r is distinct from 'super_admin' then raise exception 'STAFF_FORBIDDEN'; end if;
 if p_enabled is null or p_max_recent is null or p_max_recent not between 1 and 100 or p_max_client_active is null or p_max_client_active not between 1 and 20 or p_max_store_active is null or p_max_store_active not between 1 and 10000 or p_max_client_active>p_max_store_active then raise exception 'INVALID_ADMISSION_POLICY'; end if;
 previous=public.checkout_admission_policy_get(p_actor);
 update private.checkout_admission_policy set enabled=p_enabled,max_recent_attempts=p_max_recent,max_client_active=p_max_client_active,max_store_active=p_max_store_active,updated_by=p_actor,updated_at=clock_timestamp() where singleton;
 result=public.checkout_admission_policy_get(p_actor);
 insert into private.checkout_admission_policy_audit(actor_id,before_policy,after_policy) values(p_actor,previous,result);
 return result;
end;$$;

-- Retire both execution and behavior of the old signature. Even a database owner
-- calling it directly receives a closed gate instead of an unmetered reservation.
create or replace function public.reserve_checkout(p_attempt uuid,p_fingerprint text,p_lines jsonb,p_policy jsonb)
returns uuid language plpgsql security invoker set search_path='' as $$
begin raise exception 'CHECKOUT_ADMISSION_REQUIRED'; end;$$;
revoke all on function public.reserve_checkout(uuid,text,jsonb,jsonb) from public,anon,authenticated,service_role;

create function public.reserve_checkout(p_attempt uuid,p_fingerprint text,p_lines jsonb,p_policy jsonb,p_client_hash text)
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
 if exists(select 1 from jsonb_to_recordset(p_lines) as i(product_id uuid,quantity integer,live_session_id uuid,kol_id uuid) where i.product_id is null or i.quantity is null or i.quantity not between 1 and 10 or (i.live_session_id is null)<>(i.kol_id is null)) then raise exception 'INVALID_CART';end if;
 for r in select i.product_id,sum(i.quantity)::integer qty from jsonb_to_recordset(p_lines) as i(product_id uuid,quantity integer) group by i.product_id order by i.product_id loop
  perform 1 from public.products p where p.id=r.product_id and p.status='published' and not p.is_demo and p.price_amount>0 for update;
  if not found then raise exception 'PRODUCT_UNAVAILABLE';end if;
  if r.qty>10 then raise exception 'QUANTITY_LIMIT';end if;
  if (select p.stock_qty-coalesce((select sum(h.quantity) from public.inventory_reservations h where h.product_id=p.id and h.status='active'),0) from public.products p where p.id=r.product_id)<r.qty then raise exception 'OUT_OF_STOCK';end if;
 end loop;
 if exists(select 1 from jsonb_to_recordset(p_lines) as i(product_id uuid,quantity integer,live_session_id uuid,kol_id uuid) where i.live_session_id is not null and not exists(select 1 from public.live_sessions s join public.kols k on k.id=s.kol_id join public.live_products lp on lp.live_session_id=s.id where s.id=i.live_session_id and k.id=i.kol_id and k.status='active' and s.is_public and s.status in ('scheduled','live','ended') and lp.product_id=i.product_id)) then raise exception 'INVALID_ATTRIBUTION';end if;
 select min(p.currency),sum(p.price_amount*i.quantity)::integer into v_currency,v_subtotal from jsonb_to_recordset(p_lines) as i(product_id uuid,quantity integer) join public.products p on p.id=i.product_id;
 if (select count(distinct p.currency) from jsonb_to_recordset(p_lines) as i(product_id uuid) join public.products p on p.id=i.product_id)<>1 or v_currency not in ('hkd','usd','sgd','myr','gbp','aud','cad','eur','cny') then raise exception 'UNSUPPORTED_CURRENCY';end if;
 v_expiry=clock_timestamp()+interval '40 minutes';
 insert into public.orders(checkout_attempt_id,cart_fingerprint,currency,subtotal_amount,reservation_expires_at,checkout_policy) values(p_attempt,p_fingerprint,v_currency,v_subtotal,v_expiry,p_policy) returning id into v_id;
 insert into public.order_items(order_id,product_id,sku,title,unit_amount,quantity,live_session_id,kol_id)
 select v_id,p.id,p.sku,p.title,p.price_amount,i.quantity,i.live_session_id,i.kol_id from jsonb_to_recordset(p_lines) as i(product_id uuid,quantity integer,live_session_id uuid,kol_id uuid) join public.products p on p.id=i.product_id;
 insert into public.inventory_reservations(order_id,product_id,quantity,expires_at) select v_id,i.product_id,sum(i.quantity),v_expiry from jsonb_to_recordset(p_lines) as i(product_id uuid,quantity integer) group by i.product_id;
 insert into private.checkout_admissions(order_id,client_hash) values(v_id,p_client_hash);
 return v_id;
end;$$;

revoke all on function public.reserve_checkout(uuid,text,jsonb,jsonb,text),public.checkout_admission_policy_get(uuid),public.checkout_admission_policy_set(uuid,boolean,integer,integer,integer) from public,anon,authenticated;
grant execute on function public.reserve_checkout(uuid,text,jsonb,jsonb,text),public.checkout_admission_policy_get(uuid),public.checkout_admission_policy_set(uuid,boolean,integer,integer,integer) to service_role;
commit;
