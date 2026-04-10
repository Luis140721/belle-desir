import { login, saveSession } from '../services/authService.js';

export function initLoginPage(): void {
  const container = document.getElementById('contenido-principal');
  if (!container) return;

  const params = new URLSearchParams(window.location.search);
  const redirect = params.get('redirect') || '/';

  container.innerHTML = /* html */ `
    <main class="checkout-page">
      <div class="checkout-container">
        <section class="checkout-form-section" style="max-width: 540px; margin: 10vh auto 0;">
          <h2 class="seccion-titulo">Inicia sesión para <em>pagar</em></h2>
          <p class="verificacion-texto" style="margin-bottom: 1rem;">
            Necesitas iniciar sesión para continuar con tu compra.
          </p>
          <form id="login-form" class="checkout-form" novalidate>
            <div class="form-group full">
              <label for="login-email">Correo</label>
              <input id="login-email" name="email" type="email" required autocomplete="email" />
              <span class="error-inline" id="err-login-email"></span>
            </div>
            <div class="form-group full">
              <label for="login-password">Contraseña</label>
              <input id="login-password" name="password" type="password" required autocomplete="current-password" />
              <span class="error-inline" id="err-login-password"></span>
            </div>
            <div id="login-error" class="error-mensaje oculto"></div>
            <button id="btn-login" type="submit" class="btn-primario btn-pago-final">
              <span class="btn-texto">Entrar y continuar</span>
              <span class="spinner oculto"></span>
            </button>
          </form>
        </section>
      </div>
    </main>
  `;

  const form = document.getElementById('login-form') as HTMLFormElement | null;
  const btn = document.getElementById('btn-login') as HTMLButtonElement | null;
  const error = document.getElementById('login-error');

  if (!form || !btn || !error) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    error.classList.add('oculto');
    error.textContent = '';

    const formData = new FormData(form);
    const email = String(formData.get('email') ?? '').trim();
    const password = String(formData.get('password') ?? '');

    (document.getElementById('err-login-email') as HTMLElement).textContent = email ? '' : 'Correo obligatorio';
    (document.getElementById('err-login-password') as HTMLElement).textContent = password ? '' : 'Contraseña obligatoria';
    if (!email || !password) return;

    btn.disabled = true;
    btn.querySelector('.btn-texto')?.classList.add('oculto');
    btn.querySelector('.spinner')?.classList.remove('oculto');

    try {
      const auth = await login(email, password);
      saveSession(auth);
      window.location.href = redirect;
    } catch (err) {
      error.textContent = err instanceof Error ? err.message : 'No fue posible iniciar sesión';
      error.classList.remove('oculto');
    } finally {
      btn.disabled = false;
      btn.querySelector('.btn-texto')?.classList.remove('oculto');
      btn.querySelector('.spinner')?.classList.add('oculto');
    }
  });
}
