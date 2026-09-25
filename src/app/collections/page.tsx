import Link from "next/link";
import { getLocale } from "@/lib/locale-server";
import { holidayCollections, holidayCollectionImage } from "@/lib/data/holiday-collections";
import { holidaySamples } from "@/lib/data/holiday-catalogue";
import { holidayCalendar, holidayRegions, holidayRegion } from "@/lib/data/holiday-calendar";

export const dynamic = "force-dynamic";
export async function generateMetadata() {
  const { t } = await getLocale();
  return { title: t("The holiday edit", "節日選物"), description: t("Thoughtful seasonal collections for Hong Kong, Taiwan, Japan and the United States.", "為香港、台灣、日本與美國節日設計的用心選物。") };
}

export default async function CollectionsPage({ searchParams }: { searchParams: Promise<{ region?: string }> }) {
  const [{ locale, t }, params] = await Promise.all([getLocale(), searchParams]);
  const language = locale === "en" ? 0 : 1;
  const region = holidayRegion(params.region);
  const occasions = holidayCalendar.filter(day => !region || day.region === region);
  const relevant = new Set(occasions.map(day => day.collectionId));
  const collections = holidayCollections.filter(collection => !region || relevant.has(collection.id));
  const date = new Intl.DateTimeFormat(locale === "en" ? "en-GB" : "zh-HK", { month: "short", day: "numeric", timeZone: "UTC" });
  const formatDate = (value: string) => date.format(new Date(`${value}T12:00:00Z`));
  return <div className="shell page-space holiday-page">
    <div className="holiday-intro"><span className="eyebrow">{t("THE HOLIDAY EDIT · 2026", "節日選物 · 2026")}</span><h1>{t("For moments\nwe share.", "把節日，\n過成相聚的日子。")}</h1><p>{t("A year of thoughtful gifts, familiar traditions and little reasons to gather. Made in the same quiet spirit as the everyday.", "一年的用心禮物、熟悉節俗與小小相聚理由，延續日常選物的靜雅心意。")}</p></div>
    <nav className="region-tabs" aria-label={t("Browse by region", "按地區瀏覽")}>
      <Link href="/collections" aria-current={!region ? "page" : undefined}>{t("All regions", "全部地區")}</Link>
      {holidayRegions.map(item => <Link key={item.id} href={`/collections?region=${item.id}`} aria-current={region === item.id ? "page" : undefined}>{item.name[language]}</Link>)}
    </nav>
    <div className="holiday-collection-grid">{collections.map(collection => <Link className="holiday-collection-card" href={`/shop?collection=${collection.id}`} key={collection.id}>
      <div className="holiday-collection-image"><img src={holidayCollectionImage(collection.id)} alt={collection.title[language]} loading="lazy" /></div>
      <span className="eyebrow">{collection.occasion[language]}</span><h2>{collection.title[language]} <span aria-hidden="true">↗</span></h2><p>{collection.description[language]}</p>
      <span className="text-link">{t(`${holidaySamples.filter(sample => sample.collectionId === collection.id).length} pieces to explore`, `${holidaySamples.filter(sample => sample.collectionId === collection.id).length} 件節日選物`)}</span>
    </Link>)}</div>
    <details className="holiday-calendar" id="occasion-guide"><summary>{t("Plan by occasion — 2026 holiday guide", "按節日計劃 — 2026 節日指南")} <span aria-hidden="true">+</span></summary>
      <p className="section-description">{t("National and public holidays, plus selected cultural occasions. Festival dates and observed days can differ; local traditions vary. This is a gift-planning guide.", "涵蓋公眾與國定假日，並精選文化節俗。節日本日與補假日期可能不同，各地習俗亦有差異；此表供送禮計劃參考。")}</p>
      <ul className="occasion-list">{occasions.map(day => <li key={day.id}>
        <div className="occasion-date"><time dateTime={day.date}>{formatDate(day.date)}</time>{day.endDate && <> – <time dateTime={day.endDate}>{formatDate(day.endDate)}</time></>}</div>
        <div><small>{holidayRegions.find(item => item.id === day.region)?.name[language]} · {day.kind === "public" ? t("Public holiday", "公眾假日") : day.kind === "cultural" ? t("Cultural occasion", "文化節俗") : t("Seasonal window", "季節時段")}</small><h3>{day.name[language]}</h3>
          {day.note[0] !== "A date for thoughtful seasonal planning." && <p>{day.note[language]}</p>}
          <a className="occasion-source" href={day.sourceUrl} target="_blank" rel="noreferrer">{t("Date reference", "日期參考")} ↗</a>
        </div>
        {day.collectionId === "quiet-remembrance" ? <span className="occasion-reflection">{t("A moment of reflection", "片刻靜思")}</span> : <Link className="text-link" href={`/shop?collection=${day.collectionId}`}>{t("Explore the collection", "探索選物")} →</Link>}
      </li>)}</ul>
    </details>
  </div>;
}
