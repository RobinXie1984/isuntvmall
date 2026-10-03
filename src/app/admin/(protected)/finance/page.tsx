import { getStaff,requirePermission } from "@/lib/staff/auth";
import { getLocale } from "@/lib/locale-server";
import { FinanceWorkspace } from "@/components/admin/finance-workspace";
import { merchantOperationsCopy } from "@/components/admin/merchant-operations-copy";
export async function generateMetadata(){const{locale}=await getLocale();return{title:merchantOperationsCopy[locale].finance};}
export default async function FinancePage(){const staff=await getStaff();const{locale}=await getLocale();try{if(!staff)throw Error();requirePermission(staff,"finance.manage");}catch{return <p>{merchantOperationsCopy[locale].denied}</p>;}return <FinanceWorkspace/>;}
