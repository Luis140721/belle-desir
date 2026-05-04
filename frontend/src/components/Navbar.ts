// ============================================================
// COMPONENT — Navbar
// Maneja el menú hamburguesa y la clase "scrolled"
// ============================================================

import { initUserMenu } from './UserMenu.js';

export function initNavbar(): void {
  const btnMenu = document.getElementById('btn-menu') as HTMLButtonElement | null;
  const menu    = document.getElementById('navbar-menu') as HTMLUListElement | null;
  const navbar  = document.querySelector('.navbar') as HTMLElement | null;

  // ── Menú hamburguesa ──────────────────────────────────────
  if (btnMenu && menu) {
    btnMenu.addEventListener('click', () => {
      const abierto = menu.classList.toggle('abierto');
      btnMenu.classList.toggle('abierto', abierto);
      btnMenu.setAttribute('aria-expanded', String(abierto));
      btnMenu.setAttribute('aria-label', abierto ? 'Cerrar menú' : 'Abrir menú');
    });

    // Cierra el menú al pulsar cualquier enlace
    menu.querySelectorAll('a').forEach((link) => {
      link.addEventListener('click', () => {
        menu.classList.remove('abierto');
        btnMenu.classList.remove('abierto');
        btnMenu.setAttribute('aria-expanded', 'false');
        btnMenu.setAttribute('aria-label', 'Abrir menú');
      });
    });

    // Cierra el menú con Escape
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && menu.classList.contains('abierto')) {
        menu.classList.remove('abierto');
        btnMenu.classList.remove('abierto');
        btnMenu.setAttribute('aria-expanded', 'false');
        btnMenu.focus();
      }
    });
  }

  // ── Menú Catálogo (Dropdown por Click) ───────────────────
  const dropdowns = document.querySelectorAll('.navbar-dropdown');
  
  dropdowns.forEach(dropdown => {
    const toggle = dropdown.querySelector('.dropdown-toggle');
    if (!toggle) return;

    toggle.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      const isActive = dropdown.classList.contains('active');
      
      // Cerrar otros dropdowns si los hubiera
      dropdowns.forEach(d => d.classList.remove('active'));
      
      if (!isActive) {
        dropdown.classList.add('active');
      }
    });
  });

  // Cerrar al hacer click fuera
  document.addEventListener('click', () => {
    dropdowns.forEach(d => d.classList.remove('active'));
  });

  // Cerrar al seleccionar opción
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
