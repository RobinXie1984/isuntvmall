import { StyleGallery } from "@/components/style/style-gallery";
import { getLocale } from "@/lib/locale-server";
import "./styles.css";

export const dynamic = "force-dynamic";
export async function generateMetadata() {
  const { t } = await getLocale();
  return { title: t("The style library", "風格圖書館"), description: t("Six original iSunTVMall design directions, with quiet essentials as our everyday home.", "六款原創風格提案，以靜謐日常作為我們的店舖本色。") };
}

export default function StylesPage() {
  return <StyleGallery />;
}
