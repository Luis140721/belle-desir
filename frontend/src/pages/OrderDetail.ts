// ============================================================
// PAGE - Order Detail
// Muestra el detalle completo de una orden específica
// ============================================================

import { getAccessToken, isLoggedIn } from '../services/authService.js';
import { buildApiUrl, buildMediaUrl } from '../config/api.js';
import { formatCOP } from '../utils/currency.js';
import { getSpaPageRoot } from '../utils/pageContainer.js';
import { normalizeOrder, type OrderDisplay } from '../utils/orderDisplay.js';

export async function initOrderDetailPage(): Promise<void> {
  const container = getSpaPageRoot();
  if (!container) return;

  if (!isLoggedIn()) {
    const currentPath = encodeURIComponent(window.location.pathname);
    window.location.href = `/login?redirect=${currentPath}`;
    return;
  }

  const pathParts = window.location.pathname.split('/').filter(Boolean);
  const orderId = pathParts[pathParts.length - 1];

  if (!orderId || orderId === 'mis-pedidos') {
    window.location.href = '/mis-pedidos';
    return;
  }

  container.innerHTML = /* html */ `
    <main class="order-detail-page">
      <div class="order-detail-container">
        <p class="order-history-loading">Cargando pedido…</p>
      </div>
    </main>
  `;

  try {
    const token = getAccessToken();
    const res = await fetch(buildApiUrl(`orders/${orderId}`), {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!res.ok) {
      if (res.status === 401) {
        const currentPath = encodeURIComponent(window.location.pathname);
        window.location.href = `/login?redirect=${currentPath}`;
        return;
      }
      if (res.status === 404 || res.status === 403) {
        renderNotFound(container, orderId);
        return;
      }
      throw new Error(`Error ${res.status}`);
    }

    const body = await res.json();
    const order = normalizeOrder(body.data);

    if (!order) {
      renderError(container);
      return;
    }

    renderOrderDetail(container, order);
  } catch (error) {
    console.error('Error loading order detail:', error);
    renderError(container);
  }
}

function renderOrderDetail(container: HTMLElement, order: OrderDisplay): void {
  const orderIdShort = order.id.slice(0, 8).toUpperCase();
  const date = new Date(order.createdAt);
  const formattedDate = date.toLocaleDateString('es-CO', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  document.title = `Orden #${orderIdShort} - Belle Désir`;

  const itemsRows = order.items.length
    ? order.items.map((item) => {
        const initial = item.product.name.charAt(0).toUpperCase();
        const img = item.product.images?.[0];
        const productHref = item.product.slug ? `/producto/${item.product.slug}` : '#catalogo';

        return `
          <tr>
            <td class="product-cell">
              <div class="product-info">
                ${img
                  ? `<img src="${buildMediaUrl(img)}" alt="${escapeHtml(item.product.name)}" class="product-image">`
                  : `<div class="product-image-placeholder">${initial}</div>`
                }
                <div>
                  <a href="${productHref}" class="product-name">${escapeHtml(item.product.name)}</a>
                </div>
              </div>
            </td>
            <td class="quantity-cell">${item.quantity}</td>
            <td class="price-cell">${formatCOP(item.unitPrice)}</td>
            <td class="subtotal-cell">${formatCOP(item.unitPrice * item.quantity)}</td>
          </tr>
        `;
      }).join('')
    : `<tr><td colspan="4" class="order-empty-items">Sin productos en este pedido.</td></tr>`;

  const addr = order.shippingAddress;

  container.innerHTML = /* html */ `
    <main class="order-detail-page">
      <div class="order-detail-container">
        <nav class="breadcrumb" style="margin-bottom: 2rem;">
          <a href="/mis-pedidos" class="breadcrumb-link">Mis pedidos</a>
          <span class="breadcrumb-separator">/</span>
          <span class="breadcrumb-current">#${orderIdShort}</span>
        </nav>

        <div class="order-detail-header">
          <div class="order-header-info">
            <h1 class="order-title">Orden #${orderIdShort}</h1>
            <p class="order-date">${formattedDate}</p>
          </div>
          <div class="order-status">
            ${getStatusBadge(order.status)}
          </div>
        </div>

        <div class="order-detail-grid">
          <div class="order-products-section">
            <h2 class="section-title">Productos</h2>
            <div class="order-items-table">
              <table>
                <thead>
                  <tr>
                    <th>Producto</th>
                    <th>Cantidad</th>
                    <th>Precio unitario</th>
                    <th>Subtotal</th>
                  </tr>
                </thead>
                <tbody>
                  ${itemsRows}
                </tbody>
              </table>
            </div>
          </div>

          <div class="order-summary-section">
            <div class="order-cost-summary">
              <h2 class="section-title">Resumen del pedido</h2>
              <div class="cost-breakdown">
                <div class="cost-row">
                  <span class="cost-label">Subtotal:</span>
                  <span class="cost-value">${formatCOP(order.subtotal)}</span>
                </div>
                <div class="cost-row">
                  <span class="cost-label">Envío:</span>
                  <span class="cost-value">${order.shipping === 0 ? 'Gratis' : formatCOP(order.shipping)}</span>
                </div>
                <div class="cost-row total-row">
                  <span class="cost-label total-label">Total:</span>
                  <span class="cost-value total-value">${formatCOP(order.total)}</span>
                </div>
              </div>
            </div>

            <div class="order-shipping-info">
              <h2 class="section-title">Dirección de envío</h2>
              <div class="shipping-address">
                <p class="address-name">${escapeHtml(addr.name)}</p>
                <p class="address-street">${escapeHtml(addr.address)}</p>
                <p class="address-city">${escapeHtml(addr.city)}, ${escapeHtml(addr.country)}</p>
                <p class="address-zip">${escapeHtml(addr.zip)}</p>
                ${addr.phone ? `<p class="address-phone">Tel: ${escapeHtml(addr.phone)}</p>` : ''}
              </div>
            </div>

            <div class="order-payment-info">
              <h2 class="section-title">Método de pago</h2>
              <div class="payment-method">
                <p><strong>Bold Colombia</strong></p>
                <p>Pago seguro en línea</p>
              </div>
            </div>

            <div class="order-actions">
              <a href="/mis-pedidos" class="btn-secundario">Volver a mis pedidos</a>
              ${order.status === 'DELIVERED' ? `
                <a href="https://wa.me/573159739914?text=${encodeURIComponent(`Hola, tengo una consulta sobre mi orden #${orderIdShort}`)}"
                   target="_blank"
                   rel="noopener noreferrer"
                   class="btn-whatsapp">
                  ¿Necesitas ayuda?
                </a>
              ` : ''}
            </div>
          </div>
        </div>
      </div>
    </main>
  `;
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function getStatusBadge(status: string): string {
  const statusConfig = {
    PENDING: { text: 'Pendiente', class: 'status-pending' },
    PAID: { text: 'Pagado', class: 'status-paid' },
    PROCESSING: { text: 'En proceso', class: 'status-processing' },
    SHIPPED: { text: 'Enviado', class: 'status-shipped' },
    DELIVERED: { text: 'Entregado', class: 'status-delivered' },
    CANCELLED: { text: 'Cancelado', class: 'status-cancelled' },
    REFUNDED: { text: 'Reembolsado', class: 'status-refunded' },
  };

  const config = statusConfig[status as keyof typeof statusConfig] ||
    { text: status, class: 'status-unknown' };

  return `<span class="status-badge ${config.class}">${config.text}</span>`;
}

function renderNotFound(container: HTMLElement, orderId: string): void {
  container.innerHTML = /* html */ `
    <main class="not-found-page">
      <div class="not-found-container">
        <h1 class="not-found-title">Pedido no encontrado</h1>
        <p class="not-found-text">El pedido #${orderId.slice(0, 8).toUpperCase()} no existe o no tienes acceso a él.</p>
        <a href="/mis-pedidos" class="btn-primario">Ver mis pedidos</a>
      </div>
    </main>
  `;
}

function renderError(container: HTMLElement): void {
  container.innerHTML = /* html */ `
    <main class="error-page">
      <div class="error-container">
        <h1 class="error-title">Error al cargar el pedido</h1>
        <p class="error-text">No pudimos cargar los detalles del pedido. Por favor, intenta nuevamente.</p>
        <button type="button" onclick="location.reload()" class="btn-primario">Reintentar</button>
        <a href="/mis-pedidos" class="btn-secundario">Ver mis pedidos</a>
      </div>
    </main>
  `;
}
