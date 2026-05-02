// ============================================================
// SERVICE — Producto: fetch desde el backend via proxy /api
// ============================================================

import type { Product, PaginatedProducts } from '../types/index.js';
import { buildApiUrl } from '../config/api';
import { lazyJson } from '../utils/lazyApi.js';

/**
 * Obtiene todos los productos del catálogo.
 * El backend responde con { data: Product[], meta: {...} }
 */
export async function getAllProducts(limit = 50): Promise<Product[]> {
  const body = await lazyJson<PaginatedProducts>(buildApiUrl(`products?limit=${limit}`), {
    timeoutMs: 30000,
    retries: 3,
  });
  return body.data;
}

/**
 * Obtiene productos filtrados por categoría.
 * Si no hay slug o es "todos", devuelve todos los productos.
 */
export async function getProductsByCategory(slug: string): Promise<Product[]> {
  if (!slug || slug === 'todos') return getAllProducts();
  const body = await lazyJson<PaginatedProducts>(buildApiUrl(`products?category=${encodeURIComponent(slug)}&limit=50`), {
    timeoutMs: 30000,
    retries: 3,
  });
  return body.data;
}
