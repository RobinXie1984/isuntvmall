import { cartLineKey } from "@/lib/cart";
import type { CartLine } from "@/types/commerce";

export const CHECKOUT_ATTEMPT_STORAGE = "suntv-checkout-attempt-v1";
export const CHECKOUT_ATTEMPT_TTL = 40 * 60 * 1000;
export interface CheckoutAttempt { id: string; fingerprint: string; expiresAt: number }

// Stable across line ordering, but never across a quantity or source change.
export function cartFingerprint(items: CartLine[]) {
  return JSON.stringify(items.map(item => [cartLineKey(item), item.quantity]).sort((a, b) => String(a[0]).localeCompare(String(b[0]))));
}

// The server owns expiry. A local clock must never rotate an unchanged paid
// or unresolved attempt into another payable order. Only terminal server codes
// or an explicit cart change/completed-order clear permit a new identity.
export function checkoutAttempt(items: CartLine[], candidate: unknown, now: number, newId: () => string): CheckoutAttempt {
  const fingerprint = cartFingerprint(items);
  if (candidate && typeof candidate === "object") {
    const saved = candidate as Partial<CheckoutAttempt>;
    if (typeof saved.id === "string" && /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(saved.id)
      && saved.fingerprint === fingerprint && typeof saved.expiresAt === "number"
      && Number.isFinite(saved.expiresAt) && saved.expiresAt > 0) return saved as CheckoutAttempt;
  }
  return { id: newId(), fingerprint, expiresAt: now + CHECKOUT_ATTEMPT_TTL };
}

export function isClosedAttempt(code?: string) {
  return code === "CHECKOUT_ATTEMPT_EXPIRED" || code === "CHECKOUT_ATTEMPT_CLOSED" || code === "CHECKOUT_ATTEMPT_CHANGED";
}
