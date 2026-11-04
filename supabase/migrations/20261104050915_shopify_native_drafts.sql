-- Draft-only variant foundation. No source photo or source price is published.
begin;
create table private.shopify_native_products (
 source_handle text primary key,
 product_id uuid not null unique references public.products(id),
 source_batch_id uuid not null references private.shopify_import_batches(id),
 created_by uuid not null references auth.users(id),
 created_at timestamptz not null default now()
);
create table public.product_variants (
 id uuid primary key default gen_random_uuid(),
 product_id uuid not null references public.products(id),
 source_index integer not null check(source_index between 0 and 999),
 sku text not null default '' check(char_length(sku)<=2048),
 option_values jsonb not null check(jsonb_typeof(option_values)='array'),
 stock_qty integer check(stock_qty is null or stock_qty>=0),
 price_amount integer not null default 99999 check(price_amount>0),
 price_is_placeholder boolean not null default true,
 proposed_price_amount integer check(proposed_price_amount is null or proposed_price_amount between 1 and 100000000),
 active boolean not null default false,
 revision integer not null default 1 check(revision>0),
 created_at timestamptz not null default now(),
 unique(product_id,source_index)
);
create table private.shopify_native_audit (
 id bigint generated always as identity primary key,
 product_id uuid not null references public.products(id),
 actor_id uuid not null references auth.users(id),
 action text not null,
 detail jsonb not null default '{}'::jsonb,
 created_at timestamptz not null default now()
);
alter table private.shopify_native_products enable row level security;
alter table private.shopify_native_audit enable row level security;
alter table public.product_variants enable row level security;
revoke all on private.shopify_native_products,private.shopify_native_audit,public.product_variants from public,anon,authenticated;
grant select,insert on private.shopify_native_products,private.shopify_native_audit to service_role;
grant select,insert,update on public.product_variants to service_role;
grant usage,select on sequence private.shopify_native_audit_id_seq to service_role;
create function private.shopify_guard_draft_publish() returns trigger language plpgsql security invoker set search_path='' as $$
begin
 if new.status='published' and old.status is distinct from new.status and exists(select 1 from private.shopify_native_products where product_id=new.id) then raise exception 'VARIANT_MIGRATION_NOT_READY';end if;
 return new;
end;$$;
create trigger shopify_guard_draft_publish before update of status on public.products for each row execute function private.shopify_guard_draft_publish();
create function public.shopify_create_draft(p_actor uuid,p_batch uuid,p_handle text) returns jsonb language plpgsql security invoker set search_path='' as $$
declare entry jsonb; v_id uuid; v_source text; v_slug text; v_sku text; old_id uuid; old_batch uuid; v jsonb; i integer:=0;
begin
 perform private.merchandise_require_actor(p_actor);
 if p_batch is null or p_handle is null or char_length(p_handle) not between 1 and 255 then raise exception 'INVALID_INPUT';end if;
 perform pg_catalog.pg_advisory_xact_lock(hashtextextended('shopify-native:'||p_handle,0));
 select product_id,source_batch_id into old_id,old_batch from private.shopify_native_products where source_handle=p_handle;
 if found and old_batch is distinct from p_batch then raise exception 'SOURCE_CONFLICT';end if;
 if found then return jsonb_build_object('id',old_id,'replayed',true);end if;
 select payload into entry from private.shopify_import_products where batch_id=p_batch and handle=p_handle;
 if entry is null or jsonb_array_length(entry->'variants') not between 1 and 1000 then raise exception 'STAGED_PRODUCT_UNAVAILABLE';end if;
 -- Do not silently create duplicates of pre-existing source SKUs.
 if exists(select 1 from jsonb_array_elements(entry->'variants') a join public.products p on p.sku=a->>'sku' where coalesce(a->>'sku','')<>'') then raise exception 'EXISTING_PRODUCT_CONFLICT';end if;
 v_source=md5(p_handle);v_slug='shopify-draft-'||v_source;v_sku='SHOPIFY-DRAFT-'||v_source;
 if exists(select 1 from public.products where slug=v_slug or sku=v_sku) then raise exception 'EXISTING_PRODUCT_CONFLICT';end if;
 insert into public.products(sku,slug,title,description,title_zh,description_zh,price_amount,currency,stock_qty,category,status,is_demo)
 values(v_sku,v_slug,entry->>'title','',null,null,99999,'hkd',0,'General','draft',true) returning id into v_id;
 insert into private.shopify_native_products(source_handle,product_id,source_batch_id,created_by) values(p_handle,v_id,p_batch,p_actor);
 for v in select value from jsonb_array_elements(entry->'variants') loop
  insert into public.product_variants(product_id,source_index,sku,option_values) values(v_id,i,coalesce(v->>'sku',''),v->'options');i:=i+1;
 end loop;
 insert into private.shopify_native_audit(product_id,actor_id,action,detail) values(v_id,p_actor,'draft_created',jsonb_build_object('batch',p_batch,'variants',i));
 return jsonb_build_object('id',v_id,'replayed',false,'variants',i);
