import { getPaymentStatus } from '../services/checkoutService.js';
import type { PaymentStatusResponse } from '../types/index.js';
import { formatCOP, toNumber } from '../utils/currency.js';

const SOPORTE_WHATSAPP = '573159739914';
const CART_KEYS = ['belle-desir-cart', 'cart', 'carrito', 'cartItems', 'checkoutCart', 'belle_cart'];

export async function initPedidoConfirmadoPage(): Promise<void> {
  const container = document.getElementById('contenido-principal');
  if (!container) return;

  const params = new URLSearchParams(window.location.search);
  const orderId = getOrderIdFromParams(params);
  const redirectStatus = normalizeRedirectStatus(params);

  if (!orderId) {
    renderMissingReference(container);
    return;
  }

  renderChecking(container, orderId);

  try {
    const status = await pollPaymentStatus(orderId, redirectStatus);
    renderPaymentResult(container, status);
  } catch (error) {
    console.error('[payment-result] Error consultando pago:', error);
    renderUnknown(container, orderId);
  }
}

function getOrderIdFromParams(params: URLSearchParams): string | null {
  return (
    params.get('orderId') ||
    params.get('reference') ||
    params.get('order_reference') ||
    params.get('bold-order-id') ||
    params.get('boldOrderId')
  );
}

function normalizeRedirectStatus(params: URLSearchParams): string {
  return String(
    params.get('bold-tx-status') ||
    params.get('transactionStatus') ||
    params.get('status') ||
    params.get('payment_status') ||
    ''
  ).toUpperCase();
}

async function pollPaymentStatus(orderId: string, redirectStatus: string): Promise<PaymentStatusResponse> {
  const maxAttempts = redirectStatus === 'APPROVED' ? 6 : 4;

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const status = await getPaymentStatus(orderId, redirectStatus || undefined);

    if (status.boldStatus === 'APPROVED' || status.boldStatus === 'REJECTED') {
      return status;
    }

    if (attempt < maxAttempts - 1) {
      await wait(2500 + attempt * 1500);
    }
  }

  return getPaymentStatus(orderId, redirectStatus || undefined);
}

function renderChecking(container: HTMLElement, orderId: string): void {
  container.innerHTML = /* html */ `
    <main class="confirmacion-page">
      <section class="confirmacion-card payment-result payment-result--checking">
        <div class="payment-result-icon payment-result-icon--spinner"></div>
        <p class="confirmacion-eyebrow">Validando pago</p>
        <h1>Estamos confirmando tu transaccion</h1>
        <p>Estamos revisando la respuesta de Bold y el respaldo del webhook. Esto puede tardar unos segundos.</p>
        <p class="confirmacion-ref">Orden: <strong>${escapeHtml(orderId)}</strong></p>
      </section>
    </main>
  `;
}

