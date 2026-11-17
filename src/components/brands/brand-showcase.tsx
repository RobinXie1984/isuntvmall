import type {Broadcast} from '@/lib/broadcasts/contracts';
import {brandFilm} from "@/lib/broadcasts/product-films";
import {showcaseBrands,brandProducts,usableClip} from '@/lib/brand-showcase';
import {ProductCard} from '@/components/product/product-card';
import {SourcePhoto} from '@/components/product/source-photo';
import type {Product} from '@/types/commerce';
import type {StoreLocale} from '@/lib/store-profile';
export function BrandShowcase({products,locale,broadcasts=[]}:{products:Product[];locale:StoreLocale;broadcasts?:Broadcast[]}){
 const copy={en:{title:'Discover the brands',clip:'Product film coming soon',note:'Original broadcast footage is being prepared for a short product film.'},'zh-Hant':{title:'探索品牌',clip:'商品短片準備中',note:'正從原始直播影片準備商品展示短片。'},'zh-Hans':{title:'探索品牌',clip:'商品短片准备中',note:'正从原始直播影片准备商品展示短片。'},ja:{title:'ブランドを見つける',clip:'商品動画を準備中',note:'元の配信映像から短い商品紹介動画を準備しています。'}}[locale];
 const selections=showcaseBrands.map(brand=>({brand,items:brandProducts(products,brand.match)})).filter(s=>s.items.length);
 if(!selections.length)return null;
 return <section className="shell brand-showcase" aria-label={copy.title}><header className="section-heading"><h1>{copy.title}</h1><nav>{selections.map(({brand})=><a key={brand.id} href={'#brand-'+brand.id}>{brand.name}</a>)}</nav></header>{selections.map(({brand,items})=>{const clip=brandFilm(brand.name,broadcasts)??usableClip(brand.clip);return <section id={'brand-'+brand.id} className="brand-story" key={brand.id}><div className="brand-banner"><div className="brand-banner-copy"><span className="eyebrow">{brand.name}</span><h2>{brand.name}</h2><p>{brand.description[locale]}</p></div><div className="brand-banner-photo"><SourcePhoto product={items[0]} alt={brand.name}/></div></div>{clip?<video className="brand-film" controls playsInline preload="metadata" poster={clip.poster} aria-label={brand.name}><source src={clip.src} type="video/mp4"/></video>:<div className="brand-film-pending"><span aria-hidden="true">▷</span><div><h3>{copy.clip}</h3><p>{copy.note}</p></div></div>}<div className="product-grid">{items.slice(0,8).map(p=><ProductCard key={p.id} product={p}/>)}</div></section>;})}</section>;
}
