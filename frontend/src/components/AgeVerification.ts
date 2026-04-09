// ============================================================
// COMPONENT — AgeVerification
// Muestra el overlay de verificación de edad o lo omite
// si el usuario ya verificó en una sesión anterior.
// ============================================================

import { emit } from '../utils/events.js';

export function initAgeVerification(): void {
  const overlay   = document.getElementById('verificacion-edad') as HTMLDivElement | null;
  const contenido = document.getElementById('contenido-principal') as HTMLDivElement | null;
  const btnEntrar = document.getElementById('btn-entrar') as HTMLButtonElement | null;
  const btnSalir  = document.getElementById('btn-salir') as HTMLButtonElement | null;

  if (!overlay || !contenido || !btnEntrar || !btnSalir) return;

  function mostrarContenido(): void {
    overlay!.style.display = 'none';
    contenido!.classList.remove('oculto');
    emit('age:verified');
  }

  // Si ya había verificado antes, mostramos el contenido directamente
  if (localStorage.getItem('edadVerificada') === 'true') {
    mostrarContenido();
    return;
  }

  // Si no, esperamos que haga clic
  btnEntrar.addEventListener('click', () => {
    localStorage.setItem('edadVerificada', 'true');
    mostrarContenido();
  });

  btnSalir.addEventListener('click', () => {
    window.location.href = 'https://www.google.com';
  });
}
