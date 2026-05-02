import { emit } from '../utils/events.js';
import { isLoggedIn } from '../services/authService.js';

export function initAgeVerification(): void {
  const overlay = document.getElementById('verificacion-edad') as HTMLDivElement | null;
  const contenido = document.getElementById('contenido-principal') as HTMLDivElement | null;
  const btnEntrar = document.getElementById('btn-entrar') as HTMLButtonElement | null;
  const btnSalir = document.getElementById('btn-salir') as HTMLButtonElement | null;

  if (!overlay || !contenido || !btnEntrar || !btnSalir) return;

  function mostrarContenido(): void {
    overlay!.style.display = 'none';
    contenido!.classList.remove('oculto');
    emit('age:verified');
  }

  // Authenticated users can continue directly. Visitors must confirm age on
  // every page load; we intentionally do not persist age confirmation locally.
  if (isLoggedIn()) {
    mostrarContenido();
    return;
  }

  btnEntrar.addEventListener('click', mostrarContenido);

  btnSalir.addEventListener('click', () => {
    window.location.href = 'https://www.google.com';
  });
}
