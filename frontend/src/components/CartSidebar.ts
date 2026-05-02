import type { CartItem } from '../types/index.js';
import { on, emit } from '../utils/events.js';
import { formatCOP } from '../utils/currency.js';
import { isLoggedIn } from '../services/authService.js';

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

  if (!sidebar) return;

  items = loadCartFromStorage();
  actualizarContador(contEl);
  renderItems(itemsEl, totalEl);

  function abrir(): void {
    sidebar!.classList.add('abierto');
    sidebar!.setAttribute('aria-hidden', 'false');
    overlay?.classList.remove('oculto');
    renderItems(itemsEl, totalEl);
  }

  function cerrar(): void {
    sidebar!.classList.remove('abierto');
    sidebar!.setAttribute('aria-hidden', 'true');
    overlay?.classList.add('oculto');
  }

  on('cart:open', abrir);
  on('cart:close', cerrar);

  document.querySelector('.navbar-carrito')?.addEventListener('click', () => emit('cart:open'));
  document.getElementById('floating-cart-btn')?.addEventListener('click', () => emit('cart:open'));

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

  btnPagar?.addEventListener('click', () => {
    if (!items.length) {
      alert('Tu carrito esta vacio');
      return;
    }

    window.location.href = isLoggedIn() ? '/checkout' : '/login?redirect=/checkout';
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

    return parsed.filter((item) =>
      Boolean(item?.id) &&
      Boolean(item?.name) &&
      Number.isFinite(Number(item?.price)) &&
      Number.isFinite(Number(item?.quantity))
    );
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

  if (!items.length) {
    contenedor.innerHTML = /* html */ `
      <div class="carrito-vacio">
        <p>Carrito</p>
        <p>Tu carrito esta vacio</p>
      </div>
    `;
    if (totalEl) totalEl.textContent = formatCOP(0);
    return;
  }

  contenedor.innerHTML = items.map((item) => /* html */ `
    <div class="carrito-item">
      <div class="carrito-item-imagen">
        ${item.image ? `<img src="${item.image}" alt="${item.name}" loading="lazy">` : ''}
      </div>
      <div class="carrito-item-info">
        <p class="carrito-item-nombre">${item.name}</p>
        <p class="carrito-item-precio">${formatCOP(item.price)}</p>
      </div>
      <div class="carrito-cantidad">
        <button data-accion="restar" data-id="${item.id}" aria-label="Quitar uno">-</button>
        <span>${item.quantity}</span>
        <button data-accion="sumar" data-id="${item.id}" aria-label="Agregar uno">+</button>
      </div>
      <button class="btn-eliminar-item" data-eliminar="${item.id}" aria-label="Eliminar ${item.name}">x</button>
    </div>
  `).join('');

  const total = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  if (totalEl) totalEl.textContent = formatCOP(total);
}
