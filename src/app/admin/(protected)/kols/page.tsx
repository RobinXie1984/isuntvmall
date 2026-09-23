import {AdminKolsPanel} from "@/components/admin/admin-kols-panel";
import {getKols} from "@/lib/data/store";
export const metadata={title:"KOL directory · 主播"};
export default async function KolsPage(){return <AdminKolsPanel kols={await getKols()}/>;}
