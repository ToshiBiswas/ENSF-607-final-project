// src/api/auth.ts
import { apiClient } from './client';

export interface User {
  userId: number;
  name: string;
  email: string;
  // add any other fields your backend returns
  role?: string;          

  preferences?: {
    location?: string | null;
    preferredCategory?: string | null;
  };
  createdAt?: string; 
}

interface AuthResponse {
  accessToken: string;
  user: User;
}

interface LoginPayload {
  email: string;
  password: string;
}

interface RegisterPayload {
  name: string;
  email: string;
  password: string;
}

async function login(payload: LoginPayload): Promise<AuthResponse> {
  return apiClient.post<AuthResponse>('/auth/login', payload);
}

async function register(payload: RegisterPayload): Promise<AuthResponse> {
  return apiClient.post<AuthResponse>('/auth/register', payload);
}

/**
 * Refresh access token.
 * Refresh token is stored in an HttpOnly cookie — we do NOT send it from JS.
 * The `_refreshToken` param is kept only for backwards compatibility and ignored.
 */
async function refresh(_refreshToken?: string): Promise<AuthResponse> {
  return apiClient.post<AuthResponse>('/auth/refresh');
}

/**
 * Logout and clear refresh cookie on backend.
 * `_refreshToken` is ignored; cookie handles it.
 */
async function logout(_refreshToken?: string): Promise<void> {
  await apiClient.post('/auth/logout');
}

export const authApi = {
  login,
  register,
  refresh,
  logout,
};

export type { AuthResponse };
