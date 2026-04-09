// ============================================================
// COMPONENT — ProductCard
// Función pura: recibe un Product y retorna HTML string
// ============================================================

import type { Product } from '../types/index.js';
import { formatCOP, toNumber } from '../utils/currency.js';

/**
 * Retorna el HTML de una tarjeta de producto.
 * El botón "Agregar" emite el evento 'cart:add' vía delegación
 * en el componente Catalog.
 */
export function ProductCard(product: Product): string {
  const precio = formatCOP(toNumber(product.price));
  const imagen = product.images?.[0];
  const categoria = product.category?.name ?? '';

  const imgHtml = imagen
    ? `<img src="${imagen}" alt="${escapeHtml(product.name)}" loading="lazy">`
    : '✨';

  return /* html */ `
    <article class="producto-card" data-product-id="${product.id}">
      <div class="producto-card-imagen">
        ${imgHtml}
      </div>
      <div class="producto-card-info">
        ${categoria ? `<span class="seccion-eyebrow" style="font-size:0.65rem">${escapeHtml(categoria)}</span>` : ''}
        <h3 class="producto-card-nombre">${escapeHtml(product.name)}</h3>
        <p class="producto-card-descripcion">${escapeHtml(product.description)}</p>
        <div class="producto-card-footer">
          <span class="producto-card-precio">${precio}</span>
          <button
            class="btn-agregar-carrito"
            data-id="${product.id}"
            data-nombre="${escapeHtml(product.name)}"
            data-precio="${toNumber(product.price)}"
            data-imagen="${imagen ?? ''}"
            aria-label="Agregar ${escapeHtml(product.name)} al carrito"
          >
            + Agregar
          </button>
        </div>
      </div>
    </article>
  `;
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}
