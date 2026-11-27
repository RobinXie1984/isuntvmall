"use client";

import { Suspense } from "react";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { demoCollectionId, demoCollectionTitle } from "@/lib/data/catalogue-audience";
import { generatedDemoGroups } from "@/lib/data/generated-demo";
import { browseGroups, mallBrowseGroups } from "@/lib/browse-categories";
import { CartCount } from "@/components/cart/cart-count";
import { BrandMark } from "@/components/site/brand-mark";
import { getStoreProfile, sourceCatalogueEnabled, supplierCollectionEnabled, holidayCollectionsEnabled } from "@/lib/store-profile";
import { LOCALE_NAMES, type Locale } from "@/lib/i18n";
import { useLocale } from "@/components/i18n/locale-provider";

type ShopNavState = { category: string | null; collection: string | null; query: string | null };

function SiteNavigation({ shop }: { shop?: ShopNavState }) {
  const { t } = useLocale();
  const mall = getStoreProfile().id === "isuntvmall";
  const demo = mall && shop?.collection === demoCollectionId;
  const hasSearch = Boolean(shop?.query);
  const collection = demo ? demoCollectionId : shop?.collection === "suntvmall" ? "suntvmall" : undefined;
  const groups = demo ? mallBrowseGroups.filter(group => generatedDemoGroups.has(group.id)) : mall ? mallBrowseGroups : browseGroups;
  const category = shop?.category === "Apparel" && mall ? "group-clothing" : shop?.category;

  function categoryHref(group: string) {
    const query = new URLSearchParams();
    if (collection) query.set("collection", collection);
    query.set("category", `group-${group}`);
    return `/shop?${query}`;
  }

  return (
    <nav className={`shell category-nav${mall ? " mall-category-nav" : ""}`} aria-label={t("Main navigation", "主要導覽", "メインナビゲーション")}>
      <Link href="/shop" aria-current={shop && !category && !shop.collection && !hasSearch ? "page" : undefined}>{t("All products", "全部商品")}</Link>
      {mall ? <>
        <Link className="nav-featured-link" href="/#kol-showcase">{t("Featured brands", "精選品牌", "注目ブランド")}</Link>
        <Link className="nav-winter-link" href="/winter-edit">{t("Winter Edit", "冬日選物", "冬のセレクション")}</Link>
      </> : (sourceCatalogueEnabled() || supplierCollectionEnabled()) &&
        <Link href={sourceCatalogueEnabled() ? "/shop?collection=suntvmall" : "/shop?collection=supplier-demo"}>{t("New discoveries", "新選好物", "新しい出会い")}</Link>}
      {groups.map(group => (
        <Link key={group.id} href={categoryHref(group.id)} aria-current={category === `group-${group.id}` && !hasSearch ? "page" : undefined}>
          {t(group.label[0], group.label[1], group.label[2])}
        </Link>
      ))}
      {mall && <Link href={`/shop?collection=${demoCollectionId}`} aria-current={demo && !category && !hasSearch ? "page" : undefined}>{t(...demoCollectionTitle)}</Link>}
      {(!mall || demo) && holidayCollectionsEnabled() &&
        <Link className="nav-holiday-link" href="/collections">{t("Holiday edit", "節日選物", "季節のコレクション")}</Link>}
      <Link className="nav-room-link" href="/watch">{t("Watch & shop", "觀看與選購")} <span aria-hidden="true">↗</span></Link>
    </nav>
  );
}

function CurrentNavigation() {
  const pathname = usePathname();
  const search = useSearchParams();
  const shop = pathname === "/shop" && search ? {
    category: search.get("category"), collection: search.get("collection"), query: search.get("q"),
  } : undefined;
  return <SiteNavigation shop={shop} />;
}

export function SiteHeader() {
  const { locale, t, setLocale } = useLocale();
  const profile = getStoreProfile();
  return (
    <header className="site-header">
      <div className="shell header-inner">
        <BrandMark />
        <form className="header-search" action="/shop" role="search">
          <input name="q" aria-label={t("Search products", "搜尋商品")} placeholder={t("Search products", "搜尋商品")} />
          <button type="submit" aria-label={t("Search", "搜尋")}>
            <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true"><circle cx="10.5" cy="10.5" r="6.5" /><path d="m16 16 5 5" /></svg>
          </button>
        </form>
        <div className="header-tools">
          <label className="language-picker">
            <span aria-hidden="true">🌐</span>
            <select className="language-switch" aria-label={t("Language", "語言")} value={locale} onChange={event => setLocale(event.target.value as Locale)}>
              {profile.locales.supported.map(language => <option key={language} value={language} lang={language}>{LOCALE_NAMES[language]}</option>)}
            </select>
          </label>
          <Link className="cart-link" href="/cart" aria-label={t("Shopping bag", "購物袋")}>
            <svg width="21" height="23" viewBox="0 0 24 26" fill="none" stroke="currentColor" strokeWidth="1.4" aria-hidden="true"><path d="M4 8h16l1 16H3L4 8Z" /><path d="M8 9V6a4 4 0 0 1 8 0v3" /></svg><CartCount />
          </Link>
        </div>
      </div>
      {profile.id === "isuntvmall" ? <Suspense fallback={<SiteNavigation />}><CurrentNavigation /></Suspense> : <SiteNavigation />}
    </header>
  );
}
