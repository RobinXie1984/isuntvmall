import rows from './youtube-products.json';
import {z} from 'zod';
import type {StoreLocale} from '@/lib/store-profile';
const copy=z.object({en:z.string().min(1),'zh-Hant':z.string().min(1),'zh-Hans':z.string().min(1),ja:z.string().min(1)}).strict();
export const youtubeProductSchema=z.object({videoId:z.string().regex(/^[\w-]{11}$/),brand:z.enum(['MALOVE','ALLURA','wool-shawls']),label:copy}).strict();
export const youtubeProducts=z.array(youtubeProductSchema).parse(rows);
if(new Set(youtubeProducts.map(v=>v.videoId)).size!==youtubeProducts.length)throw Error('DUPLICATE_PRODUCT_VIDEO');
export function youtubeProductUrl(videoId:string){if(!/^[\w-]{11}$/.test(videoId))throw Error('INVALID_PRODUCT_VIDEO');return 'https://www.youtube.com/watch?v='+videoId;}
export function youtubeProductGroups(brand?:string){return (['MALOVE','ALLURA','wool-shawls'] as const).filter(b=>(!brand||b===brand)&&youtubeProducts.some(v=>v.brand===b)).map(key=>({key,videos:youtubeProducts.filter(v=>v.brand===key)}));}
export function youtubeProductCopy(locale:StoreLocale){return {
 en:{heading:'Original videos on YouTube',description:'Individual merchandise and brand videos. Open the original video on YouTube.',watch:'Watch on YouTube',more:'More videos',shawls:'Wool shawls',unknown:'The source does not specify a brand.'},
 'zh-Hant':{heading:'YouTube 原版影片',description:'按品牌及商品整理的個別影片，連結將開啟 YouTube 原片。',watch:'前往 YouTube 觀看',more:'更多影片',shawls:'羊毛披肩',unknown:'來源未列明品牌。'},
 'zh-Hans':{heading:'YouTube 原版视频',description:'按品牌及商品整理的单独视频，链接将打开 YouTube 原片。',watch:'前往 YouTube 观看',more:'更多视频',shawls:'羊毛披肩',unknown:'来源未列明品牌。'},
 ja:{heading:'YouTubeの元動画',description:'ブランドや商品ごとの動画です。リンクからYouTubeの元動画をご覧いただけます。',watch:'YouTubeで見る',more:'ほかの動画',shawls:'ウールショール',unknown:'配信元にブランド名の記載はありません。'}
 }[locale];}
