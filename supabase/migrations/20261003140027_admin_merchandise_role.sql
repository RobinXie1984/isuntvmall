-- Admin has operator access plus merchandise approval and all-batch oversight.
-- Staff administration, owner configuration and order mutations remain unchanged.
-- No identities, active memberships, assignments or product records are changed.
begin;
alter table public.staff_members drop constraint staff_members_role_check;
alter table public.staff_members add constraint staff_members_role_check check(role in ('super_admin','admin','operator','catalog_editor','kol','order_operator','analyst'));
alter table public.staff_invitations drop constraint staff_invitations_role_check;
alter table public.staff_invitations add constraint staff_invitations_role_check check(role in ('super_admin','admin','operator','catalog_editor','kol','order_operator','analyst'));

-- Legacy p_super parameter means approval authority for batch review/publish.
-- The capacity configurator below preserves its explicit super-admin-only boundary.

create or replace function public.batch_require_staff(p_actor uuid,p_super boolean default false) returns text
language plpgsql security invoker set search_path='' as $$
declare r text; k uuid;
begin
 select role,kol_id into r,k from public.staff_members where user_id=p_actor and active for share;
 if r is null or r not in ('super_admin','admin','operator','catalog_editor','kol') or (r='kol' and k is null) or (p_super and r not in ('super_admin','admin')) then raise exception 'STAFF_FORBIDDEN'; end if;
 return r;
end;$$;

create or replace function public.batch_require_owner(p_actor uuid,p_batch_id uuid) returns void
language plpgsql security invoker set search_path='' as $$
declare r text;
begin
 r=public.batch_require_staff(p_actor);
 if not exists(select 1 from public.media_batches where id=p_batch_id and (created_by=p_actor or r in ('super_admin','admin'))) then raise exception 'BATCH_FORBIDDEN'; end if;
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
  if i.status in ('approved','publishing') and (i.approved_revision is distinct from i.revision or not exists(select 1 from public.staff_members where user_id=i.approved_by and active and role in ('super_admin','admin'))) then
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

create or replace function public.batch_configure_capacity(p_actor uuid,p_policy jsonb) returns jsonb
language plpgsql security invoker set search_path='' as $$
begin
 -- Capacity policy is an owner setting, separate from merchandise approval.
 if public.batch_require_staff(p_actor) <> 'super_admin' then raise exception 'STAFF_FORBIDDEN'; end if;
 if jsonb_typeof(p_policy) is distinct from 'object' or exists(select 1 from jsonb_object_keys(p_policy) k where k not in ('enabled','max_batch_items','max_batch_bytes','max_actor_outstanding','max_store_outstanding','max_actor_retained_bytes','max_store_retained_bytes')) then raise exception 'INVALID_CAPACITY_POLICY'; end if;
 update private.batch_admission_policy set
 enabled=coalesce((p_policy->>'enabled')::boolean,enabled),
 max_batch_items=coalesce((p_policy->>'max_batch_items')::integer,max_batch_items),
 max_batch_bytes=coalesce((p_policy->>'max_batch_bytes')::bigint,max_batch_bytes),
 max_actor_outstanding=coalesce((p_policy->>'max_actor_outstanding')::integer,max_actor_outstanding),
 max_store_outstanding=coalesce((p_policy->>'max_store_outstanding')::integer,max_store_outstanding),
 max_actor_retained_bytes=coalesce((p_policy->>'max_actor_retained_bytes')::bigint,max_actor_retained_bytes),
 max_store_retained_bytes=coalesce((p_policy->>'max_store_retained_bytes')::bigint,max_store_retained_bytes),
 updated_by=p_actor,updated_at=now() where singleton;
 insert into public.media_batch_audit(actor_id,action,detail) values(p_actor,'capacity_policy_updated',p_policy);
 return public.batch_capacity(p_actor);
end;$$;

