const fs = require('fs');
let ts = fs.readFileSync('frontend/src/components/Catalog.ts', 'utf8');

const target = `  }, { capture: true }); // Usamos capture porque 'scroll' no burbujea
}`;

const replacement = `  }, { capture: true }); // Usamos capture porque 'scroll' no burbujea

  // ── Delegación de eventos: Navbar Dropdown Filtros ──────────
  document.querySelectorAll('.nav-filter-btn').forEach(btn => {
    btn.addEventListener('click', async (e) => {
      const targetEl = e.currentTarget;
      const slug = targetEl.dataset.filter ?? 'todos';
      
      // Buscar si el botón ya existe en la lista de filtros
      const targetBtn = document.querySelector(\`.filtro-btn[data-slug="\${slug}"]\`);
      if (targetBtn) {
        targetBtn.click();
      } else {
        // Si no existe el botón (por ej. categoría sin productos), filtrar directo
        if (!grid) return;
        document.querySelectorAll('.filtro-btn').forEach((b) => b.classList.remove('activo'));
        grid.innerHTML = '';
        setLoading(true, loading);
        if (vacio) vacio.classList.add('oculto');
        try {
          const filtrados = await getProductsByCategory(slug);
          renderProductos(filtrados, grid, loading, vacio);
          requestAnimationFrame(() => initCatalogScrollEffects({ cardsOnly: true }));
        } catch {
          renderError(grid, loading);
        }
      }
    });
  });
}`;

ts = ts.replace(target, replacement);
fs.writeFileSync('frontend/src/components/Catalog.ts', ts);
