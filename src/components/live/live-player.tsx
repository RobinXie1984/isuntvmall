import { buildLiveEmbed } from "@/lib/live/adapters";
import type { LiveSession } from "@/types/commerce";

export function LivePlayer({ session }: { session: LiveSession }) {
  if (session.status === "preview" && session.platform !== "youtube") return <div className="video-fallback" style={session.posterUrl ? {backgroundImage:`url(${session.posterUrl})`} : undefined}><div><span className="eyebrow">DEMO ROOM / 演示直播间</span><h2>{session.title}</h2><p>No broadcast is connected. Explore the room’s sample products.<br/>尚未接入正式直播，可体验本场演示商品。</p><p>{session.platform === "instagram" ? "Instagram LIVE opens on Instagram. Instagram 直播将在原平台打开。" : "A verified public broadcast is required for playback. 播放需先验证公开直播。"}</p></div></div>;
  const embed = buildLiveEmbed(session.platform, session.externalUrl, session.embedId);
  if (embed.kind === "iframe") {
    return (
      <div>{session.status === "preview" && <p className="player-caption">Player example · 示例视频 — not a live broadcast / 非直播</p>}<div className="video-frame">
        <iframe
          src={embed.src}
          title={embed.title}
          allow={embed.allow}
          allowFullScreen
          referrerPolicy="strict-origin-when-cross-origin"
        />
      </div></div>
    );
  }

  return (
    <div className="video-fallback" style={session.posterUrl ? { backgroundImage: `url(${session.posterUrl})` } : undefined}>
      <div><span className="eyebrow">WATCH ON {session.platform.toUpperCase()}</span><h2>{session.title}</h2><p>{embed.reason}</p>
        <a className="button" href={embed.href} target="_blank" rel="noopener noreferrer">前往官方平台观看 ↗</a>
      </div>
    </div>
  );
}
