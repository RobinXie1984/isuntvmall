-- Prepare variants against the existing identity without changing its public listing.
begin;
create function public.shopify_reconcile_existing(p_actor uuid,p_batch uuid,p_handle text,p_product uuid,p_sku text,p_slug text) returns jsonb language plpgsql security invoker set search_path='' as $$
declare p public.products; entry jsonb; existing private.shopify_native_products; v jsonb; i integer:=0;
begin
 perform private.merchandise_require_actor(p_actor);
 perform pg_catalog.pg_advisory_xact_lock(73219023);
 if p_product is null or p_handle is null or p_slug is distinct from 'suntv-'||p_handle or p_sku !~ '^SUNTV-[0-9]+$' then raise exception 'INVALID_INPUT';end if;
 select * into p from public.products where id=p_product for update;
 if not found or p.sku is distinct from p_sku or p.slug is distinct from p_slug or p.status<>'published' then raise exception 'SOURCE_IDENTITY_CONFLICT';end if;
 select * into existing from private.shopify_native_products where source_handle=p_handle or product_id=p.id;
 if found then
  if existing.source_handle is distinct from p_handle or existing.product_id is distinct from p.id or existing.source_batch_id is distinct from p_batch then raise exception 'SOURCE_CONFLICT';end if;
  return jsonb_build_object('id',p.id,'replayed',true,'existing',true);
 end if;
 select payload into entry from private.shopify_import_products where batch_id=p_batch and handle=p_handle;
 if entry is null or jsonb_array_length(entry->'variants') not between 1 and 1000 then raise exception 'STAGED_PRODUCT_UNAVAILABLE';end if;
 insert into private.shopify_native_products(source_handle,product_id,source_batch_id,created_by,existing_product_revision) values(p_handle,p.id,p_batch,p_actor,p.catalog_revision);
 for v in select value from jsonb_array_elements(entry->'variants') loop
  insert into public.product_variants(product_id,source_index,sku,option_values) values(p.id,i,coalesce(v->>'sku',''),v->'options');i:=i+1;
 end loop;
 insert into private.shopify_native_audit(product_id,actor_id,action,detail) values(p.id,p_actor,'existing_product_reconciled',jsonb_build_object('batch',p_batch,'baseRevision',p.catalog_revision,'variants',i));
 return jsonb_build_object('id',p.id,'replayed',false,'existing',true,'variants',i);
end;$$;
revoke all on function public.shopify_reconcile_existing(uuid,uuid,text,uuid,text,text) from public,anon,authenticated;
grant execute on function public.shopify_reconcile_existing(uuid,uuid,text,uuid,text,text) to service_role;
create or replace function public.merchandise_list(p_actor uuid,p_page integer default 0,p_search text default '') returns jsonb language plpgsql security invoker set search_path='' as $$
declare items jsonb;total bigint;
begin
 perform private.merchandise_require_actor(p_actor);
 if p_page is null or p_page not between 0 and 100000 or p_search is null or length(p_search)>120 then raise exception 'INVALID_INPUT';end if;
 select count(*) into total from public.products p where p_search='' or p.sku ilike '%'||p_search||'%' or p.title ilike '%'||p_search||'%';
 select coalesce(jsonb_agg(x.payload order by x.sku,x.id),'[]') into items from(
 select p.id,p.sku,jsonb_build_object('nativeCatalogueEnabled',p.native_catalogue_enabled,'id',p.id,'sku',p.sku,'slug',p.slug,'revision',coalesce(d.revision,0),'baseRevision',p.catalog_revision,'draftState',coalesce(d.state,'published'),'supplier',coalesce(d.supplier,'{}'),
 'payload',coalesce(d.payload,jsonb_build_object('title',p.title,'titleZh',p.title_zh,'description',p.description,'descriptionZh',p.description_zh,'category',p.category,'priceAmount',p.price_amount,'status',p.status,'isDemo',p.is_demo,'visibleImageIds',(select coalesce(jsonb_agg(id order by position),'[]') from public.product_images where product_id=p.id and is_visible))),
 'images',(select coalesce(jsonb_agg(jsonb_build_object('id',id,'url',source_url,'visible',is_visible) order by position),'[]') from public.product_images where product_id=p.id)) payload
 from public.products p left join private.merchandise_drafts d on d.product_id=p.id where p_search='' or p.sku ilike '%'||p_search||'%' or p.title ilike '%'||p_search||'%' order by p.sku,p.id limit 25 offset p_page*25)x;
 return jsonb_build_object('items',items,'count',total,'page',p_page,'categories',(select coalesce(jsonb_agg(category order by category),'[]') from(select distinct category from public.products)c));
end;$$;
commit;
