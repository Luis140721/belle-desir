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
  if (!token) throw new Error('Debes iniciar sesion para ver tu carrito');

  const res = await fetch(buildApiUrl('/cart'), {
    method: 'GET',
    headers: { Authorization: `Bearer ${token}` },
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
