-- Add bounded business roles without changing current memberships.
begin;

alter table public.staff_members drop constraint staff_members_role_check;

alter table public.staff_members add constraint staff_members_role_check check(role in ('super_admin','business_super_admin','finance_admin','merchandise_admin','admin','operator','catalog_editor','kol','order_operator','analyst'));

alter table public.staff_invitations drop constraint staff_invitations_role_check;

alter table public.staff_invitations add constraint staff_invitations_role_check check(role in ('super_admin','business_super_admin','finance_admin','merchandise_admin','admin','operator','catalog_editor','kol','order_operator','analyst'));

create or replace function public.batch_require_staff(p_actor uuid,p_super boolean default false) returns text
language plpgsql security invoker set search_path='' as $$
declare r text; k uuid;
begin
 select role,kol_id into r,k from public.staff_members where user_id=p_actor and active for share;
 if r is null or r not in ('super_admin','business_super_admin','admin','operator','merchandise_admin','catalog_editor','kol') or (r='kol' and k is null) or (p_super and r not in ('super_admin','business_super_admin','admin')) then raise exception 'STAFF_FORBIDDEN'; end if;
 return r;
end;$$;

create or replace function public.batch_require_owner(p_actor uuid,p_batch_id uuid) returns void
language plpgsql security invoker set search_path='' as $$
declare r text;
begin
 r=public.batch_require_staff(p_actor);
 if not exists(select 1 from public.media_batches where id=p_batch_id and (created_by=p_actor or r in ('super_admin','business_super_admin','admin','merchandise_admin'))) then raise exception 'BATCH_FORBIDDEN'; end if;
end;$$;

create or replace function public.batch_claim(p_limit integer default 1) returns setof public.media_batch_items
language plpgsql security invoker set search_path='' as $$
declare i public.media_batch_items; claimed integer=0;
begin
 if p_limit is null or p_limit not between 1 and 4 then raise exception 'CLAIM_LIMIT'; end if;
 for i in select * from public.media_batch_items where status in ('queued','approved') or (status in ('processing','publishing') and lease_until<clock_timestamp()) order by created_at,id for update skip locked loop
  if i.attempts>=3 then
   update public.media_batch_items set status='failed',error='ATTEMPTS_EXHAUSTED',lease_token=null,lease_until=null,updated_at=now() where id=i.id;
   insert into public.media_batch_audit(item_id,batch_id,action,revision) values(i.id,i.batch_id,'attempts_exhausted',i.revision);
   continue;
  end if;
  if i.status in ('approved','publishing') and (i.approved_revision is distinct from i.revision or not exists(select 1 from public.staff_members where user_id=i.approved_by and active and role in ('super_admin','business_super_admin','admin'))) then
   update public.media_batch_items set status='review',approved_by=null,approved_at=null,approved_revision=null,lease_token=null,lease_until=null,error='APPROVAL_REVOKED',updated_at=now() where id=i.id;
   insert into public.media_batch_audit(item_id,batch_id,action,revision) values(i.id,i.batch_id,'approval_revoked',i.revision);
   continue;
  end if;
  update public.media_batch_items set status=case when status in ('approved','publishing') then 'publishing' else 'processing' end,
   lease_token=gen_random_uuid(),lease_until=clock_timestamp()+interval '10 minutes',attempts=attempts+1,updated_at=now() where id=i.id returning * into i;
  insert into public.media_batch_audit(item_id,batch_id,action,revision) values(i.id,i.batch_id,i.status,i.revision);
  return next i;
  claimed=claimed+1;
  exit when claimed>=p_limit;
 end loop;
end;$$;

create or replace function public.live_require_actor(p_actor uuid,p_kol uuid,p_operator boolean default false) returns text
language plpgsql security invoker set search_path='' as $$
declare r text; k uuid;
begin
 select role,kol_id into r,k from public.staff_members where user_id=p_actor and active for share;
 if r is null or (p_operator and r not in ('super_admin','business_super_admin','admin','operator')) or (not p_operator and r not in ('super_admin','business_super_admin','admin','operator') and not(r='kol' and k is not null and k=p_kol)) then raise exception 'LIVE_FORBIDDEN';end if;
 return r;
end;$$;

create or replace function public.live_room_publish(p_actor uuid,p_room_id uuid,p_revision integer) returns public.live_room_state
language plpgsql security invoker set search_path='' as $$
declare d public.live_room_drafts;c public.live_source_checks;s public.live_room_state;p jsonb;
begin
 perform public.live_require_actor(p_actor,null,true);
 select * into d from public.live_room_drafts where id=p_room_id for update;
 if not found then raise exception 'LIVE_NOT_FOUND';end if;
 if d.revision is distinct from p_revision then raise exception 'STALE_LIVE_REVISION';end if;
 if d.published_revision=d.revision and d.state='published' then select * into s from public.live_room_state where room_id=d.id;return s;end if;
 select * into c from public.live_source_checks where room_id=d.id and draft_revision=d.revision;
 if not found or c.checked_at<now()-interval '24 hours' or not exists(select 1 from public.staff_members where user_id=c.checked_by and active and role in ('super_admin','business_super_admin','admin','operator')) then raise exception 'SOURCE_NOT_VERIFIED';end if;
 p=d.payload;
 if not public.live_valid_payload(p) or not exists(select 1 from public.kols where id=d.kol_id and status='active') then raise exception 'INVALID_LIVE_DRAFT';end if;
 if jsonb_array_length(p->'productIds')=0 then raise exception 'EMPTY_LIVE_RAIL';end if;
 -- Hold catalog rows during publication; no draft or demo merchandise is sellable.
 perform 1 from public.products where id in (select value::uuid from jsonb_array_elements_text(p->'productIds')) order by id for share;
 if exists(select 1 from jsonb_array_elements_text(p->'productIds') i where not exists(select 1 from public.products x where x.id=i.value::uuid and x.status='published' and not x.is_demo and x.price_amount>0)) then raise exception 'PRODUCT_NOT_APPROVED';end if;
 insert into public.live_sessions(id,slug,title,title_zh,description,description_zh,host_name,kol_id,platform,external_url,embed_id,status,starts_at,ends_at,poster_url,is_public,playback_mode)
 values(d.id,p->>'slug',p->>'title',p->>'titleZh',p->>'description',p->>'descriptionZh',p->>'hostName',d.kol_id,p->>'platform',p->>'externalUrl',case when c.playback_mode='external_link' then null else nullif(p->>'embedId','') end,p->>'status',(p->>'startsAt')::timestamptz,nullif(p->>'endsAt','')::timestamptz,nullif(p->>'posterUrl',''),true,c.playback_mode)
 on conflict(id) do update set slug=excluded.slug,title=excluded.title,title_zh=excluded.title_zh,description=excluded.description,description_zh=excluded.description_zh,host_name=excluded.host_name,kol_id=excluded.kol_id,platform=excluded.platform,external_url=excluded.external_url,embed_id=excluded.embed_id,status=excluded.status,starts_at=excluded.starts_at,ends_at=excluded.ends_at,poster_url=excluded.poster_url,is_public=true,playback_mode=excluded.playback_mode;
 -- These writes are in one RPC transaction: failure rolls back both room and rail.
 delete from public.live_products where live_session_id=d.id;
 insert into public.live_products(live_session_id,product_id,position) select d.id,value::uuid,ordinality-1 from jsonb_array_elements_text(p->'productIds') with ordinality;
 insert into public.live_room_state(room_id,changed_by) values(d.id,p_actor)
 on conflict(room_id) do update set revision=public.live_room_state.revision+1,pinned_product_id=case when public.live_room_state.pinned_product_id in (select value::uuid from jsonb_array_elements_text(p->'productIds')) then public.live_room_state.pinned_product_id else null end,changed_by=p_actor,changed_at=now() returning * into s;
 update public.live_room_drafts set state='published',published_revision=revision,updated_by=p_actor,updated_at=now() where id=d.id;
 insert into public.live_room_audit(room_id,actor_id,action,draft_revision,state_revision,detail) values(d.id,p_actor,'published',d.revision,s.revision,jsonb_build_object('source_check',c.id,'products',jsonb_array_length(p->'productIds')));
 return s;
