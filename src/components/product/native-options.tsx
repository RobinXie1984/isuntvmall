'use client';
import {useState} from 'react';
import {useLocale} from '@/components/i18n/locale-provider';
import {formatLocalizedMoney} from '@/lib/i18n';
import type {CartSource,Product} from '@/types/commerce';
import {AddToCartButton} from '@/components/cart/add-to-cart-button';
export function NativeOptions({product,source}:{product:Product;source?:CartSource}){
 const {t,locale}=useLocale();const variants=product.nativeVariants||[];const [id,setId]=useState('');const variant=variants.find(v=>v.id===id);const image=variant&&product.images.find(i=>variant.imageIds.includes(i.id));
 return <div><label>{t('Choose an option','選擇規格','種類を選択')}<select value={id} onChange={e=>setId(e.target.value)}><option value="">{t('Select','請選擇','選択してください')}</option>{variants.map(v=><option key={v.id} value={v.id}>{v.labels?.[locale]||t('Option unavailable','規格資料未齊','種類情報がありません')}</option>)}</select></label>{image&&<img src={image.sourceUrl} alt={image.altText} />}{variant&&<p aria-live="polite">{formatLocalizedMoney(variant.priceAmount,product.currency,locale)}{variant.priceIsPlaceholder&&` · ${t('Demo price','示範價格','デモ価格')}`}</p>}{variant?<AddToCartButton productId={product.id} variantId={variant.id} source={source} disabled={variant.priceIsPlaceholder||variant.stockQty===null||variant.stockQty<1||!!product.isDemo}/>:<button type="button" className="button button-block" disabled>{t("Choose an option", "請先選擇規格", "種類を選択してください")}</button>}</div>;
}
