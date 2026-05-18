// API Configuration for Belle Desir Frontend
// Vercel injects VITE_API_URL at build time. Local dev falls back to port 3001.

export const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';
export const MEDIA_BASE_URL = import.meta.env.VITE_MEDIA_BASE_URL || API_BASE_URL;

// Helper function to build API URLs
export function buildApiUrl(endpoint: string): string {
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint.slice(1) : endpoint;

  // Always use a full backend URL so browser requests are predictable.
  return `${API_BASE_URL}/api/${cleanEndpoint}`;
}

export function buildMediaUrl(url: string | null | undefined): string {
  if (!url) return '';

  if (/^(https?:)?\/\//i.test(url) || url.startsWith('data:') || url.startsWith('blob:')) {
    return url;
  }

  const cleanBase = MEDIA_BASE_URL.replace(/\/+$/, '');
  const cleanPath = url.startsWith('/') ? url : `/${url}`;

  return `${cleanBase}${cleanPath}`;
}

export default API_BASE_URL;
