// ============================================================
// COMPONENT — Navbar
// Maneja el menú hamburguesa, drawer navigation, backdrop y sincronización de overflow
// ============================================================

import { initUserMenu } from './UserMenu.js';

// ── Configuración global ──────────────────────────────────
const body = document.body;
const backdropId = 'navbar-backdrop';
const MOBILE_BREAKPOINT = 768;

let backdrop: HTMLElement | null = null;

// ── Función: Crear backdrop dinámico ──────────────────────
function createBackdrop(): HTMLElement {
  if (backdrop) return backdrop;

  backdrop = document.createElement('div');
  backdrop.id = backdropId;
  backdrop.className = 'navbar-backdrop';
  backdrop.setAttribute('aria-hidden', 'true');
  body.appendChild(backdrop);

  return backdrop;
}

// ── Función: Detectar si estamos en mobile ────────────────
const isMobileNav = (): boolean => window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT}px)`).matches;

// ── Función centralizada: Sincronizar scroll del body ──────
const syncBodyOverflow = (): void => {
  const drawerOpen = body.classList.contains('nav-drawer-open');
  const modalOpen = Boolean(document.querySelector('.product-modal-overlay.active'));
  const cartOpen = Boolean(document.querySelector('.carrito-sidebar.abierto'));
  const anyOverlayOpen = drawerOpen || modalOpen || cartOpen;

  body.style.overflow = anyOverlayOpen ? 'hidden' : '';
};

// ── Función: Cerrar menú ──────────────────────────────────
const closeMenu = (btnMenu: HTMLButtonElement, menu: HTMLUListElement): void => {
  menu.classList.remove('abierto');
  btnMenu.classList.remove('abierto');
  btnMenu.setAttribute('aria-expanded', 'false');
  btnMenu.setAttribute('aria-label', 'Abrir menú');
  body.classList.remove('nav-drawer-open');
  syncBodyOverflow();
};

export function initNavbar(): void {
  const btnMenu = document.getElementById('btn-menu') as HTMLButtonElement | null;
  const menu = document.getElementById('navbar-menu') as HTMLUListElement | null;
  const navbar = document.querySelector('.navbar') as HTMLElement | null;

  // ── Crear backdrop ────────────────────────────────────────
  createBackdrop();

  // ── Menú hamburguesa (toggle drawer en mobile) ────────────
  if (btnMenu && menu) {
    btnMenu.addEventListener('click', (e) => {
      e.stopPropagation();
      const abierto = menu.classList.toggle('abierto');
      btnMenu.classList.toggle('abierto', abierto);
      btnMenu.setAttribute('aria-expanded', String(abierto));
      btnMenu.setAttribute('aria-label', abierto ? 'Cerrar menú' : 'Abrir menú');

      // Solo en mobile: agregar clase al body y sincronizar overlay
      if (isMobileNav()) {
        body.classList.toggle('nav-drawer-open', abierto);
        syncBodyOverflow();
      }
    });

    // ── Cierre al hacer click fuera del menú (solo en mobile) ──
    document.addEventListener('click', (e) => {
      if (!isMobileNav()) return;
      if (menu.contains(e.target as Node) || btnMenu.contains(e.target as Node)) return;

      if (menu.classList.contains('abierto')) {
        closeMenu(btnMenu, menu);
      }
    });

    // ── Cierre al tocar el backdrop ────────────────────────────
    if (backdrop) {
      backdrop.addEventListener('click', () => {
        if (!isMobileNav()) return;
        if (menu.classList.contains('abierto')) {
          closeMenu(btnMenu, menu);
        }
      });
    }

    // ── Cierra al pulsar enlaces (excepto dropdown toggles) ───
    menu.querySelectorAll('a:not(.dropdown-toggle)').forEach((link) => {
      link.addEventListener('click', () => {
        closeMenu(btnMenu, menu);
      });
    });

    // ── Cierra con Escape ──────────────────────────────────────
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && menu.classList.contains('abierto')) {
        closeMenu(btnMenu, menu);
        btnMenu.focus();
      }
    });

    // ── Cierra si se redimensiona a desktop ────────────────────
    window.addEventListener('resize', () => {
      if (!isMobileNav() && menu.classList.contains('abierto')) {
        closeMenu(btnMenu, menu);
      }
    });
  }

  // ── Menú Catálogo (Dropdown por Click) ───────────────────
  const dropdowns = document.querySelectorAll('.navbar-dropdown');

  dropdowns.forEach(dropdown => {
    const toggle = dropdown.querySelector('.dropdown-toggle') as HTMLElement | null;
    if (!toggle) return;

    toggle.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();

      // En mobile dentro del drawer, el comportamiento es diferente
      if (isMobileNav() && menu && menu.contains(dropdown)) {
        // Toggle visible del submenu dentro del drawer (sin cerrar drawer)
        const isActive = dropdown.classList.contains('active');
        dropdowns.forEach(d => {
          if (d !== dropdown && menu.contains(d)) {
            d.classList.remove('active');
          }
        });
        dropdown.classList.toggle('active', !isActive);
        return;
      }

      // En desktop, comportamiento de dropdown normal
      const isActive = dropdown.classList.contains('active');
      dropdowns.forEach(d => {
        if (d !== dropdown) d.classList.remove('active');
      });

      if (!isActive) {
        dropdown.classList.add('active');
      } else {
        dropdown.classList.remove('active');
      }
    });
  });

  // ── Cerrar dropdowns al hacer click fuera (excepto en mobile drawer) ──
  document.addEventListener('click', () => {
    dropdowns.forEach(d => {
      // No cerrar dropdowns dentro del drawer en mobile
      if (isMobileNav() && menu && menu.contains(d)) {
        return;
      }
      d.classList.remove('active');
    });
  });

  // ── Cerrar al seleccionar opción de categoría ───────────────
  document.querySelectorAll('.dropdown-menu a').forEach(link => {
    link.addEventListener('click', () => {
      dropdowns.forEach(d => d.classList.remove('active'));
    });
  });

  // ── Clase scrolled para efectos futuros ──────────────────
  if (navbar) {
    window.addEventListener(
      'scroll',
      () => navbar.classList.toggle('scrolled', window.scrollY > 50),
      { passive: true }
    );
  }

  // Inicializar menú de usuario
  initUserMenu();
}

// ── Exportar funciones para uso desde otros componentes ────
export { syncBodyOverflow };
