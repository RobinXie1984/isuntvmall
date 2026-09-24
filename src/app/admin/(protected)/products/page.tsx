import { getLocale } from "@/lib/locale-server";
import { AdminProductsPanel } from "@/components/admin/admin-products-panel";
import { getProducts } from "@/lib/data/store";

export async function generateMetadata() { const { t } = await getLocale(); return { title: t("Manage products", "商品管理") }; }
export default async function AdminProductsPage() { return <AdminProductsPanel products={await getProducts({ includeDrafts: true })} />; }
