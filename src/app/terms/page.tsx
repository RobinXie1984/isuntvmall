import {StoreInformation} from "@/components/site/store-information";
import {getLocale} from "@/lib/locale-server";
export async function generateMetadata(){const {t}=await getLocale();return {title:t("Terms","條款","利用規約")};}
export default function Page(){return <StoreInformation section="terms"/>;}
