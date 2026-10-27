import { requireAdminPage } from "@/lib/admin-auth";
import { permissionAllowed } from "@/lib/staff/permissions";
import { PriceReviewWorkspace } from "@/components/admin/price-review-workspace";
export default async function PricesPage(){const staff=await requireAdminPage("merchandise.manage");return <PriceReviewWorkspace canPublish={permissionAllowed(staff,"catalog.publish")}/>;}
