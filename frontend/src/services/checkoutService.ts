// ============================================================
// SERVICE — Checkout
// Cliente HTTP para carrito y ordenes.
// ============================================================

import type {
  CartResponse,
  CheckoutPayload,
  CheckoutResponse,
  GuestOrderPayload,
  OrderResponse,
  ShippingAddress,
  CartItem,
} from '../types/index.js';
import { getAccessToken } from './authService.js';
import { buildApiUrl } from '../config/api.js';

// ── Tipos ─────────────────────────────────────────────────────

export interface CartItemPayload {
  productId: string;
  quantity: number;
}

const CART_STORAGE_KEYS = ['belle-desir-cart', 'cart', 'carrito', 'cartItems', 'checkoutCart', 'belle_cart'];

// ── Funciones ────────────────────────────────────────────────

/**
 * Crea una orden como USUARIO AUTENTICADO (con JWT).
 */
export async function createOrder(
  payload: CheckoutPayload
): Promise<CheckoutResponse> {
  const token = localStorage.getItem('accessToken');
  if (!token) throw new Error('Usuario no autenticado');

  const res = await fetch(buildApiUrl('/orders'), {
    method:  'POST',
    headers: {
      'Content-Type':  'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  });

  const body = await safeJson(res);
  if (!res.ok) {
    console.error('[checkout] createOrder error', {
      status: res.status,
      response: body,
      payload,
    });
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

  const res = await fetch(buildApiUrl('/cart'), {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });

  const body = await safeJson(res);
  if (!res.ok) {
    console.error('[checkout] getCart error', {
      status: res.status,
      response: body,
    });
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

  const res = await fetch(buildApiUrl('/orders'), {
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
export async function createGuestOrder(payload: GuestOrderPayload | Record<string, unknown>): Promise<CheckoutResponse> {
  const normalized =
    'guestInfo' in payload
      ? {
          guestInfo: (payload as GuestOrderPayload).guestInfo,
          shippingAddress: (payload as GuestOrderPayload).shippingAddress,
          items: (payload as GuestOrderPayload).items,
        }
      : {
          guestInfo: {
            name: String(payload.guestName ?? payload.name ?? 'Invitado'),
            email: String(payload.guestEmail ?? payload.email ?? ''),
            phone: String(payload.guestPhone ?? payload.phone ?? ''),
          },
          shippingAddress: payload.shippingAddress as ShippingAddress,
          items: ((payload.items as Array<{ productId: string; quantity: number; price?: number }> | undefined) ?? []).map((i) => ({
            id: i.productId,
            name: '',
            image: '',
            price: Number(i.price ?? 0),
            quantity: i.quantity,
          })),
        };

  // En backend actual no existe /api/orders/guest; invitados se procesan por /api/orders sin JWT.
  console.info('[checkout] guest order request', {
    endpoint: '/api/orders',
    payload: {
      guestEmail: normalized.guestInfo.email,
      itemsCount: normalized.items.length,
      hasShippingAddress: Boolean(normalized.shippingAddress),
    },
  });

  const res = await fetch(buildApiUrl('/orders'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      guestName: normalized.guestInfo.name,
      guestEmail: normalized.guestInfo.email,
      guestPhone: normalized.guestInfo.phone,
      shippingAddress: normalized.shippingAddress,
      items: normalized.items.map((item) => ({
        productId: item.id,
        quantity: item.quantity,
        price: item.price,
      })),
    }),
  });

  const body = await safeJson(res);
  console.info('[checkout] guest order response', { status: res.status, body });
  if (!res.ok) {
    console.error('[checkout] createGuestOrder error', {
      status: res.status,
      response: body,
      payload: normalized,
    });
    throw new Error(body?.message ?? `Error ${res.status} al procesar el pedido`);
  }

  return body.data as CheckoutResponse;
}

export function getCartItems(): CartItem[] {
  for (const key of CART_STORAGE_KEYS) {
    const raw = localStorage.getItem(key);
    if (!raw) continue;

    try {
      const parsed = JSON.parse(raw) as CartItem[];
      if (!Array.isArray(parsed)) continue;

      const validItems = parsed.filter((item) =>
        Boolean(item?.id) &&
        Boolean(item?.name) &&
        Number.isFinite(Number(item?.price)) &&
        Number.isFinite(Number(item?.quantity))
      );

      if (validItems.length) return validItems;
    } catch {
      // try next key
    }
  }

  return [];
}

async function safeJson(res: Response): Promise<any> {
  try {
    return await res.json();
  } catch {
    return { message: `Respuesta no JSON (status ${res.status})` };
  }
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
