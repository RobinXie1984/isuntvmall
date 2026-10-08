-- Server-managed editorial video content. Browser roles never write directly.
begin;
create table public.storefront_broadcasts (
 id uuid primary key,
 payload jsonb not null check(jsonb_typeof(payload)='object'),
 revision integer not null default 1 check(revision>0),
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now(),
 check(payload->>'kind' in ('introduction','broadcast')),
 check(payload->>'status' in ('recorded','live','scheduled')),
 check(jsonb_typeof(payload->'visible')='boolean'),
 check(jsonb_typeof(payload->'productIds')='array')
);
create unique index storefront_single_introduction on public.storefront_broadcasts((payload->>'kind')) where payload->>'kind'='introduction';
alter table public.storefront_broadcasts enable row level security;
revoke all on public.storefront_broadcasts from public,anon,authenticated;
grant select,insert,update on public.storefront_broadcasts to service_role;
create table public.storefront_broadcast_audit (
 id bigint generated always as identity primary key,
 actor_id uuid not null references auth.users(id),
 broadcast_id uuid not null references public.storefront_broadcasts(id),
 before_state jsonb, after_state jsonb not null,
 created_at timestamptz not null default now()
);
alter table public.storefront_broadcast_audit enable row level security;
revoke all on public.storefront_broadcast_audit from public,anon,authenticated;
grant select,insert on public.storefront_broadcast_audit to service_role;
grant usage,select on sequence public.storefront_broadcast_audit_id_seq to service_role;

create function public.storefront_broadcast_save(p_actor uuid,p_id uuid,p_revision integer,p_payload jsonb)
returns public.storefront_broadcasts language plpgsql security invoker set search_path=public,pg_temp as $$
declare previous public.storefront_broadcasts; result public.storefront_broadcasts; field text;
begin
 if not exists(select 1 from public.staff_members where user_id=p_actor and active and role in ('super_admin','admin','operator')) then raise exception 'STAFF_FORBIDDEN'; end if;
 if p_id is null or p_revision is null or p_revision<0 or jsonb_typeof(p_payload) is distinct from 'object' then raise exception 'INVALID_BROADCAST'; end if;
 if not (p_payload ?& array['kind','title','titleZh','titleHans','titleJa','url','thumbnailUrl','position','visible','status','productIds']) or
    (p_payload - array['kind','title','titleZh','titleHans','titleJa','url','thumbnailUrl','position','visible','status','productIds']) <> '{}'::jsonb then raise exception 'INVALID_BROADCAST'; end if;
 foreach field in array array['title','titleZh','titleHans','titleJa'] loop
  if jsonb_typeof(p_payload->field) is distinct from 'string' or char_length(trim(p_payload->>field)) not between 1 and 180 then raise exception 'INVALID_BROADCAST'; end if;
 end loop;
 if coalesce(p_payload->>'kind','') not in ('introduction','broadcast') or coalesce(p_payload->>'status','') not in ('recorded','live','scheduled') or
    jsonb_typeof(p_payload->'visible') is distinct from 'boolean' or jsonb_typeof(p_payload->'productIds') is distinct from 'array' or
    jsonb_typeof(p_payload->'position') is distinct from 'number' or (p_payload->>'position') !~ '^\d{1,5}$' or (p_payload->>'position')::int>10000 or
    coalesce(p_payload->>'url','') !~ '^https://(www\.|m\.)?(youtube\.com|youtu\.be|facebook\.com|fb\.watch)/[^[:space:]]+$' or char_length(p_payload->>'url')>2000 or
    jsonb_typeof(p_payload->'thumbnailUrl') is distinct from 'string' or char_length(p_payload->>'thumbnailUrl')>2000 then raise exception 'INVALID_BROADCAST'; end if;
 if jsonb_array_length(p_payload->'productIds')>100 or exists(select 1 from jsonb_array_elements_text(p_payload->'productIds') x where x !~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$') then raise exception 'INVALID_BROADCAST'; end if;
 perform pg_advisory_xact_lock(hashtextextended(p_id::text,101008));
 select * into previous from public.storefront_broadcasts where id=p_id for update;
 if (previous.id is null and p_revision<>0) or (previous.id is not null and previous.revision<>p_revision) then raise exception 'STALE_BROADCAST'; end if;
 if previous.id is null and (select count(*) from public.storefront_broadcasts)>=500 then raise exception 'BROADCAST_LIMIT'; end if;
 insert into public.storefront_broadcasts(id,payload) values(p_id,p_payload)
 on conflict(id) do update set payload=excluded.payload,revision=storefront_broadcasts.revision+1,updated_at=now() returning * into result;
 insert into public.storefront_broadcast_audit(actor_id,broadcast_id,before_state,after_state) values(p_actor,p_id,to_jsonb(previous),to_jsonb(result));
 return result;
end $$;
revoke all on function public.storefront_broadcast_save(uuid,uuid,integer,jsonb) from public,anon,authenticated;
grant execute on function public.storefront_broadcast_save(uuid,uuid,integer,jsonb) to service_role;
commit;
