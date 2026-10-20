"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type { Locale } from "@/lib/i18n";
import { emptyChannel, type ChannelSnapshot } from "@/lib/owned-channel/contracts";
import { ownedChannelCopy } from "@/lib/owned-channel/copy";
import { pollChannel } from "@/lib/owned-channel/poll";
import { ChannelPlayer } from "./channel-player";
import "./owned-channel.css";

export function ChannelView({ value, locale, home = false }: { value: ChannelSnapshot; locale: Locale; home?: boolean }) {
  const copy = ownedChannelCopy(locale);
  if (home && value.state === "disabled") return null;
  const playable = value.state === "live" || value.state === "replay";
  const prominent = !home || value.state === "live";
  return <section className={`owned-channel ${home ? "shell" : ""} ${prominent ? "owned-channel-featured" : "owned-channel-quiet"}`} aria-label={copy.title} data-channel-state={value.state}>
    <div className="owned-channel-copy">
      <span className="eyebrow">{copy.eyebrow}</span>
      <p className={`owned-channel-status ${value.state === "live" ? "is-live" : ""}`} role="status">{copy[value.state]}</p>
      <h2>{copy.title}</h2>
      <p>{value.state === "live" ? copy.liveBody : value.state === "replay" ? copy.replayBody : copy.fallbackBody}</p>
      <Link href={home ? "/channel" : "/watch"} className="text-link">{home ? copy.open : copy.library} →</Link>
    </div>
    {playable && value.playerUrl && prominent ? <ChannelPlayer key={`${value.videoId}/${value.state}`} value={value} locale={locale} /> : prominent && <div className="owned-channel-placeholder"><span aria-hidden="true">▷</span><p>{copy[value.state]}</p><Link href="/watch" className="text-link">{copy.library} →</Link></div>}
  </section>;
}
export function OwnedChannel({ initial, locale, home = false }: { initial?: ChannelSnapshot; locale: Locale; home?: boolean }) {
  const [value, setValue] = useState(initial ?? emptyChannel("disabled"));
  useEffect(() => pollChannel(setValue, {
    fetch: window.fetch.bind(window), visible: () => !document.hidden,
    schedule: setTimeout, cancel: clearTimeout, now: Date.now,
  }), []);
  return <ChannelView value={value} locale={locale} home={home} />;
}
