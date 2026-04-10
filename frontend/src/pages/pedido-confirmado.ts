const SOPORTE_WHATSAPP = '573159739914';

function limpiarCarritoLocal(): void {
  const keys = ['cart', 'carrito', 'cartItems', 'checkoutCart', 'belle_cart'];
  keys.forEach((key) => localStorage.removeItem(key));
}

export function initPedidoConfirmadoPage(): void {
  const container = document.getElementById('contenido-principal');
  if (!container) return;

  limpiarCarritoLocal();

  const params = new URLSearchParams(window.location.search);
  const transactionStatus = params.get('transactionStatus');
  const boldOrderId = params.get('bold-order-id');
  const fallbackOrderId = params.get('orderId');
  const reference = boldOrderId ?? fallbackOrderId ?? 'No disponible';
  const approved = transactionStatus === 'APPROVED';

  container.innerHTML = approved
    ? /* html */ `
      <main class="confirmacion-page">
        <section class="confirmacion-card">
          <div class="confirmacion-check">✓</div>
          <h1>¡Pedido confirmado!</h1>
          <p>Tu orden está siendo procesada. Recibirás una confirmación pronto.</p>
          <p class="confirmacion-ref">Número de referencia: <strong>${reference}</strong></p>
          <a href="/" class="btn-primario confirmacion-btn">Seguir comprando</a>
        </section>
      </main>
    `
    : /* html */ `
      <main class="confirmacion-page">
        <section class="confirmacion-card">
          <h1>Pago pendiente o no completado</h1>
          <p>Si realizaste el pago, espera unos minutos. Si tuviste problemas contáctanos.</p>
          <a href="https://wa.me/${SOPORTE_WHATSAPP}?text=Hola,%20tengo%20problemas%20con%20mi%20pago%20en%20Belle%20Desir" class="btn-primario confirmacion-btn" target="_blank" rel="noreferrer">
            Soporte por WhatsApp
          </a>
          <a href="/" class="btn-secundario confirmacion-btn">Volver al inicio</a>
        </section>
      </main>
    `;
}
