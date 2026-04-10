import { initCatalogo } from './components/Catalog.js';
import { initCartSidebar } from './components/CartSidebar.js';
import { initNavbar } from './components/Navbar.js';
import { initSearch } from './components/Search.js';
import { initScrollAnimations } from './components/ScrollAnimations.js';
import { initCheckoutPage } from './pages/checkout.js';
import { initLoginPage } from './pages/login.js';
import { initRegisterPage } from './pages/Register.js';
import { initPedidoConfirmadoPage } from './pages/pedido-confirmado.js';
import { initProductDetailPage } from './pages/ProductDetail.js';
import { initOrderHistoryPage } from './pages/OrderHistory.js';
import { initOrderDetailPage } from './pages/OrderDetail.js';
import { initForgotPasswordPage } from './pages/ForgotPassword.js';
import { initResetPasswordPage } from './pages/ResetPassword.js';
import { isLoggedIn } from './services/authService.js';

export function initRouter(): void {
  const path = window.location.pathname.replace(/\/+$/, '') || '/';

  // Protected routes - redirect to login if not authenticated
  const protectedRoutes = ['/mis-pedidos', '/mis-pedidos/:id'];
  const isProtectedRoute = protectedRoutes.some(route => {
    if (route.includes(':id')) {
      return path.startsWith(route.split(':')[0]);
    }
    return path === route;
  });

  if (isProtectedRoute && !isLoggedIn()) {
    const currentPath = encodeURIComponent(window.location.pathname);
    window.location.href = `/login?redirect=${currentPath}`;
    return;
  }

  // Route handlers
  switch (path) {
    case '/checkout':
      void initCheckoutPage();
      return;

    case '/login':
      initLoginPage();
      return;

    case '/registro':
      initRegisterPage();
      return;

    case '/mis-pedidos':
      void initOrderHistoryPage();
      return;

    case '/olvide-mi-contrasena':
      initForgotPasswordPage();
      return;

    case '/pedido-confirmado':
      initPedidoConfirmadoPage();
      return;
  }

  // Dynamic routes with parameters
  if (path.startsWith('/producto/')) {
    void initProductDetailPage();
    return;
  }

  if (path.startsWith('/mis-pedidos/')) {
    void initOrderDetailPage();
    return;
  }

  if (path.startsWith('/restablecer-contrasena')) {
    void initResetPasswordPage();
    return;
  }

  // Default route - home page
  initNavbar();
  initSearch();
  initCartSidebar();
  void initCatalogo();
  initScrollAnimations();
}
