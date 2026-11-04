begin;
alter table public.product_variants add column option_labels jsonb not null default '{}'::jsonb check(jsonb_typeof(option_labels)='object');
create function public.shopify_variant_set_labels(p_actor uuid,p_variant uuid,p_revision integer,p_labels jsonb) returns jsonb language plpgsql security invoker set search_path='' as $$
declare v public.product_variants;
begin
 perform private.merchandise_require_actor(p_actor);
 perform pg_catalog.pg_advisory_xact_lock(73219023);
 if p_variant is null or p_revision is null or p_revision<1 or jsonb_typeof(p_labels) is distinct from 'object' or exists(select 1 from jsonb_object_keys(p_labels) k where k not in ('en','zh-Hant','zh-Hans','ja')) or exists(select 1 from unnest(array['en','zh-Hant','zh-Hans','ja']) k where jsonb_typeof(p_labels->k) is distinct from 'string' or coalesce(length(trim(p_labels->>k)),0) not between 1 and 240) then raise exception 'INVALID_INPUT';end if;
 select * into v from public.product_variants where id=p_variant for update;
 if not found then raise exception 'VARIANT_NOT_FOUND';end if;
 if v.revision<>p_revision then raise exception 'STALE_REVISION';end if;
 if not exists(select 1 from private.shopify_native_products s join public.products p on p.id=s.product_id where p.id=v.product_id and p.status='draft') then raise exception 'VARIANT_EDIT_FORBIDDEN';end if;
 update public.product_variants set option_labels=p_labels,active=false,revision=revision+1 where id=v.id;
 insert into private.shopify_native_audit(product_id,actor_id,action,detail) values(v.product_id,p_actor,'variant_labels_changed',jsonb_build_object('variant',v.id,'revision',v.revision+1));
 return jsonb_build_object('id',v.id,'revision',v.revision+1);
end;$$;
revoke all on function public.shopify_variant_set_labels(uuid,uuid,integer,jsonb) from public,anon,authenticated;
grant execute on function public.shopify_variant_set_labels(uuid,uuid,integer,jsonb) to service_role;
create or replace function public.shopify_variant_list(p_actor uuid,p_product uuid) returns jsonb language plpgsql security invoker set search_path='' as $$
declare result jsonb;
begin
 perform private.merchandise_require_actor(p_actor);
 if not exists(select 1 from private.shopify_native_products where product_id=p_product) then raise exception 'PRODUCT_NOT_FOUND';end if;
 select coalesce(jsonb_agg(jsonb_build_object('id',v.id,'sku',v.sku,'options',v.option_values,'labels',v.option_labels,'stockQty',v.stock_qty,'proposedPriceAmount',v.proposed_price_amount,'priceAmount',v.price_amount,'priceIsPlaceholder',v.price_is_placeholder,'active',v.active,'revision',v.revision) order by v.source_index),'[]') into result from public.product_variants v where v.product_id=p_product;
 return result;
end;$$;
create or replace function public.shopify_variant_prepare(p_actor uuid,p_variant uuid,p_revision integer) returns jsonb language plpgsql security invoker set search_path='' as $$
declare v public.product_variants;
begin
 perform private.merchandise_require_actor(p_actor,true);
 perform pg_catalog.pg_advisory_xact_lock(73219023);
 select * into v from public.product_variants where id=p_variant for update;
 if not found then raise exception 'VARIANT_NOT_FOUND';end if;
 if v.revision is distinct from p_revision then raise exception 'STALE_REVISION';end if;
 if v.stock_qty is null or v.price_is_placeholder or exists(select 1 from unnest(array['en','zh-Hant','zh-Hans','ja']) lang where coalesce(length(trim(v.option_labels->>lang)),0)=0) or not exists(select 1 from public.product_variant_images vi join public.product_images im on im.id=vi.image_id and im.product_id=vi.product_id and im.is_visible where vi.variant_id=v.id) then raise exception 'VARIANT_REVIEW_INCOMPLETE';end if;
 if not exists(select 1 from private.shopify_native_products s join public.products p on p.id=s.product_id where p.id=v.product_id and p.status='draft') then raise exception 'VARIANT_EDIT_FORBIDDEN';end if;
 update public.product_variants set active=true,revision=revision+1 where id=v.id;
 insert into private.shopify_native_audit(product_id,actor_id,action,detail) values(v.product_id,p_actor,'variant_prepared',jsonb_build_object('variant',v.id,'revision',v.revision+1));
 return jsonb_build_object('id',v.id,'revision',v.revision+1);
end;$$;
commit;
