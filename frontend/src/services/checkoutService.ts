// ============================================================
// SERVICE — Checkout
// Cliente HTTP para carrito y ordenes.
// ============================================================

import type {
  CartResponse,
  CheckoutPayload,
  CheckoutResponse,
  OrderResponse,
  ShippingAddress,
} from '../types/index.js';
import { getAccessToken } from './authService.js';

// ── Tipos ─────────────────────────────────────────────────────

export interface CartItemPayload {
  productId: string;
  quantity: number;
}

// ── Funciones ────────────────────────────────────────────────

/**
 * Crea una orden como USUARIO AUTENTICADO (con JWT).
 */
export async function createOrder(
  payload: CheckoutPayload
): Promise<CheckoutResponse> {
  const token = localStorage.getItem('accessToken');
  if (!token) throw new Error('Usuario no autenticado');

  const res = await fetch('/api/orders', {
    method:  'POST',
    headers: {
      'Content-Type':  'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  });

  const body = await res.json();
  if (!res.ok) {
    throw new Error(body?.message ?? `Error ${res.status} al procesar el pedido`);
  }
  return body.data as CheckoutResponse;
}

/**
 * Obtiene el carrito del usuario autenticado.
 */
export async function getCart(): Promise<CartResponse> {
  const token = localStorage.getItem('accessToken');
  if (!token) throw new Error('Usuario no autenticado');

  const res = await fetch('/api/cart', {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });

  const body = await res.json();
  if (!res.ok) {
    throw new Error(body?.message ?? `Error ${res.status} al obtener el carrito`);
  }
  return body.data as CartResponse;
}

/**
 * API solicitada: crea una orden usando shippingAddress.
 */
export async function createOrderWithShipping(
  shippingAddress: ShippingAddress
): Promise<OrderResponse> {
  return createOrder({ shippingAddress });
}

/**
 * Compatibilidad con código existente de CheckoutModal.
 */
export async function createAuthOrder(
  payload: CheckoutPayload,
  tokenOverride?: string
): Promise<CheckoutResponse> {
  const token = tokenOverride ?? getAccessToken();
  if (!token) throw new Error('Usuario no autenticado');

  const res = await fetch('/api/orders', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  });

  const body = await res.json();
  if (!res.ok) {
    throw new Error(body?.message ?? `Error ${res.status} al procesar el pedido`);
  }

  return body.data as CheckoutResponse;
}

/**
 * Compatibilidad con flujo invitado (no usado por /checkout).
 */
export async function createGuestOrder(payload: Record<string, unknown>): Promise<CheckoutResponse> {
  const res = await fetch('/api/orders', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  const body = await res.json();
  if (!res.ok) {
    throw new Error(body?.message ?? `Error ${res.status} al procesar el pedido`);
  }

  return body.data as CheckoutResponse;
}

/**
 * Redirige al checkout de Bold Colombia.
 */
export function redirigirABold(data: CheckoutResponse): void {
  if (data.checkoutUrl) {
    window.location.href = data.checkoutUrl;
  } else {
    // Si falló Bold al generar el link, redirigimos a una página de éxito 
    // pero con mensaje de "pago pendiente / manual"
    window.location.href = `/pedido-confirmado?orderId=${data.orderId}&status=pending`;
  }
}
