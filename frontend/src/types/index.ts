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

// Payload que enviamos al backend /api/orders
export interface CheckoutPayload {
  shippingAddress: {
    name: string;
    email: string;
    phone: string;
    address: string;
    city: string;
  };
}

// Respuesta del backend al crear una orden
export interface CheckoutResponse {
  orderId: string;
  amountInCents: number;
  currency: string;
  publicKey: string;
  redirectUrl: string;
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
