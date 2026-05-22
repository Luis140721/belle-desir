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

export function initCatalogScrollEffects(options: { cardsOnly?: boolean } = {}): void {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  const catalog = document.getElementById('catalogo');
  const heading = catalog?.querySelector<HTMLElement>('.catalogo-encabezado');
  const filters = catalog?.querySelectorAll<HTMLElement>('.filtro-btn');
  const grid = document.getElementById('catalogo-grid');
  // Solo animamos las tarjetas que NO han sido animadas aún si se solicita
  const cards = options.cardsOnly 
    ? grid?.querySelectorAll<HTMLElement>('.producto-card:not([data-animated])')
    : grid?.querySelectorAll<HTMLElement>('.producto-card');

  if (!catalog || !grid || !cards || cards.length === 0) return;

  if (!options.cardsOnly && heading && !heading.dataset.scrollAnimated) {
    heading.dataset.scrollAnimated = 'true';
    gsap.from(heading, {
      autoAlpha: 0,
      y: 36,
      duration: 0.9,
      ease: 'power3.out',
      scrollTrigger: {
        trigger: heading,
        start: 'top 84%',
      },
    });
  }

  if (!options.cardsOnly && filters?.length && !catalog.dataset.filtersAnimated) {
    catalog.dataset.filtersAnimated = 'true';
    gsap.from(filters, {
      y: 12,
      autoAlpha: 0,
      duration: 0.45,
      stagger: 0.05,
      ease: 'power2.out',
      clearProps: 'transform,opacity,visibility',
      scrollTrigger: {
        trigger: '.catalogo-filtros-wrapper',
        start: 'top 88%',
      },
    });
  }

  // Marcar como animadas para evitar repetir en futuros "Cargar más"
  cards.forEach(c => c.dataset.animated = 'true');

  ScrollTrigger.getAll()
    .filter((trigger) => trigger.vars.id === 'catalog-cards-reveal')
    .forEach((trigger) => trigger.kill());

  gsap.set(cards, {
    autoAlpha: 0,
    y: 42,
    scale: 0.96,
    rotateX: 4,
    transformOrigin: '50% 80%',
  });

  gsap.to(cards, {
    autoAlpha: 1,
    y: 0,
    scale: 1,
    rotateX: 0,
    duration: 0.7,
    stagger: {
      each: 0.055,
      from: 'start',
    },
    ease: 'power3.out',
    // Si son tarjetas nuevas, las animamos de inmediato sin esperar al scroll
    // (porque el usuario ya está ahí al darle clic al botón)
    scrollTrigger: options.cardsOnly ? undefined : {
      id: 'catalog-cards-reveal',
      trigger: grid,
      start: 'top 82%',
      once: true,
    },
  });

  ScrollTrigger.refresh();
}

// ─────────────────────────────────────────────────────────────
// 1. CUBO 3D — ScrollTrigger pin + rotación controlada por scroll
// ─────────────────────────────────────────────────────────────

function initCubeScrollPin(): void {
  const triggerEl = document.querySelector<HTMLElement>('#seccion-cubo');
  const cubo      = document.querySelector<HTMLElement>('.hero-cubo');
  const escena    = document.querySelector<HTMLElement>('.hero-cubo-escena');

  if (!triggerEl || !cubo || !escena) return;

  const isDesktop = window.innerWidth >= DESKTOP;

  cubo.style.animation = 'none';
  gsap.set(cubo, { rotateX: isDesktop ? -15 : -12, rotateY: 0 });

  const labelEls = crearEtiquetas(escena);

  // ── Helper: forzar que la sección pineada ocupe el viewport real ──
  // El navegador mobile cambia el viewport al colapsar la barra de direcciones.
  // GSAP cachea la altura al inicio → queda mal en scroll-down.
  let pinActive = false;

  function syncHeight() {
    if (!isDesktop && pinActive && triggerEl) {
      triggerEl.style.height = window.innerHeight + 'px';
    }
  }

  gsap.timeline({
    scrollTrigger: {
      trigger: triggerEl,
      start: 'top top',
      end: isDesktop ? '+=2400' : '+=800',
      pin: true,
      pinSpacing: true,
      scrub: isDesktop ? 1.5 : 1,
      anticipatePin: 1,
      invalidateOnRefresh: true,
      onToggle(self) {
        pinActive = self.isActive;
        if (!isDesktop) {
          if (self.isActive) {
            syncHeight();
          }
        }
      },
      onUpdate(self) {
        // En mobile, sincronizar altura en cada frame de scroll
        // para seguir el cambio del viewport (barra de direcciones)
        if (!isDesktop && self.isActive) {
          syncHeight();
        }
        if (labelEls.length) actualizarEtiquetas(labelEls, self.progress);
      },
    },
  }).to(cubo, {
    rotateX: isDesktop ? -15 : -12,
    rotateY: 360,
    ease: 'none',
    duration: 1,
  });

  // Escuchar cambios del visual viewport (barra de direcciones)
  if (!isDesktop && window.visualViewport) {
    window.visualViewport.addEventListener('resize', syncHeight, { passive: true });
  }
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
