const fs = require('fs');
let html = fs.readFileSync('frontend/index.html', 'utf8');

const target = `      <div class="catalogo-vacio oculto" id="catalogo-vacio">
        <p>No se encontraron productos en esta categoría.</p>
      </div>`;

const replacement = `      <div class="catalogo-vacio oculto" id="catalogo-vacio">
        <p>No se encontraron productos en esta categoría.</p>
      </div>

      <div class="catalogo-load-more oculto" id="catalogo-load-more" style="text-align: center; margin-top: 3rem;">
        <button class="btn-secundario" id="btn-load-more">Cargar más productos</button>
      </div>`;

html = html.replace(target, replacement);
fs.writeFileSync('frontend/index.html', html);
