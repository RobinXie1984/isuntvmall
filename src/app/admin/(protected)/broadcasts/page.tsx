import { requireAdminPage } from "@/lib/admin-auth";
import { getBroadcasts } from "@/lib/broadcasts/store";
import { getProducts } from "@/lib/data/store";
import { BroadcastWorkspace } from "@/components/admin/broadcast-workspace";
export const dynamic = "force-dynamic";
export default async function BroadcastAdminPage() {
  await requireAdminPage("live.publish");
  const [broadcasts, products] = await Promise.all([getBroadcasts(true),getProducts()]);
  return <BroadcastWorkspace initial={broadcasts} products={products}/>;
}
