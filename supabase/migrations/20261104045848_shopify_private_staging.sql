-- Private import staging only. It cannot publish, change inventory, or write products.
begin;
create table private.shopify_import_batches (
 id uuid primary key default gen_random_uuid(),
 created_by uuid not null references auth.users(id),
 request_id uuid not null,
 fingerprint text not null,
 title text not null check (char_length(title) between 1 and 120),
 created_at timestamptz not null default now(),
 unique(created_by,request_id)
);
create table private.shopify_import_products (
 batch_id uuid not null references private.shopify_import_batches(id),
 handle text not null check (char_length(handle) between 1 and 255),
 payload jsonb not null check (jsonb_typeof(payload)='object' and octet_length(payload::text)<=200000),
 created_at timestamptz not null default now(),
 primary key(batch_id,handle)
);
create table private.shopify_import_audit (
 id bigint generated always as identity primary key,
 batch_id uuid not null references private.shopify_import_batches(id),
 actor_id uuid not null references auth.users(id),
 action text not null,
 detail jsonb not null default '{}'::jsonb,
 created_at timestamptz not null default now()
);
alter table private.shopify_import_batches enable row level security;
alter table private.shopify_import_products enable row level security;
alter table private.shopify_import_audit enable row level security;
revoke all on private.shopify_import_batches,private.shopify_import_products,private.shopify_import_audit from public,anon,authenticated;
grant select,insert on private.shopify_import_batches,private.shopify_import_products,private.shopify_import_audit to service_role;
grant usage,select on sequence private.shopify_import_audit_id_seq to service_role;

create function public.shopify_stage(p_actor uuid,p_request uuid,p_title text,p_products jsonb) returns jsonb
language plpgsql security invoker set search_path='' as $$
declare existing private.shopify_import_batches; new_id uuid; fingerprint text; entry jsonb; variants jsonb; images jsonb;
begin
 perform private.merchandise_require_actor(p_actor);
 if p_request is null or p_title is null or char_length(trim(p_title)) not between 1 and 120 or jsonb_typeof(p_products) is distinct from 'array' or jsonb_array_length(p_products) not between 1 and 500 or octet_length(p_products::text)>4000000 then raise exception 'INVALID_INPUT'; end if;
 for entry in select value from jsonb_array_elements(p_products) loop
  if jsonb_typeof(entry) is distinct from 'object' or exists(select 1 from jsonb_object_keys(entry) k where k not in ('handle','title','variants','images','source')) or char_length(coalesce(entry->>'handle','')) not between 1 and 255 or char_length(coalesce(entry->>'title','')) not between 1 and 180 or jsonb_typeof(entry->'source') is distinct from 'object' or exists(select 1 from jsonb_object_keys(entry->'source') k where k not in ('Body (HTML)','Vendor','Product Category','Type','Tags','Published','Gift Card','SEO Title','SEO Description','Status')) or jsonb_typeof(entry->'variants') is distinct from 'array' or jsonb_typeof(entry->'images') is distinct from 'array' or jsonb_array_length(entry->'variants')>1000 or jsonb_array_length(entry->'images')>250 or octet_length(entry::text)>200000 then raise exception 'INVALID_PRODUCT'; end if;
  variants=entry->'variants'; images=entry->'images';
  if exists(select 1 from jsonb_array_elements(variants) v where jsonb_typeof(v)<>'object' or exists(select 1 from jsonb_object_keys(v) k where k not in ('sku','price','options','inventoryQuantity','inventoryProvided','inventoryTracker','barcode','imageUrl','source','inventorySnapshot')) or jsonb_typeof(v->'inventorySnapshot') is distinct from 'array' or jsonb_array_length(v->'inventorySnapshot')>250 or exists(select 1 from jsonb_array_elements(v->'inventorySnapshot') i where jsonb_typeof(i)<>'object' or exists(select 1 from jsonb_object_keys(i) k where k not in ('location','bin','available','onHand'))) or jsonb_typeof(v->'source') is distinct from 'object' or exists(select 1 from jsonb_object_keys(v->'source') k where k not in ('Variant Grams','Variant Inventory Policy','Variant Fulfillment Service','Variant Compare At Price','Variant Requires Shipping','Variant Taxable','Unit Price Total Measure','Unit Price Total Measure Unit','Unit Price Base Measure','Unit Price Base Measure Unit','Variant Weight Unit','Variant Tax Code','Variant Packed Length','Variant Packed Width','Variant Packed Height','Variant Packed Dimension Unit','Option1 Linked To','Option2 Linked To','Option3 Linked To')) or jsonb_typeof(v->'options') is distinct from 'array' or exists(select 1 from jsonb_array_elements(v->'options') o where jsonb_typeof(o)<>'object' or exists(select 1 from jsonb_object_keys(o) k where k not in ('name','value')))) or exists(select 1 from jsonb_array_elements(images) i where jsonb_typeof(i)<>'object' or exists(select 1 from jsonb_object_keys(i) k where k not in ('url','position','alt'))) then raise exception 'INVALID_PRODUCT'; end if;
 end loop;
 if (select count(distinct value->>'handle') from jsonb_array_elements(p_products)) <> jsonb_array_length(p_products) then raise exception 'DUPLICATE_HANDLE';end if;
 fingerprint=md5(jsonb_build_array(trim(p_title),p_products)::text);
 perform pg_catalog.pg_advisory_xact_lock(hashtextextended(p_actor::text||p_request::text,0));
 select * into existing from private.shopify_import_batches where created_by=p_actor and request_id=p_request;
 if found then
  if existing.fingerprint<>fingerprint then raise exception 'REQUEST_CONFLICT';end if;
  return jsonb_build_object('id',existing.id,'replayed',true);
 end if;
 insert into private.shopify_import_batches(created_by,request_id,fingerprint,title) values(p_actor,p_request,fingerprint,trim(p_title)) returning id into new_id;
 insert into private.shopify_import_products(batch_id,handle,payload) select new_id,value->>'handle',value from jsonb_array_elements(p_products);
 insert into private.shopify_import_audit(batch_id,actor_id,action,detail) values(new_id,p_actor,'staged',jsonb_build_object('products',jsonb_array_length(p_products)));
 return jsonb_build_object('id',new_id,'replayed',false);
