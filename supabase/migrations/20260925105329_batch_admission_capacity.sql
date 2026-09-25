-- Single-store pilot capacity policy. No storage object or credential is deleted.
begin;
create schema if not exists private;
revoke all on schema private from public,anon,authenticated;
grant usage on schema private to service_role;
create table private.batch_admission_policy (
 singleton boolean primary key default true check(singleton),
 enabled boolean not null default true,
 max_batch_items integer not null default 1000 check(max_batch_items between 1 and 1000),
 max_batch_bytes bigint not null default 536870912 check(max_batch_bytes between 1 and 1073741824),
 max_actor_outstanding integer not null default 1000 check(max_actor_outstanding between 1 and 10000),
 max_store_outstanding integer not null default 3000 check(max_store_outstanding between 1 and 50000),
 max_actor_retained_bytes bigint not null default 34359738368 check(max_actor_retained_bytes between 25165824 and 1099511627776),
 max_store_retained_bytes bigint not null default 53687091200 check(max_store_retained_bytes between 25165824 and 1099511627776),
 updated_by uuid references auth.users(id),
 updated_at timestamptz not null default now(),
 check(max_actor_outstanding<=max_store_outstanding),
 check(max_actor_retained_bytes<=max_store_retained_bytes)
);
insert into private.batch_admission_policy(singleton) values(true);
create table private.batch_storage_reservations (
 bucket text not null,
 object_path text not null,
 item_id uuid not null references public.media_batch_items(id),
 created_by uuid not null references auth.users(id),
 reserved_bytes bigint not null check(reserved_bytes>0),
 kind text not null check(kind in ('original','derived','legacy_derivatives')),
 sha256 text check(sha256 ~ '^[a-f0-9]{64}$'),
 created_at timestamptz not null default now(),
 primary key(bucket,object_path)
);
create index batch_storage_actor_idx on private.batch_storage_reservations(created_by);
alter table private.batch_admission_policy enable row level security;
alter table private.batch_storage_reservations enable row level security;
revoke all on private.batch_admission_policy,private.batch_storage_reservations from public,anon,authenticated;
grant select,insert,update on private.batch_admission_policy to service_role;
grant select,insert on private.batch_storage_reservations to service_role;
-- Retained originals count in every status, including published. Historical
-- versions are conservatively reserved: two8MiB derivatives per known revision.
insert into private.batch_storage_reservations(bucket,object_path,item_id,created_by,reserved_bytes,kind)
select 'batch-originals',i.original_path,i.id,b.created_by,25165824,'original' from public.media_batch_items i join public.media_batches b on b.id=i.batch_id;
insert into private.batch_storage_reservations(bucket,object_path,item_id,created_by,reserved_bytes,kind)
select 'legacy-derivatives',i.id::text,i.id,b.created_by,i.revision::bigint*16777216,'legacy_derivatives' from public.media_batch_items i join public.media_batches b on b.id=i.batch_id;

