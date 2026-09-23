export type ProductStatus = "draft" | "published" | "archived";
export type LivePlatform = "youtube" | "facebook" | "tiktok" | "instagram" | "external";
export type LiveStatus = "scheduled" | "live" | "ended" | "preview";
export type OrderStatus = "pending" | "paid" | "failed" | "cancelled" | "refunded";

export interface ProductImage {
  id: string;
  sourceUrl: string;
  storagePath: string | null;
  altText: string;
  position: number;
}

export interface Product {
  isDemo?: boolean;
  id: string;
  sku: string;
  slug: string;
  title: string;
  description: string;
  priceAmount: number;
  currency: string;
  stockQty: number;
  category: string;
  status: ProductStatus;
  featured: boolean;
  createdAt: string;
  images: ProductImage[];
}

export interface Kol {
  id: string; slug: string; displayName: string; bio: string; status: "active" | "inactive";
}

export interface CartSource {
  liveSessionId: string; kolId: string;
}

export interface LiveSession {
  kol: Kol | null;
  id: string;
  slug: string;
  title: string;
  description: string;
  hostName: string;
  platform: LivePlatform;
  externalUrl: string;
  embedId: string | null;
  status: LiveStatus;
  startsAt: string;
  endsAt: string | null;
  posterUrl: string | null;
  products: Product[];
}

export interface OrderItem {
  liveSessionId: string | null; kolId: string | null;
  id: string;
  sku: string;
  title: string;
  unitAmount: number;
  quantity: number;
  lineTotal: number;
}

export interface Order {
  id: string;
  stripeCheckoutSessionId: string | null;
  status: OrderStatus;
  currency: string;
  subtotalAmount: number;
  shippingAmount: number | null;
  taxAmount: number | null;
  totalAmount: number | null;
  customerEmail: string | null;
  customerName: string | null;
  createdAt: string;
  paidAt: string | null;
  items: OrderItem[];
}

export interface CartLine {
  source?: CartSource;
  productId: string;
  quantity: number;
}
