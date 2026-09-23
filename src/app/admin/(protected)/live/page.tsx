import { AdminLivePanel } from "@/components/admin/admin-live-panel";
import { getKols, getLiveSessions, getProducts } from "@/lib/data/store";

export const metadata = { title: "直播运营" };
export default async function AdminLivePage() { const [sessions, products, kols] = await Promise.all([getLiveSessions({ includeAll: true }), getProducts({ includeDrafts: true }), getKols()]); return <AdminLivePanel sessions={sessions} products={products} kols={kols} />; }
