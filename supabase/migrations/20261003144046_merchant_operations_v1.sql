-- Single-merchant operational stock and financial command ledger.
-- No identity, account credential, payment, stock or provider action is provisioned.
begin;
alter table public.products add column inventory_revision integer not null default 1 check(inventory_revision>0);
create function private.bump_inventory_revision() returns trigger
language plpgsql security invoker set search_path='' as $$
begin
 if new.stock_qty is distinct from old.stock_qty then new.inventory_revision=old.inventory_revision+1;
 else new.inventory_revision=old.inventory_revision; end if;
 return new;
end;$$;
create trigger products_inventory_revision before update of stock_qty,inventory_revision on public.products for each row execute function private.bump_inventory_revision();

create table private.stock_adjustment_audit (
 id uuid primary key default gen_random_uuid(), actor_id uuid not null references auth.users(id),
 product_id uuid not null references public.products(id), request_id uuid not null, request_fingerprint text not null,
 before_qty integer not null, after_qty integer not null, reserved_qty integer not null, revision integer not null,
 reason text not null, created_at timestamptz not null default clock_timestamp(), unique(actor_id,request_id)
);
create function public.stock_list(p_actor uuid,p_page integer default 0,p_search text default '') returns jsonb
language plpgsql security invoker set search_path='' as $$
declare r text; total bigint; items jsonb;
begin
 select role into r from public.staff_members where user_id=p_actor and active for share;
 if r is null or r not in ('super_admin','admin','operator') then raise exception 'STOCK_FORBIDDEN';end if;
 if p_page is null or p_page not between 0 and 100000 or p_search is null or length(p_search)>120 then raise exception 'INVALID_STOCK_FILTER';end if;
 select count(*) into total from public.products p where p_search='' or p.sku ilike '%'||p_search||'%' or p.title ilike '%'||p_search||'%';
 select coalesce(jsonb_agg(x.payload order by x.sku,x.id),'[]'::jsonb) into items from(
 select p.id,p.sku,jsonb_build_object('id',p.id,'sku',p.sku,'title',p.title,'status',p.status,'isDemo',p.is_demo,'stockQty',p.stock_qty,'reservedQty',h.qty,'availableQty',p.stock_qty-h.qty,'revision',p.inventory_revision) payload
 from public.products p cross join lateral(select coalesce(sum(quantity),0)::integer qty from public.inventory_reservations where product_id=p.id and status='active')h
 where p_search='' or p.sku ilike '%'||p_search||'%' or p.title ilike '%'||p_search||'%' order by p.sku,p.id limit 25 offset p_page*25)x;
 return jsonb_build_object('items',items,'count',total,'page',p_page);
end;$$;
create function public.stock_adjust(p_actor uuid,p_product uuid,p_revision integer,p_request uuid,p_stock_qty integer,p_reason text) returns jsonb
language plpgsql security invoker set search_path='' as $$
declare r text;p public.products; prior private.stock_adjustment_audit; fp text; held integer; rev integer;
begin
 select role into r from public.staff_members where user_id=p_actor and active for share;
 if r is null or r not in ('super_admin','admin','operator') then raise exception 'STOCK_FORBIDDEN';end if;
 if p_request is null or p_product is null or p_revision is null or p_revision<1 or p_stock_qty is null or p_stock_qty not between 0 and 1000000000 or p_reason is null or length(trim(p_reason)) not between 1 and 1000 then raise exception 'INVALID_STOCK_ADJUSTMENT';end if;
 perform pg_catalog.pg_advisory_xact_lock(73219023);
 fp=md5(jsonb_build_array(p_product,p_revision,p_stock_qty,trim(p_reason))::text);
 select * into prior from private.stock_adjustment_audit where actor_id=p_actor and request_id=p_request;
 if found then
  if prior.request_fingerprint<>fp then raise exception 'REQUEST_CHANGED';end if;
  return jsonb_build_object('productId',prior.product_id,'stockQty',prior.after_qty,'reservedQty',prior.reserved_qty,'availableQty',prior.after_qty-prior.reserved_qty,'revision',prior.revision,'replayed',true);
 end if;
 select * into p from public.products where id=p_product for update;
 if not found then raise exception 'PRODUCT_NOT_FOUND';end if;
 if p.inventory_revision<>p_revision then raise exception 'STALE_STOCK_REVISION';end if;
 select coalesce(sum(quantity),0)::integer into held from public.inventory_reservations where product_id=p.id and status='active';
 if p_stock_qty<held then raise exception 'STOCK_BELOW_RESERVATIONS';end if;
 update public.products set stock_qty=p_stock_qty where id=p.id returning inventory_revision into rev;
 insert into private.stock_adjustment_audit(actor_id,product_id,request_id,request_fingerprint,before_qty,after_qty,reserved_qty,revision,reason)
 values(p_actor,p.id,p_request,fp,p.stock_qty,p_stock_qty,held,rev,trim(p_reason));
 return jsonb_build_object('productId',p.id,'stockQty',p_stock_qty,'reservedQty',held,'availableQty',p_stock_qty-held,'revision',rev,'replayed',false);
