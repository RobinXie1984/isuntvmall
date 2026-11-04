-- One-transaction authorization for explicit business review of native drafts.
begin;
create table private.shopify_release_authorizations (
 product_id uuid primary key references public.products(id),
 actor_id uuid not null references auth.users(id),
 transaction_id bigint not null
);
alter table private.shopify_release_authorizations enable row level security;
revoke all on private.shopify_release_authorizations from public,anon,authenticated;
grant select,insert,delete on private.shopify_release_authorizations to service_role;
create or replace function private.keep_product_demo_label() returns trigger language plpgsql security invoker set search_path='' as $$
begin
 if old.is_demo and not new.is_demo and not exists(select 1 from private.shopify_release_authorizations a where a.product_id=old.id and a.transaction_id=txid_current()) then raise exception 'DEMO_LABEL_PROTECTED';end if;
 return new;
end;$$;
create or replace function private.shopify_guard_draft_publish() returns trigger language plpgsql security invoker set search_path='' as $$
begin
 if new.status='published' and old.status is distinct from new.status and exists(select 1 from private.shopify_native_products where product_id=new.id) and not exists(select 1 from private.shopify_release_authorizations a where a.product_id=new.id and a.transaction_id=txid_current()) then raise exception 'VARIANT_MIGRATION_NOT_READY';end if;
 if old.status='published' and new.price_amount is distinct from old.price_amount and exists(select 1 from private.shopify_native_products where product_id=old.id) then raise exception 'VARIANT_PRICE_REVIEW_REQUIRED';end if;
 return new;
end;$$;
drop trigger shopify_guard_draft_publish on public.products;
create trigger shopify_guard_draft_publish before update of status,price_amount on public.products for each row execute function private.shopify_guard_draft_publish();
create function public.shopify_publish_native(p_actor uuid,p_product uuid,p_catalog_revision integer,p_variant_revisions jsonb,p_evidence text) returns jsonb language plpgsql security invoker set search_path='' as $$
declare p public.products; v jsonb; actual jsonb; min_price integer;
begin
 perform private.merchandise_require_actor(p_actor,true);
 perform pg_catalog.pg_advisory_xact_lock(73219023);
 if p_product is null or p_catalog_revision is null or jsonb_typeof(p_variant_revisions) is distinct from 'array' or coalesce(length(trim(p_evidence)),0) not between 20 and 1000 then raise exception 'INVALID_INPUT';end if;
 select * into p from public.products where id=p_product for update;
 if not found or not exists(select 1 from private.shopify_native_products where product_id=p_product) or p.status<>'draft' or not p.is_demo then raise exception 'PRODUCT_NOT_READY';end if;
 if p.catalog_revision is distinct from p_catalog_revision then raise exception 'STALE_REVISION';end if;
 if coalesce(length(trim(p.title)),0)<1 or coalesce(length(trim(p.title_zh)),0)<1 or coalesce(length(trim(p.description)),0)<1 or coalesce(length(trim(p.description_zh)),0)<1 or p.category='General' then raise exception 'PRODUCT_DETAILS_INCOMPLETE';end if;
 perform 1 from public.product_variants where product_id=p.id for update;
 select coalesce(jsonb_agg(jsonb_build_object('id',id,'revision',revision) order by id),'[]'::jsonb),min(price_amount) into actual,min_price from public.product_variants where product_id=p.id and active;
 select coalesce(jsonb_agg(value order by value->>'id'),'[]'::jsonb) into v from jsonb_array_elements(p_variant_revisions);
 if v is distinct from actual then raise exception 'STALE_REVISION';end if;
 if min_price is null or exists(select 1 from public.product_variants x where x.product_id=p.id and x.active and (x.stock_qty is null or x.price_is_placeholder or x.price_amount=1999 or not exists(select 1 from public.product_variant_images vi join public.product_images im on im.id=vi.image_id and im.product_id=vi.product_id and im.is_visible where vi.variant_id=x.id))) then raise exception 'VARIANT_REVIEW_INCOMPLETE';end if;
 insert into private.shopify_release_authorizations(product_id,actor_id,transaction_id) values(p.id,p_actor,txid_current());
 update public.products set status='published',is_demo=false,price_amount=min_price,catalog_revision=catalog_revision+1 where id=p.id;
 delete from private.shopify_release_authorizations where product_id=p.id and transaction_id=txid_current();
 insert into private.shopify_native_audit(product_id,actor_id,action,detail) values(p.id,p_actor,'product_published',jsonb_build_object('evidence',trim(p_evidence),'variants',actual,'previousRevision',p.catalog_revision));
 return jsonb_build_object('ok',true,'id',p.id);
end;$$;
revoke all on function public.shopify_publish_native(uuid,uuid,integer,jsonb,text) from public,anon,authenticated;
grant execute on function public.shopify_publish_native(uuid,uuid,integer,jsonb,text) to service_role;
commit;
