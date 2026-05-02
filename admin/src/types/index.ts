export enum Role {
  USER = 'USER',
  ADMIN = 'ADMIN',
}

export enum OrderStatus {
  PENDING = 'PENDING',
  PAID = 'PAID',
  PROCESSING = 'PROCESSING',
  SHIPPED = 'SHIPPED',
  DELIVERED = 'DELIVERED',
  CANCELLED = 'CANCELLED',
  REFUNDED = 'REFUNDED',
}

export interface User {
  id: string;
  email: string;
  name: string;
  phone?: string;
  role: Role;
  createdAt: string;
  updatedAt: string;
}

export interface Category {
  id: number;
  name: string;
  slug: string;
  description: string;
  imageUrl: string;
  _count?: {
    products: number;
  };
}

export interface Product {
  id: string;
  name: string;
  slug: string;
  description: string;
  price: number;
  comparePrice?: number;
  stock: number;
  sku?: string;
  images: string[];
  isFeatured: boolean;
  isActive: boolean;
  categoryId: number;
  category?: Partial<Category>;
  createdAt: string;
  updatedAt: string;
}

export interface OrderItem {
  id: string;
  orderId: string;
  productId: string;
  product: Product;
  quantity: number;
  price: number;
}

export interface Order {
  id: string;
  userId: string;
  user?: User;
  status: OrderStatus;
  subtotal: number;
  shipping: number;
  total: number;
  shippingAddress: any; // Json in prisma
  stripePaymentIntentId?: string;
  stripeSessionId?: string;
  items?: OrderItem[];
  createdAt: string;
  updatedAt: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

export interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface AdminStats {
  totalSales: number;
  statusCounts: { status: OrderStatus; count: number }[];
  lowStockProducts: { id: string; name: string; stock: number }[];
  topSellingProducts: { productId: string; name: string; quantitySold: number }[];
  revenueByDay: { date: string; revenue: number }[];
}

export type SiteMediaType = 'IMAGE' | 'VIDEO';

export type SiteMediaPlacement =
  | 'HERO_BACKGROUND'
  | 'CATALOG_SUPPORT'
  | 'ABOUT_SUPPORT'
  | 'CONTACT_SUPPORT'
  | 'CUBE_FACE';

export interface SiteMedia {
  id: string;
  placement: SiteMediaPlacement;
  type: SiteMediaType;
  title: string;
  subtitle?: string | null;
  url: string;
  posterUrl?: string | null;
  altText?: string | null;
  isActive: boolean;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}
