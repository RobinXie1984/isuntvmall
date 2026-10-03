import {StoreInformation} from "@/components/site/store-information";
import {getLocale} from "@/lib/locale-server";
export async function generateMetadata(){const {t}=await getLocale();return {title:t("Purchase information","購物須知","ご購入について")};}
export default function Page(){return <StoreInformation section="purchase"/>;}
