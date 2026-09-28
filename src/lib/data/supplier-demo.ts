import type { Product } from "@/types/commerce";

// Sanitized public demo copy. No private source paths, supplier quotations or stock.
// All retail prices and quantities below are invented demonstration data.
export type SupplierDemoLocale = "en" | "zh-Hant" | "zh-Hans" | "ja";
export type SupplierDemoCopy = Record<SupplierDemoLocale, string>;
type SupplierDemoSample = {
  id: string; reference: string; slug: string; category: string;
  titles: SupplierDemoCopy; descriptions: SupplierDemoCopy;
  priceAmount: number; image: string;
};

const supplierDemoSamples: SupplierDemoSample[] = [
  {
    "id": "7f1426c5-b5b4-51ed-a107-2c4369e239f2",
    "reference": "CER-F001",
    "slug": "supplier-cer-f001",
    "category": "Tea & coffee",
    "titles": {
      "en": "Dongpo Tea Rhythm tea set",
      "zh-Hant": "東坡茶韻茶具套裝",
      "zh-Hans": "东坡茶韵茶具套装",
      "ja": "東坡茶韻 ティーセット"
    },
    "descriptions": {
      "en": "Make room for an unhurried tea or coffee break. Source-listed details: Contents require confirmation. Final specifications require confirmation. Demo item with an illustrative HKD retail price. Stock and availability are simulated; this is not a real offer for sale.",
      "zh-Hant": "留一點時間，從容享用茶與咖啡。 來源記載：組合內容待確認。 最終規格仍待確認。 示範商品，港幣售價僅供展示。庫存與供貨狀態均為模擬，並非實際銷售要約。",
      "zh-Hans": "留一点时间，从容享用茶与咖啡。 来源记载：组合内容待确认。 最终规格仍待确认。 示范商品，港币售价仅供展示。库存与供货状态均为模拟，并非实际销售要约。",
      "ja": "お茶やコーヒーをゆっくり楽しむひとときに。 資料に記載された仕様：セット内容は確認待ちです。 最終仕様は確認待ちです。 デモ商品です。香港ドルの価格は表示例です。在庫と販売状況は架空であり、実際の販売ではありません。"
    },
    "priceAmount": 49800,
    "image": "/products/supplier-demo/cer-f001.webp"
  },
  {
    "id": "19185a48-be76-584a-baef-0f6bbfc38e93",
    "reference": "CER-F003",
    "slug": "supplier-cer-f003",
    "category": "Tea & coffee",
    "titles": {
      "en": "Chen Nianhua tea infuser mug",
      "zh-Hant": "趁年華・品茗濾茶杯",
      "zh-Hans": "趁年华・品茗滤茶杯",
      "ja": "趁年華 茶こし付きマグ"
    },
    "descriptions": {
      "en": "Make room for an unhurried tea or coffee break. Source-listed details: Contents require confirmation. Final specifications require confirmation. Demo item with an illustrative HKD retail price. Stock and availability are simulated; this is not a real offer for sale.",
      "zh-Hant": "留一點時間，從容享用茶與咖啡。 來源記載：組合內容待確認。 最終規格仍待確認。 示範商品，港幣售價僅供展示。庫存與供貨狀態均為模擬，並非實際銷售要約。",
      "zh-Hans": "留一点时间，从容享用茶与咖啡。 来源记载：组合内容待确认。 最终规格仍待确认。 示范商品，港币售价仅供展示。库存与供货状态均为模拟，并非实际销售要约。",
      "ja": "お茶やコーヒーをゆっくり楽しむひとときに。 資料に記載された仕様：セット内容は確認待ちです。 最終仕様は確認待ちです。 デモ商品です。香港ドルの価格は表示例です。在庫と販売状況は架空であり、実際の販売ではありません。"
    },
    "priceAmount": 12800,
    "image": "/products/supplier-demo/cer-f003.webp"
  },
  {
    "id": "1dae70bc-3918-5ddf-abe4-a15089479c67",
    "reference": "CER-F004",
    "slug": "supplier-cer-f004",
    "category": "Tea & coffee",
    "titles": {
      "en": "Chen Nianhua cup and saucer",
      "zh-Hant": "趁年華・拾光杯碟",
      "zh-Hans": "趁年华・拾光杯碟",
      "ja": "趁年華 カップ＆ソーサー"
    },
    "descriptions": {
      "en": "Make room for an unhurried tea or coffee break. Source-listed details: Contents require confirmation. Final specifications require confirmation. Demo item with an illustrative HKD retail price. Stock and availability are simulated; this is not a real offer for sale.",
      "zh-Hant": "留一點時間，從容享用茶與咖啡。 來源記載：組合內容待確認。 最終規格仍待確認。 示範商品，港幣售價僅供展示。庫存與供貨狀態均為模擬，並非實際銷售要約。",
      "zh-Hans": "留一点时间，从容享用茶与咖啡。 来源记载：组合内容待确认。 最终规格仍待确认。 示范商品，港币售价仅供展示。库存与供货状态均为模拟，并非实际销售要约。",
      "ja": "お茶やコーヒーをゆっくり楽しむひとときに。 資料に記載された仕様：セット内容は確認待ちです。 最終仕様は確認待ちです。 デモ商品です。香港ドルの価格は表示例です。在庫と販売状況は架空であり、実際の販売ではありません。"
    },
    "priceAmount": 16800,
    "image": "/products/supplier-demo/cer-f004.webp"
  },
  {
    "id": "5c74ecdb-f054-56d3-968d-631c8577668a",
    "reference": "CER-F005",
    "slug": "supplier-cer-f005",
    "category": "Tea & coffee",
    "titles": {
      "en": "Chen Nianhua teapot",
      "zh-Hant": "趁年華・觀月茶器",
      "zh-Hans": "趁年华・观月茶器",
      "ja": "趁年華 ティーポット"
    },
    "descriptions": {
      "en": "Make room for an unhurried tea or coffee break. Source-listed details: Contents require confirmation. Final specifications require confirmation. Demo item with an illustrative HKD retail price. Stock and availability are simulated; this is not a real offer for sale.",
      "zh-Hant": "留一點時間，從容享用茶與咖啡。 來源記載：組合內容待確認。 最終規格仍待確認。 示範商品，港幣售價僅供展示。庫存與供貨狀態均為模擬，並非實際銷售要約。",
      "zh-Hans": "留一点时间，从容享用茶与咖啡。 来源记载：组合内容待确认。 最终规格仍待确认。 示范商品，港币售价仅供展示。库存与供货状态均为模拟，并非实际销售要约。",
      "ja": "お茶やコーヒーをゆっくり楽しむひとときに。 資料に記載された仕様：セット内容は確認待ちです。 最終仕様は確認待ちです。 デモ商品です。香港ドルの価格は表示例です。在庫と販売状況は架空であり、実際の販売ではありません。"
    },
    "priceAmount": 22800,
    "image": "/products/supplier-demo/cer-f005.webp"
  },
  {
    "id": "59f511d1-6cfc-5f62-871b-31c4de3b63df",
    "reference": "CER-F006",
    "slug": "supplier-cer-f006",
    "category": "Tea & coffee",
    "titles": {
      "en": "Chen Nianhua travel tea set",
      "zh-Hant": "趁年華・雅敘旅行茶具",
      "zh-Hans": "趁年华・雅叙旅行茶具",
      "ja": "趁年華 携帯用ティーセット"
    },
    "descriptions": {
      "en": "Make room for an unhurried tea or coffee break. Source-listed details: Contents require confirmation. Final specifications require confirmation. Demo item with an illustrative HKD retail price. Stock and availability are simulated; this is not a real offer for sale.",
      "zh-Hant": "留一點時間，從容享用茶與咖啡。 來源記載：組合內容待確認。 最終規格仍待確認。 示範商品，港幣售價僅供展示。庫存與供貨狀態均為模擬，並非實際銷售要約。",
      "zh-Hans": "留一点时间，从容享用茶与咖啡。 来源记载：组合内容待确认。 最终规格仍待确认。 示范商品，港币售价仅供展示。库存与供货状态均为模拟，并非实际销售要约。",
      "ja": "お茶やコーヒーをゆっくり楽しむひとときに。 資料に記載された仕様：セット内容は確認待ちです。 最終仕様は確認待ちです。 デモ商品です。香港ドルの価格は表示例です。在庫と販売状況は架空であり、実際の販売ではありません。"
    },
    "priceAmount": 36800,
    "image": "/products/supplier-demo/cer-f006.webp"
  },
  {
    "id": "ba04f279-64d2-5e20-a4aa-b5b1bd8a0b25",
    "reference": "CER-F007",
    "slug": "supplier-cer-f007",
    "category": "Tea & coffee",
    "titles": {
      "en": "Chen Nianhua tea service",
      "zh-Hant": "趁年華・雅宴茶具",
      "zh-Hans": "趁年华・雅宴茶具",
      "ja": "趁年華 ティーサービス"
    },
    "descriptions": {
      "en": "Make room for an unhurried tea or coffee break. Source-listed details: Contents require confirmation. Final specifications require confirmation. Demo item with an illustrative HKD retail price. Stock and availability are simulated; this is not a real offer for sale.",
      "zh-Hant": "留一點時間，從容享用茶與咖啡。 來源記載：組合內容待確認。 最終規格仍待確認。 示範商品，港幣售價僅供展示。庫存與供貨狀態均為模擬，並非實際銷售要約。",
      "zh-Hans": "留一点时间，从容享用茶与咖啡。 来源记载：组合内容待确认。 最终规格仍待确认。 示范商品，港币售价仅供展示。库存与供货状态均为模拟，并非实际销售要约。",
      "ja": "お茶やコーヒーをゆっくり楽しむひとときに。 資料に記載された仕様：セット内容は確認待ちです。 最終仕様は確認待ちです。 デモ商品です。香港ドルの価格は表示例です。在庫と販売状況は架空であり、実際の販売ではありません。"
    },
    "priceAmount": 49800,
    "image": "/products/supplier-demo/cer-f007.webp"
  },
  {
    "id": "a8aadba4-56d5-5753-b923-3ea1484b867f",
    "reference": "CER-F008",
    "slug": "supplier-cer-f008",
    "category": "Tableware",
    "titles": {
      "en": "Starry celadon bowl and chopstick set — 10 pieces",
      "zh-Hant": "星空青瓷碗筷十件套",
      "zh-Hans": "星空青瓷碗筷十件套",
      "ja": "星空青磁 ボウル＆箸セット・10点"
    },
    "descriptions": {
      "en": "A considered setting for shared meals. Source-listed details: 10 pieces. Final specifications require confirmation. Demo item with an illustrative HKD retail price. Stock and availability are simulated; this is not a real offer for sale.",
      "zh-Hant": "用心安排餐桌，分享每一餐。 來源記載：10 件。 最終規格仍待確認。 示範商品，港幣售價僅供展示。庫存與供貨狀態均為模擬，並非實際銷售要約。",
      "zh-Hans": "用心安排餐桌，分享每一餐。 来源记载：10 件。 最终规格仍待确认。 示范商品，港币售价仅供展示。库存与供货状态均为模拟，并非实际销售要约。",
      "ja": "日々の食卓を丁寧に整える一品。 資料に記載された仕様：10点。 最終仕様は確認待ちです。 デモ商品です。香港ドルの価格は表示例です。在庫と販売状況は架空であり、実際の販売ではありません。"
    },
    "priceAmount": 39800,
    "image": "/products/supplier-demo/cer-f008.webp"
  },
  {
    "id": "9bac8679-4a1c-55d7-a457-fb0cfdbfdb2d",
    "reference": "CER-F009",
    "slug": "supplier-cer-f009",
    "category": "Tableware",
    "titles": {
      "en": "Starry celadon bowl and chopstick set — 16 pieces",
      "zh-Hant": "星空青瓷碗筷十六件套",
      "zh-Hans": "星空青瓷碗筷十六件套",
      "ja": "星空青磁 ボウル＆箸セット・16点"
    },
    "descriptions": {
      "en": "A considered setting for shared meals. Source-listed details: 16 pieces. Final specifications require confirmation. Demo item with an illustrative HKD retail price. Stock and availability are simulated; this is not a real offer for sale.",
      "zh-Hant": "用心安排餐桌，分享每一餐。 來源記載：16 件。 最終規格仍待確認。 示範商品，港幣售價僅供展示。庫存與供貨狀態均為模擬，並非實際銷售要約。",
      "zh-Hans": "用心安排餐桌，分享每一餐。 来源记载：16 件。 最终规格仍待确认。 示范商品，港币售价仅供展示。库存与供货状态均为模拟，并非实际销售要约。",
      "ja": "日々の食卓を丁寧に整える一品。 資料に記載された仕様：16点。 最終仕様は確認待ちです。 デモ商品です。香港ドルの価格は表示例です。在庫と販売状況は架空であり、実際の販売ではありません。"
    },
    "priceAmount": 56800,
    "image": "/products/supplier-demo/cer-f009.webp"
  },
  {
    "id": "c4581a59-e2f1-52d4-9757-584ae29a9d1e",
    "reference": "CER-F010",
    "slug": "supplier-cer-f010",
    "category": "Tableware",
    "titles": {
      "en": "Starry celadon covered bowl",
      "zh-Hant": "星空青瓷如意燉盅",
      "zh-Hans": "星空青瓷如意炖盅",
      "ja": "星空青磁 蓋付きボウル"
    },
    "descriptions": {
      "en": "A considered setting for shared meals. Source-listed details: Contents require confirmation. Final specifications require confirmation. Demo item with an illustrative HKD retail price. Stock and availability are simulated; this is not a real offer for sale.",
      "zh-Hant": "用心安排餐桌，分享每一餐。 來源記載：組合內容待確認。 最終規格仍待確認。 示範商品，港幣售價僅供展示。庫存與供貨狀態均為模擬，並非實際銷售要約。",
      "zh-Hans": "用心安排餐桌，分享每一餐。 来源记载：组合内容待确认。 最终规格仍待确认。 示范商品，港币售价仅供展示。库存与供货状态均为模拟，并非实际销售要约。",
      "ja": "日々の食卓を丁寧に整える一品。 資料に記載された仕様：セット内容は確認待ちです。 最終仕様は確認待ちです。 デモ商品です。香港ドルの価格は表示例です。在庫と販売状況は架空であり、実際の販売ではありません。"
    },
    "priceAmount": 12800,
    "image": "/products/supplier-demo/cer-f010.webp"
  },
  {
    "id": "987f4df3-6b14-5181-b4e5-c92507e931b7",
    "reference": "CER-F011",
    "slug": "supplier-cer-f011",
    "category": "Tableware",
    "titles": {
      "en": "Starry celadon tableware — 12 pieces",
      "zh-Hant": "星空青瓷餐具十二件套",
      "zh-Hans": "星空青瓷餐具十二件套",
      "ja": "星空青磁 食器セット・12点"
    },
    "descriptions": {
      "en": "A considered setting for shared meals. Source-listed details: 12 pieces. Final specifications require confirmation. Demo item with an illustrative HKD retail price. Stock and availability are simulated; this is not a real offer for sale.",
      "zh-Hant": "用心安排餐桌，分享每一餐。 來源記載：12 件。 最終規格仍待確認。 示範商品，港幣售價僅供展示。庫存與供貨狀態均為模擬，並非實際銷售要約。",
      "zh-Hans": "用心安排餐桌，分享每一餐。 来源记载：12 件。 最终规格仍待确认。 示范商品，港币售价仅供展示。库存与供货状态均为模拟，并非实际销售要约。",
      "ja": "日々の食卓を丁寧に整える一品。 資料に記載された仕様：12点。 最終仕様は確認待ちです。 デモ商品です。香港ドルの価格は表示例です。在庫と販売状況は架空であり、実際の販売ではありません。"
    },
    "priceAmount": 46800,
    "image": "/products/supplier-demo/cer-f011.webp"
  },
  {
    "id": "e296ad06-ea77-5800-aabd-13119881e318",
    "reference": "CER-F012",
    "slug": "supplier-cer-f012",
    "category": "Tableware",
    "titles": {
      "en": "Starry celadon place setting — 8 pieces",
      "zh-Hant": "星空青瓷單人餐具八件套",
      "zh-Hans": "星空青瓷单人餐具八件套",
      "ja": "星空青磁 一人用食器セット・8点"
    },
    "descriptions": {
      "en": "A considered setting for shared meals. Source-listed details: 8 pieces. Final specifications require confirmation. Demo item with an illustrative HKD retail price. Stock and availability are simulated; this is not a real offer for sale.",
      "zh-Hant": "用心安排餐桌，分享每一餐。 來源記載：8 件。 最終規格仍待確認。 示範商品，港幣售價僅供展示。庫存與供貨狀態均為模擬，並非實際銷售要約。",
      "zh-Hans": "用心安排餐桌，分享每一餐。 来源记载：8 件。 最终规格仍待确认。 示范商品，港币售价仅供展示。库存与供货状态均为模拟，并非实际销售要约。",
      "ja": "日々の食卓を丁寧に整える一品。 資料に記載された仕様：8点。 最終仕様は確認待ちです。 デモ商品です。香港ドルの価格は表示例です。在庫と販売状況は架空であり、実際の販売ではありません。"
    },
    "priceAmount": 32800,
    "image": "/products/supplier-demo/cer-f012.webp"
  },
  {
    "id": "54ffdcd6-7f27-514a-99c5-2c2e14516482",
    "reference": "CER-F013",
    "slug": "supplier-cer-f013",
    "category": "Tableware",
    "titles": {
      "en": "Starry celadon tableware — 22 pieces",
      "zh-Hant": "星空青瓷餐具二十二件套",
      "zh-Hans": "星空青瓷餐具二十二件套",
      "ja": "星空青磁 食器セット・22点"
    },
    "descriptions": {
      "en": "A considered setting for shared meals. Source-listed details: 22 pieces. Final specifications require confirmation. Demo item with an illustrative HKD retail price. Stock and availability are simulated; this is not a real offer for sale.",
      "zh-Hant": "用心安排餐桌，分享每一餐。 來源記載：22 件。 最終規格仍待確認。 示範商品，港幣售價僅供展示。庫存與供貨狀態均為模擬，並非實際銷售要約。",
      "zh-Hans": "用心安排餐桌，分享每一餐。 来源记载：22 件。 最终规格仍待确认。 示范商品，港币售价仅供展示。库存与供货状态均为模拟，并非实际销售要约。",
      "ja": "日々の食卓を丁寧に整える一品。 資料に記載された仕様：22点。 最終仕様は確認待ちです。 デモ商品です。香港ドルの価格は表示例です。在庫と販売状況は架空であり、実際の販売ではありません。"
    },
    "priceAmount": 69800,
    "image": "/products/supplier-demo/cer-f013.webp"
  },
  {
    "id": "9547e110-2a16-5cd7-8ec9-8c9197c23f03",
    "reference": "CER-F014",
    "slug": "supplier-cer-f014",
    "category": "Tableware",
    "titles": {
      "en": "Starry celadon tableware — 28 pieces",
      "zh-Hant": "星空青瓷餐具二十八件套",
      "zh-Hans": "星空青瓷餐具二十八件套",
      "ja": "星空青磁 食器セット・28点"
    },
    "descriptions": {
      "en": "A considered setting for shared meals. Source-listed details: 28 pieces. Final specifications require confirmation. Demo item with an illustrative HKD retail price. Stock and availability are simulated; this is not a real offer for sale.",
      "zh-Hant": "用心安排餐桌，分享每一餐。 來源記載：28 件。 最終規格仍待確認。 示範商品，港幣售價僅供展示。庫存與供貨狀態均為模擬，並非實際銷售要約。",
      "zh-Hans": "用心安排餐桌，分享每一餐。 来源记载：28 件。 最终规格仍待确认。 示范商品，港币售价仅供展示。库存与供货状态均为模拟，并非实际销售要约。",
      "ja": "日々の食卓を丁寧に整える一品。 資料に記載された仕様：28点。 最終仕様は確認待ちです。 デモ商品です。香港ドルの価格は表示例です。在庫と販売状況は架空であり、実際の販売ではありません。"
    },
    "priceAmount": 89800,
    "image": "/products/supplier-demo/cer-f014.webp"
  },
  {
    "id": "573db982-84ef-53dc-8c23-23c2d676413f",
    "reference": "CER-F015",
    "slug": "supplier-cer-f015",
    "category": "Tableware",
    "titles": {
      "en": "Starry celadon tableware — 36 pieces",
      "zh-Hant": "星空青瓷餐具三十六件套",
      "zh-Hans": "星空青瓷餐具三十六件套",
      "ja": "星空青磁 食器セット・36点"
    },
    "descriptions": {
      "en": "A considered setting for shared meals. Source-listed details: 36 pieces. Final specifications require confirmation. Demo item with an illustrative HKD retail price. Stock and availability are simulated; this is not a real offer for sale.",
      "zh-Hant": "用心安排餐桌，分享每一餐。 來源記載：36 件。 最終規格仍待確認。 示範商品，港幣售價僅供展示。庫存與供貨狀態均為模擬，並非實際銷售要約。",
      "zh-Hans": "用心安排餐桌，分享每一餐。 来源记载：36 件。 最终规格仍待确认。 示范商品，港币售价仅供展示。库存与供货状态均为模拟，并非实际销售要约。",
      "ja": "日々の食卓を丁寧に整える一品。 資料に記載された仕様：36点。 最終仕様は確認待ちです。 デモ商品です。香港ドルの価格は表示例です。在庫と販売状況は架空であり、実際の販売ではありません。"
    },
    "priceAmount": 108800,
    "image": "/products/supplier-demo/cer-f015.webp"
  },
  {
    "id": "4e7bf028-43bd-5a44-9d88-1e69640c9c8e",
    "reference": "CER-F017",
    "slug": "supplier-cer-f017",
    "category": "Tableware",
    "titles": {
      "en": "Starry celadon tableware — 66 pieces",
      "zh-Hant": "星空青瓷餐具六十六件套",
      "zh-Hans": "星空青瓷餐具六十六件套",
      "ja": "星空青磁 食器セット・66点"
    },
    "descriptions": {
      "en": "A considered setting for shared meals. Source-listed details: 66 pieces. Final specifications require confirmation. Demo item with an illustrative HKD retail price. Stock and availability are simulated; this is not a real offer for sale.",
      "zh-Hant": "用心安排餐桌，分享每一餐。 來源記載：66 件。 最終規格仍待確認。 示範商品，港幣售價僅供展示。庫存與供貨狀態均為模擬，並非實際銷售要約。",
      "zh-Hans": "用心安排餐桌，分享每一餐。 来源记载：66 件。 最终规格仍待确认。 示范商品，港币售价仅供展示。库存与供货状态均为模拟，并非实际销售要约。",
      "ja": "日々の食卓を丁寧に整える一品。 資料に記載された仕様：66点。 最終仕様は確認待ちです。 デモ商品です。香港ドルの価格は表示例です。在庫と販売状況は架空であり、実際の販売ではありません。"
    },
    "priceAmount": 148800,
    "image": "/products/supplier-demo/cer-f017.webp"
  },
  {
    "id": "3c2293bf-241b-5d38-97f3-8feb11b97f53",
    "reference": "CER-F018",
    "slug": "supplier-cer-f018",
    "category": "Tableware",
    "titles": {
      "en": "Starry celadon tableware — 8 pieces",
      "zh-Hant": "星空青瓷餐具八件套",
      "zh-Hans": "星空青瓷餐具八件套",
      "ja": "星空青磁 食器セット・8点"
    },
    "descriptions": {
      "en": "A considered setting for shared meals. Source-listed details: 8 pieces. Final specifications require confirmation. Demo item with an illustrative HKD retail price. Stock and availability are simulated; this is not a real offer for sale.",
      "zh-Hant": "用心安排餐桌，分享每一餐。 來源記載：8 件。 最終規格仍待確認。 示範商品，港幣售價僅供展示。庫存與供貨狀態均為模擬，並非實際銷售要約。",
      "zh-Hans": "用心安排餐桌，分享每一餐。 来源记载：8 件。 最终规格仍待确认。 示范商品，港币售价仅供展示。库存与供货状态均为模拟，并非实际销售要约。",
      "ja": "日々の食卓を丁寧に整える一品。 資料に記載された仕様：8点。 最終仕様は確認待ちです。 デモ商品です。香港ドルの価格は表示例です。在庫と販売状況は架空であり、実際の販売ではありません。"
    },
    "priceAmount": 32800,
    "image": "/products/supplier-demo/cer-f018.webp"
  },
  {
    "id": "cf87a43d-5133-5947-91ff-1bc464a1283f",
    "reference": "CER-F019",
    "slug": "supplier-cer-f019",
    "category": "Tea & coffee",
    "titles": {
      "en": "Starry celadon coffee set — 6 pieces",
      "zh-Hant": "星空青瓷咖啡六件套",
      "zh-Hans": "星空青瓷咖啡六件套",
      "ja": "星空青磁 コーヒーセット・6点"
    },
    "descriptions": {
      "en": "Make room for an unhurried tea or coffee break. Source-listed details: 6 pieces. Final specifications require confirmation. Demo item with an illustrative HKD retail price. Stock and availability are simulated; this is not a real offer for sale.",
      "zh-Hant": "留一點時間，從容享用茶與咖啡。 來源記載：6 件。 最終規格仍待確認。 示範商品，港幣售價僅供展示。庫存與供貨狀態均為模擬，並非實際銷售要約。",
      "zh-Hans": "留一点时间，从容享用茶与咖啡。 来源记载：6 件。 最终规格仍待确认。 示范商品，港币售价仅供展示。库存与供货状态均为模拟，并非实际销售要约。",
      "ja": "お茶やコーヒーをゆっくり楽しむひとときに。 資料に記載された仕様：6点。 最終仕様は確認待ちです。 デモ商品です。香港ドルの価格は表示例です。在庫と販売状況は架空であり、実際の販売ではありません。"
    },
    "priceAmount": 28800,
    "image": "/products/supplier-demo/cer-f019.webp"
  },
  {
    "id": "70eb91c4-6d5b-53f7-b858-396ab685ec97",
    "reference": "CER-F020",
    "slug": "supplier-cer-f020",
    "category": "Gifts",
    "titles": {
      "en": "Su Shi Moxiang pendant gift set",
      "zh-Hant": "蘇軾墨香掛墜禮盒",
      "zh-Hans": "苏轼墨香挂坠礼盒",
      "ja": "蘇軾墨香 ペンダントギフトセット"
    },
    "descriptions": {
      "en": "A small gesture for a thoughtful occasion. Source-listed details: Contents require confirmation. Final specifications require confirmation. Demo item with an illustrative HKD retail price. Stock and availability are simulated; this is not a real offer for sale.",
      "zh-Hant": "為值得記念的時刻，準備一份心意。 來源記載：組合內容待確認。 最終規格仍待確認。 示範商品，港幣售價僅供展示。庫存與供貨狀態均為模擬，並非實際銷售要約。",
      "zh-Hans": "为值得记念的时刻，准备一份心意。 来源记载：组合内容待确认。 最终规格仍待确认。 示范商品，港币售价仅供展示。库存与供货状态均为模拟，并非实际销售要约。",
      "ja": "大切なひとときに、ささやかな心配りを。 資料に記載された仕様：セット内容は確認待ちです。 最終仕様は確認待ちです。 デモ商品です。香港ドルの価格は表示例です。在庫と販売状況は架空であり、実際の販売ではありません。"
    },
    "priceAmount": 29800,
    "image": "/products/supplier-demo/cer-f020.webp"
  },
  {
    "id": "8e6bc52b-870f-5e05-9585-db88f1305c30",
    "reference": "CER-F024",
    "slug": "supplier-cer-f024",
    "category": "Tea & coffee",
    "titles": {
      "en": "Magnolia celadon office cup set — 3 pieces",
      "zh-Hant": "金玉蘭青瓷辦公杯三件套",
      "zh-Hans": "金玉兰青瓷办公杯三件套",
      "ja": "金玉蘭青磁 オフィスカップセット・3点"
    },
    "descriptions": {
      "en": "Make room for an unhurried tea or coffee break. Source-listed details: 3 pieces. Final specifications require confirmation. Demo item with an illustrative HKD retail price. Stock and availability are simulated; this is not a real offer for sale.",
      "zh-Hant": "留一點時間，從容享用茶與咖啡。 來源記載：3 件。 最終規格仍待確認。 示範商品，港幣售價僅供展示。庫存與供貨狀態均為模擬，並非實際銷售要約。",
      "zh-Hans": "留一点时间，从容享用茶与咖啡。 来源记载：3 件。 最终规格仍待确认。 示范商品，港币售价仅供展示。库存与供货状态均为模拟，并非实际销售要约。",
      "ja": "お茶やコーヒーをゆっくり楽しむひとときに。 資料に記載された仕様：3点。 最終仕様は確認待ちです。 デモ商品です。香港ドルの価格は表示例です。在庫と販売状況は架空であり、実際の販売ではありません。"
    },
    "priceAmount": 16800,
    "image": "/products/supplier-demo/cer-f024.webp"
  },
  {
    "id": "c21718a2-2cdb-5217-b030-466775504c5c",
    "reference": "CER-F025",
    "slug": "supplier-cer-f025",
    "category": "Tableware",
    "titles": {
      "en": "Magnolia celadon covered bowl set — 3 pieces",
      "zh-Hant": "金玉蘭青瓷如意燉盅三件套",
      "zh-Hans": "金玉兰青瓷如意炖盅三件套",
      "ja": "金玉蘭青磁 蓋付きボウルセット・3点"
    },
    "descriptions": {
      "en": "A considered setting for shared meals. Source-listed details: 3 pieces. Final specifications require confirmation. Demo item with an illustrative HKD retail price. Stock and availability are simulated; this is not a real offer for sale.",
      "zh-Hant": "用心安排餐桌，分享每一餐。 來源記載：3 件。 最終規格仍待確認。 示範商品，港幣售價僅供展示。庫存與供貨狀態均為模擬，並非實際銷售要約。",
      "zh-Hans": "用心安排餐桌，分享每一餐。 来源记载：3 件。 最终规格仍待确认。 示范商品，港币售价仅供展示。库存与供货状态均为模拟，并非实际销售要约。",
      "ja": "日々の食卓を丁寧に整える一品。 資料に記載された仕様：3点。 最終仕様は確認待ちです。 デモ商品です。香港ドルの価格は表示例です。在庫と販売状況は架空であり、実際の販売ではありません。"
    },
    "priceAmount": 16800,
    "image": "/products/supplier-demo/cer-f025.webp"
  },
  {
    "id": "2bd72601-f776-5b62-9dee-319806420132",
    "reference": "CER-F026",
    "slug": "supplier-cer-f026",
    "category": "Gifts",
    "titles": {
      "en": "Magnolia Guandan gift set — A",
      "zh-Hant": "金玉蘭摜蛋高手禮盒甲款",
      "zh-Hans": "金玉兰掼蛋高手礼盒甲款",
      "ja": "金玉蘭 掼蛋ギフトセット・A"
    },
    "descriptions": {
      "en": "A small gesture for a thoughtful occasion. Source-listed details: Contents require confirmation. Final specifications require confirmation. Demo item with an illustrative HKD retail price. Stock and availability are simulated; this is not a real offer for sale.",
      "zh-Hant": "為值得記念的時刻，準備一份心意。 來源記載：組合內容待確認。 最終規格仍待確認。 示範商品，港幣售價僅供展示。庫存與供貨狀態均為模擬，並非實際銷售要約。",
      "zh-Hans": "为值得记念的时刻，准备一份心意。 来源记载：组合内容待确认。 最终规格仍待确认。 示范商品，港币售价仅供展示。库存与供货状态均为模拟，并非实际销售要约。",
      "ja": "大切なひとときに、ささやかな心配りを。 資料に記載された仕様：セット内容は確認待ちです。 最終仕様は確認待ちです。 デモ商品です。香港ドルの価格は表示例です。在庫と販売状況は架空であり、実際の販売ではありません。"
    },
    "priceAmount": 39800,
    "image": "/products/supplier-demo/cer-f026.webp"
  },
  {
    "id": "e3629037-e543-5f42-92ba-dbf420ea9f06",
    "reference": "CER-F027",
    "slug": "supplier-cer-f027",
    "category": "Gifts",
    "titles": {
      "en": "Magnolia Guandan gift set — B",
      "zh-Hant": "金玉蘭摜蛋高手禮盒乙款",
      "zh-Hans": "金玉兰掼蛋高手礼盒乙款",
      "ja": "金玉蘭 掼蛋ギフトセット・B"
    },
    "descriptions": {
      "en": "A small gesture for a thoughtful occasion. Source-listed details: Contents require confirmation. Final specifications require confirmation. Demo item with an illustrative HKD retail price. Stock and availability are simulated; this is not a real offer for sale.",
      "zh-Hant": "為值得記念的時刻，準備一份心意。 來源記載：組合內容待確認。 最終規格仍待確認。 示範商品，港幣售價僅供展示。庫存與供貨狀態均為模擬，並非實際銷售要約。",
      "zh-Hans": "为值得记念的时刻，准备一份心意。 来源记载：组合内容待确认。 最终规格仍待确认。 示范商品，港币售价仅供展示。库存与供货状态均为模拟，并非实际销售要约。",
      "ja": "大切なひとときに、ささやかな心配りを。 資料に記載された仕様：セット内容は確認待ちです。 最終仕様は確認待ちです。 デモ商品です。香港ドルの価格は表示例です。在庫と販売状況は架空であり、実際の販売ではありません。"
    },
    "priceAmount": 42800,
    "image": "/products/supplier-demo/cer-f027.webp"
  },
  {
    "id": "28fe57da-2fd4-5cf4-876b-5b6c714b8e0f",
    "reference": "CER-F028",
    "slug": "supplier-cer-f028",
    "category": "Tableware",
    "titles": {
      "en": "Magnolia celadon tableware — 22 pieces",
      "zh-Hant": "金玉蘭青瓷餐具二十二件套",
      "zh-Hans": "金玉兰青瓷餐具二十二件套",
      "ja": "金玉蘭青磁 食器セット・22点"
    },
    "descriptions": {
      "en": "A considered setting for shared meals. Source-listed details: 22 pieces. Final specifications require confirmation. Demo item with an illustrative HKD retail price. Stock and availability are simulated; this is not a real offer for sale.",
      "zh-Hant": "用心安排餐桌，分享每一餐。 來源記載：22 件。 最終規格仍待確認。 示範商品，港幣售價僅供展示。庫存與供貨狀態均為模擬，並非實際銷售要約。",
      "zh-Hans": "用心安排餐桌，分享每一餐。 来源记载：22 件。 最终规格仍待确认。 示范商品，港币售价仅供展示。库存与供货状态均为模拟，并非实际销售要约。",
      "ja": "日々の食卓を丁寧に整える一品。 資料に記載された仕様：22点。 最終仕様は確認待ちです。 デモ商品です。香港ドルの価格は表示例です。在庫と販売状況は架空であり、実際の販売ではありません。"
    },
    "priceAmount": 69800,
    "image": "/products/supplier-demo/cer-f028.webp"
  },
  {
    "id": "cd6522e3-fec5-5543-96b5-d227fa499d46",
    "reference": "CER-F029",
    "slug": "supplier-cer-f029",
    "category": "Tableware",
    "titles": {
      "en": "Magnolia celadon tableware — 28 pieces",
      "zh-Hant": "金玉蘭青瓷餐具二十八件套",
      "zh-Hans": "金玉兰青瓷餐具二十八件套",
      "ja": "金玉蘭青磁 食器セット・28点"
    },
    "descriptions": {
      "en": "A considered setting for shared meals. Source-listed details: 28 pieces. Final specifications require confirmation. Demo item with an illustrative HKD retail price. Stock and availability are simulated; this is not a real offer for sale.",
      "zh-Hant": "用心安排餐桌，分享每一餐。 來源記載：28 件。 最終規格仍待確認。 示範商品，港幣售價僅供展示。庫存與供貨狀態均為模擬，並非實際銷售要約。",
      "zh-Hans": "用心安排餐桌，分享每一餐。 来源记载：28 件。 最终规格仍待确认。 示范商品，港币售价仅供展示。库存与供货状态均为模拟，并非实际销售要约。",
      "ja": "日々の食卓を丁寧に整える一品。 資料に記載された仕様：28点。 最終仕様は確認待ちです。 デモ商品です。香港ドルの価格は表示例です。在庫と販売状況は架空であり、実際の販売ではありません。"
    },
    "priceAmount": 89800,
    "image": "/products/supplier-demo/cer-f029.webp"
  },
  {
    "id": "2c928710-397b-591c-bbfa-43cdf917e27b",
    "reference": "CER-F030",
    "slug": "supplier-cer-f030",
    "category": "Tableware",
    "titles": {
      "en": "Magnolia celadon tableware — 36 pieces",
      "zh-Hant": "金玉蘭青瓷餐具三十六件套",
      "zh-Hans": "金玉兰青瓷餐具三十六件套",
      "ja": "金玉蘭青磁 食器セット・36点"
    },
    "descriptions": {
      "en": "A considered setting for shared meals. Source-listed details: 36 pieces. Final specifications require confirmation. Demo item with an illustrative HKD retail price. Stock and availability are simulated; this is not a real offer for sale.",
      "zh-Hant": "用心安排餐桌，分享每一餐。 來源記載：36 件。 最終規格仍待確認。 示範商品，港幣售價僅供展示。庫存與供貨狀態均為模擬，並非實際銷售要約。",
      "zh-Hans": "用心安排餐桌，分享每一餐。 来源记载：36 件。 最终规格仍待确认。 示范商品，港币售价仅供展示。库存与供货状态均为模拟，并非实际销售要约。",
      "ja": "日々の食卓を丁寧に整える一品。 資料に記載された仕様：36点。 最終仕様は確認待ちです。 デモ商品です。香港ドルの価格は表示例です。在庫と販売状況は架空であり、実際の販売ではありません。"
    },
    "priceAmount": 108800,
    "image": "/products/supplier-demo/cer-f030.webp"
  },
  {
    "id": "f9c198b4-35cb-5262-94ba-655db6720777",
    "reference": "CER-F033",
    "slug": "supplier-cer-f033",
    "category": "Tableware",
    "titles": {
      "en": "Magnolia celadon tableware — 66 pieces",
      "zh-Hant": "金玉蘭青瓷餐具六十六件套",
      "zh-Hans": "金玉兰青瓷餐具六十六件套",
      "ja": "金玉蘭青磁 食器セット・66点"
    },
    "descriptions": {
      "en": "A considered setting for shared meals. Source-listed details: 66 pieces. Final specifications require confirmation. Demo item with an illustrative HKD retail price. Stock and availability are simulated; this is not a real offer for sale.",
      "zh-Hant": "用心安排餐桌，分享每一餐。 來源記載：66 件。 最終規格仍待確認。 示範商品，港幣售價僅供展示。庫存與供貨狀態均為模擬，並非實際銷售要約。",
      "zh-Hans": "用心安排餐桌，分享每一餐。 来源记载：66 件。 最终规格仍待确认。 示范商品，港币售价仅供展示。库存与供货状态均为模拟，并非实际销售要约。",
      "ja": "日々の食卓を丁寧に整える一品。 資料に記載された仕様：66点。 最終仕様は確認待ちです。 デモ商品です。香港ドルの価格は表示例です。在庫と販売状況は架空であり、実際の販売ではありません。"
    },
    "priceAmount": 148800,
    "image": "/products/supplier-demo/cer-f033.webp"
  },
  {
    "id": "685616ec-f844-5de1-9f30-ab19dbd21712",
    "reference": "CER-F036",
    "slug": "supplier-cer-f036",
    "category": "Tableware",
    "titles": {
      "en": "Magnolia celadon tableware — 8 pieces",
      "zh-Hant": "金玉蘭青瓷餐具八件套",
      "zh-Hans": "金玉兰青瓷餐具八件套",
      "ja": "金玉蘭青磁 食器セット・8点"
    },
    "descriptions": {
      "en": "A considered setting for shared meals. Source-listed details: 8 pieces. Final specifications require confirmation. Demo item with an illustrative HKD retail price. Stock and availability are simulated; this is not a real offer for sale.",
      "zh-Hant": "用心安排餐桌，分享每一餐。 來源記載：8 件。 最終規格仍待確認。 示範商品，港幣售價僅供展示。庫存與供貨狀態均為模擬，並非實際銷售要約。",
      "zh-Hans": "用心安排餐桌，分享每一餐。 来源记载：8 件。 最终规格仍待确认。 示范商品，港币售价仅供展示。库存与供货状态均为模拟，并非实际销售要约。",
      "ja": "日々の食卓を丁寧に整える一品。 資料に記載された仕様：8点。 最終仕様は確認待ちです。 デモ商品です。香港ドルの価格は表示例です。在庫と販売状況は架空であり、実際の販売ではありません。"
    },
    "priceAmount": 32800,
    "image": "/products/supplier-demo/cer-f036.webp"
  },
  {
    "id": "82f8cd24-cb7f-5098-bee3-8df5f899204c",
    "reference": "CER-F037",
    "slug": "supplier-cer-f037",
    "category": "Tableware",
    "titles": {
      "en": "Magnolia celadon bowl and chopstick set — 10 pieces",
      "zh-Hant": "金玉蘭青瓷碗筷十件套",
      "zh-Hans": "金玉兰青瓷碗筷十件套",
      "ja": "金玉蘭青磁 ボウル＆箸セット・10点"
    },
    "descriptions": {
      "en": "A considered setting for shared meals. Source-listed details: 10 pieces. Final specifications require confirmation. Demo item with an illustrative HKD retail price. Stock and availability are simulated; this is not a real offer for sale.",
      "zh-Hant": "用心安排餐桌，分享每一餐。 來源記載：10 件。 最終規格仍待確認。 示範商品，港幣售價僅供展示。庫存與供貨狀態均為模擬，並非實際銷售要約。",
      "zh-Hans": "用心安排餐桌，分享每一餐。 来源记载：10 件。 最终规格仍待确认。 示范商品，港币售价仅供展示。库存与供货状态均为模拟，并非实际销售要约。",
      "ja": "日々の食卓を丁寧に整える一品。 資料に記載された仕様：10点。 最終仕様は確認待ちです。 デモ商品です。香港ドルの価格は表示例です。在庫と販売状況は架空であり、実際の販売ではありません。"
    },
    "priceAmount": 39800,
    "image": "/products/supplier-demo/cer-f037.webp"
  },
  {
    "id": "b7e334da-fd07-5e3c-99b0-bfed539728fe",
    "reference": "CER-F038",
    "slug": "supplier-cer-f038",
    "category": "Tableware",
    "titles": {
      "en": "Magnolia celadon bowl and chopstick set — 16 pieces",
      "zh-Hant": "金玉蘭青瓷碗筷十六件套",
      "zh-Hans": "金玉兰青瓷碗筷十六件套",
      "ja": "金玉蘭青磁 ボウル＆箸セット・16点"
    },
    "descriptions": {
      "en": "A considered setting for shared meals. Source-listed details: 16 pieces. Final specifications require confirmation. Demo item with an illustrative HKD retail price. Stock and availability are simulated; this is not a real offer for sale.",
      "zh-Hant": "用心安排餐桌，分享每一餐。 來源記載：16 件。 最終規格仍待確認。 示範商品，港幣售價僅供展示。庫存與供貨狀態均為模擬，並非實際銷售要約。",
      "zh-Hans": "用心安排餐桌，分享每一餐。 来源记载：16 件。 最终规格仍待确认。 示范商品，港币售价仅供展示。库存与供货状态均为模拟，并非实际销售要约。",
      "ja": "日々の食卓を丁寧に整える一品。 資料に記載された仕様：16点。 最終仕様は確認待ちです。 デモ商品です。香港ドルの価格は表示例です。在庫と販売状況は架空であり、実際の販売ではありません。"
    },
    "priceAmount": 56800,
    "image": "/products/supplier-demo/cer-f038.webp"
  },
  {
    "id": "90d2a4ac-2777-597d-aaf8-024a6fbd5fca",
    "reference": "CER-F039",
    "slug": "supplier-cer-f039",
    "category": "Tea & coffee",
    "titles": {
      "en": "Magnolia celadon coffee set — 6 pieces",
      "zh-Hant": "金玉蘭青瓷咖啡六件套",
      "zh-Hans": "金玉兰青瓷咖啡六件套",
      "ja": "金玉蘭青磁 コーヒーセット・6点"
    },
    "descriptions": {
      "en": "Make room for an unhurried tea or coffee break. Source-listed details: 6 pieces. Final specifications require confirmation. Demo item with an illustrative HKD retail price. Stock and availability are simulated; this is not a real offer for sale.",
      "zh-Hant": "留一點時間，從容享用茶與咖啡。 來源記載：6 件。 最終規格仍待確認。 示範商品，港幣售價僅供展示。庫存與供貨狀態均為模擬，並非實際銷售要約。",
      "zh-Hans": "留一点时间，从容享用茶与咖啡。 来源记载：6 件。 最终规格仍待确认。 示范商品，港币售价仅供展示。库存与供货状态均为模拟，并非实际销售要约。",
      "ja": "お茶やコーヒーをゆっくり楽しむひとときに。 資料に記載された仕様：6点。 最終仕様は確認待ちです。 デモ商品です。香港ドルの価格は表示例です。在庫と販売状況は架空であり、実際の販売ではありません。"
    },
    "priceAmount": 28800,
    "image": "/products/supplier-demo/cer-f039.webp"
  },
  {
    "id": "cdb28d16-74d5-58c0-8216-01c0be5f2e9b",
    "reference": "CER-F040",
    "slug": "supplier-cer-f040",
    "category": "Food & beverages",
    "titles": {
      "en": "Magnolia customized bird’s-nest and tableware gift set",
      "zh-Hant": "金玉蘭燕窩與餐具訂製禮盒",
      "zh-Hans": "金玉兰燕窝与餐具订制礼盒",
      "ja": "金玉蘭 ツバメの巣食品と食器のギフトセット"
    },
    "descriptions": {
      "en": "Explore a selection for the pantry and gift table. Source-listed details: Contents require confirmation. Final specifications require confirmation. Demo item with an illustrative HKD retail price. Stock and availability are simulated; this is not a real offer for sale.",
      "zh-Hant": "探索適合日常儲備與送禮的選品。 來源記載：組合內容待確認。 最終規格仍待確認。 示範商品，港幣售價僅供展示。庫存與供貨狀態均為模擬，並非實際銷售要約。",
      "zh-Hans": "探索适合日常储备与送礼的选品。 来源记载：组合内容待确认。 最终规格仍待确认。 示范商品，港币售价仅供展示。库存与供货状态均为模拟，并非实际销售要约。",
      "ja": "日々のストックや贈り物に選ぶ品々。 資料に記載された仕様：セット内容は確認待ちです。 最終仕様は確認待ちです。 デモ商品です。香港ドルの価格は表示例です。在庫と販売状況は架空であり、実際の販売ではありません。"
    },
    "priceAmount": 88800,
    "image": "/products/supplier-demo/cer-f040.webp"
  },
  {
    "id": "77cf7679-45aa-5092-850e-8fbb0cabe4f6",
    "reference": "MDXY-1",
    "slug": "supplier-mdxy-1",
    "category": "Beauty & personal care",
    "titles": {
      "en": "Four-piece skincare gift set",
      "zh-Hant": "四件裝護膚禮盒",
      "zh-Hans": "四件装护肤礼盒",
      "ja": "スキンケアギフトセット・4点"
    },
    "descriptions": {
      "en": "A considered addition to the daily care shelf. Source-listed details: 4 pieces. Final specifications require confirmation. Demo item with an illustrative HKD retail price. Stock and availability are simulated; this is not a real offer for sale.",
      "zh-Hant": "為日常護理角落，添上一份用心。 來源記載：4 件。 最終規格仍待確認。 示範商品，港幣售價僅供展示。庫存與供貨狀態均為模擬，並非實際銷售要約。",
      "zh-Hans": "为日常护理角落，添上一份用心。 来源记载：4 件。 最终规格仍待确认。 示范商品，港币售价仅供展示。库存与供货状态均为模拟，并非实际销售要约。",
      "ja": "日々のケアに、丁寧に選ぶ一品。 資料に記載された仕様：4点。 最終仕様は確認待ちです。 デモ商品です。香港ドルの価格は表示例です。在庫と販売状況は架空であり、実際の販売ではありません。"
    },
    "priceAmount": 39800,
    "image": "/products/supplier-demo/mdxy-1.webp"
  },
  {
    "id": "ce96875a-9e59-594e-ad86-7d9e8e9e8f3f",
    "reference": "MDXY-2",
    "slug": "supplier-mdxy-2",
    "category": "Beauty & personal care",
    "titles": {
      "en": "Five-piece skincare gift set",
      "zh-Hant": "五件裝護膚禮盒",
      "zh-Hans": "五件装护肤礼盒",
      "ja": "スキンケアギフトセット・5点"
    },
    "descriptions": {
      "en": "A considered addition to the daily care shelf. Source-listed details: 5 pieces. Final specifications require confirmation. Demo item with an illustrative HKD retail price. Stock and availability are simulated; this is not a real offer for sale.",
      "zh-Hant": "為日常護理角落，添上一份用心。 來源記載：5 件。 最終規格仍待確認。 示範商品，港幣售價僅供展示。庫存與供貨狀態均為模擬，並非實際銷售要約。",
      "zh-Hans": "为日常护理角落，添上一份用心。 来源记载：5 件。 最终规格仍待确认。 示范商品，港币售价仅供展示。库存与供货状态均为模拟，并非实际销售要约。",
      "ja": "日々のケアに、丁寧に選ぶ一品。 資料に記載された仕様：5点。 最終仕様は確認待ちです。 デモ商品です。香港ドルの価格は表示例です。在庫と販売状況は架空であり、実際の販売ではありません。"
    },
    "priceAmount": 49800,
    "image": "/products/supplier-demo/mdxy-2.webp"
  },
  {
    "id": "7c19186e-4d19-5180-8159-427e60f83726",
    "reference": "MDXY-3",
    "slug": "supplier-mdxy-3",
    "category": "Beauty & personal care",
    "titles": {
      "en": "Facial spray",
      "zh-Hant": "面部噴霧",
      "zh-Hans": "面部喷雾",
      "ja": "フェイスミスト"
    },
    "descriptions": {
      "en": "A considered addition to the daily care shelf. Source-listed details: 100 g. Final specifications require confirmation. Demo item with an illustrative HKD retail price. Stock and availability are simulated; this is not a real offer for sale.",
      "zh-Hant": "為日常護理角落，添上一份用心。 來源記載：100 克。 最終規格仍待確認。 示範商品，港幣售價僅供展示。庫存與供貨狀態均為模擬，並非實際銷售要約。",
      "zh-Hans": "为日常护理角落，添上一份用心。 来源记载：100 克。 最终规格仍待确认。 示范商品，港币售价仅供展示。库存与供货状态均为模拟，并非实际销售要约。",
      "ja": "日々のケアに、丁寧に選ぶ一品。 資料に記載された仕様：100 g。 最終仕様は確認待ちです。 デモ商品です。香港ドルの価格は表示例です。在庫と販売状況は架空であり、実際の販売ではありません。"
    },
    "priceAmount": 12800,
    "image": "/products/supplier-demo/mdxy-3.webp"
  },
  {
    "id": "10f07648-db6c-5436-85e8-5e7f5ecdd793",
    "reference": "MDXY-4",
    "slug": "supplier-mdxy-4",
    "category": "Beauty & personal care",
    "titles": {
      "en": "Facial sheet masks · red box",
      "zh-Hant": "片裝面膜・紅盒",
      "zh-Hans": "片装面膜・红盒",
      "ja": "シートマスク・赤い箱"
    },
    "descriptions": {
      "en": "A considered addition to the daily care shelf. Source-listed details: 28 g · 5 sheets. Final specifications require confirmation. Demo item with an illustrative HKD retail price. Stock and availability are simulated; this is not a real offer for sale.",
      "zh-Hant": "為日常護理角落，添上一份用心。 來源記載：28 克 · 5 片。 最終規格仍待確認。 示範商品，港幣售價僅供展示。庫存與供貨狀態均為模擬，並非實際銷售要約。",
      "zh-Hans": "为日常护理角落，添上一份用心。 来源记载：28 克 · 5 片。 最终规格仍待确认。 示范商品，港币售价仅供展示。库存与供货状态均为模拟，并非实际销售要约。",
      "ja": "日々のケアに、丁寧に選ぶ一品。 資料に記載された仕様：28 g · 5枚。 最終仕様は確認待ちです。 デモ商品です。香港ドルの価格は表示例です。在庫と販売状況は架空であり、実際の販売ではありません。"
    },
    "priceAmount": 9800,
    "image": "/products/supplier-demo/mdxy-4.webp"
  },
  {
    "id": "23bf9f19-f434-5659-a8f3-ee7f412c08d2",
    "reference": "MDXY-5",
    "slug": "supplier-mdxy-5",
    "category": "Beauty & personal care",
    "titles": {
      "en": "Facial sheet masks · gold box",
      "zh-Hant": "片裝面膜・金盒",
      "zh-Hans": "片装面膜・金盒",
      "ja": "シートマスク・金色の箱"
    },
    "descriptions": {
      "en": "A considered addition to the daily care shelf. Source-listed details: 5 sheets. Final specifications require confirmation. Demo item with an illustrative HKD retail price. Stock and availability are simulated; this is not a real offer for sale.",
      "zh-Hant": "為日常護理角落，添上一份用心。 來源記載：5 片。 最終規格仍待確認。 示範商品，港幣售價僅供展示。庫存與供貨狀態均為模擬，並非實際銷售要約。",
      "zh-Hans": "为日常护理角落，添上一份用心。 来源记载：5 片。 最终规格仍待确认。 示范商品，港币售价仅供展示。库存与供货状态均为模拟，并非实际销售要约。",
      "ja": "日々のケアに、丁寧に選ぶ一品。 資料に記載された仕様：5枚。 最終仕様は確認待ちです。 デモ商品です。香港ドルの価格は表示例です。在庫と販売状況は架空であり、実際の販売ではありません。"
    },
    "priceAmount": 11800,
    "image": "/products/supplier-demo/mdxy-5.webp"
  },
  {
    "id": "e7f02882-e1bc-5352-b83b-ae0399a66d68",
    "reference": "MDXY-6",
    "slug": "supplier-mdxy-6",
    "category": "Beauty & personal care",
    "titles": {
      "en": "Facial lotion · 100 g",
      "zh-Hant": "面部乳液・100 克",
      "zh-Hans": "面部乳液・100 克",
      "ja": "フェイスローション・100 g"
    },
    "descriptions": {
      "en": "A considered addition to the daily care shelf. Source-listed details: 100 g. Final specifications require confirmation. Demo item with an illustrative HKD retail price. Stock and availability are simulated; this is not a real offer for sale.",
      "zh-Hant": "為日常護理角落，添上一份用心。 來源記載：100 克。 最終規格仍待確認。 示範商品，港幣售價僅供展示。庫存與供貨狀態均為模擬，並非實際銷售要約。",
      "zh-Hans": "为日常护理角落，添上一份用心。 来源记载：100 克。 最终规格仍待确认。 示范商品，港币售价仅供展示。库存与供货状态均为模拟，并非实际销售要约。",
      "ja": "日々のケアに、丁寧に選ぶ一品。 資料に記載された仕様：100 g。 最終仕様は確認待ちです。 デモ商品です。香港ドルの価格は表示例です。在庫と販売状況は架空であり、実際の販売ではありません。"
    },
    "priceAmount": 16800,
    "image": "/products/supplier-demo/mdxy-6.webp"
  },
  {
    "id": "e20973c5-07f5-59d4-9dd9-3152e0f25ae9",
    "reference": "MDXY-7",
    "slug": "supplier-mdxy-7",
    "category": "Beauty & personal care",
    "titles": {
      "en": "Facial cleanser · 100 g",
      "zh-Hant": "潔面乳・100 克",
      "zh-Hans": "洁面乳・100 克",
      "ja": "洗顔料・100 g"
    },
    "descriptions": {
      "en": "A considered addition to the daily care shelf. Source-listed details: 100 g. Final specifications require confirmation. Demo item with an illustrative HKD retail price. Stock and availability are simulated; this is not a real offer for sale.",
      "zh-Hant": "為日常護理角落，添上一份用心。 來源記載：100 克。 最終規格仍待確認。 示範商品，港幣售價僅供展示。庫存與供貨狀態均為模擬，並非實際銷售要約。",
      "zh-Hans": "为日常护理角落，添上一份用心。 来源记载：100 克。 最终规格仍待确认。 示范商品，港币售价仅供展示。库存与供货状态均为模拟，并非实际销售要约。",
      "ja": "日々のケアに、丁寧に選ぶ一品。 資料に記載された仕様：100 g。 最終仕様は確認待ちです。 デモ商品です。香港ドルの価格は表示例です。在庫と販売状況は架空であり、実際の販売ではありません。"
    },
    "priceAmount": 8800,
    "image": "/products/supplier-demo/mdxy-7.webp"
  },
  {
    "id": "fd6d3cc4-3638-57f9-abf0-f28fdb3f4b92",
    "reference": "MDXY-8",
    "slug": "supplier-mdxy-8",
    "category": "Beauty & personal care",
    "titles": {
      "en": "Sunscreen · 50 g",
      "zh-Hant": "防曬霜・50 克",
      "zh-Hans": "防晒霜・50 克",
      "ja": "日焼け止め・50 g"
    },
    "descriptions": {
      "en": "A considered addition to the daily care shelf. Source-listed details: 50 g. Final specifications require confirmation. Demo item with an illustrative HKD retail price. Stock and availability are simulated; this is not a real offer for sale.",
      "zh-Hant": "為日常護理角落，添上一份用心。 來源記載：50 克。 最終規格仍待確認。 示範商品，港幣售價僅供展示。庫存與供貨狀態均為模擬，並非實際銷售要約。",
      "zh-Hans": "为日常护理角落，添上一份用心。 来源记载：50 克。 最终规格仍待确认。 示范商品，港币售价仅供展示。库存与供货状态均为模拟，并非实际销售要约。",
      "ja": "日々のケアに、丁寧に選ぶ一品。 資料に記載された仕様：50 g。 最終仕様は確認待ちです。 デモ商品です。香港ドルの価格は表示例です。在庫と販売状況は架空であり、実際の販売ではありません。"
    },
    "priceAmount": 13800,
    "image": "/products/supplier-demo/mdxy-8.webp"
  },
  {
    "id": "47dfb052-ff2d-5692-bfd5-a6ddc13350e1",
    "reference": "MDXY-9",
    "slug": "supplier-mdxy-9",
    "category": "Beauty & personal care",
    "titles": {
      "en": "Lip oil · shade 102",
      "zh-Hant": "唇油・色號 102",
      "zh-Hans": "唇油・色号 102",
      "ja": "リップオイル・102番"
    },
    "descriptions": {
      "en": "A considered addition to the daily care shelf. Source-listed details: Shade 102. Final specifications require confirmation. Demo item with an illustrative HKD retail price. Stock and availability are simulated; this is not a real offer for sale.",
      "zh-Hant": "為日常護理角落，添上一份用心。 來源記載：色號 102。 最終規格仍待確認。 示範商品，港幣售價僅供展示。庫存與供貨狀態均為模擬，並非實際銷售要約。",
      "zh-Hans": "为日常护理角落，添上一份用心。 来源记载：色号 102。 最终规格仍待确认。 示范商品，港币售价仅供展示。库存与供货状态均为模拟，并非实际销售要约。",
      "ja": "日々のケアに、丁寧に選ぶ一品。 資料に記載された仕様：色番号 102。 最終仕様は確認待ちです。 デモ商品です。香港ドルの価格は表示例です。在庫と販売状況は架空であり、実際の販売ではありません。"
    },
    "priceAmount": 9800,
    "image": "/products/supplier-demo/mdxy-9.webp"
  },
  {
    "id": "09642637-f66a-5078-be31-796f52cdc6c6",
    "reference": "FOOTWEAR-25A22-1",
    "slug": "supplier-footwear-25a22-1",
    "category": "Footwear",
    "titles": {
      "en": "Plush platform shoes · 25A22-1",
      "zh-Hant": "絨面厚底鞋 · 25A22-1",
      "zh-Hans": "绒面厚底鞋 · 25A22-1",
      "ja": "起毛風厚底シューズ · 25A22-1"
    },
    "descriptions": {
      "en": "Explore a new silhouette for your everyday wardrobe. Source-listed details: Sizes: 34–41. Final specifications require confirmation. Demo item with an illustrative HKD retail price. Stock and availability are simulated; this is not a real offer for sale.",
      "zh-Hant": "為日常衣櫥，探索新的鞋履輪廓。 來源記載：尺碼：34–41。 最終規格仍待確認。 示範商品，港幣售價僅供展示。庫存與供貨狀態均為模擬，並非實際銷售要約。",
      "zh-Hans": "为日常衣橱，探索新的鞋履轮廓。 来源记载：尺码：34–41。 最终规格仍待确认。 示范商品，港币售价仅供展示。库存与供货状态均为模拟，并非实际销售要约。",
      "ja": "いつもの装いに、新しいシルエットを。 資料に記載された仕様：サイズ：34–41。 最終仕様は確認待ちです。 デモ商品です。香港ドルの価格は表示例です。在庫と販売状況は架空であり、実際の販売ではありません。"
    },
    "priceAmount": 29800,
    "image": "/products/supplier-demo/footwear-25a22-1.webp"
  },
  {
    "id": "55039697-4217-5819-b213-350c5e1dd304",
    "reference": "FOOTWEAR-24D09-5",
    "slug": "supplier-footwear-24d09-5",
    "category": "Footwear",
    "titles": {
      "en": "Plush Mary Jane shoes · 24D09-5",
      "zh-Hant": "絨面瑪麗珍鞋 · 24D09-5",
      "zh-Hans": "绒面玛丽珍鞋 · 24D09-5",
      "ja": "起毛風メリージェーン · 24D09-5"
    },
    "descriptions": {
      "en": "Explore a new silhouette for your everyday wardrobe. Source-listed details: Sizes: 34–41. Final specifications require confirmation. Demo item with an illustrative HKD retail price. Stock and availability are simulated; this is not a real offer for sale.",
      "zh-Hant": "為日常衣櫥，探索新的鞋履輪廓。 來源記載：尺碼：34–41。 最終規格仍待確認。 示範商品，港幣售價僅供展示。庫存與供貨狀態均為模擬，並非實際銷售要約。",
      "zh-Hans": "为日常衣橱，探索新的鞋履轮廓。 来源记载：尺码：34–41。 最终规格仍待确认。 示范商品，港币售价仅供展示。库存与供货状态均为模拟，并非实际销售要约。",
      "ja": "いつもの装いに、新しいシルエットを。 資料に記載された仕様：サイズ：34–41。 最終仕様は確認待ちです。 デモ商品です。香港ドルの価格は表示例です。在庫と販売状況は架空であり、実際の販売ではありません。"
    },
    "priceAmount": 31800,
    "image": "/products/supplier-demo/footwear-24d09-5.webp"
  },
  {
    "id": "282ad2c9-d2a3-56fd-92c5-f521ba6f1631",
    "reference": "FOOTWEAR-25P02-2",
    "slug": "supplier-footwear-25p02-2",
    "category": "Footwear",
    "titles": {
      "en": "Mary Jane shoes · 25P02-2",
      "zh-Hant": "瑪麗珍鞋 · 25P02-2",
      "zh-Hans": "玛丽珍鞋 · 25P02-2",
      "ja": "メリージェーン · 25P02-2"
    },
    "descriptions": {
      "en": "Explore a new silhouette for your everyday wardrobe. Source-listed details: Sizes: 34–41. Final specifications require confirmation. Demo item with an illustrative HKD retail price. Stock and availability are simulated; this is not a real offer for sale.",
      "zh-Hant": "為日常衣櫥，探索新的鞋履輪廓。 來源記載：尺碼：34–41。 最終規格仍待確認。 示範商品，港幣售價僅供展示。庫存與供貨狀態均為模擬，並非實際銷售要約。",
      "zh-Hans": "为日常衣橱，探索新的鞋履轮廓。 来源记载：尺码：34–41。 最终规格仍待确认。 示范商品，港币售价仅供展示。库存与供货状态均为模拟，并非实际销售要约。",
      "ja": "いつもの装いに、新しいシルエットを。 資料に記載された仕様：サイズ：34–41。 最終仕様は確認待ちです。 デモ商品です。香港ドルの価格は表示例です。在庫と販売状況は架空であり、実際の販売ではありません。"
    },
    "priceAmount": 33800,
    "image": "/products/supplier-demo/footwear-25p02-2.webp"
  },
  {
    "id": "a22809f5-38fd-5aec-a7d7-791a23488649",
    "reference": "FOOTWEAR-23A38A-2",
    "slug": "supplier-footwear-23a38a-2",
    "category": "Footwear",
    "titles": {
      "en": "Patterned knit tall boots · 23A38A-2",
      "zh-Hant": "織紋長靴 · 23A38A-2",
      "zh-Hans": "织纹长靴 · 23A38A-2",
      "ja": "編み柄ロングブーツ · 23A38A-2"
    },
    "descriptions": {
      "en": "Explore a new silhouette for your everyday wardrobe. Source-listed details: Sizes: 34–41. Final specifications require confirmation. Demo item with an illustrative HKD retail price. Stock and availability are simulated; this is not a real offer for sale.",
      "zh-Hant": "為日常衣櫥，探索新的鞋履輪廓。 來源記載：尺碼：34–41。 最終規格仍待確認。 示範商品，港幣售價僅供展示。庫存與供貨狀態均為模擬，並非實際銷售要約。",
      "zh-Hans": "为日常衣橱，探索新的鞋履轮廓。 来源记载：尺码：34–41。 最终规格仍待确认。 示范商品，港币售价仅供展示。库存与供货状态均为模拟，并非实际销售要约。",
      "ja": "いつもの装いに、新しいシルエットを。 資料に記載された仕様：サイズ：34–41。 最終仕様は確認待ちです。 デモ商品です。香港ドルの価格は表示例です。在庫と販売状況は架空であり、実際の販売ではありません。"
    },
    "priceAmount": 55800,
    "image": "/products/supplier-demo/footwear-23a38a-2.webp"
  },
  {
    "id": "f5ed4c26-ed39-5d57-8148-41fdcad929b2",
    "reference": "FOOTWEAR-2020A1-8",
    "slug": "supplier-footwear-2020a1-8",
    "category": "Footwear",
    "titles": {
      "en": "Plush ankle boots · 2020A1-8",
      "zh-Hant": "絨面短靴 · 2020A1-8",
      "zh-Hans": "绒面短靴 · 2020A1-8",
      "ja": "起毛風アンクルブーツ · 2020A1-8"
    },
    "descriptions": {
      "en": "Explore a new silhouette for your everyday wardrobe. Source-listed details: Size range requires confirmation. Final specifications require confirmation. Demo item with an illustrative HKD retail price. Stock and availability are simulated; this is not a real offer for sale.",
      "zh-Hant": "為日常衣櫥，探索新的鞋履輪廓。 來源記載：尺碼範圍待確認。 最終規格仍待確認。 示範商品，港幣售價僅供展示。庫存與供貨狀態均為模擬，並非實際銷售要約。",
      "zh-Hans": "为日常衣橱，探索新的鞋履轮廓。 来源记载：尺码范围待确认。 最终规格仍待确认。 示范商品，港币售价仅供展示。库存与供货状态均为模拟，并非实际销售要约。",
      "ja": "いつもの装いに、新しいシルエットを。 資料に記載された仕様：サイズは確認待ちです。 最終仕様は確認待ちです。 デモ商品です。香港ドルの価格は表示例です。在庫と販売状況は架空であり、実際の販売ではありません。"
    },
    "priceAmount": 39800,
    "image": "/products/supplier-demo/footwear-2020a1-8.webp"
  },
  {
    "id": "7b097a0b-0ff2-56e8-96dd-164dd3696104",
    "reference": "FOOTWEAR-2020A1-7",
    "slug": "supplier-footwear-2020a1-7",
    "category": "Footwear",
    "titles": {
      "en": "Sport-style Chelsea boots · 2020A1-7",
      "zh-Hant": "運動風切爾西靴 · 2020A1-7",
      "zh-Hans": "运动风切尔西靴 · 2020A1-7",
      "ja": "スポーティーなチェルシーブーツ · 2020A1-7"
    },
    "descriptions": {
      "en": "Explore a new silhouette for your everyday wardrobe. Source-listed details: Size range requires confirmation. Final specifications require confirmation. Demo item with an illustrative HKD retail price. Stock and availability are simulated; this is not a real offer for sale.",
      "zh-Hant": "為日常衣櫥，探索新的鞋履輪廓。 來源記載：尺碼範圍待確認。 最終規格仍待確認。 示範商品，港幣售價僅供展示。庫存與供貨狀態均為模擬，並非實際銷售要約。",
      "zh-Hans": "为日常衣橱，探索新的鞋履轮廓。 来源记载：尺码范围待确认。 最终规格仍待确认。 示范商品，港币售价仅供展示。库存与供货状态均为模拟，并非实际销售要约。",
      "ja": "いつもの装いに、新しいシルエットを。 資料に記載された仕様：サイズは確認待ちです。 最終仕様は確認待ちです。 デモ商品です。香港ドルの価格は表示例です。在庫と販売状況は架空であり、実際の販売ではありません。"
    },
    "priceAmount": 41800,
    "image": "/products/supplier-demo/footwear-2020a1-7.webp"
  },
  {
    "id": "c777d992-57c2-5195-b599-bdebc5e0c4e5",
    "reference": "FOOTWEAR-2020A1-6",
    "slug": "supplier-footwear-2020a1-6",
    "category": "Footwear",
    "titles": {
      "en": "Round-toe platform ankle boots · 2020A1-6",
      "zh-Hant": "圓頭厚底短靴 · 2020A1-6",
      "zh-Hans": "圆头厚底短靴 · 2020A1-6",
      "ja": "ラウンドトゥ厚底アンクルブーツ · 2020A1-6"
    },
    "descriptions": {
      "en": "Explore a new silhouette for your everyday wardrobe. Source-listed details: Size range requires confirmation. Final specifications require confirmation. Demo item with an illustrative HKD retail price. Stock and availability are simulated; this is not a real offer for sale.",
      "zh-Hant": "為日常衣櫥，探索新的鞋履輪廓。 來源記載：尺碼範圍待確認。 最終規格仍待確認。 示範商品，港幣售價僅供展示。庫存與供貨狀態均為模擬，並非實際銷售要約。",
      "zh-Hans": "为日常衣橱，探索新的鞋履轮廓。 来源记载：尺码范围待确认。 最终规格仍待确认。 示范商品，港币售价仅供展示。库存与供货状态均为模拟，并非实际销售要约。",
      "ja": "いつもの装いに、新しいシルエットを。 資料に記載された仕様：サイズは確認待ちです。 最終仕様は確認待ちです。 デモ商品です。香港ドルの価格は表示例です。在庫と販売状況は架空であり、実際の販売ではありません。"
    },
    "priceAmount": 43800,
    "image": "/products/supplier-demo/footwear-2020a1-6.webp"
  },
  {
    "id": "bdbc5db6-0b10-55ce-8aea-45e464625f56",
    "reference": "FOOTWEAR-24D09-1",
    "slug": "supplier-footwear-24d09-1",
    "category": "Footwear",
    "titles": {
      "en": "Platform loafers · 24D09-1",
      "zh-Hant": "厚底樂福鞋 · 24D09-1",
      "zh-Hans": "厚底乐福鞋 · 24D09-1",
      "ja": "厚底ローファー · 24D09-1"
    },
    "descriptions": {
      "en": "Explore a new silhouette for your everyday wardrobe. Source-listed details: Size range requires confirmation. Final specifications require confirmation. Demo item with an illustrative HKD retail price. Stock and availability are simulated; this is not a real offer for sale.",
      "zh-Hant": "為日常衣櫥，探索新的鞋履輪廓。 來源記載：尺碼範圍待確認。 最終規格仍待確認。 示範商品，港幣售價僅供展示。庫存與供貨狀態均為模擬，並非實際銷售要約。",
      "zh-Hans": "为日常衣橱，探索新的鞋履轮廓。 来源记载：尺码范围待确认。 最终规格仍待确认。 示范商品，港币售价仅供展示。库存与供货状态均为模拟，并非实际销售要约。",
      "ja": "いつもの装いに、新しいシルエットを。 資料に記載された仕様：サイズは確認待ちです。 最終仕様は確認待ちです。 デモ商品です。香港ドルの価格は表示例です。在庫と販売状況は架空であり、実際の販売ではありません。"
    },
    "priceAmount": 35800,
    "image": "/products/supplier-demo/footwear-24d09-1.webp"
  },
  {
    "id": "12d54cc1-3acc-539b-b0b6-137ff63238ec",
    "reference": "FOOTWEAR-23D12-1",
    "slug": "supplier-footwear-23d12-1",
    "category": "Footwear",
    "titles": {
      "en": "Heart-detail block-heel shoes · 23D12-1",
      "zh-Hant": "愛心飾粗跟鞋 · 23D12-1",
      "zh-Hans": "爱心饰粗跟鞋 · 23D12-1",
      "ja": "ハートモチーフのチャンキーヒールシューズ · 23D12-1"
    },
    "descriptions": {
      "en": "Explore a new silhouette for your everyday wardrobe. Source-listed details: Size range requires confirmation. Final specifications require confirmation. Demo item with an illustrative HKD retail price. Stock and availability are simulated; this is not a real offer for sale.",
      "zh-Hant": "為日常衣櫥，探索新的鞋履輪廓。 來源記載：尺碼範圍待確認。 最終規格仍待確認。 示範商品，港幣售價僅供展示。庫存與供貨狀態均為模擬，並非實際銷售要約。",
      "zh-Hans": "为日常衣橱，探索新的鞋履轮廓。 来源记载：尺码范围待确认。 最终规格仍待确认。 示范商品，港币售价仅供展示。库存与供货状态均为模拟，并非实际销售要约。",
      "ja": "いつもの装いに、新しいシルエットを。 資料に記載された仕様：サイズは確認待ちです。 最終仕様は確認待ちです。 デモ商品です。香港ドルの価格は表示例です。在庫と販売状況は架空であり、実際の販売ではありません。"
    },
    "priceAmount": 29800,
    "image": "/products/supplier-demo/footwear-23d12-1.webp"
  },
  {
    "id": "a6e39693-4710-5425-ab6a-bd1dfc881db7",
    "reference": "FOOTWEAR-23A38-1",
    "slug": "supplier-footwear-23a38-1",
    "category": "Footwear",
    "titles": {
      "en": "Plain ankle boots · 23A38-1",
      "zh-Hant": "簡約短靴 · 23A38-1",
      "zh-Hans": "简约短靴 · 23A38-1",
      "ja": "シンプルなアンクルブーツ · 23A38-1"
    },
    "descriptions": {
      "en": "Explore a new silhouette for your everyday wardrobe. Source-listed details: Size range requires confirmation. Final specifications require confirmation. Demo item with an illustrative HKD retail price. Stock and availability are simulated; this is not a real offer for sale.",
      "zh-Hant": "為日常衣櫥，探索新的鞋履輪廓。 來源記載：尺碼範圍待確認。 最終規格仍待確認。 示範商品，港幣售價僅供展示。庫存與供貨狀態均為模擬，並非實際銷售要約。",
      "zh-Hans": "为日常衣橱，探索新的鞋履轮廓。 来源记载：尺码范围待确认。 最终规格仍待确认。 示范商品，港币售价仅供展示。库存与供货状态均为模拟，并非实际销售要约。",
      "ja": "いつもの装いに、新しいシルエットを。 資料に記載された仕様：サイズは確認待ちです。 最終仕様は確認待ちです。 デモ商品です。香港ドルの価格は表示例です。在庫と販売状況は架空であり、実際の販売ではありません。"
    },
    "priceAmount": 41800,
    "image": "/products/supplier-demo/footwear-23a38-1.webp"
  },
  {
    "id": "750dfbd9-ca8e-583b-8188-b7730d2af17d",
    "reference": "FOOTWEAR-23A35-1",
    "slug": "supplier-footwear-23a35-1",
    "category": "Footwear",
    "titles": {
      "en": "Textured ankle boots · 23A35-1",
      "zh-Hant": "織紋短靴 · 23A35-1",
      "zh-Hans": "织纹短靴 · 23A35-1",
      "ja": "テクスチャーアンクルブーツ · 23A35-1"
    },
    "descriptions": {
      "en": "Explore a new silhouette for your everyday wardrobe. Source-listed details: Size range requires confirmation. Final specifications require confirmation. Demo item with an illustrative HKD retail price. Stock and availability are simulated; this is not a real offer for sale.",
      "zh-Hant": "為日常衣櫥，探索新的鞋履輪廓。 來源記載：尺碼範圍待確認。 最終規格仍待確認。 示範商品，港幣售價僅供展示。庫存與供貨狀態均為模擬，並非實際銷售要約。",
      "zh-Hans": "为日常衣橱，探索新的鞋履轮廓。 来源记载：尺码范围待确认。 最终规格仍待确认。 示范商品，港币售价仅供展示。库存与供货状态均为模拟，并非实际销售要约。",
      "ja": "いつもの装いに、新しいシルエットを。 資料に記載された仕様：サイズは確認待ちです。 最終仕様は確認待ちです。 デモ商品です。香港ドルの価格は表示例です。在庫と販売状況は架空であり、実際の販売ではありません。"
    },
    "priceAmount": 43800,
    "image": "/products/supplier-demo/footwear-23a35-1.webp"
  },
  {
    "id": "65dea789-4af8-5a4c-873d-1d13302bf1dd",
    "reference": "FOOTWEAR-23A15H-2",
    "slug": "supplier-footwear-23a15h-2",
    "category": "Footwear",
    "titles": {
      "en": "Embellished ankle boots · 23A15H-2",
      "zh-Hant": "飾石短靴 · 23A15H-2",
      "zh-Hans": "饰石短靴 · 23A15H-2",
      "ja": "装飾付きアンクルブーツ · 23A15H-2"
    },
    "descriptions": {
      "en": "Explore a new silhouette for your everyday wardrobe. Source-listed details: Size range requires confirmation. Final specifications require confirmation. Demo item with an illustrative HKD retail price. Stock and availability are simulated; this is not a real offer for sale.",
      "zh-Hant": "為日常衣櫥，探索新的鞋履輪廓。 來源記載：尺碼範圍待確認。 最終規格仍待確認。 示範商品，港幣售價僅供展示。庫存與供貨狀態均為模擬，並非實際銷售要約。",
      "zh-Hans": "为日常衣橱，探索新的鞋履轮廓。 来源记载：尺码范围待确认。 最终规格仍待确认。 示范商品，港币售价仅供展示。库存与供货状态均为模拟，并非实际销售要约。",
      "ja": "いつもの装いに、新しいシルエットを。 資料に記載された仕様：サイズは確認待ちです。 最終仕様は確認待ちです。 デモ商品です。香港ドルの価格は表示例です。在庫と販売状況は架空であり、実際の販売ではありません。"
    },
    "priceAmount": 45800,
    "image": "/products/supplier-demo/footwear-23a15h-2.webp"
  },
  {
    "id": "9d257bca-7cfc-5a70-8767-2380350d80ee",
    "reference": "FOOTWEAR-23A15H-1",
    "slug": "supplier-footwear-23a15h-1",
    "category": "Footwear",
    "titles": {
      "en": "Denim-look boots · 23A15H-1",
      "zh-Hant": "丹寧風長靴 · 23A15H-1",
      "zh-Hans": "丹宁风长靴 · 23A15H-1",
      "ja": "デニム調ブーツ · 23A15H-1"
    },
    "descriptions": {
      "en": "Explore a new silhouette for your everyday wardrobe. Source-listed details: Size range requires confirmation. Final specifications require confirmation. Demo item with an illustrative HKD retail price. Stock and availability are simulated; this is not a real offer for sale.",
      "zh-Hant": "為日常衣櫥，探索新的鞋履輪廓。 來源記載：尺碼範圍待確認。 最終規格仍待確認。 示範商品，港幣售價僅供展示。庫存與供貨狀態均為模擬，並非實際銷售要約。",
      "zh-Hans": "为日常衣橱，探索新的鞋履轮廓。 来源记载：尺码范围待确认。 最终规格仍待确认。 示范商品，港币售价仅供展示。库存与供货状态均为模拟，并非实际销售要约。",
      "ja": "いつもの装いに、新しいシルエットを。 資料に記載された仕様：サイズは確認待ちです。 最終仕様は確認待ちです。 デモ商品です。香港ドルの価格は表示例です。在庫と販売状況は架空であり、実際の販売ではありません。"
    },
    "priceAmount": 39800,
    "image": "/products/supplier-demo/footwear-23a15h-1.webp"
  },
  {
    "id": "ea9ee0e9-0687-5276-9714-902757841b64",
    "reference": "FOOTWEAR-23A12-1",
    "slug": "supplier-footwear-23a12-1",
    "category": "Footwear",
    "titles": {
      "en": "Heart-detail ankle boots · 23A12-1",
      "zh-Hant": "愛心飾短靴 · 23A12-1",
      "zh-Hans": "爱心饰短靴 · 23A12-1",
      "ja": "ハートモチーフのアンクルブーツ · 23A12-1"
    },
    "descriptions": {
      "en": "Explore a new silhouette for your everyday wardrobe. Source-listed details: Size range requires confirmation. Final specifications require confirmation. Demo item with an illustrative HKD retail price. Stock and availability are simulated; this is not a real offer for sale.",
      "zh-Hant": "為日常衣櫥，探索新的鞋履輪廓。 來源記載：尺碼範圍待確認。 最終規格仍待確認。 示範商品，港幣售價僅供展示。庫存與供貨狀態均為模擬，並非實際銷售要約。",
      "zh-Hans": "为日常衣橱，探索新的鞋履轮廓。 来源记载：尺码范围待确认。 最终规格仍待确认。 示范商品，港币售价仅供展示。库存与供货状态均为模拟，并非实际销售要约。",
      "ja": "いつもの装いに、新しいシルエットを。 資料に記載された仕様：サイズは確認待ちです。 最終仕様は確認待ちです。 デモ商品です。香港ドルの価格は表示例です。在庫と販売状況は架空であり、実際の販売ではありません。"
    },
    "priceAmount": 41800,
    "image": "/products/supplier-demo/footwear-23a12-1.webp"
  },
  {
    "id": "053d572d-992e-5c47-ba55-e62fddba6b76",
    "reference": "FOOTWEAR-22D58A-1",
    "slug": "supplier-footwear-22d58a-1",
    "category": "Footwear",
    "titles": {
      "en": "Plush casual shoes · 22D58A-1",
      "zh-Hant": "絨面休閒鞋 · 22D58A-1",
      "zh-Hans": "绒面休闲鞋 · 22D58A-1",
      "ja": "起毛風カジュアルシューズ · 22D58A-1"
    },
    "descriptions": {
      "en": "Explore a new silhouette for your everyday wardrobe. Source-listed details: Size range requires confirmation. Final specifications require confirmation. Demo item with an illustrative HKD retail price. Stock and availability are simulated; this is not a real offer for sale.",
      "zh-Hant": "為日常衣櫥，探索新的鞋履輪廓。 來源記載：尺碼範圍待確認。 最終規格仍待確認。 示範商品，港幣售價僅供展示。庫存與供貨狀態均為模擬，並非實際銷售要約。",
      "zh-Hans": "为日常衣橱，探索新的鞋履轮廓。 来源记载：尺码范围待确认。 最终规格仍待确认。 示范商品，港币售价仅供展示。库存与供货状态均为模拟，并非实际销售要约。",
      "ja": "いつもの装いに、新しいシルエットを。 資料に記載された仕様：サイズは確認待ちです。 最終仕様は確認待ちです。 デモ商品です。香港ドルの価格は表示例です。在庫と販売状況は架空であり、実際の販売ではありません。"
    },
    "priceAmount": 33800,
    "image": "/products/supplier-demo/footwear-22d58a-1.webp"
  },
  {
    "id": "59aa0eec-d157-568d-9431-a6c9ef699354",
    "reference": "FOOTWEAR-21A23H-3",
    "slug": "supplier-footwear-21a23h-3",
    "category": "Footwear",
    "titles": {
      "en": "Round-toe over-knee boots · 21A23H-3",
      "zh-Hant": "圓頭過膝靴 · 21A23H-3",
      "zh-Hans": "圆头过膝靴 · 21A23H-3",
      "ja": "ラウンドトゥニーハイブーツ · 21A23H-3"
    },
    "descriptions": {
      "en": "Explore a new silhouette for your everyday wardrobe. Source-listed details: Size range requires confirmation. Final specifications require confirmation. Demo item with an illustrative HKD retail price. Stock and availability are simulated; this is not a real offer for sale.",
      "zh-Hant": "為日常衣櫥，探索新的鞋履輪廓。 來源記載：尺碼範圍待確認。 最終規格仍待確認。 示範商品，港幣售價僅供展示。庫存與供貨狀態均為模擬，並非實際銷售要約。",
      "zh-Hans": "为日常衣橱，探索新的鞋履轮廓。 来源记载：尺码范围待确认。 最终规格仍待确认。 示范商品，港币售价仅供展示。库存与供货状态均为模拟，并非实际销售要约。",
      "ja": "いつもの装いに、新しいシルエットを。 資料に記載された仕様：サイズは確認待ちです。 最終仕様は確認待ちです。 デモ商品です。香港ドルの価格は表示例です。在庫と販売状況は架空であり、実際の販売ではありません。"
    },
    "priceAmount": 55800,
    "image": "/products/supplier-demo/footwear-21a23h-3.webp"
  },
  {
    "id": "5a5fc3c9-dcc6-5f9d-9b6c-42d2c995de24",
    "reference": "FOOTWEAR-9A57-9",
    "slug": "supplier-footwear-9a57-9",
    "category": "Footwear",
    "titles": {
      "en": "Sock-style boots · 9A57-9",
      "zh-Hant": "襪型靴 · 9A57-9",
      "zh-Hans": "袜型靴 · 9A57-9",
      "ja": "ソックス風ブーツ · 9A57-9"
    },
    "descriptions": {
      "en": "Explore a new silhouette for your everyday wardrobe. Source-listed details: Sizes: 34–41. Final specifications require confirmation. Demo item with an illustrative HKD retail price. Stock and availability are simulated; this is not a real offer for sale.",
      "zh-Hant": "為日常衣櫥，探索新的鞋履輪廓。 來源記載：尺碼：34–41。 最終規格仍待確認。 示範商品，港幣售價僅供展示。庫存與供貨狀態均為模擬，並非實際銷售要約。",
      "zh-Hans": "为日常衣橱，探索新的鞋履轮廓。 来源记载：尺码：34–41。 最终规格仍待确认。 示范商品，港币售价仅供展示。库存与供货状态均为模拟，并非实际销售要约。",
      "ja": "いつもの装いに、新しいシルエットを。 資料に記載された仕様：サイズ：34–41。 最終仕様は確認待ちです。 デモ商品です。香港ドルの価格は表示例です。在庫と販売状況は架空であり、実際の販売ではありません。"
    },
    "priceAmount": 39800,
    "image": "/products/supplier-demo/footwear-9a57-9.webp"
  },
  {
    "id": "3f222f26-846c-5161-b7f7-d568e6b6cbb0",
    "reference": "FOOTWEAR-25A18-1",
    "slug": "supplier-footwear-25a18-1",
    "category": "Footwear",
    "titles": {
      "en": "Wedge ankle boots · 25A18-1",
      "zh-Hant": "坡跟短靴 · 25A18-1",
      "zh-Hans": "坡跟短靴 · 25A18-1",
      "ja": "ウェッジアンクルブーツ · 25A18-1"
    },
    "descriptions": {
      "en": "Explore a new silhouette for your everyday wardrobe. Source-listed details: Sizes: 34–41. Final specifications require confirmation. Demo item with an illustrative HKD retail price. Stock and availability are simulated; this is not a real offer for sale.",
      "zh-Hant": "為日常衣櫥，探索新的鞋履輪廓。 來源記載：尺碼：34–41。 最終規格仍待確認。 示範商品，港幣售價僅供展示。庫存與供貨狀態均為模擬，並非實際銷售要約。",
      "zh-Hans": "为日常衣橱，探索新的鞋履轮廓。 来源记载：尺码：34–41。 最终规格仍待确认。 示范商品，港币售价仅供展示。库存与供货状态均为模拟，并非实际销售要约。",
      "ja": "いつもの装いに、新しいシルエットを。 資料に記載された仕様：サイズ：34–41。 最終仕様は確認待ちです。 デモ商品です。香港ドルの価格は表示例です。在庫と販売状況は架空であり、実際の販売ではありません。"
    },
    "priceAmount": 41800,
    "image": "/products/supplier-demo/footwear-25a18-1.webp"
  },
  {
    "id": "02c328a3-2358-5645-891a-025ba3e8f924",
    "reference": "FOOTWEAR-9P65S-2",
    "slug": "supplier-footwear-9p65s-2",
    "category": "Footwear",
    "titles": {
      "en": "Square-toe loafers · 9P65S-2",
      "zh-Hant": "方頭樂福鞋 · 9P65S-2",
      "zh-Hans": "方头乐福鞋 · 9P65S-2",
      "ja": "スクエアトゥローファー · 9P65S-2"
    },
    "descriptions": {
      "en": "Explore a new silhouette for your everyday wardrobe. Source-listed details: Size range requires confirmation. Final specifications require confirmation. Demo item with an illustrative HKD retail price. Stock and availability are simulated; this is not a real offer for sale.",
      "zh-Hant": "為日常衣櫥，探索新的鞋履輪廓。 來源記載：尺碼範圍待確認。 最終規格仍待確認。 示範商品，港幣售價僅供展示。庫存與供貨狀態均為模擬，並非實際銷售要約。",
      "zh-Hans": "为日常衣橱，探索新的鞋履轮廓。 来源记载：尺码范围待确认。 最终规格仍待确认。 示范商品，港币售价仅供展示。库存与供货状态均为模拟，并非实际销售要约。",
      "ja": "いつもの装いに、新しいシルエットを。 資料に記載された仕様：サイズは確認待ちです。 最終仕様は確認待ちです。 デモ商品です。香港ドルの価格は表示例です。在庫と販売状況は架空であり、実際の販売ではありません。"
    },
    "priceAmount": 33800,
    "image": "/products/supplier-demo/footwear-9p65s-2.webp"
  },
  {
    "id": "cb5a15c8-079d-5935-b4de-720f766552b0",
    "reference": "FOOTWEAR-23P20-2",
    "slug": "supplier-footwear-23p20-2",
    "category": "Footwear",
    "titles": {
      "en": "Knit court shoes · 23P20-2",
      "zh-Hant": "針織單鞋 · 23P20-2",
      "zh-Hans": "针织单鞋 · 23P20-2",
      "ja": "ニットパンプス · 23P20-2"
    },
    "descriptions": {
      "en": "Explore a new silhouette for your everyday wardrobe. Source-listed details: Sizes: 34-41. Final specifications require confirmation. Demo item with an illustrative HKD retail price. Stock and availability are simulated; this is not a real offer for sale.",
      "zh-Hant": "為日常衣櫥，探索新的鞋履輪廓。 來源記載：尺碼：34-41。 最終規格仍待確認。 示範商品，港幣售價僅供展示。庫存與供貨狀態均為模擬，並非實際銷售要約。",
      "zh-Hans": "为日常衣橱，探索新的鞋履轮廓。 来源记载：尺码：34-41。 最终规格仍待确认。 示范商品，港币售价仅供展示。库存与供货状态均为模拟，并非实际销售要约。",
      "ja": "いつもの装いに、新しいシルエットを。 資料に記載された仕様：サイズ：34-41。 最終仕様は確認待ちです。 デモ商品です。香港ドルの価格は表示例です。在庫と販売状況は架空であり、実際の販売ではありません。"
    },
    "priceAmount": 35800,
    "image": "/products/supplier-demo/footwear-23p20-2.webp"
  },
  {
    "id": "2bc70f84-8a72-5ff2-b8b7-c22762549d9e",
    "reference": "FOOTWEAR-25P20-2",
    "slug": "supplier-footwear-25p20-2",
    "category": "Footwear",
    "titles": {
      "en": "Embellished mid-heel ballet shoes · 25P20-2",
      "zh-Hant": "飾石中跟芭蕾鞋 · 25P20-2",
      "zh-Hans": "饰石中跟芭蕾鞋 · 25P20-2",
      "ja": "装飾付きミドルヒールバレエシューズ · 25P20-2"
    },
    "descriptions": {
      "en": "Explore a new silhouette for your everyday wardrobe. Source-listed details: Sizes: 34-41. Final specifications require confirmation. Demo item with an illustrative HKD retail price. Stock and availability are simulated; this is not a real offer for sale.",
      "zh-Hant": "為日常衣櫥，探索新的鞋履輪廓。 來源記載：尺碼：34-41。 最終規格仍待確認。 示範商品，港幣售價僅供展示。庫存與供貨狀態均為模擬，並非實際銷售要約。",
      "zh-Hans": "为日常衣橱，探索新的鞋履轮廓。 来源记载：尺码：34-41。 最终规格仍待确认。 示范商品，港币售价仅供展示。库存与供货状态均为模拟，并非实际销售要约。",
      "ja": "いつもの装いに、新しいシルエットを。 資料に記載された仕様：サイズ：34-41。 最終仕様は確認待ちです。 デモ商品です。香港ドルの価格は表示例です。在庫と販売状況は架空であり、実際の販売ではありません。"
    },
    "priceAmount": 29800,
    "image": "/products/supplier-demo/footwear-25p20-2.webp"
  },
  {
    "id": "a5788abd-68f9-5183-bb45-ef0a39353570",
    "reference": "FOOTWEAR-26P09-2",
    "slug": "supplier-footwear-26p09-2",
    "category": "Footwear",
    "titles": {
      "en": "Star-detail wedge shoes · 26P09-2",
      "zh-Hant": "星芒飾坡跟鞋 · 26P09-2",
      "zh-Hans": "星芒饰坡跟鞋 · 26P09-2",
      "ja": "星モチーフのウェッジシューズ · 26P09-2"
    },
    "descriptions": {
      "en": "Explore a new silhouette for your everyday wardrobe. Source-listed details: Sizes: 34-41. Final specifications require confirmation. Demo item with an illustrative HKD retail price. Stock and availability are simulated; this is not a real offer for sale.",
      "zh-Hant": "為日常衣櫥，探索新的鞋履輪廓。 來源記載：尺碼：34-41。 最終規格仍待確認。 示範商品，港幣售價僅供展示。庫存與供貨狀態均為模擬，並非實際銷售要約。",
      "zh-Hans": "为日常衣橱，探索新的鞋履轮廓。 来源记载：尺码：34-41。 最终规格仍待确认。 示范商品，港币售价仅供展示。库存与供货状态均为模拟，并非实际销售要约。",
      "ja": "いつもの装いに、新しいシルエットを。 資料に記載された仕様：サイズ：34-41。 最終仕様は確認待ちです。 デモ商品です。香港ドルの価格は表示例です。在庫と販売状況は架空であり、実際の販売ではありません。"
    },
    "priceAmount": 31800,
    "image": "/products/supplier-demo/footwear-26p09-2.webp"
  },
  {
    "id": "40d4af39-0b42-56ab-9641-f4a8daa4fabd",
    "reference": "FOOTWEAR-25P06-2",
    "slug": "supplier-footwear-25p06-2",
    "category": "Footwear",
    "titles": {
      "en": "Plain wedge shoes · 25P06-2",
      "zh-Hant": "簡約坡跟鞋 · 25P06-2",
      "zh-Hans": "简约坡跟鞋 · 25P06-2",
      "ja": "シンプルなウェッジシューズ · 25P06-2"
    },
    "descriptions": {
      "en": "Explore a new silhouette for your everyday wardrobe. Source-listed details: Sizes: 34-41. Final specifications require confirmation. Demo item with an illustrative HKD retail price. Stock and availability are simulated; this is not a real offer for sale.",
      "zh-Hant": "為日常衣櫥，探索新的鞋履輪廓。 來源記載：尺碼：34-41。 最終規格仍待確認。 示範商品，港幣售價僅供展示。庫存與供貨狀態均為模擬，並非實際銷售要約。",
      "zh-Hans": "为日常衣橱，探索新的鞋履轮廓。 来源记载：尺码：34-41。 最终规格仍待确认。 示范商品，港币售价仅供展示。库存与供货状态均为模拟，并非实际销售要约。",
      "ja": "いつもの装いに、新しいシルエットを。 資料に記載された仕様：サイズ：34-41。 最終仕様は確認待ちです。 デモ商品です。香港ドルの価格は表示例です。在庫と販売状況は架空であり、実際の販売ではありません。"
    },
    "priceAmount": 33800,
    "image": "/products/supplier-demo/footwear-25p06-2.webp"
  },
  {
    "id": "7846f7cd-9dee-5145-b3f4-b9c8c3d37f7a",
    "reference": "FOOTWEAR-24P25-1",
    "slug": "supplier-footwear-24p25-1",
    "category": "Footwear",
    "titles": {
      "en": "Pearl-detail wedge shoes · 24P25-1",
      "zh-Hant": "珠飾坡跟鞋 · 24P25-1",
      "zh-Hans": "珠饰坡跟鞋 · 24P25-1",
      "ja": "パール風装飾のウェッジシューズ · 24P25-1"
    },
    "descriptions": {
      "en": "Explore a new silhouette for your everyday wardrobe. Source-listed details: Size range requires confirmation. Final specifications require confirmation. Demo item with an illustrative HKD retail price. Stock and availability are simulated; this is not a real offer for sale.",
      "zh-Hant": "為日常衣櫥，探索新的鞋履輪廓。 來源記載：尺碼範圍待確認。 最終規格仍待確認。 示範商品，港幣售價僅供展示。庫存與供貨狀態均為模擬，並非實際銷售要約。",
      "zh-Hans": "为日常衣橱，探索新的鞋履轮廓。 来源记载：尺码范围待确认。 最终规格仍待确认。 示范商品，港币售价仅供展示。库存与供货状态均为模拟，并非实际销售要约。",
      "ja": "いつもの装いに、新しいシルエットを。 資料に記載された仕様：サイズは確認待ちです。 最終仕様は確認待ちです。 デモ商品です。香港ドルの価格は表示例です。在庫と販売状況は架空であり、実際の販売ではありません。"
    },
    "priceAmount": 35800,
    "image": "/products/supplier-demo/footwear-24p25-1.webp"
  },
  {
    "id": "c753d3c5-9f78-56f3-b4d2-deaa0bb52947",
    "reference": "FOOTWEAR-25P10-3",
    "slug": "supplier-footwear-25p10-3",
    "category": "Footwear",
    "titles": {
      "en": "Embellished ballet shoes · 25P10-3",
      "zh-Hant": "飾石芭蕾鞋 · 25P10-3",
      "zh-Hans": "饰石芭蕾鞋 · 25P10-3",
      "ja": "装飾付きバレエシューズ · 25P10-3"
    },
    "descriptions": {
      "en": "Explore a new silhouette for your everyday wardrobe. Source-listed details: Sizes: 34-41. Final specifications require confirmation. Demo item with an illustrative HKD retail price. Stock and availability are simulated; this is not a real offer for sale.",
      "zh-Hant": "為日常衣櫥，探索新的鞋履輪廓。 來源記載：尺碼：34-41。 最終規格仍待確認。 示範商品，港幣售價僅供展示。庫存與供貨狀態均為模擬，並非實際銷售要約。",
      "zh-Hans": "为日常衣橱，探索新的鞋履轮廓。 来源记载：尺码：34-41。 最终规格仍待确认。 示范商品，港币售价仅供展示。库存与供货状态均为模拟，并非实际销售要约。",
      "ja": "いつもの装いに、新しいシルエットを。 資料に記載された仕様：サイズ：34-41。 最終仕様は確認待ちです。 デモ商品です。香港ドルの価格は表示例です。在庫と販売状況は架空であり、実際の販売ではありません。"
    },
    "priceAmount": 29800,
    "image": "/products/supplier-demo/footwear-25p10-3.webp"
  },
  {
    "id": "da1e0e71-e070-5084-9df6-609968f217a7",
    "reference": "FOOTWEAR-24P20-6",
    "slug": "supplier-footwear-24p20-6",
    "category": "Footwear",
    "titles": {
      "en": "Butterfly-detail shoes · 24P20-6",
      "zh-Hant": "蝶飾單鞋 · 24P20-6",
      "zh-Hans": "蝶饰单鞋 · 24P20-6",
      "ja": "蝶モチーフのパンプス · 24P20-6"
    },
    "descriptions": {
      "en": "Explore a new silhouette for your everyday wardrobe. Source-listed details: Size range requires confirmation. Final specifications require confirmation. Demo item with an illustrative HKD retail price. Stock and availability are simulated; this is not a real offer for sale.",
      "zh-Hant": "為日常衣櫥，探索新的鞋履輪廓。 來源記載：尺碼範圍待確認。 最終規格仍待確認。 示範商品，港幣售價僅供展示。庫存與供貨狀態均為模擬，並非實際銷售要約。",
      "zh-Hans": "为日常衣橱，探索新的鞋履轮廓。 来源记载：尺码范围待确认。 最终规格仍待确认。 示范商品，港币售价仅供展示。库存与供货状态均为模拟，并非实际销售要约。",
      "ja": "いつもの装いに、新しいシルエットを。 資料に記載された仕様：サイズは確認待ちです。 最終仕様は確認待ちです。 デモ商品です。香港ドルの価格は表示例です。在庫と販売状況は架空であり、実際の販売ではありません。"
    },
    "priceAmount": 31800,
    "image": "/products/supplier-demo/footwear-24p20-6.webp"
  },
  {
    "id": "27870d26-57f7-584f-a0f2-b1a77272bfe8",
    "reference": "FOOTWEAR-20P18-6",
    "slug": "supplier-footwear-20p18-6",
    "category": "Footwear",
    "titles": {
      "en": "Classic wedge shoes · 20P18-6",
      "zh-Hant": "經典坡跟鞋 · 20P18-6",
      "zh-Hans": "经典坡跟鞋 · 20P18-6",
      "ja": "クラシックなウェッジシューズ · 20P18-6"
    },
    "descriptions": {
      "en": "Explore a new silhouette for your everyday wardrobe. Source-listed details: Size range requires confirmation. Final specifications require confirmation. Demo item with an illustrative HKD retail price. Stock and availability are simulated; this is not a real offer for sale.",
      "zh-Hant": "為日常衣櫥，探索新的鞋履輪廓。 來源記載：尺碼範圍待確認。 最終規格仍待確認。 示範商品，港幣售價僅供展示。庫存與供貨狀態均為模擬，並非實際銷售要約。",
      "zh-Hans": "为日常衣橱，探索新的鞋履轮廓。 来源记载：尺码范围待确认。 最终规格仍待确认。 示范商品，港币售价仅供展示。库存与供货状态均为模拟，并非实际销售要约。",
      "ja": "いつもの装いに、新しいシルエットを。 資料に記載された仕様：サイズは確認待ちです。 最終仕様は確認待ちです。 デモ商品です。香港ドルの価格は表示例です。在庫と販売状況は架空であり、実際の販売ではありません。"
    },
    "priceAmount": 33800,
    "image": "/products/supplier-demo/footwear-20p18-6.webp"
  },
  {
    "id": "17ea7aef-8bbd-5420-adf0-edd07bf512d6",
    "reference": "FOOTWEAR-20P18-5",
    "slug": "supplier-footwear-20p18-5",
    "category": "Footwear",
    "titles": {
      "en": "Heart-detail wedge shoes · 20P18-5",
      "zh-Hant": "愛心飾坡跟鞋 · 20P18-5",
      "zh-Hans": "爱心饰坡跟鞋 · 20P18-5",
      "ja": "ハートモチーフのウェッジシューズ · 20P18-5"
    },
    "descriptions": {
      "en": "Explore a new silhouette for your everyday wardrobe. Source-listed details: Size range requires confirmation. Final specifications require confirmation. Demo item with an illustrative HKD retail price. Stock and availability are simulated; this is not a real offer for sale.",
      "zh-Hant": "為日常衣櫥，探索新的鞋履輪廓。 來源記載：尺碼範圍待確認。 最終規格仍待確認。 示範商品，港幣售價僅供展示。庫存與供貨狀態均為模擬，並非實際銷售要約。",
      "zh-Hans": "为日常衣橱，探索新的鞋履轮廓。 来源记载：尺码范围待确认。 最终规格仍待确认。 示范商品，港币售价仅供展示。库存与供货状态均为模拟，并非实际销售要约。",
      "ja": "いつもの装いに、新しいシルエットを。 資料に記載された仕様：サイズは確認待ちです。 最終仕様は確認待ちです。 デモ商品です。香港ドルの価格は表示例です。在庫と販売状況は架空であり、実際の販売ではありません。"
    },
    "priceAmount": 35800,
    "image": "/products/supplier-demo/footwear-20p18-5.webp"
  },
  {
    "id": "99b26843-c54f-5d7c-a9a3-a1b25f1e74f8",
    "reference": "FOOTWEAR-20P18-3",
    "slug": "supplier-footwear-20p18-3",
    "category": "Footwear",
    "titles": {
      "en": "Heart-detail wedge shoes · 20P18-3",
      "zh-Hant": "愛心飾坡跟鞋 · 20P18-3",
      "zh-Hans": "爱心饰坡跟鞋 · 20P18-3",
      "ja": "ハートモチーフのウェッジシューズ · 20P18-3"
    },
    "descriptions": {
      "en": "Explore a new silhouette for your everyday wardrobe. Source-listed details: Size range requires confirmation. Final specifications require confirmation. Demo item with an illustrative HKD retail price. Stock and availability are simulated; this is not a real offer for sale.",
      "zh-Hant": "為日常衣櫥，探索新的鞋履輪廓。 來源記載：尺碼範圍待確認。 最終規格仍待確認。 示範商品，港幣售價僅供展示。庫存與供貨狀態均為模擬，並非實際銷售要約。",
      "zh-Hans": "为日常衣橱，探索新的鞋履轮廓。 来源记载：尺码范围待确认。 最终规格仍待确认。 示范商品，港币售价仅供展示。库存与供货状态均为模拟，并非实际销售要约。",
      "ja": "いつもの装いに、新しいシルエットを。 資料に記載された仕様：サイズは確認待ちです。 最終仕様は確認待ちです。 デモ商品です。香港ドルの価格は表示例です。在庫と販売状況は架空であり、実際の販売ではありません。"
    },
    "priceAmount": 29800,
    "image": "/products/supplier-demo/footwear-20p18-3.webp"
  },
  {
    "id": "eff10e1f-f122-58a7-ac1a-4d78e0801162",
    "reference": "FOOTWEAR-25P01-2",
    "slug": "supplier-footwear-25p01-2",
    "category": "Footwear",
    "titles": {
      "en": "Low-wedge shoes · 25P01-2",
      "zh-Hant": "低坡跟單鞋 · 25P01-2",
      "zh-Hans": "低坡跟单鞋 · 25P01-2",
      "ja": "ローウェッジパンプス · 25P01-2"
    },
    "descriptions": {
      "en": "Explore a new silhouette for your everyday wardrobe. Source-listed details: Sizes: 34-41. Final specifications require confirmation. Demo item with an illustrative HKD retail price. Stock and availability are simulated; this is not a real offer for sale.",
      "zh-Hant": "為日常衣櫥，探索新的鞋履輪廓。 來源記載：尺碼：34-41。 最終規格仍待確認。 示範商品，港幣售價僅供展示。庫存與供貨狀態均為模擬，並非實際銷售要約。",
      "zh-Hans": "为日常衣橱，探索新的鞋履轮廓。 来源记载：尺码：34-41。 最终规格仍待确认。 示范商品，港币售价仅供展示。库存与供货状态均为模拟，并非实际销售要约。",
      "ja": "いつもの装いに、新しいシルエットを。 資料に記載された仕様：サイズ：34-41。 最終仕様は確認待ちです。 デモ商品です。香港ドルの価格は表示例です。在庫と販売状況は架空であり、実際の販売ではありません。"
    },
    "priceAmount": 31800,
    "image": "/products/supplier-demo/footwear-25p01-2.webp"
  },
  {
    "id": "6f4492d6-0798-5158-8874-6f6556a9f033",
    "reference": "FOOTWEAR-25P01-5",
    "slug": "supplier-footwear-25p01-5",
    "category": "Footwear",
    "titles": {
      "en": "Textured low-wedge shoes · 25P01-5",
      "zh-Hant": "織紋低坡跟鞋 · 25P01-5",
      "zh-Hans": "织纹低坡跟鞋 · 25P01-5",
      "ja": "テクスチャーローウェッジシューズ · 25P01-5"
    },
    "descriptions": {
      "en": "Explore a new silhouette for your everyday wardrobe. Source-listed details: Sizes: 34-41. Final specifications require confirmation. Demo item with an illustrative HKD retail price. Stock and availability are simulated; this is not a real offer for sale.",
      "zh-Hant": "為日常衣櫥，探索新的鞋履輪廓。 來源記載：尺碼：34-41。 最終規格仍待確認。 示範商品，港幣售價僅供展示。庫存與供貨狀態均為模擬，並非實際銷售要約。",
      "zh-Hans": "为日常衣橱，探索新的鞋履轮廓。 来源记载：尺码：34-41。 最终规格仍待确认。 示范商品，港币售价仅供展示。库存与供货状态均为模拟，并非实际销售要约。",
      "ja": "いつもの装いに、新しいシルエットを。 資料に記載された仕様：サイズ：34-41。 最終仕様は確認待ちです。 デモ商品です。香港ドルの価格は表示例です。在庫と販売状況は架空であり、実際の販売ではありません。"
    },
    "priceAmount": 33800,
    "image": "/products/supplier-demo/footwear-25p01-5.webp"
  },
  {
    "id": "424fd603-ab9e-5038-815b-d0eacc17a944",
    "reference": "FOOTWEAR-25A09-1",
    "slug": "supplier-footwear-25a09-1",
    "category": "Footwear",
    "titles": {
      "en": "Textured casual trainers · 25A09-1",
      "zh-Hant": "織紋休閒運動鞋 · 25A09-1",
      "zh-Hans": "织纹休闲运动鞋 · 25A09-1",
      "ja": "テクスチャースニーカー · 25A09-1"
    },
    "descriptions": {
      "en": "Explore a new silhouette for your everyday wardrobe. Source-listed details: Sizes: 34-41. Final specifications require confirmation. Demo item with an illustrative HKD retail price. Stock and availability are simulated; this is not a real offer for sale.",
      "zh-Hant": "為日常衣櫥，探索新的鞋履輪廓。 來源記載：尺碼：34-41。 最終規格仍待確認。 示範商品，港幣售價僅供展示。庫存與供貨狀態均為模擬，並非實際銷售要約。",
      "zh-Hans": "为日常衣橱，探索新的鞋履轮廓。 来源记载：尺码：34-41。 最终规格仍待确认。 示范商品，港币售价仅供展示。库存与供货状态均为模拟，并非实际销售要约。",
      "ja": "いつもの装いに、新しいシルエットを。 資料に記載された仕様：サイズ：34-41。 最終仕様は確認待ちです。 デモ商品です。香港ドルの価格は表示例です。在庫と販売状況は架空であり、実際の販売ではありません。"
    },
    "priceAmount": 35800,
    "image": "/products/supplier-demo/footwear-25a09-1.webp"
  },
  {
    "id": "2eb89cac-858a-5930-9c0e-85533c69a153",
    "reference": "FOOTWEAR-20P18-2",
    "slug": "supplier-footwear-20p18-2",
    "category": "Footwear",
    "titles": {
      "en": "Heart-detail wedge shoes · 20P18-2",
      "zh-Hant": "愛心飾坡跟鞋 · 20P18-2",
      "zh-Hans": "爱心饰坡跟鞋 · 20P18-2",
      "ja": "ハートモチーフのウェッジシューズ · 20P18-2"
    },
    "descriptions": {
      "en": "Explore a new silhouette for your everyday wardrobe. Source-listed details: Sizes: 34-41. Final specifications require confirmation. Demo item with an illustrative HKD retail price. Stock and availability are simulated; this is not a real offer for sale.",
      "zh-Hant": "為日常衣櫥，探索新的鞋履輪廓。 來源記載：尺碼：34-41。 最終規格仍待確認。 示範商品，港幣售價僅供展示。庫存與供貨狀態均為模擬，並非實際銷售要約。",
      "zh-Hans": "为日常衣橱，探索新的鞋履轮廓。 来源记载：尺码：34-41。 最终规格仍待确认。 示范商品，港币售价仅供展示。库存与供货状态均为模拟，并非实际销售要约。",
      "ja": "いつもの装いに、新しいシルエットを。 資料に記載された仕様：サイズ：34-41。 最終仕様は確認待ちです。 デモ商品です。香港ドルの価格は表示例です。在庫と販売状況は架空であり、実際の販売ではありません。"
    },
    "priceAmount": 29800,
    "image": "/products/supplier-demo/footwear-20p18-2.webp"
  },
  {
    "id": "6b3ecb45-1179-5494-9f9c-0f67dfc0c4b8",
    "reference": "FOOTWEAR-21D30-1",
    "slug": "supplier-footwear-21d30-1",
    "category": "Footwear",
    "titles": {
      "en": "Heart-detail loafers · 21D30-1",
      "zh-Hant": "愛心飾樂福鞋 · 21D30-1",
      "zh-Hans": "爱心饰乐福鞋 · 21D30-1",
      "ja": "ハートモチーフのローファー · 21D30-1"
    },
    "descriptions": {
      "en": "Explore a new silhouette for your everyday wardrobe. Source-listed details: Sizes: 38-45. Final specifications require confirmation. Demo item with an illustrative HKD retail price. Stock and availability are simulated; this is not a real offer for sale.",
      "zh-Hant": "為日常衣櫥，探索新的鞋履輪廓。 來源記載：尺碼：38-45。 最終規格仍待確認。 示範商品，港幣售價僅供展示。庫存與供貨狀態均為模擬，並非實際銷售要約。",
      "zh-Hans": "为日常衣橱，探索新的鞋履轮廓。 来源记载：尺码：38-45。 最终规格仍待确认。 示范商品，港币售价仅供展示。库存与供货状态均为模拟，并非实际销售要约。",
      "ja": "いつもの装いに、新しいシルエットを。 資料に記載された仕様：サイズ：38-45。 最終仕様は確認待ちです。 デモ商品です。香港ドルの価格は表示例です。在庫と販売状況は架空であり、実際の販売ではありません。"
    },
    "priceAmount": 31800,
    "image": "/products/supplier-demo/footwear-21d30-1.webp"
  },
  {
    "id": "ee6d2a45-65cf-5ca2-bfaf-dbce0ad9a1ce",
    "reference": "FOOTWEAR-20P18-1",
    "slug": "supplier-footwear-20p18-1",
    "category": "Footwear",
    "titles": {
      "en": "Heart-detail wedge shoes · 20P18-1",
      "zh-Hant": "愛心飾坡跟鞋 · 20P18-1",
      "zh-Hans": "爱心饰坡跟鞋 · 20P18-1",
      "ja": "ハートモチーフのウェッジシューズ · 20P18-1"
    },
    "descriptions": {
      "en": "Explore a new silhouette for your everyday wardrobe. Source-listed details: Sizes: 34-41. Final specifications require confirmation. Demo item with an illustrative HKD retail price. Stock and availability are simulated; this is not a real offer for sale.",
      "zh-Hant": "為日常衣櫥，探索新的鞋履輪廓。 來源記載：尺碼：34-41。 最終規格仍待確認。 示範商品，港幣售價僅供展示。庫存與供貨狀態均為模擬，並非實際銷售要約。",
      "zh-Hans": "为日常衣橱，探索新的鞋履轮廓。 来源记载：尺码：34-41。 最终规格仍待确认。 示范商品，港币售价仅供展示。库存与供货状态均为模拟，并非实际销售要约。",
      "ja": "いつもの装いに、新しいシルエットを。 資料に記載された仕様：サイズ：34-41。 最終仕様は確認待ちです。 デモ商品です。香港ドルの価格は表示例です。在庫と販売状況は架空であり、実際の販売ではありません。"
    },
    "priceAmount": 33800,
    "image": "/products/supplier-demo/footwear-20p18-1.webp"
  },
  {
    "id": "fc3f8af7-b38c-5294-944f-16db1a1a5311",
    "reference": "FOOTWEAR-21A28-5",
    "slug": "supplier-footwear-21a28-5",
    "category": "Footwear",
    "titles": {
      "en": "Sport-style wedge ankle boots · 21A28-5",
      "zh-Hant": "運動風坡跟短靴 · 21A28-5",
      "zh-Hans": "运动风坡跟短靴 · 21A28-5",
      "ja": "スポーティーなウェッジアンクルブーツ · 21A28-5"
    },
    "descriptions": {
      "en": "Explore a new silhouette for your everyday wardrobe. Source-listed details: Sizes: 34-41. Final specifications require confirmation. Demo item with an illustrative HKD retail price. Stock and availability are simulated; this is not a real offer for sale.",
      "zh-Hant": "為日常衣櫥，探索新的鞋履輪廓。 來源記載：尺碼：34-41。 最終規格仍待確認。 示範商品，港幣售價僅供展示。庫存與供貨狀態均為模擬，並非實際銷售要約。",
      "zh-Hans": "为日常衣橱，探索新的鞋履轮廓。 来源记载：尺码：34-41。 最终规格仍待确认。 示范商品，港币售价仅供展示。库存与供货状态均为模拟，并非实际销售要约。",
      "ja": "いつもの装いに、新しいシルエットを。 資料に記載された仕様：サイズ：34-41。 最終仕様は確認待ちです。 デモ商品です。香港ドルの価格は表示例です。在庫と販売状況は架空であり、実際の販売ではありません。"
    },
    "priceAmount": 45800,
    "image": "/products/supplier-demo/footwear-21a28-5.webp"
  },
  {
    "id": "0d77e594-0152-5207-ac8b-fe08e11abe2f",
    "reference": "FOOTWEAR-22D58A-2",
    "slug": "supplier-footwear-22d58a-2",
    "category": "Footwear",
    "titles": {
      "en": "Open-knit ballet shoes · 22D58A-2",
      "zh-Hant": "鏤空針織芭蕾鞋 · 22D58A-2",
      "zh-Hans": "镂空针织芭蕾鞋 · 22D58A-2",
      "ja": "透かし編みバレエシューズ · 22D58A-2"
    },
    "descriptions": {
      "en": "Explore a new silhouette for your everyday wardrobe. Source-listed details: Sizes: 34-41. Final specifications require confirmation. Demo item with an illustrative HKD retail price. Stock and availability are simulated; this is not a real offer for sale.",
      "zh-Hant": "為日常衣櫥，探索新的鞋履輪廓。 來源記載：尺碼：34-41。 最終規格仍待確認。 示範商品，港幣售價僅供展示。庫存與供貨狀態均為模擬，並非實際銷售要約。",
      "zh-Hans": "为日常衣橱，探索新的鞋履轮廓。 来源记载：尺码：34-41。 最终规格仍待确认。 示范商品，港币售价仅供展示。库存与供货状态均为模拟，并非实际销售要约。",
      "ja": "いつもの装いに、新しいシルエットを。 資料に記載された仕様：サイズ：34-41。 最終仕様は確認待ちです。 デモ商品です。香港ドルの価格は表示例です。在庫と販売状況は架空であり、実際の販売ではありません。"
    },
    "priceAmount": 29800,
    "image": "/products/supplier-demo/footwear-22d58a-2.webp"
  },
  {
    "id": "d2158720-253b-5db3-b487-103865d6bd99",
    "reference": "FOOTWEAR-25A06-1",
    "slug": "supplier-footwear-25a06-1",
    "category": "Footwear",
    "titles": {
      "en": "Classic ankle boots · 25A06-1",
      "zh-Hant": "經典短靴 · 25A06-1",
      "zh-Hans": "经典短靴 · 25A06-1",
      "ja": "クラシックなアンクルブーツ · 25A06-1"
    },
    "descriptions": {
      "en": "Explore a new silhouette for your everyday wardrobe. Source-listed details: Sizes: 34-41. Final specifications require confirmation. Demo item with an illustrative HKD retail price. Stock and availability are simulated; this is not a real offer for sale.",
      "zh-Hant": "為日常衣櫥，探索新的鞋履輪廓。 來源記載：尺碼：34-41。 最終規格仍待確認。 示範商品，港幣售價僅供展示。庫存與供貨狀態均為模擬，並非實際銷售要約。",
      "zh-Hans": "为日常衣橱，探索新的鞋履轮廓。 来源记载：尺码：34-41。 最终规格仍待确认。 示范商品，港币售价仅供展示。库存与供货状态均为模拟，并非实际销售要约。",
      "ja": "いつもの装いに、新しいシルエットを。 資料に記載された仕様：サイズ：34-41。 最終仕様は確認待ちです。 デモ商品です。香港ドルの価格は表示例です。在庫と販売状況は架空であり、実際の販売ではありません。"
    },
    "priceAmount": 41800,
    "image": "/products/supplier-demo/footwear-25a06-1.webp"
  },
  {
    "id": "48f23207-e7d6-570d-b744-a8ed91a57673",
    "reference": "FOOTWEAR-22D58A-3",
    "slug": "supplier-footwear-22d58a-3",
    "category": "Footwear",
    "titles": {
      "en": "Sport-style ballet shoes · 22D58A-3",
      "zh-Hant": "運動風芭蕾鞋 · 22D58A-3",
      "zh-Hans": "运动风芭蕾鞋 · 22D58A-3",
      "ja": "スポーティーなバレエシューズ · 22D58A-3"
    },
    "descriptions": {
      "en": "Explore a new silhouette for your everyday wardrobe. Source-listed details: Sizes: 34-41. Final specifications require confirmation. Demo item with an illustrative HKD retail price. Stock and availability are simulated; this is not a real offer for sale.",
      "zh-Hant": "為日常衣櫥，探索新的鞋履輪廓。 來源記載：尺碼：34-41。 最終規格仍待確認。 示範商品，港幣售價僅供展示。庫存與供貨狀態均為模擬，並非實際銷售要約。",
      "zh-Hans": "为日常衣橱，探索新的鞋履轮廓。 来源记载：尺码：34-41。 最终规格仍待确认。 示范商品，港币售价仅供展示。库存与供货状态均为模拟，并非实际销售要约。",
      "ja": "いつもの装いに、新しいシルエットを。 資料に記載された仕様：サイズ：34-41。 最終仕様は確認待ちです。 デモ商品です。香港ドルの価格は表示例です。在庫と販売状況は架空であり、実際の販売ではありません。"
    },
    "priceAmount": 33800,
    "image": "/products/supplier-demo/footwear-22d58a-3.webp"
  },
  {
    "id": "f0599e60-fa46-5baf-823a-38810cc2912b",
    "reference": "FOOTWEAR-22D58C-3",
    "slug": "supplier-footwear-22d58c-3",
    "category": "Footwear",
    "titles": {
      "en": "Textured ballet shoes · 22D58C-3",
      "zh-Hant": "織紋芭蕾鞋 · 22D58C-3",
      "zh-Hans": "织纹芭蕾鞋 · 22D58C-3",
      "ja": "テクスチャーバレエシューズ · 22D58C-3"
    },
    "descriptions": {
      "en": "Explore a new silhouette for your everyday wardrobe. Source-listed details: Sizes: 34-41. Final specifications require confirmation. Demo item with an illustrative HKD retail price. Stock and availability are simulated; this is not a real offer for sale.",
      "zh-Hant": "為日常衣櫥，探索新的鞋履輪廓。 來源記載：尺碼：34-41。 最終規格仍待確認。 示範商品，港幣售價僅供展示。庫存與供貨狀態均為模擬，並非實際銷售要約。",
      "zh-Hans": "为日常衣橱，探索新的鞋履轮廓。 来源记载：尺码：34-41。 最终规格仍待确认。 示范商品，港币售价仅供展示。库存与供货状态均为模拟，并非实际销售要约。",
      "ja": "いつもの装いに、新しいシルエットを。 資料に記載された仕様：サイズ：34-41。 最終仕様は確認待ちです。 デモ商品です。香港ドルの価格は表示例です。在庫と販売状況は架空であり、実際の販売ではありません。"
    },
    "priceAmount": 35800,
    "image": "/products/supplier-demo/footwear-22d58c-3.webp"
  },
  {
    "id": "a135666b-0d5e-5ee9-b260-b4f689f19b37",
    "reference": "FOOTWEAR-22D58C-2",
    "slug": "supplier-footwear-22d58c-2",
    "category": "Footwear",
    "titles": {
      "en": "Textured ballet shoes · 22D58C-2",
      "zh-Hant": "織紋芭蕾鞋 · 22D58C-2",
      "zh-Hans": "织纹芭蕾鞋 · 22D58C-2",
      "ja": "テクスチャーバレエシューズ · 22D58C-2"
    },
    "descriptions": {
      "en": "Explore a new silhouette for your everyday wardrobe. Source-listed details: Sizes: 34-41. Final specifications require confirmation. Demo item with an illustrative HKD retail price. Stock and availability are simulated; this is not a real offer for sale.",
      "zh-Hant": "為日常衣櫥，探索新的鞋履輪廓。 來源記載：尺碼：34-41。 最終規格仍待確認。 示範商品，港幣售價僅供展示。庫存與供貨狀態均為模擬，並非實際銷售要約。",
      "zh-Hans": "为日常衣橱，探索新的鞋履轮廓。 来源记载：尺码：34-41。 最终规格仍待确认。 示范商品，港币售价仅供展示。库存与供货状态均为模拟，并非实际销售要约。",
      "ja": "いつもの装いに、新しいシルエットを。 資料に記載された仕様：サイズ：34-41。 最終仕様は確認待ちです。 デモ商品です。香港ドルの価格は表示例です。在庫と販売状況は架空であり、実際の販売ではありません。"
    },
    "priceAmount": 29800,
    "image": "/products/supplier-demo/footwear-22d58c-2.webp"
  },
  {
    "id": "fa4187d2-53e7-5a1a-9c25-fb0c7baa6a55",
    "reference": "FOOTWEAR-25P10-2",
    "slug": "supplier-footwear-25p10-2",
    "category": "Footwear",
    "titles": {
      "en": "Soft-texture ballet shoes · 25P10-2",
      "zh-Hant": "柔感芭蕾鞋 · 25P10-2",
      "zh-Hans": "柔感芭蕾鞋 · 25P10-2",
      "ja": "ソフトな風合いのバレエシューズ · 25P10-2"
    },
    "descriptions": {
      "en": "Explore a new silhouette for your everyday wardrobe. Source-listed details: Sizes: 34-41. Final specifications require confirmation. Demo item with an illustrative HKD retail price. Stock and availability are simulated; this is not a real offer for sale.",
      "zh-Hant": "為日常衣櫥，探索新的鞋履輪廓。 來源記載：尺碼：34-41。 最終規格仍待確認。 示範商品，港幣售價僅供展示。庫存與供貨狀態均為模擬，並非實際銷售要約。",
      "zh-Hans": "为日常衣橱，探索新的鞋履轮廓。 来源记载：尺码：34-41。 最终规格仍待确认。 示范商品，港币售价仅供展示。库存与供货状态均为模拟，并非实际销售要约。",
      "ja": "いつもの装いに、新しいシルエットを。 資料に記載された仕様：サイズ：34-41。 最終仕様は確認待ちです。 デモ商品です。香港ドルの価格は表示例です。在庫と販売状況は架空であり、実際の販売ではありません。"
    },
    "priceAmount": 31800,
    "image": "/products/supplier-demo/footwear-25p10-2.webp"
  },
  {
    "id": "2aa072d2-8ca9-5ffb-91a8-28ebf485e0d3",
    "reference": "FOOTWEAR-25P01-3",
    "slug": "supplier-footwear-25p01-3",
    "category": "Footwear",
    "titles": {
      "en": "Embellished low-wedge shoes · 25P01-3",
      "zh-Hant": "飾石低坡跟鞋 · 25P01-3",
      "zh-Hans": "饰石低坡跟鞋 · 25P01-3",
      "ja": "装飾付きローウェッジシューズ · 25P01-3"
    },
    "descriptions": {
      "en": "Explore a new silhouette for your everyday wardrobe. Source-listed details: Sizes: 34-41. Final specifications require confirmation. Demo item with an illustrative HKD retail price. Stock and availability are simulated; this is not a real offer for sale.",
      "zh-Hant": "為日常衣櫥，探索新的鞋履輪廓。 來源記載：尺碼：34-41。 最終規格仍待確認。 示範商品，港幣售價僅供展示。庫存與供貨狀態均為模擬，並非實際銷售要約。",
      "zh-Hans": "为日常衣橱，探索新的鞋履轮廓。 来源记载：尺码：34-41。 最终规格仍待确认。 示范商品，港币售价仅供展示。库存与供货状态均为模拟，并非实际销售要约。",
      "ja": "いつもの装いに、新しいシルエットを。 資料に記載された仕様：サイズ：34-41。 最終仕様は確認待ちです。 デモ商品です。香港ドルの価格は表示例です。在庫と販売状況は架空であり、実際の販売ではありません。"
    },
    "priceAmount": 33800,
    "image": "/products/supplier-demo/footwear-25p01-3.webp"
  },
  {
    "id": "33c7b031-2a34-5b64-beac-7264a3f451b8",
    "reference": "FOOTWEAR-25P08-1",
    "slug": "supplier-footwear-25p08-1",
    "category": "Footwear",
    "titles": {
      "en": "Textured heeled ballet shoes · 25P08-1",
      "zh-Hant": "織紋跟款芭蕾鞋 · 25P08-1",
      "zh-Hans": "织纹跟款芭蕾鞋 · 25P08-1",
      "ja": "テクスチャーヒールバレエシューズ · 25P08-1"
    },
    "descriptions": {
      "en": "Explore a new silhouette for your everyday wardrobe. Source-listed details: Sizes: 34-41. Final specifications require confirmation. Demo item with an illustrative HKD retail price. Stock and availability are simulated; this is not a real offer for sale.",
      "zh-Hant": "為日常衣櫥，探索新的鞋履輪廓。 來源記載：尺碼：34-41。 最終規格仍待確認。 示範商品，港幣售價僅供展示。庫存與供貨狀態均為模擬，並非實際銷售要約。",
      "zh-Hans": "为日常衣橱，探索新的鞋履轮廓。 来源记载：尺码：34-41。 最终规格仍待确认。 示范商品，港币售价仅供展示。库存与供货状态均为模拟，并非实际销售要约。",
      "ja": "いつもの装いに、新しいシルエットを。 資料に記載された仕様：サイズ：34-41。 最終仕様は確認待ちです。 デモ商品です。香港ドルの価格は表示例です。在庫と販売状況は架空であり、実際の販売ではありません。"
    },
    "priceAmount": 35800,
    "image": "/products/supplier-demo/footwear-25p08-1.webp"
  },
  {
    "id": "bfa9583f-1252-54bb-bbb9-994125a25f4c",
    "reference": "FOOTWEAR-26P02-1",
    "slug": "supplier-footwear-26p02-1",
    "category": "Footwear",
    "titles": {
      "en": "Embellished ballet trainers · 26P02-1",
      "zh-Hant": "飾石芭蕾運動鞋 · 26P02-1",
      "zh-Hans": "饰石芭蕾运动鞋 · 26P02-1",
      "ja": "装飾付きバレエスニーカー · 26P02-1"
    },
    "descriptions": {
      "en": "Explore a new silhouette for your everyday wardrobe. Source-listed details: Sizes: 34-41. Final specifications require confirmation. Demo item with an illustrative HKD retail price. Stock and availability are simulated; this is not a real offer for sale.",
      "zh-Hant": "為日常衣櫥，探索新的鞋履輪廓。 來源記載：尺碼：34-41。 最終規格仍待確認。 示範商品，港幣售價僅供展示。庫存與供貨狀態均為模擬，並非實際銷售要約。",
      "zh-Hans": "为日常衣橱，探索新的鞋履轮廓。 来源记载：尺码：34-41。 最终规格仍待确认。 示范商品，港币售价仅供展示。库存与供货状态均为模拟，并非实际销售要约。",
      "ja": "いつもの装いに、新しいシルエットを。 資料に記載された仕様：サイズ：34-41。 最終仕様は確認待ちです。 デモ商品です。香港ドルの価格は表示例です。在庫と販売状況は架空であり、実際の販売ではありません。"
    },
    "priceAmount": 29800,
    "image": "/products/supplier-demo/footwear-26p02-1.webp"
  },
  {
    "id": "e977c60f-2952-533c-b84d-65eac6ce59a8",
    "reference": "FOOTWEAR-26P02-2",
    "slug": "supplier-footwear-26p02-2",
    "category": "Footwear",
    "titles": {
      "en": "Outdoor-style ballet shoes · 26P02-2",
      "zh-Hant": "戶外風芭蕾鞋 · 26P02-2",
      "zh-Hans": "户外风芭蕾鞋 · 26P02-2",
      "ja": "アウトドア風バレエシューズ · 26P02-2"
    },
    "descriptions": {
      "en": "Explore a new silhouette for your everyday wardrobe. Source-listed details: Sizes: 34-41. Final specifications require confirmation. Demo item with an illustrative HKD retail price. Stock and availability are simulated; this is not a real offer for sale.",
      "zh-Hant": "為日常衣櫥，探索新的鞋履輪廓。 來源記載：尺碼：34-41。 最終規格仍待確認。 示範商品，港幣售價僅供展示。庫存與供貨狀態均為模擬，並非實際銷售要約。",
      "zh-Hans": "为日常衣橱，探索新的鞋履轮廓。 来源记载：尺码：34-41。 最终规格仍待确认。 示范商品，港币售价仅供展示。库存与供货状态均为模拟，并非实际销售要约。",
      "ja": "いつもの装いに、新しいシルエットを。 資料に記載された仕様：サイズ：34-41。 最終仕様は確認待ちです。 デモ商品です。香港ドルの価格は表示例です。在庫と販売状況は架空であり、実際の販売ではありません。"
    },
    "priceAmount": 31800,
    "image": "/products/supplier-demo/footwear-26p02-2.webp"
  },
  {
    "id": "d5e25112-476f-59bc-bf13-4f2de5e2d635",
    "reference": "FOOTWEAR-25A21-1",
    "slug": "supplier-footwear-25a21-1",
    "category": "Footwear",
    "titles": {
      "en": "Textured trainers · 25A21-1",
      "zh-Hant": "織紋運動鞋 · 25A21-1",
      "zh-Hans": "织纹运动鞋 · 25A21-1",
      "ja": "テクスチャースニーカー · 25A21-1"
    },
    "descriptions": {
      "en": "Explore a new silhouette for your everyday wardrobe. Source-listed details: Sizes: 34-41. Final specifications require confirmation. Demo item with an illustrative HKD retail price. Stock and availability are simulated; this is not a real offer for sale.",
      "zh-Hant": "為日常衣櫥，探索新的鞋履輪廓。 來源記載：尺碼：34-41。 最終規格仍待確認。 示範商品，港幣售價僅供展示。庫存與供貨狀態均為模擬，並非實際銷售要約。",
      "zh-Hans": "为日常衣橱，探索新的鞋履轮廓。 来源记载：尺码：34-41。 最终规格仍待确认。 示范商品，港币售价仅供展示。库存与供货状态均为模拟，并非实际销售要约。",
      "ja": "いつもの装いに、新しいシルエットを。 資料に記載された仕様：サイズ：34-41。 最終仕様は確認待ちです。 デモ商品です。香港ドルの価格は表示例です。在庫と販売状況は架空であり、実際の販売ではありません。"
    },
    "priceAmount": 33800,
    "image": "/products/supplier-demo/footwear-25a21-1.webp"
  },
  {
    "id": "942d9a73-9e89-5128-bd5e-037c0262aac9",
    "reference": "FOOTWEAR-22D60-6",
    "slug": "supplier-footwear-22d60-6",
    "category": "Footwear",
    "titles": {
      "en": "Platform skate-style trainers · 22D60-6",
      "zh-Hant": "厚底滑板風鞋 · 22D60-6",
      "zh-Hans": "厚底滑板风鞋 · 22D60-6",
      "ja": "厚底スケートスタイルスニーカー · 22D60-6"
    },
    "descriptions": {
      "en": "Explore a new silhouette for your everyday wardrobe. Source-listed details: Sizes: 34-41. Final specifications require confirmation. Demo item with an illustrative HKD retail price. Stock and availability are simulated; this is not a real offer for sale.",
      "zh-Hant": "為日常衣櫥，探索新的鞋履輪廓。 來源記載：尺碼：34-41。 最終規格仍待確認。 示範商品，港幣售價僅供展示。庫存與供貨狀態均為模擬，並非實際銷售要約。",
      "zh-Hans": "为日常衣橱，探索新的鞋履轮廓。 来源记载：尺码：34-41。 最终规格仍待确认。 示范商品，港币售价仅供展示。库存与供货状态均为模拟，并非实际销售要约。",
      "ja": "いつもの装いに、新しいシルエットを。 資料に記載された仕様：サイズ：34-41。 最終仕様は確認待ちです。 デモ商品です。香港ドルの価格は表示例です。在庫と販売状況は架空であり、実際の販売ではありません。"
    },
    "priceAmount": 35800,
    "image": "/products/supplier-demo/footwear-22d60-6.webp"
  },
  {
    "id": "fa23a00f-a9c8-501f-8350-eb5e64555148",
    "reference": "FOOTWEAR-25P08-5",
    "slug": "supplier-footwear-25p08-5",
    "category": "Footwear",
    "titles": {
      "en": "Heart-detail mesh ballet shoes · 25P08-5",
      "zh-Hant": "愛心網織芭蕾鞋 · 25P08-5",
      "zh-Hans": "爱心网织芭蕾鞋 · 25P08-5",
      "ja": "ハートモチーフのメッシュバレエシューズ · 25P08-5"
    },
    "descriptions": {
      "en": "Explore a new silhouette for your everyday wardrobe. Source-listed details: Sizes: 34-41. Final specifications require confirmation. Demo item with an illustrative HKD retail price. Stock and availability are simulated; this is not a real offer for sale.",
      "zh-Hant": "為日常衣櫥，探索新的鞋履輪廓。 來源記載：尺碼：34-41。 最終規格仍待確認。 示範商品，港幣售價僅供展示。庫存與供貨狀態均為模擬，並非實際銷售要約。",
      "zh-Hans": "为日常衣橱，探索新的鞋履轮廓。 来源记载：尺码：34-41。 最终规格仍待确认。 示范商品，港币售价仅供展示。库存与供货状态均为模拟，并非实际销售要约。",
      "ja": "いつもの装いに、新しいシルエットを。 資料に記載された仕様：サイズ：34-41。 最終仕様は確認待ちです。 デモ商品です。香港ドルの価格は表示例です。在庫と販売状況は架空であり、実際の販売ではありません。"
    },
    "priceAmount": 29800,
    "image": "/products/supplier-demo/footwear-25p08-5.webp"
  },
  {
    "id": "e9c0f128-07be-5f26-acf8-c010709c55f6",
    "reference": "FOOTWEAR-26P02-5",
    "slug": "supplier-footwear-26p02-5",
    "category": "Footwear",
    "titles": {
      "en": "Platform casual shoes · 26P02-5",
      "zh-Hant": "厚底休閒鞋 · 26P02-5",
      "zh-Hans": "厚底休闲鞋 · 26P02-5",
      "ja": "厚底カジュアルシューズ · 26P02-5"
    },
    "descriptions": {
      "en": "Explore a new silhouette for your everyday wardrobe. Source-listed details: Sizes: 34-41. Final specifications require confirmation. Demo item with an illustrative HKD retail price. Stock and availability are simulated; this is not a real offer for sale.",
      "zh-Hant": "為日常衣櫥，探索新的鞋履輪廓。 來源記載：尺碼：34-41。 最終規格仍待確認。 示範商品，港幣售價僅供展示。庫存與供貨狀態均為模擬，並非實際銷售要約。",
      "zh-Hans": "为日常衣橱，探索新的鞋履轮廓。 来源记载：尺码：34-41。 最终规格仍待确认。 示范商品，港币售价仅供展示。库存与供货状态均为模拟，并非实际销售要约。",
      "ja": "いつもの装いに、新しいシルエットを。 資料に記載された仕様：サイズ：34-41。 最終仕様は確認待ちです。 デモ商品です。香港ドルの価格は表示例です。在庫と販売状況は架空であり、実際の販売ではありません。"
    },
    "priceAmount": 31800,
    "image": "/products/supplier-demo/footwear-26p02-5.webp"
  },
  {
    "id": "dd211d3f-ed82-528f-9ea0-77c2aa235e6a",
    "reference": "SUP-001",
    "slug": "supplier-sup-001",
    "category": "Food & beverages",
    "titles": {
      "en": "Miyuanji ginseng beverage",
      "zh-Hant": "秘元集人參飲品",
      "zh-Hans": "秘元集人参饮品",
      "ja": "秘元集 高麗人参飲料"
    },
    "descriptions": {
      "en": "Explore a selection for the pantry and gift table. Source-listed details: 50 mL/bottle × 10 bottles/box. Final specifications require confirmation. Demo item with an illustrative HKD retail price. Stock and availability are simulated; this is not a real offer for sale.",
      "zh-Hant": "探索適合日常儲備與送禮的選品。 來源記載：每瓶50毫升，每盒10瓶。 最終規格仍待確認。 示範商品，港幣售價僅供展示。庫存與供貨狀態均為模擬，並非實際銷售要約。",
      "zh-Hans": "探索适合日常储备与送礼的选品。 来源记载：每瓶50毫升，每盒10瓶。 最终规格仍待确认。 示范商品，港币售价仅供展示。库存与供货状态均为模拟，并非实际销售要约。",
      "ja": "日々のストックや贈り物に選ぶ品々。 資料に記載された仕様：1本50 mL、1箱10本入り。 最終仕様は確認待ちです。 デモ商品です。香港ドルの価格は表示例です。在庫と販売状況は架空であり、実際の販売ではありません。"
    },
    "priceAmount": 29800,
    "image": "/products/supplier-demo/sup-001.webp"
  },
  {
    "id": "ff9ca6ad-9764-5195-b381-e1dc98f9e43b",
    "reference": "SUP-002",
    "slug": "supplier-sup-002",
    "category": "Food & beverages",
    "titles": {
      "en": "Miyuanji matsutake and ginseng beverage",
      "zh-Hant": "秘元集松茸人參飲品",
      "zh-Hans": "秘元集松茸人参饮品",
      "ja": "秘元集 マツタケ・高麗人参飲料"
    },
    "descriptions": {
      "en": "Explore a selection for the pantry and gift table. Source-listed details: 50 mL/pouch × 10 pouches/box. Final specifications require confirmation. Demo item with an illustrative HKD retail price. Stock and availability are simulated; this is not a real offer for sale.",
      "zh-Hant": "探索適合日常儲備與送禮的選品。 來源記載：每袋50毫升，每盒10袋。 最終規格仍待確認。 示範商品，港幣售價僅供展示。庫存與供貨狀態均為模擬，並非實際銷售要約。",
      "zh-Hans": "探索适合日常储备与送礼的选品。 来源记载：每袋50毫升，每盒10袋。 最终规格仍待确认。 示范商品，港币售价仅供展示。库存与供货状态均为模拟，并非实际销售要约。",
      "ja": "日々のストックや贈り物に選ぶ品々。 資料に記載された仕様：1袋50 mL、1箱10袋入り。 最終仕様は確認待ちです。 デモ商品です。香港ドルの価格は表示例です。在庫と販売状況は架空であり、実際の販売ではありません。"
    },
    "priceAmount": 33800,
    "image": "/products/supplier-demo/sup-002.webp"
  },
  {
    "id": "39b85a20-2c57-5c55-a15c-06d8818d3321",
    "reference": "SUP-003",
    "slug": "supplier-sup-003",
    "category": "Food & beverages",
    "titles": {
      "en": "Xianbaidao ginseng beverage",
      "zh-Hant": "仙百道人參飲品",
      "zh-Hans": "仙百道人参饮品",
      "ja": "仙百道 高麗人参飲料"
    },
    "descriptions": {
      "en": "Explore a selection for the pantry and gift table. Source-listed details: 30 mL/unit × 10 units/box. Final specifications require confirmation. Demo item with an illustrative HKD retail price. Stock and availability are simulated; this is not a real offer for sale. Product image not yet available.",
      "zh-Hant": "探索適合日常儲備與送禮的選品。 來源記載：每支30毫升，每盒10支。 最終規格仍待確認。 示範商品，港幣售價僅供展示。庫存與供貨狀態均為模擬，並非實際銷售要約。 商品圖片尚未提供。",
      "zh-Hans": "探索适合日常储备与送礼的选品。 来源记载：每支30毫升，每盒10支。 最终规格仍待确认。 示范商品，港币售价仅供展示。库存与供货状态均为模拟，并非实际销售要约。 商品图片尚未提供。",
      "ja": "日々のストックや贈り物に選ぶ品々。 資料に記載された仕様：1本30 mL、1箱10本入り。 最終仕様は確認待ちです。 デモ商品です。香港ドルの価格は表示例です。在庫と販売状況は架空であり、実際の販売ではありません。 商品画像は準備中です。"
    },
    "priceAmount": 37800,
    "image": "/products/supplier-demo/image-unavailable.svg"
  },
  {
    "id": "13917f1e-da6e-5c41-8c4d-110462c5581d",
    "reference": "SUP-004",
    "slug": "supplier-sup-004",
    "category": "Food & beverages",
    "titles": {
      "en": "Zuibao Japanese raisin tree and ginseng beverage",
      "zh-Hant": "醉寶枳椇子人參飲品",
      "zh-Hans": "醉宝枳椇子人参饮品",
      "ja": "醉宝 ケンポナシ・高麗人参飲料"
    },
    "descriptions": {
      "en": "Explore a selection for the pantry and gift table. Source-listed details: 50 mL/pouch × 9 pouches/box. Final specifications require confirmation. Demo item with an illustrative HKD retail price. Stock and availability are simulated; this is not a real offer for sale. Product image not yet available.",
      "zh-Hant": "探索適合日常儲備與送禮的選品。 來源記載：每袋50毫升，每盒9袋。 最終規格仍待確認。 示範商品，港幣售價僅供展示。庫存與供貨狀態均為模擬，並非實際銷售要約。 商品圖片尚未提供。",
      "zh-Hans": "探索适合日常储备与送礼的选品。 来源记载：每袋50毫升，每盒9袋。 最终规格仍待确认。 示范商品，港币售价仅供展示。库存与供货状态均为模拟，并非实际销售要约。 商品图片尚未提供。",
      "ja": "日々のストックや贈り物に選ぶ品々。 資料に記載された仕様：1袋50 mL、1箱9袋入り。 最終仕様は確認待ちです。 デモ商品です。香港ドルの価格は表示例です。在庫と販売状況は架空であり、実際の販売ではありません。 商品画像は準備中です。"
    },
    "priceAmount": 41800,
    "image": "/products/supplier-demo/image-unavailable.svg"
  },
  {
    "id": "89fcef6f-5472-534f-9d0c-26611bed82b0",
    "reference": "SUP-005",
    "slug": "supplier-sup-005",
    "category": "Food & beverages",
    "titles": {
      "en": "Shengming Xuanyan cistanche and ginseng beverage",
      "zh-Hant": "生命宣言肉蓯蓉人參飲品",
      "zh-Hans": "生命宣言肉苁蓉人参饮品",
      "ja": "生命宣言 ニクジュヨウ・高麗人参飲料"
    },
    "descriptions": {
      "en": "Explore a selection for the pantry and gift table. Source-listed details: 50 mL/bottle × 10 bottles/box. Final specifications require confirmation. Demo item with an illustrative HKD retail price. Stock and availability are simulated; this is not a real offer for sale. Product image not yet available.",
      "zh-Hant": "探索適合日常儲備與送禮的選品。 來源記載：每瓶50毫升，每盒10瓶。 最終規格仍待確認。 示範商品，港幣售價僅供展示。庫存與供貨狀態均為模擬，並非實際銷售要約。 商品圖片尚未提供。",
      "zh-Hans": "探索适合日常储备与送礼的选品。 来源记载：每瓶50毫升，每盒10瓶。 最终规格仍待确认。 示范商品，港币售价仅供展示。库存与供货状态均为模拟，并非实际销售要约。 商品图片尚未提供。",
      "ja": "日々のストックや贈り物に選ぶ品々。 資料に記載された仕様：1本50 mL、1箱10本入り。 最終仕様は確認待ちです。 デモ商品です。香港ドルの価格は表示例です。在庫と販売状況は架空であり、実際の販売ではありません。 商品画像は準備中です。"
    },
    "priceAmount": 45800,
    "image": "/products/supplier-demo/image-unavailable.svg"
  },
  {
    "id": "4835f2f1-d729-594e-91bc-0ed74fc2e26d",
    "reference": "SUP-006",
    "slug": "supplier-sup-006",
    "category": "Food & beverages",
    "titles": {
      "en": "Zhibenhui ginseng beverage",
      "zh-Hant": "植本薈人參飲品",
      "zh-Hans": "植本荟人参饮品",
      "ja": "植本薈 高麗人参飲料"
    },
    "descriptions": {
      "en": "Explore a selection for the pantry and gift table. Source-listed details: 50 mL/bottle × 10 bottles/box. Final specifications require confirmation. Demo item with an illustrative HKD retail price. Stock and availability are simulated; this is not a real offer for sale.",
      "zh-Hant": "探索適合日常儲備與送禮的選品。 來源記載：每瓶50毫升，每盒10瓶。 最終規格仍待確認。 示範商品，港幣售價僅供展示。庫存與供貨狀態均為模擬，並非實際銷售要約。",
      "zh-Hans": "探索适合日常储备与送礼的选品。 来源记载：每瓶50毫升，每盒10瓶。 最终规格仍待确认。 示范商品，港币售价仅供展示。库存与供货状态均为模拟，并非实际销售要约。",
      "ja": "日々のストックや贈り物に選ぶ品々。 資料に記載された仕様：1本50 mL、1箱10本入り。 最終仕様は確認待ちです。 デモ商品です。香港ドルの価格は表示例です。在庫と販売状況は架空であり、実際の販売ではありません。"
    },
    "priceAmount": 29800,
    "image": "/products/supplier-demo/sup-006.webp"
  },
  {
    "id": "280578ee-0ce3-5cba-956e-7d851d2f2858",
    "reference": "SUP-007",
    "slug": "supplier-sup-007",
    "category": "Food & beverages",
    "titles": {
      "en": "Yuanqijia ginseng beverage",
      "zh-Hant": "元氣珈人參飲品",
      "zh-Hans": "元气珈人参饮品",
      "ja": "元気珈 高麗人参飲料"
    },
    "descriptions": {
      "en": "Explore a selection for the pantry and gift table. Source-listed details: 30 mL/unit × 10 units/box. Final specifications require confirmation. Demo item with an illustrative HKD retail price. Stock and availability are simulated; this is not a real offer for sale.",
      "zh-Hant": "探索適合日常儲備與送禮的選品。 來源記載：每支30毫升，每盒10支。 最終規格仍待確認。 示範商品，港幣售價僅供展示。庫存與供貨狀態均為模擬，並非實際銷售要約。",
      "zh-Hans": "探索适合日常储备与送礼的选品。 来源记载：每支30毫升，每盒10支。 最终规格仍待确认。 示范商品，港币售价仅供展示。库存与供货状态均为模拟，并非实际销售要约。",
      "ja": "日々のストックや贈り物に選ぶ品々。 資料に記載された仕様：1本30 mL、1箱10本入り。 最終仕様は確認待ちです。 デモ商品です。香港ドルの価格は表示例です。在庫と販売状況は架空であり、実際の販売ではありません。"
    },
    "priceAmount": 33800,
    "image": "/products/supplier-demo/sup-007.webp"
  },
  {
    "id": "e6b9d1ae-28e2-56cb-b935-0d641f13c0bd",
    "reference": "SUP-008",
    "slug": "supplier-sup-008",
    "category": "Food & beverages",
    "titles": {
      "en": "Baosenhe lion’s mane and ginseng beverage",
      "zh-Hant": "寶森鶴猴頭菇人參飲品",
      "zh-Hans": "宝森鹤猴头菇人参饮品",
      "ja": "宝森鶴 ヤマブシタケ・高麗人参飲料"
    },
    "descriptions": {
      "en": "Explore a selection for the pantry and gift table. Source-listed details: 50 mL/bottle × 15 bottles/box. Final specifications require confirmation. Demo item with an illustrative HKD retail price. Stock and availability are simulated; this is not a real offer for sale. Product image not yet available.",
      "zh-Hant": "探索適合日常儲備與送禮的選品。 來源記載：每瓶50毫升，每盒15瓶。 最終規格仍待確認。 示範商品，港幣售價僅供展示。庫存與供貨狀態均為模擬，並非實際銷售要約。 商品圖片尚未提供。",
      "zh-Hans": "探索适合日常储备与送礼的选品。 来源记载：每瓶50毫升，每盒15瓶。 最终规格仍待确认。 示范商品，港币售价仅供展示。库存与供货状态均为模拟，并非实际销售要约。 商品图片尚未提供。",
      "ja": "日々のストックや贈り物に選ぶ品々。 資料に記載された仕様：1本50 mL、1箱15本入り。 最終仕様は確認待ちです。 デモ商品です。香港ドルの価格は表示例です。在庫と販売状況は架空であり、実際の販売ではありません。 商品画像は準備中です。"
    },
    "priceAmount": 37800,
    "image": "/products/supplier-demo/image-unavailable.svg"
  },
  {
    "id": "752b70f4-9d21-5d13-b0d8-7bb999ab172d",
    "reference": "SUP-009",
    "slug": "supplier-sup-009",
    "category": "Food & beverages",
    "titles": {
      "en": "Baosenhe sweet-tea and ginseng beverage",
      "zh-Hant": "寶森鶴甜茶人參飲品",
      "zh-Hans": "宝森鹤甜茶人参饮品",
      "ja": "宝森鶴 甜茶・高麗人参飲料"
    },
    "descriptions": {
      "en": "Explore a selection for the pantry and gift table. Source-listed details: 50 mL/bottle × 9 bottles/box. Final specifications require confirmation. Demo item with an illustrative HKD retail price. Stock and availability are simulated; this is not a real offer for sale. Product image not yet available.",
      "zh-Hant": "探索適合日常儲備與送禮的選品。 來源記載：每瓶50毫升，每盒9瓶。 最終規格仍待確認。 示範商品，港幣售價僅供展示。庫存與供貨狀態均為模擬，並非實際銷售要約。 商品圖片尚未提供。",
      "zh-Hans": "探索适合日常储备与送礼的选品。 来源记载：每瓶50毫升，每盒9瓶。 最终规格仍待确认。 示范商品，港币售价仅供展示。库存与供货状态均为模拟，并非实际销售要约。 商品图片尚未提供。",
      "ja": "日々のストックや贈り物に選ぶ品々。 資料に記載された仕様：1本50 mL、1箱9本入り。 最終仕様は確認待ちです。 デモ商品です。香港ドルの価格は表示例です。在庫と販売状況は架空であり、実際の販売ではありません。 商品画像は準備中です。"
    },
    "priceAmount": 41800,
    "image": "/products/supplier-demo/image-unavailable.svg"
  },
  {
    "id": "fc12ed5d-61be-510a-9aeb-dd8e23c95ad4",
    "reference": "SUP-010",
    "slug": "supplier-sup-010",
    "category": "Food & beverages",
    "titles": {
      "en": "Zhigen Zhiben chestnut-rose and ginseng beverage",
      "zh-Hant": "植根滋本刺梨人參飲品",
      "zh-Hans": "植根滋本刺梨人参饮品",
      "ja": "植根滋本 刺梨・高麗人参飲料"
    },
    "descriptions": {
      "en": "Explore a selection for the pantry and gift table. Source-listed details: 100 mL/bottle × 10 bottles/box. Final specifications require confirmation. Demo item with an illustrative HKD retail price. Stock and availability are simulated; this is not a real offer for sale.",
      "zh-Hant": "探索適合日常儲備與送禮的選品。 來源記載：每瓶100毫升，每盒10瓶。 最終規格仍待確認。 示範商品，港幣售價僅供展示。庫存與供貨狀態均為模擬，並非實際銷售要約。",
      "zh-Hans": "探索适合日常储备与送礼的选品。 来源记载：每瓶100毫升，每盒10瓶。 最终规格仍待确认。 示范商品，港币售价仅供展示。库存与供货状态均为模拟，并非实际销售要约。",
      "ja": "日々のストックや贈り物に選ぶ品々。 資料に記載された仕様：1本100 mL、1箱10本入り。 最終仕様は確認待ちです。 デモ商品です。香港ドルの価格は表示例です。在庫と販売状況は架空であり、実際の販売ではありません。"
    },
    "priceAmount": 45800,
    "image": "/products/supplier-demo/sup-010.webp"
  },
  {
    "id": "643c7860-fe3c-53e7-a486-94d1ba00d847",
    "reference": "SUP-011",
    "slug": "supplier-sup-011",
    "category": "Food & beverages",
    "titles": {
      "en": "Zhiwu Manfen egg-powder and ginseng pressed candy",
      "zh-Hant": "植物滿分雞蛋粉人參壓片糖果",
      "zh-Hans": "植物满分鸡蛋粉人参压片糖果",
      "ja": "植物満分 卵粉・高麗人参タブレット菓子"
    },
    "descriptions": {
      "en": "Explore a selection for the pantry and gift table. Source-listed details: 30 pieces/bottle × 2 bottles/box; supplier classifies as pressed candy. Final specifications require confirmation. Demo item with an illustrative HKD retail price. Stock and availability are simulated; this is not a real offer for sale.",
      "zh-Hant": "探索適合日常儲備與送禮的選品。 來源記載：每瓶三十粒，每盒兩瓶；供應商分類為壓片糖果。 最終規格仍待確認。 示範商品，港幣售價僅供展示。庫存與供貨狀態均為模擬，並非實際銷售要約。",
      "zh-Hans": "探索适合日常储备与送礼的选品。 来源记载：每瓶三十粒，每盒两瓶；供应商分类为压片糖果。 最终规格仍待确认。 示范商品，港币售价仅供展示。库存与供货状态均为模拟，并非实际销售要约。",
      "ja": "日々のストックや贈り物に選ぶ品々。 資料に記載された仕様：1瓶30粒、1箱2瓶入り。供給元区分はタブレット菓子。 最終仕様は確認待ちです。 デモ商品です。香港ドルの価格は表示例です。在庫と販売状況は架空であり、実際の販売ではありません。"
    },
    "priceAmount": 16800,
    "image": "/products/supplier-demo/sup-011.webp"
  },
  {
    "id": "caca70c8-b5cb-5c22-ac43-a2195d22351a",
    "reference": "SUP-013",
    "slug": "supplier-sup-013",
    "category": "Beauty & personal care",
    "titles": {
      "en": "Zhiwufu rose and ginseng skincare set",
      "zh-Hant": "植物賦玫瑰人參護膚套裝",
      "zh-Hans": "植物赋玫瑰人参护肤套装",
      "ja": "植物賦 ローズ・高麗人参スキンケアセット"
    },
    "descriptions": {
      "en": "A considered addition to the daily care shelf. Source-listed details: 3 bottles/box; serum, emulsion and moisturizing water; one of each. Per-bottle volume unknown. Final specifications require confirmation. Demo item with an illustrative HKD retail price. Stock and availability are simulated; this is not a real offer for sale.",
      "zh-Hant": "為日常護理角落，添上一份用心。 來源記載：一盒三瓶：精華液、精華乳、保濕水各一瓶；每瓶容量待確認。 最終規格仍待確認。 示範商品，港幣售價僅供展示。庫存與供貨狀態均為模擬，並非實際銷售要約。",
      "zh-Hans": "为日常护理角落，添上一份用心。 来源记载：一盒三瓶：精华液、精华乳、保湿水各一瓶；每瓶容量待确认。 最终规格仍待确认。 示范商品，港币售价仅供展示。库存与供货状态均为模拟，并非实际销售要约。",
      "ja": "日々のケアに、丁寧に選ぶ一品。 資料に記載された仕様：1箱3本：美容液・乳液・化粧水各1本。各容量は未確認。 最終仕様は確認待ちです。 デモ商品です。香港ドルの価格は表示例です。在庫と販売状況は架空であり、実際の販売ではありません。"
    },
    "priceAmount": 39800,
    "image": "/products/supplier-demo/sup-013.webp"
  }
];