end;$$;

create or replace function public.order_list_scoped(p_actor uuid,p_page integer default 0,p_status text default '',p_search text default '') returns jsonb
language plpgsql security invoker set search_path='' as $$
declare r text; total bigint; result jsonb;
begin
 select role into r from public.staff_members where user_id=p_actor and active for share;
 if r is null or r not in ('super_admin','business_super_admin','admin','operator','order_operator') then raise exception 'ORDER_FORBIDDEN'; end if;
 if p_page<0 or p_page>100000 or length(p_search)>80 then raise exception 'INVALID_ORDER_FILTER'; end if;
 select count(*) into total from public.orders o where (r in ('super_admin','business_super_admin') or (r in ('admin','operator') and o.status='review') or (r='order_operator' and exists(select 1 from public.order_assignments a where a.order_id=o.id and a.user_id=p_actor and(a.support or a.fulfillment)))) and(p_status='' or o.status::text=p_status) and(p_search='' or o.id::text like p_search||'%');
 select coalesce(jsonb_agg(x.payload order by x.created_at desc,x.id),'[]'::jsonb) into result from (
 select o.id,o.created_at,jsonb_build_object('id',o.id,'status',o.status,'currency',o.currency,'subtotalAmount',o.subtotal_amount,'totalAmount',o.total_amount,'createdAt',o.created_at,'revision',o.operation_revision,'fulfillmentStatus',o.fulfillment_status,'carrier',case when r in ('super_admin','business_super_admin') or a.fulfillment then o.carrier else null end,'trackingNumber',case when r in ('super_admin','business_super_admin') or a.fulfillment then o.tracking_number else null end,
 'customerEmail',case when r in ('super_admin','business_super_admin') or a.support then o.customer_email else null end,'customerName',case when r in ('super_admin','business_super_admin') or a.support or a.fulfillment then o.customer_name else null end,
 'shippingAddress',case when (r in ('super_admin','business_super_admin') or a.fulfillment) and o.status='paid' then o.shipping_address else null end,
 'fulfillmentOnHold',exists(select 1 from public.refund_requests f where f.order_id=o.id and f.status in ('requested','approved')),
 'canFulfill',r in ('super_admin','business_super_admin') or coalesce(a.fulfillment,false),'canRequestRefund',r in ('super_admin','business_super_admin') or coalesce(a.support,false),
 'items',(select coalesce(jsonb_agg(jsonb_build_object('sku',i.sku,'title',i.title,'quantity',i.quantity,'lineTotal',i.line_total)),'[]'::jsonb) from public.order_items i where i.order_id=o.id),
 'refundRequests',case when r in ('super_admin','business_super_admin') or a.support then (select coalesce(jsonb_agg(jsonb_build_object('id',f.id,'reason',f.reason,'status',f.status,'reviewNote',f.review_note)),'[]'::jsonb) from public.refund_requests f where f.order_id=o.id) else '[]'::jsonb end) payload
 from public.orders o left join public.order_assignments a on a.order_id=o.id and a.user_id=p_actor and r='order_operator'
 where (r in ('super_admin','business_super_admin') or (r in ('admin','operator') and o.status='review') or (r='order_operator' and (a.support or a.fulfillment))) and(p_status='' or o.status::text=p_status) and(p_search='' or o.id::text like p_search||'%') order by o.created_at desc,o.id limit 25 offset p_page*25
 )x;
 return jsonb_build_object('items',result,'count',total,'page',p_page);
end;$$;

