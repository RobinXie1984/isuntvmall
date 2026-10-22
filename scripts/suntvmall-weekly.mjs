/** Weekly sync primitives. Called by the weekly Codex job, not on storefront requests.
 * Source files and receipts stay in the private Studio run folder. No credentials here.
 */
import { createHash } from 'node:crypto';

const digest = value => createHash('sha256').update(JSON.stringify(value)).digest('hex');
export function cents(value) {
  if (!/^\d{1,7}(\.\d{1,2})?$/.test(String(value))) throw Error('INVALID_SOURCE_PRICE');
  const [whole, fraction = ''] = String(value).split('.');
  const result = Number(whole) * 100 + Number(fraction.padEnd(2, '0'));
  if (result <= 0 || result > 999999999) throw Error('INVALID_SOURCE_PRICE');
  return result;
}
function checkedFeed(feed) {
  if (!Array.isArray(feed?.products) || !feed.products.length) throw Error('EMPTY_OR_INVALID_FEED');
  const products = new Map(); const variants = new Set();
  for (const p of feed.products) {
    const id = String(p.id);
    if (!/^\d+$/.test(id) || products.has(id) || !/^[a-z0-9-]+$/.test(p.handle) || !Array.isArray(p.variants) || !p.variants.length) throw Error('INVALID_SOURCE_PRODUCT');
    for (const v of p.variants) {
      if (!/^\d+$/.test(String(v.id)) || variants.has(String(v.id))) throw Error('INVALID_SOURCE_VARIANT');
      variants.add(String(v.id)); cents(v.price);
    }
    products.set(id, p);
  }
  return products;
}
const pictures = p => (p.images || []).map(i => ({ id: String(i.id), src: i.src, width: i.width, height: i.height }));
const commercial = p => ({ title: p.title, body: p.body_html, vendor: p.vendor, handle: p.handle, options: p.options, variants: p.variants.map(v => ({ id: String(v.id), price: cents(v.price), available: v.available, options: [v.option1, v.option2, v.option3] })) });

export function validatePreparedCatalogue(previous, next, feed) {
  const source = checkedFeed(feed); const old = new Map(previous.products.map(p=>[p.sourceId,p]));
  const ids = new Set(); const sourceIds = new Set();
  for (const p of next.products) {
    if (ids.has(p.id) || sourceIds.has(p.sourceId)) throw Error('DUPLICATE_PREPARED_PRODUCT');
    ids.add(p.id); sourceIds.add(p.sourceId);
    const before = old.get(p.sourceId);
    if (before && (p.id!==before.id || p.sku!==before.sku || p.slug!==before.slug || p.reviewedImageName!==before.reviewedImageName)) throw Error('IDENTITY_OR_APPROVED_MEDIA_CHANGED');
    if (!before && p.reviewedImageName) throw Error('NEW_PHOTO_NOT_APPROVED');
    const current = source.get(p.sourceId); if (!current) continue;
    if (p.sku!=='SUNTV-'+p.sourceId || p.sourceHandle!==current.handle || p.variants.length!==current.variants.length) throw Error('SOURCE_COVERAGE_MISMATCH');
    const variants = new Map(current.variants.map(v=>[String(v.id),v]));
    if (new Set(p.variants.map(v=>v.id)).size!==p.variants.length) throw Error('DUPLICATE_PREPARED_VARIANT');
    for (const v of p.variants) {
      if (!variants.has(v.id) || cents(variants.get(v.id).price)!==v.priceAmount) throw Error('SOURCE_PRICE_MISMATCH');
      for (const locale of ['en','zh-Hant','zh-Hans','ja']) if (!p.title[locale]?.trim() || !p.description[locale]?.trim() || v.options.some(o=>!o[locale]?.trim())) throw Error('MISSING_TRANSLATION');
    }
    if (p.priceAmount!==Math.min(...p.variants.map(v=>v.priceAmount))) throw Error('MINIMUM_PRICE_MISMATCH');
    if (new Set(p.variants.map(v=>JSON.stringify(v.options.map(o=>o['zh-Hant'])))).size!==p.variants.length) throw Error('OPTION_IDENTITY_COLLISION');
  }
  if ([...old.keys()].some(id=>!sourceIds.has(id)) || [...source.keys()].some(id=>!sourceIds.has(id))) throw Error('PREPARED_CATALOGUE_INCOMPLETE');
  return { products: next.products.length, sourceProducts: source.size, approvedMediaUnchanged: true };
}