export const supplierDemoProducts: Product[] = supplierDemoSamples.map(sample => ({
  id: sample.id,
  sku: `DEMO-${sample.reference}`,
  slug: sample.slug,
  title: sample.titles.en,
  titleZh: sample.titles["zh-Hant"],
  description: sample.descriptions.en,
  descriptionZh: sample.descriptions["zh-Hant"],
  priceAmount: sample.priceAmount,
  currency: "hkd",
  stockQty: 99, // Demo quantity only. Never a supplier inventory assertion.
  category: sample.category,
  status: "published",
  featured: false,
  isDemo: true,
  createdAt: "2026-09-29T00:00:00.000Z",
  images: [{ id: `${sample.id}-image`, sourceUrl: sample.image, storagePath: null, altText: sample.titles.en, position: 0 }],
}));

// Stable, non-sensitive intake references for catalogue grouping only.
export const supplierDemoSourceRefs: Record<string, { id: string; category: string }> = {
  "supplier-cer-f001": {
    "id": "CER-F001",
    "category": "tea"
  },
  "supplier-cer-f003": {
    "id": "CER-F003",
    "category": "tea"
  },
  "supplier-cer-f004": {
    "id": "CER-F004",
    "category": "tea"
  },
  "supplier-cer-f005": {
    "id": "CER-F005",
    "category": "tea"
  },
  "supplier-cer-f006": {
    "id": "CER-F006",
    "category": "tea"
  },
  "supplier-cer-f007": {
    "id": "CER-F007",
    "category": "tea"
  },
  "supplier-cer-f008": {
    "id": "CER-F008",
    "category": "tableware"
  },
  "supplier-cer-f009": {
    "id": "CER-F009",
    "category": "tableware"
  },
  "supplier-cer-f010": {
    "id": "CER-F010",
    "category": "tableware"
  },
  "supplier-cer-f011": {
    "id": "CER-F011",
    "category": "tableware"
  },
  "supplier-cer-f012": {
    "id": "CER-F012",
    "category": "tableware"
  },
  "supplier-cer-f013": {
    "id": "CER-F013",
    "category": "tableware"
  },
  "supplier-cer-f014": {
    "id": "CER-F014",
    "category": "tableware"
  },
  "supplier-cer-f015": {
    "id": "CER-F015",
    "category": "tableware"
  },
  "supplier-cer-f017": {
    "id": "CER-F017",
    "category": "tableware"
  },
  "supplier-cer-f018": {
    "id": "CER-F018",
    "category": "tableware"
  },
  "supplier-cer-f019": {
    "id": "CER-F019",
    "category": "tea"
  },
  "supplier-cer-f020": {
    "id": "CER-F020",
    "category": "gifts"
  },
  "supplier-cer-f024": {
    "id": "CER-F024",
    "category": "tea"
  },
  "supplier-cer-f025": {
    "id": "CER-F025",
    "category": "tableware"
  },
  "supplier-cer-f026": {
    "id": "CER-F026",
    "category": "gifts"
  },
  "supplier-cer-f027": {
    "id": "CER-F027",
    "category": "gifts"
  },
  "supplier-cer-f028": {
    "id": "CER-F028",
    "category": "tableware"
  },
  "supplier-cer-f029": {
    "id": "CER-F029",
    "category": "tableware"
  },
  "supplier-cer-f030": {
    "id": "CER-F030",
    "category": "tableware"
  },
  "supplier-cer-f033": {
    "id": "CER-F033",
    "category": "tableware"
  },
  "supplier-cer-f036": {
    "id": "CER-F036",
    "category": "tableware"
  },
  "supplier-cer-f037": {
    "id": "CER-F037",
    "category": "tableware"
  },
  "supplier-cer-f038": {
    "id": "CER-F038",
    "category": "tableware"
  },
  "supplier-cer-f039": {
    "id": "CER-F039",
    "category": "tea"
  },
  "supplier-cer-f040": {
    "id": "CER-F040",
    "category": "food"
  },
  "supplier-mdxy-1": {
    "id": "MDXY-1",
    "category": "beauty"
  },
  "supplier-mdxy-2": {
    "id": "MDXY-2",
    "category": "beauty"
  },
  "supplier-mdxy-3": {
    "id": "MDXY-3",
    "category": "beauty"
  },
  "supplier-mdxy-4": {
    "id": "MDXY-4",
    "category": "beauty"
  },
  "supplier-mdxy-5": {
    "id": "MDXY-5",
    "category": "beauty"
  },
  "supplier-mdxy-6": {
    "id": "MDXY-6",
    "category": "beauty"
  },
  "supplier-mdxy-7": {
    "id": "MDXY-7",
    "category": "beauty"
  },
  "supplier-mdxy-8": {
    "id": "MDXY-8",
    "category": "beauty"
  },
  "supplier-mdxy-9": {
    "id": "MDXY-9",
    "category": "beauty"
  },
  "supplier-footwear-25a22-1": {
    "id": "FOOTWEAR-25A22-1",
    "category": "shoes"
  },
  "supplier-footwear-24d09-5": {
    "id": "FOOTWEAR-24D09-5",
    "category": "shoes"
  },
  "supplier-footwear-25p02-2": {
    "id": "FOOTWEAR-25P02-2",
    "category": "shoes"
  },
  "supplier-footwear-23a38a-2": {
    "id": "FOOTWEAR-23A38A-2",
    "category": "shoes"
  },
  "supplier-footwear-2020a1-8": {
    "id": "FOOTWEAR-2020A1-8",
    "category": "shoes"
  },
  "supplier-footwear-2020a1-7": {
    "id": "FOOTWEAR-2020A1-7",
    "category": "shoes"
  },
  "supplier-footwear-2020a1-6": {
    "id": "FOOTWEAR-2020A1-6",
    "category": "shoes"
  },
  "supplier-footwear-24d09-1": {
    "id": "FOOTWEAR-24D09-1",
    "category": "shoes"
  },
  "supplier-footwear-23d12-1": {
    "id": "FOOTWEAR-23D12-1",
    "category": "shoes"
  },
  "supplier-footwear-23a38-1": {
    "id": "FOOTWEAR-23A38-1",
    "category": "shoes"
  },
  "supplier-footwear-23a35-1": {
    "id": "FOOTWEAR-23A35-1",
    "category": "shoes"
  },
  "supplier-footwear-23a15h-2": {
    "id": "FOOTWEAR-23A15H-2",
    "category": "shoes"
  },
  "supplier-footwear-23a15h-1": {
    "id": "FOOTWEAR-23A15H-1",
    "category": "shoes"
  },
  "supplier-footwear-23a12-1": {
    "id": "FOOTWEAR-23A12-1",
    "category": "shoes"
  },
  "supplier-footwear-22d58a-1": {
    "id": "FOOTWEAR-22D58A-1",
    "category": "shoes"
  },
  "supplier-footwear-21a23h-3": {
    "id": "FOOTWEAR-21A23H-3",
    "category": "shoes"
  },
  "supplier-footwear-9a57-9": {
    "id": "FOOTWEAR-9A57-9",
    "category": "shoes"
  },
  "supplier-footwear-25a18-1": {
    "id": "FOOTWEAR-25A18-1",
    "category": "shoes"
  },
  "supplier-footwear-9p65s-2": {
    "id": "FOOTWEAR-9P65S-2",
    "category": "shoes"
  },
  "supplier-footwear-23p20-2": {
    "id": "FOOTWEAR-23P20-2",
    "category": "shoes"
  },
  "supplier-footwear-25p20-2": {
    "id": "FOOTWEAR-25P20-2",
    "category": "shoes"
  },
  "supplier-footwear-26p09-2": {
    "id": "FOOTWEAR-26P09-2",
    "category": "shoes"
  },
  "supplier-footwear-25p06-2": {
    "id": "FOOTWEAR-25P06-2",
    "category": "shoes"
  },
  "supplier-footwear-24p25-1": {
    "id": "FOOTWEAR-24P25-1",
    "category": "shoes"
  },
  "supplier-footwear-25p10-3": {
    "id": "FOOTWEAR-25P10-3",
    "category": "shoes"
  },
  "supplier-footwear-24p20-6": {
    "id": "FOOTWEAR-24P20-6",
    "category": "shoes"
  },
  "supplier-footwear-20p18-6": {
    "id": "FOOTWEAR-20P18-6",
    "category": "shoes"
  },
  "supplier-footwear-20p18-5": {
    "id": "FOOTWEAR-20P18-5",
    "category": "shoes"
  },
  "supplier-footwear-20p18-3": {
    "id": "FOOTWEAR-20P18-3",
    "category": "shoes"
  },
  "supplier-footwear-25p01-2": {
    "id": "FOOTWEAR-25P01-2",
    "category": "shoes"
  },
  "supplier-footwear-25p01-5": {
    "id": "FOOTWEAR-25P01-5",
    "category": "shoes"
  },
  "supplier-footwear-25a09-1": {
    "id": "FOOTWEAR-25A09-1",
    "category": "shoes"
  },
  "supplier-footwear-20p18-2": {
    "id": "FOOTWEAR-20P18-2",
    "category": "shoes"
  },
  "supplier-footwear-21d30-1": {
    "id": "FOOTWEAR-21D30-1",
    "category": "shoes"
  },
  "supplier-footwear-20p18-1": {
    "id": "FOOTWEAR-20P18-1",
    "category": "shoes"
  },
  "supplier-footwear-21a28-5": {
    "id": "FOOTWEAR-21A28-5",
    "category": "shoes"
  },
  "supplier-footwear-22d58a-2": {
    "id": "FOOTWEAR-22D58A-2",
    "category": "shoes"
  },
  "supplier-footwear-25a06-1": {
    "id": "FOOTWEAR-25A06-1",
    "category": "shoes"
  },
  "supplier-footwear-22d58a-3": {
    "id": "FOOTWEAR-22D58A-3",
    "category": "shoes"
  },
  "supplier-footwear-22d58c-3": {
    "id": "FOOTWEAR-22D58C-3",
    "category": "shoes"
  },
  "supplier-footwear-22d58c-2": {
    "id": "FOOTWEAR-22D58C-2",
    "category": "shoes"
  },
  "supplier-footwear-25p10-2": {
    "id": "FOOTWEAR-25P10-2",
    "category": "shoes"
  },
  "supplier-footwear-25p01-3": {
    "id": "FOOTWEAR-25P01-3",
    "category": "shoes"
  },
  "supplier-footwear-25p08-1": {
    "id": "FOOTWEAR-25P08-1",
    "category": "shoes"
  },
  "supplier-footwear-26p02-1": {
    "id": "FOOTWEAR-26P02-1",
    "category": "shoes"
  },
  "supplier-footwear-26p02-2": {
    "id": "FOOTWEAR-26P02-2",
    "category": "shoes"
  },
  "supplier-footwear-25a21-1": {
    "id": "FOOTWEAR-25A21-1",
    "category": "shoes"
  },
  "supplier-footwear-22d60-6": {
    "id": "FOOTWEAR-22D60-6",
    "category": "shoes"
  },
  "supplier-footwear-25p08-5": {
    "id": "FOOTWEAR-25P08-5",
    "category": "shoes"
  },
  "supplier-footwear-26p02-5": {
    "id": "FOOTWEAR-26P02-5",
    "category": "shoes"
  },
  "supplier-sup-001": {
    "id": "SUP-001",
    "category": "food"
  },
  "supplier-sup-002": {
    "id": "SUP-002",
    "category": "food"
  },
  "supplier-sup-003": {
    "id": "SUP-003",
    "category": "food"
  },
  "supplier-sup-004": {
    "id": "SUP-004",
    "category": "food"
  },
  "supplier-sup-005": {
    "id": "SUP-005",
    "category": "food"
  },
  "supplier-sup-006": {
    "id": "SUP-006",
    "category": "food"
  },
  "supplier-sup-007": {
    "id": "SUP-007",
    "category": "food"
  },
  "supplier-sup-008": {
    "id": "SUP-008",
    "category": "food"
  },
  "supplier-sup-009": {
    "id": "SUP-009",
    "category": "food"
  },
  "supplier-sup-010": {
    "id": "SUP-010",
    "category": "food"
  },
  "supplier-sup-011": {
    "id": "SUP-011",
    "category": "food"
  },
  "supplier-sup-013": {
    "id": "SUP-013",
    "category": "beauty"
  }
};

