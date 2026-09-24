import {getLocale} from "@/lib/locale-server";
import {OperationsPreview} from "@/components/admin/operations-preview";
export async function generateMetadata(){const {t}=await getLocale();return {title:t("Operations preview","營運體驗"),robots:{index:false,follow:false}};}
export default function StudioPreview(){return <OperationsPreview/>;}
