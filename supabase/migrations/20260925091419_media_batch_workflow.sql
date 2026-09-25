-- Durable, service-only merchandise review. No staff accounts are provisioned.
begin;
alter table public.products add column title_zh text check(title_zh is null or char_length(title_zh)<=180);
alter table public.products add column description_zh text check(description_zh is null or char_length(description_zh)<=5000);
create table public.staff_members (
 user_id uuid primary key references auth.users(id) on delete cascade,
 role text not null check(role in ('super_admin','catalog_editor')),
 active boolean not null default true,
 created_at timestamptz not null default now()
);
create table public.media_batches (
 id uuid primary key default gen_random_uuid(),
 created_by uuid not null references auth.users(id),
 title text not null check(char_length(title) between 1 and 180),
 style_id text not null check(style_id in ('muji','apple','amazon','openai','daks-burberry','hermes-valentino')),
 style_snapshot jsonb not null,
 request_id uuid not null,
 request_fingerprint text not null,
 unique(created_by,request_id),
 created_at timestamptz not null default now()
);
create table public.media_batch_items (
 id uuid primary key default gen_random_uuid(),
 batch_id uuid not null references public.media_batches(id),
 filename text not null check(char_length(filename) between 1 and 255),
 mime text not null check(mime in ('image/jpeg','image/png','image/webp')),
 byte_size integer not null check(byte_size between 1 and 25165824),
 original_path text not null unique,
 processed_path text,
 product_data jsonb not null default '{}'::jsonb,
 status text not null default 'awaiting_upload' check(status in ('awaiting_upload','queued','processing','review','rejected','approved','publishing','published','failed')),
 revision integer not null default 1 check(revision>0),
 preset_sha256 text check(preset_sha256 ~ '^[a-f0-9]{64}$'),
 processor_version text,
 source_sha256 text check(source_sha256 ~ '^[a-f0-9]{64}$'),
 output_sha256 text check(output_sha256 ~ '^[a-f0-9]{64}$'),
 approved_by uuid references auth.users(id),
 approved_at timestamptz,
 approved_revision integer,
 lease_token uuid,
 lease_until timestamptz,
 attempts integer not null default 0,
 error text,
 product_id uuid references public.products(id),
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now(),
 unique(batch_id,filename)
);
create index media_items_queue_idx on public.media_batch_items(status,lease_until,created_at);
create index media_batches_owner_idx on public.media_batches(created_by,created_at desc);
create table public.media_batch_audit (
 id bigint generated always as identity primary key,
 item_id uuid references public.media_batch_items(id),
 batch_id uuid references public.media_batches(id),
 actor_id uuid references auth.users(id),
 action text not null,
 revision integer,
 detail jsonb not null default '{}'::jsonb,
 created_at timestamptz not null default now()
);
alter table public.staff_members enable row level security;
alter table public.media_batches enable row level security;
alter table public.media_batch_items enable row level security;
alter table public.media_batch_audit enable row level security;
revoke all on public.staff_members,public.media_batches,public.media_batch_items,public.media_batch_audit from public,anon,authenticated;
grant all on public.staff_members,public.media_batches,public.media_batch_items to service_role;
grant select,insert on public.media_batch_audit to service_role;
grant usage,select on sequence public.media_batch_audit_id_seq to service_role;

create function public.batch_require_staff(p_actor uuid,p_super boolean default false) returns text
language plpgsql security invoker set search_path='' as $$
declare r text;
begin
 select role into r from public.staff_members where user_id=p_actor and active for share;
 if r is null or (p_super and r<>'super_admin') then raise exception 'STAFF_FORBIDDEN'; end if;
 return r;
end;$$;
create function public.batch_require_owner(p_actor uuid,p_batch_id uuid) returns void
language plpgsql security invoker set search_path='' as $$
declare r text;
begin
 r=public.batch_require_staff(p_actor);
 if not exists(select 1 from public.media_batches where id=p_batch_id and (created_by=p_actor or r='super_admin')) then raise exception 'BATCH_FORBIDDEN'; end if;