create or replace function public.batch_create(p_actor uuid,p_title text,p_style_id text,p_style_snapshot jsonb,p_items jsonb,p_request_id uuid default gen_random_uuid()) returns uuid
language plpgsql security invoker set search_path='' as $$
declare b uuid; i uuid; entry jsonb; d jsonb; fingerprint text; old_fingerprint text; policy private.batch_admission_policy; amount bigint; item_count integer; actor_outstanding bigint; store_outstanding bigint; actor_retained bigint; store_retained bigint;
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
 -- One global policy row serializes every admission and derived-object reservation.
 select * into policy from private.batch_admission_policy where singleton for update;
 if not found or not policy.enabled then raise exception 'BATCH_ADMISSION_PAUSED'; end if;
 item_count=jsonb_array_length(p_items);
 select sum((value->>'byte_size')::bigint) into amount from jsonb_array_elements(p_items);
 if amount is null or amount<1 or item_count>policy.max_batch_items or amount>policy.max_batch_bytes then raise exception 'BATCH_ADMISSION_BATCH_LIMIT'; end if;
 select count(*) into store_outstanding from public.media_batch_items where status<>'published';
 select count(*) into actor_outstanding from public.media_batch_items i join public.media_batches b on b.id=i.batch_id where b.created_by=p_actor and i.status<>'published';
 select coalesce(sum(reserved_bytes),0) into store_retained from private.batch_storage_reservations;
 select coalesce(sum(reserved_bytes),0) into actor_retained from private.batch_storage_reservations where created_by=p_actor;
 if actor_outstanding+item_count>policy.max_actor_outstanding or store_outstanding+item_count>policy.max_store_outstanding then raise exception 'BATCH_ADMISSION_BACKPRESSURE'; end if;
 -- Signed upload capability can write up to the bucket limit, even if metadata
 -- claims a smaller file. Reserve its whole possible size before issuing it.
 if actor_retained+item_count::bigint*25165824>policy.max_actor_retained_bytes or store_retained+item_count::bigint*25165824>policy.max_store_retained_bytes then raise exception 'BATCH_ADMISSION_STORAGE_LIMIT'; end if;
 insert into public.media_batches(created_by,title,style_id,style_snapshot,request_id,request_fingerprint) values(p_actor,trim(p_title),p_style_id,p_style_snapshot,p_request_id,fingerprint) returning id into b;
 for entry in select value from jsonb_array_elements(p_items) loop
  i=gen_random_uuid();
  if entry->>'filename' ~ '[/\\]' or entry->>'filename' ~ '[[:cntrl:]]' then raise exception 'INVALID_FILENAME'; end if;
  d=coalesce(entry->'product_data','{}'::jsonb);
  if not public.batch_valid_draft(d) then raise exception 'INVALID_DRAFT'; end if;
  insert into public.media_batch_items(id,batch_id,filename,mime,byte_size,original_path,product_data)
  values(i,b,entry->>'filename',entry->>'mime',(entry->>'byte_size')::integer,b::text||'/'||i::text||'/original',
   jsonb_build_object('sku','BATCH-'||upper(replace(i::text,'-','')),'title',left(entry->>'filename',180),'description','','titleZh','','descriptionZh','','category','General','priceAmount',null,'currency','hkd','stockQty',0)||d);
  insert into private.batch_storage_reservations(bucket,object_path,item_id,created_by,reserved_bytes,kind) values('batch-originals',b::text||'/'||i::text||'/original',i,p_actor,25165824,'original');
 end loop;
 insert into public.media_batch_audit(batch_id,actor_id,action,detail) values(b,p_actor,'created',jsonb_build_object('items',jsonb_array_length(p_items),'style',p_style_id));
 return b;
end;$$;

-- Reserve actual normalized/copy bytes BEFORE any immutable Storage upload.
-- Existing identical paths are idempotent; no state change releases reservations.
create function public.batch_reserve_object(p_item_id uuid,p_revision integer,p_lease_token uuid,p_bucket text,p_object_path text,p_byte_size integer,p_sha256 text) returns boolean
language plpgsql security invoker set search_path='' as $$
declare i public.media_batch_items; policy private.batch_admission_policy; prior private.batch_storage_reservations; owner_id uuid; actor_retained bigint; store_retained bigint;
begin
 select * into policy from private.batch_admission_policy where singleton for update;
 select * into i from public.media_batch_items where id=p_item_id for update;
 if not found or i.revision is distinct from p_revision or i.lease_token is distinct from p_lease_token or i.lease_until<=clock_timestamp() or i.status not in ('processing','publishing') then raise exception 'STALE_LEASE'; end if;
 if p_byte_size is null or p_byte_size not between 1 and 8388608 or coalesce(p_sha256 !~ '^[a-f0-9]{64}$',true) then raise exception 'INVALID_OBJECT_RESERVATION'; end if;
 if not ((i.status='processing' and p_bucket='batch-processed' and p_object_path=i.batch_id::text||'/'||i.id::text||'/r'||i.revision::text||'-'||p_sha256||'.webp')
  or (i.status='publishing' and p_bucket='product-images' and p_sha256=i.output_sha256 and p_object_path='batch/'||i.id::text||'/r'||i.revision::text||'-'||p_sha256||'.webp')) then raise exception 'INVALID_OBJECT_PATH'; end if;
 select * into prior from private.batch_storage_reservations where bucket=p_bucket and object_path=p_object_path;
 if found then
  if prior.item_id<>i.id or prior.reserved_bytes<>p_byte_size or prior.sha256 is distinct from p_sha256 then raise exception 'OBJECT_RESERVATION_CHANGED'; end if;
  return false;
 end if;
 if policy.singleton is null or not policy.enabled then raise exception 'BATCH_ADMISSION_PAUSED'; end if;
 select created_by into owner_id from public.media_batches where id=i.batch_id;
 select coalesce(sum(reserved_bytes),0) into store_retained from private.batch_storage_reservations;
 select coalesce(sum(reserved_bytes),0) into actor_retained from private.batch_storage_reservations where created_by=owner_id;
 if store_retained+p_byte_size>policy.max_store_retained_bytes or actor_retained+p_byte_size>policy.max_actor_retained_bytes then raise exception 'BATCH_ADMISSION_STORAGE_LIMIT'; end if;
 insert into private.batch_storage_reservations(bucket,object_path,item_id,created_by,reserved_bytes,kind,sha256) values(p_bucket,p_object_path,i.id,owner_id,p_byte_size,'derived',p_sha256);
 return true;
