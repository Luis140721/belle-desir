// ============================================================
// COMPONENT - User Menu
// Maneja el menú de usuario según el estado de autenticación
// ============================================================

import { isLoggedIn, getAccessToken, clearSession } from '../services/authService.js';

export function initUserMenu(): void {
  const userMenuContainer = document.getElementById('navbar-user');
  if (!userMenuContainer) return;

  renderUserMenu(userMenuContainer);
}

function renderUserMenu(container: HTMLElement): void {
  const isAuthenticated = isLoggedIn();
  
  if (isAuthenticated) {
    renderAuthenticatedMenu(container);
  } else {
    renderGuestMenu(container);
  }
}

function renderAuthenticatedMenu(container: HTMLElement): void {
  // Obtener información del usuario desde localStorage
  const userStr = localStorage.getItem('user');
  const user = userStr ? JSON.parse(userStr) : null;
  const userName = user?.name || 'Usuario';

  container.innerHTML = /* html */ `
    <div class="user-menu authenticated">
      <div class="user-info" id="user-info-trigger">
        <span class="user-name">${escapeHtml(userName)}</span>
        <span class="user-avatar">${userName.charAt(0).toUpperCase()}</span>
      </div>
      
      <div class="user-dropdown" id="user-dropdown">
        <div class="user-dropdown-header">
          <span class="user-dropdown-name">${escapeHtml(userName)}</span>
          <span class="user-dropdown-email">${user?.email || ''}</span>
        </div>
        
        <ul class="user-dropdown-menu">
          <li>
            <a href="/mis-pedidos" class="user-dropdown-link">
              <span class="link-icon">Orders</span>
              Mis pedidos
            </a>
          </li>
          <li>
            <a href="/perfil" class="user-dropdown-link">
              <span class="link-icon">Profile</span>
              Mi perfil
            </a>
          </li>
          <li class="dropdown-divider"></li>
          <li>
            <button type="button" class="user-dropdown-link logout-btn" id="logout-btn">
              <span class="link-icon">Logout</span>
              Cerrar sesión
            </button>
          </li>
        </ul>
      </div>
    </div>
  `;

  // Event listeners
  const userInfoTrigger = document.getElementById('user-info-trigger') as HTMLElement;
  const userDropdown = document.getElementById('user-dropdown') as HTMLElement;
  const logoutBtn = document.getElementById('logout-btn') as HTMLButtonElement;

  if (userInfoTrigger && userDropdown) {
    userInfoTrigger.addEventListener('click', (e) => {
      e.stopPropagation();
      userDropdown.classList.toggle('active');
    });

    // Cerrar dropdown al hacer click fuera
    document.addEventListener('click', (e) => {
      if (!container.contains(e.target as Node)) {
        userDropdown.classList.remove('active');
      }
    });

    // Cerrar dropdown con Escape
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && userDropdown.classList.contains('active')) {
        userDropdown.classList.remove('active');
      }
    });
  }

  if (logoutBtn) {
    logoutBtn.addEventListener('click', handleLogout);
  }
}

function renderGuestMenu(container: HTMLElement): void {
  container.innerHTML = /* html */ `
    <div class="user-menu guest">
      <a href="/login" class="btn-login">Iniciar sesión</a>
      <a href="/registro" class="btn-register">Registrarse</a>
    </div>
  `;
}

async function handleLogout(): Promise<void> {
  try {
    // Llamar al endpoint de logout si hay token
    const token = getAccessToken();
    if (token) {
      await fetch('/api/auth/logout', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
    }
  } catch (error) {
    console.error('Logout error:', error);
  } finally {
    // Limpiar sesión localmente siempre
    clearSession();
    window.location.href = '/';
  }
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}
