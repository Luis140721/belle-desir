import type {
  CartResponse,
  CheckoutPayload,
  CheckoutResponse,
  OrderResponse,
  ShippingAddress,
  CartItem,
} from '../types/index.js';
import { buildApiUrl } from '../config/api.js';

export interface CartItemPayload {
  productId: string;
  quantity: number;
}

const CART_STORAGE_KEYS = ['belle-desir-cart', 'cart', 'carrito', 'cartItems', 'checkoutCart', 'belle_cart'];

export async function createOrder(payload: CheckoutPayload): Promise<CheckoutResponse> {
  const token = localStorage.getItem('accessToken');
  if (!token) throw new Error('Debes iniciar sesion para comprar');

  const res = await fetch(buildApiUrl('/orders'), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
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

export async function getCart(): Promise<CartResponse> {
  const token = localStorage.getItem('accessToken');
  if (!token) throw new Error('Debes iniciar sesión para comprar');

  const res = await fetch(buildApiUrl('/cart'), {
    method: 'GET',
    headers: { Authorization: `Bearer ${token}` },
  });

  const body = await safeJson(res);
  if (!res.ok) {
    console.error('[checkout] getCart error', { status: res.status, response: body });
    throw new Error(body?.message ?? `Error ${res.status} al obtener el carrito`);
  }

  return body.data as CartResponse;
}

/**
 * Sincroniza el carrito local con el backend.
 * Se usa antes de ir al checkout para asegurar que el backend tenga los mismos items.
 */
export async function syncCart(localItems: CartItem[]): Promise<void> {
  const token = localStorage.getItem('accessToken');
  if (!token || !localItems.length) return;

  // Limpiar carrito actual en el backend para evitar duplicados o basura
  await fetch(buildApiUrl('/cart'), {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token}` },
  });

  // Agregar cada item uno por uno (según las rutas actuales del backend)
  for (const item of localItems) {
    try {
      await fetch(buildApiUrl('/cart/items'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          productId: item.id,
          quantity: item.quantity,
        }),
      });
    } catch (err) {
      console.error(`[checkout] Error al sincronizar item ${item.id}`, err);
    }
  }
}

export async function createOrderWithShipping(
  shippingAddress: ShippingAddress
): Promise<OrderResponse> {
  return createOrder({ shippingAddress });
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
      // Try the next known cart key.
    }
  }

  return [];
}

export async function getLastOrderAddress(): Promise<ShippingAddress | null> {
  const token = localStorage.getItem('accessToken');
  if (!token) return null;

  try {
    const res = await fetch(buildApiUrl('/orders'), {
      method: 'GET',
      headers: { Authorization: `Bearer ${token}` },
    });

    const body = await safeJson(res);
    if (!res.ok || !Array.isArray(body.data) || body.data.length === 0) {
      return null;
    }

    // El backend suele devolver las órdenes ordenadas por fecha descendente o podemos buscar la más reciente
    const lastOrder = body.data[0];
    if (lastOrder && lastOrder.shippingAddress) {
      return lastOrder.shippingAddress as ShippingAddress;
    }
  } catch (err) {
    console.error('[checkout] Error al obtener última dirección:', err);
  }

  return null;
}

async function safeJson(res: Response): Promise<any> {
  try {
    return await res.json();
  } catch {
    return { message: `Respuesta no JSON (status ${res.status})` };
  }
}

export function redirigirABold(data: CheckoutResponse): void {
  if (data.checkoutUrl) {
    window.location.href = data.checkoutUrl;
  } else {
    window.location.href = `/pedido-confirmado?orderId=${data.orderId}&status=pending`;
  }
}
