"use client";

import Link from "next/link";
import { useState, type CSSProperties } from "react";
import { useLocale } from "@/components/i18n/locale-provider";
import { DEFAULT_STYLE, getStylePreset, stylePresets, type StyleId, type StylePreset } from "@/lib/styles";

type Pair = readonly [string, string];
const words: Record<StyleId, { name: Pair; title: Pair; note: Pair; motif: Pair }> = {
  muji: { name: ["MUJI · Quiet essentials", "無印靈感 · 靜謐日常"], title: ["A little less.\nA little lovelier.", "簡單一點，\n日子美好一點。"], note: ["Familiar things, chosen with care. For the ordinary moments that make a life.", "用心挑選熟悉的物件，陪伴構成生活的每個尋常片刻。"], motif: ["Natural · Useful · Unhurried", "自然 · 實用 · 從容"] },
  apple: { name: ["Apple · Every detail, clear", "蘋果靈感 · 細節清晰"], title: ["Remarkably simple.\nEntirely yours.", "簡單得剛剛好，\n為你而存在。"], note: ["Meet the small details that make everyday things feel extraordinary.", "看看那些細微之處，如何讓日常物件變得不凡。"], motif: ["Clarity · Space · Precision", "清晰 · 留白 · 精準"] },
  amazon: { name: ["Amazon · Easy discovery", "亞馬遜靈感 · 輕鬆探索"], title: ["Good finds.\nA better everyday.", "發現好物，\n過好每一天。"], note: ["Explore useful picks, compare the details and find your next favourite.", "探索實用選物、比較細節，找到下一件心頭好。"], motif: ["Find · Compare · Choose", "尋找 · 比較 · 選擇"] },
  openai: { name: ["OpenAI · Room for possibility", "開放靈感 · 留白的可能"], title: ["What makes\na good everyday?", "怎樣才算，\n美好的日常？"], note: ["A few thoughtful objects. A new perspective. Something worth discovering together.", "幾件用心的物品，一個嶄新角度，一份值得一起發現的美好。"], motif: ["Explore · Consider · Connect", "探索 · 思考 · 連結"] },
  "daks-burberry": { name: ["DAKS × Burberry · Heritage", "英倫靈感 · 從容格調"], title: ["The quiet art\nof everyday elegance.", "把從容優雅，\n穿進日常。"], note: ["Tailored details and enduring textures, considered for the way we live now.", "精緻細節與耐看的質感，為當下的生活方式而選。"], motif: ["Tailored · Timeless · Textural", "精緻 · 雋永 · 質感"] },
  "hermes-valentino": { name: ["Hermès × Valentino · Art of giving", "匠心靈感 · 禮物的藝術"], title: ["Small treasures.\nExtraordinary gestures.", "小小珍藏，\n滿滿心意。"], note: ["A touch of colour, a story of craft, a gift that makes the moment.", "一抹色彩，一段匠心故事，一件成就此刻的禮物。"], motif: ["Craft · Colour · Ceremony", "匠心 · 色彩 · 儀式"] },
};
const products = [
  { slug: "plum-blossom-teapot", title: ["Plum blossom teapot", "梅花茶壺"] as Pair, category: ["A quiet tea ritual", "靜雅茶時光"] as Pair, image: "/editorial/holiday/plum-blossom-teapot.jpg", price: 228 },
  { slug: "winter-wool-scarf", title: ["Winter wool scarf", "冬日羊毛圍巾"] as Pair, category: ["Softness for cooler days", "給清冷日子的溫柔"] as Pair, image: "/editorial/holiday/winter-wool-scarf.jpg", price: 198 },
  { slug: "city-travel-pack", title: ["City bag", "輕便提袋"] as Pair, category: ["Made for the everyday", "為日常出行而選"] as Pair, image: "/editorial/bag.jpg", price: 76 },
];
function styleVariables(preset: StylePreset): CSSProperties {
  return { "--sg-bg": preset.colors.background, "--sg-surface": preset.colors.surface, "--sg-text": preset.colors.text, "--sg-muted": preset.colors.muted, "--sg-accent": preset.colors.accent, "--sg-border": preset.colors.border, "--sg-radius": `${preset.radius}px`, "--sg-heading": preset.typography.heading, "--sg-body": preset.typography.body } as CSSProperties;
}

