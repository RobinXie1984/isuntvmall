import { checkoutReleaseReady } from "@/lib/stripe/runtime";
import { getStoreProfile, storeCopy } from "@/lib/store-profile";
import type { Metadata } from "next";
import { CartProvider } from "@/components/cart/cart-provider";
import { LocaleProvider } from "@/components/i18n/locale-provider";
import { SiteFooter } from "@/components/site/site-footer";
import { SiteHeader } from "@/components/site/site-header";
import { getLocale } from "@/lib/locale-server";
import "./globals.css";
export async function generateMetadata():Promise<Metadata> {
 const {locale}=await getLocale(); const profile=getStoreProfile();
 return {metadataBase:new URL(profile.origin),title:{default:storeCopy(profile.copy.title,locale),template:`%s · ${profile.name}`},description:storeCopy(profile.copy.description,locale),robots:profile.indexing==="noindex"?{index:false,follow:false}:undefined,icons:{icon:[{url:profile.brand.icons.favicon},{url:profile.brand.icons.icon192}],shortcut:profile.brand.icons.favicon,apple:[{url:profile.brand.icons.apple}]},manifest:"/site.webmanifest"};
}
export default async function RootLayout({children}:Readonly<{children:React.ReactNode}>) {
 const {locale,t}=await getLocale(); const profile=getStoreProfile();
 return <html lang={locale} data-scroll-behavior="smooth"><body><LocaleProvider initialLocale={locale}><CartProvider turnstileSiteKey={process.env.TURNSTILE_SITE_KEY?.trim() || ""}><a className="skip-link" href="#main-content">{t("Skip to content","跳至內容")}</a><SiteHeader/>{(profile.catalogueMode==="demo"||!checkoutReleaseReady())&&<div className="preview-banner" role="status">{profile.catalogueMode==="demo"?t("Showroom preview · Sample products and hosts. Orders and payments are not open.","展示預覽・商品及主播均為演示，暫未開放訂單與付款。"):t("Store setup · Ordering is not open yet.","商店設定中・暫未開放訂購。","ショップ準備中・注文はまだ受け付けていません。")}</div>}<main id="main-content">{children}</main><SiteFooter/></CartProvider></LocaleProvider></body></html>;
}
