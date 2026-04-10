// ============================================================
// CART ANIMATION UTILITY
// Implementa la animación "fly to cart" cuando se agrega un producto
// ============================================================

/**
 * Anima un elemento (botón o imagen) hacia el ícono del carrito
 * @param sourceEl - Elemento de origen (botón o imagen) a animar
 * @param cartIconEl - Elemento del ícono del carrito (destino)
 */
export function flyToCart(
  sourceEl: HTMLElement,
  cartIconEl: HTMLElement
): void {
  if (!sourceEl || !cartIconEl) {
    console.warn('[CartAnimation] Elementos no encontrados para la animación');
    return;
  }

  // 1. Crear un elemento visual para la animación
  const clone = document.createElement('div');
  
  // 2. Configurar el clon
  clone.style.position = 'fixed';
  clone.style.pointerEvents = 'none';
  clone.style.zIndex = '9999';
  clone.style.transition = 'all 0.8s cubic-bezier(.55,-0.04,.91,.94)';
  clone.style.willChange = 'transform, opacity, scale';
  
  // 3. Estilo visual del clon (círculo con gradiente como el botón)
  clone.style.width = '40px';
  clone.style.height = '40px';
  clone.style.borderRadius = '8px';
  clone.style.background = 'linear-gradient(135deg, var(--violeta-premium), var(--morado-oscuro))';
  clone.style.boxShadow = '0 4px 12px rgba(91, 42, 134, 0.4)';
  clone.style.display = 'flex';
  clone.style.alignItems = 'center';
  clone.style.justifyContent = 'center';
  clone.style.color = 'var(--champana)';
  clone.style.fontSize = '1.2rem';
  clone.style.fontWeight = '600';
  clone.textContent = '+';
  
  // 4. Obtener coordenadas exactas
  const sourceRect = sourceEl.getBoundingClientRect();
  const cartRect = cartIconEl.getBoundingClientRect();
  
  // 5. Posicionar el clon en las coordenadas exactas del botón
  clone.style.left = `${sourceRect.left + sourceRect.width / 2 - 20}px`; // Centrar el clon de 40px
  clone.style.top = `${sourceRect.top + sourceRect.height / 2 - 20}px`;
  
  // 6. Agregar el clon al DOM
  document.body.appendChild(clone);
  
  // 7. Forzar reflow para asegurar que los estilos iniciales se apliquen
  void clone.offsetHeight;
  
  // 8. Animar hacia las coordenadas del carrito con reducción de tamaño
  const deltaX = cartRect.left + cartRect.width / 2 - (sourceRect.left + sourceRect.width / 2);
  const deltaY = cartRect.top + cartRect.height / 2 - (sourceRect.top + sourceRect.height / 2);
  
  clone.style.transform = `translate(${deltaX}px, ${deltaY}px) scale(0)`;
  clone.style.opacity = '0';
  
  // 9. Efecto bump/shake en el ícono del carrito
  setTimeout(() => {
    cartIconEl.classList.add('cart-bump');
    setTimeout(() => {
      cartIconEl.classList.remove('cart-bump');
    }, 300);
  }, 600); // Tiempo calculado para que coincida con la llegada del clon
  
  // 10. Eliminar el clon del DOM al terminar la transición
  const handleTransitionEnd = (e: TransitionEvent) => {
    if (e.target === clone) {
      clone.removeEventListener('transitionend', handleTransitionEnd);
      clone.remove();
    }
  };
  
  clone.addEventListener('transitionend', handleTransitionEnd);
  
  // Fallback por si transitionend no se dispara
  setTimeout(() => {
    if (clone.parentNode) {
      clone.remove();
    }
  }, 1000);
}

/**
 * Encuentra el ícono del carrito en el navbar
 * @returns Elemento del ícono del carrito o null si no se encuentra
 */
export function findCartIcon(): HTMLElement | null {
  return document.querySelector('.navbar-carrito') as HTMLElement | null;
}

/**
 * Encuentra la imagen de un producto dentro de una tarjeta
 * @param productCard - Elemento de la tarjeta de producto
 * @returns Elemento de imagen o null si no se encuentra
 */
export function findProductImage(productCard: HTMLElement): HTMLElement | null {
  return productCard.querySelector('.producto-card-imagen img, .producto-card-imagen') as HTMLElement | null;
}