end;$$;
create function public.shopify_variant_list(p_actor uuid,p_product uuid) returns jsonb language plpgsql security invoker set search_path='' as $$
declare result jsonb;
begin
 perform private.merchandise_require_actor(p_actor);
 if not exists(select 1 from private.shopify_native_products where product_id=p_product) then raise exception 'PRODUCT_NOT_FOUND';end if;
 select coalesce(jsonb_agg(jsonb_build_object('id',v.id,'sku',v.sku,'options',v.option_values,'stockQty',v.stock_qty,'proposedPriceAmount',v.proposed_price_amount,'priceAmount',v.price_amount,'priceIsPlaceholder',v.price_is_placeholder,'revision',v.revision) order by v.source_index),'[]') into result from public.product_variants v where v.product_id=p_product;
 return result;
end;$$;
revoke all on function public.shopify_variant_list(uuid,uuid) from public,anon,authenticated;
grant execute on function public.shopify_variant_list(uuid,uuid) to service_role;
create function public.shopify_variant_adjust(p_actor uuid,p_variant uuid,p_revision integer,p_stock integer,p_proposed_price integer,p_reason text) returns jsonb language plpgsql security invoker set search_path='' as $$
declare v public.product_variants;
begin
 perform private.merchandise_require_actor(p_actor);
 if p_variant is null or p_revision is null or p_revision<1 or (p_stock is not null and p_stock not between 0 and 1000000) or (p_proposed_price is not null and p_proposed_price not between 1 and 100000000) or coalesce(length(trim(p_reason)),0) not between 1 and 1000 then raise exception 'INVALID_INPUT';end if;
 select * into v from public.product_variants where id=p_variant for update;
 if not found then raise exception 'VARIANT_NOT_FOUND';end if;
 if v.revision<>p_revision then raise exception 'STALE_REVISION';end if;
 if not exists(select 1 from private.shopify_native_products s join public.products p on p.id=s.product_id where p.id=v.product_id and p.status='draft') then raise exception 'VARIANT_EDIT_FORBIDDEN';end if;
 update public.product_variants set stock_qty=p_stock,proposed_price_amount=p_proposed_price,revision=revision+1 where id=v.id;
 insert into private.shopify_native_audit(product_id,actor_id,action,detail) values(v.product_id,p_actor,'variant_adjusted',jsonb_build_object('variant',v.id,'beforeStock',v.stock_qty,'afterStock',p_stock,'beforeProposedPrice',v.proposed_price_amount,'afterProposedPrice',p_proposed_price,'reason',trim(p_reason)));
 return jsonb_build_object('id',v.id,'revision',v.revision+1,'priceIsPlaceholder',true);
end;$$;
revoke all on function public.shopify_variant_adjust(uuid,uuid,integer,integer,integer,text) from public,anon,authenticated;
grant execute on function public.shopify_variant_adjust(uuid,uuid,integer,integer,integer,text) to service_role;
revoke all on function public.shopify_create_draft(uuid,uuid,text),private.shopify_guard_draft_publish() from public,anon,authenticated;
grant execute on function public.shopify_create_draft(uuid,uuid,text),private.shopify_guard_draft_publish() to service_role;
commit;
