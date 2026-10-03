import defaultProfile from "../../config/isuntvmall.json";
export type StoreLocale = "en" | "zh-Hant" | "zh-Hans" | "ja";
export type StoreCopy = Record<StoreLocale, string>;
export interface StoreProfile {
 id: string; name: string; origin: string; currency: "hkd"; catalogueMode: "demo" | "merchant";
 locales: { supported: StoreLocale[]; default: StoreLocale };
 brand: { logo: string; secondaryName: { text: string; lang: StoreLocale } | null; icons: { favicon: string; icon192: string; icon512: string; apple: string } };
 copy: { title: StoreCopy; description: StoreCopy; homeLabel: StoreCopy; tagline: StoreCopy; market: StoreCopy | null };
 hero: { image: string; alt: StoreCopy; eyebrow: StoreCopy; title: StoreCopy; body: StoreCopy; href: string; cta: StoreCopy };
 demoSet: "isun" | "neutral"; collections: { supplierDemo: boolean; holidays: boolean }; excludedProductIds: string[];
 policies: { merchantName: string | null; contactEmail: string | null; contactAddress: StoreCopy | null; shipping: StoreCopy | null; returns: StoreCopy | null; privacy: StoreCopy | null; terms: StoreCopy | null };
 indexing: "index" | "noindex";
}
// Injected once by both build tools. Never resolved from request headers or a browser-supplied path.
export function getStoreProfile(): StoreProfile {
 return process.env.NEXT_PUBLIC_STORE_PROFILE ? JSON.parse(process.env.NEXT_PUBLIC_STORE_PROFILE) as StoreProfile : defaultProfile as StoreProfile;
}
export function storeCopy(copy: StoreCopy, locale: StoreLocale) { return copy[locale]; }
export function storeStorageKeys() {
 const id = getStoreProfile().id;
 return id === "isuntvmall" ? { cart: "suntv-mall-cart-v2", attempt: "suntv-checkout-attempt-v1", locale: "isuntvmall-locale", staff: "isun_staff" } : { cart: `${id}-cart-v2`, attempt: `${id}-checkout-attempt-v1`, locale: `${id}-locale`, staff: `${id}_staff` };
}
export function supplierCollectionEnabled() { const p = getStoreProfile(); return p.catalogueMode === "demo" && p.collections.supplierDemo; }
export function holidayCollectionsEnabled() { const p = getStoreProfile(); return p.catalogueMode === "demo" && p.collections.holidays; }
export function hasMerchantPolicies() { const p = getStoreProfile(); return p.catalogueMode === "merchant" && Boolean(p.policies.merchantName && p.policies.contactEmail && p.policies.shipping && p.policies.returns && p.policies.privacy && p.policies.terms); }
