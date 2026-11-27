import Link from "next/link";
import { notFound } from "next/navigation";
import { ProductCard } from "@/components/product/product-card";
import { brandFilms, productFilmPlaybackUrl } from "@/lib/broadcasts/product-films";
import { getProducts } from "@/lib/data/store";
import { winterEditProducts } from "@/lib/data/winter-edit";
import { getLocale } from "@/lib/locale-server";
import { getStoreProfile } from "@/lib/store-profile";

export const dynamic = "force-dynamic";

const labels = {
  en: {
    title: "Winter Edit",
    description: "A closer look at textured jackets and scarves for cooler days.",
    films: "Jackets and scarves in motion",
    shop: "Shop the edit",
    coming: "The product selection is coming soon.",
    browse: "Browse fashion and accessories",
  },
  "zh-Hant": {
    title: "冬日選物",
    description: "細看適合涼爽日子的質感外套與圍巾。",
    films: "外套與圍巾短片",
    shop: "選購冬日選物",
    coming: "冬日商品即將上架。",
    browse: "瀏覽時尚與配飾",
  },
  "zh-Hans": {
    title: "冬日选物",
    description: "细看适合凉爽日子的质感外套与围巾。",
    films: "外套与围巾短片",
    shop: "选购冬日选物",
    coming: "冬日商品即将上架。",
    browse: "浏览时尚与配饰",
  },
  ja: {
    title: "冬のセレクション",
    description: "肌寒い日に合う、表情豊かなジャケットとストールを動画でご紹介します。",
    films: "ジャケットとストールの動画",
    shop: "冬のアイテムを選ぶ",
    coming: "冬のアイテムは近日公開予定です。",
    browse: "ファッション・アクセサリーを見る",
  },
};

export async function generateMetadata() {
  const { locale } = await getLocale();
  const { title, description } = labels[locale];
  return { title, description };
}

export default async function WinterEditPage() {
  if (getStoreProfile().id !== "isuntvmall") notFound();
  const [{ locale }, products] = await Promise.all([getLocale(), getProducts()]);
  const copy = labels[locale];
  const films = brandFilms("Winter Edit");
  const selection = winterEditProducts(products);

  return (
    <div className="shell page-space winter-edit">
      <header className="page-intro">
        <h1>{copy.title}</h1>
        <p>{copy.description}</p>
      </header>
      {films.length > 0 && (
        <section aria-labelledby="winter-films">
          <h2 id="winter-films">{copy.films}</h2>
          <div className="brand-film-grid winter-film-grid">
            {films.map((film, index) => (
              <video key={film.id} className="brand-film-tile" poster={film.poster}
                aria-label={`${copy.films} ${index + 1}`} controls playsInline preload="none">
                <source src={productFilmPlaybackUrl(film)} type="video/mp4" />
              </video>
            ))}
          </div>
        </section>
      )}
      <section className="winter-catalogue" aria-labelledby="winter-products">
        <h2 id="winter-products">{copy.shop}</h2>
        {selection.length
          ? <div className="product-grid">{selection.map(product => <ProductCard key={product.id} product={product} />)}</div>
          : <p className="section-description">{copy.coming}</p>}
        <Link href="/shop?category=group-fashion" className="text-link">{copy.browse} →</Link>
      </section>
    </div>
  );
}
