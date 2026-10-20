import Link from "next/link";
import { requireAdminPage } from "@/lib/admin-auth";
import { getLocale } from "@/lib/locale-server";
import { getOwnedChannel } from "@/lib/owned-channel/server";
import { ownedChannelCopy } from "@/lib/owned-channel/copy";
export const dynamic = "force-dynamic";
export default async function ChannelAdminPage() {
  await requireAdminPage("live.publish");
  const [{ locale }, value] = await Promise.all([getLocale(), getOwnedChannel()]);
  const copy = ownedChannelCopy(locale);
  return <section className="page-space"><h2>{copy.adminTitle}</h2><p>{copy.adminBody}</p><p role="status">{copy[value.state]}</p><Link href="/channel" className="text-link">{copy.open} →</Link></section>;
}
