// ============================================================
// COMPONENT — CheckoutModal
// Modal glassmorphism con dos flujos:
//   Tab 1 — Invitado (prioritario): solo email + datos envío
//   Tab 2 — Con cuenta: login / registro
// Se abre cuando el usuario pulsa "Ir a pagar" en CartSidebar.
// ============================================================

import type { CartItem } from '../types/index.js';
import {
  createGuestOrder,
  createAuthOrder,
  abrirWidgetWompi,
  type CartItemPayload,
} from '../services/checkoutService.js';
import {
  login,
  register,
  saveSession,
  isLoggedIn,
} from '../services/authService.js';

// ── Inyectar el HTML del modal en el DOM ─────────────────────

export function inyectarCheckoutModal(): void {
  if (document.getElementById('checkout-modal')) return;

  const tpl = document.createElement('div');
  tpl.innerHTML = /* html */ `
    <!-- Overlay -->
    <div id="checkout-modal" class="chk-overlay" aria-hidden="true" role="dialog"
         aria-modal="true" aria-labelledby="chk-titulo">

      <div class="chk-caja" role="document">

        <!-- Cabecera -->
        <div class="chk-cabecera">
          <h2 id="chk-titulo" class="chk-titulo">Finalizar compra</h2>
          <button id="chk-btn-cerrar" class="chk-btn-cerrar" aria-label="Cerrar">✕</button>
        </div>

        <!-- Tabs -->
        <div class="chk-tabs" role="tablist">
          <button class="chk-tab activo" role="tab" aria-selected="true"
                  data-panel="panel-invitado" id="tab-invitado">
            Continuar como invitado
          </button>
          <button class="chk-tab" role="tab" aria-selected="false"
                  data-panel="panel-cuenta" id="tab-cuenta">
            Ya tengo cuenta
          </button>
        </div>

        <!-- ── PANEL INVITADO ── -->
        <div id="panel-invitado" class="chk-panel" role="tabpanel"
             aria-labelledby="tab-invitado">
          <p class="chk-hint">Sin necesidad de crear una cuenta. Rápido y discreto.</p>

          <form id="form-invitado" class="chk-form" novalidate>

            <div class="chk-campo">
              <label for="inv-email">Email <span class="chk-req">*</span></label>
              <input id="inv-email" type="email" name="email"
                     placeholder="tu@email.com" required autocomplete="email">
            </div>

            <div class="chk-campo">
              <label for="inv-nombre">Nombre completo</label>
              <input id="inv-nombre" type="text" name="nombre"
                     placeholder="Tu nombre" autocomplete="name">
            </div>

            <div class="chk-campo">
              <label for="inv-telefono">Teléfono (opcional)</label>
              <input id="inv-telefono" type="tel" name="telefono"
                     placeholder="+57 300 000 0000" autocomplete="tel">
            </div>

            <div class="chk-separador">
              <span>Dirección de envío</span>
            </div>

            <div class="chk-campo">
              <label for="inv-direccion">Dirección <span class="chk-req">*</span></label>
              <input id="inv-direccion" type="text" name="direccion"
                     placeholder="Calle, número, barrio" required autocomplete="street-address">
            </div>

            <div class="chk-fila-2">
              <div class="chk-campo">
                <label for="inv-ciudad">Ciudad <span class="chk-req">*</span></label>
                <input id="inv-ciudad" type="text" name="ciudad"
                       placeholder="Bogotá" required autocomplete="address-level2">
              </div>
              <div class="chk-campo">
                <label for="inv-pais">País</label>
                <input id="inv-pais" type="text" name="pais"
                       value="Colombia" autocomplete="country-name">
              </div>
            </div>

            <p id="inv-error" class="chk-error oculto"></p>

            <button type="submit" class="btn-primario chk-btn-submit" id="inv-submit">
              Ir a pagar con Wompi
            </button>
          </form>
        </div>

        <!-- ── PANEL CON CUENTA ── -->
        <div id="panel-cuenta" class="chk-panel oculto" role="tabpanel"
             aria-labelledby="tab-cuenta">

          <!-- Sub-tabs dentro del panel: Login / Registro -->
          <div class="chk-subtabs">
            <button class="chk-subtab activo" data-subpanel="sub-login"
                    id="subtab-login">Iniciar sesión</button>
            <button class="chk-subtab" data-subpanel="sub-registro"
                    id="subtab-registro">Crear cuenta</button>
          </div>

          <!-- Login -->
          <div id="sub-login" class="chk-subpanel">
            <form id="form-login" class="chk-form" novalidate>
              <div class="chk-campo">
                <label for="log-email">Email</label>
                <input id="log-email" type="email" name="email"
                       placeholder="tu@email.com" required autocomplete="email">
              </div>
              <div class="chk-campo">
                <label for="log-pass">Contraseña</label>
                <input id="log-pass" type="password" name="password"
                       placeholder="••••••••" required autocomplete="current-password">
              </div>
              <p id="log-error" class="chk-error oculto"></p>
              <button type="submit" class="btn-primario chk-btn-submit" id="log-submit">
                Entrar e ir a pagar
              </button>
            </form>
          </div>

          <!-- Registro -->
          <div id="sub-registro" class="chk-subpanel oculto">
            <form id="form-registro" class="chk-form" novalidate>
              <div class="chk-campo">
                <label for="reg-nombre">Nombre completo</label>
                <input id="reg-nombre" type="text" name="nombre"
                       placeholder="Tu nombre" required autocomplete="name">
              </div>
              <div class="chk-campo">
                <label for="reg-email">Email</label>
                <input id="reg-email" type="email" name="email"
                       placeholder="tu@email.com" required autocomplete="email">
              </div>
              <div class="chk-campo">
                <label for="reg-pass">Contraseña</label>
                <input id="reg-pass" type="password" name="password"
                       placeholder="Mínimo 6 caracteres" required
                       minlength="6" autocomplete="new-password">
              </div>
              <p id="reg-error" class="chk-error oculto"></p>
              <button type="submit" class="btn-primario chk-btn-submit" id="reg-submit">
                Crear cuenta e ir a pagar
              </button>
            </form>
          </div>

        </div>
        <!-- FIN panel-cuenta -->

      </div>
    </div>
  `;
  document.body.appendChild(tpl.firstElementChild!);
}