end;$$;

create table private.finance_reconciliation_snapshots (
 id uuid primary key default gen_random_uuid(),order_id uuid not null references public.orders(id),
 actor_id uuid not null references auth.users(id),account_id text not null,livemode boolean not null,
 payment_intent_id text not null,charge_id text not null,currency text not null,
 amount_captured integer not null check(amount_captured>0),amount_refunded integer not null check(amount_refunded>=0 and amount_refunded<=amount_captured),
 facts jsonb not null,checked_at timestamptz not null,created_at timestamptz not null default clock_timestamp()
);
create index finance_snapshot_order_idx on private.finance_reconciliation_snapshots(order_id,created_at desc,id);
create table private.finance_refund_commands (
 id uuid primary key default gen_random_uuid(),order_id uuid not null references public.orders(id),
 refund_request_id uuid not null references public.refund_requests(id),requested_by uuid not null references auth.users(id),
 request_id uuid not null,request_fingerprint text not null,snapshot_id uuid not null references private.finance_reconciliation_snapshots(id),
 account_id text not null,livemode boolean not null,payment_intent_id text not null,charge_id text not null,
 amount integer not null check(amount>0),currency text not null,expected_refunded_before integer not null check(expected_refunded_before>=0),
 idempotency_key text not null unique,status text not null default 'prepared' check(status in ('prepared','processing','unknown','pending','succeeded','failed','canceled')),
 provider_refund_id text,lease_token uuid,lease_until timestamptz,first_attempt_at timestamptz,
 last_error_code text,created_at timestamptz not null default clock_timestamp(),updated_at timestamptz not null default clock_timestamp(),
 unique(requested_by,request_id),unique(account_id,livemode,provider_refund_id)
);
create unique index one_active_full_refund on private.finance_refund_commands(order_id) where status in ('prepared','processing','unknown','pending');
create table private.finance_events (
 account_id text not null,livemode boolean not null,event_id text not null,event_type text not null,
 command_id uuid references private.finance_refund_commands(id),request_fingerprint text not null,
 facts jsonb not null,outcome text not null,received_at timestamptz not null default clock_timestamp(),
 primary key(account_id,livemode,event_id)
);
create table private.finance_audit (
 id bigint generated always as identity primary key,actor_id uuid references auth.users(id),
 order_id uuid references public.orders(id),command_id uuid references private.finance_refund_commands(id),
 source text not null check(source in ('staff','webhook')),action text not null,detail jsonb not null default '{}'::jsonb,
 created_at timestamptz not null default clock_timestamp(),check((source='staff' and actor_id is not null) or (source='webhook' and actor_id is null))
);
create function private.finance_require_actor(p_actor uuid) returns void
language plpgsql security invoker set search_path='' as $$
begin
 if not exists(select 1 from public.staff_members where user_id=p_actor and active and role='super_admin' for share) then raise exception 'FINANCE_FORBIDDEN';end if;
