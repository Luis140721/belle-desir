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
  const imagenPrincipal = product.images?.[0];
  const imagenHover = product.images?.[1] || imagenPrincipal;
  const inStock = (product as any).inStock ?? product.stock > 0;
  
  const imgHtml = imagenPrincipal 
    ? `<img src="${imagenPrincipal}" alt="${escapeHtml(product.name)}" class="main-img" loading="lazy">
       <img src="${imagenHover}" alt="${escapeHtml(product.name)} - vista alternativa" class="hover-img" loading="lazy">`
    : '<div class="no-image">✨</div>';

  return /* html */ `
    <article class="producto-card" data-product-slug="${product.slug}" data-product-id="${product.id}">
      <div class="producto-card-imagen">
        ${imgHtml}
        ${!inStock ? '<div class="out-of-stock-overlay">Agotado</div>' : ''}
      </div>
      
      <div class="producto-card-info">
        <h3 class="producto-card-nombre">${escapeHtml(product.name)}</h3>
        <p class="producto-card-hint">Toca para ver detalles</p>
        
        <div class="producto-card-footer">
          <span class="producto-card-precio">${precio}</span>
          <button
            class="btn-agregar-carrito"
            data-id="${product.id}"
            data-nombre="${escapeHtml(product.name)}"
            data-precio="${toNumber(product.price)}"
            data-imagen="${imagenPrincipal ?? ''}"
            aria-label="Agregar ${escapeHtml(product.name)} al carrito"
            ${!inStock ? 'disabled' : ''}
          >
            ${!inStock ? 'Agotado' : '+'}
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
