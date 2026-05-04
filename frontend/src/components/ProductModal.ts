import type { Product } from '../types/index.js';
import { formatCOP, toNumber } from '../utils/currency.js';
import { emit } from '../utils/events.js';

let modalOverlay: HTMLElement | null = null;

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
  const imagenes = product.images && product.images.length > 0 ? product.images : [];
  const categoria = product.category?.name ?? 'Belle Désir';

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
              ${!inStock ? 'disabled' : ''}
            >
              ${!inStock ? 'Agotado' : 'Agregar al Carrito'}
            </button>
          </div>
        </div>
      </div>
    </div>
  `;

  // Prevent background scroll
  document.body.style.overflow = 'hidden';
  
  // Activate modal
  requestAnimationFrame(() => {
    modalOverlay?.classList.add('active');
  });

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
      quantity: 1
    });
    
    // Feedback
    const oldText = btn.textContent;
    btn.textContent = '¡Agregado!';
    btn.style.background = 'linear-gradient(135deg, #2a7a4f, #1e6640)';
    setTimeout(() => {
      btn.textContent = oldText;
      btn.style.background = '';
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
  document.body.style.overflow = '';
  // Optional: remove from DOM after transition
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}