end;$$;
create function public.shopify_staged_batches(p_actor uuid) returns jsonb language plpgsql security invoker set search_path='' as $$
declare result jsonb;
begin
 perform private.merchandise_require_actor(p_actor);
 select coalesce(jsonb_agg(jsonb_build_object('id',b.id,'title',b.title,'createdAt',b.created_at,'productCount',(select count(*) from private.shopify_import_products p where p.batch_id=b.id)) order by b.created_at desc),'[]') into result from (select * from private.shopify_import_batches order by created_at desc limit 100) b;
 return result;
end;$$;
create function public.shopify_staged_products(p_actor uuid,p_batch uuid,p_page integer default 0) returns jsonb language plpgsql security invoker set search_path='' as $$
declare result jsonb;
begin
 perform private.merchandise_require_actor(p_actor);
 if p_page is null or p_page not between 0 and 10000 or not exists(select 1 from private.shopify_import_batches where id=p_batch) then raise exception 'INVALID_INPUT';end if;
 select coalesce(jsonb_agg(x.payload order by x.handle),'[]') into result from (select handle,payload from private.shopify_import_products where batch_id=p_batch order by handle limit 25 offset p_page*25) x;
 return result;
end;$$;
revoke all on function public.shopify_stage(uuid,uuid,text,jsonb),public.shopify_staged_batches(uuid),public.shopify_staged_products(uuid,uuid,integer) from public,anon,authenticated;
grant execute on function public.shopify_stage(uuid,uuid,text,jsonb),public.shopify_staged_batches(uuid),public.shopify_staged_products(uuid,uuid,integer) to service_role;
commit;
