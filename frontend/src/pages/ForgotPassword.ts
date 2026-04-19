// ============================================================
// PAGE - Forgot Password
// Formulario para solicitar recuperación de contraseña
// ============================================================

import { buildApiUrl } from '../config/api';

export function initForgotPasswordPage(): void {
  const container = document.getElementById('contenido-principal');
  if (!container) return;

  container.innerHTML = /* html */ `
    <main class="forgot-password-page">
      <div class="forgot-password-container">
        <section class="forgot-password-form-section" style="max-width: 540px; margin: 10vh auto 0;">
          <h2 class="seccion-titulo">¿Olvidaste tu contraseña?</h2>
          <p class="verificacion-texto" style="margin-bottom: 1rem;">
            Ingresa tu email y te enviaremos las instrucciones para restablecer tu contraseña.
          </p>
          
          <form id="forgot-password-form" class="checkout-form" novalidate>
            <div class="form-group full">
              <label for="forgot-email">Correo electrónico</label>
              <input 
                id="forgot-email" 
                name="email" 
                type="email" 
                required 
                autocomplete="email"
                placeholder="tu@email.com"
              >
              <span class="error-inline" id="err-forgot-email"></span>
            </div>

            <div id="forgot-error" class="error-mensaje oculto"></div>
            <div id="forgot-success" class="success-mensaje oculto"></div>
            
            <button id="btn-forgot" type="submit" class="btn-primario btn-pago-final">
              <span class="btn-text">Enviar instrucciones</span>
            </button>
          </form>

          <div class="forgot-password-footer">
            <p>¿Recordaste tu contraseña? <a href="/login" class="link-login">Inicia sesión</a></p>
          </div>
        </section>
      </div>
    </main>
  `;

  initForgotPasswordForm();
}

function initForgotPasswordForm(): void {
  const form = document.getElementById('forgot-password-form') as HTMLFormElement;
  const submitBtn = document.getElementById('btn-forgot') as HTMLButtonElement;
  const errorDiv = document.getElementById('forgot-error') as HTMLDivElement;
  const successDiv = document.getElementById('forgot-success') as HTMLDivElement;
  
  if (!form || !submitBtn || !errorDiv || !successDiv) return;

  // Real-time validation
  const emailInput = document.getElementById('forgot-email') as HTMLInputElement;
  emailInput?.addEventListener('blur', () => validateEmail());

  // Form submission
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    // Clear previous messages
    clearMessages();
    
    // Validate email
    const isEmailValid = validateEmail();
    if (!isEmailValid) {
      showError('Por favor, corrige los errores del formulario');
      return;
    }

    // Disable submit button
    submitBtn.disabled = true;
    submitBtn.querySelector('.btn-text')!.textContent = 'Enviando...';

    try {
      const email = emailInput.value.trim();

      const res = await fetch(buildApiUrl('auth/forgot-password'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      if (!res.ok) {
        throw new Error(`Error ${res.status}`);
      }

      // Always show success message (even if email doesn't exist for security)
      showSuccess('Revisa tu email, te enviamos las instrucciones para restablecer tu contraseña.');
      
      // Disable form after successful submission
      submitBtn.disabled = true;
      submitBtn.querySelector('.btn-text')!.textContent = 'Enviado';
      emailInput.disabled = true;

    } catch (error) {
      console.error('Forgot password error:', error);
      
      const errorMessage = error instanceof Error ? error.message : 'Error al enviar las instrucciones';
      showError(errorMessage);

      // Re-enable submit button
      submitBtn.disabled = false;
      submitBtn.querySelector('.btn-text')!.textContent = 'Enviar instrucciones';
    }
  });

  function validateEmail(): boolean {
    const emailInput = document.getElementById('forgot-email') as HTMLInputElement;
    const errorSpan = document.getElementById('err-forgot-email') as HTMLSpanElement;
    
    const email = emailInput.value.trim();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    
    if (!email) {
      errorSpan.textContent = 'El email es requerido';
      return false;
    }
    
    if (!emailRegex.test(email)) {
      errorSpan.textContent = 'Ingresa un email válido';
      return false;
    }
    
    errorSpan.textContent = '';
    return true;
  }

  function clearMessages(): void {
    errorDiv.classList.add('oculto');
    successDiv.classList.add('oculto');
    document.getElementById('err-forgot-email')!.textContent = '';
  }

  function showError(message: string): void {
    errorDiv.innerHTML = message;
    errorDiv.classList.remove('oculto');
    successDiv.classList.add('oculto');
  }

  function showSuccess(message: string): void {
    successDiv.innerHTML = message;
    successDiv.classList.remove('oculto');
    errorDiv.classList.add('oculto');
  }
}