export const supplierDisplayOnly: {
  id: string; category: "health" | "alcohol"; titles: SupplierDemoCopy;
}[] = [
  {
    "id": "MED-001",
    "category": "health",
    "titles": {
      "en": "Eye Meridian Clear Drop",
      "zh-Hant": "目經眼藥水",
      "zh-Hans": "目经眼药水",
      "ja": "Eye Meridian Clear Drop"
    }
  },
  {
    "id": "MED-002",
    "category": "health",
    "titles": {
      "en": "Sau Mei Lok",
      "zh-Hant": "修美樂",
      "zh-Hans": "修美乐",
      "ja": "Sau Mei Lok"
    }
  },
  {
    "id": "MED-003",
    "category": "health",
    "titles": {
      "en": "Liver-Flow",
      "zh-Hant": "滴肝",
      "zh-Hans": "滴肝",
      "ja": "Liver-Flow"
    }
  },
  {
    "id": "MED-004",
    "category": "health",
    "titles": {
      "en": "Sugar Destroyer",
      "zh-Hant": "滴糖",
      "zh-Hans": "滴糖",
      "ja": "Sugar Destroyer"
    }
  },
  {
    "id": "MED-005",
    "category": "health",
    "titles": {
      "en": "An Tang",
      "zh-Hant": "胺糖",
      "zh-Hans": "胺糖",
      "ja": "An Tang"
    }
  },
  {
    "id": "MED-006",
    "category": "health",
    "titles": {
      "en": "Mana Water",
      "zh-Hant": "甘露水",
      "zh-Hans": "甘露水",
      "ja": "Mana Water"
    }
  },
  {
    "id": "MED-007",
    "category": "health",
    "titles": {
      "en": "Gland Unblocked",
      "zh-Hant": "滴腺通",
      "zh-Hans": "滴腺通",
      "ja": "Gland Unblocked"
    }
  },
  {
    "id": "MED-008",
    "category": "health",
    "titles": {
      "en": "Depress Away",
      "zh-Hant": "百解憂",
      "zh-Hans": "百解忧",
      "ja": "Depress Away"
    }
  },
  {
    "id": "MED-009",
    "category": "health",
    "titles": {
      "en": "Natural Bezoar Drink",
      "zh-Hant": "安宮牛癀液",
      "zh-Hans": "安宫牛癀液",
      "ja": "Natural Bezoar Drink"
    }
  },
  {
    "id": "MED-010",
    "category": "health",
    "titles": {
      "en": "Warm Treasure",
      "zh-Hant": "暖寶",
      "zh-Hans": "暖宝",
      "ja": "Warm Treasure"
    }
  },
  {
    "id": "SUP-012",
    "category": "alcohol",
    "titles": {
      "en": "Shengming Heneng ginseng rice alcohol — inventory record",
      "zh-Hant": "生命核能人參米酒・清單記錄",
      "zh-Hans": "生命核能人参米酒・清单记录",
      "ja": "生命核能 高麗人参入り米酒・目録記録"
    }
  }
];

