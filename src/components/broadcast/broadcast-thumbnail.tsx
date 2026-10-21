"use client";
import { useState } from "react";
import type { ThumbnailPresentation } from "@/lib/broadcasts/thumbnails";

export function BroadcastThumbnail({ src, platform, width, height, cropTop = 0 }: ThumbnailPresentation & { platform: "youtube" | "facebook" }) {
  const [failed, setFailed] = useState(false);
  if (src && !failed) {
    if (width && height) return <span className="broadcast-curated"><span className="broadcast-curated-frame" style={{ aspectRatio: `${width}/${height - cropTop}` }}>
      <img src={src} alt="" loading="lazy" style={{ transform: `translateY(-${cropTop / height * 100}%)` }} onError={() => setFailed(true)} />
    </span></span>;
    return <img src={src} alt="" loading="lazy" onError={() => setFailed(true)} />;
  }
  return <span className="broadcast-neutral"><span aria-hidden="true">▷</span><span>{platform === "youtube" ? "YouTube" : "KOL"}</span></span>;
}
