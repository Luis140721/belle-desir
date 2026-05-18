// ============================================================
// COMPONENT — Catalog
// Carga productos del backend, renderiza tarjetas,
// genera filtros por categoría y maneja estados UI
// ============================================================

import type { Product, Category } from '../types/index.js';
import { getProductsByCategory } from '../services/productService.js';
import { getAllCategories } from '../services/categoryService.js';
import { ProductCard } from './ProductCard.js';
import { emit } from '../utils/events.js';
import { toNumber } from '../utils/currency.js';
import { flyToCart, findCartIcon } from '../utils/cartAnimation.js';
import { initCatalogScrollEffects } from './ScrollAnimations.js';
import { openProductModal } from './ProductModal.js';

let currentProducts: Product[] = [];
const ALL_PRODUCTS_SLUG = 'todos';

export async function initCatalogo(): Promise<void> {
  const grid     = document.getElementById('catalogo-grid') as HTMLDivElement | null;
  const loading  = document.getElementById('catalogo-loading') as HTMLDivElement | null;
  const vacio    = document.getElementById('catalogo-vacio') as HTMLDivElement | null;
  const filtros  = document.getElementById('catalogo-filtros') as HTMLDivElement | null;
  const loadMoreBtn = document.getElementById('btn-load-more') as HTMLButtonElement | null;
  const loadMoreContainer = document.getElementById('catalogo-load-more') as HTMLDivElement | null;

  if (!grid) return;

  let currentPage = 1;
  let currentSlug = ALL_PRODUCTS_SLUG;

  function updatePagination(meta: any) {
    // meta.page < meta.totalPages
    if (meta && meta.page < meta.totalPages) {
      loadMoreContainer?.classList.remove('oculto');
    } else {
      loadMoreContainer?.classList.add('oculto');
    }
  }

  // ── Estado de carga inicial ───────────────────────────────
  setLoading(true, loading);

  try {
    // 1. Cargar Categorías primero para los filtros
    const categories = await getAllCategories();
    const visibleCategories = categories.filter((category) => !category._count || category._count.products > 0);
    currentSlug = getInitialCategorySlug(visibleCategories);
    syncNavCategoryFilters(visibleCategories);
    initFiltros(visibleCategories, filtros, grid, loading, vacio, updatePagination, currentSlug, (slug, page) => {
      currentSlug = slug;
      currentPage = page;
    });

    // 2. Cargar primera tanda de productos
    const paginated = await getProductsByCategory(currentSlug, 1, 10);
    currentProducts = paginated.data || [];
    renderProductos(currentProducts, grid, loading, vacio);
    updatePagination(paginated.meta);
    
    requestAnimationFrame(() => initCatalogScrollEffects());
  } catch (err) {
    renderError(grid, loading);
  }

  // ── Evento Cargar Más ────────────────────────────────────
  if (loadMoreBtn) {
    loadMoreBtn.addEventListener('click', async () => {
      currentPage++;
      const oldHtml = loadMoreBtn.innerHTML;
      loadMoreBtn.innerHTML = 'Cargando...';
      try {
        const paginated = await getProductsByCategory(currentSlug, currentPage, 10);
        const newProducts = paginated.data || [];
        currentProducts = [...currentProducts, ...newProducts];
        const newHtml = newProducts.map(ProductCard).join('');
        grid.insertAdjacentHTML('beforeend', newHtml);
        updatePagination(paginated.meta);
        requestAnimationFrame(() => initCatalogScrollEffects({ cardsOnly: true }));
      } catch (err) {
        console.error(err);
      } finally {
        loadMoreBtn.innerHTML = oldHtml;
      }
    });
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
      btn.textContent = '+';
      btn.classList.remove('agregado');
      btn.disabled = false;
    }, 1500);
  });

  // ── Delegación de eventos: abrir modal ────────────────────
  grid.addEventListener('click', (e) => {
    const target = e.target as HTMLElement;
    
    // Si hace click en agregar al carrito, no abrir modal
    if (target.closest('.btn-agregar-carrito')) return;

    const card = target.closest('.producto-card') as HTMLElement;
    if (card) {
      const productId = card.dataset.productId;
      const product = currentProducts.find(p => String(p.id) === productId);
      if (product) openProductModal(product);
    }
  });
  
  // ── Delegación de eventos: Scroll para indicadores ──────────
  grid.addEventListener('scroll', (e) => {
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
  }, { capture: true });

  // ── Delegación de eventos: Navbar Dropdown Filtros ──────────
  document.querySelectorAll('.nav-filter-btn').forEach(btn => {
    btn.addEventListener('click', async (e) => {
      const targetEl = e.currentTarget as HTMLElement;
      const slug = targetEl.dataset.filter ?? ALL_PRODUCTS_SLUG;
      
      const targetBtn = document.querySelector(`.filtro-btn[data-slug="${slug}"]`) as HTMLButtonElement | null;
      if (targetBtn) {
        targetBtn.click();
      } else {
        if (!grid) return;
        document.querySelectorAll('.filtro-btn').forEach((b) => b.classList.remove('activo'));
        grid.innerHTML = '';
        setLoading(true, loading);
        if (vacio) vacio.classList.add('oculto');
        try {
          currentSlug = slug;
          currentPage = 1;
          const paginated = await getProductsByCategory(slug, 1, 10);
          currentProducts = paginated.data || [];
          renderProductos(currentProducts, grid, loading, vacio);
          updatePagination(paginated.meta);
          requestAnimationFrame(() => initCatalogScrollEffects({ cardsOnly: true }));
        } catch {
          renderError(grid, loading);
        }
      }
    });
  });
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
      <p>El catalogo esta tardando un poco en cargar.</p>
      <p class="hint">Intenta de nuevo en unos segundos.</p>
      <button onclick="location.reload()" class="btn-secundario">
        Reintentar
      </button>
    </div>
  `;
}

function initFiltros(
  categories: Category[],
  contenedor: HTMLElement | null,
  grid: HTMLElement,
  loading: HTMLElement | null,
  vacio: HTMLElement | null,
  updatePagination: (meta: any) => void,
  activeSlug: string,
  onFilterChange: (slug: string, page: number) => void
): void {
  if (!contenedor) return;

  // Limpiar filtros existentes excepto "Todos" si ya existe o crearlo si no
  let todosBtn = contenedor.querySelector(`.filtro-btn[data-slug="${ALL_PRODUCTS_SLUG}"]`);
  if (!todosBtn) {
    todosBtn = document.createElement('button');
    todosBtn.className = 'filtro-btn';
    (todosBtn as HTMLElement).dataset.slug = ALL_PRODUCTS_SLUG;
    todosBtn.textContent = 'Todos';
    contenedor.appendChild(todosBtn);
  }

  // Eliminar otros botones de filtro para regenerarlos
  contenedor.querySelectorAll('.filtro-btn').forEach(b => {
    if ((b as HTMLElement).dataset.slug !== ALL_PRODUCTS_SLUG) b.remove();
  });

  // Genera botones de categoría
  categories.forEach((cat) => {
    const btn = document.createElement('button');
    btn.className = 'filtro-btn';
    btn.dataset.slug = cat.slug;
    btn.textContent = cat.name;
    contenedor.appendChild(btn);
  });

  const activeFilterSlug = getKnownCategorySlug(activeSlug, categories);
  contenedor.querySelectorAll('.filtro-btn').forEach((button) => {
    const isActive = (button as HTMLElement).dataset.slug === activeFilterSlug;
    button.classList.toggle('activo', isActive);
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
      const slug = btn.dataset.slug ?? ALL_PRODUCTS_SLUG;
      onFilterChange(slug, 1);
      const paginated = await getProductsByCategory(slug, 1, 10);
      currentProducts = paginated.data || [];
      renderProductos(currentProducts, grid, loading, vacio);
      updatePagination(paginated.meta);
      requestAnimationFrame(() => initCatalogScrollEffects({ cardsOnly: true }));
    } catch {
      renderError(grid, loading);
    }
  });
}

function getInitialCategorySlug(categories: Category[]): string {
  const params = new URLSearchParams(window.location.search);
  const category = params.get('categoria') || params.get('category');

  if (!category) return ALL_PRODUCTS_SLUG;

  return getKnownCategorySlug(category, categories);
}

function getKnownCategorySlug(slug: string, categories: Category[]): string {
  const normalizedSlug = normalizeSlug(slug);
  const knownSlugs = new Set(categories.map((category) => category.slug));

  if (normalizedSlug === ALL_PRODUCTS_SLUG || knownSlugs.has(normalizedSlug)) {
    return normalizedSlug;
  }

  return ALL_PRODUCTS_SLUG;
}

function normalizeSlug(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)+/g, '');
}

function syncNavCategoryFilters(categories: Category[]): void {
  const dropdownMenus = document.querySelectorAll<HTMLUListElement>('.navbar-dropdown .dropdown-menu');

  dropdownMenus.forEach((menu) => {
    menu.innerHTML = '';
    menu.appendChild(createNavFilterItem(ALL_PRODUCTS_SLUG, 'Ver todo'));

    categories.forEach((category) => {
      menu.appendChild(createNavFilterItem(category.slug, category.name));
    });
  });
}

function createNavFilterItem(slug: string, label: string): HTMLLIElement {
  const item = document.createElement('li');
  const link = document.createElement('a');

  link.href = '#catalogo';
  link.className = 'nav-filter-btn';
  link.dataset.filter = slug;
  link.textContent = label;

  item.appendChild(link);
  return item;
}
