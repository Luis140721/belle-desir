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

import { initAgeVerification } from './components/AgeVerification.js';
import { on }                  from './utils/events.js';
import { initRouter } from './router.js';

// AgeVerification siempre se inicializa primero
initAgeVerification();

function initApp(): void {
  initRouter();
}

// Si ya verificó la edad en localStorage, arrancamos directamente
if (localStorage.getItem('edadVerificada') === 'true') {
  initApp();
} else {
  // Si no, esperamos el evento age:verified (emitido por AgeVerification)
  on('age:verified', initApp, { once: true });
}
