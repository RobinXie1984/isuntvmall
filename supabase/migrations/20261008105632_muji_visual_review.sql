-- Explicit human visual review bound to the current product/image revision.
create function public.batch_review_visual(p_actor uuid,p_item_id uuid,p_revision integer,p_decision text,p_reason text, p_visual_review jsonb) returns public.media_batch_items
language plpgsql security invoker set search_path='' as $$
declare i public.media_batch_items;
begin
 perform public.batch_require_staff(p_actor,true);
 select * into i from public.media_batch_items where id=p_item_id for update;
 if not found or i.revision is distinct from p_revision or i.status<>'review' then raise exception 'STALE_OR_INVALID_STATE'; end if;
 if p_decision is null or p_decision not in ('approve','reject') then raise exception 'INVALID_DECISION'; end if;
 if p_decision='approve' and (not public.batch_valid_product(i.product_data) or i.output_sha256 is null or i.source_sha256 is null or i.processed_path is null) then raise exception 'INCOMPLETE_PRODUCT'; end if;
 if p_decision='approve' and p_visual_review is distinct from '{"version":"muji-v1","calmBackground":true,"cleanComposition":true,"faithfulAppearance":true,"noPromotionalText":true}'::jsonb then raise exception 'VISUAL_REVIEW_REQUIRED'; end if;
 update public.media_batch_items set status=case when p_decision='approve' then 'approved' else 'rejected' end,
 approved_by=case when p_decision='approve' then p_actor end,approved_at=case when p_decision='approve' then now() end,
 approved_revision=case when p_decision='approve' then revision end,error=case when p_decision='reject' then left(p_reason,1000) end,attempts=0,updated_at=now()
 where id=i.id returning * into i;
 insert into public.media_batch_audit(item_id,batch_id,actor_id,action,revision,detail) values(i.id,i.batch_id,p_actor,p_decision,i.revision,jsonb_build_object('reason',left(p_reason,1000),'visual_review',p_visual_review,'output_sha256',i.output_sha256));
 return i;
end;$$;

-- Retain the historical API for rejection, but never permit an unreviewed approval.
create or replace function public.batch_review(p_actor uuid,p_item_id uuid,p_revision integer,p_decision text,p_reason text default '') returns public.media_batch_items
language plpgsql security invoker set search_path='' as $$
begin
 return public.batch_review_visual(p_actor,p_item_id,p_revision,p_decision,p_reason,null);
end;$$;
revoke execute on function public.batch_review_visual(uuid,uuid,integer,text,text,jsonb) from public,anon,authenticated;
grant execute on function public.batch_review_visual(uuid,uuid,integer,text,text,jsonb) to service_role;