end;$$;
create function private.finance_check_order(p_order uuid,p_account_id text,p_livemode boolean,p_payment_intent text) returns public.orders
language plpgsql security invoker set search_path='' as $$
declare o public.orders;
begin
 select * into o from public.orders where id=p_order for update;
 if not found then raise exception 'ORDER_NOT_FOUND';end if;
 if p_account_id is null or p_account_id !~ '^acct_[A-Za-z0-9]+$' or p_livemode is null or p_payment_intent is null or p_payment_intent !~ '^pi_[A-Za-z0-9]+$'
 or o.checkout_policy#>>'{payment,accountId}' is distinct from p_account_id
 or o.checkout_policy#>'{payment,livemode}' is distinct from to_jsonb(p_livemode)
 or o.stripe_payment_intent_id is distinct from p_payment_intent then raise exception 'PAYMENT_IDENTITY_MISMATCH';end if;
 return o;
end;$$;
create function public.finance_record_reconciliation(p_actor uuid,p_order uuid,p_account_id text,p_livemode boolean,p_facts jsonb) returns jsonb
language plpgsql security invoker set search_path='' as $$
declare o public.orders;s private.finance_reconciliation_snapshots;captured integer;refunded integer;checked timestamptz;normalized jsonb;rr jsonb;
begin
 perform private.finance_require_actor(p_actor);
 perform pg_catalog.pg_advisory_xact_lock(73219023);
 o=private.finance_check_order(p_order,p_account_id,p_livemode,p_facts->>'paymentIntentId');
 if jsonb_typeof(p_facts) is distinct from 'object' or octet_length(p_facts::text)>20000 or p_facts->>'paymentStatus' is distinct from 'succeeded'
 or p_facts->>'currency' is distinct from o.currency or coalesce(p_facts->>'chargeId' !~ '^ch_[A-Za-z0-9]+$',true)
 or coalesce(p_facts->>'amountCaptured' !~ '^[1-9][0-9]{0,9}$',true) or coalesce(p_facts->>'amountRefunded' !~ '^(0|[1-9][0-9]{0,9})$',true)
 or o.paid_at is null or o.total_amount is null then raise exception 'INVALID_RECONCILIATION';end if;
 captured=(p_facts->>'amountCaptured')::integer;refunded=(p_facts->>'amountRefunded')::integer;checked=(p_facts->>'checkedAt')::timestamptz;
 if captured is distinct from o.total_amount or refunded>captured or checked is null or checked<clock_timestamp()-interval '5 minutes' or checked>clock_timestamp()+interval '30 seconds' then raise exception 'INVALID_RECONCILIATION';end if;
 if jsonb_typeof(p_facts->'refunds') is distinct from 'array' or jsonb_array_length(p_facts->'refunds')>100 then raise exception 'INVALID_RECONCILIATION';end if;
 for rr in select value from jsonb_array_elements(p_facts->'refunds') loop
  if jsonb_typeof(rr) is distinct from 'object' or coalesce(rr->>'id' !~ '^re_[A-Za-z0-9]+$',true) or coalesce(rr->>'amount' !~ '^[1-9][0-9]{0,9}$',true)
  or rr->>'currency' is distinct from o.currency or coalesce(rr->>'status' not in ('pending','requires_action','succeeded','failed','canceled'),true) then raise exception 'INVALID_RECONCILIATION';end if;
 end loop;
 if (p_facts?'fee' and p_facts->'fee'<>'null'::jsonb and coalesce(p_facts->>'fee' !~ '^[0-9]{1,10}$',true))
 or (p_facts?'net' and p_facts->'net'<>'null'::jsonb and coalesce(p_facts->>'net' !~ '^-?[0-9]{1,10}$',true))
 or (nullif(p_facts->>'balanceTransactionId','') is not null and p_facts->>'balanceTransactionId' !~ '^txn_[A-Za-z0-9]+$') then raise exception 'INVALID_RECONCILIATION';end if;
 normalized=jsonb_build_object('paymentIntentId',p_facts->>'paymentIntentId','chargeId',p_facts->>'chargeId','currency',o.currency,'amountCaptured',captured,'amountRefunded',refunded,'paymentStatus','succeeded','checkedAt',checked,
 'fee',p_facts->'fee','net',p_facts->'net','balanceTransactionId',nullif(p_facts->>'balanceTransactionId',''),
 'refunds',(select coalesce(jsonb_agg(jsonb_build_object('id',value->>'id','amount',(value->>'amount')::integer,'currency',value->>'currency','status',value->>'status')),'[]'::jsonb) from jsonb_array_elements(p_facts->'refunds')));
 insert into private.finance_reconciliation_snapshots(order_id,actor_id,account_id,livemode,payment_intent_id,charge_id,currency,amount_captured,amount_refunded,facts,checked_at)
 values(o.id,p_actor,p_account_id,p_livemode,p_facts->>'paymentIntentId',p_facts->>'chargeId',o.currency,captured,refunded,normalized,checked) returning * into s;
 insert into private.finance_audit(actor_id,order_id,source,action,detail) values(p_actor,o.id,'staff','reconciliation_recorded',jsonb_build_object('snapshotId',s.id));
 return to_jsonb(s);
