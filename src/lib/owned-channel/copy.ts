import type { Locale } from "@/lib/i18n";

const en = {
  title: "Our live channel", eyebrow: "From our studio", live: "Live now", replay: "Latest replay",
  offline: "Between broadcasts", processing: "Preparing the replay", unavailable: "The channel is temporarily unavailable", disabled: "Our channel is being prepared",
  liveBody: "Join our own broadcast, then explore the collection at your own pace.",
  replayBody: "Catch up with our latest broadcast. The next live session will appear here automatically.",
  fallbackBody: "Please enjoy our other broadcasts while we prepare what comes next.",
  delay: "Live video has a short delay. Brief interruptions may take a moment to recover.",
  library: "Explore broadcasts", open: "Open our channel", retry: "Reload player", external: "Open video separately",
  adminTitle: "Owned channel status", adminBody: "Broadcasting is automatic. Only the owner should share the encoder key with authorised broadcasters. This console never displays streaming credentials.",
};
type Copy = { [K in keyof typeof en]: string };
const copies: Record<Locale, Copy> = {
  en,
  "zh-Hant": {
    title: "我們的直播頻道", eyebrow: "來自我們的直播室", live: "直播中", replay: "最新重播",
    offline: "期待下次相聚", processing: "正在準備重播", unavailable: "頻道暫時無法使用", disabled: "直播頻道籌備中",
    liveBody: "一起觀看我們的直播，再按自己的步調探索精選好物。",
    replayBody: "回看最新一期節目。下次直播開始時，這裡會自動更新。",
    fallbackBody: "在下一次相聚之前，歡迎欣賞其他精彩節目。",
    delay: "直播畫面略有延遲。短暫斷線後，恢復播放可能需要一點時間。",
    library: "探索節目", open: "進入直播頻道", retry: "重新載入播放器", external: "另開影片",
    adminTitle: "自有頻道狀態", adminBody: "直播會自動顯示。推流金鑰只應由負責人私下交給獲授權主播。此後台不會顯示直播憑證。",
  },
  "zh-Hans": {
    title: "我们的直播频道", eyebrow: "来自我们的直播室", live: "直播中", replay: "最新重播",
    offline: "期待下次相聚", processing: "正在准备重播", unavailable: "频道暂时无法使用", disabled: "直播频道筹备中",
    liveBody: "一起观看我们的直播，再按自己的步调探索精选好物。",
    replayBody: "回看最新一期节目。下次直播开始时，这里会自动更新。",
    fallbackBody: "在下一次相聚之前，欢迎欣赏其他精彩节目。",
    delay: "直播画面略有延迟。短暂断线后，恢复播放可能需要一点时间。",
    library: "探索节目", open: "进入直播频道", retry: "重新载入播放器", external: "另开视频",
    adminTitle: "自有频道状态", adminBody: "直播会自动显示。推流密钥只应由负责人私下交给获授权主播。此后台不会显示直播凭证。",
  },
  ja: {
    title: "私たちのライブチャンネル", eyebrow: "スタジオから", live: "ライブ配信中", replay: "最新のアーカイブ",
    offline: "次の配信をお楽しみに", processing: "アーカイブを準備しています", unavailable: "現在チャンネルをご利用いただけません", disabled: "チャンネルを準備しています",
    liveBody: "ライブを楽しみながら、ご自分のペースで商品をご覧ください。",
    replayBody: "最新の配信をもう一度。次のライブが始まると自動的に切り替わります。",
    fallbackBody: "次の配信まで、ほかの番組をお楽しみください。",
    delay: "ライブ映像には少し遅延があります。接続が途切れた場合、再開まで少し時間がかかることがあります。",
    library: "番組を見る", open: "チャンネルを見る", retry: "プレーヤーを再読み込み", external: "別の画面で開く",
    adminTitle: "自社チャンネルの状態", adminBody: "配信は自動で表示されます。配信キーは管理責任者から許可された配信者だけに安全に渡してください。この画面には配信の認証情報を表示しません。",
  },
};
export function ownedChannelCopy(locale: Locale) { return copies[locale]; }
