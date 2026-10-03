import { getStaff,requirePermission } from "@/lib/staff/auth";
import { getLocale } from "@/lib/locale-server";
import { InventoryWorkspace } from "@/components/admin/inventory-workspace";
import { merchantOperationsCopy } from "@/components/admin/merchant-operations-copy";
export async function generateMetadata(){const{locale}=await getLocale();return{title:merchantOperationsCopy[locale].inventory};}
export default async function InventoryPage(){const staff=await getStaff();const{locale}=await getLocale();try{if(!staff)throw Error();requirePermission(staff,"inventory.write");}catch{return <p>{merchantOperationsCopy[locale].denied}</p>;}return <InventoryWorkspace/>;}
