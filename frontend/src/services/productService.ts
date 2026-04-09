// ============================================================
// SERVICE — Producto: fetch desde el backend via proxy /api
// ============================================================

import type { Product, PaginatedProducts } from '../types/index.js';

/**
 * Trae todos los productos activos (paginados, page=1, limit=50).
 * El backend responde con { data: Product[], meta: {...} }
 */
export async function getAllProducts(limit = 50): Promise<Product[]> {
  const res = await fetch(`/api/products?limit=${limit}`);
  if (!res.ok) throw new Error(`Error ${res.status} al cargar productos`);
  const body: PaginatedProducts = await res.json();
  return body.data;
}

/**
 * Filtra productos por categoría (slug).
 * Pasa el parámetro "category" que espera el backend.
 */
export async function getProductsByCategory(slug: string): Promise<Product[]> {
  if (!slug || slug === 'todos') return getAllProducts();
  const res = await fetch(`/api/products?category=${encodeURIComponent(slug)}&limit=50`);
  if (!res.ok) throw new Error(`Error ${res.status} al filtrar productos`);
  const body: PaginatedProducts = await res.json();
  return body.data;
}
