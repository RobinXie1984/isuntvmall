import type { Metadata } from "next";
import { getLocale } from "@/lib/locale-server";
import { getOwnedChannel } from "@/lib/owned-channel/server";
import { ownedChannelCopy } from "@/lib/owned-channel/copy";
import { OwnedChannel } from "@/components/live/owned-channel";
export const dynamic = "force-dynamic";
export async function generateMetadata(): Promise<Metadata> {
  const { locale } = await getLocale();
  return { title: ownedChannelCopy(locale).title };
}
export default async function ChannelPage() {
  const [{ locale }, initial] = await Promise.all([getLocale(), getOwnedChannel()]);
  return <div className="shell page-space"><h1>{ownedChannelCopy(locale).title}</h1><OwnedChannel initial={initial} locale={locale} /></div>;
}