create or replace function public.order_operate(p_actor uuid,p_order uuid,p_revision integer,p_request uuid,p_action text,p_data jsonb default '{}'::jsonb) returns jsonb
language plpgsql security invoker set search_path='' as $$
declare r text;o public.orders;a public.order_assignments;fp text;prior public.order_operation_audit;target_role text;new_revision integer;
begin
 select role into r from public.staff_members where user_id=p_actor and active for share;
 if r is null or r not in ('super_admin','business_super_admin','order_operator') then raise exception 'ORDER_FORBIDDEN'; end if;
 if p_request is null or jsonb_typeof(p_data)<>'object' or octet_length(p_data::text)>5000 then raise exception 'INVALID_ORDER_OPERATION'; end if;
 perform pg_catalog.pg_advisory_xact_lock(hashtextextended(p_actor::text||p_request::text,1));
 fp=md5(jsonb_build_array(p_order,p_revision,p_action,p_data)::text);
 select * into prior from public.order_operation_audit where actor_id=p_actor and request_id=p_request;
 if found then
  if prior.request_fingerprint<>fp then raise exception 'REQUEST_CHANGED'; end if;
  return jsonb_build_object('ok',true,'revision',prior.revision,'replayed',true);
 end if;
 select * into o from public.orders where id=p_order for update;
 if not found then raise exception 'ORDER_NOT_FOUND'; end if;
 select * into a from public.order_assignments where order_id=p_order and user_id=p_actor for share;
 if r not in ('super_admin','business_super_admin') and (a.user_id is null or not(a.support or a.fulfillment)) then raise exception 'ORDER_FORBIDDEN'; end if;
 if o.operation_revision<>p_revision then raise exception 'STALE_REVISION'; end if;
 if p_action='assign' then
  if r not in ('super_admin','business_super_admin') then raise exception 'ORDER_FORBIDDEN'; end if;
  select role into target_role from public.staff_members where user_id=(p_data->>'userId')::uuid and active for share;
  if target_role is distinct from 'order_operator' then raise exception 'ASSIGNEE_INVALID'; end if;
  insert into public.order_assignments(order_id,user_id,support,fulfillment) values(p_order,(p_data->>'userId')::uuid,coalesce((p_data->>'support')::boolean,false),coalesce((p_data->>'fulfillment')::boolean,false)) on conflict(order_id,user_id) do update set support=excluded.support,fulfillment=excluded.fulfillment;
 elsif p_action in ('pack','ship','deliver') then
  if r not in ('super_admin','business_super_admin') and not coalesce(a.fulfillment,false) then raise exception 'ORDER_FORBIDDEN'; end if;
  if o.status<>'paid' then raise exception 'PAID_ORDER_REQUIRED'; end if;
  if exists(select 1 from public.refund_requests where order_id=p_order and status in ('requested','approved')) then raise exception 'REFUND_REVIEW_HOLD'; end if;
  if (p_action='pack' and o.fulfillment_status<>'unfulfilled') or (p_action='ship' and o.fulfillment_status<>'packed') or(p_action='deliver' and o.fulfillment_status<>'shipped') then raise exception 'INVALID_FULFILLMENT_TRANSITION'; end if;
  if p_action='ship' and (coalesce(length(trim(p_data->>'carrier')),0) not between 1 and 80 or coalesce(length(trim(p_data->>'trackingNumber')),0) not between 1 and 160) then raise exception 'TRACKING_REQUIRED'; end if;
  update public.orders set fulfillment_status=case p_action when 'pack' then 'packed' when 'ship' then 'shipped' else 'delivered' end,carrier=case when p_action='ship' then trim(p_data->>'carrier') else carrier end,tracking_number=case when p_action='ship' then trim(p_data->>'trackingNumber') else tracking_number end where id=p_order;
 elsif p_action='request_refund' then
  if r not in ('super_admin','business_super_admin') and not coalesce(a.support,false) then raise exception 'ORDER_FORBIDDEN'; end if;
  if o.status<>'paid' or coalesce(length(trim(p_data->>'reason')),0) not between 1 and 1000 then raise exception 'REFUND_REQUEST_INVALID'; end if;
  insert into public.refund_requests(order_id,requested_by,reason) values(p_order,p_actor,trim(p_data->>'reason'));
 elsif p_action='review_refund' then
  if r not in ('super_admin','business_super_admin') then raise exception 'ORDER_FORBIDDEN'; end if;
  if coalesce(p_data->>'decision','') not in ('approved','rejected') or coalesce(length(trim(p_data->>'note')),0) not between 1 and 1000 then raise exception 'REFUND_REVIEW_INVALID'; end if;
  update public.refund_requests set status=p_data->>'decision',reviewed_by=p_actor,review_note=trim(p_data->>'note') where id=(p_data->>'refundId')::uuid and order_id=p_order and status='requested';
  if not found then raise exception 'REFUND_REQUEST_NOT_FOUND'; end if;
 else raise exception 'INVALID_ORDER_OPERATION'; end if;
 update public.orders set operation_revision=operation_revision+1 where id=p_order returning operation_revision into new_revision;
 insert into public.order_operation_audit(order_id,actor_id,action,revision,request_id,request_fingerprint) values(p_order,p_actor,p_action,new_revision,p_request,fp);
 return jsonb_build_object('ok',true,'revision',new_revision,'replayed',false);
end;$$;

create or replace function public.backend_summary(p_actor uuid) returns jsonb
language plpgsql security invoker set search_path='' as $$
declare r text;own_kol uuid;result jsonb;paid_count bigint;paid_amount bigint;
begin
 select role,kol_id into r,own_kol from public.staff_members where user_id=p_actor and active for share;
 if r is null then raise exception 'STAFF_FORBIDDEN';end if;
 result=jsonb_build_object('cataloguePublished',(select count(*) from public.products where status='published'),'roomsPublic',(select count(*) from public.live_sessions where is_public and (r<>'kol' or kol_id=own_kol)),'batchOutstanding',(select count(*) from public.media_batch_items i join public.media_batches b on b.id=i.batch_id where (r in ('super_admin','business_super_admin','admin') or b.created_by=p_actor)and i.status<>'published'),'batchNeedsReview',(select count(*) from public.media_batch_items i join public.media_batches b on b.id=i.batch_id where (r in ('super_admin','business_super_admin','admin') or b.created_by=p_actor)and i.status='review'));
 if r in ('super_admin','business_super_admin','admin','operator','analyst') then
  result=result||jsonb_build_object('ordersNeedingReview',(select count(*) from public.orders where status='review'),'paidOrders',(select count(*) from public.orders where status='paid'),'paidRevenueByCurrency',(select coalesce(jsonb_object_agg(currency,amount),'{}'::jsonb) from(select currency,sum(total_amount) amount from public.orders where status='paid' group by currency)x));
 elsif r='kol' then
  select count(distinct o.id),coalesce(sum(i.line_total),0)into paid_count,paid_amount from public.orders o join public.order_items i on i.order_id=o.id where o.status='paid' and i.kol_id=own_kol and o.currency='hkd';
  result=result||jsonb_build_object('paidOrders',paid_count,'attributedMerchandiseHkd',paid_amount);
 elsif r='order_operator' then
  result=result||jsonb_build_object('assignedOrders',(select count(*) from public.order_assignments a where user_id=p_actor and(a.support or a.fulfillment)));
 end if;
 return result;
end;$$;

