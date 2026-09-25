import sharp from 'sharp';
import { createHash } from 'node:crypto';

export const MAX_BYTES = 24 * 1024 * 1024;
export const MAX_PIXELS = 40_000_000;
export const STYLE_IDS = ['muji', 'apple', 'amazon', 'openai', 'daks-burberry', 'hermes-valentino'];
export const sha256 = (bytes) => createHash('sha256').update(bytes).digest('hex');
sharp.cache(false);
sharp.concurrency(1);

export function preset(snapshot) {
  const image = snapshot?.image;
  if (!STYLE_IDS.includes(snapshot?.id) || !image || !/^#[0-9a-f]{6}$/i.test(image.background) || !Number.isFinite(image.padding) || image.padding < 0 || image.padding > 0.3 || image.size !== 1600 || image.format !== 'webp' || !Number.isInteger(image.quality) || image.quality < 60 || image.quality > 95) throw new Error('INVALID_STYLE_PRESET');
  return { id: snapshot.id, image: { background: image.background.toLowerCase(), padding: image.padding, size: image.size, format: image.format, quality: image.quality } };
}
export function identify(bytes) {
  if (bytes.length >= 3 && bytes[0] === 255 && bytes[1] === 216 && bytes[2] === 255) return 'image/jpeg';
  if (bytes.subarray(0, 8).equals(Buffer.from([137,80,78,71,13,10,26,10]))) return 'image/png';
  if (bytes.length >= 12 && bytes.toString('ascii', 0, 4) === 'RIFF' && bytes.toString('ascii', 8, 12) === 'WEBP') return 'image/webp';
  throw new Error('UNSUPPORTED_IMAGE_SIGNATURE');
}
export async function normalizeImage(bytes, snapshot, expectedMime) {
  if (!Buffer.isBuffer(bytes) || !bytes.length || bytes.length > MAX_BYTES) throw new Error('INPUT_SIZE_LIMIT');
  const mime = identify(bytes);
  if (expectedMime && expectedMime !== mime) throw new Error('MIME_MISMATCH');
  // libvips may decode only the default image of APNG; reject its animation
  // control chunk explicitly instead of silently publishing a single frame.
  if (mime === 'image/png') {
    for (let offset = 8; offset + 12 <= bytes.length;) {
      const length = bytes.readUInt32BE(offset);
      if (length > bytes.length - offset - 12) throw new Error('CORRUPT_PNG_CHUNK');
      if (bytes.toString('ascii', offset + 4, offset + 8) === 'acTL') throw new Error('ANIMATION_NOT_SUPPORTED');
      offset += length + 12;
    }
  }
  const style = preset(snapshot);
  const options = { failOn: 'warning', limitInputPixels: MAX_PIXELS, animated: true };
  const metadata = await sharp(bytes, options).metadata();
  if ((metadata.pages ?? 1) !== 1 || !metadata.width || !metadata.height || metadata.width * metadata.height > MAX_PIXELS) throw new Error('ANIMATION_OR_PIXEL_LIMIT');
  const inset = Math.round(style.image.size * style.image.padding);
  const inner = style.image.size - 2 * inset;
  const contained = await sharp(bytes, options).rotate().toColourspace('srgb')
    .resize(inner, inner, { fit: 'inside', withoutEnlargement: true })
    .png().toBuffer();
  const output = await sharp({ create: { width: style.image.size, height: style.image.size, channels: 3, background: style.image.background } })
    .composite([{ input: contained, gravity: 'centre' }])
    .webp({ quality: style.image.quality, effort: 4 }).toBuffer();
  return { bytes: output, mime, sourceSha256: sha256(bytes), outputSha256: sha256(output), presetSha256: sha256(JSON.stringify(style)), width: style.image.size, height: style.image.size, processor: 'sharp-0.35.4/v1' };
}
