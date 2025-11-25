/**
 * API Client
 * Centralized HTTP client for backend API calls
 */

// --- API Base URL Resolver (works for all teammates) ---
const resolveApiBaseUrl = (): string => {
  const envA = (import.meta as any).env?.VITE_API_BASE_URL;
  const envB = (import.meta as any).env?.VITE_API_URL;
  const env = (envA ?? envB)?.toString().trim();

  if (env) {
    const trimmed = env.replace(/\/+$/, ''); // remove trailing slashes
    return trimmed.endsWith('/api') ? trimmed : `${trimmed}/api`;
  }

  // Default: relative /api for Vite proxy (dev) and same-origin reverse proxy (prod)
  return '/api';
};

const API_BASE_URL = resolveApiBaseUrl();

// Uncomment to debug the active API base
// console.log("API Base URL:", API_BASE_URL);

export interface ApiError {
  error: string;
  message?: string;
}

// --- Centralized API Client ---
class ApiClient {
  private baseURL: string;

  constructor(baseURL: string) {
    this.baseURL = baseURL;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const token = localStorage.getItem("token");

    // Normalize headers
    const headers = new Headers(options.headers || {});
    headers.set("Content-Type", "application/json");
    if (token) headers.set("Authorization", `Bearer ${token}`);

    // Ensure endpoint begins with /
    const url = `${this.baseURL}${endpoint.startsWith("/") ? endpoint : `/${endpoint}`}`;

    try {
      const response = await fetch(url, { ...options, headers });

      if (!response.ok) {
        const error: ApiError = await response.json().catch(() => ({
          error: `HTTP ${response.status}: ${response.statusText}`,
        }));
        throw new Error(error.error || error.message || "Request failed");
      }

      return response.json() as Promise<T>;
    } catch (err: any) {
      // Handle low-level fetch/network errors
      if (err instanceof TypeError && err.message.includes("fetch")) {
        console.error(`API Request failed to ${url}:`, err);
        throw new Error(
          `Network error: Unable to connect to the API at ${this.baseURL}. 
           Please check if the backend is running and CORS is configured correctly.`
        );
      }
      throw err;
    }
  }

  // --- CRUD helpers ---
  async get<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, { method: "GET" });
  }

  async post<T>(endpoint: string, data?: unknown): Promise<T> {
    return this.request<T>(endpoint, {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  async patch<T>(endpoint: string, data?: unknown): Promise<T> {
    return this.request<T>(endpoint, {
      method: "PATCH",
      body: JSON.stringify(data),
    });
  }

  async put<T>(endpoint: string, data?: unknown): Promise<T> {
    return this.request<T>(endpoint, {
      method: "PUT",
      body: JSON.stringify(data),
    });
  }

  async delete<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, { method: "DELETE" });
  }
}

// Shared export
export const apiClient = new ApiClient(API_BASE_URL);
