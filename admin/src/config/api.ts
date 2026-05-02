// API Configuration for Belle Desir Admin Panel
// Vercel injects VITE_API_URL at build time. Local dev falls back to port 3001.

export const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

// Helper function to build API URLs
export function buildApiUrl(endpoint: string): string {
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint.slice(1) : endpoint;

  // Always use a full backend URL so browser requests are predictable.
  return `${API_BASE_URL}/api/${cleanEndpoint}`;
}

export default API_BASE_URL;
