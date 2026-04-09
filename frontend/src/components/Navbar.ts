// ============================================================
// COMPONENT — Navbar
// Maneja el menú hamburguesa y la clase "scrolled"
// ============================================================

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

  // ── Clase scrolled para efectos futuros ──────────────────
  if (navbar) {
    window.addEventListener(
      'scroll',
      () => navbar.classList.toggle('scrolled', window.scrollY > 50),
      { passive: true }
    );
  }
}
