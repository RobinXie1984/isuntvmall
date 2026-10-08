/** Reproduce only individually inspected crop rectangles; never overwrite source photos. */
import sharp from "sharp";
import { readFile, writeFile, mkdir } from "node:fs/promises";
import { createHash } from "node:crypto";
import path from "node:path";
const root = process.cwd();
const plan = JSON.parse(await readFile(path.join(root, "docs/MUJI-CROP-PLAN-20261008.json"), "utf8"));
const out = path.join(root, "public/products/muji-reviewed");
await mkdir(out, { recursive: true });
const sha = bytes => createHash("sha256").update(bytes).digest("hex");
const ledgerPath = path.join(root, "docs/MUJI-CROP-LEDGER-20261008.json");
let existingLedger = [];
try { existingLedger = JSON.parse(await readFile(ledgerPath, "utf8")); }
catch (error) { if (error.code !== "ENOENT") throw error; }
const ledger = [];
for (const [file, [left, top, width, height]] of Object.entries(plan)) {
 const source = await readFile(path.join(root, "public/products/supplier-demo", file));
 const square = Math.ceil(Math.max(width, height) / .84);
 const horizontal = square - width, vertical = square - height;
 const bytes = await sharp(source).extract({left, top, width, height}).extend({left: Math.floor(horizontal/2), right: Math.ceil(horizontal/2), top: Math.floor(vertical/2), bottom: Math.ceil(vertical/2), background: "#f5f4f0"}).webp({lossless:true}).toBuffer();
 const target = path.join(out, file);
 try { const existing = await readFile(target); if (sha(existing) !== sha(bytes)) throw new Error(`Existing crop differs: ${file}`); }
 catch (error) { if (error.code !== "ENOENT") throw error; await writeFile(target, bytes, {flag:"wx"}); }
 const prior = existingLedger.find(entry => entry.source === `/products/supplier-demo/${file}` && entry.sourceSha256 === sha(source) && entry.outputSha256 === sha(bytes));
 ledger.push({source: `/products/supplier-demo/${file}`, sourceSha256: sha(source), crop:{left,top,width,height}, output:`/products/muji-reviewed/${file}`, outputSha256:sha(bytes), square, encoding:"lossless WebP", resampling:false, visualDecision: prior?.visualDecision || "pending inspection", ...(prior?.decodedProductPixelsEqual === true ? {decodedProductPixelsEqual:true} : {})});
}
await writeFile(path.join(root, "docs/MUJI-CROP-LEDGER-20261008.json"), JSON.stringify(ledger,null,2)+"\n");
console.log(`Prepared ${ledger.length} lossless crops, no original overwritten or colour/shape changes.`);
