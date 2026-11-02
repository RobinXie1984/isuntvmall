-- Sandbox candidate only. Production migration requires explicit approval.
-- Dynamic methods use the same amount, identity, reservation and replay checks.
begin;
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

commit;
