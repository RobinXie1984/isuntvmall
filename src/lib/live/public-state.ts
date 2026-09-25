import type { Product } from "@/types/commerce";
export type PublicLiveState = { id: string; revision: number; status: "scheduled" | "live" | "ended"; kolId: string; externalUrl: string; platform: string; embedId: string | null; playbackMode: "embedded" | "external_link"; pinnedProductId: string | null; products: Product[] };
/** A slow older poll must never undo a newer pin or rail publication. */
export function acceptLiveState(current: PublicLiveState | null, incoming: PublicLiveState, expectedRoom: string) {
  return incoming.id === expectedRoom && Number.isSafeInteger(incoming.revision) && incoming.revision > 0 && (!current || incoming.revision >= current.revision) ? incoming : current;
}
