import { toNumber } from './currency.js';

export interface OrderDisplayProduct {
  id: string;
  name: string;
  slug: string;
  images: string[];
}

export interface OrderDisplayItem {
  id: string;
  quantity: number;
  unitPrice: number;
  product: OrderDisplayProduct;
}

export interface OrderShippingAddress {
  name: string;
  address: string;
  city: string;
  country: string;
  zip: string;
  phone?: string;
}

export interface OrderDisplay {
  id: string;
  status: string;
  subtotal: number;
  shipping: number;
  total: number;
  createdAt: string;
  shippingAddress: OrderShippingAddress;
  items: OrderDisplayItem[];
}

type RawOrderItem = {
  id: string;
  quantity: number;
  unitPrice: number | string;
  product?: Partial<OrderDisplayProduct> | null;
  productSnapshot?: unknown;
  productId?: string;
};

type RawOrder = {
  id: string;
  status: string;
  subtotal: number | string;
  shipping: number | string;
  total: number | string;
  createdAt: string;
  shippingAddress?: unknown;
  items?: RawOrderItem[];
};

function asRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
  return value as Record<string, unknown>;
}

function slugify(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)+/g, '');
}

function resolveProduct(item: RawOrderItem): OrderDisplayProduct {
  const snapshot = asRecord(item.productSnapshot);
  const fromProduct = item.product ?? null;
  const name = String(fromProduct?.name ?? snapshot?.name ?? 'Producto');
  const id = String(fromProduct?.id ?? item.productId ?? item.id);
  const slug = String(fromProduct?.slug ?? snapshot?.slug ?? (slugify(name) || id));
  const images = Array.isArray(fromProduct?.images)
    ? fromProduct!.images!.map(String)
    : Array.isArray(snapshot?.images)
      ? (snapshot.images as unknown[]).map(String)
      : snapshot?.imageUrl
        ? [String(snapshot.imageUrl)]
        : [];

  return { id, name, slug, images };
}

function resolveShippingAddress(value: unknown): OrderShippingAddress {
  const raw = asRecord(value);
  return {
    name: String(raw?.name ?? '—'),
    address: String(raw?.address ?? '—'),
    city: String(raw?.city ?? '—'),
    country: String(raw?.country ?? 'Colombia'),
    zip: String(raw?.zip ?? '—'),
    phone: raw?.phone ? String(raw.phone) : undefined,
  };
}

export function normalizeOrder(raw: unknown): OrderDisplay | null {
  const order = asRecord(raw) as RawOrder | null;
  if (!order?.id) return null;

  const items = Array.isArray(order.items) ? order.items : [];

  return {
    id: order.id,
    status: String(order.status ?? 'PENDING'),
    subtotal: toNumber(order.subtotal),
    shipping: toNumber(order.shipping),
    total: toNumber(order.total),
    createdAt: String(order.createdAt ?? new Date().toISOString()),
    shippingAddress: resolveShippingAddress(order.shippingAddress),
    items: items.map((item) => ({
      id: String(item.id),
      quantity: Number(item.quantity) || 0,
      unitPrice: toNumber(item.unitPrice),
      product: resolveProduct(item),
    })),
  };
}

export function normalizeOrders(raw: unknown): OrderDisplay[] {
  if (!Array.isArray(raw)) return [];
  return raw.map(normalizeOrder).filter((order): order is OrderDisplay => order !== null);
}
