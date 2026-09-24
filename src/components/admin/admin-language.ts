import type { Locale } from "@/lib/i18n";

const statuses: Record<string, [string, string]> = {
  active: ["Active", "啟用"], inactive: ["Inactive", "停用"], draft: ["Draft", "草稿"], published: ["Published", "已上架"], archived: ["Archived", "已封存"], preview: ["Preview", "預覽"], scheduled: ["Scheduled", "已排程"], live: ["Live", "直播中"], ended: ["Ended", "已結束"], pending: ["Pending payment", "待付款"], paid: ["Paid", "已付款"], cancelled: ["Cancelled", "已取消"], failed: ["Failed", "失敗"], refunded: ["Refunded", "已退款"], review: ["Needs review", "待覆核"], expired: ["Expired", "已過期"], external: ["Other platform", "其他平台"], youtube: ["YouTube", "YouTube"], facebook: ["Facebook", "Facebook"], instagram: ["Instagram", "Instagram"], tiktok: ["TikTok", "TikTok"],
};
export function adminStatus(value: string, locale: Locale) { return statuses[value]?.[locale === "en" ? 0 : 1] ?? value; }
const errors: Record<string, string> = {
  "Invalid request origin.": "請從本站重新開啟頁面後再試。", "Admin sign-in required.": "請先登入後台。", "Admin access is not configured.": "後台登入尚未設定。", "Password is incorrect.": "密碼不正確。", "Choose a CSV file.": "請選擇 CSV 檔案。", "CSV must be 2 MB or smaller.": "CSV 檔案不可超過 2 MB。", "CSV contains invalid rows.": "CSV 包含不正確的資料列。", "CSV contains no products.": "CSV 沒有商品資料。", "Import at most 500 rows at a time.": "每次最多匯入 500 行。", "CSV import failed.": "CSV 匯入失敗。", "Livestream could not be saved.": "無法儲存直播。", "Product could not be saved.": "無法儲存商品。", "Host could not be saved.": "無法儲存主播資料。", "Choose an image file.": "請選擇圖片檔案。", "Use a JPEG, PNG, WebP, or GIF image.": "請使用 JPEG、PNG、WebP 或 GIF 圖片。", "Image must be 8 MB or smaller.": "圖片不可超過 8 MB。", "Image upload failed.": "圖片上傳失敗。", "Duplicate SKU or slug within this file.": "檔案內有重複的商品編號或網址別名。", "Maximum 2 MB": "檔案不可超過 2 MB。", "Maximum 500 rows": "最多 500 行。", "Could not sign in.": "無法登入，請稍後再試。", "Could not read this file.": "無法讀取此檔案。",
};
const fields: Record<string, string> = { sku: "商品編號", slug: "網址別名", title: "名稱", description: "簡介", priceAmount: "價格", currency: "貨幣", stockQty: "庫存", category: "分類", imageUrl: "圖片網址", status: "狀態", featured: "精選", kolId: "主播", hostName: "主播名稱", platform: "平台", externalUrl: "直播網址", embedId: "嵌入識別碼", startsAt: "開始時間", posterUrl: "封面網址", productIds: "推薦商品", displayName: "顯示名稱", bio: "簡介" };
export function adminError(message: string, locale: Locale) {
  if (locale === "en") return message;
  if (errors[message]) return errors[message];
  if (/[\u3400-\u9fff]/.test(message)) return message;
  if (message.includes("Too many fields")) return "欄位數目多於標題列，請檢查逗號及引號。";
  if (message.includes("Too few fields")) return "欄位數目少於標題列，請補齊缺少的欄位。";
  if (/quote/i.test(message)) return "引號格式不正確，請檢查 CSV 文字欄位。";
  if (/delimiter/i.test(message)) return "無法識別分隔符號，請使用逗號分隔。";
  if (message.includes(": ") && message.split("; ").every(part => fields[part.split(": ")[0]])) {
    return message.split("; ").map(part => {
      const [field, ...detail] = part.split(": "); const reason = detail.join(": ");
      const number = reason.match(/\d+(?:\.\d+)?/)?.[0];
      const translated = /Too small/i.test(reason) ? `數值或長度低於下限${number ? `（${number}）` : ""}` : /Too big/i.test(reason) ? `數值或長度超過上限${number ? `（${number}）` : ""}` : /expected number|NaN/i.test(reason) ? "請輸入有效數字" : /expected int/i.test(reason) ? "請輸入整數" : /Invalid option/i.test(reason) ? "請選擇支援的選項" : "格式或內容不正確";
      return `${fields[field]}：${translated}`;
    }).join("；");
  }
  return "操作失敗，請檢查輸入內容及連線後再試。";
}
