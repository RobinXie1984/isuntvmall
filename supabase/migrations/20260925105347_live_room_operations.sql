-- Private draft/review state; publication changes the room and its rail together.
begin;
alter table public.live_sessions add column is_public boolean not null default false;
alter table public.live_sessions add column title_zh text not null default '';
alter table public.live_sessions add column description_zh text not null default '';
alter table public.live_sessions add column playback_mode text not null default 'external_link' check(playback_mode in ('embedded','external_link'));
create table public.live_room_drafts (
 id uuid primary key default gen_random_uuid(),
 kol_id uuid not null references public.kols(id),
 payload jsonb not null,
 revision integer not null default 1 check(revision>0),
 state text not null default 'draft' check(state in ('draft','requested','published')),
 published_revision integer,
 created_by uuid references auth.users(id),
 updated_by uuid references auth.users(id),
 updated_at timestamptz not null default now()
);
create table public.live_source_checks (
 id uuid primary key default gen_random_uuid(),
 room_id uuid not null references public.live_room_drafts(id),
 draft_revision integer not null,
 provider text not null,
 source_url text not null,
 embed_id text,
 playback_mode text not null check(playback_mode in ('embedded','external_link')),
 rights_confirmed boolean not null check(rights_confirmed),
 playback_confirmed boolean not null check(playback_confirmed),
 tested_origin text not null check(tested_origin ~ '^https://'),
 device_note text not null check(char_length(trim(device_note)) between 1 and 300),
 checked_by uuid not null references auth.users(id),
 checked_at timestamptz not null default now(),
 unique(room_id,draft_revision)
);
create table public.live_room_state (
 room_id uuid primary key references public.live_sessions(id),
 revision bigint not null default 1 check(revision>0),
 pinned_product_id uuid references public.products(id),
 changed_by uuid references auth.users(id),
 changed_at timestamptz not null default now()
);
create table public.live_room_audit (
 id bigint generated always as identity primary key,
 room_id uuid not null references public.live_room_drafts(id),
 actor_id uuid not null references auth.users(id),
 action text not null,
 draft_revision integer,
 state_revision bigint,
 detail jsonb not null default '{}'::jsonb,
 created_at timestamptz not null default now()
);
alter table public.live_room_drafts enable row level security;
alter table public.live_source_checks enable row level security;
alter table public.live_room_state enable row level security;
alter table public.live_room_audit enable row level security;
revoke all on public.live_room_drafts,public.live_source_checks,public.live_room_state,public.live_room_audit from public,anon,authenticated;
grant all on public.live_room_drafts,public.live_source_checks,public.live_room_state to service_role;
grant select,insert on public.live_room_audit to service_role;
grant usage,select on sequence public.live_room_audit_id_seq to service_role;
create index live_drafts_kol_idx on public.live_room_drafts(kol_id,updated_at desc);
create index live_room_audit_room_idx on public.live_room_audit(room_id,created_at desc);

-- Preserve old data as private drafts. No historical iframe is grandfathered as verified.
insert into public.live_room_drafts(id,kol_id,payload)
select s.id,s.kol_id,jsonb_build_object('slug',s.slug,'title',s.title,'titleZh','','description',s.description,'descriptionZh','','hostName',s.host_name,'kolId',s.kol_id,'platform',s.platform,'externalUrl',s.external_url,'embedId',s.embed_id,'status',case when s.status='preview' then 'scheduled' else s.status end,'startsAt',s.starts_at,'endsAt',s.ends_at,'posterUrl',s.poster_url,'productIds',coalesce((select jsonb_agg(lp.product_id order by lp.position) from public.live_products lp where lp.live_session_id=s.id),'[]'::jsonb))
from public.live_sessions s where s.kol_id is not null;

