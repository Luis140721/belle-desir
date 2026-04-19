import axios from 'axios';
import { 
  ApiResponse, 
  PaginatedResponse, 
  Product, 
  Category, 
  Order, 
  AdminStats, 
  OrderStatus 
} from '../types';
import { API_BASE_URL } from '../config/api';

const adminApi = axios.create({
  baseURL: API_BASE_URL ? `${API_BASE_URL}/api` : '/api',
});

// Request Interceptor
adminApi.interceptors.request.use((config) => {
  const token = localStorage.getItem('belle_admin_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response Interceptor for error handling
adminApi.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('belle_admin_token');
      // Only redirect if not already on login page
      if (!window.location.pathname.includes('/admin/login')) {
        window.location.href = '/admin/login';
      }
    }
    
    // Extract message from response based on backend structure
    const message = error.response?.data?.message || 'Algo salió mal';
    return Promise.reject(new Error(message));
  }
);

export const authApi = {
  login: async (email: string, password: string): Promise<any> => {
    const { data } = await adminApi.post('/auth/login', { email, password });
    return data.data; // { accessToken, refreshToken, user }
  },
  me: async (): Promise<any> => {
    const { data } = await adminApi.get('/auth/me');
    return data.data;
  },
  logout: async (): Promise<void> => {
    await adminApi.post('/auth/logout');
  },
};

export const productsApi = {
  getAll: async (params: any): Promise<PaginatedResponse<Product>> => {
    const { data } = await adminApi.get('/products', { params });
    return data;
  },
  getById: async (id: string): Promise<ApiResponse<Product>> => {
    const { data } = await adminApi.get(`/products/id/${id}`);
    return data;
  },
  create: async (payload: any): Promise<ApiResponse<Product>> => {
    const { data } = await adminApi.post('/products', payload);
    return data;
  },
  update: async (id: string, payload: any): Promise<ApiResponse<Product>> => {
    const { data } = await adminApi.put(`/products/${id}`, payload);
    return data;
  },
  delete: async (id: string): Promise<ApiResponse<{ message: string }>> => {
    const { data } = await adminApi.delete(`/products/${id}`);
    return data;
  },
  uploadImages: async (id: string, formData: FormData): Promise<ApiResponse<Product>> => {
    const { data } = await adminApi.post(`/products/${id}/images`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return data;
  },
  removeImage: async (id: string, imageUrl: string): Promise<ApiResponse<Product>> => {
    const { data } = await adminApi.delete(`/products/${id}/images`, { data: { imageUrl } });
    return data;
  },
};

export const categoriesApi = {
  getAll: async (): Promise<ApiResponse<Category[]>> => {
    const { data } = await adminApi.get('/categories');
    return data;
  },
  create: async (payload: any): Promise<ApiResponse<Category>> => {
    const { data } = await adminApi.post('/categories', payload);
    return data;
  },
  update: async (id: number, payload: any): Promise<ApiResponse<Category>> => {
    const { data } = await adminApi.put(`/categories/${id}`, payload);
    return data;
  },
  delete: async (id: number): Promise<ApiResponse<{ message: string }>> => {
    const { data } = await adminApi.delete(`/categories/${id}`);
    return data;
  },
};

export const ordersApi = {
  getAll: async (params: any): Promise<PaginatedResponse<Order>> => {
    const { data } = await adminApi.get('/admin/orders', { params });
    return data;
  },
  getById: async (id: string): Promise<ApiResponse<Order>> => {
    const { data } = await adminApi.get(`/orders/${id}`);
    return data;
  },
  updateStatus: async (id: string, status: OrderStatus): Promise<ApiResponse<Order>> => {
    const { data } = await adminApi.patch(`/admin/orders/${id}/status`, { status });
    return data;
  },
};

export const dashboardApi = {
  getStats: async (): Promise<ApiResponse<AdminStats>> => {
    const { data } = await adminApi.get('/admin/stats');
    return data;
  },
};

export default adminApi;
