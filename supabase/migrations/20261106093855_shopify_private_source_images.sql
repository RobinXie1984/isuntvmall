-- Remote supplier originals use the existing private queue/leases/review gate.
-- No image, price, stock, product status or approval is made public here.
begin;
alter table public.media_batch_items add column source_url text
 check(source_url is null or (char_length(source_url)<=2048 and source_url ~ '^https://cdn[.]shopify[.]com/s/files/[A-Za-z0-9/_%+.,~()-]+([?][A-Za-z0-9_~%+.,=&:-]*)?$'));
create unique index media_items_product_source_url on public.media_batch_items ((product_data->>'targetProductId'),source_url) where source_url is not null;

create function public.shopify_queue_source_images(p_actor uuid,p_batch uuid,p_handle text,p_style_snapshot jsonb) returns jsonb
language plpgsql security invoker set search_path='' as $$
declare actor_role text; entry jsonb; product public.products; urls text[]; missing text[]='{}'; source text; held integer=0; existing integer=0; failed integer=0; chunk integer; chunk_urls text[]; batch_items jsonb; v_batch_id uuid; batches uuid[]='{}'; prior public.media_batch_items; policy private.batch_admission_policy; data jsonb; request uuid; offset_n integer=1;
begin
 perform private.merchandise_require_actor(p_actor);
 select role into actor_role from public.staff_members where user_id=p_actor and active;
 if p_batch is null or p_handle is null or char_length(p_handle) not between 1 and 255 then raise exception 'INVALID_INPUT';end if;
 -- Staff can confirm their own import; business approvers may assist any colleague.
 if not exists(select 1 from private.shopify_import_batches b where b.id=p_batch and (b.created_by=p_actor or actor_role in ('super_admin','business_super_admin','admin'))) then raise exception 'STAGED_PRODUCT_UNAVAILABLE';end if;
 select p.* into product from private.shopify_native_products n join public.products p on p.id=n.product_id where n.source_handle=p_handle and n.source_batch_id=p_batch;
 if not found then raise exception 'STAGED_PRODUCT_UNAVAILABLE';end if;
 perform pg_catalog.pg_advisory_xact_lock(hashtextextended('shopify-media:'||product.id::text,0));
 select payload into entry from private.shopify_import_products where batch_id=p_batch and handle=p_handle;
 if entry is null then raise exception 'STAGED_PRODUCT_UNAVAILABLE';end if;
 select coalesce(array_agg(url order by url),'{}') into urls from (select distinct value->>'url' url from jsonb_array_elements(entry->'images') union select distinct value->>'imageUrl' url from jsonb_array_elements(entry->'variants')) all_urls where coalesce(url,'')<>'';
 if cardinality(urls)>1250 then raise exception 'BATCH_SIZE_LIMIT';end if;
 foreach source in array urls loop
  if char_length(source)>2048 or source !~ '^https://cdn[.]shopify[.]com/s/files/[A-Za-z0-9/_%+.,~()-]+([?][A-Za-z0-9_~%+.,=&:-]*)?$' then held=held+1;continue;end if;
  select * into prior from public.media_batch_items where product_data->>'targetProductId'=product.id::text and source_url=source;
  if found then
   existing=existing+1; if prior.status in ('failed','rejected') then failed=failed+1;end if;
   if not prior.batch_id=any(batches) then batches=array_append(batches,prior.batch_id);end if;
  else missing=array_append(missing,source);end if;
 end loop;
 if cardinality(missing)>0 then
  select * into policy from private.batch_admission_policy where singleton;
  chunk=least(policy.max_batch_items, floor(policy.max_batch_bytes/25165824.0)::integer);
  if chunk is null or chunk<1 then raise exception 'BATCH_ADMISSION_BATCH_LIMIT';end if;
  -- Stable server-owned metadata: no source stock/price is trusted or applied.
  data=jsonb_build_object('targetProductId',product.id,'sku',product.sku,'title',product.title,'titleZh',coalesce(product.title_zh,''),'description',product.description,'descriptionZh',coalesce(product.description_zh,''),'category',product.category,'priceAmount',product.price_amount,'currency',product.currency,'stockQty',product.stock_qty,'isDemo',product.is_demo);
  while offset_n<=cardinality(missing) loop
   chunk_urls=missing[offset_n:offset_n+chunk-1];
   select jsonb_agg(jsonb_build_object('filename',md5(u)||'.source','mime','image/jpeg','byte_size',25165824,'product_data',data) order by u) into batch_items from unnest(chunk_urls) u;
   -- Same actor and exact set reuse the existing admission receipt. All chunks
   -- commit atomically, so a capacity failure never leaves an invisible half-run.
   request=md5('shopify-images:'||p_batch::text||':'||product.id::text||':'||array_to_string(chunk_urls,chr(10)))::uuid;
   v_batch_id=public.batch_create(p_actor,left('Shopify MUJI review · '||p_handle,180),'muji',p_style_snapshot,batch_items,request);
   update public.media_batch_items i set source_url=u.url,status='queued',updated_at=now() from unnest(chunk_urls) u(url) where i.batch_id=v_batch_id and i.filename=md5(u.url)||'.source' and i.status='awaiting_upload';
   insert into public.media_batch_audit(batch_id,actor_id,action,detail) values(v_batch_id,p_actor,'source_images_queued',jsonb_build_object('count',cardinality(chunk_urls),'source_batch',p_batch,'product_id',product.id));
   batches=array_append(batches,v_batch_id);offset_n=offset_n+chunk;
  end loop;
 end if;
 return jsonb_build_object('productId',product.id,'batches',to_jsonb(batches),'queued',cardinality(missing),'existing',existing,'held',held,'failed',failed);
