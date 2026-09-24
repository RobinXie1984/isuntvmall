import { describe, expect, it } from "vitest";
import { addCartLine } from "./cart-provider";
import type { CartLine } from "@/types/commerce";

const line = (index: number, quantity = 1): CartLine => ({
  productId: `70000000-0000-4000-8000-${String(index).padStart(12, "0")}`,
  quantity,
});

describe("cart addition feedback", () => {
  it("rejects a 21st line without changing the bag or claiming success", () => {
    const full = Array.from({ length: 20 }, (_, i) => line(i + 1));
    expect(addCartLine(full, line(21).productId)).toEqual({ items: full, result: "bag-limit" });
    expect(addCartLine(full, full[0].productId).result).toBe("added");
    expect(addCartLine(full, full[0].productId).items[0].quantity).toBe(2);
  });

  it("reports the quantity cap and leaves the quantity unchanged", () => {
    const fullQuantity = [line(1, 10)];
    expect(addCartLine(fullQuantity, fullQuantity[0].productId)).toEqual({ items: fullQuantity, result: "quantity-limit" });
    const nearLimit = [line(1, 9)];
    expect(addCartLine(nearLimit, nearLimit[0].productId, 2)).toEqual({ items: nearLimit, result: "quantity-limit" });
    expect(addCartLine(nearLimit, nearLimit[0].productId).items[0].quantity).toBe(10);
  });

  it("keeps attribution distinct and counts each room line toward the bag limit", () => {
    const original = [line(1)];
    const source = { liveSessionId: line(30).productId, kolId: line(31).productId };
    const next = addCartLine(original, original[0].productId, 1, source);
    expect(next.result).toBe("added");
    expect(next.items).toEqual([original[0], { ...original[0], source }]);
    expect(original).toHaveLength(1);
  });

  it("never claims to add invalid or excessive quantities", () => {
    for (const quantity of [0, -1, 1.5, NaN]) {
      expect(addCartLine([], line(1).productId, quantity)).toEqual({ items: [], result: "invalid" });
    }
    expect(addCartLine([], line(1).productId, 11)).toEqual({ items: [], result: "quantity-limit" });
  });
});