end;$$;
create function public.batch_valid_product(p_data jsonb) returns boolean
language sql immutable security invoker set search_path='' as $$
 select coalesce(jsonb_typeof(p_data)='object'
 and jsonb_typeof(p_data->'sku')='string' and char_length(trim(p_data->>'sku')) between 1 and 80
 and jsonb_typeof(p_data->'title')='string' and char_length(trim(p_data->>'title')) between 1 and 180
 and jsonb_typeof(p_data->'description')='string' and char_length(trim(p_data->>'description')) between 1 and 10000
 and jsonb_typeof(p_data->'titleZh')='string' and char_length(trim(p_data->>'titleZh')) between 1 and 180
 and jsonb_typeof(p_data->'descriptionZh')='string' and char_length(trim(p_data->>'descriptionZh')) between 1 and 5000
 and jsonb_typeof(p_data->'category')='string' and char_length(trim(p_data->>'category')) between 1 and 80
 and p_data->>'currency'='hkd'
 and jsonb_typeof(p_data->'priceAmount')='number' and (p_data->>'priceAmount') ~ '^[1-9][0-9]{0,8}$'
 and jsonb_typeof(p_data->'stockQty')='number' and (p_data->>'stockQty') ~ '^(0|[1-9][0-9]{0,8})$',false);
$$;

create function public.batch_valid_draft(p_data jsonb) returns boolean
language sql immutable security invoker set search_path='' as $$
 select coalesce(jsonb_typeof(p_data)='object' and octet_length(p_data::text)<=20000
 and not exists(select 1 from jsonb_object_keys(p_data) k where k not in ('sku','title','description','titleZh','descriptionZh','category','priceAmount','currency','stockQty'))
 and (not p_data?'sku' or (jsonb_typeof(p_data->'sku')='string' and char_length(p_data->>'sku')<=80))
 and (not p_data?'title' or (jsonb_typeof(p_data->'title')='string' and char_length(p_data->>'title')<=180))
 and (not p_data?'description' or (jsonb_typeof(p_data->'description')='string' and char_length(p_data->>'description')<=10000))
 and (not p_data?'titleZh' or (jsonb_typeof(p_data->'titleZh')='string' and char_length(p_data->>'titleZh')<=180))
 and (not p_data?'descriptionZh' or (jsonb_typeof(p_data->'descriptionZh')='string' and char_length(p_data->>'descriptionZh')<=5000))
 and (not p_data?'category' or (jsonb_typeof(p_data->'category')='string' and char_length(p_data->>'category')<=80))
 and (not p_data?'currency' or p_data->>'currency'='hkd')
 and (not p_data?'priceAmount' or p_data->'priceAmount'='null'::jsonb or (jsonb_typeof(p_data->'priceAmount')='number' and p_data->>'priceAmount' ~ '^(0|[1-9][0-9]{0,8})$'))
 and (not p_data?'stockQty' or (jsonb_typeof(p_data->'stockQty')='number' and p_data->>'stockQty' ~ '^(0|[1-9][0-9]{0,8})$')),false);
$$;

