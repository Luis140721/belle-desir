// ============================================================
// COMPONENT — CartSidebar
// Escucha cart:add, maneja estado local, permite
// sumar/restar/eliminar ítems, muestra total COP
// y al confirmar llama al checkoutService (Widget Wompi)
// ============================================================

import type { CartItem } from '../types/index.js';
import { on, emit } from '../utils/events.js';
import { formatCOP } from '../utils/currency.js';
import { createOrder, abrirWidgetWompi } from '../services/checkoutService.js';

let items: CartItem[] = [];

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

  // ── Apertura y cierre ────────────────────────────────────
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

  // ── Agregar ítems ─────────────────────────────────────────
  on('cart:add', (item) => {
    const existe = items.find((i) => i.id === item.id);
    if (existe) {
      existe.quantity += item.quantity;
    } else {
      items.push({ ...item });
    }
    actualizarContador(contEl);
    renderItems(itemsEl, totalEl);
    abrir();
  });

  // ── Delegación de clics dentro del carrito ────────────────
  itemsEl?.addEventListener('click', (e) => {
    const target = e.target as HTMLElement;

    // Sumar / restar cantidad
    const btnCant = target.closest<HTMLButtonElement>('[data-accion]');
    if (btnCant) {
      const id = btnCant.dataset.id!;
      const item = items.find((i) => i.id === id);
      if (!item) return;
      btnCant.dataset.accion === 'sumar' ? item.quantity++ : item.quantity--;
      if (item.quantity <= 0) items = items.filter((i) => i.id !== id);
      actualizarContador(contEl);
      renderItems(itemsEl, totalEl);
      return;
    }

    // Eliminar
    const btnElim = target.closest<HTMLButtonElement>('[data-eliminar]');
    if (btnElim) {
      items = items.filter((i) => i.id !== btnElim.dataset.eliminar);
      actualizarContador(contEl);
      renderItems(itemsEl, totalEl);
    }
  });

  // ── Checkout ──────────────────────────────────────────────
  btnPagar?.addEventListener('click', async () => {
    if (!items.length) {
      alert('Tu carrito está vacío');
      return;
    }

    // Por ahora usamos datos de envío de ejemplo.
    // En producción abre un modal/form para capturarlos.
    const payload = {
      shippingAddress: {
        name: 'Cliente',
        email: 'cliente@example.com',
        phone: '',
        address: '',
        city: 'Colombia',
      },
    };

    btnPagar.textContent = 'Procesando...';
    btnPagar.disabled = true;

    try {
      const token = localStorage.getItem('accessToken') ?? undefined;
      const orderData = await createOrder(payload, token);
      abrirWidgetWompi(orderData);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Error al procesar el pago';
      alert(msg + '\n\n¿El backend está corriendo?');
      console.error('[Belle Désir] Checkout error:', err);
    } finally {
      btnPagar.textContent = 'Ir a pagar';
      btnPagar.disabled = false;
    }
  });
}

// ── Helpers privados ──────────────────────────────────────────

function actualizarContador(el: HTMLElement | null): void {
  if (!el) return;
  const total = items.reduce((s, i) => s + i.quantity, 0);
  el.textContent = String(total);
}

function renderItems(
  contenedor: HTMLElement | null,
  totalEl: HTMLElement | null
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
        <button class="btn-eliminar-item" data-eliminar="${item.id}" aria-label="Eliminar ${item.name}">✕</button>
      </div>
    `
    )
    .join('');

  const total = items.reduce((s, i) => s + i.price * i.quantity, 0);
  if (totalEl) totalEl.textContent = formatCOP(total);
}
