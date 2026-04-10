import { initCatalogo } from './components/Catalog.js';
import { initCartSidebar } from './components/CartSidebar.js';
import { initNavbar } from './components/Navbar.js';
import { initScrollAnimations } from './components/ScrollAnimations.js';
import { initCheckoutPage } from './pages/checkout.js';
import { initLoginPage } from './pages/login.js';
import { initPedidoConfirmadoPage } from './pages/pedido-confirmado.js';

export function initRouter(): void {
  const path = window.location.pathname.replace(/\/+$/, '') || '/';

  if (path === '/checkout') {
    void initCheckoutPage();
    return;
  }

  if (path === '/login') {
    initLoginPage();
    return;
  }

  if (path === '/pedido-confirmado') {
    initPedidoConfirmadoPage();
    return;
  }

  initNavbar();
  initCartSidebar();
  void initCatalogo();
  initScrollAnimations();
}