end;$$;

create function public.batch_capacity(p_actor uuid) returns jsonb
language plpgsql security invoker set search_path='' as $$
begin
 perform public.batch_require_staff(p_actor);
 return jsonb_build_object('policy',(select to_jsonb(p)-'updated_by' from private.batch_admission_policy p where singleton),
  'actorOutstanding',(select count(*) from public.media_batch_items i join public.media_batches b on b.id=i.batch_id where b.created_by=p_actor and i.status<>'published'),
  'storeOutstanding',(select count(*) from public.media_batch_items where status<>'published'),
  'actorRetainedBytes',(select coalesce(sum(reserved_bytes),0) from private.batch_storage_reservations where created_by=p_actor),
  'storeRetainedBytes',(select coalesce(sum(reserved_bytes),0) from private.batch_storage_reservations));
end;$$;
create function public.batch_configure_capacity(p_actor uuid,p_policy jsonb) returns jsonb
language plpgsql security invoker set search_path='' as $$
begin
 perform public.batch_require_staff(p_actor,true);
 if jsonb_typeof(p_policy) is distinct from 'object' or exists(select 1 from jsonb_object_keys(p_policy) k where k not in ('enabled','max_batch_items','max_batch_bytes','max_actor_outstanding','max_store_outstanding','max_actor_retained_bytes','max_store_retained_bytes')) then raise exception 'INVALID_CAPACITY_POLICY'; end if;
 update private.batch_admission_policy set
 enabled=coalesce((p_policy->>'enabled')::boolean,enabled),
 max_batch_items=coalesce((p_policy->>'max_batch_items')::integer,max_batch_items),
 max_batch_bytes=coalesce((p_policy->>'max_batch_bytes')::bigint,max_batch_bytes),
 max_actor_outstanding=coalesce((p_policy->>'max_actor_outstanding')::integer,max_actor_outstanding),
 max_store_outstanding=coalesce((p_policy->>'max_store_outstanding')::integer,max_store_outstanding),
 max_actor_retained_bytes=coalesce((p_policy->>'max_actor_retained_bytes')::bigint,max_actor_retained_bytes),
 max_store_retained_bytes=coalesce((p_policy->>'max_store_retained_bytes')::bigint,max_store_retained_bytes),
 updated_by=p_actor,updated_at=now() where singleton;
 insert into public.media_batch_audit(actor_id,action,detail) values(p_actor,'capacity_policy_updated',p_policy);
 return public.batch_capacity(p_actor);
end;$$;
-- Database completion cannot bypass the reservation contract if an old worker
-- is accidentally started after this migration.
create function private.guard_batch_storage_reservation() returns trigger
language plpgsql security invoker set search_path='' as $$
begin
 if old.status='processing' and new.status='review' and not exists(select 1 from private.batch_storage_reservations where item_id=new.id and bucket='batch-processed' and object_path=new.processed_path and sha256=new.output_sha256) then raise exception 'MISSING_OBJECT_RESERVATION'; end if;
 if new.status='published' and old.status<>'published' and not exists(select 1 from public.product_images im join private.batch_storage_reservations r on r.bucket='product-images' and r.object_path=im.storage_path and r.item_id=new.id and r.sha256=new.output_sha256 where im.product_id=new.id) then raise exception 'MISSING_OBJECT_RESERVATION'; end if;
 return new;
end;$$;
create trigger media_batch_storage_reservation before update on public.media_batch_items for each row execute function private.guard_batch_storage_reservation();
revoke execute on function private.guard_batch_storage_reservation() from public,anon,authenticated;
grant execute on function private.guard_batch_storage_reservation() to service_role;
revoke execute on function public.batch_reserve_object(uuid,integer,uuid,text,text,integer,text),public.batch_capacity(uuid),public.batch_configure_capacity(uuid,jsonb) from public,anon,authenticated;
grant execute on function public.batch_reserve_object(uuid,integer,uuid,text,text,integer,text),public.batch_capacity(uuid),public.batch_configure_capacity(uuid,jsonb) to service_role;
commit;
