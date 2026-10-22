import { sourceCatalogueEnabled } from "@/lib/store-profile";
import catalogue from './suntvmall-catalogue.json';
import type { Product, SourceListing } from '@/types/commerce';
const byId = new Map(catalogue.products.map(product => [product.id, product]));
export function isSourceProductId(id: string) { return byId.has(id); }
export function enrichSourceProduct(product: Product): Product {
  const entry = byId.get(product.id);
  if (!sourceCatalogueEnabled() || !entry || entry.sku !== product.sku) return product;
  const sourceListing: SourceListing = {
    photoCrop: product.images[0]?.sourceUrl.endsWith("/"+entry.reviewedImageName) ? crops[entry.sourceId] : undefined,
    handle: entry.sourceHandle, snapshotAt: catalogue.snapshotAt,
    options: entry.options, variants: entry.variants,
    title: entry.title, description: entry.description,
  };
  return { ...product, sourceListing };
}
export function sourcePurchaseUrl(handle: string, variantId: string): string {
  if (!/^[a-z0-9-]+$/.test(handle) || !/^\d+$/.test(variantId)) throw new Error('Invalid source option');
  return `https://suntvmall.com/products/${handle}?variant=${variantId}`;
}

const crops: Record<string, NonNullable<SourceListing['photoCrop']>> = {};
const frames: Record<string, [number,number,number,number,number,number]> = {
'9964216189171':[25,265,700,360,800,800],'9964216123635':[355,190,415,480,800,800],'9964216090867':[352,115,420,595,800,800],
'9964216025331':[300,225,520,710,1111,1111],'9964215959795':[85,160,615,530,800,800],'9964215927027':[130,160,570,505,800,800],
'9964215828723':[210,170,420,555,800,800],'9964215763187':[80,170,710,460,800,800],'9964215730419':[90,230,610,440,800,800],
'10182427377907':[370,45,260,925,1000,1000],'10182426919155':[100,200,785,605,1000,1000]
};
for(const [i,[x,y,width,height,imageWidth,imageHeight]] of Object.entries(frames)) crops[i]={x,y,width,height,imageWidth,imageHeight};
