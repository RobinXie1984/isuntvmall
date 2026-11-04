-- Link only an individually approved, integrity-checked existing image.
begin;
alter table public.product_images add constraint product_images_product_id_id_unique unique(product_id,id);
create table public.product_variant_images (
 product_id uuid not null,
 variant_id uuid not null,
 image_id uuid not null,
 linked_by uuid not null references auth.users(id),
 created_at timestamptz not null default now(),
 primary key(variant_id,image_id),
 foreign key(product_id,variant_id) references public.product_variants(product_id,id),
 foreign key(product_id,image_id) references public.product_images(product_id,id)
);
alter table public.product_variant_images enable row level security;
revoke all on public.product_variant_images from public,anon,authenticated;
grant select,insert on public.product_variant_images to service_role;
create function public.shopify_variant_images_list(p_actor uuid,p_product uuid) returns jsonb language plpgsql security invoker set search_path='' as $$
declare result jsonb;
begin
 perform private.merchandise_require_actor(p_actor);
 if not exists(select 1 from private.shopify_native_products where product_id=p_product) then raise exception 'PRODUCT_NOT_FOUND';end if;
 select coalesce(jsonb_agg(jsonb_build_object('id',im.id,'url',im.source_url,'alt',im.alt_text,'variantIds',(select coalesce(jsonb_agg(link.variant_id),'[]'::jsonb) from public.product_variant_images link where link.image_id=im.id)) order by im.position),'[]'::jsonb) into result from public.product_images im where im.product_id=p_product and im.is_visible and exists(select 1 from public.media_batch_items b where b.product_id=im.product_id and b.status='published' and b.approved_by is not null and b.approved_revision=b.revision and b.output_sha256 is not null and im.storage_path='batch/'||b.id::text||'/r'||b.revision::text||'-'||b.output_sha256||'.webp');
 return result;
end;$$;
revoke all on function public.shopify_variant_images_list(uuid,uuid) from public,anon,authenticated;
grant execute on function public.shopify_variant_images_list(uuid,uuid) to service_role;
create function public.shopify_link_variant_image(p_actor uuid,p_variant uuid,p_image uuid) returns jsonb language plpgsql security invoker set search_path='' as $$
declare product uuid; existing boolean;
begin
 perform private.merchandise_require_actor(p_actor,true);
 select product_id into product from public.product_variants where id=p_variant for update;
 if product is null then raise exception 'VARIANT_NOT_FOUND';end if;
 if not exists(select 1 from public.product_images im join public.media_batch_items b on b.product_id=im.product_id and b.status='published' and b.approved_by is not null and b.approved_revision=b.revision and b.output_sha256 is not null and im.storage_path='batch/'||b.id::text||'/r'||b.revision::text||'-'||b.output_sha256||'.webp' where im.id=p_image and im.product_id=product and im.is_visible) then raise exception 'IMAGE_NOT_APPROVED';end if;
 select exists(select 1 from public.product_variant_images where variant_id=p_variant and image_id=p_image) into existing;
 if not existing then
  insert into public.product_variant_images(product_id,variant_id,image_id,linked_by) values(product,p_variant,p_image,p_actor);
  insert into private.shopify_native_audit(product_id,actor_id,action,detail) values(product,p_actor,'variant_image_linked',jsonb_build_object('variant',p_variant,'image',p_image));
 end if;
 return jsonb_build_object('ok',true,'replayed',existing);
end;$$;
revoke all on function public.shopify_link_variant_image(uuid,uuid,uuid) from public,anon,authenticated;
grant execute on function public.shopify_link_variant_image(uuid,uuid,uuid) to service_role;
commit;
