import fs from "node:fs";
import path from "node:path";
import { z } from "zod";
const locale = z.enum(["en", "zh-Hant", "zh-Hans", "ja"]);
const copy = z.object({ en: z.string().min(1).max(10000), "zh-Hant": z.string().min(1).max(10000), "zh-Hans": z.string().min(1).max(10000), ja: z.string().min(1).max(10000) }).strict();
const asset = z.string().max(500).refine(s => /^\/(?!\/)/.test(s) && !/[\\?#]/.test(s) && !s.split('/').includes('..'), "Use an absolute local asset path.");
const origin = z.string().url().refine(s => { const u = new URL(s); return u.origin === s && !u.username && !u.password && (u.protocol === "https:" || (u.protocol === "http:" && ["localhost", "127.0.0.1"].includes(u.hostname))); }, "Use an HTTPS origin, or local development origin.");
export const storeProfileSchema = z.object({
 id: z.string().regex(/^[a-z][a-z0-9-]{1,48}$/), name: z.string().trim().min(1).max(60), origin, currency: z.literal("hkd"), catalogueMode: z.enum(["demo", "merchant"]),
 locales: z.object({ supported: z.array(locale).min(1).max(4), default: locale }).strict().refine(v => new Set(v.supported).size === v.supported.length && v.supported.includes(v.default), "Default locale must be among unique supported locales."),
 brand: z.object({ logo: asset, secondaryName: z.object({ text: z.string().min(1).max(60), lang: locale }).strict().nullable(), icons: z.object({ favicon: asset, icon192: asset, icon512: asset, apple: asset }).strict() }).strict(),
 copy: z.object({ title: copy, description: copy, homeLabel: copy, tagline: copy, market: copy.nullable() }).strict(),
 hero: z.object({ image: asset, alt: copy, eyebrow: copy, title: copy, body: copy, href: z.string().max(300).refine(s => /^\/(?!\/)/.test(s) && !/[\\\r\n]/.test(s)), cta: copy }).strict(),
 demoSet: z.enum(["isun", "neutral"]), collections: z.object({ supplierDemo: z.boolean(), holidays: z.boolean() }).strict(),
 excludedProductIds: z.array(z.string().uuid()).max(1000),
 policies: z.object({ merchantName: z.string().trim().min(1).max(200).nullable(), contactEmail: z.string().email().max(254).nullable(), contactAddress: copy.nullable(), shipping: copy.nullable(), returns: copy.nullable(), privacy: copy.nullable(), terms: copy.nullable() }).strict(),
 indexing: z.enum(["index", "noindex"])
}).strict().refine(p => p.catalogueMode !== "merchant" || (!p.collections.supplierDemo && !p.collections.holidays), "Merchant profiles cannot enable bundled demo collections.");
export function validateStoreProfile(value) { return storeProfileSchema.parse(value); }
export function loadStoreProfile(file = process.env.STORE_PROFILE_PATH) {
 const filename = file ? path.resolve(file) : new URL('./isuntvmall.json', import.meta.url);
 return validateStoreProfile(JSON.parse(fs.readFileSync(filename, 'utf8')));
}
