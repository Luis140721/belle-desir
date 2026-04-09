// ============================================================
// SERVICE — Checkout: crea la orden y retorna datos del Widget Wompi
// ============================================================
// NOTA: El endpoint /api/orders requiere autenticación JWT.
// La respuesta incluye: orderId, amountInCents, currency,
// publicKey (Wompi) y redirectUrl.
// El frontend usa estos datos para iniciar el Widget de Wompi.
// ============================================================

import type { CheckoutPayload, CheckoutResponse } from '../types/index.js';

/**
 * Crea una orden en el backend y retorna los datos para el Widget de Wompi.
 * Requiere que el usuario esté autenticado (Bearer token en el header).
 */
export async function createOrder(
  payload: CheckoutPayload,
  authToken?: string
): Promise<CheckoutResponse> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  if (authToken) {
    headers['Authorization'] = `Bearer ${authToken}`;
  }

  const res = await fetch('/api/orders', {
    method: 'POST',
    headers,
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(
      (err as { message?: string }).message || `Error ${res.status} al procesar el checkout`
    );
  }

  return res.json();
}

/**
 * Abre el Widget de Wompi con los datos de la orden.
 * Carga el script de Wompi si no está en el DOM.
 */
export function abrirWidgetWompi(data: CheckoutResponse): void {
  // El Widget de Wompi Colombia se inicializa con estos parámetros
  const widget = (window as any).WidgetCheckout;

  const ejecutar = () => {
    const checkout = new widget({
      currency: data.currency,
      amountInCents: data.amountInCents,
      reference: data.orderId,
      publicKey: data.publicKey,
      redirectUrl: data.redirectUrl,
    });
    checkout.open((result: any) => {
      const transaction = result?.transaction;
      if (transaction?.status === 'APPROVED') {
        window.location.href = data.redirectUrl;
      }
    });
  };

  if (widget) {
    ejecutar();
    return;
  }

  // Carga dinámica del script de Wompi si no está presente
  const script = document.createElement('script');
  script.src = 'https://checkout.wompi.co/widget.js';
  script.setAttribute('data-render', 'false');
  script.onload = ejecutar;
  document.head.appendChild(script);
}
