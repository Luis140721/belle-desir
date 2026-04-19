// ============================================================
// PAGE - Reset Password
// Formulario para restablecer contraseña con token
// ============================================================

import { buildApiUrl } from '../config/api';

export function initResetPasswordPage(): void {
  const container = document.getElementById('contenido-principal');
  if (!container) return;

  // Obtener token de la URL
  const urlParams = new URLSearchParams(window.location.search);
  const token = urlParams.get('token');
  
  if (!token) {
    // Redirigir a forgot password si no hay token
    window.location.href = '/olvide-mi-contrasena';
    return;
  }

  container.innerHTML = /* html */ `
    <main class="reset-password-page">
      <div class="reset-password-container">
        <section class="reset-password-form-section" style="max-width: 540px; margin: 10vh auto 0;">
          <h2 class="seccion-titulo">Restablecer contraseña</h2>
          <p class="verificacion-texto" style="margin-bottom: 1rem;">
            Ingresa tu nueva contraseña. Asegúrate de que sea segura.
          </p>
          
          <form id="reset-password-form" class="checkout-form" novalidate>
            <input type="hidden" id="reset-token" value="${token}">
            
            <div class="form-group full">
              <label for="reset-password">Nueva contraseña</label>
              <div class="password-input-container">
                <input 
                  id="reset-password" 
                  name="password" 
                  type="password" 
                  required 
                  autocomplete="new-password"
                  placeholder="Mínimo 8 caracteres"
                  minlength="8"
                >
                <button type="button" id="toggle-reset-password" class="toggle-password-btn" aria-label="Mostrar contraseña">
                  <span class="eye-icon">Mostrar</span>
                </button>
              </div>
              <span class="error-inline" id="err-reset-password"></span>
            </div>

            <div class="form-group full">
              <label for="reset-confirm-password">Confirmar nueva contraseña</label>
              <div class="password-input-container">
                <input 
                  id="reset-confirm-password" 
                  name="confirmPassword" 
                  type="password" 
                  required 
                  autocomplete="new-password"
                  placeholder="Repite tu nueva contraseña"
                >
                <button type="button" id="toggle-confirm-reset-password" class="toggle-password-btn" aria-label="Mostrar contraseña">
                  <span class="eye-icon">Mostrar</span>
                </button>
              </div>
              <span class="error-inline" id="err-reset-confirm-password"></span>
            </div>

            <div id="reset-error" class="error-mensaje oculto"></div>
            <div id="reset-success" class="success-mensaje oculto"></div>
            
            <button id="btn-reset" type="submit" class="btn-primario btn-pago-final">
              <span class="btn-text">Restablecer contraseña</span>
            </button>
          </form>

          <div class="reset-password-footer">
            <p>¿Recordaste tu contraseña? <a href="/login" class="link-login">Inicia sesión</a></p>
            <p>¿No recibiste el email? <a href="/olvide-mi-contrasena" class="link-forgot">Solicita uno nuevo</a></p>
          </div>
        </section>
      </div>
    </main>
  `;

  initResetPasswordForm();
}