create function public.batch_create(p_actor uuid,p_title text,p_style_id text,p_style_snapshot jsonb,p_items jsonb,p_request_id uuid default gen_random_uuid()) returns uuid
language plpgsql security invoker set search_path='' as $$
declare b uuid; i uuid; entry jsonb; d jsonb; fingerprint text; old_fingerprint text;
begin
 perform public.batch_require_staff(p_actor);
 if p_request_id is null then raise exception 'INVALID_REQUEST_ID'; end if;
 perform pg_catalog.pg_advisory_xact_lock(hashtextextended(p_actor::text||p_request_id::text,0));
 fingerprint=md5(jsonb_build_array(p_title,p_style_id,p_style_snapshot,p_items)::text);
 select id,request_fingerprint into b,old_fingerprint from public.media_batches where created_by=p_actor and request_id=p_request_id;
 if found then
  if old_fingerprint<>fingerprint then raise exception 'REQUEST_CHANGED'; end if;
  return b;
 end if;
 if jsonb_typeof(p_items) is distinct from 'array' or jsonb_array_length(p_items) not between 1 and 1000 then raise exception 'BATCH_SIZE_LIMIT'; end if;
 if jsonb_typeof(p_style_snapshot#>'{image,padding}') is distinct from 'number' or jsonb_typeof(p_style_snapshot#>'{image,size}') is distinct from 'number' or jsonb_typeof(p_style_snapshot#>'{image,quality}') is distinct from 'number' or p_style_snapshot->>'id' is distinct from p_style_id or coalesce(p_style_snapshot#>>'{image,background}' !~ '^#[a-fA-F0-9]{6}$',true)
 or (p_style_snapshot#>>'{image,size}')::integer is distinct from 1600 or p_style_snapshot#>>'{image,format}' is distinct from 'webp'
 or coalesce((p_style_snapshot#>>'{image,padding}')::numeric not between 0 and 0.3,true)
 or coalesce((p_style_snapshot#>>'{image,quality}')::integer not between 60 and 95,true) then raise exception 'INVALID_STYLE_PRESET'; end if;
 insert into public.media_batches(created_by,title,style_id,style_snapshot,request_id,request_fingerprint) values(p_actor,trim(p_title),p_style_id,p_style_snapshot,p_request_id,fingerprint) returning id into b;
 for entry in select value from jsonb_array_elements(p_items) loop
  i=gen_random_uuid();
  if entry->>'filename' ~ '[/\\]' or entry->>'filename' ~ '[[:cntrl:]]' then raise exception 'INVALID_FILENAME'; end if;
  d=coalesce(entry->'product_data','{}'::jsonb);
  if not public.batch_valid_draft(d) then raise exception 'INVALID_DRAFT'; end if;
  insert into public.media_batch_items(id,batch_id,filename,mime,byte_size,original_path,product_data)
  values(i,b,entry->>'filename',entry->>'mime',(entry->>'byte_size')::integer,b::text||'/'||i::text||'/original',
   jsonb_build_object('sku','BATCH-'||upper(replace(i::text,'-','')),'title',left(entry->>'filename',180),'description','','titleZh','','descriptionZh','','category','General','priceAmount',null,'currency','hkd','stockQty',0)||d);
 end loop;
 insert into public.media_batch_audit(batch_id,actor_id,action,detail) values(b,p_actor,'created',jsonb_build_object('items',jsonb_array_length(p_items),'style',p_style_id));
 return b;
end;$$;
create function public.batch_finalize(p_actor uuid,p_item_id uuid,p_revision integer) returns public.media_batch_items
language plpgsql security invoker set search_path='' as $$
declare i public.media_batch_items;
begin
 select * into i from public.media_batch_items where id=p_item_id for update;
 perform public.batch_require_owner(p_actor,i.batch_id);
 if i.revision is distinct from p_revision or i.status<>'awaiting_upload' then raise exception 'STALE_OR_INVALID_STATE'; end if;
 update public.media_batch_items set status='queued',updated_at=now() where id=i.id returning * into i;
 insert into public.media_batch_audit(item_id,batch_id,actor_id,action,revision) values(i.id,i.batch_id,p_actor,'queued',i.revision);
 return i;
end;$$;
create function public.batch_edit(p_actor uuid,p_item_id uuid,p_revision integer,p_product_data jsonb) returns public.media_batch_items
language plpgsql security invoker set search_path='' as $$
declare i public.media_batch_items;
begin
 select * into i from public.media_batch_items where id=p_item_id for update;
 perform public.batch_require_owner(p_actor,i.batch_id);
 if i.revision is distinct from p_revision or i.status not in ('awaiting_upload','queued','review','rejected','approved','failed') then raise exception 'STALE_OR_INVALID_STATE'; end if;
 if not public.batch_valid_draft(p_product_data) then raise exception 'INVALID_DRAFT'; end if;
 update public.media_batch_items set product_data=p_product_data,revision=revision+1,
 status=case when processed_path is not null then 'review' when status='awaiting_upload' then 'awaiting_upload' else 'queued' end,
 approved_by=null,approved_at=null,approved_revision=null,lease_token=null,lease_until=null,attempts=0,error=null,updated_at=now()
 where id=i.id returning * into i;
 insert into public.media_batch_audit(item_id,batch_id,actor_id,action,revision) values(i.id,i.batch_id,p_actor,'edited',i.revision);
 return i;
end;$$;
create function public.batch_retry(p_actor uuid,p_item_id uuid,p_revision integer) returns public.media_batch_items
language plpgsql security invoker set search_path='' as $$
declare i public.media_batch_items;
begin
 select * into i from public.media_batch_items where id=p_item_id for update;
 perform public.batch_require_owner(p_actor,i.batch_id);
 if i.revision is distinct from p_revision or i.status not in ('failed','rejected') then raise exception 'STALE_OR_INVALID_STATE'; end if;
 update public.media_batch_items set status=case when processed_path is null then 'queued' else 'review' end,revision=revision+1,
 approved_by=null,approved_at=null,approved_revision=null,lease_token=null,lease_until=null,attempts=0,error=null,updated_at=now() where id=i.id returning * into i;
 insert into public.media_batch_audit(item_id,batch_id,actor_id,action,revision) values(i.id,i.batch_id,p_actor,'retried',i.revision);
 return i;
end;$$;
create function public.batch_review(p_actor uuid,p_item_id uuid,p_revision integer,p_decision text,p_reason text default '') returns public.media_batch_items
language plpgsql security invoker set search_path='' as $$
declare i public.media_batch_items;
begin
 perform public.batch_require_staff(p_actor,true);
 select * into i from public.media_batch_items where id=p_item_id for update;
 if not found or i.revision is distinct from p_revision or i.status<>'review' then raise exception 'STALE_OR_INVALID_STATE'; end if;
 if p_decision is null or p_decision not in ('approve','reject') then raise exception 'INVALID_DECISION'; end if;
 if p_decision='approve' and (not public.batch_valid_product(i.product_data) or i.output_sha256 is null or i.source_sha256 is null or i.processed_path is null) then raise exception 'INCOMPLETE_PRODUCT'; end if;
 update public.media_batch_items set status=case when p_decision='approve' then 'approved' else 'rejected' end,
 approved_by=case when p_decision='approve' then p_actor end,approved_at=case when p_decision='approve' then now() end,
 approved_revision=case when p_decision='approve' then revision end,error=case when p_decision='reject' then left(p_reason,1000) end,attempts=0,updated_at=now()
 where id=i.id returning * into i;
 insert into public.media_batch_audit(item_id,batch_id,actor_id,action,revision,detail) values(i.id,i.batch_id,p_actor,p_decision,i.revision,jsonb_build_object('reason',left(p_reason,1000)));
 return i;
end;$$;
create function public.batch_claim(p_limit integer default 1) returns setof public.media_batch_items
language plpgsql security invoker set search_path='' as $$
declare i public.media_batch_items; claimed integer=0;
begin
 if p_limit is null or p_limit not between 1 and 4 then raise exception 'CLAIM_LIMIT'; end if;
 for i in select * from public.media_batch_items where status in ('queued','approved') or (status in ('processing','publishing') and lease_until<clock_timestamp()) order by created_at,id for update skip locked loop
  if i.attempts>=3 then
   update public.media_batch_items set status='failed',error='ATTEMPTS_EXHAUSTED',lease_token=null,lease_until=null,updated_at=now() where id=i.id;
   insert into public.media_batch_audit(item_id,batch_id,action,revision) values(i.id,i.batch_id,'attempts_exhausted',i.revision);
   continue;
  end if;
  if i.status in ('approved','publishing') and (i.approved_revision is distinct from i.revision or not exists(select 1 from public.staff_members where user_id=i.approved_by and active and role='super_admin')) then
   update public.media_batch_items set status='review',approved_by=null,approved_at=null,approved_revision=null,lease_token=null,lease_until=null,error='APPROVAL_REVOKED',updated_at=now() where id=i.id;
   insert into public.media_batch_audit(item_id,batch_id,action,revision) values(i.id,i.batch_id,'approval_revoked',i.revision);
   continue;
  end if;
  update public.media_batch_items set status=case when status in ('approved','publishing') then 'publishing' else 'processing' end,
   lease_token=gen_random_uuid(),lease_until=clock_timestamp()+interval '10 minutes',attempts=attempts+1,updated_at=now() where id=i.id returning * into i;
  insert into public.media_batch_audit(item_id,batch_id,action,revision) values(i.id,i.batch_id,i.status,i.revision);
  return next i;
  claimed=claimed+1;
  exit when claimed>=p_limit;
 end loop;
end;$$;
create function public.batch_processed(p_item_id uuid,p_revision integer,p_lease_token uuid,p_source_sha256 text,p_output_sha256 text,p_processed_path text,p_preset_sha256 text,p_processor_version text) returns public.media_batch_items
language plpgsql security invoker set search_path='' as $$
declare i public.media_batch_items;
begin
 select * into i from public.media_batch_items where id=p_item_id for update;
 if not found or i.status<>'processing' or i.revision is distinct from p_revision or i.lease_token is distinct from p_lease_token or i.lease_until<=clock_timestamp() then raise exception 'STALE_LEASE'; end if;
 if p_processor_version is distinct from 'sharp-0.35.4/v1' or coalesce(p_preset_sha256 !~ '^[a-f0-9]{64}$',true) or coalesce(p_source_sha256 !~ '^[a-f0-9]{64}$',true) or coalesce(p_output_sha256 !~ '^[a-f0-9]{64}$',true) or p_processed_path is distinct from i.batch_id::text||'/'||i.id::text||'/r'||i.revision::text||'-'||p_output_sha256||'.webp' then raise exception 'INVALID_OUTPUT'; end if;
 update public.media_batch_items set status='review',preset_sha256=p_preset_sha256,processor_version=p_processor_version,source_sha256=p_source_sha256,output_sha256=p_output_sha256,processed_path=p_processed_path,attempts=0,error=null,lease_token=null,lease_until=null,updated_at=now() where id=i.id returning * into i;
 insert into public.media_batch_audit(item_id,batch_id,action,revision,detail) values(i.id,i.batch_id,'processed',i.revision,jsonb_build_object('output_sha256',p_output_sha256));
 return i;
end;$$;
create function public.batch_fail(p_item_id uuid,p_revision integer,p_lease_token uuid,p_error text) returns public.media_batch_items
language plpgsql security invoker set search_path='' as $$
declare i public.media_batch_items;
begin
 update public.media_batch_items set status='failed',error=left(p_error,1000),lease_token=null,lease_until=null,updated_at=now()
 where id=p_item_id and revision=p_revision and lease_token=p_lease_token and lease_until>clock_timestamp() and status in ('processing','publishing') returning * into i;
 if not found then raise exception 'STALE_LEASE'; end if;
 insert into public.media_batch_audit(item_id,batch_id,action,revision,detail) values(i.id,i.batch_id,'failed',i.revision,jsonb_build_object('error',left(p_error,1000)));
 return i;
end;$$;
create function public.batch_publish(p_item_id uuid,p_revision integer,p_lease_token uuid,p_image_url text,p_public_path text,p_output_sha256 text) returns uuid
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
 values(i.id,trim(d->>'sku'),v_slug,trim(d->>'title'),d->>'description',trim(d->>'titleZh'),d->>'descriptionZh',(d->>'priceAmount')::integer,'hkd',(d->>'stockQty')::integer,trim(d->>'category'),'published',false);
 insert into public.product_images(product_id,source_url,storage_path,alt_text,position) values(i.id,p_image_url,p_public_path,d->>'title',0);
 update public.media_batch_items set status='published',product_id=i.id,lease_token=null,lease_until=null,error=null,updated_at=now() where id=i.id;
 insert into public.media_batch_audit(item_id,batch_id,actor_id,action,revision,detail) values(i.id,i.batch_id,i.approved_by,'published',i.revision,jsonb_build_object('output_sha256',i.output_sha256,'product_id',i.id));
 return i.id;
end;$$;

-- Functions run with service caller privileges. No SECURITY DEFINER escalation.
revoke execute on function public.batch_require_staff(uuid,boolean),public.batch_require_owner(uuid,uuid),public.batch_valid_product(jsonb),public.batch_valid_draft(jsonb),public.batch_create(uuid,text,text,jsonb,jsonb,uuid),public.batch_finalize(uuid,uuid,integer),public.batch_edit(uuid,uuid,integer,jsonb),public.batch_retry(uuid,uuid,integer),public.batch_review(uuid,uuid,integer,text,text),public.batch_claim(integer),public.batch_processed(uuid,integer,uuid,text,text,text,text,text),public.batch_fail(uuid,integer,uuid,text),public.batch_publish(uuid,integer,uuid,text,text,text) from public,anon,authenticated;
grant execute on function public.batch_require_staff(uuid,boolean),public.batch_require_owner(uuid,uuid),public.batch_valid_product(jsonb),public.batch_valid_draft(jsonb),public.batch_create(uuid,text,text,jsonb,jsonb,uuid),public.batch_finalize(uuid,uuid,integer),public.batch_edit(uuid,uuid,integer,jsonb),public.batch_retry(uuid,uuid,integer),public.batch_review(uuid,uuid,integer,text,text),public.batch_claim(integer),public.batch_processed(uuid,integer,uuid,text,text,text,text,text),public.batch_fail(uuid,integer,uuid,text),public.batch_publish(uuid,integer,uuid,text,text,text) to service_role;
-- Preserve existing bucket configuration. Any incompatible bucket aborts this
-- migration transaction rather than silently accepting or changing exposure.
do $$
declare expected record; actual record;
begin
 lock table storage.buckets in share row exclusive mode;
 for expected in select * from (values
  ('batch-originals',false,25165824::bigint,array['image/jpeg','image/png','image/webp']),
  ('batch-processed',false,8388608::bigint,array['image/webp']),
  ('product-images',true,8388608::bigint,array['image/jpeg','image/png','image/webp','image/gif'])
 ) as requirements(id,is_public,max_bytes,mimes) loop
  select * into actual from storage.buckets where id=expected.id for update;
  if found and (actual.public is distinct from expected.is_public or actual.file_size_limit is distinct from expected.max_bytes
   or (actual.allowed_mime_types @> expected.mimes and actual.allowed_mime_types <@ expected.mimes) is not true) then
   raise exception 'INCOMPATIBLE_STORAGE_BUCKET: %',expected.id;
  end if;
  if not found and expected.id='product-images' then raise exception 'MISSING_PRODUCT_IMAGES_BUCKET'; end if;
 end loop;
end;$$;
insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types) values
 ('batch-originals','batch-originals',false,25165824,array['image/jpeg','image/png','image/webp']),
 ('batch-processed','batch-processed',false,8388608,array['image/webp'])
on conflict(id) do nothing;
commit;
