// ============================================================
// PAGE - Product Detail
// Muestra información completa de un producto con galería de imágenes
// ============================================================

import type { Product } from '../types/index.js';
import { formatCOP, toNumber } from '../utils/currency.js';
import { flyToCart, findCartIcon } from '../utils/cartAnimation.js';
import { emit } from '../utils/events.js';

export async function initProductDetailPage(): Promise<void> {
  const container = document.getElementById('contenido-principal');
  if (!container) return;

  // Obtener slug de la URL
  const pathParts = window.location.pathname.split('/');
  const slug = pathParts[pathParts.length - 1];
  
  if (!slug || slug === '') {
    window.location.href = '/';
    return;
  }

  try {
    // Obtener datos del producto
    const res = await fetch(`/api/products/${slug}`);
    if (!res.ok) {
      if (res.status === 404) {
        renderNotFound(container);
        return;
      }
      throw new Error(`Error ${res.status}`);
    }
    
    const product: Product = await res.json();
    renderProductDetail(container, product);
    
  } catch (error) {
    console.error('Error loading product:', error);
    renderError(container);
  }
}

function renderProductDetail(container: HTMLElement, product: Product): void {
  // Actualizar título de la página
  document.title = `${product.name} - Belle Désir`;
  
  const precio = formatCOP(toNumber(product.price));
  const imagenes = product.images?.length ? product.images : [];
  const inStock = (product as any).inStock ?? product.stock > 0;
  const stockBajo = product.stock > 0 && product.stock <= 5;
  
  container.innerHTML = /* html */ `
    <main class="product-detail-page">
      <div class="product-detail-container">
        <!-- Breadcrumb -->
        <nav class="breadcrumb" style="margin-bottom: 2rem;">
          <a href="/" class="breadcrumb-link">Inicio</a>
          <span class="breadcrumb-separator">/</span>
          ${product.category ? `
            <a href="/?categoria=${product.category.slug}" class="breadcrumb-link">${product.category.name}</a>
            <span class="breadcrumb-separator">/</span>
          ` : ''}
          <span class="breadcrumb-current">${product.name}</span>
        </nav>

        <div class="product-detail-grid">
          <!-- Columna Izquierda: Galería de imágenes -->
          <div class="product-gallery">
            <div class="main-image-container">
              ${imagenes.length > 0 
                ? `<img src="${imagenes[0]}" alt="${product.name}" class="main-image" id="main-image">`
                : `<div class="main-image-placeholder"> <span style="font-size: 4rem;">${product.name.charAt(0).toUpperCase()}</span> </div>`
              }
            </div>
            ${imagenes.length > 1 ? `
              <div class="thumbnail-grid">
                ${imagenes.map((img, index) => `
                  <button 
                    type="button" 
                    class="thumbnail-btn ${index === 0 ? 'active' : ''}"
                    data-image="${img}"
                    data-index="${index}"
                    aria-label="Ver imagen ${index + 1}"
                  >
                    <img src="${img}" alt="${product.name} - Imagen ${index + 1}" loading="lazy">
                  </button>
                `).join('')}
              </div>
            ` : ''}
          </div>

          <!-- Columna Derecha: Información del producto -->
          <div class="product-info">
            <h1 class="product-title">${product.name}</h1>
            
            <div class="product-price-section">
              <span class="product-price">${precio}</span>
              ${product.comparePrice ? `
                <span class="product-compare-price">${formatCOP(toNumber(product.comparePrice))}</span>
              ` : ''}
            </div>

            <!-- Badges de stock -->
            <div class="product-badges">
              ${!inStock ? '<span class="badge badge-out-of-stock">Agotado</span>' : ''}
              ${stockBajo ? `<span class="badge badge-low-stock">Últimas ${product.stock} unidades</span>` : ''}
            </div>

            <div class="product-description">
              <p>${product.description}</p>
            </div>

            ${inStock ? `
              <form id="add-to-cart-form" class="product-form">
                <div class="quantity-selector">
                  <label for="quantity">Cantidad:</label>
                  <div class="quantity-input">
                    <button type="button" id="decrease-qty" class="qty-btn" ${product.stock <= 1 ? 'disabled' : ''}>-</button>
                    <input 
                      type="number" 
                      id="quantity" 
                      name="quantity" 
                      min="1" 
                      max="${product.stock}" 
                      value="1" 
                      readonly
                    >
                    <button type="button" id="increase-qty" class="qty-btn" ${product.stock <= 1 ? 'disabled' : ''}>+</button>
                  </div>
                </div>

                <div class="product-actions">
                  <button type="submit" class="btn-primario btn-agregar" id="btn-agregar">
                    <span class="btn-text">Agregar al carrito</span>
                  </button>
                  <button type="button" class="btn-secundario btn-comprar-ahora" id="btn-comprar-ahora">
                    Comprar ahora
                  </button>
                </div>
              </form>
            ` : `
              <div class="out-of-stock-actions">
                <button class="btn-primario" disabled>Agotado</button>
                <p class="out-of-stock-text">Este producto está temporalmente agotado.</p>
              </div>
            `}

            <!-- Compartir en WhatsApp -->
            <div class="product-share">
              <a 
                href="https://wa.me/?text=${encodeURIComponent(`¡Mira este producto de Belle Désir: ${product.name}\n${window.location.href}`)}"
                target="_blank"
                rel="noopener noreferrer"
                class="whatsapp-share"
              >
                <span class="whatsapp-icon">WhatsApp</span>
                Compartir producto
              </a>
            </div>
          </div>
        </div>
      </div>
    </main>
  `;

  // Inicializar funcionalidades
  initGallery();
  initQuantitySelector(product.stock);
  initAddToCart(product);
  initBuyNow(product);
}

