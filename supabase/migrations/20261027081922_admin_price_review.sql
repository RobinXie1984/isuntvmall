begin;
alter table public.products add column if not exists source_price_overrides jsonb not null default '{}'::jsonb;
create table private.price_review_drafts (
 product_id uuid not null references public.products(id), variant_id text not null,
 revision integer not null default 1, source_key text not null,
 price_amount integer not null check(price_amount>0 and price_amount<=999999999),
 evidence_url text not null, note text not null, state text not null check(state in ('draft','approved','demo')),
 updated_by uuid not null references auth.users(id), updated_at timestamptz not null default now(),
 primary key(product_id,variant_id)
);
alter table private.price_review_drafts enable row level security;
revoke all on private.price_review_drafts from public,anon,authenticated;
grant select,insert,update on private.price_review_drafts to service_role;

create function public.price_review_list(p_actor uuid) returns jsonb language plpgsql security invoker set search_path='' as $$
begin
 perform private.merchandise_require_actor(p_actor,false);
 return coalesce((select jsonb_agg(to_jsonb(d)) from private.price_review_drafts d),'[]'::jsonb);
end;$$;

create function public.price_review_change(p_actor uuid,p_action text,p_product uuid,p_variant text,p_revision integer,p_source_key text,p_amount integer default null,p_evidence text default '',p_note text default '') returns jsonb language plpgsql security invoker set search_path='' as $$
declare p public.products; d private.price_review_drafts; next_revision integer; before_value jsonb; after_value jsonb;
begin
 perform private.merchandise_require_actor(p_actor,p_action<>'save');
 if p_action not in ('save','approve','demo') then raise exception 'INVALID_INPUT'; end if;
 select * into p from public.products where id=p_product for update;
 if not found or p.sku not like 'SUNTV-%' or p.is_demo or p.currency<>'hkd' then raise exception 'PRICE_REVIEW_UNSUPPORTED'; end if;
 if p_variant !~ '^[0-9]{1,30}$' or p_source_key is null or length(p_source_key)<10 or length(p_source_key)>4096 then raise exception 'INVALID_INPUT'; end if;
 select * into d from private.price_review_drafts where product_id=p_product and variant_id=p_variant for update;
 if coalesce(d.revision,0)<>p_revision then raise exception 'STALE_REVISION'; end if;
 next_revision:=coalesce(d.revision,0)+1;
 before_value:=jsonb_build_object('draft',to_jsonb(d),'public',p.source_price_overrides->p_variant);
 if p_action='save' then
  if p_amount is null or p_amount<=0 or p_amount>999999999 or p_amount=1999 or p_evidence !~ '^https://[^[:space:]]+$' or length(p_evidence)>2000 or length(trim(p_note))<20 or length(p_note)>2000 then raise exception 'PRICE_EVIDENCE_REQUIRED'; end if;
  insert into private.price_review_drafts(product_id,variant_id,revision,source_key,price_amount,evidence_url,note,state,updated_by)
   values(p_product,p_variant,next_revision,p_source_key,p_amount,p_evidence,p_note,'draft',p_actor)
   on conflict(product_id,variant_id) do update set revision=excluded.revision,source_key=excluded.source_key,price_amount=excluded.price_amount,evidence_url=excluded.evidence_url,note=excluded.note,state='draft',updated_by=p_actor,updated_at=now();
 elsif p_action='approve' then
  if d.product_id is null or d.state<>'draft' or d.source_key<>p_source_key then raise exception 'STALE_REVIEW'; end if;
  if d.price_amount=1999 or length(trim(d.note))<20 or d.evidence_url !~ '^https://[^[:space:]]+$' then raise exception 'PRICE_EVIDENCE_REQUIRED'; end if;
  after_value:=jsonb_build_object('sourceKey',p_source_key,'priceAmount',d.price_amount,'priceIsPlaceholder',false);
  update public.products set source_price_overrides=jsonb_set(source_price_overrides,array[p_variant],after_value,true),catalog_revision=catalog_revision+1,updated_at=now() where id=p_product;
  update private.price_review_drafts set state='approved',revision=next_revision,updated_by=p_actor,updated_at=now() where product_id=p_product and variant_id=p_variant;
 else
  if length(trim(p_note))<20 or length(p_note)>2000 then raise exception 'PRICE_EVIDENCE_REQUIRED'; end if;
  after_value:=jsonb_build_object('sourceKey',p_source_key,'priceAmount',99999,'priceIsPlaceholder',true);
  update public.products set source_price_overrides=jsonb_set(source_price_overrides,array[p_variant],after_value,true),catalog_revision=catalog_revision+1,updated_at=now() where id=p_product;
  insert into private.price_review_drafts(product_id,variant_id,revision,source_key,price_amount,evidence_url,note,state,updated_by)
   values(p_product,p_variant,next_revision,p_source_key,99999,'',p_note,'demo',p_actor)
   on conflict(product_id,variant_id) do update set revision=excluded.revision,source_key=excluded.source_key,price_amount=99999,evidence_url='',note=p_note,state='demo',updated_by=p_actor,updated_at=now();
 end if;
 select * into d from private.price_review_drafts where product_id=p_product and variant_id=p_variant;
 insert into private.merchandise_audit(product_id,actor_id,action,revision,before_state,after_state)
 values(p_product,p_actor,'price_'||p_action,next_revision,before_value,jsonb_build_object('draft',to_jsonb(d),'public',coalesce(after_value,p.source_price_overrides->p_variant)));
 return jsonb_build_object('revision',next_revision,'state',d.state);
end;$$;

-- Ordinary merchandise edits are never an approval to remove a demo label.
create function private.keep_product_demo_label() returns trigger language plpgsql security invoker set search_path='' as $$
begin
 if old.is_demo and not new.is_demo then raise exception 'DEMO_LABEL_PROTECTED'; end if;
 return new;
end;$$;
create trigger keep_product_demo_label before update on public.products for each row execute function private.keep_product_demo_label();
create function private.keep_draft_demo_label() returns trigger language plpgsql security invoker set search_path='' as $$
begin
 if exists(select 1 from public.products where id=new.product_id and is_demo) and (new.payload->>'isDemo')::boolean is distinct from true then raise exception 'DEMO_LABEL_PROTECTED'; end if;
 return new;
end;$$;
create trigger keep_draft_demo_label before insert or update on private.merchandise_drafts for each row execute function private.keep_draft_demo_label();
revoke all on function public.price_review_list(uuid),public.price_review_change(uuid,text,uuid,text,integer,text,integer,text,text),private.keep_product_demo_label(),private.keep_draft_demo_label() from public,anon,authenticated;
grant execute on function public.price_review_list(uuid),public.price_review_change(uuid,text,uuid,text,integer,text,integer,text,text),private.keep_product_demo_label(),private.keep_draft_demo_label() to service_role;
commit;
