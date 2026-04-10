// ============================================================
// TYPES — Interfaces que espejean el schema Prisma del backend
// ============================================================

export interface Category {
  id: number;
  name: string;
  slug: string;
  description: string;
  imageUrl: string;
}

export interface Product {
  id: string;
  name: string;
  slug: string;
  description: string;
  price: number | string; // Prisma Decimal llega como string en JSON
  comparePrice?: number | string | null;
  stock: number;
  sku?: string | null;
  images: string[];
  isFeatured: boolean;
  isActive: boolean;
  categoryId: number;
  category: Pick<Category, 'name' | 'slug'>;
}

export interface CartItem {
  id: string;
  name: string;
  price: number;
  image: string;
  quantity: number;
}

export interface GuestInfo {
  name: string;
  email: string;
  phone: string;
}

export interface ShippingAddress {
  name: string;
  address: string;
  city: string;
  country: string;
  zip: string;
  phone?: string;
  notes?: string;
}

// Payload que enviamos al backend /api/orders
export interface CheckoutPayload {
  items?: Array<{
    productId: string;
    quantity: number;
  }>;
  shippingAddress: ShippingAddress;
}

export interface CartResponse {
  items: Array<{
    id: string;
    productId: string;
    quantity: number;
    product: Product;
  }>;
  total: number;
}

// Respuesta del backend al crear una orden
export interface CheckoutResponse {
  orderId: string;
  checkoutUrl: string | null;
  paymentLink: string | null;
}

export interface OrderResponse {
  orderId: string;
  checkoutUrl: string | null;
  paymentLink: string | null;
}

export interface GuestOrderPayload {
  guestInfo: GuestInfo;
  shippingAddress: ShippingAddress;
  items: CartItem[];
}

// Respuesta paginada de /api/products
export interface PaginatedProducts {
  data: Product[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}
