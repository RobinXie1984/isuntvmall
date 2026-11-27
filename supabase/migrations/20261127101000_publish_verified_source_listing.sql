begin;

-- Source catalogue publication and native checkout readiness are separate
-- decisions. Keep the native guard and its transaction-scoped authorization.
create function public.shopify_publish_source_listing(
  p_actor uuid, p_product uuid, p_revision integer,
  p_expected_prices jsonb, p_photo uuid, p_evidence text
) returns jsonb language plpgsql security invoker set search_path='' as $$
declare
  item public.products;
  draft private.merchandise_drafts;
  photo public.media_batch_items;
  cover uuid;
  result jsonb;
begin
  perform pg_catalog.pg_advisory_xact_lock(73219023);
  perform private.merchandise_require_actor(p_actor,true);
  select * into item from public.products where id=p_product for update;
  if not found or item.status <> 'draft' or item.native_catalogue_enabled or item.is_demo
    or item.currency <> 'hkd' or item.stock_qty <> 0 or item.sku !~ '^SUNTV-[0-9]+$'
    or not exists(select 1 from private.shopify_native_products s
       where s.product_id=item.id and item.slug='suntv-'||s.source_handle)
    or exists(select 1 from public.product_variants v where v.product_id=item.id and v.active)
  then raise exception 'SOURCE_LISTING_NOT_READY'; end if;

  select * into draft from private.merchandise_drafts where product_id=item.id for update;
  if not found or draft.state <> 'draft' or draft.revision is distinct from p_revision
    or draft.base_revision is distinct from item.catalog_revision
  then raise exception 'STALE_REVISION'; end if;
  if draft.payload->>'status' is distinct from 'published'
    or draft.payload->>'slug' is distinct from item.slug
    or draft.payload->'isDemo' is distinct from 'false'::jsonb
    or draft.payload->>'priceAmount' is distinct from item.price_amount::text
    or coalesce(length(trim(p_evidence)),0) not between 20 and 1000
  then raise exception 'SOURCE_LISTING_NOT_READY'; end if;

  if jsonb_typeof(p_expected_prices) is distinct from 'object'
    or p_expected_prices='{}'::jsonb or item.source_price_overrides is distinct from p_expected_prices
    or exists(
      select 1 from jsonb_each(p_expected_prices) price
      where not exists(
        select 1 from private.price_review_drafts r
        where r.product_id=item.id and r.variant_id=price.key and r.state='approved'
          and r.source_key=price.value->>'sourceKey'
          and to_jsonb(r.price_amount)=price.value->'priceAmount' and r.price_amount<>1999
          and price.value->'priceIsPlaceholder'='false'::jsonb
      )
    )
  then raise exception 'SOURCE_PRICE_APPROVAL_REQUIRED'; end if;

  select * into photo from public.media_batch_items where id=p_photo for share;
  if not found or photo.product_id is distinct from item.id or photo.status <> 'published'
    or photo.approved_revision is distinct from photo.revision or photo.approved_by is null
    or photo.source_sha256 is null or photo.output_sha256 is null
  then raise exception 'SOURCE_PHOTO_APPROVAL_REQUIRED'; end if;
  select i.id into cover from public.product_images i
  where i.product_id=item.id and i.is_visible
    and i.storage_path='batch/'||photo.id::text||'/r'||photo.revision::text||'-'||photo.output_sha256||'.webp'
  for share;
  if not found or draft.payload->'visibleImageIds' is distinct from jsonb_build_array(cover)
  then raise exception 'SOURCE_PHOTO_APPROVAL_REQUIRED'; end if;

  insert into private.shopify_release_authorizations(product_id,actor_id,transaction_id)
    values(item.id,p_actor,txid_current());
  result := public.merchandise_publish(p_actor,item.id,p_revision);
  delete from private.shopify_release_authorizations
    where product_id=item.id and transaction_id=txid_current();
  insert into private.shopify_native_audit(product_id,actor_id,action,detail)
    values(item.id,p_actor,'source_listing_published',jsonb_build_object(
      'evidence',trim(p_evidence),'previousRevision',item.catalog_revision,
      'photo',photo.id,'photoHash',photo.output_sha256,'prices',p_expected_prices,'nativeCheckout',false));
  return result;
end;
$$;

revoke all on function public.shopify_publish_source_listing(uuid,uuid,integer,jsonb,uuid,text)
  from public,anon,authenticated;
grant execute on function public.shopify_publish_source_listing(uuid,uuid,integer,jsonb,uuid,text)
  to service_role;

commit;
