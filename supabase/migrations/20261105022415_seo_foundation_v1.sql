-- Additive SEO foundation. Keep all existing product slugs and commercial fields.
begin;
alter table public.products add column seo jsonb not null default '{}' check(jsonb_typeof(seo)='object');
alter table public.products add column brand text not null default '' check(length(brand)<=180);
create table public.product_url_aliases (
 slug text primary key, product_id uuid references public.products(id), created_at timestamptz not null default now()
);
alter table public.product_url_aliases enable row level security;
revoke all on public.product_url_aliases from public,anon,authenticated;
grant select,insert on public.product_url_aliases to service_role;
insert into public.product_url_aliases(slug,product_id) select slug,id from public.products;

-- Reserve code-owned showroom URLs; they must never shadow real products.
insert into public.product_url_aliases(slug,product_id) values
('supplier-cer-f001',null),
('supplier-cer-f003',null),
('supplier-cer-f004',null),
('supplier-cer-f005',null),
('supplier-cer-f006',null),
('supplier-cer-f007',null),
('supplier-cer-f008',null),
('supplier-cer-f009',null),
('supplier-cer-f010',null),
('supplier-cer-f011',null),
('supplier-cer-f012',null),
('supplier-cer-f013',null),
('supplier-cer-f014',null),
('supplier-cer-f015',null),
('supplier-cer-f017',null),
('supplier-cer-f018',null),
('supplier-cer-f019',null),
('supplier-cer-f020',null),
('supplier-cer-f024',null),
('supplier-cer-f025',null),
('supplier-cer-f026',null),
('supplier-cer-f027',null),
('supplier-cer-f028',null),
('supplier-cer-f029',null),
('supplier-cer-f030',null),
('supplier-cer-f033',null),
('supplier-cer-f036',null),
('supplier-cer-f037',null),
('supplier-cer-f038',null),
('supplier-cer-f039',null),
('supplier-cer-f040',null),
('supplier-mdxy-1',null),
('supplier-mdxy-2',null),
('supplier-mdxy-3',null),
('supplier-mdxy-4',null),
('supplier-mdxy-5',null),
('supplier-mdxy-6',null),
('supplier-mdxy-7',null),
('supplier-mdxy-8',null),
('supplier-mdxy-9',null),
('supplier-footwear-25a22-1',null),
('supplier-footwear-24d09-5',null),
('supplier-footwear-25p02-2',null),
('supplier-footwear-23a38a-2',null),
('supplier-footwear-2020a1-8',null),
('supplier-footwear-2020a1-7',null),
('supplier-footwear-2020a1-6',null),
('supplier-footwear-24d09-1',null),
('supplier-footwear-23d12-1',null),
('supplier-footwear-23a38-1',null),
('supplier-footwear-23a35-1',null),
('supplier-footwear-23a15h-2',null),
('supplier-footwear-23a15h-1',null),
('supplier-footwear-23a12-1',null),
('supplier-footwear-22d58a-1',null),
('supplier-footwear-21a23h-3',null),
('supplier-footwear-9a57-9',null),
('supplier-footwear-25a18-1',null),
('supplier-footwear-9p65s-2',null),
('supplier-footwear-23p20-2',null),
('supplier-footwear-25p20-2',null),
('supplier-footwear-26p09-2',null),
('supplier-footwear-25p06-2',null),
('supplier-footwear-24p25-1',null),
('supplier-footwear-25p10-3',null),
('supplier-footwear-24p20-6',null),
('supplier-footwear-20p18-6',null),
('supplier-footwear-20p18-5',null),
('supplier-footwear-20p18-3',null),
('supplier-footwear-25p01-2',null),
('supplier-footwear-25p01-5',null),
('supplier-footwear-25a09-1',null),
('supplier-footwear-20p18-2',null),
('supplier-footwear-21d30-1',null),
('supplier-footwear-20p18-1',null),
('supplier-footwear-21a28-5',null),
('supplier-footwear-22d58a-2',null),
('supplier-footwear-25a06-1',null),
('supplier-footwear-22d58a-3',null),
('supplier-footwear-22d58c-3',null),
('supplier-footwear-22d58c-2',null),
('supplier-footwear-25p10-2',null),
('supplier-footwear-25p01-3',null),
('supplier-footwear-25p08-1',null),
('supplier-footwear-26p02-1',null),
('supplier-footwear-26p02-2',null),
('supplier-footwear-25a21-1',null),
('supplier-footwear-22d60-6',null),
('supplier-footwear-25p08-5',null),
('supplier-footwear-26p02-5',null),
('supplier-sup-001',null),
('supplier-sup-002',null),
('supplier-sup-003',null),
('supplier-sup-004',null),
('supplier-sup-005',null),
('supplier-sup-006',null),
('supplier-sup-007',null),
('supplier-sup-008',null),
('supplier-sup-009',null),
('supplier-sup-010',null),
('supplier-sup-011',null),
('supplier-sup-013',null)
on conflict(slug) do nothing;

