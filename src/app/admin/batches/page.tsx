import {getSupabaseAdmin} from "@/lib/supabase/admin";
import {permissionAllowed} from "@/lib/staff/permissions";
import {draftProductSchema} from "@/lib/batch/contracts";
import {z} from "zod";
import { redirect } from "next/navigation";
import { getBatchStaff } from "@/lib/batch/auth";
import { BatchWorkspace } from "@/components/batch/batch-workspace";
import { getLocale } from "@/lib/locale-server";
import "@/app/batch-helper/batch.css";
export const dynamic = "force-dynamic";
export async function generateMetadata() { const { t } = await getLocale(); return { title: t("Merchandise studio", "商品工作室"), robots: { index: false, follow: false } }; }
export default async function Page({searchParams}:{searchParams:Promise<{productId?:string}>}) { const staff = await getBatchStaff(); if (!staff) redirect("/admin/batches/login"); let targetProduct;const id=(await searchParams).productId;
 if(id){if(!permissionAllowed(staff,"merchandise.manage")||!z.uuid().safeParse(id).success)redirect("/admin/products");const{data:p,error}=await getSupabaseAdmin().from("products").select("id,sku,title,title_zh,description,description_zh,category,price_amount,currency,stock_qty,is_demo").eq("id",id).single();if(error||!p)redirect("/admin/products");targetProduct=draftProductSchema.parse({targetProductId:p.id,sku:p.sku,title:p.title,titleZh:p.title_zh||"",description:p.description,descriptionZh:p.description_zh||"",category:p.category,priceAmount:p.price_amount,currency:p.currency,stockQty:p.stock_qty,isDemo:p.is_demo});}
 return <BatchWorkspace role={staff.role} email={staff.email} targetProduct={targetProduct}/>; }