// ── initCheckoutModal ──────────────────────────────────────────

export function initCheckoutModal(getItems: () => CartItem[]): void {
  inyectarCheckoutModal();

  const modal   = document.getElementById('checkout-modal')!;
  const overlay = modal;

  // Cierre del modal
  const cerrar = (): void => {
    modal.classList.remove('abierto');
    modal.setAttribute('aria-hidden', 'true');
  };
  const abrir = (): void => {
    modal.classList.add('abierto');
    modal.setAttribute('aria-hidden', 'false');
    // Si ya tiene sesión activa, muestra el tab "Con cuenta"
    if (isLoggedIn()) activarTab('panel-cuenta');
    else activarTab('panel-invitado');
  };

  document.getElementById('chk-btn-cerrar')!.addEventListener('click', cerrar);
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) cerrar();
  });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && modal.classList.contains('abierto')) cerrar();
  });

  // ── Tabs principales ─────────────────────────────────────
  modal.querySelectorAll<HTMLButtonElement>('.chk-tab').forEach((btn) => {
    btn.addEventListener('click', () => activarTab(btn.dataset.panel!));
  });

  // ── Sub-tabs (login / registro) ──────────────────────────
  modal.querySelectorAll<HTMLButtonElement>('.chk-subtab').forEach((btn) => {
    btn.addEventListener('click', () => activarSubtab(btn.dataset.subpanel!));
  });

  // ── Formulario INVITADO ──────────────────────────────────
  document.getElementById('form-invitado')!.addEventListener('submit', async (e) => {
    e.preventDefault();
    const errEl     = document.getElementById('inv-error')!;
    const submitBtn = document.getElementById('inv-submit') as HTMLButtonElement;

    const email     = (document.getElementById('inv-email') as HTMLInputElement).value.trim();
    const nombre    = (document.getElementById('inv-nombre') as HTMLInputElement).value.trim();
    const telefono  = (document.getElementById('inv-telefono') as HTMLInputElement).value.trim();
    const direccion = (document.getElementById('inv-direccion') as HTMLInputElement).value.trim();
    const ciudad    = (document.getElementById('inv-ciudad') as HTMLInputElement).value.trim();
    const pais      = (document.getElementById('inv-pais') as HTMLInputElement).value.trim();

    if (!email || !direccion || !ciudad) {
      mostrarError(errEl, 'Por favor completa los campos obligatorios (*)');
      return;
    }

    setLoading(submitBtn, true, 'Procesando...');
    ocultarError(errEl);

    try {
      const items = buildItems(getItems());
      const data  = await createGuestOrder({
        guestEmail:  email,
        guestName:   nombre || 'Invitado',
        guestPhone:  telefono || undefined,
        items,
        shippingAddress: {
          name:    nombre || 'Invitado',
          email,
          phone:   telefono || undefined,
          address: direccion,
          city:    ciudad,
          country: pais || 'Colombia',
        },
      });
      cerrar();
      abrirWidgetWompi(data);
    } catch (err) {
      mostrarError(errEl, err instanceof Error ? err.message : 'Error al procesar el pedido');
    } finally {
      setLoading(submitBtn, false, 'Ir a pagar con Wompi');
    }
  });

  // ── Formulario LOGIN ─────────────────────────────────────
  document.getElementById('form-login')!.addEventListener('submit', async (e) => {
    e.preventDefault();
    const errEl     = document.getElementById('log-error')!;
    const submitBtn = document.getElementById('log-submit') as HTMLButtonElement;

    const email    = (document.getElementById('log-email') as HTMLInputElement).value.trim();
    const password = (document.getElementById('log-pass') as HTMLInputElement).value;

    if (!email || !password) {
      mostrarError(errEl, 'Completa email y contraseña');
      return;
    }

    setLoading(submitBtn, true, 'Iniciando sesión...');
    ocultarError(errEl);

    try {
      const auth = await login(email, password);
      saveSession(auth);
      await procesarConCuenta(auth.accessToken, getItems, cerrar);
    } catch (err) {
      mostrarError(errEl, err instanceof Error ? err.message : 'Error al iniciar sesión');
    } finally {
      setLoading(submitBtn, false, 'Entrar e ir a pagar');
    }
  });

  // ── Formulario REGISTRO ──────────────────────────────────
  document.getElementById('form-registro')!.addEventListener('submit', async (e) => {
    e.preventDefault();
    const errEl     = document.getElementById('reg-error')!;
    const submitBtn = document.getElementById('reg-submit') as HTMLButtonElement;

    const nombre   = (document.getElementById('reg-nombre') as HTMLInputElement).value.trim();
    const email    = (document.getElementById('reg-email') as HTMLInputElement).value.trim();
    const password = (document.getElementById('reg-pass') as HTMLInputElement).value;

    if (!nombre || !email || !password) {
      mostrarError(errEl, 'Completa todos los campos');
      return;
    }
    if (password.length < 6) {
      mostrarError(errEl, 'La contraseña debe tener mínimo 6 caracteres');
      return;
    }

    setLoading(submitBtn, true, 'Creando cuenta...');
    ocultarError(errEl);

    try {
      const auth = await register(nombre, email, password);
      saveSession(auth);
      await procesarConCuenta(auth.accessToken, getItems, cerrar);
    } catch (err) {
      mostrarError(errEl, err instanceof Error ? err.message : 'Error al crear la cuenta');
    } finally {
      setLoading(submitBtn, false, 'Crear cuenta e ir a pagar');
    }
  });

  // Expone la función abrir para que CartSidebar la use
  (modal as any).__abrir = abrir;
}

