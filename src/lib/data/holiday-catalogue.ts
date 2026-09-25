import type { Product } from "@/types/commerce";

// Fictional seasonal merchandise. Images, sample prices and quantities are concepts.
export type HolidaySample = {
  slug: string; collectionId: string; category: string; price: number;
  title: readonly [string, string]; description: readonly [string, string];
};
export const holidaySamples: HolidaySample[] = [
  {
    "slug": "lotus-mooncake-box",
    "collectionId": "mid-autumn",
    "category": "Gifts",
    "price": 288,
    "title": [
      "Lotus mooncake gift box",
      "蓮蓉月餅禮盒"
    ],
    "description": [
      "A four-piece lotus mooncake concept in an ivory box, made for sharing beneath the autumn moon.",
      "四件裝蓮蓉月餅概念禮盒，以象牙白包裝盛載秋月下的團圓心意。"
    ]
  },
  {
    "slug": "snow-skin-mooncakes",
    "collectionId": "mid-autumn",
    "category": "Gifts",
    "price": 248,
    "title": [
      "Snow-skin mooncake selection",
      "冰皮月餅禮盒"
    ],
    "description": [
      "Six soft-toned mooncake concepts, arranged like a small palette of ivory, sage and blush.",
      "六件冰皮月餅概念款，以象牙白、鼠尾草綠與淡粉色編排成柔和禮盒。"
    ]
  },
  {
    "slug": "osmanthus-oolong-gift",
    "collectionId": "mid-autumn",
    "category": "Gifts",
    "price": 168,
    "title": [
      "Osmanthus oolong gift",
      "桂花烏龍茶禮"
    ],
    "description": [
      "An autumn tea-gift concept with a pale tin and the delicate colour of osmanthus flowers.",
      "淡色茶罐搭配桂花的細緻色彩，呈現秋日茶禮概念。"
    ]
  },
  {
    "slug": "moon-porcelain-plates",
    "collectionId": "mid-autumn",
    "category": "Lifestyle",
    "price": 128,
    "title": [
      "Moon porcelain plates",
      "月影瓷碟組"
    ],
    "description": [
      "Two ivory dessert plates with a small crescent detail for a shared mooncake moment.",
      "兩隻象牙白點心瓷碟，綴以小巧彎月，陪伴分享月餅的片刻。"
    ]
  },
  {
    "slug": "rabbit-paper-lantern",
    "collectionId": "mid-autumn",
    "category": "Gifts",
    "price": 98,
    "title": [
      "Rabbit paper lantern",
      "玉兔紙燈籠"
    ],
    "description": [
      "A cream paper rabbit and a bamboo handle, a gentle nod to moonlit evening walks.",
      "奶油色紙玉兔搭配竹製提把，為月下散步添一份溫柔意趣。"
    ]
  },
  {
    "slug": "pomelo-reunion-hamper",
    "collectionId": "mid-autumn",
    "category": "Gifts",
    "price": 198,
    "title": [
      "Pomelo reunion hamper",
      "柚香團圓禮籃"
    ],
    "description": [
      "A woven hamper concept with pomelos and a sage cloth, ready for the reunion table.",
      "柚子與鼠尾草綠布巾盛放於編織禮籃，呈現團圓餐桌的送禮概念。"
    ]
  },
  {
    "slug": "mandarin-new-year-hamper",
    "collectionId": "lunar-new-year",
    "category": "Gifts",
    "price": 188,
    "title": [
      "Mandarin New Year hamper",
      "新春柑橘禮籃"
    ],
    "description": [
      "Bright mandarins, natural packaging and a muted red ribbon welcome a fresh beginning.",
      "明亮柑橘、自然包裝與柔和紅色緞帶，迎接新一年的開始。"
    ]
  },
  {
    "slug": "vermilion-envelope-set",
    "collectionId": "lunar-new-year",
    "category": "Gifts",
    "price": 58,
    "title": [
      "Vermilion envelope set",
      "朱紅利是封組"
    ],
    "description": [
      "Six vermilion envelopes with a restrained gold-circle motif for handwritten good wishes.",
      "六枚朱紅利是封，配上簡潔金色圓紋，盛載親手寫下的祝願。"
    ]
  },
  {
    "slug": "new-year-rice-cake",
    "collectionId": "lunar-new-year",
    "category": "Gifts",
    "price": 138,
    "title": [
      "New Year rice cake",
      "新春年糕禮"
    ],
    "description": [
      "An amber rice-cake concept in a simple gift box, inspired by a familiar reunion treat.",
      "琥珀色年糕概念款配簡約禮盒，靈感來自熟悉的團年滋味。"
    ]
  },
  {
    "slug": "plum-blossom-teapot",
    "collectionId": "lunar-new-year",
    "category": "Lifestyle",
    "price": 228,
    "title": [
      "Plum blossom teapot",
      "梅花茶壺"
    ],
    "description": [
      "An ivory teapot with a small painted plum branch, a quiet centrepiece for New Year tea.",
      "象牙白茶壺綴以小枝梅花彩繪，為新春茶席添一份靜雅。"
    ]
  },
  {
    "slug": "lantern-dessert-bowls",
    "collectionId": "lantern-wishes",
    "category": "Lifestyle",
    "price": 148,
    "title": [
      "Lantern dessert bowl pair",
      "元宵甜品碗組"
    ],
    "description": [
      "Two simple bowls and wooden spoons for sweet rice balls and time around the table.",
      "兩隻簡約甜品碗搭配木匙，適合盛放湯圓，共享圍桌時光。"
    ]
  },
  {
    "slug": "star-wish-lantern-kit",
    "collectionId": "lantern-wishes",
    "category": "Gifts",
    "price": 118,
    "title": [
      "Star-wish lantern kit",
      "星願紙燈籠組"
    ],
    "description": [
      "An ivory paper lantern, bamboo ring and blank pastel tags for your own wishes.",
      "象牙白紙燈籠、竹環與淡色空白心願卡，寫下自己的小小願望。"
    ]
  },
  {
    "slug": "sakura-picnic-bento",
    "collectionId": "spring-picnic",
    "category": "Lifestyle",
    "price": 188,
    "title": [
      "Sakura picnic bento box",
      "櫻日野餐便當盒"
    ],
    "description": [
      "A natural wooden lunch box for a spring picnic beneath the blossoms.",
      "天然木色便當盒，為花下春日野餐準備一份從容。"
    ]
  },
  {
    "slug": "blossom-tea-cups",
    "collectionId": "spring-picnic",
    "category": "Lifestyle",
    "price": 128,
    "title": [
      "Blossom tea cups",
      "花影茶杯組"
    ],
    "description": [
      "Two ivory cups with pale petal details, bringing a little spring to the tea table.",
      "兩隻象牙白茶杯綴以淡色花瓣，為茶席帶來一點春意。"
    ]
  },
  {
    "slug": "spring-picnic-cloth",
    "collectionId": "spring-picnic",
    "category": "Travel",
    "price": 148,
    "title": [
      "Spring picnic cloth",
      "春日野餐布"
    ],
    "description": [
      "A sage gingham cloth for a slow afternoon in the park or a sunny corner at home.",
      "鼠尾草綠格紋布，鋪展公園午後或家中陽光角落的悠閒時光。"
    ]
  },
  {
    "slug": "ceramic-easter-eggs",
    "collectionId": "easter",
    "category": "Gifts",
    "price": 98,
    "title": [
      "Ceramic spring eggs",
      "陶瓷春日彩蛋"
    ],
    "description": [
      "Five ceramic eggs in quiet spring colours, a reusable seasonal table decoration.",
      "五枚柔和春色陶瓷彩蛋，可重複使用的季節餐桌擺設。"
    ]
  },
  {
    "slug": "pastel-chocolate-selection",
    "collectionId": "easter",
    "category": "Gifts",
    "price": 168,
    "title": [
      "Pastel chocolate selection",
      "淡彩朱古力禮盒"
    ],
    "description": [
      "A twelve-piece chocolate-box concept with gentle pastel tones and simple presentation.",
      "十二件裝朱古力禮盒概念，以柔和淡彩與簡約編排呈現。"
    ]
  },
  {
    "slug": "rabbit-linen-napkins",
    "collectionId": "easter",
    "category": "Lifestyle",
    "price": 88,
    "title": [
      "Rabbit linen napkin pair",
      "小兔亞麻餐巾組"
    ],
    "description": [
      "Two cream linen napkins with tiny rabbit embroidery for the spring table.",
      "兩條米白亞麻餐巾，配小巧兔子刺繡，點綴春日餐桌。"
    ]
  },
  {
    "slug": "peony-tea-gift",
    "collectionId": "family-gratitude",
    "category": "Gifts",
    "price": 198,
    "title": [
      "Peony and tea gift",
      "牡丹茶禮"
    ],
    "description": [
      "A pale peony bouquet and a simple tea tin, paired as a thoughtful thank-you concept.",
      "淡色牡丹花束搭配簡約茶罐，以一份茶禮概念傳達感謝。"
    ]
  },
  {
    "slug": "comfort-knit-throw",
    "collectionId": "family-gratitude",
    "category": "Lifestyle",
    "price": 298,
    "title": [
      "Comfort knit throw",
      "暖意針織披毯"
    ],
    "description": [
      "An oatmeal knit throw with soft tassels for familiar chairs and favourite people.",
      "燕麥色針織披毯配柔軟流蘇，陪伴熟悉的椅子與珍愛的人。"
    ]
  },
  {
    "slug": "coffee-for-two-gift",
    "collectionId": "family-gratitude",
    "category": "Gifts",
    "price": 228,
    "title": [
      "Coffee for two gift",
      "雙人咖啡禮盒"
    ],
    "description": [
      "Two ivory mugs and a coffee-pouch concept, an invitation to pause together.",
      "兩隻象牙白杯配咖啡包裝概念，邀請彼此共享片刻休息。"
    ]
  },
  {
    "slug": "gratitude-journal",
    "collectionId": "family-gratitude",
    "category": "Gifts",
    "price": 98,
    "title": [
      "Gratitude journal",
      "感謝手記"
    ],
    "description": [
      "A linen-bound notebook and a wooden pencil for words that deserve to be kept.",
      "布面筆記本搭配木鉛筆，留住值得珍藏的話語。"
    ]
  },
  {
    "slug": "wooden-play-blocks",
    "collectionId": "children-play",
    "category": "Gifts",
    "price": 188,
    "title": [
      "Wooden play blocks",
      "木製積木組"
    ],
    "description": [
      "A playful arrangement of natural wood shapes and sage accents, presented as a toy design concept.",
      "天然木形與鼠尾草綠相間的童趣排列，呈現玩具設計概念。"
    ]
  },
  {
    "slug": "koi-windsock",
    "collectionId": "children-play",
    "category": "Gifts",
    "price": 128,
    "title": [
      "Koi windsock",
      "鯉魚風飄"
    ],
    "description": [
      "An indigo and cream fabric carp, a restrained seasonal decoration inspired by Children’s Day.",
      "靛藍與米白布製鯉魚，以簡約色彩演繹兒童節季節裝飾。"
    ]
  },
  {
    "slug": "bamboo-leaf-rice-dumplings",
    "collectionId": "dragon-boat",
    "category": "Gifts",
    "price": 168,
    "title": [
      "Bamboo-leaf rice dumpling hamper",
      "竹葉粽子禮籃"
    ],
    "description": [
      "A four-piece rice-dumpling hamper concept, wrapped in leaves and tied with natural string.",
      "四件粽子禮籃概念款，以竹葉包裹、天然繩結繫好。"
    ]
  },
  {
    "slug": "embroidered-herbal-sachet",
    "collectionId": "dragon-boat",
    "category": "Gifts",
    "price": 58,
    "title": [
      "Embroidered sachet",
      "刺繡香囊"
    ],
    "description": [
      "A sage cloth sachet with a leaf motif and a cream cord, inspired by festival craft.",
      "鼠尾草綠布香囊，配葉紋刺繡與米白繩結，靈感來自節慶手作。"
    ]
  },
  {
    "slug": "indigo-summer-towel",
    "collectionId": "summer-journeys",
    "category": "Travel",
    "price": 78,
    "title": [
      "Indigo summer towel",
      "靛藍夏日手巾"
    ],
    "description": [
      "A folded cloth with a quiet wave pattern, a small companion for summer outings.",
      "帶有簡潔波浪圖案的手巾，成為夏日出遊的小伴侶。"
    ]
  },
  {
    "slug": "summer-picnic-basket",
    "collectionId": "summer-journeys",
    "category": "Travel",
    "price": 268,
    "title": [
      "Summer picnic basket",
      "夏日野餐籃"
    ],
    "description": [
      "Natural wicker, cream lining and a pair of cups make a considered picnic set.",
      "天然藤編、米白內襯與雙杯組合，構成用心的野餐套裝。"
    ]
  },
  {
    "slug": "bamboo-folding-fan",
    "collectionId": "summer-journeys",
    "category": "Travel",
    "price": 68,
    "title": [
      "Bamboo folding fan",
      "竹骨摺扇"
    ],
    "description": [
      "An ivory paper fan with bamboo ribs, simple enough to carry through the summer.",
      "象牙白紙面搭配竹骨，簡單輕巧地陪伴夏日時光。"
    ]
  },
  {
    "slug": "white-chrysanthemum-posy",
    "collectionId": "quiet-remembrance",
    "category": "Gifts",
    "price": 128,
    "title": [
      "White chrysanthemum posy",
      "白菊小花束"
    ],
    "description": [
      "A modest white flower arrangement for personal reflection and quiet remembrance.",
      "簡樸白色花束，用於個人靜思與安靜追念。"
    ]
  },
  {
    "slug": "quiet-votive-holder",
    "collectionId": "quiet-remembrance",
    "category": "Lifestyle",
    "price": 88,
    "title": [
      "Quiet votive holder",
      "靜思燭座"
    ],
    "description": [
      "An ivory ceramic holder and plain candle, a simple object for a reflective corner.",
      "象牙白陶瓷燭座配素色蠟燭，為靜思角落添一件簡單器物。"
    ]
  },
  {
    "slug": "gathering-picnic-set",
    "collectionId": "national-gatherings",
    "category": "Lifestyle",
    "price": 198,
    "title": [
      "Gathering picnic set",
      "相聚野餐組"
    ],
    "description": [
      "Muted red, navy and cream textiles with enamel cups for an easy outdoor gathering.",
      "柔和紅、深藍與米白織物配搪瓷杯，輕鬆佈置戶外相聚。"
    ]
  },
  {
    "slug": "harbour-tea-selection",
    "collectionId": "national-gatherings",
    "category": "Gifts",
    "price": 228,
    "title": [
      "Harbour tea selection",
      "海港茶禮"
    ],
    "description": [
      "Three plain tea tins in a blue-grey gift box, with a subtle harbour-inspired line drawing.",
      "三罐素色茶罐置於藍灰禮盒，配細緻海港線條圖案。"
    ]
  },
  {
    "slug": "pineapple-pastry-gift",
    "collectionId": "national-gatherings",
    "category": "Gifts",
    "price": 168,
    "title": [
      "Pineapple pastry gift",
      "鳳梨酥禮盒"
    ],
    "description": [
      "An eight-piece pineapple-pastry concept in an ivory box, inspired by a familiar visiting gift.",
      "八件裝鳳梨酥概念禮盒，以象牙白包裝演繹熟悉的伴手禮。"
    ]
  },
  {
    "slug": "maple-tea-bowl",
    "collectionId": "autumn-craft",
    "category": "Lifestyle",
    "price": 188,
    "title": [
      "Maple tea bowl",
      "楓色茶碗"
    ],
    "description": [
      "Rust and cream ceramic tones with a wooden whisk, inspired by autumn tea rituals.",
      "鐵鏽紅與米白陶色搭配木茶筅，靈感來自秋日茶席。"
    ]
  },
  {
    "slug": "woven-bottle-carrier",
    "collectionId": "autumn-craft",
    "category": "Travel",
    "price": 138,
    "title": [
      "Woven bottle carrier",
      "編織水瓶提袋"
    ],
    "description": [
      "A woven carrier, sage strap and cream bottle for a gentle walk through the season.",
      "編織提袋、鼠尾草綠背帶與米白水瓶，陪伴四季中的悠閒散步。"
    ]
  },
  {
    "slug": "ceramic-pumpkin",
    "collectionId": "halloween",
    "category": "Lifestyle",
    "price": 88,
    "title": [
      "Ceramic pumpkin",
      "陶瓷南瓜擺設"
    ],
    "description": [
      "A matte cream pumpkin with a sage stem, a quieter take on autumn decorating.",
      "啞光奶油色南瓜配鼠尾草綠瓜蒂，以靜雅色調佈置秋日。"
    ]
  },
  {
    "slug": "halloween-treat-pouch",
    "collectionId": "halloween",
    "category": "Gifts",
    "price": 48,
    "title": [
      "Autumn treat pouch",
      "秋日糖果袋"
    ],
    "description": [
      "A natural linen drawstring bag with small pumpkin embroidery for seasonal treats.",
      "天然亞麻束口袋配小南瓜刺繡，收好季節小點心。"
    ]
  },
  {
    "slug": "cocoa-night-trio",
    "collectionId": "halloween",
    "category": "Gifts",
    "price": 148,
    "title": [
      "Cocoa night trio",
      "可可夜三罐禮"
    ],
    "description": [
      "Three plain cocoa-tin concepts in a kraft tray, made for a cosy evening gathering.",
      "三罐素色可可包裝概念配牛皮紙托盤，演繹溫暖夜間相聚。"
    ]
  },
  {
    "slug": "harvest-table-runner",
    "collectionId": "thanksgiving",
    "category": "Lifestyle",
    "price": 138,
    "title": [
      "Harvest table runner",
      "豐收餐桌旗"
    ],
    "description": [
      "An ochre linen runner with a simple fringe for meals shared with good company.",
      "赭色亞麻桌旗配簡潔流蘇，鋪展與親友共享的一餐。"
    ]
  },
  {
    "slug": "ceramic-pie-dish",
    "collectionId": "thanksgiving",
    "category": "Lifestyle",
    "price": 148,
    "title": [
      "Ceramic pie dish",
      "陶瓷批盤"
    ],
    "description": [
      "An ivory fluted dish concept for a warm, welcoming harvest table.",
      "象牙白波紋批盤概念，為豐收餐桌添一份溫暖。"
    ]
  },
  {
    "slug": "spiced-cookie-tin",
    "collectionId": "thanksgiving",
    "category": "Gifts",
    "price": 128,
    "title": [
      "Spiced cookie tin",
      "香料曲奇禮罐"
    ],
    "description": [
      "A bronze-toned tin and round biscuit concepts, a simple seasonal sharing gift.",
      "古銅色禮罐配圓形餅乾概念款，分享簡單的季節心意。"
    ]
  },
  {
    "slug": "wooden-advent-house",
    "collectionId": "winter-gifting",
    "category": "Gifts",
    "price": 328,
    "title": [
      "Wooden advent house",
      "木製倒數小屋"
    ],
    "description": [
      "A small wooden house with twenty-four drawers for your own December surprises.",
      "二十四格抽屜木製小屋，放入屬於自己的十二月小驚喜。"
    ]
  },
  {
    "slug": "winter-wool-scarf",
    "collectionId": "winter-gifting",
    "category": "Apparel",
    "price": 198,
    "title": [
      "Winter wool scarf",
      "冬日羊毛圍巾"
    ],
    "description": [
      "A cream ribbed scarf with a quiet texture for crisp winter days.",
      "米白羅紋圍巾，以溫柔質感陪伴清冷冬日。"
    ]
  },
  {
    "slug": "paper-star-ornaments",
    "collectionId": "winter-gifting",
    "category": "Gifts",
    "price": 78,
    "title": [
      "Paper star ornaments",
      "紙星掛飾組"
    ],
    "description": [
      "Three folded ivory stars with linen loops, ready to bring a little lightness indoors.",
      "三枚摺紙象牙白星星配亞麻掛圈，為室內添一點輕盈。"
    ]
  },
  {
    "slug": "winter-cocoa-gift",
    "collectionId": "winter-gifting",
    "category": "Gifts",
    "price": 188,
    "title": [
      "Winter cocoa gift",
      "冬日可可禮盒"
    ],
    "description": [
      "A simple cocoa-jar concept and ceramic mug in an ivory box for a shared winter pause.",
      "簡約可可罐概念與陶瓷杯置於象牙白禮盒，共享冬日片刻。"
    ]
  },
  {
    "slug": "quiet-desk-calendar",
    "collectionId": "new-year",
    "category": "Lifestyle",
    "price": 98,
    "title": [
      "Quiet desk calendar",
      "簡約桌曆"
    ],
    "description": [
      "A wooden stand and blank planning cards, a stationery concept for a fresh start.",
      "木製支架配空白計劃卡，呈現迎接新開始的文具概念。"
    ]
  },
  {
    "slug": "nesting-meal-boxes",
    "collectionId": "new-year",
    "category": "Lifestyle",
    "price": 148,
    "title": [
      "Nesting meal boxes",
      "層疊餐盒組"
    ],
    "description": [
      "Three cream and sage lidded boxes for a more considered everyday routine.",
      "三件米白與鼠尾草綠帶蓋餐盒，為日常生活添一份用心。"
    ]
  },
  {
    "slug": "sesame-tangyuan-kit",
    "collectionId": "winter-solstice",
    "category": "Gifts",
    "price": 98,
    "title": [
      "Sesame tangyuan gift",
      "芝麻湯圓禮"
    ],
    "description": [
      "A black-sesame rice-ball gift concept inspired by winter reunion meals.",
      "黑芝麻湯圓送禮概念，靈感來自冬日團圓的一餐。"
    ]
  },
  {
    "slug": "reunion-soup-bowls",
    "collectionId": "winter-solstice",
    "category": "Lifestyle",
    "price": 138,
    "title": [
      "Reunion soup bowl pair",
      "團圓湯碗組"
    ],
    "description": [
      "Two warm ivory bowls and wooden spoons for soup, stories and unhurried evenings.",
      "兩隻暖白湯碗配木匙，盛載湯品、故事與從容夜晚。"
    ]
  }
];

export const holidayTranslations: Record<string, readonly [string, string]> = Object.fromEntries(
  holidaySamples.flatMap(sample => [[sample.title[0], sample.title], [sample.description[0], sample.description]]),
);
export const holidayProducts: Product[] = holidaySamples.map((sample, index) => ({
  id: `80000000-0000-4000-8000-${String(index + 1).padStart(12, "0")}`,
  sku: `SEASON-${sample.slug.toUpperCase()}`, slug: sample.slug,
  title: sample.title[0], description: sample.description[0],
  priceAmount: sample.price * 100, currency: "hkd", isDemo: true, stockQty: 50,
  category: sample.category, status: "published", featured: sample.collectionId === "mid-autumn",
  createdAt: "2026-09-25T00:00:00.000Z",
  images: [{ id: `img-${sample.slug}`, sourceUrl: `/editorial/holiday/${sample.slug}.jpg`, storagePath: null, altText: sample.title[0], position: 0 }],
}));