end;$$;

create function public.finance_refund_prepare(p_actor uuid,p_order uuid,p_refund_request uuid,p_request uuid) returns jsonb
language plpgsql security invoker set search_path='' as $$
declare o public.orders;s private.finance_reconciliation_snapshots;c private.finance_refund_commands;f public.refund_requests;fp text;cid uuid;
begin
 perform private.finance_require_actor(p_actor);
 if p_request is null or p_order is null or p_refund_request is null then raise exception 'INVALID_REFUND_COMMAND';end if;
 perform pg_catalog.pg_advisory_xact_lock(73219023);
 fp=md5(jsonb_build_array(p_order,p_refund_request)::text);
 select * into c from private.finance_refund_commands where requested_by=p_actor and request_id=p_request;
 if found then
  if c.request_fingerprint<>fp then raise exception 'REQUEST_CHANGED';end if;
  return to_jsonb(c)||jsonb_build_object('replayed',true);
 end if;
 select * into o from public.orders where id=p_order for update;
 if not found then raise exception 'ORDER_NOT_FOUND';end if;
 if o.status='refunded' or exists(select 1 from private.finance_refund_commands where order_id=o.id and status='succeeded') then raise exception 'REFUND_ALREADY_COMPLETED';end if;
 if o.status not in ('paid','review') or o.paid_at is null or o.total_amount is null then raise exception 'PAID_ORDER_REQUIRED';end if;
 select * into f from public.refund_requests where id=p_refund_request and order_id=o.id and status='approved' for share;
 if not found then raise exception 'REFUND_APPROVAL_REQUIRED';end if;
 if exists(select 1 from private.finance_refund_commands where order_id=o.id and status in ('prepared','processing','unknown','pending')) then raise exception 'REFUND_IN_PROGRESS';end if;
 select * into s from private.finance_reconciliation_snapshots where order_id=o.id order by created_at desc,id desc limit 1;
 if not found or s.checked_at<clock_timestamp()-interval '5 minutes' then raise exception 'RECONCILIATION_REQUIRED';end if;
 perform private.finance_check_order(o.id,s.account_id,s.livemode,s.payment_intent_id);
 if s.amount_captured is distinct from o.total_amount or s.amount_refunded>=s.amount_captured then raise exception 'REFUND_ALREADY_COMPLETED';end if;
 if exists(select 1 from jsonb_array_elements(s.facts->'refunds') r where r->>'status' in ('pending','requires_action')) then raise exception 'REFUND_IN_PROGRESS';end if;
 cid=gen_random_uuid();
 insert into private.finance_refund_commands(id,order_id,refund_request_id,requested_by,request_id,request_fingerprint,snapshot_id,account_id,livemode,payment_intent_id,charge_id,amount,currency,expected_refunded_before,idempotency_key)
 values(cid,o.id,f.id,p_actor,p_request,fp,s.id,s.account_id,s.livemode,s.payment_intent_id,s.charge_id,s.amount_captured-s.amount_refunded,s.currency,s.amount_refunded,'isuntvmall-refund-'||cid::text) returning * into c;
 insert into private.finance_audit(actor_id,order_id,command_id,source,action) values(p_actor,o.id,c.id,'staff','refund_prepared');
 return to_jsonb(c)||jsonb_build_object('replayed',false);
