import { getStaff,requirePermission } from "@/lib/staff/auth";
import { getLocale } from "@/lib/locale-server";
import { OrderWorkspace } from "@/components/admin/order-workspace";
export async function generateMetadata(){const{t}=await getLocale();return{title:t("Manage orders","訂單管理")};}
export default async function AdminOrdersPage(){const staff=await getStaff();const{t}=await getLocale();try{if(!staff)throw Error();requirePermission(staff,"orders.read");}catch{return <p>{t("Order access is not available for this account.","此帳戶沒有訂單存取權限。")}</p>;}return <OrderWorkspace role={staff.role}/>;}
