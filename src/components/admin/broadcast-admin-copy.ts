import type { Locale } from "@/lib/i18n";
const en = {
  nav: "Videos & broadcasts", heading: "Videos & broadcasts", description: "Manage the homepage introduction and broadcast library. Saved changes appear on the public site on refresh; no deployment is needed.",
  choose: "Choose a video", newBroadcast: "Add broadcast", introduction: "Homepage introduction", introductionNote: "One introduction appears prominently on the homepage. Edit its title, URL or visibility here.",
  broadcast: "Broadcast", edit: "Edit video", title: "English title", titleZh: "Traditional Chinese title", titleHans: "Simplified Chinese title", titleJa: "Japanese title",
  url: "Video URL", urlHelp: "Use an official YouTube or Facebook link. Facebook posts and untyped share links open on Facebook until a public video URL is available.", thumbnail: "Thumbnail image URL (optional)", thumbnailHelp: "Use a clean, approved image without promotional clutter. Leave blank for a neutral placeholder. The original video is unchanged.",
  position: "Display order", positionHelp: "Lower numbers appear first (0–10000).", status: "Broadcast status", recorded: "Replay", live: "Live now", scheduled: "Upcoming", statusHelp: "Choose Live now only while the broadcast is actually live; this status is set manually.",
  visible: "Visible on the public site", hidden: "Hidden", visibleLabel: "Visible", products: "Linked products (optional)", productsHelp: "A broadcast may have no products. The same product can appear in several broadcasts. Select up to 100 products.", search: "Search by product name or SKU", noneFound: "No matching products.", selected: "Selected", unavailable: "Linked product no longer in this catalogue", remove: "Remove link",
  save: "Save changes", saving: "Saving…", refresh: "Reload saved version", preview: "Player preview", publicPreview: "Open public page", hiddenPreview: "This video is hidden. The public page will be available after you save it as visible.",
  invalid: "Check the four titles, official video URL, thumbnail URL and display order. Each title is required (up to 180 characters).", saved: "Saved. Refresh the homepage or watch page to see your changes; no deployment is needed.", failed: "The save could not be confirmed. Reload the saved version before trying again.", stale: "This video changed elsewhere. Reload its latest saved version, then apply your edits again. Your changes have not overwritten it.", loadFailed: "Could not reload the saved videos. Your current edits are still here.", permission: "Your session or permission needs attention. Sign in again with your staff account and MFA.", discard: "Discard unsaved edits and load the saved version?", empty: "Add a broadcast or set up the homepage introduction to get started.", newTitle: "New broadcast", newIntro: "Meet our selection", unsaved: "Unsaved changes", savedVersion: "Saved version", previewInvalid: "Enter a valid official video URL to preview the player.",
};
type Copy = typeof en;
export const broadcastAdminCopy: Record<Locale, Copy> = {
 en,
 "zh-Hant": {
  nav: "影片與節目", heading: "影片與節目", description: "管理首頁介紹及節目資料庫。儲存後重新整理公開網站即可看到更新，無需重新部署。",
  choose: "選擇影片", newBroadcast: "新增節目", introduction: "首頁介紹影片", introductionNote: "首頁會重點展示一段介紹影片，可在此修改標題、網址或顯示設定。",
  broadcast: "節目", edit: "編輯影片", title: "英文標題", titleZh: "繁體中文標題", titleHans: "簡體中文標題", titleJa: "日文標題",
  url: "影片網址", urlHelp: "請使用官方 YouTube 或 Facebook 連結。Facebook 貼文及未標示類型的分享連結會在 Facebook 開啟，直至提供公開影片網址。", thumbnail: "縮圖網址（選填）", thumbnailHelp: "請使用乾淨、已審核且沒有促銷雜訊的圖片。留空會顯示中性佔位圖，原影片不會更改。",
  position: "顯示順序", positionHelp: "數字越小越靠前（0–10000）。", status: "節目狀態", recorded: "回放", live: "直播中", scheduled: "即將播出", statusHelp: "只有節目正在直播時才選擇「直播中」，此狀態需手動設定。",
  visible: "於公開網站顯示", hidden: "已隱藏", visibleLabel: "已顯示", products: "連結商品（選填）", productsHelp: "節目可以不連結商品，同一商品亦可出現在多個節目中。最多選擇 100 件商品。", search: "搜尋商品名稱或貨號", noneFound: "沒有符合的商品。", selected: "已選擇", unavailable: "已連結商品不再列於此目錄", remove: "移除連結",
  save: "儲存更改", saving: "儲存中…", refresh: "重新載入已儲存版本", preview: "播放器預覽", publicPreview: "開啟公開頁面", hiddenPreview: "此影片尚未公開，儲存為顯示後才可瀏覽公開頁面。",
  invalid: "請檢查四語標題、官方影片網址、縮圖網址及顯示順序。每種語言的標題均為必填，上限 180 字。", saved: "已儲存。重新整理首頁或節目頁即可看到更新，無需重新部署。", failed: "未能確認是否已儲存，請先重新載入已儲存版本再重試。", stale: "此影片已在別處更改。請重新載入最新版本，再套用你的編輯；目前未覆寫該版本。", loadFailed: "未能重新載入影片，現有編輯仍保留。", permission: "工作階段或權限需要處理，請以員工帳戶及多重驗證重新登入。", discard: "捨棄未儲存的編輯並載入已儲存版本？", empty: "新增節目或設定首頁介紹影片，即可開始。", newTitle: "新節目", newIntro: "認識我們的精選", unsaved: "尚未儲存", savedVersion: "已儲存版本", previewInvalid: "請輸入有效的官方影片網址以預覽播放器。",
 },
 "zh-Hans": {
  nav: "视频与节目", heading: "视频与节目", description: "管理首页介绍及节目资料库。保存后刷新公开网站即可看到更新，无需重新部署。",
  choose: "选择视频", newBroadcast: "新增节目", introduction: "首页介绍视频", introductionNote: "首页会重点展示一段介绍视频，可在此修改标题、网址或显示设置。",
  broadcast: "节目", edit: "编辑视频", title: "英文标题", titleZh: "繁体中文标题", titleHans: "简体中文标题", titleJa: "日文标题",
  url: "视频网址", urlHelp: "请使用官方 YouTube 或 Facebook 链接。Facebook 帖子及未标示类型的分享链接会在 Facebook 打开，直至提供公开视频网址。", thumbnail: "缩略图网址（选填）", thumbnailHelp: "请使用干净、已审核且没有促销杂讯的图片。留空会显示中性占位图，原视频不会更改。",
  position: "显示顺序", positionHelp: "数字越小越靠前（0–10000）。", status: "节目状态", recorded: "回放", live: "直播中", scheduled: "即将播出", statusHelp: "只有节目正在直播时才选择“直播中”，此状态需手动设置。",
  visible: "在公开网站显示", hidden: "已隐藏", visibleLabel: "已显示", products: "关联商品（选填）", productsHelp: "节目可以不关联商品，同一商品也可出现在多个节目中。最多选择 100 件商品。", search: "搜索商品名称或货号", noneFound: "没有匹配的商品。", selected: "已选择", unavailable: "已关联商品不再列于此目录", remove: "移除关联",
  save: "保存更改", saving: "保存中…", refresh: "重新载入已保存版本", preview: "播放器预览", publicPreview: "打开公开页面", hiddenPreview: "此视频尚未公开，保存为显示后才可浏览公开页面。",
  invalid: "请检查四语标题、官方视频网址、缩略图网址及显示顺序。每种语言的标题均为必填，上限 180 字。", saved: "已保存。刷新首页或节目页即可看到更新，无需重新部署。", failed: "未能确认是否已保存，请先重新载入已保存版本再重试。", stale: "此视频已在别处更改。请重新载入最新版本，再应用你的编辑；目前未覆盖该版本。", loadFailed: "未能重新载入视频，现有编辑仍保留。", permission: "会话或权限需要处理，请以员工账户及多重验证重新登录。", discard: "舍弃未保存的编辑并载入已保存版本？", empty: "新增节目或设置首页介绍视频，即可开始。", newTitle: "新节目", newIntro: "认识我们的精选", unsaved: "尚未保存", savedVersion: "已保存版本", previewInvalid: "请输入有效的官方视频网址以预览播放器。",
 },
 ja: {
  nav: "動画と配信", heading: "動画と配信", description: "ホームの紹介動画と配信一覧を管理します。保存後に公開サイトを更新すると反映され、再デプロイは不要です。",
  choose: "動画を選択", newBroadcast: "配信を追加", introduction: "ホームの紹介動画", introductionNote: "ホームに紹介動画を１件表示します。タイトル、リンク、公開設定をここで変更できます。",
  broadcast: "配信", edit: "動画を編集", title: "英語タイトル", titleZh: "繁体字中国語タイトル", titleHans: "簡体字中国語タイトル", titleJa: "日本語タイトル",
  url: "動画のリンク", urlHelp: "YouTubeまたはFacebookの公式リンクを使用してください。Facebookの投稿や種類不明の共有リンクは、公開動画のリンクが確認できるまでFacebookで開きます。", thumbnail: "サムネイル画像のリンク（任意）", thumbnailHelp: "宣伝文句などのない、承認済みのすっきりした画像を使用してください。空欄なら中立的な代替画像を表示します。元の動画は変更しません。",
  position: "表示順", positionHelp: "小さい数字から先に表示します（0〜10000）。", status: "配信状況", recorded: "アーカイブ", live: "配信中", scheduled: "配信予定", statusHelp: "実際に配信中のときだけ「配信中」を選択してください。手動で更新する項目です。",
  visible: "公開サイトに表示する", hidden: "非公開", visibleLabel: "公開", products: "関連商品（任意）", productsHelp: "商品なしの配信も登録できます。同じ商品を複数の配信に関連付けられます。選択は100点までです。", search: "商品名または品番で検索", noneFound: "該当する商品はありません。", selected: "選択済み", unavailable: "関連商品は現在のカタログにありません", remove: "関連付けを解除",
  save: "変更を保存", saving: "保存中…", refresh: "保存済みの内容を再読込", preview: "プレイヤーのプレビュー", publicPreview: "公開ページを開く", hiddenPreview: "この動画は非公開です。公開設定で保存すると公開ページを開けます。",
  invalid: "４言語のタイトル、公式動画リンク、画像リンク、表示順をご確認ください。各タイトルは必須で180文字までです。", saved: "保存しました。ホームまたは配信ページを更新すると反映されます。再デプロイは不要です。", failed: "保存を確認できませんでした。再試行の前に保存済みの内容を再読込してください。", stale: "この動画は別の場所で変更されました。最新の内容を再読込し、もう一度編集してください。既存の変更は上書きしていません。", loadFailed: "動画を再読込できませんでした。編集中の内容は保持されています。", permission: "セッションまたは権限をご確認ください。スタッフアカウントと多要素認証で再ログインしてください。", discard: "未保存の編集を破棄し、保存済みの内容を読み込みますか？", empty: "配信を追加するか、ホームの紹介動画を設定してください。", newTitle: "新しい配信", newIntro: "セレクションについて", unsaved: "未保存の変更", savedVersion: "保存済み", previewInvalid: "公式動画の有効なリンクを入力するとプレビューできます。",
 },
};
