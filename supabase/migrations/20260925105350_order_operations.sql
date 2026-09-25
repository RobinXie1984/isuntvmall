begin;
alter table public.orders add column fulfillment_status text not null default 'unfulfilled' check(fulfillment_status in ('unfulfilled','packed','shipped','delivered'));
alter table public.orders add column operation_revision integer not null default 1;
alter table public.orders add column tracking_number text;
alter table public.orders add column carrier text;
create table public.order_assignments(order_id uuid references public.orders(id) on delete cascade,user_id uuid references public.staff_members(user_id),support boolean not null default false,fulfillment boolean not null default false,primary key(order_id,user_id));
create table public.refund_requests(id uuid primary key default gen_random_uuid(),order_id uuid not null references public.orders(id),requested_by uuid not null references auth.users(id),reason text not null check(char_length(reason) between 1 and 1000),status text not null default 'requested' check(status in ('requested','approved','rejected')),reviewed_by uuid references auth.users(id),review_note text,created_at timestamptz not null default now());
create unique index one_open_refund_request on public.refund_requests(order_id) where status in ('requested','approved');
create table public.order_operation_audit(id bigint generated always as identity primary key,order_id uuid not null references public.orders(id),actor_id uuid not null references auth.users(id),action text not null,revision integer not null,request_id uuid not null,request_fingerprint text not null,created_at timestamptz not null default now(),unique(actor_id,request_id));
alter table public.order_assignments enable row level security;
alter table public.refund_requests enable row level security;
alter table public.order_operation_audit enable row level security;
revoke all on public.order_assignments,public.refund_requests,public.order_operation_audit from public,anon,authenticated;
grant all on public.order_assignments,public.refund_requests to service_role;
grant select,insert on public.order_operation_audit to service_role;
grant usage,select on sequence public.order_operation_audit_id_seq to service_role;
create function public.order_list_scoped(p_actor uuid,p_page integer default 0,p_status text default '',p_search text default '') returns jsonb
language plpgsql security invoker set search_path='' as $$
declare r text; total bigint; result jsonb;
begin
 select role into r from public.staff_members where user_id=p_actor and active for share;
 if r is null or r not in ('super_admin','operator','order_operator') then raise exception 'ORDER_FORBIDDEN'; end if;
 if p_page<0 or p_page>100000 or length(p_search)>80 then raise exception 'INVALID_ORDER_FILTER'; end if;
 select count(*) into total from public.orders o where (r='super_admin' or (r='operator' and o.status='review') or (r='order_operator' and exists(select 1 from public.order_assignments a where a.order_id=o.id and a.user_id=p_actor and(a.support or a.fulfillment)))) and(p_status='' or o.status::text=p_status) and(p_search='' or o.id::text like p_search||'%');
 select coalesce(jsonb_agg(x.payload order by x.created_at desc,x.id),'[]'::jsonb) into result from (
 select o.id,o.created_at,jsonb_build_object('id',o.id,'status',o.status,'currency',o.currency,'subtotalAmount',o.subtotal_amount,'totalAmount',o.total_amount,'createdAt',o.created_at,'revision',o.operation_revision,'fulfillmentStatus',o.fulfillment_status,'carrier',case when r='super_admin' or a.fulfillment then o.carrier else null end,'trackingNumber',case when r='super_admin' or a.fulfillment then o.tracking_number else null end,
 'customerEmail',case when r='super_admin' or a.support then o.customer_email else null end,'customerName',case when r='super_admin' or a.support or a.fulfillment then o.customer_name else null end,
 'shippingAddress',case when (r='super_admin' or a.fulfillment) and o.status='paid' then o.shipping_address else null end,
 'fulfillmentOnHold',exists(select 1 from public.refund_requests f where f.order_id=o.id and f.status in ('requested','approved')),
 'canFulfill',r='super_admin' or coalesce(a.fulfillment,false),'canRequestRefund',r='super_admin' or coalesce(a.support,false),
 'items',(select coalesce(jsonb_agg(jsonb_build_object('sku',i.sku,'title',i.title,'quantity',i.quantity,'lineTotal',i.line_total)),'[]'::jsonb) from public.order_items i where i.order_id=o.id),
 'refundRequests',case when r='super_admin' or a.support then (select coalesce(jsonb_agg(jsonb_build_object('id',f.id,'reason',f.reason,'status',f.status,'reviewNote',f.review_note)),'[]'::jsonb) from public.refund_requests f where f.order_id=o.id) else '[]'::jsonb end) payload
 from public.orders o left join public.order_assignments a on a.order_id=o.id and a.user_id=p_actor and r='order_operator'
 where (r='super_admin' or (r='operator' and o.status='review') or (r='order_operator' and (a.support or a.fulfillment))) and(p_status='' or o.status::text=p_status) and(p_search='' or o.id::text like p_search||'%') order by o.created_at desc,o.id limit 25 offset p_page*25
 )x;
 return jsonb_build_object('items',result,'count',total,'page',p_page);
