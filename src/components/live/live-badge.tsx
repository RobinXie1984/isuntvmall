import type { LiveStatus } from "@/types/commerce";

const labels: Record<LiveStatus, string> = { live: "LIVE · 直播", scheduled: "Upcoming · 预告", ended: "Replay · 回放", preview: "Demo room · 演示间" };

export function LiveBadge({ status }: { status: LiveStatus }) {
  return <span className={`live-badge ${status}`}>{status === "live" && <span />} {labels[status]}</span>;
}
