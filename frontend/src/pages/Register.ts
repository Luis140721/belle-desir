// ============================================================
// PAGE - Register
// Formulario de registro de nuevos usuarios
// ============================================================

import { register, saveSession } from '../services/authService.js';

export function initRegisterPage(): void {
  const container = document.getElementById('contenido-principal');
  if (!container) return;

  container.innerHTML = /* html */ `
    <main class="register-page">
      <div class="register-container">
        <section class="register-form-section" style="max-width: 540px; margin: 10vh auto 0;">
          <h2 class="seccion-titulo">Crea tu cuenta en <em>Belle Désir</em></h2>
          <p class="verificacion-texto" style="margin-bottom: 1rem;">
            Regístrate para disfrutar de una experiencia de compra personalizada.
          </p>
          
          <form id="register-form" class="checkout-form" novalidate>
            <div class="form-group full">
              <label for="register-name">Nombre completo</label>
              <input 
                id="register-name" 
                name="name" 
                type="text" 
                required 
                autocomplete="name"
                placeholder="Tu nombre completo"
              >
              <span class="error-inline" id="err-register-name"></span>
            </div>

            <div class="form-group full">
              <label for="register-email">Correo electrónico</label>
              <input 
                id="register-email" 
                name="email" 
                type="email" 
                required 
                autocomplete="email"
                placeholder="tu@email.com"
              >
              <span class="error-inline" id="err-register-email"></span>
            </div>

            <div class="form-group full">
              <label for="register-password">Contraseña</label>
              <div class="password-input-container">
                <input 
                  id="register-password" 
                  name="password" 
                  type="password" 
                  required 
                  autocomplete="new-password"
                  placeholder="Mínimo 8 caracteres"
                  minlength="8"
                >
                <button type="button" id="toggle-password" class="toggle-password-btn" aria-label="Mostrar contraseña">
                  <span class="eye-icon">Mostrar</span>
                </button>
              </div>
              <span class="error-inline" id="err-register-password"></span>
            </div>

            <div class="form-group full">
              <label for="register-confirm-password">Confirmar contraseña</label>
              <div class="password-input-container">
                <input 
                  id="register-confirm-password" 
                  name="confirmPassword" 
                  type="password" 
                  required 
                  autocomplete="new-password"
                  placeholder="Repite tu contraseña"
                >
                <button type="button" id="toggle-confirm-password" class="toggle-password-btn" aria-label="Mostrar contraseña">
                  <span class="eye-icon">Mostrar</span>
                </button>
              </div>
              <span class="error-inline" id="err-register-confirm-password"></span>
            </div>

            <div class="form-group full">
              <label class="checkbox-label">
                <input type="checkbox" id="accept-terms" name="acceptTerms" required>
                <span class="checkbox-custom"></span>
                Acepto los <a href="/terminos" target="_blank" class="link-terminos">términos y condiciones</a>
              </label>
              <span class="error-inline" id="err-accept-terms"></span>
            </div>

            <div id="register-error" class="error-mensaje oculto"></div>
            
            <button id="btn-register" type="submit" class="btn-primario btn-pago-final">
              <span class="btn-text">Crear cuenta</span>
            </button>
          </form>

          <div class="register-footer">
            <p>¿Ya tienes cuenta? <a href="/login" class="link-login">Inicia sesión</a></p>
          </div>
        </section>
      </div>
    </main>
  `;

  initRegisterForm();
}

