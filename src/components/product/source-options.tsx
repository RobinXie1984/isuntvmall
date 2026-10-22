"use client";
import { useState } from 'react';
import { useLocale } from '@/components/i18n/locale-provider';
import { formatLocalizedMoney } from '@/lib/i18n';
import type { SourceListing } from '@/types/commerce';
export function SourceOptions({ listing }: { listing: SourceListing }) {
  const {locale,t}=useLocale();
  const [selected,setSelected]=useState(listing.variants[0].options.map(o=>o['zh-Hant']));
  const variant=listing.variants.find(v=>v.options.every((o,i)=>o['zh-Hant']===selected[i]));
  const valid=/^[a-z0-9-]+$/.test(listing.handle) && variant && /^\d+$/.test(variant.id);
  return <section className="source-options" aria-label={t('Product options','商品選項','商品オプション')}>
    {listing.variants.length>1 && listing.options.map((option,i)=>{
      const choices=[...new Map(listing.variants.map(v=>[v.options[i]['zh-Hant'],v.options[i]])).values()];
      return <label key={i}>{option[locale]}<select value={selected[i]} onChange={e=>setSelected(old=>old.map((v,n)=>n===i?e.target.value:v))}>{choices.map(c=><option key={c['zh-Hant']} value={c['zh-Hant']}>{c[locale]}</option>)}</select></label>;
    })}
    <p className="product-price" aria-live="polite">{variant?formatLocalizedMoney(variant.priceAmount,'HKD',locale):t('This combination is unavailable','此組合暫不提供','この組み合わせはありません')}</p>
    {variant?.priceIsPlaceholder && <p className="source-note">{t("Placeholder price — final price to be confirmed.","暫定價格，實際售價待確認。","仮の価格です。実際の販売価格は確認中です。")}</p>}
    {valid && <a className="button" href={`https://suntvmall.com/products/${listing.handle}?variant=${variant.id}`} target="_blank" rel="noopener noreferrer">{t('View & buy on SunTVMall','前往 SunTVMall 查看及購買','SunTVMall で確認・購入')} ↗</a>}
    <p className="source-note">{t('Photos show a representative colour or set. Confirm the selected option, current price, stock, delivery and returns on SunTVMall before paying. Checkout opens in a new tab.','圖片展示其中一款顏色或套裝。付款前，請在 SunTVMall 確認所選款式、最新價格、庫存、配送及退換貨安排。購買頁會在新分頁開啟。','写真は代表的な色・セットです。選択内容、最新価格、在庫、配送、返品条件を SunTVMall で確認してからご購入ください。購入ページは新しいタブで開きます。')}</p>
    <small>{t('Catalogue checked','商品目錄核對日期','カタログ確認日')}: {listing.snapshotAt}</small>
  </section>;
}
