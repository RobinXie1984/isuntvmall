import Link from "next/link";
import { getLocale } from "@/lib/locale-server";
import { ownedChannelCopy } from "@/lib/owned-channel/copy";
import { requireAdminPage } from "@/lib/admin-auth";
import { getBroadcasts } from "@/lib/broadcasts/store";
import { getProducts } from "@/lib/data/store";
import { BroadcastWorkspace } from "@/components/admin/broadcast-workspace";
export const dynamic = "force-dynamic";
export default async function BroadcastAdminPage() {
  await requireAdminPage("live.publish");
  const [broadcasts, products] = await Promise.all([getBroadcasts(true),getProducts()]);
  const { locale } = await getLocale();
  return <><Link className="text-link" href="/admin/channel">{ownedChannelCopy(locale).adminTitle} →</Link><BroadcastWorkspace initial={broadcasts} products={products}/></>;
}
