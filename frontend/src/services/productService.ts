// ============================================================
// SERVICE — Producto: fetch desde el backend via proxy /api
// ============================================================

import type { PaginatedProducts, Product } from '../types/index.js';
import { buildApiUrl } from '../config/api';
import { lazyJson } from '../utils/lazyApi.js';

const SEMANTIC_CATEGORY_SLUGS = new Set(['hombre', 'mujer', 'lenceria', 'juguetes', 'pareja']);
let fullCatalogCache: Product[] | null = null;

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
  const normalizedSlug = (slug || '').toLowerCase();
  if (!normalizedSlug || normalizedSlug === 'todos') return getAllProducts(page, limit);

  if (SEMANTIC_CATEGORY_SLUGS.has(normalizedSlug)) {
    const products = await getFullCatalog();
    const filtered = products.filter((product) => productMatchesSemanticCategory(product, normalizedSlug));
    const start = (page - 1) * limit;
    const data = filtered.slice(start, start + limit);

    return {
      data,
      meta: {
        total: filtered.length,
        page,
        limit,
        totalPages: Math.max(1, Math.ceil(filtered.length / limit)),
      },
    };
  }

  const body = await lazyJson<PaginatedProducts>(buildApiUrl(`products?category=${encodeURIComponent(normalizedSlug)}&page=${page}&limit=${limit}`), {
    timeoutMs: 30000,
    retries: 3,
  });
  return body;
}

async function getFullCatalog(): Promise<Product[]> {
  if (fullCatalogCache) return fullCatalogCache;

  const firstPage = await getAllProducts(1, 500);
  fullCatalogCache = firstPage.data || [];
  return fullCatalogCache;
}

function productMatchesSemanticCategory(product: Product, category: string): boolean {
  const nameText = normalizeText([
    product.name,
    product.slug,
  ].filter(Boolean).join(' '));

  if (category === 'lenceria') {
    if (nameText.includes('body paint')) return false;

    return hasAny(nameText, [
      'lenceria', 'babydoll', 'arnes', 'panty', 'panties', 'bralette',
      'brasier', 'corset', 'liguero', 'portaligas', 'medias', 'tanga', 'hilo',
      'encaje', 'vinilo', 'vestido', 'conjunto sensual',
    ]) || /\bbody\b/.test(nameText);
  }

  if (category === 'pareja') return hasAny(nameText, [
    'pareja', 'parejas', 'juego erotico', 'juego atrevido', 'sexplay',
    'sensaciones sexplay', 'anillo vibrador', 'anillo para pene', 'dados',
    'esposas', 'antifaz', 'tapa ojos', 'cuerda', 'kit pareja',
  ]);

  if (category === 'hombre') return hasAny(nameText, [
    'hombre', 'masculin', 'pene', 'prostata', 'prostático', 'prostatico',
    'retardante', 'eyaculacion', 'eyaculación', 'ereccion', 'erección',
    'masturbador', 'torso', 'black horse', 'black power', 'funda',
  ]);

  if (category === 'mujer') return hasAny(nameText, [
    'mujer', 'femenin', 'clitoris', 'clítoris', 'clitorial', 'vaginal',
    'vagina', 'punto g', 'succionador', 'kegel', 'conejo', 'rabbit',
    'copa menstrual', 'menopausia',
  ]);

  if (category === 'juguetes') {
    if (hasAny(nameText, [
      'lubricante', 'limpiador', 'toy cleaner', 'body paint', 'brillo labial',
      'crema', 'aceite', 'perfume', 'sachet', 'gel ', 'spray',
    ])) {
      return false;
    }

    const isExplicitlyOtherCategory =
      productMatchesSemanticCategory(product, 'lenceria') ||
      productMatchesSemanticCategory(product, 'pareja') ||
      productMatchesSemanticCategory(product, 'hombre') ||
      productMatchesSemanticCategory(product, 'mujer');

    return !isExplicitlyOtherCategory && hasAny(nameText, [
      'juguete', 'vibrador', 'succionador', 'dildo', 'plug', 'bala vibradora',
      'estimulador', 'hitachi', 'masajeador', 'lovense', 'svakom', 'satisfyer',
      'camtoyz', 'ventosa',
    ]);
  }

  return false;
}

function hasAny(value: string, keywords: string[]): boolean {
  return keywords.some((keyword) => value.includes(normalizeText(keyword)));
}

function normalizeText(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();
}
