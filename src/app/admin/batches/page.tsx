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
export default async function Page({searchParams}:{searchParams:Promise<{productId?:string;batch?:string}>}) { const staff = await getBatchStaff(); if (!staff) redirect("/admin/batches/login"); let targetProduct;let initialNativeProductId;const params=await searchParams;const id=params.productId;const initialBatch=z.uuid().safeParse(params.batch).success?params.batch:undefined;
 if(id){if(!permissionAllowed(staff,"merchandise.manage")||!z.uuid().safeParse(id).success)redirect("/admin/products");const{data:p,error}=await getSupabaseAdmin().from("products").select("id,sku,title,title_zh,description,description_zh,category,price_amount,currency,stock_qty,is_demo").eq("id",id).single();if(error||!p)redirect("/admin/products");targetProduct=draftProductSchema.parse({targetProductId:p.id,sku:p.sku,title:p.title,titleZh:p.title_zh||"",description:p.description,descriptionZh:p.description_zh||"",category:p.category,priceAmount:p.price_amount,currency:p.currency,stockQty:p.stock_qty,isDemo:p.is_demo});const native=await getSupabaseAdmin().from('product_variants').select('id').eq('product_id',id).limit(1);if(native.error)throw native.error;if(native.data.length)initialNativeProductId=id;}
 return <BatchWorkspace key={`${id||'all'}-${initialBatch||''}`} initialNativeProductId={initialNativeProductId} role={staff.role} email={staff.email} targetProduct={targetProduct} initialBatch={initialBatch}/>; }
