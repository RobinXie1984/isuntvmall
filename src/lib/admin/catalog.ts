import "server-only";

import { getSupabaseAdmin } from "@/lib/supabase/admin";
import type { LiveSessionInput } from "@/lib/ingest/live";
import type { ProductInput } from "@/lib/ingest/products";

function productRow(product: ProductInput) {
  return {
    sku: product.sku,
    slug: product.slug,
    title: product.title,
    description: product.description,
    price_amount: product.priceAmount,
    currency: product.currency,
    stock_qty: product.stockQty,
    category: product.category,
    status: product.status,
    featured: product.featured,
  };
}

export async function upsertProduct(product: ProductInput) {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("products")
    .upsert(productRow(product), { onConflict: "sku" })
    .select("id, sku")
    .single();
  if (error) throw new Error(`Could not save ${product.sku}: ${error.message}`);

  if (product.imageUrl) {
    const { error: imageError } = await supabase.from("product_images").upsert(
      {
        product_id: data.id,
        source_url: product.imageUrl,
        alt_text: product.title,
        position: 0,
      },
      { onConflict: "product_id,position" },
    );
    if (imageError) throw new Error(`Product saved, but its image failed: ${imageError.message}`);
  }

  return data;
}

export async function importProducts(products: ProductInput[]) {
  const {data,error}=await getSupabaseAdmin().rpc("import_products_atomic",{
    p_products:products.map(product=>({...productRow(product),image_url:product.imageUrl || null})),
  });
  if(error) throw new Error("Import was rolled back; no products were saved. Check for existing slug conflicts and retry. 导入已回滚，未保存商品。");
  return data as Array<{id:string;sku:string}>;
}

export async function upsertLiveSession(input: LiveSessionInput) {
  const supabase = getSupabaseAdmin();
  const {data:kol,error:kolError}=await supabase.from("kols").select("id").eq("id",input.kolId).eq("status","active").single();
  if(kolError || !kol) throw new Error("Select an active host before saving this room.");
  const { data, error } = await supabase
    .from("live_sessions")
    .upsert(
      {
        slug: input.slug,
        title: input.title,
        description: input.description,
        host_name: input.hostName,
        kol_id: input.kolId,
        platform: input.platform,
        external_url: input.externalUrl,
        embed_id: input.embedId || null,
        status: input.status,
        starts_at: input.startsAt,
        ends_at: input.endsAt || null,
        poster_url: input.posterUrl || null,
      },
      { onConflict: "slug" },
    )
    .select("id, slug")
    .single();
  if (error) throw new Error(`Could not save livestream: ${error.message}`);

  const { error: deleteError } = await supabase.from("live_products").delete().eq("live_session_id", data.id);
  if (deleteError) throw new Error(`Livestream saved, but product links could not be reset: ${deleteError.message}`);

  if (input.productIds.length) {
    const { error: linkError } = await supabase.from("live_products").insert(
      input.productIds.map((productId, position) => ({
        live_session_id: data.id,
        product_id: productId,
        position,
      })),
    );
    if (linkError) throw new Error(`Livestream saved, but products could not be linked: ${linkError.message}`);
  }

  return data;
}
