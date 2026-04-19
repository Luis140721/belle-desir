// API Configuration for Belle Désir Frontend
// Uses VITE_API_URL in production, falls back to proxy in development

export const API_BASE_URL = import.meta.env.VITE_API_URL || '';

// Helper function to build API URLs
export function buildApiUrl(endpoint: string): string {
  // Remove leading slash if present
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint.slice(1) : endpoint;
  
  if (API_BASE_URL) {
    // Production: use full URL from environment variable
    return `${API_BASE_URL}/api/${cleanEndpoint}`;
  } else {
    // Development: use proxy (relative URL)
    return `/api/${cleanEndpoint}`;
  }
}

// Export the base URL for direct use if needed
export default API_BASE_URL;
