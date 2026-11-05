'use client';
import {useState} from 'react';
import {useLocale} from '@/components/i18n/locale-provider';
import {LOCALES,LOCALE_NAMES,type Locale} from '@/lib/i18n';
import {slugFromName,productUrl,plainText,type ProductSeo} from '@/lib/seo';
import {productTitle,productDescription} from '@/lib/product-copy';
import {sourcePriceEntry} from '@/lib/data/price-review';
import {getStoreProfile} from '@/lib/store-profile';
export function SearchEngineListing({productId,title,titleZh,description,descriptionZh,slug,seo,onChange}:{productId:string;title:string;titleZh:string;description:string;descriptionZh:string;slug:string;seo:ProductSeo;onChange:(slug:string,seo:ProductSeo)=>void}) {
 const {t}=useLocale();const [language,setLanguage]=useState<Locale>('en');
 const source=sourcePriceEntry(productId),p={title,titleZh,description,descriptionZh,localizedCopy:source?{title:source.title,description:source.description}:undefined};
 const name=productTitle(p,language),body=productDescription(p,language);
 const effectiveSlug=slug||slugFromName(title),entry=seo[language]||{},previewTitle=plainText(entry.title||name)||t('Product name','商品名稱','商品名');
 return <details className="seo-editor"><summary>{t('Search Engine Listing','搜尋引擎列表','検索エンジンの表示')}</summary>
 <p>{t('Blank fields use the published product copy. Search engines may show a different snippet. URL changes take effect only after approval and preserve old links with a permanent redirect.','留空時使用已發布商品文案。搜尋引擎可能採用不同摘要。網址修改須經審批，舊網址會永久轉址。','空欄は公開済みの商品情報を使用します。検索エンジンが別の要約を表示する場合があります。URL変更は承認後に反映され、旧URLは恒久転送されます。')}</p>
 <label>{t('SEO language','SEO 語言','SEO言語')}<select value={language} onChange={e=>setLanguage(e.target.value as Locale)}>{LOCALES.map(l=><option key={l} value={l}>{LOCALE_NAMES[l]}</option>)}</select></label>
 <label>{t('SEO title','SEO 標題','SEOタイトル')}<input maxLength={180} value={entry.title||''} placeholder={name} onChange={e=>onChange(slug,{...seo,[language]:{...entry,title:e.target.value}})}/><small>{(entry.title||name).length} / 70 {t('recommended characters','建議字元','推奨文字数')}</small></label>
 <label>{t('Meta description','中繼描述','メタ説明')}<textarea maxLength={500} value={entry.description||''} placeholder={plainText(body).slice(0,320)} onChange={e=>onChange(slug,{...seo,[language]:{...entry,description:e.target.value}})}/><small>{(entry.description||plainText(body)).length} / 160 {t('recommended characters','建議字元','推奨文字数')}</small></label>
 <label>{t('URL slug','網址別名','URLスラッグ')}<input maxLength={180} value={slug} placeholder={slugFromName(title)} onChange={e=>onChange(e.target.value,seo)}/></label>
 <button type="button" onClick={()=>onChange(slugFromName(title),seo)}>{t('Generate from product name','從商品名稱產生','商品名から生成')}</button>
 <div className="search-preview" aria-label={t('Search result preview','搜尋結果預覽','検索結果プレビュー')} aria-live="polite"><small>{getStoreProfile().name}</small><div>{productUrl(effectiveSlug,language)}</div><strong>{previewTitle} · {getStoreProfile().name}</strong><p>{plainText(entry.description||body).slice(0,320)||`${name} · ${getStoreProfile().name}`}</p></div>
 <small>{t('Only languages with translated product titles and descriptions receive hreflang. SEO text alone does not create a translated product page.','只有商品名稱及描述均已翻譯的語言才加入 hreflang。填寫 SEO 文案不會自動翻譯商品頁。','商品名と説明が翻訳済みの言語のみhreflangを出力します。SEO入力だけでは商品ページは翻訳されません。')}</small>
 </details>;
}
