import {notFound} from 'next/navigation';
import {BrandShowcase} from '@/components/brands/brand-showcase';
import {BroadcastCard} from '@/components/broadcast/broadcast-card';
import {BroadcastPlayer} from '@/components/broadcast/broadcast-player';
import {filmForBroadcast,filmCopy} from '@/lib/broadcasts/product-films';
import rows from '@/lib/broadcasts/preview-broadcasts.json';
import products from '@/lib/data/brand-preview-products.json';
import {enrichSourceProduct} from '@/lib/data/source-catalogue';
import {getLocale} from '@/lib/locale-server';
import {publicBroadcastTitle,type Broadcast} from '@/lib/broadcasts/contracts';
import type {Product} from '@/types/commerce';
export const metadata={title:'Product film review',robots:{index:false,follow:false}};
export const dynamic='force-dynamic';
export default async function Preview(){if(process.env.NODE_ENV!=='development')notFound();const {locale}=await getLocale();const all=(rows as Broadcast[]).filter(b=>b.kind==='broadcast');const ready=all.filter(b=>filmForBroadcast(b)),pending=all.filter(b=>!filmForBroadcast(b));return <><BrandShowcase products={(products as Product[]).map(p=>enrichSourceProduct(p))} locale={locale} broadcasts={all}/><section className="shell section"><h1>{filmCopy(locale).heading}</h1><p>{ready.length} / {all.length}</p>{ready.map(b=><section className="film-preview-item" key={b.id}><h2>{publicBroadcastTitle(b,locale)}</h2><BroadcastPlayer broadcast={b} locale={locale}/></section>)}<details className="film-review-queue"><summary>{filmCopy(locale).queue} ({pending.length})</summary><div className="broadcast-grid">{pending.map(b=><BroadcastCard key={b.id} broadcast={b} locale={locale}/>)}</div></details></section></>;}
