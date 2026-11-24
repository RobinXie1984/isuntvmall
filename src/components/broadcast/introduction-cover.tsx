"use client";

import { useState } from "react";
import type { Broadcast } from "@/lib/broadcasts/contracts";
import type { Locale } from "@/lib/i18n";
import { BroadcastPlayer } from "./broadcast-player";

const playLabel = {
  en: "Play introduction",
  "zh-Hant": "播放介紹影片",
  "zh-Hans": "播放介绍影片",
  ja: "紹介動画を再生",
};

export function IntroductionCover({ broadcast, locale }: { broadcast: Broadcast; locale: Locale }) {
  const [playing, setPlaying] = useState(false);
  if (playing) return <BroadcastPlayer broadcast={broadcast} locale={locale} priority autoPlay />;

  return (
    <button type="button" className="introduction-cover" onClick={() => setPlaying(true)}>
      <span className="introduction-cover-icon" aria-hidden="true">▶</span>
      <span>{playLabel[locale]}</span>
    </button>
  );
}