create or replace function public.staff_set_member(p_actor uuid,p_target uuid,p_role text,p_active boolean,p_kol uuid default null) returns public.staff_members
language plpgsql security invoker set search_path='' as $$
declare actor public.staff_members; previous public.staff_members; result public.staff_members;
begin
 perform pg_catalog.pg_advisory_xact_lock(hashtextextended('isuntvmall:staff-membership',0));
 select * into actor from public.staff_members where user_id=p_actor and active for share;
 if actor.role is distinct from 'super_admin' then raise exception 'STAFF_FORBIDDEN'; end if;
 if p_target=p_actor then raise exception 'SELF_MEMBERSHIP_CHANGE_DENIED'; end if;
 if p_role is null or p_role not in ('super_admin','admin','operator','catalog_editor','kol','order_operator','analyst') or p_active is null then raise exception 'INVALID_ROLE'; end if;
 if (p_role='kol') is distinct from (p_kol is not null) then raise exception 'KOL_BINDING_REQUIRED'; end if;
 if p_kol is not null and not exists(select 1 from public.kols where id=p_kol and status='active') then raise exception 'KOL_NOT_ACTIVE'; end if;
 if not exists(select 1 from auth.users where id=p_target and not coalesce(is_anonymous,false)) then raise exception 'NAMED_USER_REQUIRED'; end if;
 select * into previous from public.staff_members where user_id=p_target for update;
 if previous.role='super_admin' and previous.active and (not p_active or p_role<>'super_admin') and (select count(*) from public.staff_members where role='super_admin' and active)<=1 then raise exception 'LAST_SUPER_ADMIN'; end if;
 insert into public.staff_members(user_id,role,active,kol_id) values(p_target,p_role,p_active,p_kol)
 on conflict(user_id) do update set role=excluded.role,active=excluded.active,kol_id=excluded.kol_id,updated_at=now() returning * into result;
 insert into public.staff_audit(actor_id,target_id,action,before_state,after_state) values(p_actor,p_target,case when previous.user_id is null then 'membership_created' else 'membership_updated' end,
 case when previous.user_id is null then null else jsonb_build_object('role',previous.role,'active',previous.active,'kolId',previous.kol_id) end,
 jsonb_build_object('role',result.role,'active',result.active,'kolId',result.kol_id));
 return result;
end;$$;

