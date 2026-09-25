import Link from "next/link";
import { notFound } from "next/navigation";
import { ProductCard } from "@/components/product/product-card";
import { getProducts } from "@/lib/data/store";
import { getLocale } from "@/lib/locale-server";
import { getHolidayCollection, holidayCollectionImage, productsForHoliday } from "@/lib/data/holiday-collections";

export const dynamic = "force-dynamic";
type Query = { category?: string; q?: string; sort?: string; collection?: string };
type Props = { searchParams: Promise<Query> };
export async function generateMetadata({ searchParams }: Props) {
  const [{ t, locale }, params] = await Promise.all([getLocale(), searchParams]);
  const collection = getHolidayCollection(params.collection);
  return { title: collection?.title[locale === "en" ? 0 : 1] ?? t("All products", "全部商品") };
}
export default async function ShopPage({ searchParams }: Props) {
  const [{ t, localize, locale }, products, params] = await Promise.all([getLocale(), getProducts(), searchParams]);
  const category = typeof params.category === "string" ? params.category : undefined;
  const q = typeof params.q === "string" ? params.q : "";
  const sort = typeof params.sort === "string" ? params.sort : "featured";
  const collectionId = typeof params.collection === "string" ? params.collection : undefined;
  const collection = getHolidayCollection(collectionId);
  if (collectionId && !collection) notFound();
  const language = locale === "en" ? 0 : 1;
  const selection = collection ? productsForHoliday(products, collection.id) : products;
  const categories = [...new Set(selection.map(p => p.category))];
  const visible = selection.filter(p => (!category || p.category === category) && (!q || [p.title, p.description, p.sku, localize(p.title), localize(p.description)].join(" ").toLowerCase().includes(q.toLowerCase()))).sort((a,b) => sort === "price-asc" ? a.priceAmount-b.priceAmount : sort === "price-desc" ? b.priceAmount-a.priceAmount : Number(b.featured)-Number(a.featured));
  const categoryUrl = (value?: string) => {
    const query = new URLSearchParams();
    if (collection) query.set("collection", collection.id);
    if (value) query.set("category", value);
    return `/shop${query.size ? `?${query}` : ""}`;
  };
  return <div className="shell page-space">
    {collection && <div className="collection-banner"><img src={holidayCollectionImage(collection.id)} alt={collection.title[language]} /><div><Link className="text-link" href="/collections">← {t("The holiday edit", "節日選物")}</Link><span className="eyebrow">{collection.occasion[language]}</span><h1>{collection.title[language]}</h1><p>{collection.description[language]}</p></div></div>}
    <div className="catalogue-heading">
      {!collection && <span className="eyebrow">{t("CONSIDERED EVERYDAY", "用心選好物")}</span>}
      {(!collection || q || category) && (collection ? <h2>{q ? t(`Results for “${q}”`, `「${q}」搜尋結果`) : localize(category!)}</h2> : <h1>{q ? t(`Results for “${q}”`, `「${q}」搜尋結果`) : category ? localize(category) : t("All products", "全部商品")}</h1>)}
      <form className="mobile-catalogue-search" action="/shop" role="search">
        {collection && <input type="hidden" name="collection" value={collection.id} />}{category && <input type="hidden" name="category" value={category} />}
        <input type="search" name="q" defaultValue={q} aria-label={t("Search the catalogue", "搜尋商品目錄")} placeholder={t("Search products", "搜尋商品")} /><button type="submit">{t("Search", "搜尋")}</button>
      </form>
    </div>
    <div className="catalogue-layout"><aside className="catalogue-sidebar"><h2>{t("Categories", "商品分類")}</h2><nav aria-label={t("Product categories", "商品分類")}>
      <Link className={!category ? "active" : ""} href={categoryUrl()}>{collection ? t("All in collection", "系列全部商品") : t("All products", "全部商品")}</Link>
      {categories.map(c => <Link className={category === c ? "active" : ""} key={c} href={categoryUrl(c)}>{localize(c)}</Link>)}
      <Link href="/collections">{t("Holiday collections", "節日系列")}</Link>{collection && <Link href="/shop">{t("Entire catalogue", "完整商品目錄")}</Link>}
    </nav></aside><div>
      <form className="catalogue-toolbar" action="/shop"><span>{t(`${visible.length} items`, `${visible.length} 件商品`)}</span>
        {category && <input type="hidden" name="category" value={category} />}{q && <input type="hidden" name="q" value={q} />}{collection && <input type="hidden" name="collection" value={collection.id} />}
        <div><label htmlFor="sort">{t("Sort by", "排序")}</label><select id="sort" name="sort" defaultValue={sort}><option value="featured">{t("Featured", "精選優先")}</option><option value="price-asc">{t("Price: low to high", "價格由低至高")}</option><option value="price-desc">{t("Price: high to low", "價格由高至低")}</option></select><button className="sort-apply" type="submit">{t("Apply", "套用")}</button></div>
      </form>
      <div className="product-grid product-grid-wide">{visible.map(p => <ProductCard key={p.id} product={p} />)}</div>
      {!visible.length && <div className="empty-state"><h2>{t("No products found", "未找到商品")}</h2><p>{t("Try another search or browse the collection.", "請嘗試其他關鍵字，或瀏覽全部商品。")}</p><Link className="button" href={categoryUrl()}>{t("View all products", "查看全部商品")}</Link></div>}
    </div></div>
  </div>;
}
