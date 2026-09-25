import { BatchLogin } from "@/components/batch/batch-login";
import { batchConfigured } from "@/lib/batch/auth";
import { getLocale } from "@/lib/locale-server";
export const dynamic = "force-dynamic";
export async function generateMetadata() { const { t } = await getLocale(); return { title: t("Team sign-in", "團隊登入"), robots: { index: false, follow: false } }; }
export default function Page() { return <BatchLogin configured={batchConfigured()} />; }
