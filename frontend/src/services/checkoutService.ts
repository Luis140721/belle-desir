// ============================================================
// SERVICE — Checkout: crea la orden y abre el Widget Wompi
// Soporta pedidos de invitado y pedidos autenticados.
// ============================================================

import type { CheckoutResponse } from '../types/index.js';

// ── Tipos ─────────────────────────────────────────────────────

export interface CartItemPayload {
  productId: string;
  quantity:  number;
}

export interface GuestCheckoutPayload {
  guestEmail:      string;
  guestName?:      string;
  guestPhone?:     string;
  items:           CartItemPayload[];
  shippingAddress: {
    name:    string;
    email:   string;
    address: string;
    city:    string;
    country: string;
    phone?:  string;
  };
}

export interface AuthCheckoutPayload {
  items?:          CartItemPayload[];   // opcional: si el carrito DB está vacío
  shippingAddress: {
    name:    string;
    address: string;
    city:    string;
    country: string;
    phone?:  string;
  };
}

// ── Funciones ────────────────────────────────────────────────

/**
 * Crea una orden como INVITADO (sin JWT).
 */
export async function createGuestOrder(
  payload: GuestCheckoutPayload
): Promise<CheckoutResponse> {
  const res = await fetch('/api/orders', {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify(payload),
  });

  const body = await res.json();
  if (!res.ok) {
    throw new Error(body?.message ?? `Error ${res.status} al procesar el pedido`);
  }
  return body.data as CheckoutResponse;
}

/**
 * Crea una orden como USUARIO AUTENTICADO (con JWT).
 */
export async function createAuthOrder(
  payload: AuthCheckoutPayload,
  token:   string
): Promise<CheckoutResponse> {
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
 * Abre el Widget de Wompi Colombia con los datos de la orden.
 * Carga el script dinámicamente si no está presente.
 */
export function abrirWidgetWompi(data: CheckoutResponse): void {
  const ejecutar = () => {
    const WidgetCheckout = (window as any).WidgetCheckout;
    if (!WidgetCheckout) {
      console.error('[Belle Désir] WidgetCheckout no disponible.');
      return;
    }
    const checkout = new WidgetCheckout({
      currency:      data.currency,
      amountInCents: data.amountInCents,
      reference:     data.orderId,
      publicKey:     data.publicKey,
      redirectUrl:   data.redirectUrl,
    });
    checkout.open((result: any) => {
      if (result?.transaction?.status === 'APPROVED') {
        window.location.href = data.redirectUrl;
      }
    });
  };

  if ((window as any).WidgetCheckout) {
    ejecutar();
    return;
  }

  const script = document.createElement('script');
  script.src = 'https://checkout.wompi.co/widget.js';
  script.setAttribute('data-render', 'false');
  script.onload = ejecutar;
  document.head.appendChild(script);
}
