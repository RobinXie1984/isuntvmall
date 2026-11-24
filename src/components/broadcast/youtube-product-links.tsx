import type { StoreLocale } from "@/lib/store-profile";
import { broadcastEmbed } from "@/lib/broadcasts/contracts";
import { youtubeProductGroups, youtubeProductCopy, youtubeProductUrl } from "@/lib/broadcasts/youtube-products";
import "./broadcast.css";

export function YouTubeProductLinks({ locale, brand }: { locale: StoreLocale; brand?: string }) {
  const groups = youtubeProductGroups(brand);
  const copy = youtubeProductCopy(locale);
  if (!groups.length) return null;

  const list = (
    <div className="youtube-product-groups">
      {groups.map(group => {
        const name = group.key === "wool-shawls" ? copy.shawls : group.key;
        return (
          <div key={group.key} id={brand ? undefined : `youtube-originals-${group.key.toLowerCase()}`} className="youtube-product-group">
            <h3>{name}</h3>
            {group.key === "wool-shawls" && <p>{copy.unknown}</p>}
            <ul>
              {group.videos.map(video => {
                const href = youtubeProductUrl(video.videoId);
                const player = brand ? null : broadcastEmbed(href).src;
                const label = video.label[locale];
                return (
                  <li key={video.videoId}>
                    {player && (
                      <div className="youtube-original-frame">
                        <iframe src={player} title={`${name} · ${label}`} loading="lazy"
                          allow="encrypted-media; picture-in-picture" allowFullScreen
                          referrerPolicy="strict-origin-when-cross-origin" />
                      </div>
                    )}
                    <a href={href} target="_blank" rel="noopener noreferrer" aria-label={`${name} · ${label} · ${copy.watch}`}>
                      <span>{label}</span>
                      <span className="youtube-original-fallback">{player && copy.watch} <span aria-hidden="true">↗</span></span>
                    </a>
                  </li>
                );
              })}
            </ul>
          </div>
        );
      })}
    </div>
  );

  return brand ? (
    <details className="youtube-brand-links">
      <summary>{copy.heading} · {brand} ({groups[0].videos.length})</summary>
      {list}
    </details>
  ) : (
    <section className="youtube-product-links" aria-labelledby="youtube-products-heading">
      <h2 id="youtube-products-heading">{copy.heading}</h2>
      <p>{copy.description}</p>
      {list}
    </section>
  );
}
