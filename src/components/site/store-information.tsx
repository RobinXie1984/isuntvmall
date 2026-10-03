import Link from "next/link";
import { getLocale } from "@/lib/locale-server";
import { getStoreProfile, storeCopy } from "@/lib/store-profile";
export async function StoreInformation({ section }: { section: "purchase" | "privacy" | "contact" | "terms" }) {
 const {locale,t}=await getLocale();const profile=getStoreProfile(); const p=profile.policies;
 const title=section==="purchase"?t("Purchase information","購物須知","ご購入について"):section==="privacy"?t("Privacy","私隱","プライバシー"):section==="terms"?t("Terms","條款","利用規約"):t("Contact","聯絡我們","お問い合わせ");
 const missing=t("This information has not been provided yet.","此項資料尚未提供。","この情報はまだ提供されていません。");
 return <div className="shell page-space"><div className="page-intro"><span className="eyebrow">{profile.name}</span><h1>{title}</h1>{profile.catalogueMode==="demo"&&<p>{t("This is a sample store. Prices are illustrative; orders and payments are not accepted.","此為示範商店，價格僅供展示，不接受訂單或付款。","サンプルショップです。価格は表示例で、注文・決済は受け付けていません。")}</p>}</div><div className="store-information">
 {section==="purchase"&&<><section><h2>{t("Shipping","送貨","配送")}</h2><p>{p.shipping?storeCopy(p.shipping,locale):missing}</p></section><section><h2>{t("Returns","退貨","返品")}</h2><p>{p.returns?storeCopy(p.returns,locale):missing}</p></section></>}
 {section==="privacy"&&<p>{p.privacy?storeCopy(p.privacy,locale):missing}</p>}
 {section==="terms"&&<p>{p.terms?storeCopy(p.terms,locale):missing}</p>}
 {section==="contact"&&<>{p.merchantName&&<p>{p.merchantName}</p>}{p.contactEmail?<p><a className="text-link" href={`mailto:${p.contactEmail}`}>{p.contactEmail}</a></p>:<p>{missing}</p>}{p.contactAddress&&<p>{storeCopy(p.contactAddress,locale)}</p>}</>}
 <nav className="store-information-links" aria-label={t("Store information","商店資訊","ショップ情報")}><Link href="/purchase-information">{t("Purchase information","購物須知","ご購入について")}</Link><Link href="/privacy">{t("Privacy","私隱","プライバシー")}</Link><Link href="/terms">{t("Terms","條款","利用規約")}</Link><Link href="/contact">{t("Contact","聯絡我們","お問い合わせ")}</Link></nav>
 </div></div>;
}
