/**
 * API Client
 * Centralized HTTP client for backend API calls
 */

// For production, use relative URLs if same origin, otherwise use full URL with port
// In development, Vite proxy handles /api requests
const getApiBaseUrl = () => {
  const envUrl = import.meta.env.VITE_API_URL;
  if (envUrl) {
    // If it's a relative URL, use as-is
    if (envUrl.startsWith('/')) {
      return envUrl;
    }
    // Ensure it ends with /api
    return envUrl.endsWith('/api') ? envUrl : `${envUrl}/api`;
  }
  
  // In production (not localhost), construct URL with same hostname and port 3000
  if (typeof window !== 'undefined' && window.location.hostname !== 'localhost') {
    const hostname = window.location.hostname;
    const protocol = window.location.protocol;
    // Use port 3000 for backend API
    return `${protocol}//${hostname}:3000/api`;
  }
  
  // Default for local development
  return 'http://localhost:3000/api';
};

const API_BASE_URL = getApiBaseUrl();

// Log the API URL for debugging
console.log('API Base URL:', API_BASE_URL);

export interface ApiError {
  error: string;
  message?: string;
}

class ApiClient {
  private baseURL: string;

  constructor(baseURL: string) {
    this.baseURL = baseURL;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const token = localStorage.getItem('token');

    // Start from any existing headers and normalize to a Headers object
    const headers = new Headers(options.headers || {});

    // Always make sure we send JSON
    headers.set('Content-Type', 'application/json');

    // Add Authorization if we have a token
    if (token) {
      headers.set('Authorization', `Bearer ${token}`);
    }

    const url = `${this.baseURL}${endpoint}`;
    
    try {
      const response = await fetch(url, {
        ...options,
        headers,
      });

      if (!response.ok) {
        const error: ApiError = await response.json().catch(() => ({
          error: `HTTP ${response.status}: ${response.statusText}`,
        }));
        throw new Error(error.error || error.message || 'Request failed');
      }

      return response.json() as Promise<T>;
    } catch (err) {
      // Handle network errors (CORS, connection refused, etc.)
      if (err instanceof TypeError && err.message.includes('fetch')) {
        console.error(`API Request failed to ${url}:`, err);
        throw new Error(
          `Network error: Unable to connect to the API server at ${this.baseURL}. Please check if the backend is running and CORS is configured correctly.`
        );
      }
      throw err;
    }
  }


  async get<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, { method: 'GET' });
  }

  async post<T>(endpoint: string, data?: unknown): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async patch<T>(endpoint: string, data?: unknown): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  async put<T>(endpoint: string, data?: unknown): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async delete<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, { method: 'DELETE' });
  }
}

export const apiClient = new ApiClient(API_BASE_URL);

