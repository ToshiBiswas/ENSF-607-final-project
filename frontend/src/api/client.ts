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
    const trimmed = env.replace(/\/+$/, ""); // remove trailing slashes
    return trimmed.endsWith("/api") ? trimmed : `${trimmed}/api`;
  }

  // Fallback for local dev
  return "http://localhost:3000/api";
};

export const API_BASE_URL = resolveApiBaseUrl();

type HttpMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

class ApiClient {
  private baseUrl: string;
  private isRefreshing = false;
  private refreshPromise: Promise<string | null> | null = null;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl.replace(/\/+$/, "");
  }

  // ---- token helpers (always read/write localStorage) ----
  private getAccessToken(): string | null {
    try {
      return localStorage.getItem("token");
    } catch {
      return null;
    }
  }

  private setAccessToken(token: string | null) {
    try {
      if (token) {
        localStorage.setItem("token", token);
      } else {
        localStorage.removeItem("token");
      }
    } catch {
      // ignore storage errors
    }
  }

  private buildUrl(endpoint: string): string {
    if (endpoint.startsWith("http://") || endpoint.startsWith("https://")) {
      return endpoint;
    }
    // endpoint usually looks like "/auth/login" or "/users/me"
    return `${this.baseUrl}${endpoint.startsWith("/") ? "" : "/"}${endpoint}`;
  }

  private buildHeaders(extra?: HeadersInit): HeadersInit {
    const headers: HeadersInit = {
      "Content-Type": "application/json",
      ...(extra || {}),
    };

    const token = this.getAccessToken();
    if (token) {
      (headers as any).Authorization = `Bearer ${token}`;
    }

    return headers;
  }

  // ---- refresh logic (called on 401) ----
  private async refreshToken(): Promise<string | null> {
    // if another request is already refreshing, wait for that one
    if (this.isRefreshing && this.refreshPromise) {
      return this.refreshPromise;
    }

    this.isRefreshing = true;
    this.refreshPromise = (async () => {
      try {
        const res = await fetch(this.buildUrl("/auth/refresh"), {
          method: "POST",
          credentials: "include", // send refresh cookie
        });

        if (!res.ok) {
          console.error("Refresh token request failed with", res.status);
          this.setAccessToken(null);
          return null;
        }

        const data = (await res.json()) as { accessToken: string };
        if (!data?.accessToken) {
          console.error("No accessToken in refresh response");
          this.setAccessToken(null);
          return null;
        }

        this.setAccessToken(data.accessToken);
        return data.accessToken;
      } catch (err) {
        console.error("Refresh token request error:", err);
        this.setAccessToken(null);
        return null;
      } finally {
        this.isRefreshing = false;
        this.refreshPromise = null;
      }
    })();

    return this.refreshPromise;
  }

  // ---- core request wrapper ----
  private async rawRequest<T>(
    endpoint: string,
    init: RequestInit,
    allowRetry: boolean
  ): Promise<T> {
    const url = this.buildUrl(endpoint);
    const response = await fetch(url, init);

    // Handle 401: try once to refresh and retry the original request
    if (
      response.status === 401 &&
      allowRetry &&
      !endpoint.startsWith("/auth/login") &&
      !endpoint.startsWith("/auth/register") &&
      !endpoint.startsWith("/auth/refresh")
    ) {
      const newToken = await this.refreshToken();

      if (!newToken) {
        // refresh failed → treat as unauthenticated
        throw Object.assign(new Error("Unauthorized"), { status: 401 });
      }

      // retry original request with fresh token
      const retryInit: RequestInit = {
        ...init,
        headers: this.buildHeaders(init.headers),
      };

      const retryRes = await fetch(url, retryInit);

      if (!retryRes.ok) {
        let message = `Request failed with status ${retryRes.status}`;
        try {
          const errBody = await retryRes.json();
          message = errBody?.message ?? message;
          throw Object.assign(new Error(message), {
            status: retryRes.status,
            data: errBody,
          });
        } catch {
          throw Object.assign(new Error(message), { status: retryRes.status });
        }
      }

      if (retryRes.status === 204) {
        // no content
        return undefined as unknown as T;
      }

      return (await retryRes.json()) as T;
    }

    // Non-401 or no retry
    if (!response.ok) {
      let message = `Request failed with status ${response.status}`;
      try {
        const errBody = await response.json();
        message = errBody?.message ?? message;
        throw Object.assign(new Error(message), {
          status: response.status,
          data: errBody,
        });
      } catch {
        throw Object.assign(new Error(message), { status: response.status });
      }
    }

    if (response.status === 204) {
      return undefined as unknown as T;
    }

    return (await response.json()) as T;
  }

  // ---- public methods ----
  async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const init: RequestInit = {
      credentials: "include", // always send cookies (needed for refresh)
      ...options,
      headers: this.buildHeaders(options.headers),
    };

    return this.rawRequest<T>(endpoint, init, true);
  }

  async get<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, { method: "GET" });
  }

  async post<T>(endpoint: string, data?: unknown): Promise<T> {
    return this.request<T>(endpoint, {
      method: "POST",
      body: data !== undefined ? JSON.stringify(data) : undefined,
    });
  }

  async patch<T>(endpoint: string, data?: unknown): Promise<T> {
    return this.request<T>(endpoint, {
      method: "PATCH",
      body: data !== undefined ? JSON.stringify(data) : undefined,
    });
  }

  async put<T>(endpoint: string, data?: unknown): Promise<T> {
    return this.request<T>(endpoint, {
      method: "PUT",
      body: data !== undefined ? JSON.stringify(data) : undefined,
    });
  }

  async delete<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, { method: "DELETE" });
  }
}

// Shared export
export const apiClient = new ApiClient(API_BASE_URL);
