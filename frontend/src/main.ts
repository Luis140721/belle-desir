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

function initApp(): void {
  initRouter();
}

// ESCUCHAMOS el evento para arrancar la app primero
on('age:verified', initApp, { once: true });

// Luego inicializamos la verificación (que emitirá el evento de inmediato si ya está verificado)
initAgeVerification();
