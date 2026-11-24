import { notFound } from "next/navigation";
import { BrandShowcase } from "@/components/brands/brand-showcase";
import { showcaseBrands } from "@/lib/brand-showcase";
import { getBroadcasts } from "@/lib/broadcasts/store";
import { getProducts } from "@/lib/data/store";
import { getLocale } from "@/lib/locale-server";
import { getStoreProfile } from "@/lib/store-profile";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ brand: string }> };

async function getBrand(params: Props["params"]) {
  const { brand } = await params;
  const match = showcaseBrands.find(item => item.id === brand);
  if (!match || getStoreProfile().id !== "isuntvmall") notFound();
  return match;
}

export async function generateMetadata({ params }: Props) {
  return { title: (await getBrand(params)).name };
}

export default async function BrandPage({ params }: Props) {
  const brand = await getBrand(params);
  const [products, broadcasts, { locale }] = await Promise.all([getProducts(), getBroadcasts(), getLocale()]);
  return <BrandShowcase products={products} locale={locale} broadcasts={broadcasts} brandId={brand.id} />;
}