end;$$;
create function public.order_operate(p_actor uuid,p_order uuid,p_revision integer,p_request uuid,p_action text,p_data jsonb default '{}'::jsonb) returns jsonb
language plpgsql security invoker set search_path='' as $$
declare r text;o public.orders;a public.order_assignments;fp text;prior public.order_operation_audit;target_role text;new_revision integer;
begin
 select role into r from public.staff_members where user_id=p_actor and active for share;
 if r is null or r not in ('super_admin','order_operator') then raise exception 'ORDER_FORBIDDEN'; end if;
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
 if r<>'super_admin' and (a.user_id is null or not(a.support or a.fulfillment)) then raise exception 'ORDER_FORBIDDEN'; end if;
 if o.operation_revision<>p_revision then raise exception 'STALE_REVISION'; end if;
 if p_action='assign' then
  if r<>'super_admin' then raise exception 'ORDER_FORBIDDEN'; end if;
  select role into target_role from public.staff_members where user_id=(p_data->>'userId')::uuid and active for share;
  if target_role is distinct from 'order_operator' then raise exception 'ASSIGNEE_INVALID'; end if;
  insert into public.order_assignments(order_id,user_id,support,fulfillment) values(p_order,(p_data->>'userId')::uuid,coalesce((p_data->>'support')::boolean,false),coalesce((p_data->>'fulfillment')::boolean,false)) on conflict(order_id,user_id) do update set support=excluded.support,fulfillment=excluded.fulfillment;
 elsif p_action in ('pack','ship','deliver') then
  if r<>'super_admin' and not coalesce(a.fulfillment,false) then raise exception 'ORDER_FORBIDDEN'; end if;
  if o.status<>'paid' then raise exception 'PAID_ORDER_REQUIRED'; end if;
  if exists(select 1 from public.refund_requests where order_id=p_order and status in ('requested','approved')) then raise exception 'REFUND_REVIEW_HOLD'; end if;
  if (p_action='pack' and o.fulfillment_status<>'unfulfilled') or (p_action='ship' and o.fulfillment_status<>'packed') or(p_action='deliver' and o.fulfillment_status<>'shipped') then raise exception 'INVALID_FULFILLMENT_TRANSITION'; end if;
  if p_action='ship' and (coalesce(length(trim(p_data->>'carrier')),0) not between 1 and 80 or coalesce(length(trim(p_data->>'trackingNumber')),0) not between 1 and 160) then raise exception 'TRACKING_REQUIRED'; end if;
  update public.orders set fulfillment_status=case p_action when 'pack' then 'packed' when 'ship' then 'shipped' else 'delivered' end,carrier=case when p_action='ship' then trim(p_data->>'carrier') else carrier end,tracking_number=case when p_action='ship' then trim(p_data->>'trackingNumber') else tracking_number end where id=p_order;
 elsif p_action='request_refund' then
  if r<>'super_admin' and not coalesce(a.support,false) then raise exception 'ORDER_FORBIDDEN'; end if;
  if o.status<>'paid' or coalesce(length(trim(p_data->>'reason')),0) not between 1 and 1000 then raise exception 'REFUND_REQUEST_INVALID'; end if;
  insert into public.refund_requests(order_id,requested_by,reason) values(p_order,p_actor,trim(p_data->>'reason'));
 elsif p_action='review_refund' then
  if r<>'super_admin' then raise exception 'ORDER_FORBIDDEN'; end if;
  if coalesce(p_data->>'decision','') not in ('approved','rejected') or coalesce(length(trim(p_data->>'note')),0) not between 1 and 1000 then raise exception 'REFUND_REVIEW_INVALID'; end if;
  update public.refund_requests set status=p_data->>'decision',reviewed_by=p_actor,review_note=trim(p_data->>'note') where id=(p_data->>'refundId')::uuid and order_id=p_order and status='requested';
  if not found then raise exception 'REFUND_REQUEST_NOT_FOUND'; end if;
 else raise exception 'INVALID_ORDER_OPERATION'; end if;
 update public.orders set operation_revision=operation_revision+1 where id=p_order returning operation_revision into new_revision;
 insert into public.order_operation_audit(order_id,actor_id,action,revision,request_id,request_fingerprint) values(p_order,p_actor,p_action,new_revision,p_request,fp);
 return jsonb_build_object('ok',true,'revision',new_revision,'replayed',false);
end;$$;
revoke all on function public.order_list_scoped(uuid,integer,text,text),public.order_operate(uuid,uuid,integer,uuid,text,jsonb) from public,anon,authenticated;
grant execute on function public.order_list_scoped(uuid,integer,text,text),public.order_operate(uuid,uuid,integer,uuid,text,jsonb) to service_role;
commit;
