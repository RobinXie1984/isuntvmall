-- Acquire the shared inventory lock before product or media row locks.
begin;
create or replace function public.merchandise_publish(p_actor uuid,p_product uuid,p_revision integer) returns jsonb language plpgsql security invoker set search_path='' as $$
declare p public.products;d private.merchandise_drafts;
begin
 perform pg_catalog.pg_advisory_xact_lock(73219023);
 perform private.merchandise_require_actor(p_actor,true);
 select * into p from public.products where id=p_product for update;
 select * into d from private.merchandise_drafts where product_id=p_product for update;
 if d.product_id is null or d.revision is distinct from p_revision or d.base_revision is distinct from p.catalog_revision or d.state<>'draft' then raise exception 'STALE_REVISION';end if;
 if d.payload->>'status'='published' and jsonb_array_length(d.payload->'visibleImageIds')=0 then raise exception 'PUBLIC_IMAGE_REQUIRED';end if;
 update public.products set title=d.payload->>'title',title_zh=d.payload->>'titleZh',description=d.payload->>'description',description_zh=d.payload->>'descriptionZh',category=d.payload->>'category',price_amount=(d.payload->>'priceAmount')::integer,status=d.payload->>'status',is_demo=(d.payload->>'isDemo')::boolean,catalog_revision=catalog_revision+1,updated_at=now() where id=p_product;
 update public.product_images set is_visible=(d.payload->'visibleImageIds') ? id::text where product_id=p_product;
 update private.merchandise_drafts set state='published',base_revision=p.catalog_revision+1,updated_by=p_actor,updated_at=now() where product_id=p_product;
 insert into private.merchandise_audit(product_id,actor_id,action,revision,before_state,after_state) values(p_product,p_actor,'published',p_revision,to_jsonb(p),d.payload);
 return jsonb_build_object('ok',true);
end;$$;
create or replace function public.batch_publish(p_item_id uuid,p_revision integer,p_lease_token uuid,p_image_url text,p_public_path text,p_output_sha256 text) returns uuid
language plpgsql security invoker set search_path='' as $$
declare i public.media_batch_items; d jsonb; v_slug text;
begin
 perform pg_catalog.pg_advisory_xact_lock(73219023);
 select * into i from public.media_batch_items where id=p_item_id for update;
 if i.status='published' and i.revision=p_revision and i.output_sha256=p_output_sha256 then return i.product_id; end if;
 if not found or i.status<>'publishing' or i.revision is distinct from p_revision or i.lease_token is distinct from p_lease_token or i.lease_until<=clock_timestamp() then raise exception 'STALE_LEASE'; end if;
 perform public.batch_require_staff(i.approved_by,true);
 if i.approved_revision is distinct from i.revision or i.output_sha256 is distinct from p_output_sha256 or not public.batch_valid_product(i.product_data) then raise exception 'INVALID_APPROVAL'; end if;
 if p_public_path is distinct from 'batch/'||i.id::text||'/r'||i.revision::text||'-'||i.output_sha256||'.webp'
 or p_image_url !~ '^https://' or position('/storage/v1/object/public/product-images/'||p_public_path in p_image_url)=0 then raise exception 'INVALID_PUBLIC_IMAGE'; end if;
 d=i.product_data;
 if d?'targetProductId' then
  perform 1 from public.products where id=(d->>'targetProductId')::uuid for update;
  if not found then raise exception 'PRODUCT_NOT_FOUND';end if;
  insert into public.product_images(product_id,source_url,storage_path,alt_text,position) select (d->>'targetProductId')::uuid,p_image_url,p_public_path,d->>'title',coalesce(max(position),-1)+1 from public.product_images where product_id=(d->>'targetProductId')::uuid;
  update public.products set catalog_revision=catalog_revision+1,updated_at=now() where id=(d->>'targetProductId')::uuid;
  update public.media_batch_items set status='published',product_id=(d->>'targetProductId')::uuid,lease_token=null,lease_until=null,error=null,updated_at=now() where id=i.id;
  insert into public.media_batch_audit(item_id,batch_id,actor_id,action,revision,detail) values(i.id,i.batch_id,i.approved_by,'image_added',i.revision,jsonb_build_object('product_id',d->>'targetProductId','output_sha256',i.output_sha256));
  return (d->>'targetProductId')::uuid;
 end if;
 v_slug=trim(both '-' from regexp_replace(lower(d->>'sku'),'[^a-z0-9]+','-','g'));
 if v_slug='' then v_slug='product'; end if;
 v_slug=v_slug||'-'||replace(i.id::text,'-','');
 -- Intentionally no ON CONFLICT update: a duplicate SKU must be resolved by review.
 insert into public.products(id,sku,slug,title,description,title_zh,description_zh,price_amount,currency,stock_qty,category,status,is_demo)
 values(i.id,trim(d->>'sku'),v_slug,trim(d->>'title'),d->>'description',trim(d->>'titleZh'),d->>'descriptionZh',(d->>'priceAmount')::integer,'hkd',(d->>'stockQty')::integer,trim(d->>'category'),'published',coalesce((d->>'isDemo')::boolean,false));
 insert into public.product_images(product_id,source_url,storage_path,alt_text,position) values(i.id,p_image_url,p_public_path,d->>'title',0);
 update public.media_batch_items set status='published',product_id=i.id,lease_token=null,lease_until=null,error=null,updated_at=now() where id=i.id;
 insert into public.media_batch_audit(item_id,batch_id,actor_id,action,revision,detail) values(i.id,i.batch_id,i.approved_by,'published',i.revision,jsonb_build_object('output_sha256',i.output_sha256,'product_id',i.id,'is_demo',coalesce((d->>'isDemo')::boolean,false)));
 return i.id;
end;$$;
commit;