function initGallery(): void {
  const mainImage = document.getElementById('main-image') as HTMLImageElement;
  const thumbnails = document.querySelectorAll('.thumbnail-btn') as NodeListOf<HTMLButtonElement>;

  if (!mainImage || thumbnails.length === 0) return;

  thumbnails.forEach(thumb => {
    thumb.addEventListener('click', () => {
      const imageUrl = thumb.dataset.image;
      if (!imageUrl) return;

      // Actualizar imagen principal
      mainImage.src = imageUrl;

      // Actualizar estado activo
      thumbnails.forEach(t => t.classList.remove('active'));
      thumb.classList.add('active');
    });
  });
}

function initQuantitySelector(maxStock: number): void {
  const decreaseBtn = document.getElementById('decrease-qty') as HTMLButtonElement;
  const increaseBtn = document.getElementById('increase-qty') as HTMLButtonElement;
  const quantityInput = document.getElementById('quantity') as HTMLInputElement;

  if (!decreaseBtn || !increaseBtn || !quantityInput) return;

  decreaseBtn.addEventListener('click', () => {
    const current = parseInt(quantityInput.value);
    if (current > 1) {
      quantityInput.value = String(current - 1);
      updateQuantityButtons();
    }
  });

  increaseBtn.addEventListener('click', () => {
    const current = parseInt(quantityInput.value);
    if (current < maxStock) {
      quantityInput.value = String(current + 1);
      updateQuantityButtons();
    }
  });

  function updateQuantityButtons(): void {
    const current = parseInt(quantityInput.value);
    decreaseBtn.disabled = current <= 1;
    increaseBtn.disabled = current >= maxStock;
  }
}

function initAddToCart(product: Product): void {
  const form = document.getElementById('add-to-cart-form') as HTMLFormElement;
  if (!form) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const quantityInput = document.getElementById('quantity') as HTMLInputElement;
    const btn = document.getElementById('btn-agregar') as HTMLButtonElement;
    const btnText = btn.querySelector('.btn-text') as HTMLElement;
    
    const quantity = parseInt(quantityInput.value);
    
    // Deshabilitar botón y mostrar estado de carga
    btn.disabled = true;
    btnText.textContent = 'Agregando...';

    try {
      // Ejecutar animación fly-to-cart
      const cartIconEl = findCartIcon();
      if (cartIconEl) {
        flyToCart(btn, cartIconEl);
      }

      // Emitir evento para agregar al carrito
      emit('cart:add', {
        id: product.id,
        name: product.name,
        price: toNumber(product.price),
        image: product.images?.[0] || '',
        quantity: quantity,
      });

      // Feedback visual
      btnText.textContent = '¡Agregado!';
      btn.classList.add('success');
      
      setTimeout(() => {
        btnText.textContent = 'Agregar al carrito';
        btn.classList.remove('success');
        btn.disabled = false;
      }, 2000);

    } catch (error) {
      console.error('Error adding to cart:', error);
      btnText.textContent = 'Error';
      setTimeout(() => {
        btnText.textContent = 'Agregar al carrito';
        btn.disabled = false;
      }, 2000);
    }
  });
}

function initBuyNow(product: Product): void {
  const btn = document.getElementById('btn-comprar-ahora') as HTMLButtonElement;
  if (!btn) return;

  btn.addEventListener('click', async () => {
    const quantityInput = document.getElementById('quantity') as HTMLInputElement;
    const quantity = parseInt(quantityInput.value);

    try {
      // Agregar al carrito primero
      emit('cart:add', {
        id: product.id,
        name: product.name,
        price: toNumber(product.price),
        image: product.images?.[0] || '',
        quantity: quantity,
      });

      // Redirigir a checkout
      window.location.href = '/checkout';
      
    } catch (error) {
      console.error('Error in buy now:', error);
    }
  });
}

function renderNotFound(container: HTMLElement): void {
  container.innerHTML = /* html */ `
    <main class="not-found-page">
      <div class="not-found-container">
        <h1 class="not-found-title">Producto no encontrado</h1>
        <p class="not-found-text">El producto que buscas no existe o ha sido eliminado.</p>
        <a href="/" class="btn-primario">Volver a la tienda</a>
      </div>
    </main>
  `;
}

function renderError(container: HTMLElement): void {
  container.innerHTML = /* html */ `
    <main class="error-page">
      <div class="error-container">
        <h1 class="error-title">Error al cargar el producto</h1>
        <p class="error-text">Ha ocurrido un error. Por favor, intenta nuevamente.</p>
        <button onclick="location.reload()" class="btn-primario">Reintentar</button>
        <a href="/" class="btn-secundario">Volver a la tienda</a>
      </div>
    </main>
  `;
}