function initResetPasswordForm(): void {
  const form = document.getElementById('reset-password-form') as HTMLFormElement;
  const submitBtn = document.getElementById('btn-reset') as HTMLButtonElement;
  const errorDiv = document.getElementById('reset-error') as HTMLDivElement;
  const successDiv = document.getElementById('reset-success') as HTMLDivElement;
  const tokenInput = document.getElementById('reset-token') as HTMLInputElement;
  
  if (!form || !submitBtn || !errorDiv || !successDiv || !tokenInput) return;

  // Toggle password visibility
  const togglePasswordBtn = document.getElementById('toggle-reset-password') as HTMLButtonElement;
  const toggleConfirmPasswordBtn = document.getElementById('toggle-confirm-reset-password') as HTMLButtonElement;
  const passwordInput = document.getElementById('reset-password') as HTMLInputElement;
  const confirmPasswordInput = document.getElementById('reset-confirm-password') as HTMLInputElement;

  if (togglePasswordBtn && passwordInput) {
    togglePasswordBtn.addEventListener('click', () => {
      const type = passwordInput.type === 'password' ? 'text' : 'password';
      passwordInput.type = type;
      togglePasswordBtn.querySelector('.eye-icon')!.textContent = type === 'password' ? 'Mostrar' : 'Ocultar';
    });
  }

  if (toggleConfirmPasswordBtn && confirmPasswordInput) {
    toggleConfirmPasswordBtn.addEventListener('click', () => {
      const type = confirmPasswordInput.type === 'password' ? 'text' : 'password';
      confirmPasswordInput.type = type;
      toggleConfirmPasswordBtn.querySelector('.eye-icon')!.textContent = type === 'password' ? 'Mostrar' : 'Ocultar';
    });
  }

  // Real-time validation
  passwordInput?.addEventListener('blur', () => validatePassword());
  confirmPasswordInput?.addEventListener('blur', () => validateConfirmPassword());

  // Form submission
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    // Clear previous messages
    clearMessages();
    
    // Validate all fields
    const isPasswordValid = validatePassword();
    const isConfirmPasswordValid = validateConfirmPassword();

    if (!isPasswordValid || !isConfirmPasswordValid) {
      showError('Por favor, corrige los errores del formulario');
      return;
    }

    // Disable submit button
    submitBtn.disabled = true;
    submitBtn.querySelector('.btn-text')!.textContent = 'Restableciendo...';

    try {
      const password = passwordInput.value;

      const res = await fetch(buildApiUrl('auth/reset-password'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ token: tokenInput.value, password }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || `Error ${res.status}`);
      }

      // Show success message
      showSuccess('¡Contraseña actualizada correctamente! Redirigiendo al login...');
      
      // Redirect to login after 2 seconds
      setTimeout(() => {
        window.location.href = '/login';
      }, 2000);

    } catch (error) {
      console.error('Reset password error:', error);
      
      const errorMessage = error instanceof Error ? error.message : 'Error al restablecer la contraseña';
      
      if (errorMessage.includes('Invalid') || errorMessage.includes('expired')) {
        showError('El link de restablecimiento ha expirado. <a href="/olvide-mi-contrasena">Solicita uno nuevo</a>');
      } else {
        showError(errorMessage);
      }

      // Re-enable submit button
      submitBtn.disabled = false;
      submitBtn.querySelector('.btn-text')!.textContent = 'Restablecer contraseña';
    }
  });

  function validatePassword(): boolean {
    const passwordInput = document.getElementById('reset-password') as HTMLInputElement;
    const errorSpan = document.getElementById('err-reset-password') as HTMLSpanElement;
    
    const password = passwordInput.value;
    
    if (!password) {
      errorSpan.textContent = 'La contraseña es requerida';
      return false;
    }
    
    if (password.length < 8) {
      errorSpan.textContent = 'La contraseña debe tener al menos 8 caracteres';
      return false;
    }
    
    errorSpan.textContent = '';
    return true;
  }

  function validateConfirmPassword(): boolean {
    const passwordInput = document.getElementById('reset-password') as HTMLInputElement;
    const confirmPasswordInput = document.getElementById('reset-confirm-password') as HTMLInputElement;
    const errorSpan = document.getElementById('err-reset-confirm-password') as HTMLSpanElement;
    
    const password = passwordInput.value;
    const confirmPassword = confirmPasswordInput.value;
    
    if (!confirmPassword) {
      errorSpan.textContent = 'Confirma tu contraseña';
      return false;
    }
    
    if (password !== confirmPassword) {
      errorSpan.textContent = 'Las contraseñas no coinciden';
      return false;
    }
    
    errorSpan.textContent = '';
    return true;
  }

  function clearMessages(): void {
    errorDiv.classList.add('oculto');
    successDiv.classList.add('oculto');
    document.getElementById('err-reset-password')!.textContent = '';
    document.getElementById('err-reset-confirm-password')!.textContent = '';
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
