import { createClient } from '@supabase/supabase-js';
import { normalizeImage, sha256, MAX_BYTES } from './processor.mjs';
import { boundedFetch } from './network.mjs';
import { expireInventoryReservations } from './maintenance.mjs';

const args = process.argv.slice(2);
const limitIndex = args.indexOf('--limit');
const limit = limitIndex < 0 ? 20 : Number(args[limitIndex + 1]);
if (!args.includes('--once') || !Number.isInteger(limit) || limit < 1 || limit > 1000) throw new Error('Usage: node worker.mjs --once [--limit 20], limit 1 to 1000');
const url = process.env.SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
const batchEnabled = process.env.BATCH_HELPER_ENABLED === 'true';
const maintenanceEnabled = process.env.COMMERCE_MAINTENANCE_ENABLED === 'true';
if (!url || !key || (!batchEnabled && !maintenanceEnabled)) throw new Error('Worker requires an explicitly enabled batch or commerce-maintenance task and server-only Supabase credentials');
if (!/^https:\/\//.test(url) && !/^http:\/\/(localhost|127\.0\.0\.1)(:|\/)/.test(url)) throw new Error('HTTPS required');
const secondsIndex = args.indexOf('--max-seconds');
const maxSeconds = secondsIndex < 0 ? 900 : Number(args[secondsIndex + 1]);
if (!Number.isInteger(maxSeconds) || maxSeconds < 1 || maxSeconds > 3600) throw new Error('Run budget must be1 to3600 seconds');
const runController = new AbortController();
const runTimer = setTimeout(() => runController.abort(new Error('RUN_DEADLINE')), maxSeconds * 1000);
const hardStopTimer = setTimeout(() => { console.error(JSON.stringify({ outcome: 'RUN_DEADLINE', recovery: 'Lease expiry permits another bounded run' })); process.exit(1); }, (maxSeconds + 5) * 1000);
const db = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false }, global: { fetch: boundedFetch({ runSignal: runController.signal }) } });
const maintenanceDb = maintenanceEnabled ? createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false }, global: { fetch: boundedFetch({ runSignal: runController.signal, timeoutMs: 10_000 }) } }) : null;
async function rpc(name, data) { const result = await db.rpc(name, data); if (result.error) throw new Error(result.error.message); return result.data; }
async function download(bucket, path, cap) {
  const { data, error } = await db.storage.from(bucket).download(path);
  if (error) throw new Error(error.message);
  if (data.size > cap) throw new Error('STORAGE_SIZE_LIMIT');
  return Buffer.from(await data.arrayBuffer());
}
async function immutableUpload(bucket, path, bytes, guard) {
  await rpc('batch_reserve_object', { ...guard, p_bucket: bucket, p_object_path: path, p_byte_size: bytes.length, p_sha256: sha256(bytes) });
  const { error } = await db.storage.from(bucket).upload(path, bytes, { contentType: 'image/webp', upsert: false, cacheControl: '31536000' });
  // A crash may leave the immutable object before the database commit. Accept
  // only an exact byte match; never replace an existing object.
  if (error) {
    const existing = await download(bucket, path, 8 * 1024 * 1024);
    if (sha256(existing) !== sha256(bytes)) throw new Error('IMMUTABLE_OBJECT_CONFLICT');
  }
  const verified = await download(bucket, path, 8 * 1024 * 1024);
  if (sha256(verified) !== sha256(bytes)) throw new Error('UPLOAD_HASH_MISMATCH');
}
let completed = 0; let failed = 0; let workerError = null;
let commerceMaintenance = { enabled: maintenanceEnabled, status: 'UNKNOWN', reason: 'NOT_ATTEMPTED', releasedReservations: null, checkedAt: null, durationMs: null };
try {
commerceMaintenance = await expireInventoryReservations({ enabled: maintenanceEnabled, client: maintenanceDb });
if (maintenanceEnabled) console.log(JSON.stringify({ task: 'inventory-expiry', ...commerceMaintenance }));
for (let index = 0; batchEnabled && index < limit && !runController.signal.aborted; index++) {
  const [item] = await rpc('batch_claim', { p_limit: 1 });
  if (!item) break;
  const guard = { p_item_id: item.id, p_revision: item.revision, p_lease_token: item.lease_token };
  try {
    if (item.status === 'processing') {
      const batch = await db.from('media_batches').select('style_snapshot').eq('id', item.batch_id).single();
      if (batch.error) throw new Error(batch.error.message);
      const bytes = await download('batch-originals', item.original_path, MAX_BYTES);
      if (bytes.length !== item.byte_size) throw new Error('ORIGINAL_SIZE_CHANGED');
      const result = await normalizeImage(bytes, batch.data.style_snapshot, item.mime);
      if (item.source_sha256 && item.source_sha256 !== result.sourceSha256) throw new Error('ORIGINAL_CHANGED');
      const path = `${item.batch_id}/${item.id}/r${item.revision}-${result.outputSha256}.webp`;
      await immutableUpload('batch-processed', path, result.bytes, guard);
      await rpc('batch_processed', { ...guard, p_source_sha256: result.sourceSha256, p_output_sha256: result.outputSha256, p_processed_path: path, p_preset_sha256: result.presetSha256, p_processor_version: result.processor });
    } else if (item.status === 'publishing') {
      // Fresh approval check before public copy, then SQL checks it again when
      // publishing the product transaction. Public bytes alone are not listings.
      const approver = await db.from('staff_members').select('role,active').eq('user_id', item.approved_by).single();
      if (approver.error || !approver.data.active || approver.data.role !== 'super_admin' || item.approved_revision !== item.revision) throw new Error('APPROVAL_REVOKED');
      const bytes = await download('batch-processed', item.processed_path, 8 * 1024 * 1024);
      if (sha256(bytes) !== item.output_sha256) throw new Error('APPROVED_IMAGE_CHANGED');
      const path = `batch/${item.id}/r${item.revision}-${item.output_sha256}.webp`;
      await immutableUpload('product-images', path, bytes, guard);
      const { data } = db.storage.from('product-images').getPublicUrl(path);
      await rpc('batch_publish', { ...guard, p_image_url: data.publicUrl, p_public_path: path, p_output_sha256: item.output_sha256 });
    } else throw new Error('UNKNOWN_CLAIM_STATE');
    completed++;
    console.log(JSON.stringify({ item: item.id, revision: item.revision, outcome: item.status === 'processing' ? 'review' : 'published' }));
  } catch (error) {
    failed++;
    // Avoid leaking storage URLs, credentials, or full upstream response data.
    const message = String(error.message).replace(/https?:\/\/\S+/g, '[url]').slice(0, 500);
    await rpc('batch_fail', { ...guard, p_error: message }).catch(() => undefined);
    console.error(JSON.stringify({ item: item.id, revision: item.revision, outcome: 'failed', reason: message }));
  }
}
} catch (error) {
  workerError = String(error.message).replace(/https?:\/\/\S+/g, '[url]').slice(0, 500);
  console.error(JSON.stringify({ outcome: 'WORKER_OPERATION_FAILED', reason: workerError }));
}
finally { clearTimeout(runTimer); clearTimeout(hardStopTimer); }
const deadlineReached = runController.signal.aborted;
console.log(JSON.stringify({ completed, failed, bounded: true, maxSeconds, deadlineReached, batchEnabled, commerceMaintenance, workerError }));
if (failed || deadlineReached || workerError || (maintenanceEnabled && commerceMaintenance.status !== 'PASS')) process.exitCode = 1;
