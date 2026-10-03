import {StoreInformation} from "@/components/site/store-information";
import {getLocale} from "@/lib/locale-server";
export async function generateMetadata(){const {t}=await getLocale();return {title:t("Contact","聯絡我們","お問い合わせ")};}
export default function Page(){return <StoreInformation section="contact"/>;}
