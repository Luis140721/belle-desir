// ============================================================
// COMPONENT — CartSidebar
// Escucha cart:add, maneja estado local, permite
// sumar/restar/eliminar, muestra total COP.
// Al pulsar "Ir a pagar" abre CheckoutModal.
// ============================================================

import type { CartItem } from '../types/index.js';
import { on, emit } from '../utils/events.js';
import { formatCOP } from '../utils/currency.js';

let items: CartItem[] = [];
const CART_STORAGE_KEY = 'belle-desir-cart';

// ── API pública ───────────────────────────────────────────────

export function initCartSidebar(): void {
  const sidebar  = document.getElementById('carrito-sidebar') as HTMLElement | null;
  const overlay  = document.getElementById('carrito-overlay') as HTMLElement | null;
  const itemsEl  = document.getElementById('carrito-items') as HTMLElement | null;
  const totalEl  = document.getElementById('carrito-total-precio') as HTMLElement | null;
  const btnCerra = document.getElementById('btn-cerrar-carrito') as HTMLButtonElement | null;
  const btnPagar = document.getElementById('btn-checkout') as HTMLButtonElement | null;
  const contEl   = document.getElementById('contador-carrito') as HTMLElement | null;

  if (!sidebar) return;
  items = loadCartFromStorage();
  actualizarContador(contEl);
  renderItems(itemsEl, totalEl);

  // ── Apertura y cierre del sidebar ────────────────────────
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

  // Escucha eventos globales
  on('cart:open', abrir);
  on('cart:close', cerrar);

  // Icono del carrito en navbar
  document.querySelector('.navbar-carrito')?.addEventListener('click', () => emit('cart:open'));

  btnCerra?.addEventListener('click', cerrar);
  overlay?.addEventListener('click', cerrar);
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') cerrar(); });

  // ── Agregar ítems ─────────────────────────────────────────// Agregar ítems (sin abrir automáticamente el sidebar)
  on('cart:add', (item) => {
    const existe = items.find((i) => i.id === item.id);
    if (existe) {
      existe.quantity += item.quantity;
    } else {
      items.push({ ...item });
    }
    actualizarContador(contEl);
    renderItems(itemsEl, totalEl);
    saveCartToStorage();
    // Ya no se abre automáticamente el sidebar al agregar productos
    // abrir();
  });

  // ── Delegación de clics dentro del carrito ────────────────
  itemsEl?.addEventListener('click', (e) => {
    const target = e.target as HTMLElement;

    const btnCant = target.closest<HTMLButtonElement>('[data-accion]');
    if (btnCant) {
      const id   = btnCant.dataset.id!;
      const item = items.find((i) => i.id === id);
      if (!item) return;
      btnCant.dataset.accion === 'sumar' ? item.quantity++ : item.quantity--;
      if (item.quantity <= 0) items = items.filter((i) => i.id !== id);
      actualizarContador(contEl);
      renderItems(itemsEl, totalEl);
      saveCartToStorage();
      return;
    }

    const btnElim = target.closest<HTMLButtonElement>('[data-eliminar]');
    if (btnElim) {
      items = items.filter((i) => i.id !== btnElim.dataset.eliminar);
      actualizarContador(contEl);
      renderItems(itemsEl, totalEl);
      saveCartToStorage();
    }
  });

  // ── "Ir a pagar" → Redirige a Checkout ─────────────
  btnPagar?.addEventListener('click', () => {
    if (!items.length) {
      alert('Tu carrito está vacío');
      return;
    }
    
    window.location.href = '/checkout';
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

// ── Helpers privados ──────────────────────────────────────────

function actualizarContador(el: HTMLElement | null): void {
  if (!el) return;
  const totalItems = items.reduce((s, i) => s + i.quantity, 0);
  
  if (totalItems === 0) {
    el.textContent = ''; // Ocultar el badge cuando está vacío
  } else {
    el.textContent = String(totalItems); // Mostrar el número de items
  }
}

function renderItems(
  contenedor: HTMLElement | null,
  totalEl:   HTMLElement | null
): void {
  if (!contenedor) return;

  if (!items.length) {
    contenedor.innerHTML = /* html */ `
      <div class="carrito-vacio">
        <p>🛒</p>
        <p>Tu carrito está vacío</p>
      </div>
    `;
    if (totalEl) totalEl.textContent = formatCOP(0);
    return;
  }

  contenedor.innerHTML = items
    .map(
      (item) => /* html */ `
      <div class="carrito-item">
        <div class="carrito-item-imagen">
          ${item.image ? `<img src="${item.image}" alt="${item.name}" loading="lazy">` : '✨'}
        </div>
        <div class="carrito-item-info">
          <p class="carrito-item-nombre">${item.name}</p>
          <p class="carrito-item-precio">${formatCOP(item.price)}</p>
        </div>
        <div class="carrito-cantidad">
          <button data-accion="restar" data-id="${item.id}" aria-label="Quitar uno">−</button>
          <span>${item.quantity}</span>
          <button data-accion="sumar"  data-id="${item.id}" aria-label="Agregar uno">+</button>
        </div>
        <button class="btn-eliminar-item" data-eliminar="${item.id}"
                aria-label="Eliminar ${item.name}">✕</button>
      </div>
    `
    )
    .join('');

  const total = items.reduce((s, i) => s + i.price * i.quantity, 0);
  if (totalEl) totalEl.textContent = formatCOP(total);
}
