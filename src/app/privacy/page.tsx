import {StoreInformation} from "@/components/site/store-information";
import {getLocale} from "@/lib/locale-server";
export async function generateMetadata(){const {t}=await getLocale();return {title:t("Privacy","私隱","プライバシー")};}
export default function Page(){return <StoreInformation section="privacy"/>;}