create function public.live_require_actor(p_actor uuid,p_kol uuid,p_operator boolean default false) returns text
language plpgsql security invoker set search_path='' as $$
declare r text; k uuid;
begin
 select role,kol_id into r,k from public.staff_members where user_id=p_actor and active for share;
 if r is null or (p_operator and r not in ('super_admin','operator')) or (not p_operator and r not in ('super_admin','operator') and not(r='kol' and k is not null and k=p_kol)) then raise exception 'LIVE_FORBIDDEN';end if;
 return r;
end;$$;

create function public.live_valid_payload(p jsonb) returns boolean
language plpgsql immutable security invoker set search_path='' as $$
declare ids integer; unique_ids integer; start_time timestamptz; end_time timestamptz;
begin
 if jsonb_typeof(p) is distinct from 'object' or octet_length(p::text)>24000
 or exists(select 1 from jsonb_object_keys(p) k where k not in ('slug','title','titleZh','description','descriptionZh','hostName','kolId','platform','externalUrl','embedId','status','startsAt','endsAt','posterUrl','productIds'))
 or coalesce(p->>'slug' !~ '^[a-z0-9]+(-[a-z0-9]+)*$',true) or char_length(p->>'slug')>120
 or coalesce(char_length(trim(p->>'title')) not between 1 and 180,true) or coalesce(char_length(trim(p->>'titleZh')) not between 1 and 180,true)
 or coalesce(char_length(p->>'description')>5000,true) or coalesce(char_length(p->>'descriptionZh')>5000,true)
 or coalesce(char_length(trim(p->>'hostName')) not between 1 and 120,true)
 or coalesce(p->>'platform' not in ('youtube','facebook','instagram','tiktok','external'),true)
 or coalesce(p->>'externalUrl' !~ '^https://[^[:space:]]+$',true) or char_length(p->>'externalUrl')>2048
 or coalesce(p->>'status' not in ('scheduled','live','ended'),true)
 or jsonb_typeof(p->'productIds') is distinct from 'array' or jsonb_array_length(p->'productIds')>30 then return false;end if;
 if nullif(p->>'embedId','') is not null and char_length(p->>'embedId')>200 then return false;end if;
 if nullif(p->>'posterUrl','') is not null and (p->>'posterUrl' !~ '^https://[^[:space:]]+$' or char_length(p->>'posterUrl')>2048) then return false;end if;
 perform (p->>'kolId')::uuid;
 start_time=(p->>'startsAt')::timestamptz;end_time=nullif(p->>'endsAt','')::timestamptz;
 if start_time is null or (end_time is not null and end_time<start_time) then return false;end if;
 select count(*),count(distinct value::uuid) into ids,unique_ids from jsonb_array_elements_text(p->'productIds');
 return ids=unique_ids;
exception when others then return false;
end;$$;

create function public.live_room_save(p_actor uuid,p_room_id uuid,p_revision integer,p_payload jsonb) returns public.live_room_drafts
language plpgsql security invoker set search_path='' as $$
declare d public.live_room_drafts;r text; k uuid;
begin
 if p_room_id is null or p_revision is null or p_revision<0 or not public.live_valid_payload(p_payload) then raise exception 'INVALID_LIVE_DRAFT';end if;
 k=(p_payload->>'kolId')::uuid;r=public.live_require_actor(p_actor,k);
 if not exists(select 1 from public.kols where id=k and status='active') then raise exception 'HOST_UNAVAILABLE';end if;
 perform pg_catalog.pg_advisory_xact_lock(hashtextextended(p_room_id::text,916));
 select * into d from public.live_room_drafts where id=p_room_id for update;
 if found then
  perform public.live_require_actor(p_actor,d.kol_id);
  if d.revision=p_revision+1 and d.payload=p_payload and d.updated_by=p_actor then return d;end if;
  if d.revision<>p_revision then raise exception 'STALE_LIVE_REVISION';end if;
  if r='kol' and (d.payload->>'platform' is distinct from p_payload->>'platform' or d.payload->>'externalUrl' is distinct from p_payload->>'externalUrl' or d.payload->>'embedId' is distinct from p_payload->>'embedId') then raise exception 'SOURCE_CHANGE_REQUIRES_OPERATOR';end if;
  update public.live_room_drafts set payload=p_payload,kol_id=k,revision=revision+1,state='draft',updated_by=p_actor,updated_at=now() where id=p_room_id returning * into d;
 else
  if p_revision<>0 or exists(select 1 from public.live_sessions where id=p_room_id) then raise exception 'STALE_LIVE_REVISION';end if;
  insert into public.live_room_drafts(id,kol_id,payload,created_by,updated_by) values(p_room_id,k,p_payload,p_actor,p_actor) returning * into d;
 end if;
 insert into public.live_room_audit(room_id,actor_id,action,draft_revision) values(d.id,p_actor,'draft_saved',d.revision);
 return d;
