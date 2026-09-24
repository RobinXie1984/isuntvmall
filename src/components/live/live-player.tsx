"use client";

import { buildLiveEmbed } from "@/lib/live/adapters";
import { useLocale } from "@/components/i18n/locale-provider";
import type { LiveSession } from "@/types/commerce";

export function LivePlayer({ session }: { session: LiveSession }) {
  const { t, localize } = useLocale();
  if (session.status === "preview" && session.platform !== "youtube") return <div className="video-fallback" style={{backgroundImage:"url(/editorial/everyday.jpg)"}}><div><span className="eyebrow">{t("DEMO ROOM", "示範直播間")}</span><h2>{localize(session.title)}</h2><p>{t("No broadcast is connected. Explore the room’s sample products.", "尚未接入正式直播，可體驗本場示範商品。")}</p><p>{session.platform === "instagram" ? t("Instagram LIVE opens on Instagram.", "直播將在官方平台開啟。") : t("A verified public broadcast is required for playback.", "播放前須先驗證公開直播。")}</p></div></div>;
  const embed = buildLiveEmbed(session.platform, session.externalUrl, session.embedId);
  if (embed.kind === "iframe") {
    return (
      <div>{session.status === "preview" && <p className="player-caption">{t("Player example — not a live broadcast", "播放器示範，並非即時直播")}</p>}<div className="video-frame">
        <iframe
          src={embed.src}
          title={localize(embed.title)}
          allow={embed.allow}
          allowFullScreen
          referrerPolicy="strict-origin-when-cross-origin"
        />
      </div></div>
    );
  }

  return (
    <div className="video-fallback" style={session.posterUrl ? { backgroundImage: `url(${session.posterUrl})` } : undefined}>
      <div><span className="eyebrow">{t(`WATCH ON ${session.platform.toUpperCase()}`, "於官方平台觀看")}</span><h2>{localize(session.title)}</h2><p>{localize(embed.reason)}</p>
        <a className="button" href={embed.href} target="_blank" rel="noopener noreferrer">{t("Watch on the official platform ↗", "前往官方平台觀看 ↗")}</a>
      </div>
    </div>
  );
}
