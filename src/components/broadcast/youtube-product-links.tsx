import type {StoreLocale} from '@/lib/store-profile';
import {youtubeProductGroups,youtubeProductCopy,youtubeProductUrl} from '@/lib/broadcasts/youtube-products';
import './broadcast.css';
export function YouTubeProductLinks({locale,brand}:{locale:StoreLocale;brand?:string}){
 const groups=youtubeProductGroups(brand),copy=youtubeProductCopy(locale);
 if(!groups.length)return null;
 const list=<div className="youtube-product-groups">{groups.map(g=><div key={g.key} className="youtube-product-group"><h3>{g.key==='wool-shawls'?copy.shawls:g.key}</h3>{g.key==='wool-shawls'&&<p>{copy.unknown}</p>}<ul>{g.videos.map(v=><li key={v.videoId}><a href={youtubeProductUrl(v.videoId)} target="_blank" rel="noopener noreferrer" aria-label={`${g.key==='wool-shawls'?copy.shawls:g.key} · ${v.label[locale]} · ${copy.watch}`}><span>{v.label[locale]}</span><span aria-hidden="true">↗</span></a></li>)}</ul></div>)}</div>;
 return brand?<details className="youtube-brand-links"><summary>{copy.heading} · {brand} ({groups[0].videos.length})</summary>{list}</details>:<section className="youtube-product-links" aria-labelledby="youtube-products-heading"><h2 id="youtube-products-heading">{copy.heading}</h2><p>{copy.description}</p>{list}</section>;
}