end;$$;

create function public.live_room_request(p_actor uuid,p_room_id uuid,p_revision integer) returns public.live_room_drafts
language plpgsql security invoker set search_path='' as $$
declare d public.live_room_drafts;
begin
 select * into d from public.live_room_drafts where id=p_room_id for update;
 if not found then raise exception 'LIVE_NOT_FOUND';end if;
 perform public.live_require_actor(p_actor,d.kol_id);
 if d.revision is distinct from p_revision or d.state not in ('draft','requested') then raise exception 'STALE_LIVE_REVISION';end if;
 if d.state='requested' then return d;end if;
 update public.live_room_drafts set state='requested',updated_by=p_actor,updated_at=now() where id=d.id returning * into d;
 insert into public.live_room_audit(room_id,actor_id,action,draft_revision) values(d.id,p_actor,'publication_requested',d.revision);
 return d;
end;$$;

create function public.live_source_verify(p_actor uuid,p_room_id uuid,p_revision integer,p_mode text,p_origin text,p_device_note text,p_rights boolean,p_playback boolean) returns public.live_source_checks
language plpgsql security invoker set search_path='' as $$
declare d public.live_room_drafts;c public.live_source_checks;
begin
 perform public.live_require_actor(p_actor,null,true);
 select * into d from public.live_room_drafts where id=p_room_id for update;
 if not found then raise exception 'LIVE_NOT_FOUND';end if;
 if d.revision is distinct from p_revision then raise exception 'STALE_LIVE_REVISION';end if;
 if p_rights is distinct from true or p_playback is distinct from true then raise exception 'SOURCE_NOT_VERIFIED';end if;
 if p_mode not in ('embedded','external_link') or p_mode is null or (p_mode='embedded' and d.payload->>'platform' not in ('youtube','facebook')) then raise exception 'UNSUPPORTED_EMBED';end if;
 insert into public.live_source_checks(room_id,draft_revision,provider,source_url,embed_id,playback_mode,rights_confirmed,playback_confirmed,tested_origin,device_note,checked_by)
 values(d.id,d.revision,d.payload->>'platform',d.payload->>'externalUrl',nullif(d.payload->>'embedId',''),p_mode,p_rights,p_playback,p_origin,trim(p_device_note),p_actor)
 on conflict(room_id,draft_revision) do update set playback_mode=excluded.playback_mode,tested_origin=excluded.tested_origin,device_note=excluded.device_note,checked_by=excluded.checked_by,checked_at=now() returning * into c;
 insert into public.live_room_audit(room_id,actor_id,action,draft_revision,detail) values(d.id,p_actor,'source_verified',d.revision,jsonb_build_object('mode',p_mode,'check_id',c.id));
 return c;
end;$$;

