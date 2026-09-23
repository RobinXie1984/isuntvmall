import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const migration = readFileSync(resolve(process.cwd(), "supabase/migrations/20260818082052_initial_commerce.sql"), "utf8").toLowerCase();

describe("Supabase migration contract", () => {
  it.each(["products", "product_images", "live_sessions", "live_products", "orders", "order_items"])("enables RLS on %s", (table) => {
    expect(migration).toContain(`alter table public.${table} enable row level security`);
  });

  it("keeps browser roles away from orders", () => {
    expect(migration).toContain("revoke all on table public.orders from anon, authenticated");
    expect(migration).toContain("revoke all on table public.order_items from anon, authenticated");
  });

  it("provides idempotent webhook fulfillment", () => {
    expect(migration).toContain("if v_status = 'paid'");
    expect(migration).toContain("greatest(0, product.stock_qty - item.quantity)");
  });
});
