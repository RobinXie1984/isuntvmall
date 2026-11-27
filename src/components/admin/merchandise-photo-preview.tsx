"use client";

import Link from "next/link";
import type { HomepagePhotoStatus } from "@/lib/data/homepage-exhibition";
import { useLocale } from "@/components/i18n/locale-provider";

type Photo = { id:string; url:string; visible:boolean; paletteReviewed?:boolean };

const statusCopy = {
  ready: ["Homepage ready", "可供首頁選用", "ホームページ掲載候補"],
  review: ["Homepage review pending", "等待首頁審核", "ホームページ用審査待ち"],
  "catalogue-first": ["Catalogue publication needed", "須先發布至商品目錄", "カタログ公開が先です"],
  "demo-only": ["Demo collection only", "僅供示範系列", "デモコレクション専用"],
  unavailable: ["Homepage status unavailable", "暫未能取得首頁狀態", "ホームページの状態を確認できません"],
} as const;

export function HomepagePhotoBadge({ status }: { status?:HomepagePhotoStatus }) {
  const { t } = useLocale();
  if (!status) return null;
  const [en, zh, ja] = statusCopy[status];
  return <span className={`homepage-photo-badge is-${status}`}>{t(en, zh, ja)}</span>;
}

export function MerchandisePhotoPreview({ id, photos, status }: { id:string; photos:Photo[]; status?:HomepagePhotoStatus }) {
  const { t } = useLocale();
  const cover = photos.find(photo => photo.visible);
  const safePhotos = photos.filter(photo => /^https:\/\//i.test(photo.url) || /^\/(?![\/\\])/.test(photo.url));

  return (
    <section className="merchandise-photo-preview" aria-label={t("Photo preview", "照片預覽", "画像プレビュー")}>
      <div className="admin-card-heading">
        <h3>{t("Photo preview", "照片預覽", "画像プレビュー")}</h3>
        <Link className="text-link" href={`/admin/batches?productId=${id}`}>{t("Open photo batches", "開啟圖片批次", "画像バッチを開く")} →</Link>
      </div>
      {status && <p>{t(
        "A homepage-ready photo is the published catalogue cover with its own palette approval. Homepage review is separate from catalogue visibility.",
        "已發布的商品封面須通過獨立色調審核，才可供首頁選用。首頁審核與商品目錄的顯示設定分開。",
        "公開中のカタログ表紙が個別の色調審査を通過すると、ホームページに掲載できます。ホームページ審査とカタログの表示設定は別です。",
      )}</p>}
      {safePhotos.length ? <div className="merchandise-photo-grid">
        {safePhotos.map(photo => (
          <figure key={photo.id}>
            <a href={photo.url} target="_blank" rel="noopener noreferrer"
              aria-label={t("Open photo at full size", "開啟原尺寸照片", "原寸の画像を開く")}>
              <img src={photo.url} alt="" loading="lazy" />
            </a>
            <figcaption>
              <span>{photo.id === cover?.id ? t("Catalogue cover", "商品目錄封面", "カタログ表紙")
                : photo.visible ? t("Additional catalogue photo", "其他商品目錄照片", "カタログの追加画像")
                  : t("Hidden in catalogue", "商品目錄未顯示", "カタログでは非表示")}</span>
              {photo.id === cover?.id ? <HomepagePhotoBadge status={status} />
                : photo.paletteReviewed && <span className="homepage-photo-badge">{t("Palette reviewed", "色調已審核", "色調審査済み")}</span>}
            </figcaption>
          </figure>
        ))}
      </div> : <p>{t("New uploads can be previewed in Photo batches.", "新上傳的圖片可在圖片批次內預覽。", "新しくアップロードした画像は画像バッチで確認できます。")}</p>}
    </section>
  );
}