create function public.live_room_publish(p_actor uuid,p_room_id uuid,p_revision integer) returns public.live_room_state
language plpgsql security invoker set search_path='' as $$
declare d public.live_room_drafts;c public.live_source_checks;s public.live_room_state;p jsonb;
begin
 perform public.live_require_actor(p_actor,null,true);
 select * into d from public.live_room_drafts where id=p_room_id for update;
 if not found then raise exception 'LIVE_NOT_FOUND';end if;
 if d.revision is distinct from p_revision then raise exception 'STALE_LIVE_REVISION';end if;
 if d.published_revision=d.revision and d.state='published' then select * into s from public.live_room_state where room_id=d.id;return s;end if;
 select * into c from public.live_source_checks where room_id=d.id and draft_revision=d.revision;
 if not found or c.checked_at<now()-interval '24 hours' or not exists(select 1 from public.staff_members where user_id=c.checked_by and active and role in ('super_admin','operator')) then raise exception 'SOURCE_NOT_VERIFIED';end if;
 p=d.payload;
 if not public.live_valid_payload(p) or not exists(select 1 from public.kols where id=d.kol_id and status='active') then raise exception 'INVALID_LIVE_DRAFT';end if;
 if jsonb_array_length(p->'productIds')=0 then raise exception 'EMPTY_LIVE_RAIL';end if;
 -- Hold catalog rows during publication; no draft or demo merchandise is sellable.
 perform 1 from public.products where id in (select value::uuid from jsonb_array_elements_text(p->'productIds')) order by id for share;
 if exists(select 1 from jsonb_array_elements_text(p->'productIds') i where not exists(select 1 from public.products x where x.id=i.value::uuid and x.status='published' and not x.is_demo and x.price_amount>0)) then raise exception 'PRODUCT_NOT_APPROVED';end if;
 insert into public.live_sessions(id,slug,title,title_zh,description,description_zh,host_name,kol_id,platform,external_url,embed_id,status,starts_at,ends_at,poster_url,is_public,playback_mode)
 values(d.id,p->>'slug',p->>'title',p->>'titleZh',p->>'description',p->>'descriptionZh',p->>'hostName',d.kol_id,p->>'platform',p->>'externalUrl',case when c.playback_mode='external_link' then null else nullif(p->>'embedId','') end,p->>'status',(p->>'startsAt')::timestamptz,nullif(p->>'endsAt','')::timestamptz,nullif(p->>'posterUrl',''),true,c.playback_mode)
 on conflict(id) do update set slug=excluded.slug,title=excluded.title,title_zh=excluded.title_zh,description=excluded.description,description_zh=excluded.description_zh,host_name=excluded.host_name,kol_id=excluded.kol_id,platform=excluded.platform,external_url=excluded.external_url,embed_id=excluded.embed_id,status=excluded.status,starts_at=excluded.starts_at,ends_at=excluded.ends_at,poster_url=excluded.poster_url,is_public=true,playback_mode=excluded.playback_mode;
 -- These writes are in one RPC transaction: failure rolls back both room and rail.
 delete from public.live_products where live_session_id=d.id;
 insert into public.live_products(live_session_id,product_id,position) select d.id,value::uuid,ordinality-1 from jsonb_array_elements_text(p->'productIds') with ordinality;
 insert into public.live_room_state(room_id,changed_by) values(d.id,p_actor)
 on conflict(room_id) do update set revision=public.live_room_state.revision+1,pinned_product_id=case when public.live_room_state.pinned_product_id in (select value::uuid from jsonb_array_elements_text(p->'productIds')) then public.live_room_state.pinned_product_id else null end,changed_by=p_actor,changed_at=now() returning * into s;
 update public.live_room_drafts set state='published',published_revision=revision,updated_by=p_actor,updated_at=now() where id=d.id;
 insert into public.live_room_audit(room_id,actor_id,action,draft_revision,state_revision,detail) values(d.id,p_actor,'published',d.revision,s.revision,jsonb_build_object('source_check',c.id,'products',jsonb_array_length(p->'productIds')));
 return s;
end;$$;

