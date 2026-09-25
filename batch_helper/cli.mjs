import { readdir, readFile, writeFile, mkdir, rename, lstat, realpath } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { unlinkSync } from 'node:fs';
import { normalizeImage, preset, sha256, MAX_BYTES } from './processor.mjs';

const args = process.argv.slice(2);
function option(name, fallback) { const i = args.indexOf(name); return i < 0 ? fallback : args[i + 1]; }
const input = option('--input'); const output = option('--output');
if (!input || !output) { console.error('Usage: node cli.mjs --input /pictures --output /new-output [--style muji] [--concurrency 2]'); process.exit(2); }
const concurrency = Number(option('--concurrency', '2'));
if (!Number.isInteger(concurrency) || concurrency < 1 || concurrency > 4) throw new Error('Concurrency must be 1 to 4');
const styleId = option('--style', 'muji');
if (!/^[a-z-]+$/.test(styleId)) throw new Error('Invalid style id');
const root = path.dirname(fileURLToPath(import.meta.url));
const snapshot = preset(JSON.parse(await readFile(path.join(root, '../style', styleId, 'tokens.json'), 'utf8')));
const fingerprint = sha256(JSON.stringify(snapshot));
const inputPath = await realpath(input);
await mkdir(output, { recursive: true });
const outputPath = await realpath(output);
if (inputPath === outputPath || outputPath.startsWith(inputPath + path.sep)) throw new Error('Output must be outside input folder');
const lockPath = path.join(outputPath, '.batch-lock');
await writeFile(lockPath, String(process.pid), { flag: 'wx' });
process.on('exit', () => { try { unlinkSync(lockPath); } catch { /* Keep non-lock outputs intact. */ } });
const manifestPath = path.join(outputPath, 'manifest.json');
let old = { items: [] };
try { old = JSON.parse(await readFile(manifestPath, 'utf8')); } catch (e) { if (e.code !== 'ENOENT') throw e; }
const manifest = { version: 1, style: snapshot, presetSha256: fingerprint, processor: 'sharp-0.35.4/v1', items: old.items ?? [] };
const known = new Map(manifest.items.map((item) => [item.filename, item]));
let writes = Promise.resolve();
function save() { writes = writes.then(async () => { const json = JSON.stringify(manifest, null, 2); await writeFile(manifestPath + '.tmp', json); await rename(manifestPath + '.tmp', manifestPath); }); return writes; }
const entries = (await readdir(inputPath, { withFileTypes: true })).filter((entry) => entry.isFile()).map((entry) => entry.name).sort();
let cursor = 0; let failed = 0; let skipped = 0; let processed = 0;
await Promise.all(Array.from({ length: concurrency }, async () => {
  while (cursor < entries.length) {
    const filename = entries[cursor++]; const prior = known.get(filename); let item;
    try {
      const source = path.join(inputPath, filename); const stat = await lstat(source);
      if (!stat.isFile() || stat.isSymbolicLink() || stat.size > MAX_BYTES) throw new Error('INVALID_FILE_OR_SIZE');
      const bytes = await readFile(source); const hash = sha256(bytes);
      if (prior?.status === 'review' && prior.sourceSha256 === hash && prior.presetSha256 === fingerprint && prior.processor === manifest.processor && /^[a-f0-9-]+\.webp$/.test(prior.output ?? '')) {
        const present = await readFile(path.join(outputPath, prior.output)).catch(() => null);
        if (present && sha256(present) === prior.outputSha256) { skipped++; continue; }
      }
      const declaredMime = { '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.png': 'image/png', '.webp': 'image/webp' }[path.extname(filename).toLowerCase()];
      if (!declaredMime) throw new Error('UNSUPPORTED_FILE_EXTENSION');
      const result = await normalizeImage(bytes, snapshot, declaredMime);
      const revision = (prior?.revision ?? 0) + 1;
      const name = `${sha256(filename).slice(0,16)}-${revision}-${result.outputSha256.slice(0,16)}.webp`;
      await writeFile(path.join(outputPath, name), result.bytes, { flag: 'wx' }).catch(async (e) => { if (e.code !== 'EEXIST' || sha256(await readFile(path.join(outputPath, name))) !== result.outputSha256) throw e; });
      item = { filename, status: 'review', revision, sourceSha256: result.sourceSha256, outputSha256: result.outputSha256, presetSha256: result.presetSha256, processor: result.processor, output: name, width: result.width, height: result.height, productData: prior?.productData ?? { sku: `BATCH-${sha256(filename).slice(0,12).toUpperCase()}`, title: path.parse(filename).name, description: '', titleZh: '', descriptionZh: '', category: 'General', priceAmount: null, currency: 'hkd', stockQty: 0 } };
      processed++;
    } catch (error) { item = { filename, status: 'failed', revision: prior?.revision ?? 0, error: error.message }; failed++; }
    const index = manifest.items.findIndex((entry) => entry.filename === filename);
    if (index < 0) manifest.items.push(item); else manifest.items[index] = item;
    await save();
  }
}));
await save();
console.log(JSON.stringify({ processed, skipped, failed, manifest: manifestPath, publication: 'disabled: local manifests cannot approve or publish' }));
if (failed) process.exitCode = 1;
