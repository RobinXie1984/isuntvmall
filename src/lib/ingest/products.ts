import Papa from "papaparse";
import { z } from "zod";

export const productInputSchema = z.object({
  sku: z.string().trim().min(1).max(80),
  slug: z.string().trim().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
  title: z.string().trim().min(1).max(180),
  description: z.string().trim().max(5000).default(""),
  priceAmount: z.number().int().nonnegative().max(100_000_000),
  currency: z.string().trim().length(3).transform((value) => value.toLowerCase()),
  stockQty: z.number().int().nonnegative().max(1_000_000),
  category: z.string().trim().min(1).max(100).default("General"),
  imageUrl: z.string().trim().max(2048).optional().default(""),
  status: z.enum(["draft", "published", "archived"]).default("draft"),
  featured: z.boolean().default(false),
});

export type ProductInput = z.infer<typeof productInputSchema>;

const aliases: Record<string, string[]> = {
  sku: ["sku", "product_id", "商品编号", "货号"],
  slug: ["slug", "网址别名"],
  title: ["title", "name", "product_name", "商品名", "商品名称"],
  description: ["description", "desc", "简介", "描述"],
  price: ["price", "价格", "售价"],
  priceAmount: ["price_amount", "price_cents", "金额分"],
  currency: ["currency", "币种"],
  stockQty: ["stock_qty", "stock", "inventory", "库存"],
  category: ["category", "分类"],
  imageUrl: ["image_url", "image", "图片url", "图片"],
  status: ["status", "状态"],
  featured: ["featured", "精选"],
};

function normalizeHeader(value: string) {
  return value.replace(/^\uFEFF/, "").trim().toLowerCase().replace(/\s+/g, "_");
}

function getCell(row: Record<string, string>, field: keyof typeof aliases) {
  for (const alias of aliases[field]) {
    const value = row[normalizeHeader(alias)];
    if (value !== undefined && value.trim() !== "") return value.trim();
  }
  return "";
}

export function slugify(value: string) {
  const ascii = value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return ascii || `product-${crypto.randomUUID().slice(0, 8)}`;
}

function dollarsToMinorUnits(value: string) {
  const normalized = value.replace(/[$£€¥HKDUSD,\s]/gi, "");
  if (!/^\d+(?:\.\d{1,2})?$/.test(normalized)) return Number.NaN;
  const [whole, decimals = ""] = normalized.split(".");
  return Number(whole) * 100 + Number(decimals.padEnd(2, "0"));
}

function parseBoolean(value: string) {
  return ["1", "true", "yes", "y", "是", "精选"].includes(value.trim().toLowerCase());
}

export interface CsvIssue {
  row: number;
  message: string;
}

export function parseProductCsv(csv: string) {
  const parsed = Papa.parse<Record<string, string>>(csv, {
    header: true,
    skipEmptyLines: "greedy",
    transformHeader: normalizeHeader,
  });

  const products: ProductInput[] = [];
  const issues: CsvIssue[] = parsed.errors.map((error) => ({ row: (error.row ?? 0) + 2, message: error.message }));

  parsed.data.forEach((row, index) => {
    const title = getCell(row, "title");
    const sku = getCell(row, "sku");
    const explicitMinor = getCell(row, "priceAmount");
    const candidate = {
      sku,
      slug: getCell(row, "slug") || slugify(`${title}-${sku}`),
      title,
      description: getCell(row, "description"),
      priceAmount: explicitMinor ? Number(explicitMinor) : dollarsToMinorUnits(getCell(row, "price")),
      currency: getCell(row, "currency") || "hkd",
      stockQty: Number(getCell(row, "stockQty") || "0"),
      category: getCell(row, "category") || "General",
      imageUrl: getCell(row, "imageUrl"),
      status: getCell(row, "status") || "draft",
      featured: parseBoolean(getCell(row, "featured")),
    };

    const result = productInputSchema.safeParse(candidate);
    if (result.success) products.push(result.data);
    else {
      issues.push({
        row: index + 2,
        message: result.error.issues.map((issue) => `${issue.path.join(".")}: ${issue.message}`).join("; "),
      });
    }
  });

  const seenSku=new Set<string>(), seenSlug=new Set<string>();
  products.forEach((product,index)=>{
    if(seenSku.has(product.sku) || seenSlug.has(product.slug)) issues.push({row:index+2,message:"Duplicate SKU or slug within this file."});
    seenSku.add(product.sku);seenSlug.add(product.slug);
  });
  return { products, issues };
}
