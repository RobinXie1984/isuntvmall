import { getLocale } from "@/lib/locale-server";
import { AdminLivePanel } from "@/components/admin/admin-live-panel";
import { getKols, getLiveSessions, getProducts } from "@/lib/data/store";

export async function generateMetadata() { const { t } = await getLocale(); return { title: t("Manage livestreams", "直播管理") }; }
export default async function AdminLivePage() { const [sessions, products, kols] = await Promise.all([getLiveSessions({ includeAll: true }), getProducts({ includeDrafts: true }), getKols()]); return <AdminLivePanel sessions={sessions} products={products} kols={kols} />; }
