begin;
create table public.backend_audit(id bigint generated always as identity primary key,actor_id uuid not null references auth.users(id),action text not null,entity_id uuid not null,created_at timestamptz not null default now());
alter table public.backend_audit enable row level security;
revoke all on public.backend_audit from public,anon,authenticated;
grant select,insert on public.backend_audit to service_role;
grant usage,select on sequence public.backend_audit_id_seq to service_role;
create function public.backend_save_kol(p_actor uuid,p_slug text,p_name text,p_bio text,p_status text) returns jsonb
language plpgsql security invoker set search_path='' as $$
declare r text;k uuid;
begin
 select role into r from public.staff_members where user_id=p_actor and active for share;
 if r is distinct from 'super_admin' then raise exception 'STAFF_FORBIDDEN'; end if;
 if p_slug !~ '^[a-z0-9]+(-[a-z0-9]+)*$' or length(p_slug)>80 or length(trim(p_name)) not between 1 and 120 or length(p_bio)>1500 or p_status not in ('active','inactive') then raise exception 'INVALID_HOST';end if;
 insert into public.kols(slug,display_name,bio,status)values(p_slug,p_name,p_bio,p_status) on conflict(slug) do update set display_name=excluded.display_name,bio=excluded.bio,status=excluded.status returning id into k;
 insert into public.backend_audit(actor_id,action,entity_id)values(p_actor,'host_saved',k);
 return jsonb_build_object('id',k,'slug',p_slug);
end;$$;
create function public.backend_summary(p_actor uuid) returns jsonb
language plpgsql security invoker set search_path='' as $$
declare r text;own_kol uuid;result jsonb;paid_count bigint;paid_amount bigint;
begin
 select role,kol_id into r,own_kol from public.staff_members where user_id=p_actor and active for share;
 if r is null then raise exception 'STAFF_FORBIDDEN';end if;
 result=jsonb_build_object('cataloguePublished',(select count(*) from public.products where status='published'),'roomsPublic',(select count(*) from public.live_sessions where is_public and (r<>'kol' or kol_id=own_kol)),'batchOutstanding',(select count(*) from public.media_batch_items i join public.media_batches b on b.id=i.batch_id where (r='super_admin' or b.created_by=p_actor)and i.status<>'published'),'batchNeedsReview',(select count(*) from public.media_batch_items i join public.media_batches b on b.id=i.batch_id where (r='super_admin' or b.created_by=p_actor)and i.status='review'));
 if r in ('super_admin','operator','analyst') then
  result=result||jsonb_build_object('ordersNeedingReview',(select count(*) from public.orders where status='review'),'paidOrders',(select count(*) from public.orders where status='paid'),'paidRevenueByCurrency',(select coalesce(jsonb_object_agg(currency,amount),'{}'::jsonb) from(select currency,sum(total_amount) amount from public.orders where status='paid' group by currency)x));
 elsif r='kol' then
  select count(distinct o.id),coalesce(sum(i.line_total),0)into paid_count,paid_amount from public.orders o join public.order_items i on i.order_id=o.id where o.status='paid' and i.kol_id=own_kol and o.currency='hkd';
  result=result||jsonb_build_object('paidOrders',paid_count,'attributedMerchandiseHkd',paid_amount);
 elsif r='order_operator' then
  result=result||jsonb_build_object('assignedOrders',(select count(*) from public.order_assignments a where user_id=p_actor and(a.support or a.fulfillment)));
 end if;
 return result;
end;$$;
revoke all on function public.backend_save_kol(uuid,text,text,text,text),public.backend_summary(uuid) from public,anon,authenticated;
grant execute on function public.backend_save_kol(uuid,text,text,text,text),public.backend_summary(uuid) to service_role;
commit;
