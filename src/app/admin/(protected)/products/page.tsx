import Link from "next/link";
import { getLocale } from "@/lib/locale-server";
import { getStaff,requirePermission } from "@/lib/staff/auth";
import { getProducts } from "@/lib/data/store";
import { productTitle } from "@/lib/product-copy";
export async function generateMetadata(){const{t}=await getLocale();return{title:t("Manage products","商品管理")};}
export default async function AdminProductsPage(){
 const{t,locale,localize}=await getLocale();const staff=await getStaff();try{if(!staff)throw Error();requirePermission(staff,"catalog.read");}catch{return <p>{t("Catalogue access is unavailable for this account.","此帳戶沒有商品目錄權限。")}</p>;}
 const products=await getProducts();return <section className="admin-table-card"><div className="admin-card-heading"><h2>{t("Approved catalogue","已刊登商品目錄")}</h2><Link href="/admin/batches" className="button">{t("Prepare merchandise","準備商品")}</Link></div><p>{t("New listings pass through image preparation and super-admin review. Published products are shown below.","新商品須經圖片處理及超級管理員審閱，下方顯示已刊登商品。")}</p><div className="admin-table-wrap"><table><thead><tr><th>{t("SKU","貨號")}</th><th>{t("Product","商品")}</th><th>{t("Stock","庫存")}</th></tr></thead><tbody>{products.map(p=><tr key={p.id}><td>{p.sku}</td><td>{productTitle(p,locale,localize)}</td><td>{p.stockQty}</td></tr>)}</tbody></table></div></section>;
}
