import "server-only";

import { demoKols, demoProducts, getDemoLiveSessions } from "@/lib/data/demo";
import { hasSupabaseConfig } from "@/lib/env";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import type { Kol, LiveSession, Order, Product, ProductImage } from "@/types/commerce";

type RecordValue = Record<string, unknown>;

function mapImage(row: RecordValue): ProductImage {
  return {
    id: String(row.id),
    sourceUrl: String(row.source_url),
    storagePath: row.storage_path ? String(row.storage_path) : null,
    altText: String(row.alt_text ?? ""),
    position: Number(row.position ?? 0),
  };
}

function mapProduct(row: RecordValue): Product {
  const images = Array.isArray(row.product_images) ? row.product_images : [];
  return {
    id: String(row.id),
    isDemo: Boolean(row.is_demo),
    sku: String(row.sku),
    slug: String(row.slug),
    title: String(row.title),
    titleZh: typeof row.title_zh === "string" ? row.title_zh : undefined,
    description: String(row.description ?? ""),
    descriptionZh: typeof row.description_zh === "string" ? row.description_zh : undefined,
    priceAmount: Number(row.price_amount),
    currency: String(row.currency),
    stockQty: Number(row.stock_qty),
    category: String(row.category),
    status: row.status as Product["status"],
    featured: Boolean(row.featured),
    createdAt: String(row.created_at),
    images: (images as RecordValue[]).sort((a, b) => Number(a.position) - Number(b.position)).map(mapImage),
  };
}

export async function getProducts(options: { includeDrafts?: boolean } = {}) {
  if (!hasSupabaseConfig()) {
    return options.includeDrafts ? demoProducts : demoProducts.filter((product) => product.status === "published");
  }

  const rows: RecordValue[] = [];
  // Explicit pages avoid silently truncating a multi-batch catalogue at the
  // provider's default row limit. Public shop rendering is paginated separately.
  for (let offset = 0; ; offset += 500) {
    let query = getSupabaseAdmin().from("products").select("*, product_images(*)")
      .order("featured", { ascending: false }).order("created_at", { ascending: false }).order("id");
    if (!options.includeDrafts) query = query.eq("status", "published");
    const { data, error } = await query.range(offset, offset + 499);
    if (error) throw new Error("Unable to load products.");
    rows.push(...data as RecordValue[]);
    if (data.length < 500) break;
  }
  return rows.map(mapProduct);
}

export async function getProductsByIds(ids: string[]) {
  if (!hasSupabaseConfig()) return demoProducts.filter((product) => ids.includes(product.id));
  const { data, error } = await getSupabaseAdmin()
    .from("products")
    .select("*, product_images(*)")
    .in("id", ids)
    .eq("status", "published");
  if (error) throw new Error(`Unable to load checkout products: ${error.message}`);
  return (data as RecordValue[]).map(mapProduct);
}

export async function getProductBySlug(slug: string) {
  if (!hasSupabaseConfig()) return demoProducts.find(product => product.slug === slug && product.status === "published") ?? null;
  const { data, error } = await getSupabaseAdmin().from("products").select("*, product_images(*)").eq("slug", slug).eq("status", "published").maybeSingle();
  if (error) throw new Error("Unable to load product.");
  return data ? mapProduct(data as RecordValue) : null;
}

function unwrapRelatedProduct(value: unknown) {
  if (Array.isArray(value)) return value[0] as RecordValue | undefined;
  return value as RecordValue | undefined;
}

