import { expandedTranslations } from "./data/expanded-catalogue";

export type Locale = "en" | "zh-Hant";
export const LOCALE_COOKIE = "isuntvmall-locale";
export function parseLocale(value: string | undefined | null): Locale {
  return value === "zh-Hant" ? "zh-Hant" : "en";
}

// Exact editorial translations for the sample catalogue. Never split or
// heuristically rewrite merchant-authored content.
const translations: Record<string, readonly [string, string]> = {
  ...expandedTranslations,
  "Cotton tee · 纯棉 T恤": ["Cotton tee", "純棉上衣"],
  "轻盈亲肤的 200 支纯棉男士 T 恤，镜头前后都利落。": ["A light, soft cotton tee for everyday comfort, on camera and off.", "輕盈親膚的純棉上衣，鏡頭前後都俐落舒適。"],
  "阳光白色纯棉 T 恤": ["White cotton tee", "白色純棉上衣"],
  "Travel shirt · 旅行衬衫": ["Travel shirt", "旅行襯衫"],
  "为跨城、跨境和直播日程设计的免烫衬衫。": ["An easy-care shirt for city days, travel and busy schedules.", "專為城市日常、旅行與繁忙行程設計的免熨襯衫。"],
  "深蓝免烫旅行衬衫": ["Navy easy-care travel shirt", "深藍免熨旅行襯衫"],
  "Pocket fan · 随身风扇": ["Pocket fan", "隨身風扇"],
  "三档静音风力，USB-C 充电，轻装出门。": ["Three quiet speeds and USB-C charging for days on the go.", "三段靜音風力，充電方便，輕裝出門。"],
  "蓝色随身小风扇": ["Portable fan", "便攜風扇"],
  "Tea gift · 茶礼": ["Tea gift", "茶葉禮盒"],
  "适合拜访与节庆的精选茶叶礼盒。": ["A considered tea selection for visits, celebrations and quiet moments.", "適合拜訪、節慶與靜謐時光的精選茶葉禮盒。"],
  "金色东方茶礼盒": ["Tea gift box", "茶葉禮盒"],
  "City backpack · 轻行背包": ["City bag", "輕便提袋"],
  "适合一日差旅的防泼水轻量背包。": ["A lightweight bag for your daily journey.", "適合日常出行的輕便提袋。"],
  "深蓝城市轻行背包": ["Charcoal city bag", "炭灰輕便提袋"],
  "Wireless earbuds · 无线耳机": ["Wireless earbuds", "無線耳機"],
  "低延迟、清晰通话，日常与直播两用。": ["Clear calls and low latency for everyday listening and streaming.", "低延遲、清晰通話，適合日常聆聽與直播。"],
  "黑色无线耳机": ["Black wireless earbuds", "黑色無線耳機"],
  Apparel: ["Clothing", "服飾"], Lifestyle: ["Home & living", "生活用品"], Gifts: ["Gifts", "禮品"], Travel: ["Travel", "旅行用品"], Tech: ["Electronics", "電子用品"],
  "Style Studio · 穿搭演示": ["Style Studio", "穿搭體驗間"],
  "Home Studio · 生活演示": ["Home Studio", "生活體驗間"],
  "Travel Studio · 旅行演示": ["Travel Studio", "旅行體驗間"],
  "Fictional host / 虚构演示主播。Everyday clothing and thoughtful essentials.": ["A fictional host exploring everyday clothing and thoughtful essentials.", "虛構示範主播，與你探索日常服飾和實用好物。"],
  "Fictional host / 虚构演示主播。Small discoveries for life at home.": ["A fictional host sharing small discoveries for life at home.", "虛構示範主播，與你分享居家生活的小發現。"],
  "Fictional host / 虚构演示主播。Pack lighter, explore further.": ["A fictional host exploring how to pack lighter and travel further.", "虛構示範主播，與你一起輕裝出發，探索更遠。"],
  "Everyday, considered · 日常好物": ["Everyday, considered", "日常好物"],
  "A little more home · 生活小确幸": ["A little more home", "生活小確幸"],
  "Go somewhere good · 轻装出发": ["Go somewhere good", "輕裝出發"],
  "Explore a sample style room. The YouTube clip is a player demonstration, not a live shopping broadcast. 穿搭体验间，视频仅为播放器示例。": ["Explore a sample style room. The video demonstrates the player; it is not a live shopping broadcast.", "探索穿搭體驗間。影片僅供播放器示範，並非購物直播。"],
  "A second independent room with its own featured selection. Facebook playback requires a verified broadcast. 独立选品，正式直播待接入。": ["An independent room with its own featured selection. Playback awaits a verified broadcast.", "獨立直播間與專屬精選商品，正式直播尚待接入。"],
  "Instagram viewing opens on the official platform; this room keeps your product selection together. Instagram 原平台观看，商品在这里选购。": ["Watch on the official platform and keep your product selection together in this room.", "前往官方平台觀看，商品在此直播間選購。"],
  "Preview only. Orders and payments are not open yet. 仅供预览，暂未开放下单与付款。": ["Preview only. Orders and payments are not open yet.", "僅供預覽，暫未開放下單與付款。"],
  "直播链接无效": ["The broadcast link is invalid.", "直播連結無效。"],
  "Invalid Instagram URL / Instagram 网址无效": ["The Instagram link is invalid.", "直播平台連結無效。"],
  "Instagram viewing opens on the official platform. Instagram 直播请在官方平台观看。": ["Instagram viewing opens on the official platform.", "請前往官方平台觀看直播。"],
  "TikTok LIVE 将在官方应用或网页打开": ["TikTok LIVE opens in the official app or website.", "直播將在官方應用程式或網站開啟。"],
  "此平台不允许安全嵌入，请前往原平台观看": ["This platform cannot be embedded safely. Watch on the official platform.", "此平台無法安全嵌入，請前往原平台觀看。"],
  "YouTube livestream": ["YouTube livestream", "直播播放器"],
  "Facebook livestream": ["Facebook livestream", "直播播放器"],
  "TikTok video": ["TikTok video", "影片播放器"],
};

export function localize(value: string, locale: Locale): string {
  return translations[value]?.[locale === "en" ? 0 : 1] ?? value;
}
export function formatLocalizedMoney(amount: number, currency: string, locale: Locale): string {
  return new Intl.NumberFormat(locale === "en" ? "en-HK" : "zh-HK", { style: "currency", currency: currency.toUpperCase(), maximumFractionDigits: 2 }).format(amount / 100);
}
