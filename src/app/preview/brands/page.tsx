import {notFound} from 'next/navigation';
import {BrandShowcase} from '@/components/brands/brand-showcase';
import {getLocale} from '@/lib/locale-server';
import snapshot from '@/lib/data/brand-preview-products.json';
import {enrichSourceProduct} from '@/lib/data/source-catalogue';
import type {Product} from '@/types/commerce';
export const metadata={title:'Brand showcase preview',robots:{index:false,follow:false}};
export const dynamic='force-dynamic';
export default async function Preview(){if(process.env.NODE_ENV!=='development')notFound();const {locale}=await getLocale();return <BrandShowcase products={(snapshot as Product[]).map(p=>enrichSourceProduct(p))} locale={locale}/>;}
