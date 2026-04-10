// ============================================================
// PAGE — Checkout
// Formulario de envío y resumen de pedido
// ============================================================

import {
  createGuestOrder,
  createOrderWithShipping,
  getCart,
  getCartItems,
} from '../services/checkoutService.js';
import { isLoggedIn } from '../services/authService.js';
import { formatCOP } from '../utils/currency.js';
import type { CartResponse, ShippingAddress } from '../types/index.js';

const SOPORTE_WHATSAPP = '573159739914';

export async function initCheckoutPage(): Promise<void> {
  const container = document.getElementById('contenido-principal');
  if (!container) return;

  const loggedIn = isLoggedIn();

  // 1. Cargar carrito según el tipo de usuario
  let cart: CartResponse | null = null;
  let guestItems = getCartItems();
  let total = 0;

  try {
    if (loggedIn) {
      cart = await getCart();
      total = cart?.total ?? 0;
    } else {
      total = guestItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
    }
  } catch (err) {
    console.error('Error al cargar carrito:', err);
    container.innerHTML = `<p class="error-mensaje">Error al cargar el carrito. Por favor intenta de nuevo.</p>`;
    return;
  }

  const hasItems = loggedIn ? Boolean(cart?.items?.length) : guestItems.length > 0;
  if (!hasItems) {
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

  const summaryHtml = loggedIn
    ? (cart?.items ?? []).map(item => `
        <div class="summary-item">
          <div class="summary-item-img">
            <img src="${item.product.images[0] || ''}" alt="${item.product.name}">
          </div>
          <div class="summary-item-info">
            <p class="item-nombre">${item.product.name}</p>
            <p class="item-meta">Cant: ${item.quantity} × ${formatCOP(Number(item.product.price))}</p>
          </div>
          <div class="summary-item-total">
            ${formatCOP(Number(item.product.price) * item.quantity)}
          </div>
        </div>
      `).join('')
    : guestItems.map(item => `
        <div class="summary-item">
          <div class="summary-item-img">
            ${item.image ? `<img src="${item.image}" alt="${item.name}">` : ''}
          </div>
          <div class="summary-item-info">
            <p class="item-nombre">${item.name}</p>
            <p class="item-meta">Cant: ${item.quantity} × ${formatCOP(item.price)}</p>
          </div>
          <div class="summary-item-total">
            ${formatCOP(item.price * item.quantity)}
          </div>
        </div>
      `).join('');

  // 2. Renderizar estructura de la página
  container.innerHTML = /* html */ `
    <main class="checkout-page">
    <div class="checkout-container">
      <div class="checkout-layout">
        <!-- Izquierda: Formulario -->
        <div class="checkout-form-section">
          <h2 class="seccion-titulo">Información de <em>Envío</em></h2>
          ${!loggedIn ? `
            <div class="guest-login-banner">
              ¿Ya tienes cuenta? <a href="/login?redirect=/checkout">Inicia sesión para guardar tu historial →</a>
            </div>
          ` : ''}
          <form id="checkout-form" class="checkout-form">
            ${!loggedIn ? `
              <div class="guest-info-section">
                <p class="guest-info-title">Tus datos de contacto</p>
                <div class="form-grid">
                  <div class="form-group full">
                    <label for="guestNombre">Nombre completo</label>
                    <input type="text" id="guestNombre" name="guestNombre" required placeholder="Ej. Juan Pérez">
                    <span class="error-inline" id="err-guestNombre"></span>
                  </div>
                  <div class="form-group">
                    <label for="guestEmail">Email</label>
                    <input type="email" id="guestEmail" name="guestEmail" required placeholder="tu@email.com">
                    <span class="error-inline" id="err-guestEmail"></span>
                  </div>
                  <div class="form-group">
                    <label for="guestPhone">Teléfono</label>
                    <input type="tel" id="guestPhone" name="guestPhone" required placeholder="300 123 4567">
                    <span class="error-inline" id="err-guestPhone"></span>
                  </div>
                </div>
              </div>
            ` : ''}
            <div class="form-grid">
              <div class="form-group full">
                <label for="nombre">Nombre Completo</label>
                <input type="text" id="nombre" name="nombre" required placeholder="Ej. Juan Pérez">
                <span class="error-inline" id="err-nombre"></span>
              </div>
              <div class="form-group full">
                <label for="direccion">Dirección de Entrega</label>
                <input type="text" id="direccion" name="direccion" required placeholder="Calle, número, apto/casa">
                <span class="error-inline" id="err-direccion"></span>
              </div>
              <div class="form-group">
                <label for="ciudad">Ciudad</label>
                <input type="text" id="ciudad" name="ciudad" required placeholder="Ej. Bogotá">
                <span class="error-inline" id="err-ciudad"></span>
              </div>
              <div class="form-group">
                <label for="departamento">Departamento</label>
                <input type="text" id="departamento" name="departamento" required placeholder="Ej. Cundinamarca">
                <span class="error-inline" id="err-departamento"></span>
              </div>
              <div class="form-group">
                <label for="zip">Código Postal</label>
                <input type="text" id="zip" name="zip" required placeholder="110111">
                <span class="error-inline" id="err-zip"></span>
              </div>
              <div class="form-group">
                <label for="telefono">Teléfono de Contacto</label>
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

        <!-- Derecha: Resumen sticky -->
        <div class="checkout-summary-section">
          <div class="summary-card">
            <h3 class="summary-title">Resumen del Pedido</h3>
            <div class="summary-items">
              ${summaryHtml}
            </div>
            <div class="summary-totals">
              <div class="summary-row">
                <span>Subtotal</span>
                <span>${formatCOP(total)}</span>
              </div>
              <div class="summary-row">
                <span>Envío</span>
                <span class="envio-gratis">¡GRATIS!</span>
              </div>
              <div class="summary-row total">
                <span>Total a Pagar</span>
                <span>${formatCOP(total)}</span>
              </div>
            </div>
            <p class="pago-seguro">🔒 Pago 100% seguro procesado por Bold Colombia</p>
          </div>
        </div>
      </div>
    </div></main>
  `;

  // 4. Manejo del formulario
  const form = document.getElementById('checkout-form') as HTMLFormElement;
  const btnSubmit = document.getElementById('btn-confirmar-pago') as HTMLButtonElement;
  const errorGeneral = document.getElementById('checkout-error-general');

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    // Resetear errores
    document.querySelectorAll('.error-inline').forEach(el => el.textContent = '');
    errorGeneral?.classList.add('oculto');

    const formData = new FormData(form);

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const data: ShippingAddress = {
        name: formData.get('nombre') as string,
        address: formData.get('direccion') as string,
        city: formData.get('ciudad') as string,
        country: 'Colombia',
        zip: formData.get('zip') as string,
        phone: formData.get('telefono') as string,
        notes: formData.get('notas') as string,
    };

    // Validación básica
    let hasError = false;
    const requiredFields = ['nombre', 'direccion', 'ciudad', 'departamento', 'zip', 'telefono'];
    if (!loggedIn) {
      requiredFields.push('guestNombre', 'guestEmail', 'guestPhone');
    }

    requiredFields.forEach(field => {
      if (!String(formData.get(field) ?? '').trim()) {
        const errEl = document.getElementById(`err-${field}`);
        if (errEl) errEl.textContent = 'Este campo es obligatorio';
        hasError = true;
      }
    });

    if (!loggedIn) {
      const guestEmail = String(formData.get('guestEmail') ?? '').trim();
      if (guestEmail && !emailRegex.test(guestEmail)) {
        const errEl = document.getElementById('err-guestEmail');
        if (errEl) errEl.textContent = 'Ingresa un email valido';
        hasError = true;
      }
    }

    if (hasError) return;

    // Iniciar loading
    btnSubmit.disabled = true;
    btnSubmit.querySelector('.btn-texto')?.classList.add('oculto');
    btnSubmit.querySelector('.spinner')?.classList.remove('oculto');

    try {
      const response = loggedIn
        ? await createOrderWithShipping(data)
        : await createGuestOrder({
            guestInfo: {
              name: String(formData.get('guestNombre') ?? '').trim(),
              email: String(formData.get('guestEmail') ?? '').trim(),
              phone: String(formData.get('guestPhone') ?? '').trim(),
            },
            shippingAddress: data,
            items: guestItems,
          });
      
      if (response.checkoutUrl) {
        // Redirigir a Bold
        window.location.href = response.checkoutUrl;
      } else {
        // Bold falló pero se creó la orden
        container.innerHTML = `
          <div class="checkout-success-manual">
            <div class="success-icon">⚠️</div>
            <h2 class="seccion-titulo">Pedido <em>Creado</em></h2>
            <p class="verificacion-texto">
              Tu pedido #${response.orderId.slice(0, 8).toUpperCase()} ha sido registrado, 
              pero tuvimos un problema técnico al generar el link de pago.
            </p>
            <p class="verificacion-texto">Tu pedido fue creado. Contáctanos por WhatsApp para coordinar el pago.</p>
            <div class="success-actions">
              <a href="https://wa.me/${SOPORTE_WHATSAPP}?text=Hola,%20necesito%20pagar%20mi%20pedido%20${response.orderId}" 
                 class="btn-primario" target="_blank">Contactar por WhatsApp</a>
              <a href="/" class="btn-secundario">Volver al inicio</a>
            </div>
          </div>
        `;
      }
    } catch (err) {
      console.error('Error al crear orden:', err);
      if (errorGeneral) {
        const message = err instanceof Error ? err.message : 'Error al procesar el pedido';
        if (/401/.test(message) || /autenticado/i.test(message) || /unauthorized/i.test(message)) {
          errorGeneral.textContent = 'Tu sesión expiró. Inicia sesión nuevamente para continuar.';
        } else if (/400/.test(message) || /carrito/i.test(message)) {
          errorGeneral.textContent = message || 'No se pudo crear la orden. Revisa tu carrito e intenta de nuevo.';
        } else {
          errorGeneral.textContent = message;
        }
        errorGeneral.classList.remove('oculto');
      }
      btnSubmit.disabled = false;
      btnSubmit.querySelector('.btn-texto')?.classList.remove('oculto');
      btnSubmit.querySelector('.spinner')?.classList.add('oculto');
    }
  });
}
