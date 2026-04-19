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
  const inStock = (product as any).inStock ?? product.stock > 0;
  const stockBajo = product.stock > 0 && product.stock <= 5;

  const imagenes = product.images && product.images.length > 0 ? product.images : [];
  
  let imgHtml = '✨';
  if (imagenes.length > 0) {
    if (imagenes.length === 1) {
      imgHtml = `<img src="${imagenes[0]}" alt="${escapeHtml(product.name)}" loading="lazy">`;
    } else {
      // CSS-based scrollable carousel
      const imagesHtml = imagenes.map((img, i) => 
        `<img src="${img}" alt="${escapeHtml(product.name)} - vista ${i + 1}" loading="lazy">`
      ).join('');
      
      imgHtml = `
        <div class="card-carousel">
          <div class="card-carousel-track">
            ${imagesHtml}
          </div>
          <div class="card-carousel-indicators">
            ${imagenes.map((_, i) => `<div class="indicator ${i === 0 ? 'active' : ''}"></div>`).join('')}
          </div>
          <button class="carousel-btn prev-btn" aria-label="Anterior">‹</button>
          <button class="carousel-btn next-btn" aria-label="Siguiente">›</button>
        </div>
      `;
    }
  }

  return /* html */ `
    <article class="producto-card" data-product-id="${product.id}">
      <div class="producto-card-imagen">
        ${imgHtml}
        ${!inStock ? '<div class="out-of-stock-overlay">Agotado</div>' : ''}
      </div>
      <div class="producto-card-info">
        ${categoria ? `<span class="seccion-eyebrow" style="font-size:0.65rem">${escapeHtml(categoria)}</span>` : ''}
        <h3 class="producto-card-nombre">${escapeHtml(product.name)}</h3>
        <p class="producto-card-descripcion">${escapeHtml(product.description)}</p>
        
        <!-- Stock indicators -->
        <div class="stock-indicators">
          ${!inStock ? '<span class="stock-badge out-of-stock">Agotado</span>' : ''}
          ${stockBajo ? `<span class="stock-badge low-stock">Últimas ${product.stock} unidades</span>` : ''}
        </div>
        
        <div class="producto-card-footer">
          <span class="producto-card-precio">${precio}</span>
          <button
            class="btn-agregar-carrito"
            data-id="${product.id}"
            data-nombre="${escapeHtml(product.name)}"
            data-precio="${toNumber(product.price)}"
            data-imagen="${imagen ?? ''}"
            aria-label="Agregar ${escapeHtml(product.name)} al carrito"
            ${!inStock ? 'disabled' : ''}
          >
            ${!inStock ? 'Agotado' : '+ Agregar'}
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
