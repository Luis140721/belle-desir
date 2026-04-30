import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { ToastProvider } from './components/ui/Toast';
import { AdminGuard } from './guards/AdminGuard';
import { AdminLayout } from './components/layout/AdminLayout';
import { Login } from './pages/Login';
import { Dashboard } from './pages/Dashboard';
import { ProductsList } from './pages/products/ProductsList';
import { ProductForm } from './pages/products/ProductForm';
import { OrdersList } from './pages/orders/OrdersList';
import { OrderDetail } from './pages/orders/OrderDetail';
import { CategoriesList } from './pages/categories/CategoriesList';

function App() {
  return (
    <BrowserRouter>
      <ToastProvider>
        <AuthProvider>
          <Routes>
            {/* Public Auth Route */}
            <Route path="/admin/login" element={<Login />} />

            {/* Protected Admin Routes */}
            <Route path="/admin" element={<AdminGuard />}>
              <Route element={<AdminLayout />}>
                <Route index element={<Navigate to="/admin/dashboard" replace />} />
                <Route path="dashboard" element={<Dashboard />} />
                
                {/* Products */}
                <Route path="products" element={<ProductsList />} />
                <Route path="products/new" element={<ProductForm mode="create" />} />
                <Route path="products/:id" element={<ProductForm mode="edit" />} />
                
                {/* Orders */}
                <Route path="orders" element={<OrdersList />} />
                <Route path="orders/:id" element={<OrderDetail />} />
                
                {/* Categories */}
                <Route path="categories" element={<CategoriesList />} />
              </Route>
            </Route>

            {/* Root Redirect */}
            <Route path="/" element={<Navigate to="/admin/dashboard" replace />} />
            
            {/* Fallback */}
            <Route path="*" element={<Navigate to="/admin/dashboard" replace />} />
          </Routes>
        </AuthProvider>
      </ToastProvider>
    </BrowserRouter>
  );
}

export default App;
