import { getStoreProfile } from "@/lib/store-profile";
import type { PublicLiveState } from "./public-state";
import type { Product } from "@/types/commerce";
/** Apply deployment-specific visibility after the SQL public-room boundary. */
export function visiblePublicLiveRoom(value: unknown): PublicLiveState | null {
 if (!value || typeof value !== "object") return null;
 const room = value as Record<string, unknown>;
 if (typeof room.id !== "string" || !["scheduled", "live", "ended"].includes(String(room.status)) || !Array.isArray(room.products)) return null;
 const excluded = new Set(getStoreProfile().excludedProductIds);
 // The SQL RPC intentionally exposes only approved, non-demo products. Keep
 // that promise and apply profile exclusions before returning a polling result.
 const products = room.products.filter((item): item is Product => Boolean(item) && typeof item === "object" && typeof item.id === "string" && item.status === "published" && item.isDemo === false && !excluded.has(item.id));
 return { ...room, products, pinnedProductId: products.some(item => item.id === room.pinnedProductId) ? room.pinnedProductId : null } as PublicLiveState;
}
