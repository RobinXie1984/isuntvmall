import Link from "next/link";
import type { Broadcast } from "@/lib/broadcasts/contracts";
import { brandFilms, filmCopy, productFilmPlaybackUrl } from "@/lib/broadcasts/product-films";
import { showcaseBrands, brandProducts } from "@/lib/brand-showcase";
import { exhibitionFilmLeads, exhibitionProducts } from "@/lib/data/homepage-exhibition";
import { ProductCard } from "@/components/product/product-card";
import { SourcePhoto } from "@/components/product/source-photo";
import type { Product } from "@/types/commerce";
import type { StoreLocale } from "@/lib/store-profile";

const labels = {
  en: { title: "Discover the brands", showcase: "KOL showcase", collection: "View collection and films", replays: "Watch the previews" },
  "zh-Hant": { title: "探索品牌", showcase: "創作者短片", collection: "瀏覽系列及短片", replays: "觀看預告" },
  "zh-Hans": { title: "探索品牌", showcase: "创作者短片", collection: "浏览系列及短片", replays: "观看预告" },
  ja: { title: "ブランドを見つける", showcase: "クリエイター動画", collection: "コレクションと動画を見る", replays: "予告動画を見る" },
};

export function BrandShowcase({
  products, locale, broadcasts = [], curated = false, brandId,
}: {
  products: Product[];
  locale: StoreLocale;
  broadcasts?: Broadcast[];
  curated?: boolean;
  brandId?: string;
}) {
  const copy = labels[locale];
  const videoCopy = filmCopy(locale);
  const selections = showcaseBrands
    .filter(brand => !brandId || brand.id === brandId)
    .map(brand => ({ brand, items: brandProducts(products, brand.match) }))
    .filter(selection => Boolean(brandId) || selection.items.length > 0);
  if (!selections.length) return null;

  return (
    <section className="shell brand-showcase" id={curated ? "kol-showcase" : undefined} aria-label={curated ? copy.showcase : copy.title}>
      {!brandId && <header className="section-heading">
        <h1>{curated ? copy.showcase : copy.title}</h1>
        <nav>{selections.map(({ brand }) => <a key={brand.id} href={'#brand-' + brand.id}>{brand.name}</a>)}</nav>
      </header>}
      {selections.map(({ brand, items }) => {
        const displayed = curated ? exhibitionProducts(items).slice(0, 4) : brandId ? items : items.slice(0, 8);
        const feature = curated ? exhibitionFilmLeads[brand.id] : undefined;
        const films = brandFilms(brand.name, broadcasts);
        if (feature) {
          const first = films.findIndex(film => film.id === feature.id);
          if (first > 0) films.unshift(...films.splice(first, 1));
        }
        const Heading = brandId ? "h1" : "h2";
        return (
          <section id={'brand-' + brand.id} className="brand-story" key={brand.id}>
            <div className={'brand-banner' + (displayed.length ? '' : ' brand-banner-text-only')}>
              <div className="brand-banner-copy">
                <Heading>{brand.name}</Heading>
                <p>{brand.description[locale]}</p>
                {curated && <Link className="text-link" href={'/brands/' + brand.id}>{copy.collection} →</Link>}
                {brand.replays && <p><Link className="text-link" href={brand.replays}>{copy.replays} →</Link></p>}
              </div>
              {displayed[0] && <div className="brand-banner-photo"><SourcePhoto product={displayed[0]} alt={brand.name} /></div>}
            </div>
            <div className={curated ? "exhibition-brand-display" : undefined}>
              {films.length > 0 ? (
                <div className="brand-film-grid" role="group" aria-label={`${brand.name} · ${videoCopy.title}`}>
                  {films.map((film, index) => (
                    <video key={film.id} className="brand-film-tile" controls playsInline preload="none"
                      poster={(film.id === feature?.id && feature.poster) || film.poster} aria-label={`${brand.name} · ${videoCopy.title} ${index + 1}`}>
                      <source src={productFilmPlaybackUrl(film)} type="video/mp4" />
                    </video>
                  ))}
                </div>
              ) : !curated && !brand.replays && (
                <div className="brand-film-pending">
                  <span aria-hidden="true">▷</span>
                  <div><h3>{videoCopy.pending}</h3><p>{videoCopy.note}</p></div>
                </div>
              )}
              {displayed.length > 0 && <div className="product-grid">{displayed.map(p => <ProductCard key={p.id} product={p} />)}</div>}
            </div>
          </section>
        );
      })}
    </section>
  );
}
