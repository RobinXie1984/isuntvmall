-- Prepared source references and suggestions; never approves a price, image or sale.
begin;
create table private.shopify_variant_preparations (
 variant_id uuid primary key references public.product_variants(id),
 product_id uuid not null references public.products(id),
 reference jsonb not null,
 fingerprint text not null,
 last_applied_revision integer not null,
 conflict boolean not null default false,
 prepared_by uuid not null references auth.users(id),
 prepared_at timestamptz not null default now()
);
alter table private.shopify_variant_preparations enable row level security;
revoke all on private.shopify_variant_preparations from public,anon,authenticated;
grant select,insert,update on private.shopify_variant_preparations to service_role;
create function public.shopify_prepare_review(p_actor uuid,p_product uuid,p_variants jsonb) returns jsonb language plpgsql security invoker set search_path='' as $$
declare entry jsonb;v public.product_variants;old private.shopify_variant_preparations;labels jsonb;amount integer;changed boolean;conflict boolean;applied integer:=0;held integer:=0;replayed integer:=0;handle text;fp text;
begin
 perform private.merchandise_require_actor(p_actor);
 perform pg_catalog.pg_advisory_xact_lock(73219023);
 select source_handle into handle from private.shopify_native_products where product_id=p_product;
 if handle is null or jsonb_typeof(p_variants) is distinct from 'array' or jsonb_array_length(p_variants) not between 1 and 1000 or octet_length(p_variants::text)>2000000 then raise exception 'INVALID_INPUT';end if;
 if exists(select 1 from jsonb_array_elements(p_variants) x group by x->>'id' having count(*)>1) then raise exception 'DUPLICATE_VARIANT';end if;
 for entry in select value from jsonb_array_elements(p_variants) loop
  if jsonb_typeof(entry->'reference') is distinct from 'object' or octet_length((entry->'reference')::text)>12000 or coalesce(entry->'reference'->>'priceStatus','') not in ('source-listed','needs-review','source-unavailable','identity-conflict') or coalesce(entry->'reference'->>'sourceUrl','') !~ ('^https://www[.]suntvmall[.]com/products/'||handle||'([?]variant=[0-9]+)?$') then raise exception 'INVALID_REFERENCE';end if;
  labels=nullif(entry->'labels','null'::jsonb);amount=(entry->>'proposedPrice')::integer;
  if labels is not null and (jsonb_typeof(labels) is distinct from 'object' or exists(select 1 from unnest(array['en','zh-Hant','zh-Hans','ja']) lang where jsonb_typeof(labels->lang) is distinct from 'string' or coalesce(length(trim(labels->>lang)),0) not between 1 and 240)) then raise exception 'INVALID_LABELS';end if;
  if amount is not null and (amount not between 1 and 100000000 or amount=1999 or entry->'reference'->>'priceStatus'<>'source-listed' or coalesce(entry->'reference'->>'evidenceSha256','') !~ '^[a-f0-9]{64}$' or coalesce(entry->'reference'->>'rawPrice','') !~ '^[0-9]{1,7}([.][0-9]{1,2})?$' or round((entry->'reference'->>'rawPrice')::numeric*100)<>amount) then raise exception 'PRICE_REVIEW_REQUIRED';end if;
  select * into v from public.product_variants where id=(entry->>'id')::uuid and product_id=p_product for update;
  if not found or v.sku is distinct from entry->>'sku' or v.option_values is distinct from entry->'options' then raise exception 'SOURCE_IDENTITY_CONFLICT';end if;
  select * into old from private.shopify_variant_preparations where variant_id=v.id;
  fp=md5(entry::text);
  if old.fingerprint=fp then
   if old.conflict or old.last_applied_revision<>v.revision then
    update private.shopify_variant_preparations set conflict=true where variant_id=v.id;held=held+1;
   else replayed=replayed+1;end if;continue;
  end if;
  conflict=v.revision is distinct from (entry->>'revision')::integer or v.active or not v.price_is_placeholder or v.stock_qty is not null or (old.variant_id is null and (v.proposed_price_amount is not null or v.option_labels<>'{}'::jsonb)) or (old.variant_id is not null and old.last_applied_revision<>v.revision);
  changed=not conflict and ((labels is not null and labels is distinct from v.option_labels) or amount is distinct from v.proposed_price_amount);
  if changed then
   update public.product_variants set option_labels=coalesce(labels,option_labels),proposed_price_amount=amount,revision=revision+1 where id=v.id returning * into v;
   insert into private.shopify_native_audit(product_id,actor_id,action,detail) values(p_product,p_actor,'review_suggestions_prepared',jsonb_build_object('variant',v.id,'revision',v.revision,'source',entry->'reference'));
   applied=applied+1;
  end if;
  if conflict then held=held+1;end if;
  insert into private.shopify_variant_preparations(variant_id,product_id,reference,fingerprint,last_applied_revision,conflict,prepared_by) values(v.id,p_product,entry->'reference',fp,case when conflict then coalesce(old.last_applied_revision,0) else v.revision end,conflict,p_actor)
  on conflict(variant_id) do update set reference=excluded.reference,fingerprint=excluded.fingerprint,last_applied_revision=excluded.last_applied_revision,conflict=excluded.conflict,prepared_by=excluded.prepared_by,prepared_at=now();
 end loop;
 return jsonb_build_object('applied',applied,'held',held,'replayed',replayed);
end;$$;
revoke all on function public.shopify_prepare_review(uuid,uuid,jsonb) from public,anon,authenticated;
grant execute on function public.shopify_prepare_review(uuid,uuid,jsonb) to service_role;
create or replace function public.shopify_variant_list(p_actor uuid,p_product uuid) returns jsonb language plpgsql security invoker set search_path='' as $$
declare result jsonb;
begin
 perform private.merchandise_require_actor(p_actor);
 if not exists(select 1 from private.shopify_native_products where product_id=p_product) then raise exception 'PRODUCT_NOT_FOUND';end if;
 select coalesce(jsonb_agg(jsonb_build_object('id',v.id,'sku',v.sku,'options',v.option_values,'labels',v.option_labels,'stockQty',v.stock_qty,'proposedPriceAmount',v.proposed_price_amount,'priceAmount',v.price_amount,'priceIsPlaceholder',v.price_is_placeholder,'active',v.active,'revision',v.revision,'preparation',case when s.variant_id is not null then jsonb_build_object('reference',s.reference,'conflict',s.conflict,'preparedAt',s.prepared_at) else null end) order by v.source_index),'[]') into result from public.product_variants v left join private.shopify_variant_preparations s on s.variant_id=v.id where v.product_id=p_product;
 return result;
end;$$;
commit;
