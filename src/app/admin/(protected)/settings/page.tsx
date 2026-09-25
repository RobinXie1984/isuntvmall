import {notFound} from "next/navigation";
import {getStaff,requirePermission} from "@/lib/staff/auth";
import {getLocale} from "@/lib/locale-server";
import {hasSupabaseConfig,hasStripeConfig} from "@/lib/env";
import {checkoutReleaseReady} from "@/lib/cart";
export default async function SettingsPage(){
 const staff=await getStaff();if(!staff)notFound();requirePermission(staff,"team.manage");const{t}=await getLocale();
 const rows:[string,string,boolean|null][]=[
 ["Database connection settings","資料庫連線設定",hasSupabaseConfig()],
 ["Payment connection settings","付款連線設定",hasStripeConfig()],
 ["Private merchandise workflow enabled","私人商品流程已啟用",process.env.BATCH_HELPER_ENABLED==="true"],
 ["Checkout release approved","結帳發布已核准",checkoutReleaseReady()],
 ["Production image worker verified","正式圖片處理服務已驗證",null],
 ["Shipping rates and service areas approved","運費及服務地區已核准",null],
 ["Refund and customer contact policies approved","退款及顧客聯絡政策已核准",null],
 ];
 return <section className="admin-table-card"><div className="admin-card-heading"><h2>{t("Store readiness","商店準備狀態")}</h2></div><p>{t("Connection settings show presence only. They do not prove that accounts, migrations, payments or services have been tested.","連線設定僅顯示是否已提供，並不代表帳戶、資料庫更新、付款或服務已通過測試。")}</p><table className="admin-table"><thead><tr><th>{t("Release requirement","發布條件")}</th><th>{t("Current state","目前狀態")}</th></tr></thead><tbody>{rows.map(([en,zh,value])=><tr key={en}><td>{t(en,zh)}</td><td>{value===null?t("Not yet verified","尚未驗證"):value?t("Configured","已設定"):t("Not enabled","尚未啟用")}</td></tr>)}</tbody></table><p>{t("This page is read-only. Merchant policies and shipping rules must be established before checkout can open. Credentials are managed outside this interface and are never displayed here.","此頁僅供檢視。開放結帳前，必須制定商戶政策及配送規則。憑證在此介面之外管理，這裡不會顯示憑證。")}</p></section>;
}
