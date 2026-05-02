const fs = require('fs');
let ts = fs.readFileSync('frontend/src/components/Catalog.ts', 'utf8');

ts = ts.replace(/const filtrados = await getProductsByCategory\(slug\);/g, 
  `currentSlug = slug;
      currentPage = 1;
      const filtrados = await getProductsByCategory(slug, 1, 10);`);

ts = ts.replace(/renderProductos\(filtrados, grid, loading, vacio\);/g, 
  `renderProductos(filtrados.data, grid, loading, vacio);
      updatePagination(filtrados.meta);`);

fs.writeFileSync('frontend/src/components/Catalog.ts', ts);
