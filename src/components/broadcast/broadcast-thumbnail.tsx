"use client";
import { useState } from "react";

export function BroadcastThumbnail({ src, platform }: { src: string; platform: "youtube" | "facebook" }) {
  const [failed, setFailed] = useState(false);
  if (src && !failed) return <img src={src} alt="" loading="lazy" onError={() => setFailed(true)} />;
  return <span className="broadcast-neutral"><span aria-hidden="true">▷</span><span>{platform === "youtube" ? "YouTube" : "Facebook"}</span></span>;
}
