import { hasProductImage } from './product-image';
import type { Product, CatalogueCopy } from '@/types/commerce';
export const showcaseBrands: {id:string;name:string;match:string;replays?:string;description:CatalogueCopy;clip:{src:string;seconds:number;poster:string}|null}[]=[
 {id:'malove',name:'MALOVE',match:'MALOVE MZ',description:{en:'Shoes for everyday dressing. Explore the current selection, from simple flats to textured styles.','zh-Hant':'為日常穿搭挑選鞋履，探索簡約平底鞋及富有質感的款式。','zh-Hans':'为日常穿搭挑选鞋履，探索简约平底鞋及富有质感的款式。',ja:'日々の装いに合わせるシューズ。シンプルなフラットから表情のある一足まで。'},clip:null},
 {id:'honayin',name:'HONAYIN',match:'HONAYIN',description:{en:'Bags for the everyday wardrobe. Discover shapes, colours and details in the current collection.','zh-Hant':'配合日常衣櫥的手袋，細看現有系列的輪廓、顏色及細節。','zh-Hans':'配合日常衣橱的手袋，细看现有系列的轮廓、颜色及细节。',ja:'日々のワードローブに合わせるバッグ。コレクションの形、色、ディテールをご覧ください。'},clip:null},
 {id:'allura',name:'ALLURA',match:'Ethica',replays:'/watch#youtube-originals-allura',description:{
  en:'A hair-care feature with ALLURA. Explore Ethica essentials and watch the original previews from iSunTV.',
  'zh-Hant':'透過 ALLURA 專題探索 Ethica 日常護髮用品，並觀看陽光衛視的原版預告。',
  'zh-Hans':'透过 ALLURA 专题探索 Ethica 日常护发用品，并观看阳光卫视的原版预告。',
  ja:'ALLURAのヘアケア特集。Ethicaのデイリーケア用品とiSunTVの予告動画をご覧ください。',
 },clip:null}
];
export function brandProducts(products:Product[],match:string){return products.filter(p=>p.brand===match&&p.status==='published'&&p.isDemo===false&&Boolean(p.sourceListing||p.nativeCatalogueEnabled)&&hasProductImage(p));}
export function usableClip(clip:typeof showcaseBrands[number]['clip']){return clip&&clip.seconds>0&&clip.seconds<60&&/^\/brand-clips\/[a-z0-9-]+\.mp4$/.test(clip.src)?clip:null;}
