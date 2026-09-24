import {getLocale} from "@/lib/locale-server";
import { CartPageClient } from "@/components/cart/cart-page-client";
import { getProducts, getLiveSessions } from "@/lib/data/store";
import { checkoutReleaseReady } from "@/lib/cart";

export const dynamic = "force-dynamic";
export async function generateMetadata(){const {t}=await getLocale();return {title:t("Shopping bag","購物袋"),robots:{index:false,follow:false}};}

export default async function CartPage({searchParams}: {searchParams: Promise<{checkout?:string;attempt?:string}>}) {
  const query = await searchParams;
  const cancelledAttemptId = query.checkout === "cancelled" && typeof query.attempt === "string" && /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(query.attempt) ? query.attempt : undefined;
  return <div className="shell page-space"><CartPageClient products={await getProducts()} sessions={await getLiveSessions()} checkoutReady={checkoutReleaseReady()} cancelledAttemptId={cancelledAttemptId} /></div>;
}
