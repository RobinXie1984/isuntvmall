import {getLocale} from "@/lib/locale-server";
import {getStaff} from "@/lib/staff/auth";
import {getLiveDrafts} from "@/lib/live/operations";
import {getKols,getProducts} from "@/lib/data/store";
import {AdminLiveWorkspace} from "@/components/admin/live-admin-workspace";
export async function generateMetadata(){const{t}=await getLocale();return{title:t("Live studio","直播工作室")};}
export default async function AdminLivePage(){const staff=await getStaff();if(!staff)return null;const[{drafts,count},products,kols]=await Promise.all([getLiveDrafts(staff),getProducts(),getKols()]);return <AdminLiveWorkspace initialDrafts={drafts} initialCount={count} products={products} kols={staff.role==="kol"?kols.filter(k=>k.id===staff.kolId):kols} role={staff.role} kolId={staff.kolId}/>;}