create function private.seo_slug(p_title text) returns text language sql immutable security invoker set search_path='' as $$
 select coalesce(nullif(trim(both '-' from left(regexp_replace(lower(coalesce(p_title,'')),'[^[:alnum:]]+','-','g'),160)),''),'product');
$$;
create function private.product_slug_generate() returns trigger language plpgsql security invoker set search_path='' as $$
declare base text;candidate text;i integer:=1;
begin
 -- Only new automatically generated handles change. Existing URLs are immutable
 -- unless an authorised colleague deliberately publishes a different slug.
 if new.slug is null or trim(new.slug)='' or new.slug ~ '^shopify-draft-[0-9a-f]{32}$' or right(new.slug,33)='-'||replace(new.id::text,'-','') then
  perform pg_catalog.pg_advisory_xact_lock(73219024);
  base=private.seo_slug(new.title);candidate=base;
  while exists(select 1 from public.product_url_aliases where slug=candidate) or exists(select 1 from public.products where slug=candidate) loop
   i=i+1;candidate=base||'-'||i::text;
  end loop;
  new.slug=candidate;
 end if;
 return new;
end;$$;
create trigger seo_generate_new_slug before insert on public.products for each row execute function private.product_slug_generate();
create function private.product_slug_claim() returns trigger language plpgsql security invoker set search_path='' as $$
declare owner_id uuid;
begin
 insert into public.product_url_aliases(slug,product_id) values(new.slug,new.id) on conflict(slug) do nothing;
 select product_id into owner_id from public.product_url_aliases where slug=new.slug;
 if owner_id is distinct from new.id then raise exception 'SLUG_CONFLICT';end if;
 return new;
end;$$;
create trigger seo_claim_product_slug after insert or update of slug on public.products for each row execute function private.product_slug_claim();

-- Keep the existing bounded validation, role checks, audit and lock ordering.
-- The wrappers participate in the same transaction, so URL conflicts roll back
-- the entire publication. Old clients retain previously saved SEO values.
alter function public.merchandise_list(uuid,integer,text) rename to merchandise_list_core_seo_v1;
alter function public.merchandise_list_core_seo_v1(uuid,integer,text) set schema private;
alter function public.merchandise_save(uuid,uuid,integer,integer,jsonb,jsonb) rename to merchandise_save_core_seo_v1;
alter function public.merchandise_save_core_seo_v1(uuid,uuid,integer,integer,jsonb,jsonb) set schema private;
alter function public.merchandise_publish(uuid,uuid,integer) rename to merchandise_publish_core_seo_v1;
alter function public.merchandise_publish_core_seo_v1(uuid,uuid,integer) set schema private;

create function public.merchandise_list(p_actor uuid,p_page integer default 0,p_search text default '') returns jsonb language plpgsql security invoker set search_path='' as $$
declare result jsonb;items jsonb;
begin
 result=private.merchandise_list_core_seo_v1(p_actor,p_page,p_search);
 select coalesce(jsonb_agg(jsonb_set(x,'{payload}',(x->'payload')-'slug'-'seo'-'brand')||jsonb_build_object('seoSlug',coalesce(x->'payload'->>'slug',p.slug),'seo',coalesce(x->'payload'->'seo',p.seo),'brand',coalesce(x->'payload'->>'brand',p.brand)) order by n),'[]') into items from jsonb_array_elements(result->'items') with ordinality a(x,n) join public.products p on p.id=(x->>'id')::uuid;
 return jsonb_set(result,'{items}',items);
