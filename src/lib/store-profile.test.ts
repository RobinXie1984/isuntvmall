import { afterEach, describe, expect, it, vi } from "vitest";
import { validateStoreProfile } from "../../config/store-profile-loader.mjs";
import defaultProfile from "../../config/isuntvmall.json";
import sampleProfile from "../../config/stillroom.json";
import { getStoreProfile, hasMerchantPolicies, holidayCollectionsEnabled, storeStorageKeys, supplierCollectionEnabled } from "./store-profile";
import { parseLocale } from "./i18n";
afterEach(() => vi.unstubAllEnvs());
describe("independent store profiles", () => {
 it("accepts default and neutral profiles with no invented merchant policies", () => { for(const profile of [defaultProfile,sampleProfile]) { expect(validateStoreProfile(profile).name).toBe(profile.name); expect(profile.policies.contactEmail).toBeNull(); expect(profile.policies.shipping).toBeNull(); } });
 it("accepts an arbitrary external client profile without a code allowlist", () => { expect(validateStoreProfile({...sampleProfile,id:"another-client",name:"Another Client",origin:"https://client.example"}).id).toBe("another-client"); });
 it.each([
  {id:"../../client"}, {currency:"usd"}, {origin:"https://client.example/path"}, {origin:"https://user:password@client.example"}, {origin:"http://client.example"},
  {locales:{supported:["en"],default:"ja"}}, {locales:{supported:["en","en"],default:"en"}},
  {brand:{...sampleProfile.brand,logo:"//evil.example/logo.png"}}, {brand:{...sampleProfile.brand,logo:"/../secret"}},
  {policies:{...sampleProfile.policies,contactEmail:"not-an-email"}},
  {catalogueMode:"merchant",collections:{supplierDemo:true,holidays:false}}, {secretKey:"must-not-enter-public-config"}
 ])("rejects invalid or unsafe configuration %j", patch => { expect(() => validateStoreProfile({...sampleProfile,...patch})).toThrow(); });
 it("preserves the first store's existing browser storage keys", () => { expect(storeStorageKeys()).toEqual({cart:"suntv-mall-cart-v2",attempt:"suntv-checkout-attempt-v1",locale:"isuntvmall-locale",staff:"isun_staff"}); });
 it("uses independent sample identity, defaults, storage and collection switches", () => { vi.stubEnv("NEXT_PUBLIC_STORE_PROFILE",JSON.stringify({...sampleProfile,locales:{supported:["en","ja"],default:"ja"}})); expect(getStoreProfile().name).toBe("Stillroom"); expect(parseLocale(undefined)).toBe("ja");expect(parseLocale("zh-Hant")).toBe("ja");expect(parseLocale("en")).toBe("en");expect(storeStorageKeys().cart).toBe("stillroom-cart-v2");expect(supplierCollectionEnabled()).toBe(false);expect(holidayCollectionsEnabled()).toBe(false);expect(hasMerchantPolicies()).toBe(false); });
});
