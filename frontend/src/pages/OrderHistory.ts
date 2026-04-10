// ============================================================
// PAGE - Order History
// Muestra el historial de pedidos del usuario autenticado
// ============================================================

import { getAccessToken, isLoggedIn } from '../services/authService.js';
import { formatCOP, toNumber } from '../utils/currency.js';

interface Order {
  id: string;
  status: string;
  subtotal: number;
  shipping: number;
  total: number;
  createdAt: string;
  items: Array<{
    id: string;
    quantity: number;
    unitPrice: number;
    product: {
      name: string;
      images: string[];
    };
  }>;
}

export async function initOrderHistoryPage(): Promise<void> {
  const container = document.getElementById('contenido-principal');
  if (!container) return;

  // Verificar autenticación
  if (!isLoggedIn()) {
    const currentPath = encodeURIComponent(window.location.pathname);
    window.location.href = `/login?redirect=${currentPath}`;
    return;
  }

  try {
    // Obtener pedidos del usuario
    const token = getAccessToken();
    const res = await fetch('/api/orders', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (!res.ok) {
      if (res.status === 401) {
        const currentPath = encodeURIComponent(window.location.pathname);
        window.location.href = `/login?redirect=${currentPath}`;
        return;
      }
      throw new Error(`Error ${res.status}`);
    }

    const { data: orders } = await res.json();
    renderOrderHistory(container, orders);

  } catch (error) {
    console.error('Error loading orders:', error);
    renderError(container);
  }
}

function renderOrderHistory(container: HTMLElement, orders: Order[]): void {
  document.title = 'Mis Pedidos - Belle Désir';

  if (orders.length === 0) {
    container.innerHTML = /* html */ `
      <main class="order-history-page">
        <div class="order-history-container">
          <h1 class="seccion-titulo">Mis pedidos</h1>
          <div class="empty-orders">
            <div class="empty-orders-icon">Shopping Cart</div>
            <h2>Aún no tienes pedidos</h2>
            <p>Comienza a explorar nuestros productos y realiza tu primera compra.</p>
            <a href="/" class="btn-primario">Ver productos</a>
          </div>
        </div>
      </main>
    `;
    return;
  }

  // Ordenar pedidos por fecha (más reciente primero)
  const sortedOrders = orders.sort((a, b) => 
    new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  container.innerHTML = /* html */ `
    <main class="order-history-page">
      <div class="order-history-container">
        <h1 class="seccion-titulo">Mis pedidos</h1>
        <div class="orders-list">
          ${sortedOrders.map(order => renderOrderCard(order)).join('')}
        </div>
      </div>
    </main>
  `;
}

function renderOrderCard(order: Order): string {
  const date = new Date(order.createdAt);
  const formattedDate = date.toLocaleDateString('es-CO', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });

  const orderIdShort = order.id.slice(0, 8).toUpperCase();
  const totalItems = order.items.reduce((sum, item) => sum + item.quantity, 0);

  return /* html */ `
    <article class="order-card">
      <div class="order-card-header">
        <div class="order-info">
          <h3 class="order-number">Orden #${orderIdShort}</h3>
          <p class="order-date">${formattedDate}</p>
        </div>
        <div class="order-status">
          ${getStatusBadge(order.status)}
        </div>
      </div>
      
      <div class="order-card-body">
        <div class="order-summary">
          <div class="order-items-count">
            <span class="items-number">${totalItems}</span>
            <span class="items-label">${totalItems === 1 ? 'producto' : 'productos'}</span>
          </div>
          <div class="order-total">
            <span class="total-label">Total:</span>
            <span class="total-amount">${formatCOP(toNumber(order.total))}</span>
          </div>
        </div>
        
        <div class="order-products-preview">
          ${order.items.slice(0, 3).map(item => `
            <div class="product-preview" title="${item.product.name}">
              ${item.product.images?.[0] 
                ? `<img src="${item.product.images[0]}" alt="${item.product.name}" loading="lazy">`
                : `<div class="product-preview-placeholder">${item.product.name.charAt(0).toUpperCase()}</div>`
              }
            </div>
          `).join('')}
          ${order.items.length > 3 ? `
            <div class="more-products">+${order.items.length - 3}</div>
          ` : ''}
        </div>
      </div>
      
      <div class="order-card-footer">
        <a href="/mis-pedidos/${order.id}" class="btn-secundario">Ver detalle</a>
      </div>
    </article>
  `;
}

function getStatusBadge(status: string): string {
  const statusConfig = {
    PENDING: { text: 'Pendiente', class: 'status-pending' },
    PAID: { text: 'Pagado', class: 'status-paid' },
    PROCESSING: { text: 'En proceso', class: 'status-processing' },
    SHIPPED: { text: 'Enviado', class: 'status-shipped' },
    DELIVERED: { text: 'Entregado', class: 'status-delivered' },
    CANCELLED: { text: 'Cancelado', class: 'status-cancelled' },
    REFUNDED: { text: 'Reembolsado', class: 'status-refunded' }
  };

  const config = statusConfig[status as keyof typeof statusConfig] || 
    { text: status, class: 'status-unknown' };

  return `<span class="status-badge ${config.class}">${config.text}</span>`;
}

function renderError(container: HTMLElement): void {
  container.innerHTML = /* html */ `
    <main class="error-page">
      <div class="error-container">
        <h1 class="error-title">Error al cargar tus pedidos</h1>
        <p class="error-text">No pudimos cargar tu historial de pedidos. Por favor, intenta nuevamente.</p>
        <button onclick="location.reload()" class="btn-primario">Reintentar</button>
        <a href="/" class="btn-secundario">Ir a la tienda</a>
      </div>
    </main>
  `;
}
