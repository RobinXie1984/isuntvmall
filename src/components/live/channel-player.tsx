"use client";
import Script from "next/script";
import { useEffect, useRef, useState } from "react";
import { attachRecovery, type StreamPlayer } from "@/lib/owned-channel/recovery";
import type { ChannelSnapshot } from "@/lib/owned-channel/contracts";
import type { Locale } from "@/lib/i18n";
import { ownedChannelCopy } from "@/lib/owned-channel/copy";

export function ChannelPlayer({ value, locale }: { value: ChannelSnapshot; locale: Locale }) {
  const frame = useRef<HTMLIFrameElement>(null);
  const [sdkReady, setSdkReady] = useState(false);
  const [reload, setReload] = useState({ revision: 0, resume: false });
  const revision = reload.revision;
  const budget = useRef({ remaining: 3 });
  const resume = useRef(false);
  const copy = ownedChannelCopy(locale);
  useEffect(() => {
    const Stream = (window as unknown as { Stream?: (element: HTMLIFrameElement) => StreamPlayer }).Stream;
    if (!sdkReady || !frame.current || !Stream || value.state !== "live") return;
    const player = Stream(frame.current);
    const playing = () => { resume.current = true; };
    const paused = () => { resume.current = false; };
    player.addEventListener("playing", playing);
    player.addEventListener("pause", paused);
    const cleanup = attachRecovery(player, () => setReload(value => ({ revision: value.revision + 1, resume: resume.current })), budget.current, () => !document.hidden);
    return () => { cleanup(); player.removeEventListener("playing", playing); player.removeEventListener("pause", paused); };
  }, [sdkReady, revision, value.state]);
  if (!value.playerUrl) return null;
  // A viewer who had started playback can recover muted without a second gesture.
  // Initial playback always requires a click; no unsolicited autoplay sound.
  const src = reload.resume ? value.playerUrl.replace("autoplay=false", "autoplay=true&muted=true") : value.playerUrl;
  return <div className="owned-channel-player">
    <Script src="https://embed.cloudflarestream.com/embed/sdk.latest.js" onReady={() => setSdkReady(true)} />
    <div className="owned-channel-frame"><iframe ref={frame} key={revision} src={src} title={copy.title} allow="autoplay; encrypted-media; picture-in-picture; fullscreen" allowFullScreen referrerPolicy="strict-origin-when-cross-origin" /></div>
    <div className="owned-channel-actions"><button type="button" className="text-link" onClick={() => { budget.current.remaining = 3; setReload(value => ({ revision: value.revision + 1, resume: resume.current })); }}>{copy.retry}</button><a className="text-link" href={value.playerUrl.replace("/iframe?autoplay=false", "/watch")} target="_blank" rel="noopener noreferrer">{copy.external} ↗</a></div>
    {value.state === "live" && <p className="owned-channel-note">{copy.delay}</p>}
  </div>;
}