end;$$;

create function public.finance_refund_claim(p_actor uuid,p_command uuid) returns jsonb
language plpgsql security invoker set search_path='' as $$
declare c private.finance_refund_commands; action text;
begin
 perform private.finance_require_actor(p_actor);
 perform pg_catalog.pg_advisory_xact_lock(73219023);
 select * into c from private.finance_refund_commands where id=p_command for update;
 if not found then raise exception 'REFUND_COMMAND_NOT_FOUND';end if;
 perform private.finance_check_order(c.order_id,c.account_id,c.livemode,c.payment_intent_id);
 if c.status in ('succeeded','failed','canceled') then return to_jsonb(c)||jsonb_build_object('action','none');end if;
 if c.status='processing' and c.lease_until>clock_timestamp() then raise exception 'FINANCE_BUSY';end if;
 action=case when c.provider_refund_id is not null or c.status='pending' or (c.first_attempt_at is not null and c.first_attempt_at<=clock_timestamp()-interval '23 hours') then 'reconcile' else 'create' end;
 update private.finance_refund_commands set status='processing',lease_token=gen_random_uuid(),lease_until=clock_timestamp()+interval '2 minutes',first_attempt_at=coalesce(first_attempt_at,clock_timestamp()),updated_at=clock_timestamp() where id=c.id returning * into c;
 insert into private.finance_audit(actor_id,order_id,command_id,source,action,detail) values(p_actor,c.order_id,c.id,'staff','refund_claimed',jsonb_build_object('action',action));
 return to_jsonb(c)||jsonb_build_object('action',action);
end;$$;

-- The trusted provider adapter supplies normalized verified current facts. No browser grant.
create function private.finance_apply_refund(p_command uuid,p_facts jsonb) returns jsonb
language plpgsql security invoker set search_path='' as $$
declare c private.finance_refund_commands;o public.orders;provider_status text;rid text;
begin
 select * into c from private.finance_refund_commands where id=p_command for update;
 if not found then raise exception 'REFUND_COMMAND_NOT_FOUND';end if;
 o=private.finance_check_order(c.order_id,c.account_id,c.livemode,c.payment_intent_id);
 if jsonb_typeof(p_facts) is distinct from 'object' or octet_length(p_facts::text)>8000
 or p_facts->>'accountId' is distinct from c.account_id or p_facts->'livemode' is distinct from to_jsonb(c.livemode)
 or p_facts->>'paymentIntentId' is distinct from c.payment_intent_id or p_facts->>'currency' is distinct from c.currency
 or p_facts->'amount' is distinct from to_jsonb(c.amount) or coalesce(p_facts->>'refundId' !~ '^re_[A-Za-z0-9]+$',true)
 or coalesce(p_facts->>'status' not in ('pending','requires_action','succeeded','failed','canceled'),true) then raise exception 'REFUND_FACTS_MISMATCH';end if;
 rid=p_facts->>'refundId';provider_status=case when p_facts->>'status'='requires_action' then 'pending' else p_facts->>'status' end;
 if c.provider_refund_id is not null and c.provider_refund_id<>rid then raise exception 'REFUND_ID_MISMATCH';end if;
 -- A stale pending/failed delivery must never erase confirmed monetary success.
 if c.status='succeeded' or (c.status in ('failed','canceled') and provider_status='pending') then return to_jsonb(c);end if;
 update private.finance_refund_commands set status=provider_status,provider_refund_id=rid,lease_token=null,lease_until=null,last_error_code=null,updated_at=clock_timestamp() where id=c.id returning * into c;
 if provider_status='succeeded' then
  if c.expected_refunded_before+c.amount is distinct from o.total_amount or o.paid_at is null then raise exception 'REFUND_TOTAL_MISMATCH';end if;
  update public.orders set status='refunded' where id=o.id;
 end if;
 return to_jsonb(c);
