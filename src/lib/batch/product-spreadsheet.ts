import Papa from 'papaparse';

// Inspect ZIP metadata before the browser parser expands an Excel workbook.
export function validateWorkbookArchive(buffer: ArrayBuffer) {
  if (buffer.byteLength < 22) throw new Error("INVALID_SPREADSHEET");
  const view = new DataView(buffer);
  let end = buffer.byteLength - 22;
  const minimum = Math.max(0, end - 65535);
  while (end >= minimum && view.getUint32(end, true) !== 0x06054b50) end--;
  if (end < minimum) throw new Error('INVALID_SPREADSHEET');
  const count = view.getUint16(end + 10, true);
  let offset = view.getUint32(end + 16, true), expanded = 0;
  if (!count || count > 1000 || view.getUint16(end + 4, true) !== 0 || view.getUint16(end + 6, true) !== 0) throw new Error('INVALID_SPREADSHEET');
  for (let i = 0; i < count; i++) {
    if (offset + 46 > end || view.getUint32(offset, true) !== 0x02014b50 || (view.getUint16(offset + 8, true) & 1)) throw new Error('INVALID_SPREADSHEET');
    expanded += view.getUint32(offset + 24, true);
    if (expanded > 32 * 1024 * 1024) throw new Error('INVALID_SPREADSHEET');
    offset += 46 + view.getUint16(offset + 28, true) + view.getUint16(offset + 30, true) + view.getUint16(offset + 32, true);
  }
  if (offset !== end) throw new Error('INVALID_SPREADSHEET');
}

/** Stable per-operator receipt makes reselect/reload retries reuse the same private import. */
export async function productImportRequestId(actor: string, input: unknown) {
  const hash = new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(JSON.stringify([actor,input]))));
  hash[6] = (hash[6] & 15) | 64; hash[8] = (hash[8] & 63) | 128;
  const hex = Array.from(hash.slice(0,16), value=>value.toString(16).padStart(2,'0')).join('');
  return `${hex.slice(0,8)}-${hex.slice(8,12)}-${hex.slice(12,16)}-${hex.slice(16,20)}-${hex.slice(20)}`;
}

/** Convert the first Excel worksheet to the same validated CSV path as Shopify exports. */
export function spreadsheetRowsToCsv(rows: unknown[][]) {
  if (!rows.length || rows.length > 10001 || rows.some(row => row.length > 250)) throw new Error('INVALID_SPREADSHEET');
  const values = rows.map(row => row.map(value => {
    if (value === null || value === undefined) return '';
    if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') return String(value);
    throw new Error('INVALID_SPREADSHEET');
  }));
  const headers = values[0].map(value => value.trim());
  if (new Set(headers).size !== headers.length || headers.some(value => !value)) throw new Error('INVALID_SPREADSHEET');
  values[0] = headers;
  const csv = Papa.unparse(values);
  if (new TextEncoder().encode(csv).length > 2 * 1024 * 1024) throw new Error('INVALID_SPREADSHEET');
  return csv;
}

export async function readProductSpreadsheet(file: File) {
  if (!file.size || file.size > 2 * 1024 * 1024) throw new Error('INVALID_SPREADSHEET');
  if (/\.csv$/i.test(file.name)) return file.text();
  if (!/\.xlsx$/i.test(file.name)) throw new Error('INVALID_SPREADSHEET');
  const bytes = await file.arrayBuffer();
  validateWorkbookArchive(bytes);
  const { readSheet } = await import('read-excel-file/browser');
  return spreadsheetRowsToCsv(await readSheet(bytes));
}

export function canManageMigrationTools(role: string) {
  return role === 'super_admin' || role === 'business_super_admin';
}