create or replace function public.live_require_actor(p_actor uuid,p_kol uuid,p_operator boolean default false) returns text
language plpgsql security invoker set search_path='' as $$
declare r text; k uuid;
begin
 select role,kol_id into r,k from public.staff_members where user_id=p_actor and active for share;
 if r is null or (p_operator and r not in ('super_admin','admin','operator')) or (not p_operator and r not in ('super_admin','admin','operator') and not(r='kol' and k is not null and k=p_kol)) then raise exception 'LIVE_FORBIDDEN';end if;
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
 if not found or c.checked_at<now()-interval '24 hours' or not exists(select 1 from public.staff_members where user_id=c.checked_by and active and role in ('super_admin','admin','operator')) then raise exception 'SOURCE_NOT_VERIFIED';end if;
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
 if r is null or r not in ('super_admin','admin','operator','order_operator') then raise exception 'ORDER_FORBIDDEN'; end if;
 if p_page<0 or p_page>100000 or length(p_search)>80 then raise exception 'INVALID_ORDER_FILTER'; end if;
 select count(*) into total from public.orders o where (r='super_admin' or (r in ('admin','operator') and o.status='review') or (r='order_operator' and exists(select 1 from public.order_assignments a where a.order_id=o.id and a.user_id=p_actor and(a.support or a.fulfillment)))) and(p_status='' or o.status::text=p_status) and(p_search='' or o.id::text like p_search||'%');
 select coalesce(jsonb_agg(x.payload order by x.created_at desc,x.id),'[]'::jsonb) into result from (
 select o.id,o.created_at,jsonb_build_object('id',o.id,'status',o.status,'currency',o.currency,'subtotalAmount',o.subtotal_amount,'totalAmount',o.total_amount,'createdAt',o.created_at,'revision',o.operation_revision,'fulfillmentStatus',o.fulfillment_status,'carrier',case when r='super_admin' or a.fulfillment then o.carrier else null end,'trackingNumber',case when r='super_admin' or a.fulfillment then o.tracking_number else null end,
 'customerEmail',case when r='super_admin' or a.support then o.customer_email else null end,'customerName',case when r='super_admin' or a.support or a.fulfillment then o.customer_name else null end,
 'shippingAddress',case when (r='super_admin' or a.fulfillment) and o.status='paid' then o.shipping_address else null end,
 'fulfillmentOnHold',exists(select 1 from public.refund_requests f where f.order_id=o.id and f.status in ('requested','approved')),
 'canFulfill',r='super_admin' or coalesce(a.fulfillment,false),'canRequestRefund',r='super_admin' or coalesce(a.support,false),
 'items',(select coalesce(jsonb_agg(jsonb_build_object('sku',i.sku,'title',i.title,'quantity',i.quantity,'lineTotal',i.line_total)),'[]'::jsonb) from public.order_items i where i.order_id=o.id),
 'refundRequests',case when r='super_admin' or a.support then (select coalesce(jsonb_agg(jsonb_build_object('id',f.id,'reason',f.reason,'status',f.status,'reviewNote',f.review_note)),'[]'::jsonb) from public.refund_requests f where f.order_id=o.id) else '[]'::jsonb end) payload
 from public.orders o left join public.order_assignments a on a.order_id=o.id and a.user_id=p_actor and r='order_operator'
 where (r='super_admin' or (r in ('admin','operator') and o.status='review') or (r='order_operator' and (a.support or a.fulfillment))) and(p_status='' or o.status::text=p_status) and(p_search='' or o.id::text like p_search||'%') order by o.created_at desc,o.id limit 25 offset p_page*25
 )x;
 return jsonb_build_object('items',result,'count',total,'page',p_page);
end;$$;

create or replace function public.backend_summary(p_actor uuid) returns jsonb
language plpgsql security invoker set search_path='' as $$
declare r text;own_kol uuid;result jsonb;paid_count bigint;paid_amount bigint;
begin
 select role,kol_id into r,own_kol from public.staff_members where user_id=p_actor and active for share;
 if r is null then raise exception 'STAFF_FORBIDDEN';end if;
 result=jsonb_build_object('cataloguePublished',(select count(*) from public.products where status='published'),'roomsPublic',(select count(*) from public.live_sessions where is_public and (r<>'kol' or kol_id=own_kol)),'batchOutstanding',(select count(*) from public.media_batch_items i join public.media_batches b on b.id=i.batch_id where (r in ('super_admin','admin') or b.created_by=p_actor)and i.status<>'published'),'batchNeedsReview',(select count(*) from public.media_batch_items i join public.media_batches b on b.id=i.batch_id where (r in ('super_admin','admin') or b.created_by=p_actor)and i.status='review'));
 if r in ('super_admin','admin','operator','analyst') then
  result=result||jsonb_build_object('ordersNeedingReview',(select count(*) from public.orders where status='review'),'paidOrders',(select count(*) from public.orders where status='paid'),'paidRevenueByCurrency',(select coalesce(jsonb_object_agg(currency,amount),'{}'::jsonb) from(select currency,sum(total_amount) amount from public.orders where status='paid' group by currency)x));
 elsif r='kol' then
  select count(distinct o.id),coalesce(sum(i.line_total),0)into paid_count,paid_amount from public.orders o join public.order_items i on i.order_id=o.id where o.status='paid' and i.kol_id=own_kol and o.currency='hkd';
  result=result||jsonb_build_object('paidOrders',paid_count,'attributedMerchandiseHkd',paid_amount);
 elsif r='order_operator' then
  result=result||jsonb_build_object('assignedOrders',(select count(*) from public.order_assignments a where user_id=p_actor and(a.support or a.fulfillment)));
 end if;
 return result;
end;$$;

-- CREATE OR REPLACE retains existing service-only ACLs and invoker security.
commit;
