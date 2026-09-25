-- Bind new checkout attribution to published, active-host rooms. Existing frozen attempts retain their original snapshot.
begin;
create or replace function public.reserve_checkout(p_attempt uuid,p_fingerprint text,p_lines jsonb,p_policy jsonb)
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
 if exists(select 1 from jsonb_to_recordset(p_lines) as i(product_id uuid,quantity integer,live_session_id uuid,kol_id uuid) where i.live_session_id is not null and not exists(select 1 from public.live_sessions s join public.kols k on k.id=s.kol_id join public.live_products lp on lp.live_session_id=s.id where s.id=i.live_session_id and k.id=i.kol_id and k.status='active' and s.is_public and s.status in ('scheduled','live','ended') and lp.product_id=i.product_id)) then raise exception 'INVALID_ATTRIBUTION';end if;
 select min(p.currency),sum(p.price_amount*i.quantity)::integer into v_currency,v_subtotal from jsonb_to_recordset(p_lines) as i(product_id uuid,quantity integer) join public.products p on p.id=i.product_id;
 if (select count(distinct p.currency) from jsonb_to_recordset(p_lines) as i(product_id uuid) join public.products p on p.id=i.product_id)<>1 or v_currency not in ('hkd','usd','sgd','myr','gbp','aud','cad','eur','cny') then raise exception 'UNSUPPORTED_CURRENCY';end if;
 v_expiry=clock_timestamp()+interval '40 minutes';
 insert into public.orders(checkout_attempt_id,cart_fingerprint,currency,subtotal_amount,reservation_expires_at,checkout_policy) values(p_attempt,p_fingerprint,v_currency,v_subtotal,v_expiry,p_policy) returning id into v_id;
 insert into public.order_items(order_id,product_id,sku,title,unit_amount,quantity,live_session_id,kol_id)
 select v_id,p.id,p.sku,p.title,p.price_amount,i.quantity,i.live_session_id,i.kol_id from jsonb_to_recordset(p_lines) as i(product_id uuid,quantity integer,live_session_id uuid,kol_id uuid) join public.products p on p.id=i.product_id;
 insert into public.inventory_reservations(order_id,product_id,quantity,expires_at) select v_id,i.product_id,sum(i.quantity),v_expiry from jsonb_to_recordset(p_lines) as i(product_id uuid,quantity integer) group by i.product_id;
 return v_id;
end;$$;


revoke all on function public.reserve_checkout(uuid,text,jsonb,jsonb) from public,anon,authenticated;
grant execute on function public.reserve_checkout(uuid,text,jsonb,jsonb) to service_role;
commit;
