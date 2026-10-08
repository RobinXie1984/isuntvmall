import type { Locale } from "@/lib/i18n";

const en = {
  introduction: "A closer look", introductionBody: "Meet the ideas, people and everyday details behind our selection.",
  heading: "Watch & discover", eyebrow: "Stories, live & on replay", description: "Take your time with our broadcasts. Discover the details, then explore the products at your own pace.",
  all: "View all broadcasts", watch: "Watch broadcast", back: "All broadcasts", replay: "Replay", live: "Live", scheduled: "Upcoming",
  fallback: "If playback is unavailable here, open the video on its original platform. Availability may depend on the creator’s settings or your sign-in.",
  externalOnly: "This broadcast opens on its original platform.", onYouTube: "Watch on YouTube", onFacebook: "Watch on Facebook",
  platform: "Platform", status: "Broadcast", everyPlatform: "All platforms", everyStatus: "All broadcasts", apply: "Apply filters", empty: "No broadcasts match these filters. Please check back soon.",
  products: "From this broadcast", productBroadcasts: "See it in a broadcast", noProducts: "Enjoy the broadcast. No products are linked to this video yet.",
  rooms: "Explore our sample shopping rooms", thumbnail: "Video", browseProducts: "Explore all products", introductionLink: "Meet our selection",
};
type Copy = typeof en;
const copy: Record<Locale, Copy> = {
  en,
  "zh-Hant": {
    introduction: "細看日常", introductionBody: "認識精選背後的想法、人物與日常細節。",
    heading: "觀看與探索", eyebrow: "直播與精彩回放", description: "慢慢欣賞每場節目，了解商品細節，再挑選心儀好物。",
    all: "查看全部節目", watch: "觀看節目", back: "全部節目", replay: "回放", live: "直播中", scheduled: "即將播出",
    fallback: "若無法在此播放，請前往原平台觀看。播放可能受創作者設定或登入狀態影響。",
    externalOnly: "此節目將於原平台開啟。", onYouTube: "前往 YouTube 觀看", onFacebook: "前往 Facebook 觀看",
    platform: "平台", status: "節目類型", everyPlatform: "全部平台", everyStatus: "全部節目", apply: "套用篩選", empty: "暫無符合篩選條件的節目，請稍後再來。",
    products: "本場精選", productBroadcasts: "在節目中了解這件好物", noProducts: "歡迎欣賞節目，此影片尚未連結商品。",
    rooms: "探索示範購物直播間", thumbnail: "影片", browseProducts: "探索全部商品", introductionLink: "認識我們的精選",
  },
  "zh-Hans": {
    introduction: "细看日常", introductionBody: "认识精选背后的想法、人物与日常细节。",
    heading: "观看与探索", eyebrow: "直播与精彩回放", description: "慢慢欣赏每场节目，了解商品细节，再挑选心仪好物。",
    all: "查看全部节目", watch: "观看节目", back: "全部节目", replay: "回放", live: "直播中", scheduled: "即将播出",
    fallback: "若无法在此播放，请前往原平台观看。播放可能受创作者设置或登录状态影响。",
    externalOnly: "此节目将于原平台打开。", onYouTube: "前往 YouTube 观看", onFacebook: "前往 Facebook 观看",
    platform: "平台", status: "节目类型", everyPlatform: "全部平台", everyStatus: "全部节目", apply: "应用筛选", empty: "暂无符合筛选条件的节目，请稍后再来。",
    products: "本场精选", productBroadcasts: "在节目中了解这件好物", noProducts: "欢迎欣赏节目，此视频尚未关联商品。",
    rooms: "探索示范购物直播间", thumbnail: "视频", browseProducts: "探索全部商品", introductionLink: "认识我们的精选",
  },
  ja: {
    introduction: "日常を、もう少し近くで", introductionBody: "私たちのセレクションに込めた想いや、人と暮らしの物語をご覧ください。",
    heading: "動画で見つける", eyebrow: "ライブとアーカイブ", description: "配信をゆっくり楽しみながら、商品の細部を知り、お気に入りを見つけてください。",
    all: "すべての配信を見る", watch: "配信を見る", back: "配信一覧", replay: "アーカイブ", live: "配信中", scheduled: "配信予定",
    fallback: "ここで再生できない場合は、配信元でご覧ください。投稿者の設定やログイン状況により再生できないことがあります。",
    externalOnly: "この配信は配信元のサイトで開きます。", onYouTube: "YouTubeで見る", onFacebook: "Facebookで見る",
    platform: "配信元", status: "配信の種類", everyPlatform: "すべての配信元", everyStatus: "すべての配信", apply: "絞り込む", empty: "条件に合う配信はありません。後ほどご確認ください。",
    products: "この配信で紹介した商品", productBroadcasts: "この商品を動画で見る", noProducts: "配信をお楽しみください。この動画にはまだ商品が登録されていません。",
    rooms: "サンプルのショッピングルームを見る", thumbnail: "動画", browseProducts: "すべての商品を見る", introductionLink: "セレクションについて",
  },
};
export function broadcastCopy(locale: Locale): Copy { return copy[locale]; }
