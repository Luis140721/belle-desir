// ============================================================
// SERVICE — Producto: fetch desde el backend via proxy /api
// ============================================================

import type { Product, PaginatedProducts } from '../types/index.js';
import { buildApiUrl } from '../config/api';

/**
 * Obtiene todos los productos del catálogo.
 * El backend responde con { data: Product[], meta: {...} }
 */
export async function getAllProducts(limit = 50): Promise<Product[]> {
  const res = await fetch(buildApiUrl(`products?limit=${limit}`));
  if (!res.ok) throw new Error(`Error ${res.status} al cargar productos`);
  const body: PaginatedProducts = await res.json();
  return body.data;
}

/**
 * Obtiene productos filtrados por categoría.
 * Si no hay slug o es "todos", devuelve todos los productos.
 */
export async function getProductsByCategory(slug: string): Promise<Product[]> {
  if (!slug || slug === 'todos') return getAllProducts();
  const res = await fetch(buildApiUrl(`products?category=${encodeURIComponent(slug)}&limit=50`));
  if (!res.ok) throw new Error(`Error ${res.status} al filtrar productos`);
  const body: PaginatedProducts = await res.json();
  return body.data;
}
