// API Configuration for Belle Désir Admin Panel
// Always uses VITE_API_URL for backend API calls

export const API_BASE_URL = import.meta.env.VITE_API_URL;

// Helper function to build API URLs
export function buildApiUrl(endpoint: string): string {
  // Remove leading slash if present
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint.slice(1) : endpoint;
  
  // Always use full URL from environment variable
  return `${API_BASE_URL}/api/${cleanEndpoint}`;
}

// Export the base URL for direct use if needed
export default API_BASE_URL;
