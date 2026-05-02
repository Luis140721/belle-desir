// ============================================================
// MAIN.TS - Orquestador principal
// Importa CSS, inicializa AgeVerification y arranca la app
// cuando el usuario puede entrar al sitio.
// ============================================================

import './css/base.css';
import './css/components.css';
import './css/layout.css';
import './css/responsive.css';

import { initAgeVerification } from './components/AgeVerification.js';
import { on } from './utils/events.js';
import { initRouter } from './router.js';

function initApp(): void {
  initRouter();
}

on('age:verified', initApp, { once: true });
initAgeVerification();