end;$$;
create function public.merchandise_save(p_actor uuid,p_product uuid,p_revision integer,p_base_revision integer,p_payload jsonb,p_supplier jsonb) returns jsonb language plpgsql security invoker set search_path='' as $$
declare result jsonb;seo_value jsonb;slug_value text;brand_value text;before_value jsonb;p public.products;
begin
 perform private.merchandise_require_actor(p_actor);
 select * into p from public.products where id=p_product for update;
 select payload into before_value from private.merchandise_drafts where product_id=p_product for update;
 slug_value=coalesce(nullif(trim(p_payload->>'slug'),''),before_value->>'slug',p.slug,private.seo_slug(p_payload->>'title'));
 seo_value=coalesce(p_payload->'seo',before_value->'seo',p.seo,'{}');brand_value=coalesce(p_payload->>'brand',before_value->>'brand',p.brand,'');
 if slug_value is null or length(slug_value)>180 or slug_value !~ '^[[:alnum:]]+(-[[:alnum:]]+)*$' or slug_value<>lower(slug_value) or length(brand_value)>180 or jsonb_typeof(seo_value) is distinct from 'object' or octet_length(seo_value::text)>8000 then raise exception 'INVALID_SEO';end if;
 if exists(select 1 from jsonb_each(seo_value) a where a.key not in ('en','zh-Hant','zh-Hans','ja') or jsonb_typeof(a.value)<>'object') then raise exception 'INVALID_SEO';end if;
 if exists(select 1 from jsonb_each(seo_value) a cross join lateral jsonb_each(a.value) b where b.key not in ('title','description') or jsonb_typeof(b.value)<>'string' or (b.key='title' and length(b.value#>>'{}')>180) or (b.key='description' and length(b.value#>>'{}')>500)) then raise exception 'INVALID_SEO';end if;
 if exists(select 1 from public.product_url_aliases where slug=slug_value and product_id is distinct from p_product) then raise exception 'SLUG_CONFLICT';end if;
 result=private.merchandise_save_core_seo_v1(p_actor,p_product,p_revision,p_base_revision,p_payload-'seo'-'slug'-'brand',p_supplier);
 update private.merchandise_drafts set payload=payload||jsonb_build_object('seo',seo_value,'slug',slug_value,'brand',brand_value) where product_id=p_product;
 insert into private.merchandise_audit(product_id,actor_id,action,revision,before_state,after_state) values(p_product,p_actor,'seo_draft_saved',p_revision+1,before_value,jsonb_build_object('seo',seo_value,'slug',slug_value,'brand',brand_value));
 return result;
end;$$;
create function public.merchandise_publish(p_actor uuid,p_product uuid,p_revision integer) returns jsonb language plpgsql security invoker set search_path='' as $$
declare result jsonb;d private.merchandise_drafts;p public.products;
begin
 perform pg_catalog.pg_advisory_xact_lock(73219023);
 perform private.merchandise_require_actor(p_actor,true);
 select * into p from public.products where id=p_product for update;
 select * into d from private.merchandise_drafts where product_id=p_product for update;
 result=private.merchandise_publish_core_seo_v1(p_actor,p_product,p_revision);
 update public.products set slug=coalesce(nullif(d.payload->>'slug',''),p.slug),seo=coalesce(d.payload->'seo',p.seo),brand=coalesce(d.payload->>'brand',p.brand) where id=p_product;
 insert into private.merchandise_audit(product_id,actor_id,action,revision,before_state,after_state) values(p_product,p_actor,'seo_published',p_revision,jsonb_build_object('slug',p.slug,'seo',p.seo,'brand',p.brand),jsonb_build_object('slug',coalesce(d.payload->>'slug',p.slug),'seo',coalesce(d.payload->'seo',p.seo),'brand',coalesce(d.payload->>'brand',p.brand)));
 return result;
end;$$;
revoke all on function private.seo_slug(text),private.product_slug_generate(),private.product_slug_claim(),public.merchandise_list(uuid,integer,text),public.merchandise_save(uuid,uuid,integer,integer,jsonb,jsonb),public.merchandise_publish(uuid,uuid,integer) from public,anon,authenticated;
grant execute on function private.seo_slug(text),private.product_slug_generate(),private.product_slug_claim(),public.merchandise_list(uuid,integer,text),public.merchandise_save(uuid,uuid,integer,integer,jsonb,jsonb),public.merchandise_publish(uuid,uuid,integer) to service_role;
commit;