// Lookup by any authored locale value so changing language is reversible.
export const supplierDemoTranslations: Record<string, SupplierDemoCopy> = Object.fromEntries(
  [...supplierDemoSamples.flatMap(sample => [sample.titles, sample.descriptions]), ...Object.values({
  "tableware": {
    "en": "Tableware",
    "zh-Hant": "餐桌器具",
    "zh-Hans": "餐桌器具",
    "ja": "食器"
  },
  "tea": {
    "en": "Tea & coffee",
    "zh-Hant": "茶與咖啡器具",
    "zh-Hans": "茶与咖啡器具",
    "ja": "茶器・コーヒー用品"
  },
  "gifts": {
    "en": "Gifts",
    "zh-Hant": "禮品",
    "zh-Hans": "礼品",
    "ja": "ギフト"
  },
  "shoes": {
    "en": "Footwear",
    "zh-Hant": "鞋履",
    "zh-Hans": "鞋履",
    "ja": "シューズ"
  },
  "beauty": {
    "en": "Beauty & personal care",
    "zh-Hant": "美妝與個人護理",
    "zh-Hans": "美妆与个人护理",
    "ja": "美容・パーソナルケア"
  },
  "food": {
    "en": "Food & beverages",
    "zh-Hant": "食品與飲品",
    "zh-Hans": "食品与饮品",
    "ja": "食品・飲料"
  }
})].flatMap(copy => Object.values(copy).map(value => [value, copy])),
);