end;$$;
create function public.finance_refund_complete(p_actor uuid,p_command uuid,p_lease uuid,p_outcome text,p_facts jsonb default '{}'::jsonb,p_error_code text default null) returns jsonb
language plpgsql security invoker set search_path='' as $$
declare c private.finance_refund_commands;result jsonb;
begin
 perform private.finance_require_actor(p_actor);
 perform pg_catalog.pg_advisory_xact_lock(73219023);
 select * into c from private.finance_refund_commands where id=p_command for update;
 if not found then raise exception 'REFUND_COMMAND_NOT_FOUND';end if;
 if c.status='succeeded' then return to_jsonb(c);end if;
 if c.status<>'processing' or p_lease is null or c.lease_token is distinct from p_lease or c.lease_until<=clock_timestamp() then raise exception 'STALE_FINANCE_LEASE';end if;
 if p_outcome is null or p_outcome not in ('unknown','pending','succeeded','failed','canceled') or (p_error_code is not null and p_error_code !~ '^[A-Z0-9_]{1,120}$') then raise exception 'INVALID_REFUND_OUTCOME';end if;
 if p_outcome='failed' and coalesce(p_facts->>'refundId','')='' and c.provider_refund_id is not null then raise exception 'REFUND_FACTS_MISMATCH';end if;
 if p_outcome='unknown' or (p_outcome='failed' and coalesce(p_facts->>'refundId','')='') then
  -- Only the adapter may classify a definite no-refund rejection as failed.
  -- Timeouts/network ambiguity MUST use unknown and preserve this command/key.
  update private.finance_refund_commands set status=p_outcome,lease_token=null,lease_until=null,last_error_code=p_error_code,updated_at=clock_timestamp() where id=c.id returning * into c;
  result=to_jsonb(c);
 else
  if (case when p_facts->>'status'='requires_action' then 'pending' else p_facts->>'status' end) is distinct from p_outcome then raise exception 'REFUND_FACTS_MISMATCH';end if;
  result=private.finance_apply_refund(c.id,p_facts);
 end if;
 insert into private.finance_audit(actor_id,order_id,command_id,source,action,detail) values(p_actor,c.order_id,c.id,'staff','refund_outcome_recorded',jsonb_build_object('outcome',p_outcome,'errorCode',p_error_code));
 return result;
