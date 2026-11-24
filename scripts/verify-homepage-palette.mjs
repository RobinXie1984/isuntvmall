import { readFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';

const locales = ['en', 'zh-Hant', 'zh-Hans', 'ja'];

export function verifyHomepagePalette(html, reviewedImages) {
  const locale = html.match(/<html\b[^>]*\blang="([^"]+)"/)?.[1];
  const main = html.match(/<div class="homepage-exhibition">([\s\S]+?)<\/main>/)?.[1];
  if (!locales.includes(locale) || !main) throw new Error('HOMEPAGE_PALETTE_MARKUP_MISSING');

  const seen = new Set();
  const rendered = new Set();
  const cards = main.matchAll(/<article class="product-card">([\s\S]+?)<\/article>/g);
  for (const [, card] of cards) {
    const slug = card.match(/href="\/product\/([^"?]+)"/)?.[1];
    const image = card.match(/<img\b[^>]*\bsrc="([^"]+)"/)?.[1]?.replaceAll('&amp;', '&');
    if (!slug || !image || seen.has(slug) || !Object.hasOwn(reviewedImages, slug) || reviewedImages[slug] !== image) {
      throw new Error(`HOMEPAGE_PHOTO_NOT_REVIEWED: ${locale} ${slug ?? 'unknown product'}`);
    }
    seen.add(slug);
    rendered.add(image);
  }
  if (!seen.size) throw new Error('HOMEPAGE_PALETTE_NO_CARDS');
  for (const [, banner] of main.matchAll(/<div class="brand-banner-photo">([\s\S]+?)<\/div>/g)) {
    const image = banner.match(/<img\b[^>]*\bsrc="([^"]+)"/)?.[1]?.replaceAll('&amp;', '&');
    if (!rendered.has(image)) throw new Error(`HOMEPAGE_BANNER_NOT_REVIEWED: ${locale}`);
  }
  return { locale, cards: seen.size };
}

if (process.argv[1] && pathToFileURL(process.argv[1]).href === import.meta.url) {
  const reviewedImages = JSON.parse(readFileSync(new URL('../src/lib/data/homepage-exhibition-images.json', import.meta.url), 'utf8'));
  const pages = process.argv.slice(2).map(file => verifyHomepagePalette(readFileSync(file, 'utf8'), reviewedImages));
  if (pages.length !== locales.length || !locales.every(locale => pages.some(page => page.locale === locale))) {
    throw new Error('HOMEPAGE_PALETTE_REQUIRES_FOUR_LANGUAGES');
  }
  console.log(JSON.stringify(pages, null, 2));
}