function renderPaymentResult(container: HTMLElement, status: PaymentStatusResponse): void {
  if (status.boldStatus === 'APPROVED' || status.orderStatus === 'PAID') {
    clearLocalCart();
    
    let summaryHtml = '';
    if (status.orderData) {
      const itemsHtml = status.orderData.items.map(item => `
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:0.8rem; font-size:0.95rem; color:var(--texto-gris);">
          <span>${escapeHtml(item.product.name)} <strong style="color:var(--lila-claro);">x${item.quantity}</strong></span>
          <span>${formatCOP(toNumber(item.unitPrice) * item.quantity)}</span>
        </div>
      `).join('');

      summaryHtml = `
        <div style="background:rgba(255,255,255,0.02); border:1px solid rgba(196,168,232,0.1); border-radius:12px; padding:1.2rem; margin:1.5rem 0; text-align:left;">
          <h3 style="color:var(--champana); font-family:var(--font-serif); font-size:1.1rem; border-bottom:1px solid rgba(196,168,232,0.15); padding-bottom:0.5rem; margin-bottom:1rem;">Resumen de tu pedido</h3>
          <div style="max-height:180px; overflow-y:auto; margin-bottom:1rem; border-bottom:1px dashed rgba(196,168,232,0.1); padding-bottom:0.5rem;">
            ${itemsHtml}
          </div>
          <div style="display:flex; flex-direction:column; gap:0.4rem; font-size:0.9rem; color:var(--texto-gris);">
            <div style="display:flex; justify-content:space-between;"><span>Subtotal:</span><span>${formatCOP(toNumber(status.orderData.subtotal))}</span></div>
            <div style="display:flex; justify-content:space-between;"><span>Envío:</span><span>${formatCOP(toNumber(status.orderData.shipping))}</span></div>
            <div style="display:flex; justify-content:space-between; color:var(--champana); font-weight:bold; font-size:1.05rem; margin-top:0.3rem; border-top:1px solid rgba(196,168,232,0.1); padding-top:0.5rem;">
              <span>Total:</span><span>${formatCOP(toNumber(status.orderData.total))}</span>
            </div>
          </div>
        </div>
      `;
    }

    container.innerHTML = /* html */ `
      <main class="confirmacion-page">
        <section class="confirmacion-card payment-result payment-result--success" style="max-width:550px;">
          <div class="confirmacion-check">✓</div>
          <p class="confirmacion-eyebrow">Pago aprobado</p>
          <h1>Pedido confirmado</h1>
          <p>Tu pago fue aprobado y tu orden entro a preparacion.</p>
          <p class="confirmacion-ref">Orden: <strong>${escapeHtml(status.orderId)}</strong></p>
          ${status.transactionId ? `<p class="confirmacion-ref">Transaccion Bold: <strong>${escapeHtml(status.transactionId)}</strong></p>` : ''}
          
          ${summaryHtml}

          <div class="confirmacion-actions">
            <a href="/mis-pedidos/${encodeURIComponent(status.orderId)}" class="btn-primario confirmacion-btn">Ver pedido</a>
            <a href="/" class="btn-secundario confirmacion-btn">Seguir comprando</a>
          </div>
        </section>
      </main>
    `;
    return;
  }

  if (status.boldStatus === 'REJECTED' || ['CANCELLED', 'REFUNDED'].includes(status.orderStatus)) {
    container.innerHTML = /* html */ `
      <main class="confirmacion-page">
        <section class="confirmacion-card payment-result payment-result--failed">
          <div class="payment-result-icon payment-result-icon--failed">!</div>
          <p class="confirmacion-eyebrow">Pago no completado</p>
          <h1>No pudimos confirmar el pago</h1>
          <p>Bold reporto que la transaccion fue rechazada, cancelada o vencida.</p>
          <p class="confirmacion-ref">Orden: <strong>${escapeHtml(status.orderId)}</strong></p>
          <div class="confirmacion-actions">
            ${status.checkoutUrl ? `<a href="${escapeHtml(status.checkoutUrl)}" class="btn-primario confirmacion-btn">Intentar de nuevo</a>` : ''}
            <a href="${supportUrl(status.orderId)}" class="btn-secundario confirmacion-btn" target="_blank" rel="noreferrer">Soporte por WhatsApp</a>
          </div>
        </section>
      </main>
    `;
    return;
  }

  container.innerHTML = /* html */ `
    <main class="confirmacion-page">
      <section class="confirmacion-card payment-result payment-result--pending">
        <div class="payment-result-icon payment-result-icon--pending">...</div>
        <p class="confirmacion-eyebrow">Pago pendiente</p>
        <h1>Estamos esperando la confirmacion</h1>
        <p>El pago puede tardar unos minutos en llegar por webhook. Si ya pagaste, no repitas el pago todavia.</p>
        <p class="confirmacion-ref">Orden: <strong>${escapeHtml(status.orderId)}</strong></p>
        <div class="confirmacion-actions">
          <button class="btn-primario confirmacion-btn" id="btn-refresh-payment">Actualizar estado</button>
          ${status.checkoutUrl ? `<a href="${escapeHtml(status.checkoutUrl)}" class="btn-secundario confirmacion-btn">Volver a Bold</a>` : ''}
          <a href="${supportUrl(status.orderId)}" class="btn-secundario confirmacion-btn" target="_blank" rel="noreferrer">Soporte</a>
        </div>
      </section>
    </main>
  `;

  document.getElementById('btn-refresh-payment')?.addEventListener('click', () => {
    void initPedidoConfirmadoPage();
  });
}

function renderMissingReference(container: HTMLElement): void {
  container.innerHTML = /* html */ `
    <main class="confirmacion-page">
      <section class="confirmacion-card payment-result payment-result--failed">
        <div class="payment-result-icon payment-result-icon--failed">!</div>
        <h1>No encontramos la referencia del pedido</h1>
        <p>Vuelve a tus pedidos o escribenos para revisar el pago con Bold.</p>
        <div class="confirmacion-actions">
          <a href="/mis-pedidos" class="btn-primario confirmacion-btn">Ver mis pedidos</a>
          <a href="${supportUrl()}" class="btn-secundario confirmacion-btn" target="_blank" rel="noreferrer">Soporte por WhatsApp</a>
        </div>
      </section>
    </main>
  `;
}

function renderUnknown(container: HTMLElement, orderId: string): void {
  container.innerHTML = /* html */ `
    <main class="confirmacion-page">
      <section class="confirmacion-card payment-result payment-result--pending">
        <div class="payment-result-icon payment-result-icon--pending">?</div>
        <h1>No pudimos consultar el estado</h1>
        <p>Tu orden fue creada, pero no pudimos contactar el servicio de verificacion. Intenta actualizar en un momento.</p>
        <p class="confirmacion-ref">Orden: <strong>${escapeHtml(orderId)}</strong></p>
        <div class="confirmacion-actions">
          <button class="btn-primario confirmacion-btn" id="btn-refresh-payment">Actualizar estado</button>
          <a href="${supportUrl(orderId)}" class="btn-secundario confirmacion-btn" target="_blank" rel="noreferrer">Soporte</a>
        </div>
      </section>
    </main>
  `;

  document.getElementById('btn-refresh-payment')?.addEventListener('click', () => {
    void initPedidoConfirmadoPage();
  });
}

function clearLocalCart(): void {
  CART_KEYS.forEach((key) => localStorage.removeItem(key));
}

function supportUrl(orderId?: string): string {
  const text = orderId
    ? `Hola, necesito ayuda con mi pago de Belle Desir. Orden: ${orderId}`
    : 'Hola, necesito ayuda con mi pago de Belle Desir.';
  return `https://wa.me/${SOPORTE_WHATSAPP}?text=${encodeURIComponent(text)}`;
}

function wait(ms: number): Promise<void> {
  return new Promise((resolve) => window.setTimeout(resolve, ms));
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}
