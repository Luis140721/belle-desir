import type { CartItem } from '../types/index.js';
import { on, emit } from '../utils/events.js';
import { formatCOP } from '../utils/currency.js';
import { isLoggedIn } from '../services/authService.js';
import { syncCart } from '../services/checkoutService.js';
import { buildMediaUrl } from '../config/api.js';

let items: CartItem[] = [];
const CART_STORAGE_KEY = 'belle-desir-cart';

export function initCartSidebar(): void {
  const sidebar = document.getElementById('carrito-sidebar') as HTMLElement | null;
  const overlay = document.getElementById('carrito-overlay') as HTMLElement | null;
  const itemsEl = document.getElementById('carrito-items') as HTMLElement | null;
  const totalEl = document.getElementById('carrito-total-precio') as HTMLElement | null;
  const btnCerrar = document.getElementById('btn-cerrar-carrito') as HTMLButtonElement | null;
  const btnPagar = document.getElementById('btn-checkout') as HTMLButtonElement | null;
  const contEl = document.getElementById('contador-carrito') as HTMLElement | null;
  const floatingBtn = document.getElementById('floating-cart-btn');

  if (!sidebar) return;

  items = loadCartFromStorage();
  actualizarContador(contEl);
  renderItems(itemsEl, totalEl);

  function abrir(): void {
    sidebar!.classList.add('abierto');
    sidebar!.setAttribute('aria-hidden', 'false');
    overlay?.classList.remove('oculto');
    floatingBtn?.classList.add('oculto-sidebar');
    renderItems(itemsEl, totalEl);
  }

  function cerrar(): void {
    sidebar!.classList.remove('abierto');
    sidebar!.setAttribute('aria-hidden', 'true');
    overlay?.classList.add('oculto');
    floatingBtn?.classList.remove('oculto-sidebar');
  }

  on('cart:open', abrir);
  on('cart:close', cerrar);

  document.querySelector('.navbar-carrito')?.addEventListener('click', () => emit('cart:open'));
  floatingBtn?.addEventListener('click', () => emit('cart:open'));

  btnCerrar?.addEventListener('click', cerrar);
  overlay?.addEventListener('click', cerrar);
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') cerrar(); });

  on('cart:add', (item) => {
    const existing = items.find((candidate) => candidate.id === item.id);
    if (existing) {
      existing.quantity += item.quantity;
    } else {
      items.push({ ...item });
    }

    actualizarContador(contEl);
    renderItems(itemsEl, totalEl);
    saveCartToStorage();
  });

  itemsEl?.addEventListener('click', (e) => {
    const target = e.target as HTMLElement;

    const quantityButton = target.closest<HTMLButtonElement>('[data-accion]');
    if (quantityButton) {
      const id = quantityButton.dataset.id!;
      const item = items.find((candidate) => candidate.id === id);
      if (!item) return;

      quantityButton.dataset.accion === 'sumar' ? item.quantity++ : item.quantity--;
      if (item.quantity <= 0) items = items.filter((candidate) => candidate.id !== id);

      actualizarContador(contEl);
      renderItems(itemsEl, totalEl);
      saveCartToStorage();
      return;
    }

    const deleteButton = target.closest<HTMLButtonElement>('[data-eliminar]');
    if (deleteButton) {
      items = items.filter((candidate) => candidate.id !== deleteButton.dataset.eliminar);
      actualizarContador(contEl);
      renderItems(itemsEl, totalEl);
      saveCartToStorage();
    }
  });

  btnPagar?.addEventListener('click', async () => {
    if (!items.length) {
      alert('Tu carrito está vacío');
      return;
    }

    if (!isLoggedIn()) {
      window.location.href = '/login?redirect=/checkout';
      return;
    }

    // Sincronizar con el backend antes de ir al checkout
    btnPagar.disabled = true;
    btnPagar.textContent = 'Sincronizando...';
    
    try {
      await syncCart(items);
      window.location.href = '/checkout';
    } catch (err) {
      console.error('Error al sincronizar carrito:', err);
      alert('Hubo un problema al preparar tu pedido. Intenta de nuevo.');
      btnPagar.disabled = false;
      btnPagar.textContent = 'Proceder al pago';
    }
  });
}

