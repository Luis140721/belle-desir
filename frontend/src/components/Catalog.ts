// ============================================================
// COMPONENT — Catalog
// Carga productos del backend, renderiza tarjetas,
// genera filtros por categoría y maneja estados UI
// ============================================================

import type { Product } from '../types/index.js';
import { getAllProducts, getProductsByCategory } from '../services/productService.js';
import { ProductCard } from './ProductCard.js';
import { emit } from '../utils/events.js';
import { toNumber } from '../utils/currency.js';
import { flyToCart, findCartIcon } from '../utils/cartAnimation.js';

export async function initCatalogo(): Promise<void> {
  const grid     = document.getElementById('catalogo-grid') as HTMLDivElement | null;
  const loading  = document.getElementById('catalogo-loading') as HTMLDivElement | null;
  const vacio    = document.getElementById('catalogo-vacio') as HTMLDivElement | null;
  const filtros  = document.getElementById('catalogo-filtros') as HTMLDivElement | null;

  if (!grid) return;

  // ── Estado de carga inicial ───────────────────────────────
  setLoading(true, loading);

  let todosLosProductos: Product[] = [];

  try {
    todosLosProductos = await getAllProducts();
    renderProductos(todosLosProductos, grid, loading, vacio);
    initFiltros(todosLosProductos, filtros, grid, loading, vacio);
  } catch (err) {
    console.error('[Belle Désir] Error al cargar catálogo:', err);
    renderError(grid, loading);
  }

  // ── Delegación de eventos: botones "Agregar" ──────────────
  grid.addEventListener('click', (e) => {
    const btn = (e.target as HTMLElement).closest<HTMLButtonElement>('.btn-agregar-carrito');
    if (!btn) return;

    const { id, nombre, precio, imagen } = btn.dataset as {
      id: string; nombre: string; precio: string; imagen: string;
    };

    // Ejecutar animación fly-to-cart desde el botón
    const cartIconEl = findCartIcon();
    
    if (cartIconEl) {
      flyToCart(btn, cartIconEl);
    }

    emit('cart:add', {
      id,
      name: nombre,
      price: toNumber(precio),
      image: imagen ?? '',
      quantity: 1,
    });

    // Feedback visual momentáneo
    btn.textContent = '¡Agregado!';
    btn.classList.add('agregado');
    btn.disabled = true;
    setTimeout(() => {
      btn.textContent = '+ Agregar';
      btn.classList.remove('agregado');
      btn.disabled = false;
    }, 1500);
  });

  // ── Delegación de eventos: botones de carrusel ──────────────
  grid.addEventListener('click', (e) => {
    const target = e.target as HTMLElement;
    
    // Capturar clics en prev/next
    const btn = target.closest<HTMLButtonElement>('.carousel-btn');
    if (btn) {
      // Prevents event from bubbling and maybe causing Catalog bugs
      e.stopPropagation();
      e.preventDefault();
      
      const carousel = btn.closest('.card-carousel');
      const track = carousel?.querySelector('.card-carousel-track') as HTMLElement;
      if (!carousel || !track) return;
      
      const scrollAmount = track.clientWidth;
      if (btn.classList.contains('next-btn')) {
        track.scrollBy({ left: scrollAmount, behavior: 'smooth' });
      } else if (btn.classList.contains('prev-btn')) {
        track.scrollBy({ left: -scrollAmount, behavior: 'smooth' });
      }
      return;
    }
    
    // Capturar clics en los indicadores (puntitos)
    const indicator = target.closest<HTMLElement>('.indicator');
    if (indicator) {
      e.stopPropagation();
      e.preventDefault();
      
      const indicatorSpan = indicator as HTMLElement;
      const carousel = indicatorSpan.closest('.card-carousel');
      const track = carousel?.querySelector('.card-carousel-track') as HTMLElement;
      
      if (!carousel || !track) return;
      
      const dotsContainer = indicatorSpan.parentElement;
      if (dotsContainer) {
        const dotsArray = Array.from(dotsContainer.children);
        const index = dotsArray.indexOf(indicatorSpan);
        if (index !== -1) {
          track.scrollTo({ left: index * track.clientWidth, behavior: 'smooth' });
        }
      }
    }
  });
  
  // ── Delegación de eventos: Scroll para indicadores ──────────
  grid.addEventListener('scroll', (e) => {
    // Si el scroll proviene de un track de carrusel
    const track = e.target as HTMLElement;
    if (!track.classList?.contains('card-carousel-track')) return;
    
    const carousel = track.closest('.card-carousel');
    const indicators = carousel?.querySelectorAll('.indicator');
    if (!carousel || !indicators) return;
    
    const index = Math.round(track.scrollLeft / track.clientWidth);
    indicators.forEach((ind, i) => {
      if (i === index) ind.classList.add('active');
      else ind.classList.remove('active');
    });
  }, { capture: true }); // Usamos capture porque 'scroll' no burbujea
}

// ── Helpers ──────────────────────────────────────────────────

function setLoading(on: boolean, loading: HTMLElement | null): void {
  if (!loading) return;
  on ? loading.classList.remove('oculto') : loading.classList.add('oculto');
}

function renderProductos(
  productos: Product[],
  grid: HTMLElement,
  loading: HTMLElement | null,
  vacio: HTMLElement | null
): void {
  setLoading(false, loading);

  if (!productos.length) {
    vacio?.classList.remove('oculto');
    grid.innerHTML = '';
    return;
  }

  vacio?.classList.add('oculto');
  grid.innerHTML = productos.map(ProductCard).join('');
}

function renderError(grid: HTMLElement, loading: HTMLElement | null): void {
  setLoading(false, loading);
  grid.innerHTML = /* html */ `
    <div class="catalogo-error">
      <p>No pudimos cargar los productos.</p>
      <p class="hint">¿El backend está corriendo?</p>
      <button onclick="location.reload()" class="btn-secundario">
        Reintentar
      </button>
    </div>
  `;
}

function initFiltros(
  productos: Product[],
  contenedor: HTMLElement | null,
  grid: HTMLElement,
  loading: HTMLElement | null,
  vacio: HTMLElement | null
): void {
  if (!contenedor) return;

  // Extrae categorías únicas
  const categorias = [
    ...new Set(
      productos.map((p) => p.category?.slug).filter((s): s is string => Boolean(s))
    ),
  ];

  const nombres: Record<string, string> = {};
  productos.forEach((p) => {
    if (p.category?.slug) nombres[p.category.slug] = p.category.name;
  });

  // Genera botones de categoría
  categorias.forEach((slug) => {
    const btn = document.createElement('button');
    btn.className = 'filtro-btn';
    btn.dataset.slug = slug;
    btn.textContent = nombres[slug] ?? slug;
    contenedor.appendChild(btn);
  });

  // Delegación de clics sobre los filtros
  contenedor.addEventListener('click', async (e) => {
    const btn = (e.target as HTMLElement).closest<HTMLButtonElement>('.filtro-btn');
    if (!btn) return;

    contenedor.querySelectorAll('.filtro-btn').forEach((b) => b.classList.remove('activo'));
    btn.classList.add('activo');

    grid.innerHTML = '';
    setLoading(true, loading);
    vacio?.classList.add('oculto');

    try {
      const slug = btn.dataset.slug ?? 'todos';
      const filtrados = await getProductsByCategory(slug);
      renderProductos(filtrados, grid, loading, vacio);
    } catch {
      renderError(grid, loading);
    }
  });
}
