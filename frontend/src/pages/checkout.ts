import {
  createOrderWithShipping,
  getCart,
  getLastOrderAddress,
} from '../services/checkoutService.js';
import { isLoggedIn } from '../services/authService.js';
import { formatCOP } from '../utils/currency.js';
import type { CartResponse, ShippingAddress } from '../types/index.js';
import { buildMediaUrl } from '../config/api.js';

const SOPORTE_WHATSAPP = '573159739914';
const MIN_ORDER = 20000;

export async function initCheckoutPage(): Promise<void> {
  const container = document.getElementById('contenido-principal');
  if (!container) return;

  if (!isLoggedIn()) {
    window.location.href = '/login?redirect=/checkout';
    return;
  }

  // Obtener datos del usuario para autocompletar
  const userRaw = localStorage.getItem('user');
  const user = userRaw ? JSON.parse(userRaw) : null;

  // Estado de carga inicial
  container.innerHTML = `
    <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; min-height: 60vh;">
      <div class="spinner"></div>
      <p style="margin-top: 1rem; color: var(--lila-claro);">Preparando tu pedido...</p>
    </div>
  `;

  let cart: CartResponse | null = null;
  let lastAddress: ShippingAddress | null = null;

  try {
    // Cargar carrito y última dirección en paralelo
    const [cartRes, addrRes] = await Promise.all([
      getCart(),
      getLastOrderAddress(),
    ]);
    cart = cartRes;
    lastAddress = addrRes;
  } catch (err) {
    console.error('Error al cargar datos del checkout:', err);
    container.innerHTML = `<p class="error-mensaje">Error al cargar el checkout. Por favor intenta de nuevo.</p>`;
    return;
  }

  const total = cart?.items?.reduce((sum, item) => {
    const price = Number(item.product.price);
    return sum + (price * item.quantity);
  }, 0) ?? 0;

  if (!cart?.items?.length) {
    container.innerHTML = `
      <main class="checkout-page">
        <div class="checkout-vacio">
          <h2 class="seccion-titulo">Tu carrito está <em>vacío</em></h2>
          <p class="verificacion-texto">Agrega algunos productos antes de proceder al pago.</p>
          <a href="/" class="btn-primario">Volver a la tienda</a>
        </div>
      </main>
    `;
    return;
  }

  // Validar mínimo de compra en el checkout por si acaso
  if (total < MIN_ORDER) {
    container.innerHTML = `
      <main class="checkout-page">
        <div class="checkout-vacio">
          <h2 class="seccion-titulo">Mínimo de <em>Compra</em></h2>
          <p class="verificacion-texto">El pedido mínimo para envío es de ${formatCOP(MIN_ORDER)}.</p>
          <p class="verificacion-texto">Tu total actual es de ${formatCOP(total)}.</p>
          <a href="/" class="btn-primario">Seguir comprando</a>
        </div>
      </main>
    `;
    return;
  }

  const summaryHtml = cart.items.map(item => `
    <div class="summary-item">
      <div class="summary-item-img">
        <img src="${buildMediaUrl(item.product.images[0])}" alt="${item.product.name}">
      </div>
      <div class="summary-item-info">
        <p class="item-nombre">${item.product.name}</p>
        <p class="item-meta">Cant: ${item.quantity} x ${formatCOP(Number(item.product.price))}</p>
      </div>
      <div class="summary-item-total">
        ${formatCOP(Number(item.product.price) * item.quantity)}
      </div>
    </div>
  `).join('');

  container.innerHTML = /* html */ `
    <main class="checkout-page">
      <div class="checkout-container">
        <div class="checkout-layout">
          <div class="checkout-form-section">
            <h2 class="seccion-titulo">Información de <em>Envío</em></h2>
            <div class="auth-required-banner">
              Tu privacidad es nuestra prioridad. Los envíos se realizan de forma 100% discreta, sin logos ni descripciones del contenido.
            </div>

            <form id="checkout-form" class="checkout-form">
              <div class="form-grid">
                <div class="form-group full">
                  <label for="nombre">Nombre Completo</label>
                  <input type="text" id="nombre" name="nombre" required 
                    value="${lastAddress?.name || user?.name || ''}" 
                    placeholder="Ej. Juan Perez">
                  <span class="error-inline" id="err-nombre"></span>
                </div>
                <div class="form-group full">
                  <label for="direccion">Dirección de Entrega</label>
                  <input type="text" id="direccion" name="direccion" required 
                    value="${lastAddress?.address || ''}" 
                    placeholder="Calle, número, apto/casa">
                  <span class="error-inline" id="err-direccion"></span>
                </div>
                <div class="form-group">
                  <label for="ciudad">Ciudad</label>
                  <input type="text" id="ciudad" name="ciudad" required 
                    value="${lastAddress?.city || ''}" 
                    placeholder="Ej. Bogota">
                  <span class="error-inline" id="err-ciudad"></span>
                </div>
                <div class="form-group">
                  <label for="departamento">Departamento</label>
                  <input type="text" id="departamento" name="departamento" required 
                    value="${(lastAddress as any)?.department || ''}" 
                    placeholder="Ej. Cundinamarca">
                  <span class="error-inline" id="err-departamento"></span>
                </div>
                <div class="form-group">
                  <label for="zip">Código Postal</label>
                  <input type="text" id="zip" name="zip" required 
                    value="${lastAddress?.zip || ''}" 
                    placeholder="110111">
                  <span class="error-inline" id="err-zip"></span>
                </div>
                <div class="form-group">
                  <label for="telefono">Teléfono de Contacto</label>
                  <input type="tel" id="telefono" name="telefono" required 
                    value="${lastAddress?.phone || ''}" 
                    placeholder="300 123 4567">
                  <span class="error-inline" id="err-telefono"></span>
                </div>
                <div class="form-group full">
                  <label for="notas">Notas Adicionales (Opcional)</label>
                  <textarea id="notas" name="notas" rows="3" placeholder="Instrucciones especiales para la entrega..."></textarea>
                </div>
              </div>

              <div id="checkout-error-general" class="error-mensaje oculto"></div>

              <button type="submit" id="btn-confirmar-pago" class="btn-primario btn-pago-final">
                <span class="btn-texto">Confirmar y Pagar ${formatCOP(total)}</span>
                <span class="spinner oculto"></span>
              </button>
            </form>
          </div>

          <div class="checkout-summary-section">
            <div class="summary-card">
              <h3 class="summary-title">Resumen del Pedido</h3>
              <div class="summary-items">${summaryHtml}</div>
              <div class="summary-totals">
                <div class="summary-row">
                  <span>Subtotal</span>
                  <span>${formatCOP(total)}</span>
                </div>
                <div class="summary-row">
                  <span>Envío</span>
                  <span>Calculado al pagar</span>
                </div>
                <div class="summary-row total">
                  <span>Total a Pagar</span>
                  <span>${formatCOP(total)}</span>
                </div>
              </div>
              <div class="checkout-politicas-resumen">
                <div class="checkout-politica-item">
                  <div class="checkout-politica-icono">🛡️</div>
                  <div class="checkout-politica-texto">
                    <strong>Cero Comisiones</strong>
                    No cobramos cargos adicionales por el método de pago.
                  </div>
                </div>
                <div class="checkout-politica-item">
                  <div class="checkout-politica-icono">🔒</div>
                  <div class="checkout-politica-texto">
                    <strong>Envío 100% Discreto</strong>
                    Empaque sin logos ni descripciones del contenido.
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  `;

  const form = document.getElementById('checkout-form') as HTMLFormElement;
  const btnSubmit = document.getElementById('btn-confirmar-pago') as HTMLButtonElement;
  const errorGeneral = document.getElementById('checkout-error-general');

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    document.querySelectorAll('.error-inline').forEach(el => el.textContent = '');
    errorGeneral?.classList.add('oculto');

    const formData = new FormData(form);
    const data: ShippingAddress = {
      name: String(formData.get('nombre') ?? '').trim(),
      address: String(formData.get('direccion') ?? '').trim(),
      city: String(formData.get('ciudad') ?? '').trim(),
      country: 'Colombia',
      zip: String(formData.get('zip') ?? '').trim(),
      phone: String(formData.get('telefono') ?? '').trim(),
      notes: String(formData.get('notas') ?? '').trim(),
    };

    let hasError = false;
    ['nombre', 'direccion', 'ciudad', 'departamento', 'zip', 'telefono'].forEach(field => {
      if (!String(formData.get(field) ?? '').trim()) {
        const errEl = document.getElementById(`err-${field}`);
        if (errEl) errEl.textContent = 'Este campo es obligatorio';
        hasError = true;
      }
    });

    if (hasError) return;

    btnSubmit.disabled = true;
    btnSubmit.querySelector('.btn-texto')?.classList.add('oculto');
    btnSubmit.querySelector('.spinner')?.classList.remove('oculto');

    try {
      const response = await createOrderWithShipping(data);

      if (response.checkoutUrl) {
        window.location.href = response.checkoutUrl;
      } else {
        container.innerHTML = `
          <div class="checkout-success-manual">
            <div class="success-icon">!</div>
            <h2 class="seccion-titulo">Pedido <em>Creado</em></h2>
            <p class="verificacion-texto">
              Tu pedido #${response.orderId.slice(0, 8).toUpperCase()} fue registrado, pero tuvimos un problema técnico al generar el link de pago.
            </p>
            <p class="verificacion-texto">Contáctanos por WhatsApp para coordinar el pago.</p>
            <div class="success-actions">
              <a href="https://wa.me/${SOPORTE_WHATSAPP}?text=Hola,%20necesito%20pagar%20mi%20pedido%20${response.orderId}" class="btn-primario" target="_blank" rel="noopener noreferrer">Contactar por WhatsApp</a>
              <a href="/" class="btn-secundario">Volver al inicio</a>
            </div>
          </div>
        `;
      }
    } catch (err) {
      console.error('Error al crear orden:', err);
      if (errorGeneral) {
        const message = err instanceof Error ? err.message : 'Error al procesar el pedido';
        errorGeneral.textContent = /401|autenticado|unauthorized/i.test(message)
          ? 'Tu sesión expiró. Inicia sesión nuevamente para continuar.'
          : message;
        errorGeneral.classList.remove('oculto');
      }
      btnSubmit.disabled = false;
      btnSubmit.querySelector('.btn-texto')?.classList.remove('oculto');
      btnSubmit.querySelector('.spinner')?.classList.add('oculto');
    }
  });
}

