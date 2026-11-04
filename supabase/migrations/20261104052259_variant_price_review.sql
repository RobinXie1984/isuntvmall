begin;
create function public.shopify_variant_approve_price(p_actor uuid,p_variant uuid,p_revision integer,p_evidence text) returns jsonb language plpgsql security invoker set search_path='' as $$
declare v public.product_variants;
begin
 perform private.merchandise_require_actor(p_actor,true);
 perform pg_catalog.pg_advisory_xact_lock(73219023);
 if p_variant is null or p_revision is null or p_revision<1 or coalesce(length(trim(p_evidence)),0) not between 20 and 1000 or p_evidence !~ 'https://[^[:space:]]+' then raise exception 'INVALID_INPUT';end if;
 select * into v from public.product_variants where id=p_variant for update;
 if not found then raise exception 'VARIANT_NOT_FOUND';end if;
 if v.revision<>p_revision then raise exception 'STALE_REVISION';end if;
 if v.proposed_price_amount is null or v.proposed_price_amount=1999 then raise exception 'PRICE_REVIEW_REQUIRED';end if;
 if not exists(select 1 from private.shopify_native_products s join public.products p on p.id=s.product_id where p.id=v.product_id and (p.status='draft' or (s.existing_product_revision is not null and not p.native_catalogue_enabled))) then raise exception 'VARIANT_EDIT_FORBIDDEN';end if;
 update public.product_variants set price_amount=v.proposed_price_amount,price_is_placeholder=false,revision=revision+1 where id=v.id;
 insert into private.shopify_native_audit(product_id,actor_id,action,detail) values(v.product_id,p_actor,'variant_price_approved',jsonb_build_object('variant',v.id,'amount',v.proposed_price_amount,'evidence',trim(p_evidence),'revision',v.revision+1));
 return jsonb_build_object('id',v.id,'revision',v.revision+1,'priceIsPlaceholder',false);
end;$$;
create function public.shopify_variant_prepare(p_actor uuid,p_variant uuid,p_revision integer) returns jsonb language plpgsql security invoker set search_path='' as $$
declare v public.product_variants;
begin
 perform private.merchandise_require_actor(p_actor,true);
 perform pg_catalog.pg_advisory_xact_lock(73219023);
 select * into v from public.product_variants where id=p_variant for update;
 if not found then raise exception 'VARIANT_NOT_FOUND';end if;
 if v.revision is distinct from p_revision then raise exception 'STALE_REVISION';end if;
 if v.stock_qty is null or v.price_is_placeholder or not exists(select 1 from public.product_variant_images vi join public.product_images im on im.id=vi.image_id and im.product_id=vi.product_id and im.is_visible where vi.variant_id=v.id) then raise exception 'VARIANT_REVIEW_INCOMPLETE';end if;
 if not exists(select 1 from private.shopify_native_products s join public.products p on p.id=s.product_id where p.id=v.product_id and (p.status='draft' or (s.existing_product_revision is not null and not p.native_catalogue_enabled))) then raise exception 'VARIANT_EDIT_FORBIDDEN';end if;
 update public.product_variants set active=true,revision=revision+1 where id=v.id;
 insert into private.shopify_native_audit(product_id,actor_id,action,detail) values(v.product_id,p_actor,'variant_prepared',jsonb_build_object('variant',v.id,'revision',v.revision+1));
 return jsonb_build_object('id',v.id,'revision',v.revision+1);
end;$$;
revoke all on function public.shopify_variant_prepare(uuid,uuid,integer) from public,anon,authenticated;
grant execute on function public.shopify_variant_prepare(uuid,uuid,integer) to service_role;
revoke all on function public.shopify_variant_approve_price(uuid,uuid,integer,text) from public,anon,authenticated;
grant execute on function public.shopify_variant_approve_price(uuid,uuid,integer,text) to service_role;
commit;
