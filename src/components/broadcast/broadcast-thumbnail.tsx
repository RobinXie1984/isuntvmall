"use client";
import { useState } from "react";

export function BroadcastThumbnail({ src, platform, facebookLabel = "Facebook" }: { src: string; platform: "youtube" | "facebook"; facebookLabel?: string }) {
  const [failed, setFailed] = useState(false);
  if (src && !failed) return <img src={src} alt="" loading="lazy" onError={() => setFailed(true)} />;
  return <span className="broadcast-neutral"><span aria-hidden="true">▷</span><span>{platform === "youtube" ? "YouTube" : facebookLabel}</span></span>;
}