function initRegisterForm(): void {
  const form = document.getElementById('register-form') as HTMLFormElement;
  const submitBtn = document.getElementById('btn-register') as HTMLButtonElement;
  const errorDiv = document.getElementById('register-error') as HTMLDivElement;
  
  if (!form || !submitBtn || !errorDiv) return;

  // Toggle password visibility
  const togglePasswordBtn = document.getElementById('toggle-password') as HTMLButtonElement;
  const toggleConfirmPasswordBtn = document.getElementById('toggle-confirm-password') as HTMLButtonElement;
  const passwordInput = document.getElementById('register-password') as HTMLInputElement;
  const confirmPasswordInput = document.getElementById('register-confirm-password') as HTMLInputElement;

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
  const nameInput = document.getElementById('register-name') as HTMLInputElement;
  const emailInput = document.getElementById('register-email') as HTMLInputElement;
  const acceptTermsCheckbox = document.getElementById('accept-terms') as HTMLInputElement;

  nameInput?.addEventListener('blur', () => validateName());
  emailInput?.addEventListener('blur', () => validateEmail());
  passwordInput?.addEventListener('blur', () => validatePassword());
  confirmPasswordInput?.addEventListener('blur', () => validateConfirmPassword());
  acceptTermsCheckbox?.addEventListener('change', () => validateTerms());

  // Form submission
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    // Clear previous errors
    clearErrors();
    
    // Validate all fields
    const isNameValid = validateName();
    const isEmailValid = validateEmail();
    const isPasswordValid = validatePassword();
    const isConfirmPasswordValid = validateConfirmPassword();
    const areTermsAccepted = validateTerms();

    if (!isNameValid || !isEmailValid || !isPasswordValid || !isConfirmPasswordValid || !areTermsAccepted) {
      showError('Por favor, corrige los errores del formulario');
      return;
    }

    // Disable submit button
    submitBtn.disabled = true;
    submitBtn.querySelector('.btn-text')!.textContent = 'Creando cuenta...';

    try {
      const name = nameInput.value.trim();
      const email = emailInput.value.trim();
      const password = passwordInput.value;

      const authResponse = await register(name, email, password);
      
      // Save session
      saveSession(authResponse);

      // Redirect to home
      window.location.href = '/';

    } catch (error) {
      console.error('Registration error:', error);
      
      const errorMessage = error instanceof Error ? error.message : 'Error al crear la cuenta';
      
      if (errorMessage.includes('409') || errorMessage.toLowerCase().includes('already exists')) {
        showError('Este email ya está registrado. <a href="/login">Inicia sesión</a>');
      } else {
        showError(errorMessage);
      }

      // Re-enable submit button
      submitBtn.disabled = false;
      submitBtn.querySelector('.btn-text')!.textContent = 'Crear cuenta';
    }
  });

  // Validation functions
  function validateName(): boolean {
    const nameInput = document.getElementById('register-name') as HTMLInputElement;
    const errorSpan = document.getElementById('err-register-name') as HTMLSpanElement;
    
    if (!nameInput.value.trim()) {
      errorSpan.textContent = 'El nombre es requerido';
      return false;
    }
    
    if (nameInput.value.trim().length < 2) {
      errorSpan.textContent = 'El nombre debe tener al menos 2 caracteres';
      return false;
    }
    
    errorSpan.textContent = '';
    return true;
  }

  function validateEmail(): boolean {
    const emailInput = document.getElementById('register-email') as HTMLInputElement;
    const errorSpan = document.getElementById('err-register-email') as HTMLSpanElement;
    
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

  function validatePassword(): boolean {
    const passwordInput = document.getElementById('register-password') as HTMLInputElement;
    const errorSpan = document.getElementById('err-register-password') as HTMLSpanElement;
    
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
    const passwordInput = document.getElementById('register-password') as HTMLInputElement;
    const confirmPasswordInput = document.getElementById('register-confirm-password') as HTMLInputElement;
    const errorSpan = document.getElementById('err-register-confirm-password') as HTMLSpanElement;
    
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

  function validateTerms(): boolean {
    const acceptTermsCheckbox = document.getElementById('accept-terms') as HTMLInputElement;
    const errorSpan = document.getElementById('err-accept-terms') as HTMLSpanElement;
    
    if (!acceptTermsCheckbox.checked) {
      errorSpan.textContent = 'Debes aceptar los términos y condiciones';
      return false;
    }
    
    errorSpan.textContent = '';
    return true;
  }

  function clearErrors(): void {
    const errorSpans = form.querySelectorAll('.error-inline');
    errorSpans.forEach(span => span.textContent = '');
    errorDiv.classList.add('oculto');
  }

  function showError(message: string): void {
    errorDiv.innerHTML = message;
    errorDiv.classList.remove('oculto');
  }
}
