import { CartPageClient } from "@/components/cart/cart-page-client";
import { getProducts, getLiveSessions } from "@/lib/data/store";
import { checkoutReleaseReady } from "@/lib/cart";

export const dynamic = "force-dynamic";
export const metadata = { title: "购物车" };

export default async function CartPage() {
  return <div className="shell page-space"><CartPageClient products={await getProducts()} sessions={await getLiveSessions()} checkoutReady={checkoutReleaseReady()} /></div>;
}
