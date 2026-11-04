begin;
create function public.shopify_variant_stock_adjust(p_actor uuid,p_variant uuid,p_revision integer,p_stock integer,p_reason text) returns jsonb language plpgsql security invoker set search_path='' as $$
declare v public.product_variants; held bigint;
begin
 if not exists(select 1 from public.staff_members where user_id=p_actor and active and role in ('super_admin','business_super_admin','merchandise_admin','admin','operator') for share) then raise exception 'STOCK_FORBIDDEN';end if;
 if p_variant is null or p_revision is null or p_revision<1 or p_stock is null or p_stock not between 0 and 1000000 or coalesce(length(trim(p_reason)),0) not between 1 and 1000 then raise exception 'INVALID_INPUT';end if;
 perform pg_catalog.pg_advisory_xact_lock(73219023);
 select * into v from public.product_variants where id=p_variant for update;
 if not found then raise exception 'VARIANT_NOT_FOUND';end if;
 if v.revision<>p_revision then raise exception 'STALE_REVISION';end if;
 if not exists(select 1 from private.shopify_native_products s join public.products p on p.id=s.product_id where p.id=v.product_id and p.status='published') then raise exception 'VARIANT_EDIT_FORBIDDEN';end if;
 select coalesce(sum(quantity),0) into held from public.inventory_reservations where variant_id=v.id and status='active';
 if p_stock<held then raise exception 'STOCK_BELOW_RESERVATIONS';end if;
 update public.product_variants set stock_qty=p_stock,revision=revision+1 where id=v.id;
 insert into private.shopify_native_audit(product_id,actor_id,action,detail) values(v.product_id,p_actor,'variant_stock_adjusted',jsonb_build_object('variant',v.id,'oldStock',v.stock_qty,'newStock',p_stock,'held',held,'reason',trim(p_reason),'revision',v.revision+1));
 return jsonb_build_object('id',v.id,'revision',v.revision+1,'stockQty',p_stock,'reservedQty',held);
end;$$;
revoke all on function public.shopify_variant_stock_adjust(uuid,uuid,integer,integer,text) from public,anon,authenticated;
grant execute on function public.shopify_variant_stock_adjust(uuid,uuid,integer,integer,text) to service_role;
commit;
