import type { Metadata } from "next";
import { CartProvider } from "@/components/cart/cart-provider";
import { LocaleProvider } from "@/components/i18n/locale-provider";
import { SiteFooter } from "@/components/site/site-footer";
import { SiteHeader } from "@/components/site/site-header";
import { getLocale } from "@/lib/locale-server";
import "./globals.css";
export async function generateMetadata():Promise<Metadata> {
 const {t}=await getLocale();
 return {title:{default:t("iSunTVMall — Considered everyday","iSunTVMall — 用心選好物"),template:"%s · iSunTVMall"},description:t("Thoughtful everyday finds, independent hosts, and a simpler way to shop.","用心挑選日常好物，與主播一起探索生活。")};
}
export default async function RootLayout({children}:Readonly<{children:React.ReactNode}>) {
 const {locale,t}=await getLocale();
 return <html lang={locale} data-scroll-behavior="smooth"><body><LocaleProvider initialLocale={locale}><CartProvider><a className="skip-link" href="#main-content">{t("Skip to content","跳至內容")}</a><SiteHeader/><div className="preview-banner" role="status">{t("Showroom preview · Sample products and hosts. Orders and payments are not open.","展示預覽・商品及主播均為演示，暫未開放訂單與付款。")}</div><main id="main-content">{children}</main><SiteFooter/></CartProvider></LocaleProvider></body></html>;
}
