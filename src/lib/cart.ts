import { z } from "zod";
import type { CartLine, LiveSession } from "@/types/commerce";

const sourceSchema = z.object({ liveSessionId: z.uuid(), kolId: z.uuid() }).strict();
export const cartLineSchema = z.object({ productId: z.uuid(), quantity: z.number().int().min(1).max(10), source: sourceSchema.optional() }).strict();
export const checkoutInputSchema = z.object({ checkoutAttemptId: z.uuid(), items: z.array(cartLineSchema).min(1).max(20) }).strict();
export function cartLineKey(line: Pick<CartLine, "productId" | "source">) {
 return [line.productId, line.source?.liveSessionId ?? "direct", line.source?.kolId ?? "direct"].join(":");
}
export function parseStoredCart(value: unknown): CartLine[] {
 if (!Array.isArray(value)) return [];
 const result = new Map<string,CartLine>();
 for(const raw of value.slice(0,20)) {
  const parsed = cartLineSchema.safeParse(raw); if(!parsed.success) continue;
  const key=cartLineKey(parsed.data), previous=result.get(key);
  result.set(key,{...parsed.data,quantity:Math.min(10,(previous?.quantity ?? 0)+parsed.data.quantity)});
 }
 return [...result.values()];
}
// Reconstruct attribution from authoritative catalog relationships. Browser IDs
// are selectors, never proof of KOL affiliation or entitlement to commission.
export function validateAttribution(lines: CartLine[], sessions: LiveSession[]): CartLine[] {
 return lines.map(line => {
  if(!line.source) return { productId:line.productId, quantity:line.quantity };
  const session=sessions.find(s=>s.id===line.source?.liveSessionId);
  if(!session || session.status === "preview" || !session.kol || session.kol.status!=="active" || session.kol.id!==line.source.kolId || !session.products.some(p=>p.id===line.productId && p.status==="published")) {
   throw new Error("This product is no longer available from the selected host. Return to the room and select it again.");
  }
  return {...line,source:{liveSessionId:session.id,kolId:session.kol.id}};
 });
}
// Deliberately a code gate, not an environment switch. Remove only after a
// reservation-backed transaction and payment/webhook acceptance test exist.
export function checkoutReleaseReady(): boolean { return false; }
export const CHECKOUT_HOLD_REASON = "Preview only. Orders and payments are not open yet. 仅供预览，暂未开放下单与付款。";
export function assertCheckoutReleased() { if(!checkoutReleaseReady()) throw new Error(CHECKOUT_HOLD_REASON); }
