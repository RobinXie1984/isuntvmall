import { describe, expect, it } from "vitest";
import { cartFingerprint, checkoutAttempt, CHECKOUT_ATTEMPT_TTL, isClosedAttempt } from "./checkout-attempt";

const id = "eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee";
const nextId = "ffffffff-ffff-4fff-8fff-ffffffffffff";
const items = [{ productId: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa", quantity: 1 }];

describe("checkout retry identity", () => {
  it("reuses an unexpired attempt after a failed network request or page reload", () => {
    const first = checkoutAttempt(items, null, 100, () => id);
    expect(checkoutAttempt(items, JSON.parse(JSON.stringify(first)), 200, () => nextId).id).toBe(id);
    expect(isClosedAttempt("CHECKOUT_RETRY")).toBe(false);
  });
  it("retains identity beyond local expiry but rotates for quantity or source changes", () => {
    const first = checkoutAttempt(items, null, 100, () => id);
    expect(checkoutAttempt(items, first, 100 + CHECKOUT_ATTEMPT_TTL, () => nextId).id).toBe(id);
    expect(checkoutAttempt([{ ...items[0], quantity: 2 }], first, 200, () => nextId).id).toBe(nextId);
    expect(checkoutAttempt([{ ...items[0], source: {liveSessionId:id,kolId:nextId} }], first, 200, () => nextId).id).toBe(nextId);
  });
  it("does not rotate for a harmless line reorder", () => {
    const two = [...items, { productId: id, quantity: 2 }];
    expect(cartFingerprint(two)).toBe(cartFingerprint([...two].reverse()));
  });
  it("rejects malformed persisted state and recognizes terminal attempts", () => {
    expect(checkoutAttempt(items, {id:"bad",fingerprint:cartFingerprint(items),expiresAt:300}, 200, () => id).id).toBe(id);
    expect(checkoutAttempt(items, {id:nextId,fingerprint:cartFingerprint(items),expiresAt:Infinity}, 200, () => id).id).toBe(id);
    for (const code of ["CHECKOUT_ATTEMPT_EXPIRED", "CHECKOUT_ATTEMPT_CLOSED", "CHECKOUT_ATTEMPT_CHANGED"]) expect(isClosedAttempt(code)).toBe(true);
  });
});
