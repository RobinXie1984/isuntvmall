"use client";

import type { LiveStatus } from "@/types/commerce";
import { useLocale } from "@/components/i18n/locale-provider";

const labels: Record<LiveStatus, readonly [string, string]> = { live: ["LIVE", "直播中"], scheduled: ["Upcoming", "即將開始"], ended: ["Replay", "重溫"], preview: ["Demo room", "示範直播間"] };

export function LiveBadge({ status }: { status: LiveStatus }) {
  const { t } = useLocale();
  return <span className={`live-badge ${status}`}>{status === "live" && <span />} {t(...labels[status])}</span>;
}