create or replace function public.storefront_broadcast_save(p_actor uuid,p_id uuid,p_revision integer,p_payload jsonb)
returns public.storefront_broadcasts language plpgsql security invoker set search_path=public,pg_temp as $$
declare previous public.storefront_broadcasts; result public.storefront_broadcasts; field text;
begin
 if not exists(select 1 from public.staff_members where user_id=p_actor and active and role in ('super_admin','business_super_admin','admin','operator')) then raise exception 'STAFF_FORBIDDEN'; end if;
 if p_id is null or p_revision is null or p_revision<0 or jsonb_typeof(p_payload) is distinct from 'object' then raise exception 'INVALID_BROADCAST'; end if;
 if not (p_payload ?& array['kind','title','titleZh','titleHans','titleJa','url','thumbnailUrl','position','visible','status','productIds']) or
    (p_payload - array['kind','title','titleZh','titleHans','titleJa','url','thumbnailUrl','position','visible','status','productIds']) <> '{}'::jsonb then raise exception 'INVALID_BROADCAST'; end if;
 foreach field in array array['title','titleZh','titleHans','titleJa'] loop
  if jsonb_typeof(p_payload->field) is distinct from 'string' or char_length(trim(p_payload->>field)) not between 1 and 180 then raise exception 'INVALID_BROADCAST'; end if;
 end loop;
 if coalesce(p_payload->>'kind','') not in ('introduction','broadcast') or coalesce(p_payload->>'status','') not in ('recorded','live','scheduled') or
    jsonb_typeof(p_payload->'visible') is distinct from 'boolean' or jsonb_typeof(p_payload->'productIds') is distinct from 'array' or
    jsonb_typeof(p_payload->'position') is distinct from 'number' or (p_payload->>'position') !~ '^\d{1,5}$' or (p_payload->>'position')::int>10000 or
    coalesce(p_payload->>'url','') !~ '^https://(www\.|m\.)?(youtube\.com|youtu\.be|facebook\.com|fb\.watch)/[^[:space:]]+$' or char_length(p_payload->>'url')>2000 or
    jsonb_typeof(p_payload->'thumbnailUrl') is distinct from 'string' or char_length(p_payload->>'thumbnailUrl')>2000 then raise exception 'INVALID_BROADCAST'; end if;
 if jsonb_array_length(p_payload->'productIds')>100 or exists(select 1 from jsonb_array_elements_text(p_payload->'productIds') x where x !~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$') then raise exception 'INVALID_BROADCAST'; end if;
 perform pg_advisory_xact_lock(hashtextextended(p_id::text,101008));
 select * into previous from public.storefront_broadcasts where id=p_id for update;
 if (previous.id is null and p_revision<>0) or (previous.id is not null and previous.revision<>p_revision) then raise exception 'STALE_BROADCAST'; end if;
 if previous.id is null and (select count(*) from public.storefront_broadcasts)>=500 then raise exception 'BROADCAST_LIMIT'; end if;
 insert into public.storefront_broadcasts(id,payload) values(p_id,p_payload)
 on conflict(id) do update set payload=excluded.payload,revision=storefront_broadcasts.revision+1,updated_at=now() returning * into result;
 insert into public.storefront_broadcast_audit(actor_id,broadcast_id,before_state,after_state) values(p_actor,p_id,to_jsonb(previous),to_jsonb(result));
 return result;
end $$;

create or replace function private.finance_require_actor(p_actor uuid) returns void
language plpgsql security invoker set search_path='' as $$
begin
 if not exists(select 1 from public.staff_members where user_id=p_actor and active and role in ('super_admin','business_super_admin') for share) then raise exception 'FINANCE_FORBIDDEN';end if;
end;$$;

create or replace function public.stock_list(p_actor uuid,p_page integer default 0,p_search text default '') returns jsonb
language plpgsql security invoker set search_path='' as $$
declare r text; total bigint; items jsonb;
begin
 select role into r from public.staff_members where user_id=p_actor and active for share;
 if r is null or r not in ('super_admin','business_super_admin','merchandise_admin','admin','operator') then raise exception 'STOCK_FORBIDDEN';end if;
 if p_page is null or p_page not between 0 and 100000 or p_search is null or length(p_search)>120 then raise exception 'INVALID_STOCK_FILTER';end if;
 select count(*) into total from public.products p where p_search='' or p.sku ilike '%'||p_search||'%' or p.title ilike '%'||p_search||'%';
 select coalesce(jsonb_agg(x.payload order by x.sku,x.id),'[]'::jsonb) into items from(
 select p.id,p.sku,jsonb_build_object('id',p.id,'sku',p.sku,'title',p.title,'status',p.status,'isDemo',p.is_demo,'stockQty',p.stock_qty,'reservedQty',h.qty,'availableQty',p.stock_qty-h.qty,'revision',p.inventory_revision) payload
 from public.products p cross join lateral(select coalesce(sum(quantity),0)::integer qty from public.inventory_reservations where product_id=p.id and status='active')h
 where p_search='' or p.sku ilike '%'||p_search||'%' or p.title ilike '%'||p_search||'%' order by p.sku,p.id limit 25 offset p_page*25)x;
 return jsonb_build_object('items',items,'count',total,'page',p_page);
end;$$;

create or replace function public.stock_adjust(p_actor uuid,p_product uuid,p_revision integer,p_request uuid,p_stock_qty integer,p_reason text) returns jsonb
language plpgsql security invoker set search_path='' as $$
declare r text;p public.products; prior private.stock_adjustment_audit; fp text; held integer; rev integer;
begin
 select role into r from public.staff_members where user_id=p_actor and active for share;
 if r is null or r not in ('super_admin','business_super_admin','merchandise_admin','admin','operator') then raise exception 'STOCK_FORBIDDEN';end if;
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

create or replace function public.staff_set_member(p_actor uuid,p_target uuid,p_role text,p_active boolean,p_kol uuid default null) returns public.staff_members
language plpgsql security invoker set search_path='' as $$
declare actor public.staff_members; previous public.staff_members; result public.staff_members;
begin
 perform pg_catalog.pg_advisory_xact_lock(hashtextextended('isuntvmall:staff-membership',0));
 select * into actor from public.staff_members where user_id=p_actor and active for share;
 if actor.role is null or actor.role not in ('super_admin','business_super_admin') then raise exception 'STAFF_FORBIDDEN'; end if;
 if p_target=p_actor then raise exception 'SELF_MEMBERSHIP_CHANGE_DENIED'; end if;
 if p_role is null or p_role not in ('super_admin','business_super_admin','finance_admin','merchandise_admin','admin','operator','catalog_editor','kol','order_operator','analyst') or p_active is null then raise exception 'INVALID_ROLE'; end if;
 if (p_role='kol') is distinct from (p_kol is not null) then raise exception 'KOL_BINDING_REQUIRED'; end if;
 if p_kol is not null and not exists(select 1 from public.kols where id=p_kol and status='active') then raise exception 'KOL_NOT_ACTIVE'; end if;
 if not exists(select 1 from auth.users where id=p_target and not coalesce(is_anonymous,false)) then raise exception 'NAMED_USER_REQUIRED'; end if;
 if actor.role='business_super_admin' and p_role='super_admin' then raise exception 'STAFF_FORBIDDEN';end if;
 select * into previous from public.staff_members where user_id=p_target for update;
 if actor.role='business_super_admin' and previous.role='super_admin' then raise exception 'STAFF_FORBIDDEN';end if;
 if previous.role='super_admin' and previous.active and (not p_active or p_role<>'super_admin') and (select count(*) from public.staff_members where role='super_admin' and active)<=1 then raise exception 'LAST_SUPER_ADMIN'; end if;
 insert into public.staff_members(user_id,role,active,kol_id) values(p_target,p_role,p_active,p_kol)
 on conflict(user_id) do update set role=excluded.role,active=excluded.active,kol_id=excluded.kol_id,updated_at=now() returning * into result;
 insert into public.staff_audit(actor_id,target_id,action,before_state,after_state) values(p_actor,p_target,case when previous.user_id is null then 'membership_created' else 'membership_updated' end,
 case when previous.user_id is null then null else jsonb_build_object('role',previous.role,'active',previous.active,'kolId',previous.kol_id) end,
 jsonb_build_object('role',result.role,'active',result.active,'kolId',result.kol_id));
 return result;
end;$$;

create function public.staff_directory(p_actor uuid) returns jsonb language plpgsql security invoker set search_path='' as $$
begin
 if not exists(select 1 from public.staff_members where user_id=p_actor and active and role in ('super_admin','business_super_admin') for share) then raise exception 'STAFF_FORBIDDEN';end if;
 return (select coalesce(jsonb_agg(jsonb_build_object('user_id',m.user_id,'email',u.email,'role',m.role,'active',m.active,'kol_id',m.kol_id,'updated_at',m.updated_at) order by u.email),'[]') from public.staff_members m join auth.users u on u.id=m.user_id);
end;$$;
revoke all on function public.staff_directory(uuid) from public,anon,authenticated;
grant execute on function public.staff_directory(uuid) to service_role;

create or replace function public.finance_list(p_actor uuid,p_page integer default 0) returns jsonb
language plpgsql security invoker set search_path='' as $$
declare result jsonb;total bigint;
begin
 if not exists(select 1 from public.staff_members where user_id=p_actor and active and role in ('super_admin','business_super_admin','finance_admin') for share) then raise exception 'FINANCE_FORBIDDEN';end if;
 if p_page is null or p_page not between 0 and 100000 then raise exception 'INVALID_FINANCE_FILTER';end if;
 select count(*) into total from public.orders;
 select coalesce(jsonb_agg(x.payload order by x.created_at desc,x.id),'[]'::jsonb) into result from(
 select o.id,o.created_at,jsonb_build_object('id',o.id,'status',o.status,'currency',o.currency,'total_amount',o.total_amount,'payment_intent_id',o.stripe_payment_intent_id,'payment',o.checkout_policy->'payment','created_at',o.created_at,'review_reason',o.review_reason,
 'snapshot',(select to_jsonb(s) from private.finance_reconciliation_snapshots s where s.order_id=o.id order by s.created_at desc,s.id desc limit 1),
 'refund_requests',(select coalesce(jsonb_agg(jsonb_build_object('id',f.id,'status',f.status,'created_at',f.created_at) order by f.created_at),'[]'::jsonb) from public.refund_requests f where f.order_id=o.id),
 'commands',(select coalesce(jsonb_agg(to_jsonb(c) order by c.created_at),'[]'::jsonb) from private.finance_refund_commands c where c.order_id=o.id)) payload
 from public.orders o order by o.created_at desc,o.id limit 25 offset p_page*25)x;
 return jsonb_build_object('items',result,'count',total,'page',p_page);
end;$$;

create function public.finance_export(p_actor uuid) returns jsonb language plpgsql security invoker set search_path='' as $$
declare result jsonb;total bigint;
begin
 if not exists(select 1 from public.staff_members where user_id=p_actor and active and role in ('super_admin','business_super_admin','finance_admin') for share) then raise exception 'FINANCE_FORBIDDEN';end if;
 select count(*) into total from public.orders;
 if total>20000 then raise exception 'EXPORT_TOO_LARGE';end if;
 select coalesce(jsonb_agg(x.payload order by x.created_at desc,x.id),'[]') into result from (
 select o.id,o.created_at,jsonb_build_object('id',o.id,'status',o.status,'currency',o.currency,'total_amount',o.total_amount,'payment_intent_id',o.stripe_payment_intent_id,'payment',o.checkout_policy->'payment','created_at',o.created_at,
 'snapshot',(select to_jsonb(s) from private.finance_reconciliation_snapshots s where s.order_id=o.id order by s.created_at desc,s.id desc limit 1),'refund_requests','[]'::jsonb,'commands','[]'::jsonb) payload from public.orders o)x;
 insert into private.finance_audit(actor_id,source,action,detail) values(p_actor,'staff','report_exported',jsonb_build_object('rows',total));
 return jsonb_build_object('items',result,'count',total,'page',0);
end;$$;
revoke all on function public.finance_export(uuid) from public,anon,authenticated;
grant execute on function public.finance_export(uuid) to service_role;
-- Private working copies: supplier contacts and edit history never enter storefront rows.
alter table public.products add column catalog_revision integer not null default 1;
alter table public.product_images add column is_visible boolean not null default true;
create table private.merchandise_drafts (
 product_id uuid primary key references public.products(id), revision integer not null default 1,
 base_revision integer not null, payload jsonb not null, supplier jsonb not null default '{}',
 state text not null default 'draft' check(state in ('draft','published')),
 updated_by uuid not null references auth.users(id), updated_at timestamptz not null default now()
);
create table private.merchandise_audit (
 id bigint generated always as identity primary key, product_id uuid not null references public.products(id),
 actor_id uuid not null references auth.users(id), action text not null, revision integer not null,
 before_state jsonb, after_state jsonb, created_at timestamptz not null default now()
);
alter table private.merchandise_drafts enable row level security;
alter table private.merchandise_audit enable row level security;
revoke all on private.merchandise_drafts,private.merchandise_audit from public,anon,authenticated;
grant select,insert,update on private.merchandise_drafts to service_role;
grant select,insert on private.merchandise_audit to service_role;
grant usage,select on sequence private.merchandise_audit_id_seq to service_role;
create function private.merchandise_require_actor(p_actor uuid,p_publish boolean default false) returns void language plpgsql security invoker set search_path='' as $$
begin
 if not exists(select 1 from public.staff_members where user_id=p_actor and active and role in ('super_admin','business_super_admin','merchandise_admin','admin','operator','catalog_editor') and (not p_publish or role in ('super_admin','business_super_admin','admin')) for share) then raise exception 'STAFF_FORBIDDEN';end if;
end;$$;
create function public.merchandise_list(p_actor uuid,p_page integer default 0,p_search text default '') returns jsonb language plpgsql security invoker set search_path='' as $$
declare items jsonb;total bigint;
begin
 perform private.merchandise_require_actor(p_actor);
 if p_page is null or p_page not between 0 and 100000 or p_search is null or length(p_search)>120 then raise exception 'INVALID_INPUT';end if;
 select count(*) into total from public.products p where p_search='' or p.sku ilike '%'||p_search||'%' or p.title ilike '%'||p_search||'%';
 select coalesce(jsonb_agg(x.payload order by x.sku,x.id),'[]') into items from(
 select p.id,p.sku,jsonb_build_object('id',p.id,'sku',p.sku,'slug',p.slug,'revision',coalesce(d.revision,0),'baseRevision',p.catalog_revision,'draftState',coalesce(d.state,'published'),'supplier',coalesce(d.supplier,'{}'),
 'payload',coalesce(d.payload,jsonb_build_object('title',p.title,'titleZh',p.title_zh,'description',p.description,'descriptionZh',p.description_zh,'category',p.category,'priceAmount',p.price_amount,'status',p.status,'isDemo',p.is_demo,'visibleImageIds',(select coalesce(jsonb_agg(id order by position),'[]') from public.product_images where product_id=p.id and is_visible))),
 'images',(select coalesce(jsonb_agg(jsonb_build_object('id',id,'url',source_url,'visible',is_visible) order by position),'[]') from public.product_images where product_id=p.id)) payload
 from public.products p left join private.merchandise_drafts d on d.product_id=p.id where p_search='' or p.sku ilike '%'||p_search||'%' or p.title ilike '%'||p_search||'%' order by p.sku,p.id limit 25 offset p_page*25)x;
 return jsonb_build_object('items',items,'count',total,'page',p_page,'categories',(select coalesce(jsonb_agg(category order by category),'[]') from(select distinct category from public.products)c));
end;$$;
create function public.merchandise_save(p_actor uuid,p_product uuid,p_revision integer,p_base_revision integer,p_payload jsonb,p_supplier jsonb) returns jsonb language plpgsql security invoker set search_path='' as $$
declare p public.products;d private.merchandise_drafts;
begin
 perform private.merchandise_require_actor(p_actor);
 select * into p from public.products where id=p_product for update;
 if not found then raise exception 'PRODUCT_NOT_FOUND';end if;
 select * into d from private.merchandise_drafts where product_id=p_product for update;
 if p_revision is distinct from coalesce(d.revision,0) or p_base_revision is distinct from p.catalog_revision then raise exception 'STALE_REVISION';end if;
 if jsonb_typeof(p_payload) is distinct from 'object' or jsonb_typeof(p_supplier) is distinct from 'object' or octet_length(p_payload::text)>24000 or octet_length(p_supplier::text)>6000
 or exists(select 1 from jsonb_object_keys(p_payload) k where k not in ('title','titleZh','description','descriptionZh','category','priceAmount','status','isDemo','visibleImageIds'))
 or exists(select 1 from jsonb_object_keys(p_supplier) k where k not in ('name','contact','notes'))
 or coalesce(length(trim(p_payload->>'title')),0) not between 1 and 180 or coalesce(length(p_payload->>'titleZh'),0)>180
 or coalesce(length(p_payload->>'description'),0)>5000 or coalesce(length(p_payload->>'descriptionZh'),0)>5000
 or coalesce(length(trim(p_payload->>'category')),0) not between 1 and 80
 or coalesce(p_payload->>'priceAmount','') !~ '^[1-9][0-9]{0,8}$' or coalesce(p_payload->>'status','') not in ('draft','published','archived')
 or jsonb_typeof(p_payload->'isDemo') is distinct from 'boolean' or jsonb_typeof(p_payload->'visibleImageIds') is distinct from 'array'
 or coalesce(length(p_supplier->>'name'),0)>180 or coalesce(length(p_supplier->>'contact'),0)>500 or coalesce(length(p_supplier->>'notes'),0)>3000 then raise exception 'INVALID_INPUT';end if;
 if jsonb_array_length(p_payload->'visibleImageIds')>50 or exists(select 1 from jsonb_array_elements_text(p_payload->'visibleImageIds') i where not exists(select 1 from public.product_images x where x.id::text=i.value and x.product_id=p_product)) then raise exception 'INVALID_IMAGE';end if;
 insert into private.merchandise_drafts(product_id,revision,base_revision,payload,supplier,updated_by) values(p_product,p_revision+1,p.catalog_revision,p_payload,p_supplier,p_actor)
 on conflict(product_id) do update set revision=excluded.revision,base_revision=excluded.base_revision,payload=excluded.payload,supplier=excluded.supplier,state='draft',updated_by=p_actor,updated_at=now();
 insert into private.merchandise_audit(product_id,actor_id,action,revision,before_state,after_state) values(p_product,p_actor,'draft_saved',p_revision+1,to_jsonb(d),jsonb_build_object('payload',p_payload,'supplier',p_supplier));
 return jsonb_build_object('ok',true,'revision',p_revision+1);
end;$$;
create function public.merchandise_publish(p_actor uuid,p_product uuid,p_revision integer) returns jsonb language plpgsql security invoker set search_path='' as $$
declare p public.products;d private.merchandise_drafts;
begin
 perform private.merchandise_require_actor(p_actor,true);
 select * into p from public.products where id=p_product for update;
 select * into d from private.merchandise_drafts where product_id=p_product for update;
 if d.product_id is null or d.revision is distinct from p_revision or d.base_revision is distinct from p.catalog_revision or d.state<>'draft' then raise exception 'STALE_REVISION';end if;
 if d.payload->>'status'='published' and jsonb_array_length(d.payload->'visibleImageIds')=0 then raise exception 'PUBLIC_IMAGE_REQUIRED';end if;
 update public.products set title=d.payload->>'title',title_zh=d.payload->>'titleZh',description=d.payload->>'description',description_zh=d.payload->>'descriptionZh',category=d.payload->>'category',price_amount=(d.payload->>'priceAmount')::integer,status=d.payload->>'status',is_demo=(d.payload->>'isDemo')::boolean,catalog_revision=catalog_revision+1,updated_at=now() where id=p_product;
 update public.product_images set is_visible=(d.payload->'visibleImageIds') ? id::text where product_id=p_product;
 update private.merchandise_drafts set state='published',base_revision=p.catalog_revision+1,updated_by=p_actor,updated_at=now() where product_id=p_product;
 insert into private.merchandise_audit(product_id,actor_id,action,revision,before_state,after_state) values(p_product,p_actor,'published',p_revision,to_jsonb(p),d.payload);
 return jsonb_build_object('ok',true);
end;$$;
revoke all on function private.merchandise_require_actor(uuid,boolean),public.merchandise_list(uuid,integer,text),public.merchandise_save(uuid,uuid,integer,integer,jsonb,jsonb),public.merchandise_publish(uuid,uuid,integer) from public,anon,authenticated;
grant execute on function private.merchandise_require_actor(uuid,boolean),public.merchandise_list(uuid,integer,text),public.merchandise_save(uuid,uuid,integer,integer,jsonb,jsonb),public.merchandise_publish(uuid,uuid,integer) to service_role;

create or replace function public.batch_valid_draft(p_data jsonb) returns boolean
language sql immutable security invoker set search_path='' as $$
 select coalesce(jsonb_typeof(p_data)='object' and octet_length(p_data::text)<=20000
 and not exists(select 1 from jsonb_object_keys(p_data) k where k not in ('sku','title','description','titleZh','descriptionZh','category','priceAmount','currency','stockQty','isDemo','targetProductId'))
 and (not p_data?'targetProductId' or (jsonb_typeof(p_data->'targetProductId')='string' and p_data->>'targetProductId' ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'))
 and (not p_data?'sku' or (jsonb_typeof(p_data->'sku')='string' and char_length(p_data->>'sku')<=80))
 and (not p_data?'title' or (jsonb_typeof(p_data->'title')='string' and char_length(p_data->>'title')<=180))
 and (not p_data?'description' or (jsonb_typeof(p_data->'description')='string' and char_length(p_data->>'description')<=10000))
 and (not p_data?'titleZh' or (jsonb_typeof(p_data->'titleZh')='string' and char_length(p_data->>'titleZh')<=180))
 and (not p_data?'descriptionZh' or (jsonb_typeof(p_data->'descriptionZh')='string' and char_length(p_data->>'descriptionZh')<=5000))
 and (not p_data?'category' or (jsonb_typeof(p_data->'category')='string' and char_length(p_data->>'category')<=80))
 and (not p_data?'isDemo' or jsonb_typeof(p_data->'isDemo')='boolean')
 and (not p_data?'currency' or p_data->>'currency'='hkd')
 and (not p_data?'priceAmount' or p_data->'priceAmount'='null'::jsonb or (jsonb_typeof(p_data->'priceAmount')='number' and p_data->>'priceAmount' ~ '^(0|[1-9][0-9]{0,8})$'))
 and (not p_data?'stockQty' or (jsonb_typeof(p_data->'stockQty')='number' and p_data->>'stockQty' ~ '^(0|[1-9][0-9]{0,8})$')),false);
$$;

create or replace function public.batch_create(p_actor uuid,p_title text,p_style_id text,p_style_snapshot jsonb,p_items jsonb,p_request_id uuid default gen_random_uuid()) returns uuid
language plpgsql security invoker set search_path='' as $$
declare b uuid; i uuid; entry jsonb; d jsonb; fingerprint text; old_fingerprint text; policy private.batch_admission_policy; amount bigint; item_count integer; actor_outstanding bigint; store_outstanding bigint; actor_retained bigint; store_retained bigint;
begin
 perform public.batch_require_staff(p_actor);
 if p_request_id is null then raise exception 'INVALID_REQUEST_ID'; end if;
 perform pg_catalog.pg_advisory_xact_lock(hashtextextended(p_actor::text||p_request_id::text,0));
 fingerprint=md5(jsonb_build_array(p_title,p_style_id,p_style_snapshot,p_items)::text);
 select id,request_fingerprint into b,old_fingerprint from public.media_batches where created_by=p_actor and request_id=p_request_id;
 if found then
  if old_fingerprint<>fingerprint then raise exception 'REQUEST_CHANGED'; end if;
  return b;
 end if;
 if jsonb_typeof(p_items) is distinct from 'array' or jsonb_array_length(p_items) not between 1 and 1000 then raise exception 'BATCH_SIZE_LIMIT'; end if;
 if jsonb_typeof(p_style_snapshot#>'{image,padding}') is distinct from 'number' or jsonb_typeof(p_style_snapshot#>'{image,size}') is distinct from 'number' or jsonb_typeof(p_style_snapshot#>'{image,quality}') is distinct from 'number' or p_style_snapshot->>'id' is distinct from p_style_id or coalesce(p_style_snapshot#>>'{image,background}' !~ '^#[a-fA-F0-9]{6}$',true)
 or (p_style_snapshot#>>'{image,size}')::integer is distinct from 1600 or p_style_snapshot#>>'{image,format}' is distinct from 'webp'
 or coalesce((p_style_snapshot#>>'{image,padding}')::numeric not between 0 and 0.3,true)
 or coalesce((p_style_snapshot#>>'{image,quality}')::integer not between 60 and 95,true) then raise exception 'INVALID_STYLE_PRESET'; end if;
 -- One global policy row serializes every admission and derived-object reservation.
 select * into policy from private.batch_admission_policy where singleton for update;
 if not found or not policy.enabled then raise exception 'BATCH_ADMISSION_PAUSED'; end if;
 item_count=jsonb_array_length(p_items);
 select sum((value->>'byte_size')::bigint) into amount from jsonb_array_elements(p_items);
 if amount is null or amount<1 or item_count>policy.max_batch_items or amount>policy.max_batch_bytes then raise exception 'BATCH_ADMISSION_BATCH_LIMIT'; end if;
 select count(*) into store_outstanding from public.media_batch_items where status<>'published';
 select count(*) into actor_outstanding from public.media_batch_items i join public.media_batches b on b.id=i.batch_id where b.created_by=p_actor and i.status<>'published';
 select coalesce(sum(reserved_bytes),0) into store_retained from private.batch_storage_reservations;
 select coalesce(sum(reserved_bytes),0) into actor_retained from private.batch_storage_reservations where created_by=p_actor;
 if actor_outstanding+item_count>policy.max_actor_outstanding or store_outstanding+item_count>policy.max_store_outstanding then raise exception 'BATCH_ADMISSION_BACKPRESSURE'; end if;
 -- Signed upload capability can write up to the bucket limit, even if metadata
 -- claims a smaller file. Reserve its whole possible size before issuing it.
 if actor_retained+item_count::bigint*25165824>policy.max_actor_retained_bytes or store_retained+item_count::bigint*25165824>policy.max_store_retained_bytes then raise exception 'BATCH_ADMISSION_STORAGE_LIMIT'; end if;
 insert into public.media_batches(created_by,title,style_id,style_snapshot,request_id,request_fingerprint) values(p_actor,trim(p_title),p_style_id,p_style_snapshot,p_request_id,fingerprint) returning id into b;
 for entry in select value from jsonb_array_elements(p_items) loop
  i=gen_random_uuid();
  if entry->>'filename' ~ '[/\\]' or entry->>'filename' ~ '[[:cntrl:]]' then raise exception 'INVALID_FILENAME'; end if;
  d=coalesce(entry->'product_data','{}'::jsonb);
  if d?'targetProductId' then perform private.merchandise_require_actor(p_actor);if not exists(select 1 from public.products where id=(d->>'targetProductId')::uuid) then raise exception 'PRODUCT_NOT_FOUND';end if;end if;
  if not public.batch_valid_draft(d) then raise exception 'INVALID_DRAFT'; end if;
  insert into public.media_batch_items(id,batch_id,filename,mime,byte_size,original_path,product_data)
  values(i,b,entry->>'filename',entry->>'mime',(entry->>'byte_size')::integer,b::text||'/'||i::text||'/original',
   jsonb_build_object('sku','BATCH-'||upper(replace(i::text,'-','')),'title',left(entry->>'filename',180),'description','','titleZh','','descriptionZh','','category','General','priceAmount',null,'currency','hkd','stockQty',0)||d);
  insert into private.batch_storage_reservations(bucket,object_path,item_id,created_by,reserved_bytes,kind) values('batch-originals',b::text||'/'||i::text||'/original',i,p_actor,25165824,'original');
 end loop;
 insert into public.media_batch_audit(batch_id,actor_id,action,detail) values(b,p_actor,'created',jsonb_build_object('items',jsonb_array_length(p_items),'style',p_style_id));
 return b;
end;$$;

create or replace function public.batch_edit(p_actor uuid,p_item_id uuid,p_revision integer,p_product_data jsonb) returns public.media_batch_items
language plpgsql security invoker set search_path='' as $$
declare i public.media_batch_items;
begin
 select * into i from public.media_batch_items where id=p_item_id for update;
 perform public.batch_require_owner(p_actor,i.batch_id);
 if i.revision is distinct from p_revision or i.status not in ('awaiting_upload','queued','review','rejected','approved','failed') then raise exception 'STALE_OR_INVALID_STATE'; end if;
 if p_product_data?'targetProductId' then perform private.merchandise_require_actor(p_actor);if not exists(select 1 from public.products where id=(p_product_data->>'targetProductId')::uuid) then raise exception 'PRODUCT_NOT_FOUND';end if;end if;
 if not public.batch_valid_draft(p_product_data) then raise exception 'INVALID_DRAFT'; end if;
 update public.media_batch_items set product_data=p_product_data,revision=revision+1,
 status=case when processed_path is not null then 'review' when status='awaiting_upload' then 'awaiting_upload' else 'queued' end,
 approved_by=null,approved_at=null,approved_revision=null,lease_token=null,lease_until=null,attempts=0,error=null,updated_at=now()
 where id=i.id returning * into i;
 insert into public.media_batch_audit(item_id,batch_id,actor_id,action,revision) values(i.id,i.batch_id,p_actor,'edited',i.revision);
 return i;
end;$$;

create or replace function public.batch_publish(p_item_id uuid,p_revision integer,p_lease_token uuid,p_image_url text,p_public_path text,p_output_sha256 text) returns uuid
language plpgsql security invoker set search_path='' as $$
declare i public.media_batch_items; d jsonb; v_slug text;
begin
 select * into i from public.media_batch_items where id=p_item_id for update;
 if i.status='published' and i.revision=p_revision and i.output_sha256=p_output_sha256 then return i.product_id; end if;
 if not found or i.status<>'publishing' or i.revision is distinct from p_revision or i.lease_token is distinct from p_lease_token or i.lease_until<=clock_timestamp() then raise exception 'STALE_LEASE'; end if;
 perform public.batch_require_staff(i.approved_by,true);
 if i.approved_revision is distinct from i.revision or i.output_sha256 is distinct from p_output_sha256 or not public.batch_valid_product(i.product_data) then raise exception 'INVALID_APPROVAL'; end if;
 if p_public_path is distinct from 'batch/'||i.id::text||'/r'||i.revision::text||'-'||i.output_sha256||'.webp'
 or p_image_url !~ '^https://' or position('/storage/v1/object/public/product-images/'||p_public_path in p_image_url)=0 then raise exception 'INVALID_PUBLIC_IMAGE'; end if;
 d=i.product_data;
 if d?'targetProductId' then
  perform 1 from public.products where id=(d->>'targetProductId')::uuid for update;
  if not found then raise exception 'PRODUCT_NOT_FOUND';end if;
  insert into public.product_images(product_id,source_url,storage_path,alt_text,position) select (d->>'targetProductId')::uuid,p_image_url,p_public_path,d->>'title',coalesce(max(position),-1)+1 from public.product_images where product_id=(d->>'targetProductId')::uuid;
  update public.products set catalog_revision=catalog_revision+1,updated_at=now() where id=(d->>'targetProductId')::uuid;
  update public.media_batch_items set status='published',product_id=(d->>'targetProductId')::uuid,lease_token=null,lease_until=null,error=null,updated_at=now() where id=i.id;
  insert into public.media_batch_audit(item_id,batch_id,actor_id,action,revision,detail) values(i.id,i.batch_id,i.approved_by,'image_added',i.revision,jsonb_build_object('product_id',d->>'targetProductId','output_sha256',i.output_sha256));
  return (d->>'targetProductId')::uuid;
 end if;
 v_slug=trim(both '-' from regexp_replace(lower(d->>'sku'),'[^a-z0-9]+','-','g'));
 if v_slug='' then v_slug='product'; end if;
 v_slug=v_slug||'-'||replace(i.id::text,'-','');
 -- Intentionally no ON CONFLICT update: a duplicate SKU must be resolved by review.
 insert into public.products(id,sku,slug,title,description,title_zh,description_zh,price_amount,currency,stock_qty,category,status,is_demo)
 values(i.id,trim(d->>'sku'),v_slug,trim(d->>'title'),d->>'description',trim(d->>'titleZh'),d->>'descriptionZh',(d->>'priceAmount')::integer,'hkd',(d->>'stockQty')::integer,trim(d->>'category'),'published',coalesce((d->>'isDemo')::boolean,false));
 insert into public.product_images(product_id,source_url,storage_path,alt_text,position) values(i.id,p_image_url,p_public_path,d->>'title',0);
 update public.media_batch_items set status='published',product_id=i.id,lease_token=null,lease_until=null,error=null,updated_at=now() where id=i.id;
 insert into public.media_batch_audit(item_id,batch_id,actor_id,action,revision,detail) values(i.id,i.batch_id,i.approved_by,'published',i.revision,jsonb_build_object('output_sha256',i.output_sha256,'product_id',i.id,'is_demo',coalesce((d->>'isDemo')::boolean,false)));
 return i.id;
end;$$;
create or replace function public.backend_save_kol(p_actor uuid,p_slug text,p_name text,p_bio text,p_status text) returns jsonb
language plpgsql security invoker set search_path='' as $$
declare r text;k uuid;
begin
 select role into r from public.staff_members where user_id=p_actor and active for share;
 if r is null or r not in ('super_admin','business_super_admin') then raise exception 'STAFF_FORBIDDEN'; end if;
 if p_slug !~ '^[a-z0-9]+(-[a-z0-9]+)*$' or length(p_slug)>80 or length(trim(p_name)) not between 1 and 120 or length(p_bio)>1500 or p_status not in ('active','inactive') then raise exception 'INVALID_HOST';end if;
 insert into public.kols(slug,display_name,bio,status)values(p_slug,p_name,p_bio,p_status) on conflict(slug) do update set display_name=excluded.display_name,bio=excluded.bio,status=excluded.status returning id into k;
 insert into public.backend_audit(actor_id,action,entity_id)values(p_actor,'host_saved',k);
 return jsonb_build_object('id',k,'slug',p_slug);
end;$$;
create or replace function private.guard_batch_storage_reservation() returns trigger
language plpgsql security invoker set search_path='' as $$
begin
 if old.status='processing' and new.status='review' and not exists(select 1 from private.batch_storage_reservations where item_id=new.id and bucket='batch-processed' and object_path=new.processed_path and sha256=new.output_sha256) then raise exception 'MISSING_OBJECT_RESERVATION'; end if;
 if new.status='published' and old.status<>'published' and not exists(select 1 from public.product_images im join private.batch_storage_reservations r on r.bucket='product-images' and r.object_path=im.storage_path and r.item_id=new.id and r.sha256=new.output_sha256 where im.product_id=new.product_id and new.product_id=coalesce((new.product_data->>'targetProductId')::uuid,new.id)) then raise exception 'MISSING_OBJECT_RESERVATION'; end if;
 return new;
end;$$;
commit;
