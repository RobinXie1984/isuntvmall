-- Explicit display-only merchandise is part of the approved product revision.
-- Missing flags preserve existing real-merchandise behavior. No existing rows change.
begin;
create or replace function public.batch_valid_product(p_data jsonb) returns boolean
language sql immutable security invoker set search_path='' as $$
 select coalesce(jsonb_typeof(p_data)='object'
 and jsonb_typeof(p_data->'sku')='string' and char_length(trim(p_data->>'sku')) between 1 and 80
 and jsonb_typeof(p_data->'title')='string' and char_length(trim(p_data->>'title')) between 1 and 180
 and jsonb_typeof(p_data->'description')='string' and char_length(trim(p_data->>'description')) between 1 and 10000
 and jsonb_typeof(p_data->'titleZh')='string' and char_length(trim(p_data->>'titleZh')) between 1 and 180
 and jsonb_typeof(p_data->'descriptionZh')='string' and char_length(trim(p_data->>'descriptionZh')) between 1 and 5000
 and jsonb_typeof(p_data->'category')='string' and char_length(trim(p_data->>'category')) between 1 and 80
 and (not p_data?'isDemo' or jsonb_typeof(p_data->'isDemo')='boolean')
 and p_data->>'currency'='hkd'
 and jsonb_typeof(p_data->'priceAmount')='number' and (p_data->>'priceAmount') ~ '^[1-9][0-9]{0,8}$'
 and jsonb_typeof(p_data->'stockQty')='number' and (p_data->>'stockQty') ~ '^(0|[1-9][0-9]{0,8})$',false);
$$;

create or replace function public.batch_valid_draft(p_data jsonb) returns boolean
language sql immutable security invoker set search_path='' as $$
 select coalesce(jsonb_typeof(p_data)='object' and octet_length(p_data::text)<=20000
 and not exists(select 1 from jsonb_object_keys(p_data) k where k not in ('sku','title','description','titleZh','descriptionZh','category','priceAmount','currency','stockQty','isDemo'))
 and (not p_data?'sku' or (jsonb_typeof(p_data->'sku')='string' and char_length(p_data->>'sku')<=80))
 and (not p_data?'title' or (jsonb_typeof(p_data->'title')='string' and char_length(p_data->>'title')<=180))
 and (not p_data?'description' or (jsonb_typeof(p_data->'description')='string' and char_length(p_data->>'description')<=10000))
 and (not p_data?'titleZh' or (jsonb_typeof(p_data->'titleZh')='string' and char_length(p_data->>'titleZh')<=180))
 and (not p_data?'descriptionZh' or (jsonb_typeof(p_data->'descriptionZh')='string' and char_length(p_data->>'descriptionZh')<=5000))
 and (not p_data?'category' or (jsonb_typeof(p_data->'category')='string' and char_length(p_data->>'category')<=80))
 and (not p_data?'isDemo' or jsonb_typeof(p_data->'isDemo')='boolean')
 and (not p_data?'currency' or p_data->>'currency'='hkd')
 and (not p_data?'priceAmount' or p_data->'priceAmount'='null'::jsonb or (jsonb_typeof(p_data->'priceAmount')='number' and p_data->>'priceAmount' ~ '^(0|[1-9][0-9]{0,8})$'))
 and (not p_data?'stockQty' or (jsonb_typeof(p_data->'stockQty')='number' and p_data->>'stockQty' ~ '^(0|[1-9][0-9]{0,8})$')),false);
$$;

create or replace function public.batch_publish(p_item_id uuid,p_revision integer,p_lease_token uuid,p_image_url text,p_public_path text,p_output_sha256 text) returns uuid
language plpgsql security invoker set search_path='' as $$
declare i public.media_batch_items; d jsonb; v_slug text;
begin
 select * into i from public.media_batch_items where id=p_item_id for update;
 if i.status='published' and i.revision=p_revision and i.output_sha256=p_output_sha256 then return i.product_id; end if;
 if not found or i.status<>'publishing' or i.revision is distinct from p_revision or i.lease_token is distinct from p_lease_token or i.lease_until<=clock_timestamp() then raise exception 'STALE_LEASE'; end if;
 perform public.batch_require_staff(i.approved_by,true);
 if i.approved_revision is distinct from i.revision or i.output_sha256 is distinct from p_output_sha256 or not public.batch_valid_product(i.product_data) then raise exception 'INVALID_APPROVAL'; end if;
 if p_public_path is distinct from 'batch/'||i.id::text||'/r'||i.revision::text||'-'||i.output_sha256||'.webp'
 or p_image_url !~ '^https://' or position('/storage/v1/object/public/product-images/'||p_public_path in p_image_url)=0 then raise exception 'INVALID_PUBLIC_IMAGE'; end if;
 d=i.product_data;
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

-- CREATE OR REPLACE preserves the existing service-only function grants.
commit;
