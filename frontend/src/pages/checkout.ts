import {
  createOrderWithShipping,
  getCart,
} from '../services/checkoutService.js';
import { isLoggedIn } from '../services/authService.js';
import { formatCOP } from '../utils/currency.js';
import type { CartResponse, ShippingAddress } from '../types/index.js';

const SOPORTE_WHATSAPP = '573159739914';

export async function initCheckoutPage(): Promise<void> {
  const container = document.getElementById('contenido-principal');
  if (!container) return;

  if (!isLoggedIn()) {
    window.location.href = '/login?redirect=/checkout';
    return;
  }

  let cart: CartResponse | null = null;

  try {
    cart = await getCart();
  } catch (err) {
    console.error('Error al cargar carrito:', err);
    container.innerHTML = `<p class="error-mensaje">Error al cargar el carrito. Por favor inicia sesion nuevamente e intenta de nuevo.</p>`;
    return;
  }

  const total = cart?.total ?? 0;

  if (!cart?.items?.length) {
    container.innerHTML = `
      <main class="checkout-page">
        <div class="checkout-vacio">
          <h2 class="seccion-titulo">Tu carrito esta <em>vacio</em></h2>
          <p class="verificacion-texto">Agrega algunos productos antes de proceder al pago.</p>
          <a href="/" class="btn-primario">Volver a la tienda</a>
        </div>
      </main>
    `;
    return;
  }

  const summaryHtml = cart.items.map(item => `
    <div class="summary-item">
      <div class="summary-item-img">
        <img src="${item.product.images[0] || ''}" alt="${item.product.name}">
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
            <h2 class="seccion-titulo">Informacion de <em>Envio</em></h2>
            <div class="auth-required-banner">
              Para comprar en Belle Desir debes tener una cuenta e iniciar sesion. Esto protege tu pedido, tu historial y la trazabilidad del pago.
            </div>

            <form id="checkout-form" class="checkout-form">
              <div class="form-grid">
                <div class="form-group full">
                  <label for="nombre">Nombre Completo</label>
                  <input type="text" id="nombre" name="nombre" required placeholder="Ej. Juan Perez">
                  <span class="error-inline" id="err-nombre"></span>
                </div>
                <div class="form-group full">
                  <label for="direccion">Direccion de Entrega</label>
                  <input type="text" id="direccion" name="direccion" required placeholder="Calle, numero, apto/casa">
                  <span class="error-inline" id="err-direccion"></span>
                </div>
                <div class="form-group">
                  <label for="ciudad">Ciudad</label>
                  <input type="text" id="ciudad" name="ciudad" required placeholder="Ej. Bogota">
                  <span class="error-inline" id="err-ciudad"></span>
                </div>
                <div class="form-group">
                  <label for="departamento">Departamento</label>
                  <input type="text" id="departamento" name="departamento" required placeholder="Ej. Cundinamarca">
                  <span class="error-inline" id="err-departamento"></span>
                </div>
                <div class="form-group">
                  <label for="zip">Codigo Postal</label>
                  <input type="text" id="zip" name="zip" required placeholder="110111">
                  <span class="error-inline" id="err-zip"></span>
                </div>
                <div class="form-group">
                  <label for="telefono">Telefono de Contacto</label>
                  <input type="tel" id="telefono" name="telefono" required placeholder="300 123 4567">
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
                  <span>Envio</span>
                  <span class="envio-gratis">GRATIS</span>
                </div>
                <div class="summary-row total">
                  <span>Total a Pagar</span>
                  <span>${formatCOP(total)}</span>
                </div>
              </div>
              <p class="pago-seguro">Pago 100% seguro procesado por Bold Colombia</p>
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
              Tu pedido #${response.orderId.slice(0, 8).toUpperCase()} fue registrado, pero tuvimos un problema tecnico al generar el link de pago.
            </p>
            <p class="verificacion-texto">Contactanos por WhatsApp para coordinar el pago.</p>
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
          ? 'Tu sesion expiro. Inicia sesion nuevamente para continuar.'
          : message;
        errorGeneral.classList.remove('oculto');
      }
      btnSubmit.disabled = false;
      btnSubmit.querySelector('.btn-texto')?.classList.remove('oculto');
      btnSubmit.querySelector('.spinner')?.classList.add('oculto');
    }
  });
}
