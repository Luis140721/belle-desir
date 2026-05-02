// ============================================================
// SERVICE — Producto: fetch desde el backend via proxy /api
// ============================================================

import type { PaginatedProducts } from '../types/index.js';
import { buildApiUrl } from '../config/api';
import { lazyJson } from '../utils/lazyApi.js';

/**
 * Obtiene todos los productos del catálogo.
 * El backend responde con { data: Product[], meta: {...} }
 */
export async function getAllProducts(page = 1, limit = 12): Promise<PaginatedProducts> {
  const body = await lazyJson<PaginatedProducts>(buildApiUrl(`products?page=${page}&limit=${limit}`), {
    timeoutMs: 30000,
    retries: 3,
  });
  return body;
}

/**
 * Obtiene productos filtrados por categoría.
 * Si no hay slug o es "todos", devuelve todos los productos.
 */
export async function getProductsByCategory(slug: string, page = 1, limit = 12): Promise<PaginatedProducts> {
  if (!slug || slug === 'todos') return getAllProducts(page, limit);
  const body = await lazyJson<PaginatedProducts>(buildApiUrl(`products?category=${encodeURIComponent(slug)}&page=${page}&limit=${limit}`), {
    timeoutMs: 30000,
    retries: 3,
  });
  return body;
}