end;$$;
create function public.finance_refund_event(p_event_id text,p_event_type text,p_account_id text,p_livemode boolean,p_command uuid,p_facts jsonb) returns jsonb
language plpgsql security invoker set search_path='' as $$
declare c private.finance_refund_commands;prior private.finance_events;fp text;normalized jsonb;result jsonb;
begin
 if p_event_id is null or p_event_id !~ '^evt_[A-Za-z0-9]+$' or p_event_type is null or p_event_type not in ('refund.created','refund.updated','refund.failed','charge.refunded')
 or p_account_id is null or p_account_id !~ '^acct_[A-Za-z0-9]+$' or p_livemode is null or jsonb_typeof(p_facts) is distinct from 'object'
 or p_facts->>'accountId' is distinct from p_account_id or p_facts->'livemode' is distinct from to_jsonb(p_livemode)
 or coalesce(p_facts->>'paymentIntentId' !~ '^pi_[A-Za-z0-9]+$',true) or coalesce(p_facts->>'refundId' !~ '^re_[A-Za-z0-9]+$',true)
 or coalesce(p_facts->>'amount' !~ '^[1-9][0-9]{0,9}$',true) or coalesce(p_facts->>'currency' !~ '^[a-z]{3}$',true)
 or coalesce(p_facts->>'status' not in ('pending','requires_action','succeeded','failed','canceled'),true) then raise exception 'INVALID_FINANCE_EVENT';end if;
 normalized=jsonb_build_object('accountId',p_account_id,'livemode',p_livemode,'paymentIntentId',p_facts->>'paymentIntentId','refundId',p_facts->>'refundId','amount',(p_facts->>'amount')::integer,'currency',p_facts->>'currency','status',p_facts->>'status');
 -- Provider status may advance between retries when the adapter refreshes facts.
 -- Deduplicate immutable event/object identity, not a stale status snapshot.
 fp=md5(jsonb_build_array(p_event_type,p_command,normalized-'status')::text);
 perform pg_catalog.pg_advisory_xact_lock(73219023);
 select * into prior from private.finance_events where account_id=p_account_id and livemode=p_livemode and event_id=p_event_id;
 if found and prior.request_fingerprint<>fp then raise exception 'EVENT_CHANGED';end if;
 if found and prior.outcome<>'unmatched' then return jsonb_build_object('outcome',prior.outcome,'command_id',prior.command_id,'replayed',true);end if;
 if p_command is not null then select * into c from private.finance_refund_commands where id=p_command for update;
 else select * into c from private.finance_refund_commands where account_id=p_account_id and livemode=p_livemode and provider_refund_id=p_facts->>'refundId' for update;end if;
 if c.id is null then
  insert into private.finance_events(account_id,livemode,event_id,event_type,request_fingerprint,facts,outcome) values(p_account_id,p_livemode,p_event_id,p_event_type,fp,normalized,'unmatched') on conflict(account_id,livemode,event_id) do nothing;
  return jsonb_build_object('outcome','unmatched','command_id',null,'replayed',prior.event_id is not null);
 end if;
 result=private.finance_apply_refund(c.id,normalized);
 insert into private.finance_events(account_id,livemode,event_id,event_type,command_id,request_fingerprint,facts,outcome)
 values(p_account_id,p_livemode,p_event_id,p_event_type,c.id,fp,normalized,result->>'status')
 on conflict(account_id,livemode,event_id) do update set command_id=excluded.command_id,outcome=excluded.outcome;
 insert into private.finance_audit(order_id,command_id,source,action,detail) values(c.order_id,c.id,'webhook','refund_event_recorded',jsonb_build_object('eventId',p_event_id,'status',result->>'status'));
 return jsonb_build_object('outcome',result->>'status','command_id',c.id,'replayed',false);
end;$$;
create function public.finance_list(p_actor uuid,p_page integer default 0) returns jsonb
language plpgsql security invoker set search_path='' as $$
declare result jsonb;total bigint;
begin
 perform private.finance_require_actor(p_actor);
 if p_page is null or p_page not between 0 and 100000 then raise exception 'INVALID_FINANCE_FILTER';end if;
 select count(*) into total from public.orders where stripe_payment_intent_id is not null;
 select coalesce(jsonb_agg(x.payload order by x.created_at desc,x.id),'[]'::jsonb) into result from(
 select o.id,o.created_at,jsonb_build_object('id',o.id,'status',o.status,'currency',o.currency,'total_amount',o.total_amount,'payment_intent_id',o.stripe_payment_intent_id,'payment',o.checkout_policy->'payment','created_at',o.created_at,'review_reason',o.review_reason,
 'snapshot',(select to_jsonb(s) from private.finance_reconciliation_snapshots s where s.order_id=o.id order by s.created_at desc,s.id desc limit 1),
 'refund_requests',(select coalesce(jsonb_agg(jsonb_build_object('id',f.id,'status',f.status,'created_at',f.created_at) order by f.created_at),'[]'::jsonb) from public.refund_requests f where f.order_id=o.id),
 'commands',(select coalesce(jsonb_agg(to_jsonb(c) order by c.created_at),'[]'::jsonb) from private.finance_refund_commands c where c.order_id=o.id)) payload
 from public.orders o where o.stripe_payment_intent_id is not null order by o.created_at desc,o.id limit 25 offset p_page*25)x;
 return jsonb_build_object('items',result,'count',total,'page',p_page);