/** Abre el modal desde fuera del componente */
export function abrirCheckoutModal(): void {
  const modal = document.getElementById('checkout-modal');
  if (modal && typeof (modal as any).__abrir === 'function') {
    (modal as any).__abrir();
  }
}

// ── Helpers privados ──────────────────────────────────────────

function activarTab(panelId: string): void {
  document.querySelectorAll('.chk-tab').forEach((tab) => {
    const isActive = (tab as HTMLElement).dataset.panel === panelId;
    tab.classList.toggle('activo', isActive);
    tab.setAttribute('aria-selected', String(isActive));
  });
  document.querySelectorAll('.chk-panel').forEach((panel) => {
    panel.classList.toggle('oculto', panel.id !== panelId);
  });
}

function activarSubtab(panelId: string): void {
  document.querySelectorAll('.chk-subtab').forEach((btn) => {
    btn.classList.toggle('activo', (btn as HTMLElement).dataset.subpanel === panelId);
  });
  document.querySelectorAll('.chk-subpanel').forEach((panel) => {
    panel.classList.toggle('oculto', panel.id !== panelId);
  });
}

function buildItems(cartItems: CartItem[]): CartItemPayload[] {
  return cartItems.map((i) => ({ productId: i.id, quantity: i.quantity }));
}

async function procesarConCuenta(
  token: string,
  getItems: () => CartItem[],
  cerrar: () => void
): Promise<void> {
  const items = buildItems(getItems());
  const data  = await createAuthOrder(
    {
      items,
      shippingAddress: {
        name:    'Usuario',
        address: 'Pendiente',
        city:    'Colombia',
        country: 'Colombia',
      },
    },
    token
  );
  cerrar();
  abrirWidgetWompi(data);
}

function mostrarError(el: HTMLElement, msg: string): void {
  el.textContent = msg;
  el.classList.remove('oculto');
}

function ocultarError(el: HTMLElement): void {
  el.textContent = '';
  el.classList.add('oculto');
}

function setLoading(btn: HTMLButtonElement, loading: boolean, label: string): void {
  btn.disabled    = loading;
  btn.textContent = label;
}
