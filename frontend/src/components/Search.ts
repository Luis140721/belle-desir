// ============================================================
// COMPONENT - Search
// Funcionalidad de búsqueda con dropdown y debounce
// ============================================================

import { formatCOP, toNumber } from '../utils/currency.js';

interface SearchResult {
  id: string;
  name: string;
  slug: string;
  price: number | string;
  images: string[];
}

export function initSearch(): void {
  const searchBtn = document.getElementById('btn-search') as HTMLAnchorElement | null;
  const navbar = document.querySelector('.navbar') as HTMLElement | null;
  
  if (!searchBtn || !navbar) return;

  let searchContainer: HTMLElement | null = null;
  let searchInput: HTMLInputElement | null = null;
  let searchDropdown: HTMLElement | null = null;
  let searchResults: SearchResult[] = [];
  let debounceTimer: number | null = null;

  // Crear contenedor de búsqueda
  function createSearchContainer(): void {
    if (!navbar) return;
    
    searchContainer = document.createElement('div');
    searchContainer.className = 'search-container';
    searchContainer.innerHTML = `
      <div class="search-input-wrapper">
        <input 
          type="text" 
          class="search-input" 
          placeholder="Buscar productos..."
          autocomplete="off"
        >
        <button type="button" class="search-close-btn" aria-label="Cerrar búsqueda">
          ×
        </button>
      </div>
      <div class="search-dropdown">
        <div class="search-results"></div>
        <div class="search-loading" style="display: none;">
          <span class="loading-spinner">Buscando...</span>
        </div>
        <div class="search-no-results" style="display: none;">
          <p>No se encontraron productos</p>
        </div>
      </div>
    `;

    navbar.appendChild(searchContainer);
    searchInput = searchContainer.querySelector('.search-input') as HTMLInputElement;
    searchDropdown = searchContainer.querySelector('.search-dropdown') as HTMLElement;

    // Event listeners
    searchInput.addEventListener('input', handleSearchInput);
    searchInput.addEventListener('keydown', handleSearchKeydown);
    
    const closeBtn = searchContainer.querySelector('.search-close-btn') as HTMLButtonElement;
    closeBtn.addEventListener('click', closeSearch);

    // Cerrar búsqueda al hacer click fuera
    document.addEventListener('click', handleDocumentClick);
  }

  // Abrir búsqueda
  searchBtn.addEventListener('click', (e) => {
    e.preventDefault();
    if (!searchContainer) {
      createSearchContainer();
    }
    showSearch();
  });

  // Manejar input de búsqueda con debounce
  function handleSearchInput(e: Event): void {
    const query = (e.target as HTMLInputElement).value.trim();
    
    if (debounceTimer) {
      clearTimeout(debounceTimer);
    }

    if (query.length < 2) {
      hideDropdown();
      return;
    }

    // Mostrar loading
    showLoading();

    debounceTimer = window.setTimeout(() => {
      performSearch(query);
    }, 400);
  }

  // Realizar búsqueda
  async function performSearch(query: string): Promise<void> {
    try {
      const res = await fetch(`/api/products?search=${encodeURIComponent(query)}&limit=5`);
      if (!res.ok) throw new Error('Search failed');
      
      const data = await res.json();
      searchResults = data.data;
      
      renderSearchResults();
    } catch (error) {
      console.error('Search error:', error);
      showNoResults();
    }
  }

  // Renderizar resultados
  function renderSearchResults(): void {
    if (!searchDropdown) return;

    const resultsContainer = searchDropdown.querySelector('.search-results') as HTMLElement;
    const loadingEl = searchDropdown.querySelector('.search-loading') as HTMLElement;
    const noResultsEl = searchDropdown.querySelector('.search-no-results') as HTMLElement;

    loadingEl.style.display = 'none';
    noResultsEl.style.display = 'none';

    if (searchResults.length === 0) {
      showNoResults();
      return;
    }

    resultsContainer.innerHTML = searchResults.map(product => `
      <a href="/producto/${product.slug}" class="search-result-item" data-slug="${product.slug}">
        <div class="search-result-image">
          ${product.images?.[0] 
            ? `<img src="${product.images[0]}" alt="${product.name}" loading="lazy">`
            : `<div class="search-result-placeholder">${product.name.charAt(0).toUpperCase()}</div>`
          }
        </div>
        <div class="search-result-info">
          <h4 class="search-result-name">${escapeHtml(product.name)}</h4>
          <p class="search-result-price">${formatCOP(toNumber(product.price))}</p>
        </div>
      </a>
    `).join('');

    // Agregar event listeners a los resultados
    const resultItems = resultsContainer.querySelectorAll('.search-result-item') as NodeListOf<HTMLAnchorElement>;
    resultItems.forEach(item => {
      item.addEventListener('click', (e) => {
        e.preventDefault();
        const slug = item.dataset.slug;
        if (slug) {
          window.location.href = `/producto/${slug}`;
        }
      });
    });

    showDropdown();
  }

  // Manejar teclas en búsqueda
  function handleSearchKeydown(e: KeyboardEvent): void {
    if (e.key === 'Escape') {
      closeSearch();
    }
  }

  // Cerrar búsqueda al hacer click fuera
  function handleDocumentClick(e: MouseEvent): void {
    if (searchContainer && !searchContainer.contains(e.target as Node) && searchBtn && !searchBtn.contains(e.target as Node)) {
      closeSearch();
    }
  }

  // Funciones de UI
  function showSearch(): void {
    if (searchContainer) {
      searchContainer.classList.add('active');
      searchInput?.focus();
    }
  }

  function closeSearch(): void {
    if (searchContainer) {
      searchContainer.classList.remove('active');
      searchInput!.value = '';
      hideDropdown();
    }
  }

  function showDropdown(): void {
    if (searchDropdown) {
      searchDropdown.classList.add('active');
    }
  }

  function hideDropdown(): void {
    if (searchDropdown) {
      searchDropdown.classList.remove('active');
    }
  }

  function showLoading(): void {
    if (searchDropdown) {
      const loadingEl = searchDropdown.querySelector('.search-loading') as HTMLElement;
      const noResultsEl = searchDropdown.querySelector('.search-no-results') as HTMLElement;
      const resultsContainer = searchDropdown.querySelector('.search-results') as HTMLElement;
      
      loadingEl.style.display = 'block';
      noResultsEl.style.display = 'none';
      resultsContainer.innerHTML = '';
      showDropdown();
    }
  }

  function showNoResults(): void {
    if (searchDropdown) {
      const loadingEl = searchDropdown.querySelector('.search-loading') as HTMLElement;
      const noResultsEl = searchDropdown.querySelector('.search-no-results') as HTMLElement;
      const resultsContainer = searchDropdown.querySelector('.search-results') as HTMLElement;
      
      loadingEl.style.display = 'none';
      noResultsEl.style.display = 'block';
      resultsContainer.innerHTML = '';
      showDropdown();
    }
  }

  // Función auxiliar
  function escapeHtml(str: string): string {
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }
}