create function public.live_room_pin(p_actor uuid,p_room_id uuid,p_state_revision bigint,p_product_id uuid) returns public.live_room_state
language plpgsql security invoker set search_path='' as $$
declare s public.live_room_state; k uuid;
begin
 -- Same draft-first lock order as publication prevents rail/pin races.
 perform 1 from public.live_room_drafts where id=p_room_id for update;
 select kol_id into k from public.live_sessions where id=p_room_id and is_public and status='live';
 if not found then raise exception 'ROOM_NOT_LIVE';end if;
 perform public.live_require_actor(p_actor,k);
 if not exists(select 1 from public.kols where id=k and status='active') then raise exception 'HOST_UNAVAILABLE';end if;
 select * into s from public.live_room_state where room_id=p_room_id for update;
 if not found or s.revision is distinct from p_state_revision then raise exception 'STALE_PIN_REVISION';end if;
 if p_product_id is not null and not exists(select 1 from public.live_products lp join public.products p on p.id=lp.product_id where lp.live_session_id=p_room_id and p.id=p_product_id and p.status='published' and not p.is_demo) then raise exception 'PRODUCT_NOT_IN_RAIL';end if;
 if s.pinned_product_id is not distinct from p_product_id then return s;end if;
 update public.live_room_state set pinned_product_id=p_product_id,revision=revision+1,changed_by=p_actor,changed_at=now() where room_id=p_room_id returning * into s;
 insert into public.live_room_audit(room_id,actor_id,action,state_revision,detail) values(p_room_id,p_actor,'product_pinned',s.revision,jsonb_build_object('product_id',p_product_id));
 return s;
end;$$;

-- One snapshot for polling: no draft, staff identity, source-check note or private data.
create function public.live_room_public(p_room_id uuid) returns jsonb
language sql stable security invoker set search_path='' as $$
 select jsonb_build_object('id',s.id,'revision',st.revision,'status',s.status,'kolId',s.kol_id,'externalUrl',s.external_url,'platform',s.platform,'embedId',s.embed_id,'playbackMode',s.playback_mode,
 'pinnedProductId',case when exists(select 1 from public.live_products lp join public.products p on p.id=lp.product_id where lp.live_session_id=s.id and p.id=st.pinned_product_id and p.status='published' and not p.is_demo) then st.pinned_product_id else null end,
 'products',coalesce((select jsonb_agg(jsonb_build_object('id',p.id,'sku',p.sku,'slug',p.slug,'title',p.title,'titleZh',p.title_zh,'description',p.description,'descriptionZh',p.description_zh,'priceAmount',p.price_amount,'currency',p.currency,'stockQty',p.stock_qty,'category',p.category,'status',p.status,'featured',p.featured,'isDemo',false,'createdAt',p.created_at,'images',coalesce((select jsonb_agg(jsonb_build_object('id',im.id,'sourceUrl',im.source_url,'storagePath',null,'altText',im.alt_text,'position',im.position) order by im.position) from public.product_images im where im.product_id=p.id),'[]'::jsonb)) order by lp.position) from public.live_products lp join public.products p on p.id=lp.product_id where lp.live_session_id=s.id and p.status='published' and not p.is_demo),'[]'::jsonb))
 from public.live_sessions s join public.live_room_state st on st.room_id=s.id join public.kols k on k.id=s.kol_id and k.status='active'
 where s.id=p_room_id and s.is_public and s.status in ('scheduled','live','ended');
$$;
revoke execute on function public.live_room_public(uuid) from public,anon,authenticated;
grant execute on function public.live_room_public(uuid) to service_role;

revoke execute on function public.live_require_actor(uuid,uuid,boolean),public.live_valid_payload(jsonb),public.live_room_save(uuid,uuid,integer,jsonb),public.live_room_request(uuid,uuid,integer),public.live_source_verify(uuid,uuid,integer,text,text,text,boolean,boolean),public.live_room_publish(uuid,uuid,integer),public.live_room_pin(uuid,uuid,bigint,uuid) from public,anon,authenticated;
grant execute on function public.live_require_actor(uuid,uuid,boolean),public.live_valid_payload(jsonb),public.live_room_save(uuid,uuid,integer,jsonb),public.live_room_request(uuid,uuid,integer),public.live_source_verify(uuid,uuid,integer,text,text,text,boolean,boolean),public.live_room_publish(uuid,uuid,integer),public.live_room_pin(uuid,uuid,bigint,uuid) to service_role;
commit;
