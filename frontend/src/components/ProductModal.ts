import type { Product } from '../types/index.js';
import { formatCOP, toNumber } from '../utils/currency.js';
import { emit } from '../utils/events.js';
import { buildMediaUrl } from '../config/api.js';
import { syncBodyOverflow } from './Navbar.js';

let modalOverlay: HTMLElement | null = null;

// ── Función centralizada: Sincronizar scroll del body ──────
// (Fallback local en caso de que Navbar no esté inicializado)
const localSyncBodyOverflow = (): void => {
  const body = document.body;
  const drawerOpen = body.classList.contains('nav-drawer-open');
  const modalOpen = Boolean(document.querySelector('.product-modal-overlay.active'));
  const cartOpen = Boolean(document.querySelector('.carrito-sidebar.abierto'));
  const anyOverlayOpen = drawerOpen || modalOpen || cartOpen;

  body.style.overflow = anyOverlayOpen ? 'hidden' : '';
};

export function openProductModal(product: Product): void {
  if (!product || !product.id || !product.name) {
    console.error('Intentando abrir modal con datos de producto incompletos:', product);
    return;
  }

  if (!modalOverlay) {
    modalOverlay = document.createElement('div');
    modalOverlay.className = 'product-modal-overlay';
    document.body.appendChild(modalOverlay);

    modalOverlay.addEventListener('click', (e) => {
      if (e.target === modalOverlay) closeModal();
    });

    window.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') closeModal();
    });
  }

  const precio = formatCOP(toNumber(product.price));
  const inStock = (product as any).inStock ?? product.stock > 0;
  const imagenes = product.images?.map(buildMediaUrl).filter(Boolean) ?? [];
  const categoria = product.category?.name ?? 'Belle Désir';
  const maxQty = product.stock || 1;

  const imagesHtml = imagenes.map((img, i) => `
    <img src="${img}" alt="${escapeHtml(product.name)} - vista ${i + 1}" class="${i === 0 ? 'active' : ''}" data-index="${i}">
  `).join('');

  modalOverlay.innerHTML = /* html */ `
    <div class="product-modal-container">
      <button class="product-modal-close" aria-label="Cerrar">&times;</button>
      
      <div class="product-modal-content">
        <div class="product-modal-media">
          ${imagesHtml}
          ${imagenes.length > 1 ? `
            <button class="modal-nav-btn prev" aria-label="Anterior">‹</button>
            <button class="modal-nav-btn next" aria-label="Siguiente">›</button>
            <div class="modal-indicators">
              ${imagenes.map((_, i) => `<div class="modal-dot ${i === 0 ? 'active' : ''}" data-index="${i}"></div>`).join('')}
            </div>
          ` : ''}
        </div>
        
        <div class="product-modal-details">
          <span class="product-modal-category">${escapeHtml(categoria)}</span>
          <h2 class="product-modal-title">${escapeHtml(product.name)}</h2>
          <div class="product-modal-price">${precio}</div>
          
          <div class="product-modal-description">
            ${product.description ? escapeHtml(product.description).replace(/\n/g, '<br>') : 'Sin descripción disponible.'}
          </div>
          
          <div class="product-modal-actions">
            <button 
              class="btn-primario btn-add-modal" 
              data-id="${product.id}"
              data-nombre="${escapeHtml(product.name)}"
              data-precio="${toNumber(product.price)}"
              data-imagen="${imagenes[0] ?? ''}"
              data-max-qty="${maxQty}"
              ${!inStock ? 'disabled' : ''}
            >
              ${!inStock ? 'Agotado' : 'Agregar al Carrito'}
            </button>
          </div>
        </div>
      </div>
    </div>
  `;

  // Activate modal overlay
  modalOverlay.classList.add('active');
  
  // Sincronizar overflow del body
  try {
    syncBodyOverflow();
  } catch {
    // Fallback si Navbar no está disponible
    localSyncBodyOverflow();
  }

  // Listeners
  const closeBtn = modalOverlay.querySelector('.product-modal-close');
  closeBtn?.addEventListener('click', closeModal);

  const addBtn = modalOverlay.querySelector('.btn-add-modal');
  addBtn?.addEventListener('click', (e) => {
    const btn = e.currentTarget as HTMLButtonElement;

    emit('cart:add', {
      id: btn.dataset.id!,
      name: btn.dataset.nombre!,
      price: Number(btn.dataset.precio),
      image: btn.dataset.imagen!,
      quantity: 1,
      maxQuantity: Number(btn.dataset.maxQty) || 1
    });

    // Feedback visual usando clases CSS
    btn.classList.add('added');
    btn.disabled = true;

    setTimeout(() => {
      btn.classList.remove('added');
      btn.disabled = false;
    }, 1500);
  });

  // Carousel logic
  if (imagenes.length > 1) {
    let currentIndex = 0;
    const imgs = modalOverlay.querySelectorAll('.product-modal-media img');
    const dots = modalOverlay.querySelectorAll('.modal-dot');

    const updateCarousel = (newIndex: number) => {
      imgs[currentIndex].classList.remove('active');
      dots[currentIndex].classList.remove('active');

      currentIndex = (newIndex + imagenes.length) % imagenes.length;

      imgs[currentIndex].classList.add('active');
      dots[currentIndex].classList.add('active');
    };

    modalOverlay.querySelector('.modal-nav-btn.next')?.addEventListener('click', () => updateCarousel(currentIndex + 1));
    modalOverlay.querySelector('.modal-nav-btn.prev')?.addEventListener('click', () => updateCarousel(currentIndex - 1));

    dots.forEach((dot, i) => {
      dot.addEventListener('click', () => updateCarousel(i));
    });
  }
}

function closeModal(): void {
  if (!modalOverlay) return;
  modalOverlay.classList.remove('active');

  // Sincronizar overflow del body
  try {
    syncBodyOverflow();
  } catch {
    // Fallback si Navbar no está disponible
    localSyncBodyOverflow();
  }
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}
