import { getLocale } from "@/lib/locale-server";
import {AdminKolsPanel} from "@/components/admin/admin-kols-panel";
import {getKols} from "@/lib/data/store";
export async function generateMetadata() { const { t } = await getLocale(); return { title: t("Host directory", "主播名冊") }; }
export default async function KolsPage(){return <AdminKolsPanel kols={await getKols()}/>;}