export function StyleGallery() {
  const { t, locale } = useLocale();
  const [active, setActive] = useState<StyleId>(DEFAULT_STYLE);
  const [bag, setBag] = useState<string[]>([]);
  const [showBag, setShowBag] = useState(false);
  const [query, setQuery] = useState("");
  const index = locale === "en" ? 0 : 1;
  const preset = getStylePreset(active)!;
  const copy = words[active];
  const filteredProducts = products.filter(product => `${product.title[index]} ${product.category[index]}`.toLowerCase().includes(query.toLowerCase().trim()));
  const bagTotal = bag.reduce((total, slug) => total + (products.find(product => product.slug === slug)?.price ?? 0), 0);
  const money = (amount: number) => new Intl.NumberFormat(locale === "en" ? "en-HK" : "zh-HK", { style: "currency", currency: "HKD", maximumFractionDigits: 0 }).format(amount);
  function choose(id: StyleId) { setActive(id); setQuery(""); setShowBag(false); }
  return <div className="shell page-space style-library">
    <div className="sl-intro"><div><span className="eyebrow">{t("THE iSunTVMall STYLE LIBRARY", "風格圖書館")}</span><h1>{t("One point of view.\nSix ways to express it.", "一份品味，\n六種表達。")}</h1></div><div className="sl-intro-note"><p>{t("The same thoughtful objects, seen in a different light. Explore six original directions for our shop and live rooms.", "同樣用心的物件，在不同光影下展現新意。探索六款店舖與直播間的原創風格提案。")}</p><span className="sl-current"><i aria-hidden="true" />{t("Our storefront stays MUJI", "店舖維持靜謐日常風格")}</span></div></div>
    <div className="sl-selector" role="group" aria-label={t("Choose a preview style", "選擇預覽風格")}>
      {stylePresets.map((item, itemIndex) => <button type="button" key={item.id} className="sl-choice" aria-pressed={active === item.id} aria-controls="style-preview" onClick={() => choose(item.id)}>
        <span className={`sl-mini sg-${item.id}`} style={styleVariables(item)} aria-hidden="true"><span className="sl-mini-top"><span>iSunTVMall</span><span>○</span></span><span className="sl-mini-story"><span className="sl-mini-title">{words[item.id].title[index]}</span><img src={products[0].image} alt="" loading="lazy" /></span><span className="sl-mini-products">{products.map(product => <img key={product.slug} src={product.image} alt="" loading="lazy" />)}</span></span>
        <span className="sl-choice-label"><span className="sl-choice-number">0{itemIndex + 1}</span><span>{words[item.id].name[index]}</span><span aria-hidden="true">{active === item.id ? "●" : "○"}</span></span>
      </button>)}
    </div>
    <div className="sl-preview-heading"><div><span className="eyebrow">{t("INTERACTIVE PREVIEW", "互動預覽")}</span><h2>{copy.name[index]}</h2></div><p>{t("Try a style. Explore the sample bag. Your live shop remains unchanged.", "試選風格，體驗示範購物袋；現有店舖不會因此改動。")}</p></div>
    <section id="style-preview" className={`sg-preview sg-${active}`} style={styleVariables(preset)} aria-label={t(`${preset.name} style preview`, `${copy.name[index]}預覽`)}>
      <header className="sg-nav"><span className="sg-wordmark">iSunTVMall<span>◦</span></span><span className="sg-nav-links">{t("Objects", "選物")}<span>{t("Stories", "故事")}</span><span>{t("Live rooms", "直播間")}</span></span><button type="button" className="sg-bag-toggle" onClick={() => setShowBag(!showBag)} aria-expanded={showBag}>{t("Sample bag", "示範購物袋")} <span>{bag.length}</span></button></header>
      {showBag && <div className="sg-bag-panel"><div><strong>{t("Your sample selection", "你的示範選物")}</strong><p>{bag.length ? t(`${bag.length} items · ${money(bagTotal)}`, `${bag.length} 件商品 · ${money(bagTotal)}`) : t("Your sample bag is empty.", "示範購物袋尚未加入商品。")}</p></div>{bag.length > 0 && <button type="button" onClick={() => setBag([])}>{t("Clear sample bag", "清空示範購物袋")}</button>}<small>{t("This preview does not create an order or change your shopping bag.", "此預覽不會建立訂單或更改你的購物袋。")}</small></div>}
      {active === "amazon" && <div className="sg-discovery"><label htmlFor="style-search">{t("Find a little everyday joy", "尋找日常的小美好")}</label><input id="style-search" value={query} onChange={event => setQuery(event.target.value)} placeholder={t("Search the three sample products", "搜尋三件示範商品")} /><span>{t("3 considered picks", "3 件用心選物")}</span></div>}
      <div className="sg-hero"><div className="sg-story"><span className="sg-kicker">{t("THE EVERYDAY COLLECTION", "日常選物系列")}</span><h3>{copy.title[index]}</h3><p>{copy.note[index]}</p><a href="#style-products" className="sg-action">{t("Explore the selection", "探索選物")} <span aria-hidden="true">↗</span></a></div><div className="sg-hero-image"><img src={products[0].image} alt={products[0].title[index]} /><span className="sg-image-note">{t("No. 01 · A quiet tea ritual", "01 · 靜雅茶時光")}</span></div></div>
      <div className="sg-editorial-line"><span>{copy.motif[index]}</span><span>{t("Thoughtfully selected by iSunTVMall", "用心挑選每一件好物")}</span></div>
      <div className="sg-products-section" id="style-products"><div className="sg-section-head"><h4>{t("Objects for living well", "為美好生活而選")}</h4><span>{t("Three favourites, six perspectives", "三件好物，六種視角")}</span></div><div className="sg-products">{filteredProducts.map(product => <article className="sg-product" key={product.slug}><Link href={`/product/${product.slug}`} className="sg-product-image"><img src={product.image} alt={product.title[index]} loading="lazy" /></Link><div className="sg-product-text"><small>{product.category[index]}</small><h5><Link href={`/product/${product.slug}`}>{product.title[index]}</Link></h5><div><span>{money(product.price)}</span><button type="button" aria-label={t(`Add ${product.title[0]} to sample bag`, `把${product.title[1]}加入示範購物袋`)} onClick={() => setBag(current => [...current, product.slug])}>{t("Add", "加入")} +</button></div></div></article>)}</div>{!filteredProducts.length && <p className="sg-empty">{t("No sample products match. Try tea, scarf or bag.", "沒有相符的示範商品，請試試茶壺、圍巾或提袋。")}</p>}<span className="sl-sr-only" aria-live="polite">{t(`${bag.length} items in your sample bag`, `示範購物袋有 ${bag.length} 件商品`)}</span></div>
      <div className="sg-live"><div className="sg-live-art"><img src="/editorial/everyday.jpg" alt={t("A selection of everyday objects", "日常物件選集")} loading="lazy" /><span className="sg-play" aria-hidden="true">▷</span><span className="sg-live-label">{t("ROOM PREVIEW", "直播間預覽")}</span></div><div className="sg-live-copy"><span className="sg-kicker">{t("A CONVERSATION, A DISCOVERY", "一場對話，一次發現")}</span><h4>{t("Good things,\nbetter together.", "好物，\n一起發現更美好。")}</h4><p>{t("Watch a host’s story and keep their featured selection within reach.", "跟隨主播的分享，把心儀選物留在身邊。")}</p><Link href="/live" className="sg-action">{t("Explore sample rooms", "探索示範直播間")} <span aria-hidden="true">↗</span></Link><small>{t("Layout demonstration · No live broadcast in this preview", "版面示範 · 此預覽沒有播放直播")}</small></div></div>
      <div className="sg-preview-footer"><span>iSunTVMall</span><span>{t("A considered everyday.", "用心過日常。")}</span></div>
    </section>
    <section className="sl-design-notes"><div><span className="eyebrow">{t("THE DESIGN LANGUAGE", "設計語言")}</span><h2>{t("A character, not just a colour.", "風格，從不只是一種顏色。")}</h2><p>{locale === "en" ? preset.description.en : preset.description.zh}</p></div><div className="sl-palette" aria-label={t("Preview palette", "預覽配色")}>{Object.entries(preset.colors).map(([key, value]) => <span key={key} title={value}><i style={{ background: value }} /><small>{value}</small></span>)}</div><p className="sl-reference-note">{t("Independent iSunTVMall interpretations of our references. Original imagery, our own compositions, no brand affiliation. Image batches use conservative resizing and canvas treatment; product colours and details are preserved.", "以參考風格為起點，發展獨立原創的構圖與影像，不代表任何品牌合作。批次圖片僅作保守的尺寸及畫布調整，保留商品原有顏色與細節。")}</p></section>
    <Link href="/" className="text-link">← {t("Back to our everyday storefront", "返回日常店舖")}</Link>
  </div>;
}
