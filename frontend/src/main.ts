// ============================================================
// MAIN.TS — Orquestador principal
// Importa CSS → inicializa AgeVerification → espera age:verified
// → inicializa el resto de componentes
// ============================================================

// ── CSS (Vite los inyecta en orden) ──────────────────────────
import './css/base.css';
import './css/components.css';
import './css/layout.css';
import './css/responsive.css';

// ── Componentes ───────────────────────────────────────────────
import { initAgeVerification } from './components/AgeVerification.js';
import { initNavbar }          from './components/Navbar.js';
import { initCatalogo }        from './components/Catalog.js';
import { initCartSidebar }     from './components/CartSidebar.js';
import { initScrollAnimations } from './components/ScrollAnimations.js';
import { on }                  from './utils/events.js';

// AgeVerification siempre se inicializa primero
initAgeVerification();

function initApp(): void {
  initNavbar();
  initCartSidebar();
  initCatalogo();       // async: carga el catálogo en paralelo
  initScrollAnimations(); // GSAP: se auto-aplaza con rAF interno
}

// Si ya verificó la edad en localStorage, arrancamos directamente
if (localStorage.getItem('edadVerificada') === 'true') {
  initApp();
} else {
  // Si no, esperamos el evento age:verified (emitido por AgeVerification)
  on('age:verified', initApp, { once: true });
}
