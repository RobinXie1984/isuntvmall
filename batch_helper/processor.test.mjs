import test from 'node:test';
import assert from 'node:assert/strict';
import sharp from 'sharp';
import { mkdtemp, readFile, writeFile, mkdir } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { fileURLToPath } from 'node:url';
import { normalizeImage, preset, sha256, MAX_BYTES } from './processor.mjs';
const run = promisify(execFile);
const root = path.dirname(fileURLToPath(import.meta.url));
const style = JSON.parse(await readFile(path.join(root,'../style/muji/tokens.json'),'utf8'));
const source = await sharp({ create: { width: 120, height: 60, channels: 3, background: '#cd2638' } }).png().toBuffer();
test('normalizes to square WebP, preserves source bytes and removes metadata', async () => {
  const input = await sharp(source).withMetadata({ orientation: 6 }).jpeg().toBuffer();
  const before = sha256(input); const result = await normalizeImage(input,style,'image/jpeg');
  const metadata = await sharp(result.bytes).metadata();
  assert.equal(metadata.width,1600); assert.equal(metadata.height,1600); assert.equal(metadata.format,'webp');
  assert.equal(metadata.exif,undefined); assert.equal(metadata.icc,undefined); assert.equal(sha256(input),before);
  assert.equal(result.sourceSha256,before); assert.equal(result.outputSha256,sha256(result.bytes));
});
test('deterministic processing uses distinct style fingerprints', async () => {
  const a = await normalizeImage(source,style); const b = await normalizeImage(source,style);
  assert.equal(a.outputSha256,b.outputSha256);
  const c = await normalizeImage(source,{...style,image:{...style.image,background:'#ffffff'}});
  assert.notEqual(c.presetSha256,a.presetSha256); assert.notEqual(c.outputSha256,a.outputSha256);
});
test('rejects unsupported SVG, mime mismatch, corrupt and oversized inputs', async () => {
  await assert.rejects(normalizeImage(Buffer.from('<svg></svg>'),style),/SIGNATURE/);
  await assert.rejects(normalizeImage(source,style,'image/jpeg'),/MIME_MISMATCH/);
  await assert.rejects(normalizeImage(Buffer.from([255,216,255,1,2,3]),style));
  await assert.rejects(normalizeImage(Buffer.alloc(MAX_BYTES+1),style),/SIZE_LIMIT/);
});
test('rejects animation and oversized pixel declarations', async () => {
  const animation = await sharp([{ create: { width: 4, height: 4, channels: 3, background: '#ffffff' } }, { create: { width: 4, height: 4, channels: 3, background: '#ff0000' } }], { join: { animated: true } }).webp({ loop:0, delay:[100,100] }).toBuffer();
  const meta = await sharp(animation,{animated:true}).metadata();
  assert.equal(meta.pages,2);
  await assert.rejects(normalizeImage(animation,style),/ANIMATION/);
  const apngControl = Buffer.alloc(20); apngControl.writeUInt32BE(8,0); apngControl.write('acTL',4);
  await assert.rejects(normalizeImage(Buffer.concat([source.subarray(0,33),apngControl,source.subarray(33)]),style),/ANIMATION/);
  const png = await sharp({create:{width:6500,height:6500,channels:3,background:'#fff'}}).png().toBuffer();
  await assert.rejects(normalizeImage(png,style),/pixel limit/i);
});
test('all six style presets satisfy constrained normalization contract', async () => {
  for(const id of ['muji','apple','amazon','openai','daks-burberry','hermes-valentino']) assert.equal(preset(JSON.parse(await readFile(path.join(root,'../style',id,'tokens.json'),'utf8'))).id,id);
  assert.throws(()=>preset({...style,image:{...style.image,padding:0.5}}),/PRESET/);
});
test('CLI resumes exact outputs; changed sources make a new revision, never modify originals', async () => {
  const dir = await mkdtemp(path.join(tmpdir(),'isun-batch-test-')); const input=path.join(dir,'input'); const output=path.join(dir,'output'); await mkdir(input);
  await writeFile(path.join(input,'red.png'),source);
  const args=[path.join(root,'cli.mjs'),'--input',input,'--output',output];
  const first=await run(process.execPath,args); assert.equal(JSON.parse(first.stdout).processed,1);
  const second=await run(process.execPath,args); assert.equal(JSON.parse(second.stdout).skipped,1);
  assert.equal(sha256(await readFile(path.join(input,'red.png'))),sha256(source));
  const changed=await sharp(source).resize(100,50).png().toBuffer(); await writeFile(path.join(input,'red.png'),changed);
  await run(process.execPath,args);
  const manifest=JSON.parse(await readFile(path.join(output,'manifest.json'),'utf8')); assert.equal(manifest.items[0].revision,2); assert.equal(manifest.items[0].status,'review');
});
