import "server-only";
import { hasSupabaseConfig } from "@/lib/env";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { broadcastPayloadSchema, type Broadcast } from "./contracts";

export async function getBroadcasts(includeHidden = false): Promise<Broadcast[]> {
  if (!hasSupabaseConfig()) return [];
  const { data, error } = await getSupabaseAdmin().from("storefront_broadcasts").select("id,payload,revision").order("created_at").limit(500);
  if (error) throw new Error("BROADCAST_READ_FAILED");
  return (data ?? []).map(row => ({ ...broadcastPayloadSchema.parse(row.payload), id: String(row.id), revision: Number(row.revision) }))
    .filter(b => includeHidden || b.visible).sort((a,b) => a.position-b.position || a.id.localeCompare(b.id));
}
export async function getBroadcastById(id: string) { return (await getBroadcasts()).find(b => b.id === id) ?? null; }
export async function getBroadcastsForProduct(productId: string) { return (await getBroadcasts()).filter(b => b.productIds.includes(productId)); }