function saveCartToStorage(): void {
  localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items));
}

function loadCartFromStorage(): CartItem[] {
  try {
    const raw = localStorage.getItem(CART_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as CartItem[];
    if (!Array.isArray(parsed)) return [];

    return parsed.filter((item) => {
      const hasId = item && (typeof item.id === 'string' || typeof item.id === 'number');
      const hasName = item && typeof item.name === 'string';
      const hasPrice = item && !isNaN(parseFloat(String(item.price)));
      const hasQty = item && !isNaN(parseInt(String(item.quantity)));
      return hasId && hasName && hasPrice && hasQty;
    });
  } catch {
    return [];
  }
}

function actualizarContador(el: HTMLElement | null): void {
  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);

  if (el) {
    el.textContent = totalItems === 0 ? '' : String(totalItems);
  }

  const fabBadge = document.getElementById('floating-contador-carrito');
  if (fabBadge) {
    if (totalItems === 0) {
      fabBadge.textContent = '';
      fabBadge.style.display = 'none';
    } else {
      fabBadge.textContent = String(totalItems);
      fabBadge.style.display = 'flex';
    }
  }
}

function renderItems(contenedor: HTMLElement | null, totalEl: HTMLElement | null): void {
  if (!contenedor) return;

  const total = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);
  if (totalEl) totalEl.textContent = formatCOP(total);

  const btnPagar = document.getElementById('btn-checkout') as HTMLButtonElement | null;
  const policyEl = document.getElementById('carrito-politicas');
  const minOrder = 20000;
  const isUnderMin = total < minOrder;

  if (totalItems === 0) {
    contenedor.innerHTML = /* html */ `
      <div class="carrito-vacio">
        <p>Tu carrito está vacío</p>
        <p style="font-size: 0.8rem; margin-top: 1rem; color: var(--texto-gris);">
          ¡Explora nuestro catálogo y descubre algo especial!
        </p>
      </div>
    `;
    if (btnPagar) {
      btnPagar.disabled = true;
      btnPagar.style.opacity = '0.5';
      btnPagar.textContent = 'Ir a pagar';
    }
    if (policyEl) policyEl.innerHTML = '';
    return;
  }

  // Renderizar items
  contenedor.innerHTML = items.map((item) => /* html */ `
    <div class="carrito-item">
      <div class="carrito-item-imagen">
        ${item.image ? `<img src="${buildMediaUrl(item.image)}" alt="${item.name}" loading="lazy">` : ''}
      </div>
      <div class="carrito-item-info">
        <p class="carrito-item-nombre">${item.name}</p>
        <p class="carrito-item-precio">${formatCOP(item.price)}</p>
      </div>
      <div class="carrito-cantidad">
        <button data-id="${item.id}" data-accion="restar" aria-label="Quitar uno">-</button>
        <span>${item.quantity}</span>
        <button data-id="${item.id}" data-accion="sumar" aria-label="Agregar uno">+</button>
      </div>
      <button class="btn-eliminar-item" data-eliminar="${item.id}" aria-label="Eliminar ${item.name}">×</button>
    </div>
  `).join('');

  // Actualizar UI del botón de pago y mensajes de política
  if (btnPagar) {
    if (isUnderMin) {
      btnPagar.disabled = true;
      btnPagar.style.opacity = '0.5';
      btnPagar.textContent = `Mínimo ${formatCOP(minOrder)} para envío`;
    } else {
      btnPagar.disabled = false;
      btnPagar.style.opacity = '1';
      btnPagar.textContent = 'Proceder al pago';
    }
  }

  if (policyEl) {
    policyEl.innerHTML = `
      <ul class="carrito-politicas-lista">
        <li class="politica-item">No cobramos comisión por el pago.</li>
        <li class="politica-item ${isUnderMin ? 'politica-alerta' : ''}">
          Para envío, compras superiores a ${formatCOP(minOrder)}.
        </li>
      </ul>
    `;
  }
}

