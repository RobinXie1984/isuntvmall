import manifest from './product-films.json';
import type {Locale} from '@/lib/i18n';
export type ProductFilm={id:string;brand:string;sourceUrl:string;src:string;poster:string;seconds:number;bytes:number;sha256:string;reviewState:string};
function sourceKey(value:string){try{const u=new URL(value);u.searchParams.delete('mibextid');return u.toString();}catch{return '';}}
export function validProductFilm(f:ProductFilm){return Boolean(f.brand.trim()&&Number.isSafeInteger(f.bytes)&&f.bytes>0&&f.bytes<=25*1024*1024&&f.seconds>0&&f.seconds<60&&/^\/brand-clips\/[a-z0-9-]+\.mp4$/.test(f.src)&&/^\/brand-clips\/[a-z0-9-]+\.jpg$/.test(f.poster)&&/^[a-f0-9]{64}$/.test(f.sha256)&&['preview','approved'].includes(f.reviewState));}
export function eligibleProductFilm(f:ProductFilm,environment=process.env.NODE_ENV){return validProductFilm(f)&&(f.reviewState==='approved'||environment==='development');}
export function approvedProductFilm(id:string){return (manifest as ProductFilm[]).find(f=>f.id===id&&f.reviewState==='approved'&&validProductFilm(f))??null;}
export function productFilmPlaybackUrl(f:ProductFilm){return process.env.NODE_ENV==='development'?f.src:'/api/product-films/'+f.id+'?v='+f.sha256.slice(0,16);}
export function filmForBroadcast(b:{id:string;url:string}){return (manifest as ProductFilm[]).find(f=>f.id===b.id&&sourceKey(f.sourceUrl)===sourceKey(b.url)&&eligibleProductFilm(f))??null;}
export function brandFilm(brand:string,broadcasts:readonly {id:string;url:string;visible:boolean}[]=[]){return (manifest as ProductFilm[]).find(f=>f.brand===brand&&eligibleProductFilm(f)&&broadcasts.some(b=>b.visible&&b.id===f.id&&sourceKey(b.url)===sourceKey(f.sourceUrl)))??null;}
export function filmCopy(locale:Locale){return {
 en:{title:'Product film',pending:'Product film being prepared',note:'A clean short product film is awaiting source material or review.',source:'Original source',queue:'Films awaiting source material or review',ready:'Product film',heading:'Brands in motion',description:'Short, quiet films focused on merchandise. Explore the brands and their details.'},
 'zh-Hant':{title:'商品短片',pending:'商品短片準備中',note:'乾淨的商品短片正等待原始影片或審核。',source:'原始來源',queue:'等待原始影片或審核的短片',ready:'商品短片',heading:'細看品牌',description:'以短片細看商品，探索品牌及產品細節。'},
 'zh-Hans':{title:'商品短片',pending:'商品短片准备中',note:'干净的商品短片正等待原始影片或审核。',source:'原始来源',queue:'等待原始影片或审核的短片',ready:'商品短片',heading:'细看品牌',description:'以短片细看商品，探索品牌及产品细节。'},
 ja:{title:'商品動画',pending:'商品動画を準備中',note:'短い商品動画の元映像または確認を待っています。',source:'元の映像',queue:'元映像または確認を待っている動画',ready:'商品動画',heading:'ブランドの表情',description:'商品を中心にした短い動画で、ブランドと細部をご覧ください。'}
 }[locale];}