end;$$;

alter table private.stock_adjustment_audit enable row level security;
alter table private.finance_reconciliation_snapshots enable row level security;
alter table private.finance_refund_commands enable row level security;
alter table private.finance_events enable row level security;
alter table private.finance_audit enable row level security;
revoke all on private.stock_adjustment_audit,private.finance_reconciliation_snapshots,private.finance_refund_commands,private.finance_events,private.finance_audit from public,anon,authenticated;
grant select,insert on private.stock_adjustment_audit,private.finance_reconciliation_snapshots,private.finance_audit to service_role;
grant select,insert,update on private.finance_refund_commands,private.finance_events to service_role;
grant usage,select on sequence private.finance_audit_id_seq to service_role;
revoke all on function private.bump_inventory_revision(),private.finance_require_actor(uuid),private.finance_check_order(uuid,text,boolean,text),private.finance_apply_refund(uuid,jsonb),public.stock_list(uuid,integer,text),public.stock_adjust(uuid,uuid,integer,uuid,integer,text),public.finance_record_reconciliation(uuid,uuid,text,boolean,jsonb),public.finance_refund_prepare(uuid,uuid,uuid,uuid),public.finance_refund_claim(uuid,uuid),public.finance_refund_complete(uuid,uuid,uuid,text,jsonb,text),public.finance_refund_event(text,text,text,boolean,uuid,jsonb),public.finance_list(uuid,integer) from public,anon,authenticated;
grant execute on function private.bump_inventory_revision(),private.finance_require_actor(uuid),private.finance_check_order(uuid,text,boolean,text),private.finance_apply_refund(uuid,jsonb),public.stock_list(uuid,integer,text),public.stock_adjust(uuid,uuid,integer,uuid,integer,text),public.finance_record_reconciliation(uuid,uuid,text,boolean,jsonb),public.finance_refund_prepare(uuid,uuid,uuid,uuid),public.finance_refund_claim(uuid,uuid),public.finance_refund_complete(uuid,uuid,uuid,text,jsonb,text),public.finance_refund_event(text,text,text,boolean,uuid,jsonb),public.finance_list(uuid,integer) to service_role;

-- Preserve confirmed full refunds across later checkout/exception deliveries.
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

-- Preserve confirmed full refunds across later checkout/exception deliveries.
create or replace function public.flag_payment_review(p_event_id text,p_type text,p_payment_intent text) returns text language plpgsql security invoker set search_path='' as $$
declare o record;
begin
 perform pg_catalog.pg_advisory_xact_lock(73219023);
 if exists(select 1 from public.checkout_events where id=p_event_id) then return 'review';end if;
 for o in select id from public.orders where stripe_payment_intent_id=p_payment_intent and status<>'refunded' loop
  update public.orders set status='review',review_reason='refund_or_dispute_requires_manual_reconciliation' where id=o.id;
  update public.inventory_reservations set status='released',release_reason='manual_review' where order_id=o.id and status='active';
 end loop;
 insert into public.checkout_events(id,event_type,payment_intent_id,outcome) values(p_event_id,p_type,p_payment_intent,'review');
 return 'review';
end;$$;

-- Existing function replacements preserve their service-only ACLs.
commit;
