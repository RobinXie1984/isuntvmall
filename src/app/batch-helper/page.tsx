import { BatchWorkspace } from "@/components/batch/batch-workspace";
import { getLocale } from "@/lib/locale-server";
import "./batch.css";
export async function generateMetadata() { const { t } = await getLocale(); return { title: t("Batch helper preview", "批次助手預覽"), robots: { index: false, follow: false } }; }
export default function Page() { return <BatchWorkspace preview role="catalog_editor" />; }