end;$$;

-- Freeze the sniffed original under the processing lease before private upload.
-- Retain the full original reservation even after discovering a smaller image.
create function public.batch_bind_source_original(p_item_id uuid,p_revision integer,p_lease_token uuid,p_mime text,p_byte_size integer,p_sha256 text) returns boolean
language plpgsql security invoker set search_path='' as $$
declare i public.media_batch_items;
begin
 select * into i from public.media_batch_items where id=p_item_id for update;
 if not found or i.status<>'processing' or i.source_url is null or i.revision is distinct from p_revision or i.lease_token is distinct from p_lease_token or i.lease_until<=clock_timestamp() then raise exception 'STALE_LEASE';end if;
 if p_mime is null or p_mime not in ('image/jpeg','image/png','image/webp') or p_byte_size is null or p_byte_size not between 1 and 25165824 or coalesce(p_sha256 !~ '^[a-f0-9]{64}$',true) then raise exception 'INVALID_SOURCE_ORIGINAL';end if;
 if not exists(select 1 from private.batch_storage_reservations r where r.bucket='batch-originals' and r.object_path=i.original_path and r.item_id=i.id and r.reserved_bytes>=p_byte_size) then raise exception 'MISSING_OBJECT_RESERVATION';end if;
 if i.source_sha256 is not null then
  if i.source_sha256<>p_sha256 or i.mime<>p_mime or i.byte_size<>p_byte_size then raise exception 'ORIGINAL_CHANGED';end if;
  return false;
 end if;
 update public.media_batch_items set mime=p_mime,byte_size=p_byte_size,source_sha256=p_sha256,updated_at=now() where id=i.id;
 insert into public.media_batch_audit(item_id,batch_id,action,revision,detail) values(i.id,i.batch_id,'source_original_bound',i.revision,jsonb_build_object('sha256',p_sha256,'bytes',p_byte_size,'mime',p_mime));
 return true;
end;$$;
revoke all on function public.shopify_queue_source_images(uuid,uuid,text,jsonb),public.batch_bind_source_original(uuid,integer,uuid,text,integer,text) from public,anon,authenticated;
grant execute on function public.shopify_queue_source_images(uuid,uuid,text,jsonb),public.batch_bind_source_original(uuid,integer,uuid,text,integer,text) to service_role;
commit;
