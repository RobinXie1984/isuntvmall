import { holidaySamples } from "./holiday-catalogue";
import type { Product } from "@/types/commerce";
export type HolidayCollection = { id: string; title: readonly [string,string]; description: readonly [string,string]; occasion: readonly [string,string] };
export const holidayCollections: HolidayCollection[] = [
  {
    "id": "mid-autumn",
    "title": [
      "Moonlit reunion",
      "月下團圓"
    ],
    "description": [
      "Mooncakes, tea and small rituals for a table shared beneath the autumn moon.",
      "月餅、茶香與小小儀式，在秋月下分享一桌團圓。"
    ],
    "occasion": [
      "25 September 2026",
      "2026 年 9 月 25 日"
    ]
  },
  {
    "id": "lunar-new-year",
    "title": [
      "A fresh beginning",
      "新歲好景"
    ],
    "description": [
      "Mandarin gifts, considered red envelopes and a quiet New Year tea table.",
      "柑橘禮、用心利是封與靜雅茶席，迎接新歲。"
    ],
    "occasion": [
      "Lunar New Year",
      "農曆新年"
    ]
  },
  {
    "id": "lantern-wishes",
    "title": [
      "Little wishes, softly lit",
      "燈下小願"
    ],
    "description": [
      "Paper lanterns, sweet bowls and a place for the wishes you write yourself.",
      "紙燈籠、甜品碗與親手寫下的心願，點亮小小時光。"
    ],
    "occasion": [
      "Lanterns & wishes",
      "燈節與心願"
    ]
  },
  {
    "id": "spring-picnic",
    "title": [
      "Under the blossoms",
      "花下春日"
    ],
    "description": [
      "Natural wood, petal details and soft green linen for slower spring afternoons.",
      "天然木色、花瓣細節與柔綠亞麻，鋪展從容春日。"
    ],
    "occasion": [
      "Spring gatherings",
      "春日相聚"
    ]
  },
  {
    "id": "easter",
    "title": [
      "A softer spring",
      "柔彩春光"
    ],
    "description": [
      "Reusable ceramics, rabbit details and a pastel confectionery concept.",
      "陶瓷擺設、小兔細節與淡彩甜點概念，迎接春光。"
    ],
    "occasion": [
      "Easter weekend",
      "復活節週末"
    ]
  },
  {
    "id": "family-gratitude",
    "title": [
      "For those we love",
      "給珍愛的人"
    ],
    "description": [
      "Flowers, warm layers and thoughtful words for the people who make a difference.",
      "以花、暖意與用心話語，感謝生命中重要的人。"
    ],
    "occasion": [
      "Love & gratitude",
      "愛與感謝"
    ]
  },
  {
    "id": "children-play",
    "title": [
      "Small days, big wonder",
      "小日子大想像"
    ],
    "description": [
      "Natural play shapes and a gentle carp windsock, made for a little imagination.",
      "天然積木形狀與柔色鯉魚風飄，為小小想像添一筆。"
    ],
    "occasion": [
      "Children’s celebrations",
      "童心節日"
    ]
  },
  {
    "id": "dragon-boat",
    "title": [
      "Wrapped with care",
      "葉裡心意"
    ],
    "description": [
      "Leaf-wrapped gift concepts and embroidered craft for the Dragon Boat season.",
      "葉裹送禮概念與刺繡手作，傳遞端午心意。"
    ],
    "occasion": [
      "Dragon Boat Festival",
      "端午節"
    ]
  },
  {
    "id": "summer-journeys",
    "title": [
      "A little further outdoors",
      "走進夏日"
    ],
    "description": [
      "Woven baskets, indigo cloth and a folding fan for easy summer journeys.",
      "藤籃、靛藍手巾與摺扇，陪伴輕鬆夏日出遊。"
    ],
    "occasion": [
      "Summer & long weekends",
      "夏日與長週末"
    ]
  },
  {
    "id": "quiet-remembrance",
    "title": [
      "A moment of reflection",
      "片刻靜思"
    ],
    "description": [
      "Simple flowers and quiet objects for personal remembrance, without fanfare.",
      "簡單花束與靜雅器物，陪伴個人的安靜追念。"
    ],
    "occasion": [
      "Reflection & remembrance",
      "靜思與追念"
    ]
  },
  {
    "id": "national-gatherings",
    "title": [
      "Around the same table",
      "相聚一桌"
    ],
    "description": [
      "Tea, familiar pastries and picnic pieces for spending time together.",
      "以茶、熟悉糕點與野餐小物，共享相聚時光。"
    ],
    "occasion": [
      "Days together",
      "相聚的日子"
    ]
  },
  {
    "id": "autumn-craft",
    "title": [
      "The considered autumn",
      "用心過秋日"
    ],
    "description": [
      "Warm ceramic tones and woven textures, inspired by walks and quiet craft.",
      "溫潤陶色與編織質感，靈感來自散步與靜心手作。"
    ],
    "occasion": [
      "Autumn traditions",
      "秋日節俗"
    ]
  },
  {
    "id": "halloween",
    "title": [
      "An autumn evening",
      "秋夜小聚"
    ],
    "description": [
      "Pumpkin details and cocoa tones, keeping the season playful and understated.",
      "南瓜細節與可可色調，簡約演繹季節童趣。"
    ],
    "occasion": [
      "Halloween",
      "萬聖節"
    ]
  },
  {
    "id": "thanksgiving",
    "title": [
      "A table of thanks",
      "感謝的一桌"
    ],
    "description": [
      "Harvest linen, familiar bakeware and a small tin to pass around the table.",
      "豐收色亞麻、熟悉烘焙器皿與一罐分享心意。"
    ],
    "occasion": [
      "Thanksgiving",
      "感恩節"
    ]
  },
  {
    "id": "winter-gifting",
    "title": [
      "Warmth, thoughtfully wrapped",
      "把暖意包好"
    ],
    "description": [
      "Paper stars, soft wool and little December surprises in a quiet winter palette.",
      "紙星、柔軟羊毛與十二月小驚喜，包裹靜雅冬日暖意。"
    ],
    "occasion": [
      "Christmas & winter giving",
      "聖誕與冬日送禮"
    ]
  },
  {
    "id": "new-year",
    "title": [
      "Space for a new year",
      "新年留白"
    ],
    "description": [
      "Simple stationery and everyday organisation for a considered fresh start.",
      "簡約文具與日常收納，用心迎接新開始。"
    ],
    "occasion": [
      "New Year’s Day",
      "元旦"
    ]
  },
  {
    "id": "winter-solstice",
    "title": [
      "The warmth of reunion",
      "冬至團圓暖"
    ],
    "description": [
      "Sweet rice-ball concepts, soup bowls and time set aside for the people at home.",
      "湯圓概念禮、湯碗與專為家人留下的相聚時光。"
    ],
    "occasion": [
      "Winter solstice",
      "冬至"
    ]
  }
];
export function getHolidayCollection(id: string | undefined) {
  return holidayCollections.find(collection => collection.id === id);
}
export function holidayCollectionImage(id: string) {
  const sample = holidaySamples.find(product => product.collectionId === id);
  return sample ? `/editorial/holiday/${sample.slug}.jpg` : "/editorial/everyday.jpg";
}
export function productsForHoliday(products: Product[], id: string) {
  const slugs = new Set(holidaySamples.filter(product => product.collectionId === id).map(product => product.slug));
  return products.filter(product => product.isDemo && slugs.has(product.slug));
}
export function collectionForProduct(slug: string) {
  return getHolidayCollection(holidaySamples.find(product => product.slug === slug)?.collectionId);
}
