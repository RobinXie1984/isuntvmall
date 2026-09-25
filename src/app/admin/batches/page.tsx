import { redirect } from "next/navigation";
import { getBatchStaff } from "@/lib/batch/auth";
import { BatchWorkspace } from "@/components/batch/batch-workspace";
import { getLocale } from "@/lib/locale-server";
import "@/app/batch-helper/batch.css";
export const dynamic = "force-dynamic";
export async function generateMetadata() { const { t } = await getLocale(); return { title: t("Merchandise studio", "商品工作室"), robots: { index: false, follow: false } }; }
export default async function Page() { const staff = await getBatchStaff(); if (!staff) redirect("/admin/batches/login"); return <BatchWorkspace role={staff.role} email={staff.email} />; }
