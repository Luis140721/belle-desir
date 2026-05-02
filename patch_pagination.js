const fs = require('fs');
let ts = fs.readFileSync('frontend/src/components/Catalog.ts', 'utf8');

// Update initCatalogo to define state variables and load more event listener
ts = ts.replace(
  `let todosLosProductos: Product[] = [];

  try {
    todosLosProductos = await getAllProducts();
    renderProductos(todosLosProductos, grid, loading, vacio);
    initFiltros(todosLosProductos, filtros, grid, loading, vacio);
    requestAnimationFrame(() => initCatalogScrollEffects());
  } catch (err) {`,
  `let todosLosProductos: Product[] = [];
  let currentPage = 1;
  let currentSlug = 'todos';

  const loadMoreBtn = document.getElementById('btn-load-more');
  const loadMoreContainer = document.getElementById('catalogo-load-more');

  function updatePagination(meta) {
    if (meta.hasNextPage) {
      loadMoreContainer?.classList.remove('oculto');
    } else {
      loadMoreContainer?.classList.add('oculto');
    }
  }

  if (loadMoreBtn) {
    loadMoreBtn.addEventListener('click', async () => {
      currentPage++;
      const oldHtml = loadMoreBtn.innerHTML;
      loadMoreBtn.innerHTML = 'Cargando...';
      try {
        const paginated = await getProductsByCategory(currentSlug, currentPage);
        // append to grid
        const newHtml = paginated.data.map(ProductCard).join('');
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

  try {
    const paginated = await getAllProducts(1, 10);
    todosLosProductos = paginated.data;
    renderProductos(todosLosProductos, grid, loading, vacio);
    updatePagination(paginated.meta);
    initFiltros(todosLosProductos, filtros, grid, loading, vacio);
    requestAnimationFrame(() => initCatalogScrollEffects());
  } catch (err) {`
);

// Update initFiltros to handle pagination
ts = ts.replace(
  `    try {
      const slug = btn.dataset.slug ?? 'todos';
      const filtrados = await getProductsByCategory(slug);
      renderProductos(filtrados, grid, loading, vacio);
      requestAnimationFrame(() => initCatalogScrollEffects({ cardsOnly: true }));
    } catch {`,
  `    try {
      const slug = btn.dataset.slug ?? 'todos';
      currentSlug = slug;
      currentPage = 1;
      const filtrados = await getProductsByCategory(slug, 1, 10);
      renderProductos(filtrados.data, grid, loading, vacio);
      updatePagination(filtrados.meta);
      requestAnimationFrame(() => initCatalogScrollEffects({ cardsOnly: true }));
    } catch {`
);

// Update nav listener
ts = ts.replace(
  `        try {
          const filtrados = await getProductsByCategory(slug);
          renderProductos(filtrados, grid, loading, vacio);
          requestAnimationFrame(() => initCatalogScrollEffects({ cardsOnly: true }));
        } catch {`,
  `        try {
          currentSlug = slug;
          currentPage = 1;
          const filtrados = await getProductsByCategory(slug, 1, 10);
          renderProductos(filtrados.data, grid, loading, vacio);
          updatePagination(filtrados.meta);
          requestAnimationFrame(() => initCatalogScrollEffects({ cardsOnly: true }));
        } catch {`
);

fs.writeFileSync('frontend/src/components/Catalog.ts', ts);
