// Bounded offline workload verification; creates fixtures only in a new folder.
import { mkdir, readFile, writeFile, readdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import assert from 'node:assert/strict';
import sharp from 'sharp';
import { normalizeImage, sha256 } from './processor.mjs';
const run=promisify(execFile);
const args=process.argv.slice(2);const value=(key)=>args[args.indexOf(key)+1];
if(!args.includes('--output')||!args.includes('--samples'))throw new Error('Usage: node benchmark.mjs --output /new-qa-folder --samples /public-photo-folder');
const output=path.resolve(value('--output'));const samples=path.resolve(value('--samples'));
await mkdir(output); // Existing folders are never overwritten.
const root=path.dirname(fileURLToPath(import.meta.url));
const input=path.join(output,'input');const images=path.join(output,'normalized');await mkdir(input);
const fixture=await sharp({create:{width:32,height:24,channels:3,background:'#c5b896'}}).png().toBuffer();
for(let index=0;index<1000;index++)await writeFile(path.join(input,`fixture-${String(index).padStart(4,'0')}.png`),fixture);
let start=performance.now();
const first=JSON.parse((await run(process.execPath,[path.join(root,'cli.mjs'),'--input',input,'--output',images,'--concurrency','2'],{maxBuffer:1024*1024})).stdout);
const firstSeconds=(performance.now()-start)/1000;
assert.equal(first.processed,1000);assert.equal(first.failed,0);
start=performance.now();
const second=JSON.parse((await run(process.execPath,[path.join(root,'cli.mjs'),'--input',input,'--output',images,'--concurrency','2'],{maxBuffer:1024*1024})).stdout);
const resumeSeconds=(performance.now()-start)/1000;
assert.equal(second.skipped,1000);assert.equal(second.processed,0);
const manifest=JSON.parse(await readFile(path.join(images,'manifest.json'),'utf8'));
for(const item of manifest.items){assert.equal(item.sourceSha256,sha256(fixture));assert.equal(sha256(await readFile(path.join(images,item.output))),item.outputSha256);}
const style=JSON.parse(await readFile(path.join(root,'../style/muji/tokens.json'),'utf8'));
const photos=(await readdir(samples)).filter(f=>/\.jpe?g$/i.test(f)).sort().slice(0,50);
assert.equal(photos.length,50,'Supply at least50 public JPEG fixtures');
await mkdir(path.join(output,'real-photos'));
start=performance.now();let inputBytes=0;let outputBytes=0;
for(const [index,name] of photos.entries()){
 const original=await readFile(path.join(samples,name));const hash=sha256(original);
 const result=await normalizeImage(original,style,'image/jpeg');
 assert.equal(sha256(await readFile(path.join(samples,name))),hash);
 const meta=await sharp(result.bytes).metadata();assert.equal(meta.width,1600);assert.equal(meta.height,1600);
 inputBytes+=original.length;outputBytes+=result.bytes.length;
 await writeFile(path.join(output,'real-photos',`${String(index).padStart(2,'0')}.webp`),result.bytes);
}
const report={syntheticImages:1000,processed:1000,failed:0,concurrency:2,firstSeconds,resumeSkipped:1000,resumeSeconds,allOutputHashesVerified:true,realPhotos:50,realPhotoSeconds:(performance.now()-start)/1000,inputBytes,outputBytes,originalsUnchanged:true,dimensions:'1600x1600',publication:false};
await writeFile(path.join(output,'report.json'),JSON.stringify(report,null,2));console.log(JSON.stringify(report,null,2));
