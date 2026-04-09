// ============================================================
// ScrollAnimations.ts
// GSAP ScrollTrigger — cubo 3D pin, stagger reveal,
// parallax suave y navbar progresivo.
// Solo se llama desde main.ts después de age:verified.
// ============================================================

import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

// ── Constantes ────────────────────────────────────────────────

const DESKTOP = 769;   // breakpoint a partir del cual se activa el pin

const ETIQUETAS = [
  { inicio: 0.08, fin: 0.32, texto: '✦ Diseño premium',   lado: 'izq' as const },
  { inicio: 0.32, fin: 0.56, texto: '🔒 Envío discreto',  lado: 'der' as const },
  { inicio: 0.56, fin: 0.80, texto: '✓ Pago 100% seguro', lado: 'izq' as const },
  { inicio: 0.80, fin: 1.00, texto: '💜 Hecho con amor',  lado: 'der' as const },
] as const;

// ── Punto de entrada público ──────────────────────────────────

export function initScrollAnimations(): void {
  // Pequeño rAF para que el DOM esté pintado antes de que GSAP mida
  requestAnimationFrame(() => {
    initCubeScrollPin();
    // initStaggerReveal(); // Se comenta temporalmente para restaurar visibilidad
    initParallax();
    initNavbarEnhanced();
  });
}

// ─────────────────────────────────────────────────────────────
// 1. CUBO 3D — ScrollTrigger pin + rotación controlada por scroll
// ─────────────────────────────────────────────────────────────

function initCubeScrollPin(): void {
  const triggerEl = document.querySelector<HTMLElement>('#seccion-cubo');
  const cubo      = document.querySelector<HTMLElement>('.hero-cubo');
  const escena    = document.querySelector<HTMLElement>('.hero-cubo-escena');

  if (!triggerEl || !cubo || !escena) return;

  // En móvil: la animación CSS se mantiene, sin pin
  if (window.innerWidth < DESKTOP) return;

  // GSAP toma el control → pausa la animación CSS
  cubo.style.animation = 'none';
  gsap.set(cubo, { rotateX: -15, rotateY: 0 });

  // Crear etiquetas flotantes y guardar referencias
  const labelEls = crearEtiquetas(escena);

  // Timeline principal: el cubo gira 360° mientras dura el pin
  gsap.timeline({
    scrollTrigger: {
      trigger: triggerEl,
      start:   'top top',
      end:     '+=2400',      // 2 400 px de scroll = 1 vuelta completa
      pin:     true,
      scrub:   1.5,           // suavidad de seguimiento
      onUpdate(self) {
        actualizarEtiquetas(labelEls, self.progress);
      },
    },
  }).to(cubo, {
    rotateX: -15,
    rotateY: 360,
    ease:    'none',
    duration: 1,
  });
}

// ── Etiquetas flotantes ───────────────────────────────────────

function crearEtiquetas(escena: HTMLElement): HTMLElement[] {
  return ETIQUETAS.map((et) => {
    const el = document.createElement('div');
    el.className = `cubo-etiqueta cubo-etiqueta--${et.lado}`;
    el.textContent = et.texto;
    el.setAttribute('aria-hidden', 'true');
    escena.appendChild(el);

    const xInicio = et.lado === 'izq' ? -28 : 28;
    // yPercent: -50 centra verticalmente respecto a top:50% del CSS
    gsap.set(el, { autoAlpha: 0, x: xInicio, yPercent: -50 });
    return el;
  });
}

function actualizarEtiquetas(els: HTMLElement[], progress: number): void {
  ETIQUETAS.forEach((et, i) => {
    const visible  = progress >= et.inicio && progress < et.fin;
    const xOrigen  = et.lado === 'izq' ? -28 : 28;

    gsap.to(els[i], {
      autoAlpha: visible ? 1 : 0,
      x:         visible ? 0 : xOrigen,
      duration:  0.35,
      ease:      'power2.out',
      overwrite: true,
    });
  });
}

// ─────────────────────────────────────────────────────────────
// 2. STAGGER REVEAL — fade + slide-up en cascada
// ─────────────────────────────────────────────────────────────

export function initStaggerReveal(): void {

  // Títulos de sección — cada uno con su propio trigger
  gsap.utils
    .toArray<HTMLElement>('.seccion-titulo, .nosotros-texto-grande')
    .forEach((el) => {
      gsap.from(el, {
        opacity : 0,
        y       : 30,
        duration: 0.8,
        ease    : 'power2.out',
        scrollTrigger: { trigger: el, start: 'top 88%' },
      });
    });

  // Tarjetas de valores — solo opacidad para no romper el grid
  gsap.from('.valor-tarjeta', {
    opacity : 0,
    duration: 0.7,
    stagger : 0.2,
    ease    : 'power1.out',
    scrollTrigger: {
      trigger: '.nosotros-valores',
      start  : 'top 82%',
    },
  });

  // Tarjetas de producto — MutationObserver porque se cargan async
  const grid = document.getElementById('catalogo-grid');
  if (!grid) return;

  const obs = new MutationObserver(() => {
    const cards = grid.querySelectorAll<HTMLElement>('.producto-card');
    if (!cards.length) return;

    obs.disconnect(); // solo animamos la primera carga

    gsap.from(cards, {
      opacity : 0,
      y       : 35,
      duration: 0.5,
      stagger : 0.06,
      ease    : 'power2.out',
      scrollTrigger: {
        trigger: grid,
        start  : 'top 88%',
      },
    });

    ScrollTrigger.refresh();
  });

  obs.observe(grid, { childList: true });
}

// ─────────────────────────────────────────────────────────────
// 3. PARALLAX SUAVE
// ─────────────────────────────────────────────────────────────

function initParallax(): void {
  // Hero: el contenido se desplaza 10% hacia arriba al salir
  // Solo en móvil/tablet donde el hero NO está pinado
  if (window.innerWidth < DESKTOP) {
    gsap.to('.hero-contenido', {
      yPercent: -10,
      ease    : 'none',
      scrollTrigger: {
        trigger: '.hero',
        start  : 'top top',
        end    : 'bottom top',
        scrub  : true,
      },
    });
  }

  // Nosotros: el bloque de misión sube ligeramente al entrar
  gsap.from('.nosotros-mision', {
    yPercent: 6,
    ease    : 'none',
    scrollTrigger: {
      trigger: '.nosotros',
      start  : 'top bottom',
      end    : 'center center',
      scrub  : true,
    },
  });
}

// ─────────────────────────────────────────────────────────────
// 4. NAVBAR — backdrop-blur y opacidad progresivos al scrollear
// ─────────────────────────────────────────────────────────────

function initNavbarEnhanced(): void {
  const navbar = document.querySelector<HTMLElement>('.navbar');
  if (!navbar) return;

  window.addEventListener(
    'scroll',
    () => {
      const p = Math.min(window.scrollY / 250, 1); // 0 → 1 en los primeros 250 px

      // blur: 20px → 36px
      const blur  = 20 + p * 16;
      // fondo: rgba(18,11,24,.7) → rgba(18,11,24,.95)
      const alpha = 0.7 + p * 0.25;

      navbar.style.backdropFilter                          = `blur(${blur}px)`;
      (navbar.style as unknown as Record<string, string>)['webkitBackdropFilter'] = `blur(${blur}px)`;
      navbar.style.background                              = `rgba(18, 11, 24, ${alpha.toFixed(2)})`;
    },
    { passive: true }
  );
}
