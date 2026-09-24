import type { Product } from "@/types/commerce";

// Fictional merchandising concepts. Prices, quantities and imagery are demo data.
// Keep language fields separate so catalogue copy never relies on text splitting.
type Sample = {
  slug: string;
  category: string;
  price: number;
  title: readonly [string, string];
  description: readonly [string, string];
};

export const expandedSamples: Sample[] = [
  { slug: "linen-overshirt", category: "Apparel", price: 228, title: ["Linen overshirt", "亞麻外搭襯衫"], description: ["A sand-coloured linen layer with an easy silhouette for slower mornings and city afternoons.", "沙色亞麻外搭，剪裁自在，陪你度過悠閒早晨與城市午後。"] },
  { slug: "relaxed-cotton-trousers", category: "Apparel", price: 198, title: ["Relaxed cotton trousers", "寬鬆純棉長褲"], description: ["Olive cotton trousers with a relaxed shape, ready for everyday pairings.", "橄欖綠純棉長褲，寬鬆剪裁，輕鬆配搭日常衣著。"] },
  { slug: "ribbed-tank", category: "Apparel", price: 78, title: ["Ribbed tank", "羅紋背心"], description: ["A chalk-white ribbed tank to wear on its own or under your favourite shirt.", "粉白色羅紋背心，可單穿，也可配搭喜愛的襯衫。"] },
  { slug: "knit-cardigan", category: "Apparel", price: 268, title: ["Soft knit cardigan", "柔軟針織外套"], description: ["An oatmeal knit cardigan for a little extra comfort when the day cools down.", "燕麥色針織外套，天氣微涼時添一份柔軟舒適。"] },
  { slug: "striped-long-sleeve", category: "Apparel", price: 138, title: ["Striped long-sleeve tee", "條紋長袖上衣"], description: ["Cream and navy stripes in a familiar long-sleeve shape for unhurried days.", "米白與深藍條紋，經典長袖剪裁，適合悠閒日常。"] },
  { slug: "everyday-socks", category: "Apparel", price: 48, title: ["Everyday socks, set of three", "日常襪子三雙裝"], description: ["Three pairs in quiet neutral tones, a simple start to the everyday wardrobe.", "三雙柔和中性色襪子，從細節搭配日常衣櫥。"] },
  { slug: "cotton-cap", category: "Apparel", price: 88, title: ["Cotton cap", "純棉鴨舌帽"], description: ["A soft sage cap with an understated shape for walks, errands and weekends.", "柔和鼠尾草綠帽款，造型簡約，適合散步、外出與週末。"] },
  { slug: "soft-linen-scarf", category: "Apparel", price: 128, title: ["Soft linen scarf", "柔軟亞麻圍巾"], description: ["A natural-toned linen scarf with an airy drape and an easy, lived-in texture.", "原色亞麻圍巾，垂墜輕盈，呈現自然自在的質感。"] },
  { slug: "waffle-lounge-shorts", category: "Apparel", price: 118, title: ["Waffle lounge shorts", "窩夫格居家短褲"], description: ["Grey textured lounge shorts made for quiet mornings and time at home.", "灰色窩夫格居家短褲，陪伴安靜早晨與家中時光。"] },
  { slug: "canvas-apron", category: "Apparel", price: 148, title: ["Canvas apron", "帆布圍裙"], description: ["A sand canvas apron for kitchen experiments, tending plants and making things.", "沙色帆布圍裙，適合下廚、照料植物與手作時光。"] },
  { slug: "stoneware-mug", category: "Lifestyle", price: 68, title: ["Stoneware mug", "炻器馬克杯"], description: ["A matte ivory mug with a generous handle for your favourite daily brew.", "啞光象牙白杯身配寬握把，盛載每天喜愛的飲品。"] },
  { slug: "glass-carafe", category: "Lifestyle", price: 98, title: ["Glass carafe", "玻璃水壺"], description: ["A clear glass carafe that brings a simple finishing touch to the table.", "透明玻璃水壺，為餐桌添上簡單俐落的一筆。"] },
  { slug: "breakfast-bowl", category: "Lifestyle", price: 58, title: ["Breakfast bowl", "早餐陶碗"], description: ["A cream speckled bowl for porridge, fruit and the first meal of the day.", "米白斑點陶碗，適合盛放粥品、水果與每日第一餐。"] },
  { slug: "acacia-serving-board", category: "Lifestyle", price: 138, title: ["Acacia serving board", "相思木餐板"], description: ["Warm wood grain and a simple outline for sharing bread and small bites.", "溫潤木紋與簡潔輪廓，用來分享麵包與輕食小點。"] },
  { slug: "linen-table-napkins", category: "Lifestyle", price: 108, title: ["Linen napkins, set of four", "亞麻餐巾四件裝"], description: ["Four natural linen napkins to make everyday meals feel a little more considered.", "四條原色亞麻餐巾，讓日常用餐多一份用心。"] },
  { slug: "amber-soap-dispenser", category: "Lifestyle", price: 78, title: ["Amber soap dispenser", "琥珀玻璃皂液瓶"], description: ["An empty amber glass pump bottle for a tidy sink-side arrangement.", "琥珀色玻璃按壓空瓶，讓洗手台邊整潔有序。"] },
  { slug: "cotton-bath-towel", category: "Lifestyle", price: 128, title: ["Cotton bath towel", "純棉浴巾"], description: ["A sand-coloured cotton towel with a soft, comforting texture for the daily routine.", "沙色純棉浴巾，柔軟舒適的觸感，融入每日生活。"] },
  { slug: "bedside-lamp", category: "Lifestyle", price: 298, title: ["Bedside lamp", "床頭檯燈"], description: ["A small cream lamp with a rounded shade, a quiet companion beside the bed.", "小巧奶油色檯燈，圓潤燈罩，靜靜陪伴床邊時光。"] },
  { slug: "woven-storage-basket", category: "Lifestyle", price: 168, title: ["Woven storage basket", "編織收納籃"], description: ["A natural woven basket to gather blankets, magazines and the little things.", "天然色編織收納籃，收好毯子、雜誌與日常小物。"] },
  { slug: "cushion-cover", category: "Lifestyle", price: 98, title: ["Sage cotton cushion", "鼠尾草綠棉質靠墊"], description: ["A square sage cushion to add a gentle note of colour to your favourite chair.", "方形鼠尾草綠靠墊，為喜愛的椅子添一抹柔和色彩。"] },
  { slug: "weekend-duffel", category: "Travel", price: 298, title: ["Weekend duffel", "週末旅行袋"], description: ["A charcoal canvas holdall for an overnight stay or a few days away.", "炭灰帆布旅行袋，適合留宿一晚或短途出走。"] },
  { slug: "packing-cubes", category: "Travel", price: 118, title: ["Packing cubes, set of three", "旅行收納袋三件裝"], description: ["Three sand-coloured zip organisers to give clothing its own place in your bag.", "三件沙色拉鏈收納袋，讓行李中的衣物各就各位。"] },
  { slug: "travel-wash-bag", category: "Travel", price: 88, title: ["Travel wash bag", "旅行盥洗包"], description: ["An olive zip pouch for keeping everyday toiletries together on the move.", "橄欖綠拉鏈收納包，出門時將日常盥洗用品整齊收好。"] },
  { slug: "stainless-travel-bottle", category: "Travel", price: 148, title: ["Stainless travel bottle", "不鏽鋼隨行水瓶"], description: ["A matte sand travel bottle with a clean silhouette for daily journeys.", "啞光沙色隨行水瓶，輪廓簡潔，陪伴每日旅程。"] },
  { slug: "compact-umbrella", category: "Travel", price: 98, title: ["Compact umbrella", "輕便摺疊雨傘"], description: ["A navy folding umbrella to keep close for changeable city weather.", "深藍摺疊雨傘，隨身準備，應對城市多變天氣。"] },
  { slug: "passport-cover", category: "Travel", price: 128, title: ["Passport cover", "護照套"], description: ["A plain tan passport cover for keeping a travel essential neatly tucked away.", "簡約棕褐色護照套，妥善收好旅程中的重要物品。"] },
  { slug: "soft-eye-mask", category: "Travel", price: 58, title: ["Soft eye mask", "柔軟眼罩"], description: ["A charcoal sleep mask for a quiet pause at home or on a longer journey.", "炭灰色眼罩，讓你在家中或長途旅程享受片刻安靜。"] },
  { slug: "foldaway-tote", category: "Travel", price: 68, title: ["Foldaway tote", "摺疊手提袋"], description: ["A natural canvas tote that folds down neatly for spontaneous market finds.", "原色帆布手提袋，方便摺好隨身攜帶，收納市集中的小發現。"] },
  { slug: "candle-gift-set", category: "Gifts", price: 168, title: ["Candle gift set", "蠟燭禮盒"], description: ["Three small candles in a simple kraft box, a thoughtful gesture for a new home.", "三款小蠟燭配簡約牛皮紙盒，為新居送上一份心意。"] },
  { slug: "tea-cup-pair", category: "Gifts", price: 98, title: ["Tea cups for two", "雙人茶杯組"], description: ["Two ivory ceramic tea cups for sharing an unhurried conversation.", "兩隻象牙白陶瓷茶杯，陪伴一場從容的對話。"] },
  { slug: "notebook-gift-set", category: "Gifts", price: 118, title: ["Notebook gift set", "筆記本禮盒"], description: ["Three cloth-covered notebooks in neutral shades for notes, lists and new ideas.", "三本中性色布面筆記本，記錄筆記、清單與新靈感。"] },
  { slug: "incense-holder-set", category: "Gifts", price: 128, title: ["Incense holder set", "香座禮盒"], description: ["A simple ceramic tray and a bundle of incense sticks for a considered corner.", "簡潔陶瓷香盤搭配線香，佈置一個用心的角落。"] },
  { slug: "dried-flower-posy", category: "Gifts", price: 98, title: ["Dried flower posy", "乾花小花束"], description: ["A small tied bouquet in natural tones, ready for a shelf or a thoughtful gift.", "一束自然色調乾花，可點綴層架，也可傳遞心意。"] },
  { slug: "hand-towel-gift", category: "Gifts", price: 88, title: ["Hand towel gift pair", "手巾雙件禮盒"], description: ["A cream and sage towel pair, a useful little gift for everyday comfort.", "米白與鼠尾草綠手巾組合，送上實用又舒適的日常小禮。"] },
  { slug: "compact-bluetooth-speaker", category: "Tech", price: 238, title: ["Compact wireless speaker", "小巧無線喇叭"], description: ["A charcoal fabric speaker concept for a favourite playlist and a quiet afternoon.", "炭灰布面喇叭概念款，伴你聆聽喜愛的歌單，享受安靜午後。"] },
  { slug: "aluminium-phone-stand", category: "Tech", price: 78, title: ["Aluminium phone stand", "鋁製手機支架"], description: ["A clean-lined aluminium stand to give your phone a place on the desk.", "線條簡潔的鋁製支架，讓手機在桌面上有專屬位置。"] },
  { slug: "braided-charging-cable", category: "Tech", price: 58, title: ["Braided charging cable", "編織充電線"], description: ["A sand-coloured braided cable concept for a more considered charging corner.", "沙色編織充電線概念款，讓充電角落更整齊協調。"] },
  { slug: "wireless-charging-pad", category: "Tech", price: 148, title: ["Wireless charging pad", "無線充電座"], description: ["A round cream charging-pad concept with a quiet presence on the bedside table.", "奶油色圓形充電座概念款，安靜融入床頭桌面。"] },
  { slug: "felt-laptop-sleeve", category: "Tech", price: 128, title: ["Felt laptop sleeve", "毛氈電腦保護套"], description: ["An envelope-style grey felt sleeve for carrying your everyday work companion.", "信封式灰色毛氈保護套，收好每天相伴的工作夥伴。"] },
  { slug: "cable-organiser", category: "Tech", price: 88, title: ["Cable organiser", "線材收納包"], description: ["A charcoal zip organiser to gather small cables and keep your bag in order.", "炭灰拉鏈收納包，集中整理小線材，讓袋內井然有序。"] },
];

export const expandedTranslations: Record<string, readonly [string, string]> = Object.fromEntries(
  expandedSamples.flatMap(sample => [[sample.title[0], sample.title], [sample.description[0], sample.description]]),
);

export const expandedProducts: Product[] = expandedSamples.map((sample, index) => ({
  id: `70000000-0000-4000-8000-${String(index + 1).padStart(12, "0")}`,
  sku: `DEMO-${sample.slug.toUpperCase()}`,
  slug: sample.slug,
  title: sample.title[0],
  description: sample.description[0],
  priceAmount: sample.price * 100,
  currency: "hkd",
  isDemo: true,
  stockQty: 50,
  category: sample.category,
  status: "published",
  featured: ["linen-overshirt", "stoneware-mug", "weekend-duffel", "candle-gift-set"].includes(sample.slug),
  createdAt: "2026-09-24T08:00:00.000Z",
  images: [{ id: `img-${sample.slug}`, sourceUrl: `/editorial/expanded/${sample.slug}.jpg`, storagePath: null, altText: sample.title[0], position: 0 }],
}));
