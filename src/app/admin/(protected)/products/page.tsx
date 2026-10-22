import {requireAdminPage} from "@/lib/admin-auth";
import {permissionAllowed} from "@/lib/staff/permissions";
import {MerchandiseWorkspace} from "@/components/admin/merchandise-workspace";
export default async function Page(){const staff=await requireAdminPage("merchandise.manage");return <MerchandiseWorkspace canPublish={permissionAllowed(staff,"catalog.publish")}/>;}