function mapLiveSession(row: RecordValue, includeDrafts = false): LiveSession {
  const kolRow = unwrapRelatedProduct(row.kols);
  const links = Array.isArray(row.live_products) ? (row.live_products as RecordValue[]) : [];
  const products = links
    .sort((a, b) => Number(a.position) - Number(b.position))
    .map((link) => unwrapRelatedProduct(link.products))
    .filter((product): product is RecordValue => Boolean(product) && (includeDrafts || product?.status === "published"))
    .map(mapProduct);

  return {
    id: String(row.id),
    slug: String(row.slug),
    title: String(row.title),
    description: String(row.description ?? ""),
    hostName: String(row.host_name ?? "SunTV"),
    titleZh: row.title_zh ? String(row.title_zh) : undefined,
    descriptionZh: row.description_zh ? String(row.description_zh) : undefined,
    playbackMode: row.playback_mode as LiveSession["playbackMode"],
    kol: kolRow ? mapKol(kolRow) : null,
    platform: row.platform as LiveSession["platform"],
    externalUrl: String(row.external_url),
    embedId: row.embed_id ? String(row.embed_id) : null,
    status: row.status as LiveSession["status"],
    startsAt: String(row.starts_at),
    endsAt: row.ends_at ? String(row.ends_at) : null,
    posterUrl: row.poster_url ? String(row.poster_url) : null,
    products,
  };
}

export async function getLiveSessions(options: { includeAll?: boolean } = {}) {
  if (!hasSupabaseConfig()) return getDemoLiveSessions();

  let query = getSupabaseAdmin()
    .from("live_sessions")
    .select("*, kols(*), live_products(position, products(*, product_images(*)))")
    .order("starts_at", { ascending: true });
  if (!options.includeAll) query = query.eq("is_public",true).in("status", ["live", "scheduled", "ended"]);
  const { data, error } = await query;
  if (error) throw new Error(`Unable to load livestreams: ${error.message}`);
  return (data as RecordValue[]).filter(row => options.includeAll || unwrapRelatedProduct(row.kols)?.status === "active").map(row => mapLiveSession(row, Boolean(options.includeAll)));
}

export async function getLiveSessionBySlug(slug: string) {
  const sessions = await getLiveSessions();
  return sessions.find((session) => session.slug === slug) ?? null;
}

export async function getOrders(): Promise<Order[]> {
  if (!hasSupabaseConfig()) return [];
  const { data, error } = await getSupabaseAdmin()
    .from("orders")
    .select("*, order_items(*)")
    .order("created_at", { ascending: false })
    .limit(100);
  if (error) throw new Error(`Unable to load orders: ${error.message}`);

  return (data as RecordValue[]).map((row) => ({
    id: String(row.id),
    stripeCheckoutSessionId: row.stripe_checkout_session_id ? String(row.stripe_checkout_session_id) : null,
    status: row.status as Order["status"],
    currency: String(row.currency),
    subtotalAmount: Number(row.subtotal_amount),
    shippingAmount: row.shipping_amount === null ? null : Number(row.shipping_amount),
    taxAmount: row.tax_amount === null ? null : Number(row.tax_amount),
    totalAmount: row.total_amount === null ? null : Number(row.total_amount),
    customerEmail: row.customer_email ? String(row.customer_email) : null,
    customerName: row.customer_name ? String(row.customer_name) : null,
    createdAt: String(row.created_at),
    paidAt: row.paid_at ? String(row.paid_at) : null,
    items: ((row.order_items ?? []) as RecordValue[]).map((item) => ({
      id: String(item.id),
      liveSessionId: item.live_session_id ? String(item.live_session_id) : null,
      kolId: item.kol_id ? String(item.kol_id) : null,
      sku: String(item.sku),
      title: String(item.title),
      unitAmount: Number(item.unit_amount),
      quantity: Number(item.quantity),
      lineTotal: Number(item.line_total),
    })),
  }));
}

function mapKol(row: RecordValue): Kol {
 return { id: String(row.id), slug: String(row.slug), displayName: String(row.display_name), bio: String(row.bio ?? ""), status: row.status as Kol["status"] };
}
export async function getKols(): Promise<Kol[]> {
 if (!hasSupabaseConfig()) return demoKols;
 const {data,error} = await getSupabaseAdmin().from("kols").select("*").order("display_name");
 if(error) throw new Error(`Unable to load hosts: ${error.message}`);
 return (data as RecordValue[]).map(mapKol);
}
