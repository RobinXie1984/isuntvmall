import "server-only";
import { cookies } from "next/headers";
import { localize, parseLocale, translate, LOCALE_COOKIE } from "@/lib/i18n";
export async function getLocale() {
 const locale=parseLocale((await cookies()).get(LOCALE_COOKIE)?.value);
 return {locale,t:(en:string,zh:string,ja?:string)=>translate(en,zh,locale,ja),localize:(value:string)=>localize(value,locale)};
}
