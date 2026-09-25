import { getLocale } from "@/lib/locale-server";
import {AdminKolsPanel} from "@/components/admin/admin-kols-panel";
import {getStaff,requirePermission} from "@/lib/staff/auth";
import {getKols} from "@/lib/data/store";
export async function generateMetadata() { const { t } = await getLocale(); return { title: t("Host directory", "主播名冊") }; }
export default async function KolsPage(){const {t}=await getLocale();const staff=await getStaff();try{if(!staff)throw Error();requirePermission(staff,"team.manage");}catch{return <p>{t("Only a super admin can manage hosts.","只有超級管理員可管理主播。")}</p>;}return <AdminKolsPanel kols={await getKols()}/>;}
