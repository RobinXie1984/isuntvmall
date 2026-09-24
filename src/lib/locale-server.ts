import "server-only";
import { cookies } from "next/headers";
import { localize, type Locale } from "@/lib/i18n";
export async function getLocale() {
 const value=(await cookies()).get("isuntvmall-locale")?.value;
 const locale:Locale=value==="zh-Hant"?"zh-Hant":"en";
 return {locale,t:(en:string,zh:string)=>locale==="en"?en:zh,localize:(value:string)=>localize(value,locale)};
}