export function weeklyPlan(previousFeed, currentFeed, catalogue, checkedAt) {
  const before = checkedFeed(previousFeed); const now = checkedFeed(currentFeed);
  const known = new Map(catalogue.products.map(p => [p.sourceId, p]));
  const changes = []; const metadata = structuredClone(catalogue);
  metadata.snapshotAt = checkedAt;
  for (const [id, source] of now) {
    const old = before.get(id); const entry = known.get(id);
    const imageChanged = !old || digest(pictures(old)) !== digest(pictures(source));
    if (!entry || !old) {
      changes.push({ sourceId: id, kind: 'new', publish: false, imageReview: true, copyReview: true });
      continue;
    }
    const changed = digest(commercial(old)) !== digest(commercial(source));
    const optionsChanged = digest(old.options) !== digest(source.options);
    // Match original option identity, never a lossy translated display label.
    const oldVariants = new Map(old.variants.map(v => [String(v.id), v]));
    const translated = new Map(entry.variants.map(v => [v.id, v]));
    const nextVariants = []; let needsCopy = optionsChanged || source.title !== old.title || source.body_html !== old.body_html;
    for (const v of source.variants) {
      const previous = oldVariants.get(String(v.id)); const translation = translated.get(String(v.id));
      if (!previous || !translation || ['option1','option2','option3'].some(k => previous[k] !== v[k])) { needsCopy = true; continue; }
      nextVariants.push({ ...translation, priceAmount: cents(v.price), available: Boolean(v.available) });
    }
    if (!needsCopy && nextVariants.length === source.variants.length) {
      const next = metadata.products.find(p => p.sourceId === id);
      next.variants = nextVariants; next.priceAmount = Math.min(...nextVariants.map(v => v.priceAmount));
      next.sourceHandle = source.handle; next.sourceUpdatedAt = source.updated_at;
    }
    if (changed || imageChanged) changes.push({ sourceId: id, kind: 'existing', metadataChanged: changed, imageReview: imageChanged, copyReview: needsCopy, publishImage: false });
  }
  // A missing product may indicate a partial source response. Never delete/archive it.
  const missing = [...before.keys()].filter(id => !now.has(id));
  return { checkedAt, sourceCount: now.size, changes, missing, metadata, sourceDigest: digest(currentFeed), mediaPolicy: 'private-review-only' };
}

const checked = result => { if (result.error) throw Error(result.error.message); return result.data; };
/** Preserve pending colleague edits, approval state, supplier information and visible image IDs. */
export async function applyExistingMetadata(db, actor, current, previous, next) {
  if (current.sku !== previous.sku || current.id !== previous.id || next.id !== previous.id || next.sku !== previous.sku) throw Error('SOURCE_IDENTITY_CONFLICT');
  if (current.draftState === 'draft') return { status: 'held', reason: 'COLLEAGUE_DRAFT' };
  const payload = { ...current.payload };
  if (![previous.priceAmount, next.priceAmount].includes(payload.priceAmount)) return { status: 'held', reason: 'COLLEAGUE_PRICE_EDIT' };
  payload.priceAmount = next.priceAmount;
  for (const [field, source, locale] of [['title','title','en'],['titleZh','title','zh-Hant'],['description','description','en'],['descriptionZh','description','zh-Hant']]) {
    if (payload[field] === previous[source][locale]) payload[field] = next[source][locale];
  }
  if (JSON.stringify(payload) === JSON.stringify(current.payload)) return { status: 'unchanged' };
  const saved = checked(await db.rpc('merchandise_save', { p_actor: actor, p_product: current.id, p_revision: current.revision, p_base_revision: current.baseRevision, p_payload: payload, p_supplier: current.supplier }));
  checked(await db.rpc('merchandise_publish', { p_actor: actor, p_product: current.id, p_revision: saved.revision }));
  return { status: 'updated', imageIds: payload.visibleImageIds, productStatus: payload.status };
}

/** Stage an original in the existing private MUJI queue. This function cannot approve or publish it. */
export async function queueSupplierPhoto({ db, actor, productId, filename, mime, bytes, preset, sourceId }) {
  if (!/^\d+$/.test(sourceId) || !/^[a-zA-Z0-9_.-]{1,150}$/.test(filename) || !['image/jpeg','image/png','image/webp'].includes(mime) || bytes.length < 1 || bytes.length > 25165824 || preset.id !== 'muji') throw Error('INVALID_REVIEW_INPUT');
  const hash = createHash('sha256').update(bytes).digest('hex');
  const h = digest([sourceId, productId, hash]);
  const request = `${h.slice(0,8)}-${h.slice(8,12)}-5${h.slice(13,16)}-a${h.slice(17,20)}-${h.slice(20,32)}`;
  const batchId = checked(await db.rpc('batch_create', { p_actor: actor, p_request_id: request, p_title: `SunTVMall photo review · ${sourceId} · ${hash.slice(0,8)}`, p_style_id: 'muji', p_style_snapshot: preset, p_items: [{ filename, mime, byte_size: bytes.length, product_data: { targetProductId: productId } }] }));
  const items = checked(await db.from('media_batch_items').select('id,original_path,status,revision').eq('batch_id', batchId));
  if (items.length !== 1) throw Error('REVIEW_ITEM_COUNT');
  const item = items[0];
  if (item.status === 'awaiting_upload') {
    const upload = await db.storage.from('batch-originals').upload(item.original_path, bytes, { contentType: mime, upsert: false });
    if (upload.error && !/already exists|duplicate/i.test(upload.error.message)) throw Error(upload.error.message);
    const stored = checked(await db.storage.from('batch-originals').download(item.original_path));
    if (createHash('sha256').update(Buffer.from(await stored.arrayBuffer())).digest('hex') !== hash) throw Error('PRIVATE_IMAGE_HASH_MISMATCH');
    checked(await db.rpc('batch_finalize', { p_actor: actor, p_item_id: item.id, p_revision: item.revision }));
  }
  return { batchId, itemId: item.id, sha256: hash, publicImageChanged: false };
}
