import { AdminProductsPanel } from "@/components/admin/admin-products-panel";
import { getProducts } from "@/lib/data/store";

export const metadata = { title: "商品运营" };
export default async function AdminProductsPage() { return <AdminProductsPanel products={await getProducts({ includeDrafts: true })} />; }
